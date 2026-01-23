import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { CheckCircleIcon, AlertTriangleIcon, SparklesIcon, HistoryIcon, ChevronRightIcon, SearchIcon, TrashIcon, SettingsIcon, FilePlusIcon, Volume2Icon, StopIcon, CopyIcon, RefreshCwIcon, SaveIcon, FilterIcon } from './components/icons';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SettingsModal } from './components/SettingsModal';
import { dbHelper } from './lib/db';
import { loadSettings } from './lib/storage';
import { AIAnalysisResult, HighlightRange, HistoryItem, RegexRule, UsagePreset } from './types';
import { DEFAULT_REGEX_RULES, DEFAULT_USAGE_PRESETS, DEFAULT_BASE_PROMPT } from './constants';

export const App = () => {
  const [text, setText] = useState('');
  const [highlightRanges, setHighlightRanges] = useState<HighlightRange[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'realtime' | 'ai'>('realtime');
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [regexRules, setRegexRules] = useState<RegexRule[]>(DEFAULT_REGEX_RULES);
  const [usagePresets, setUsagePresets] = useState<UsagePreset[]>(DEFAULT_USAGE_PRESETS);
  const [baseSystemPrompt, setBaseSystemPrompt] = useState<string>(DEFAULT_BASE_PROMPT);
  const [selectedUsageId, setSelectedUsageId] = useState<string>('general');
  const [ttsVoiceURI, setTtsVoiceURI] = useState<string>('');

  // History Filter/Fold State
  const [filterUsageId, setFilterUsageId] = useState<string>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Confirm Modal State
  const [confirmState, setConfirmState] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
      isDestructive: boolean;
  }>({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      isDestructive: false
  });

  // Refs for Scroll Sync & Auto Save
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSavedTextRef = useRef<string>('');

  // TTS State
  const [playingSource, setPlayingSource] = useState<'editor' | 'ai' | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load history and settings on mount
  useEffect(() => {
    loadHistory();
    const settings = loadSettings();
    setRegexRules(settings.regexRules);
    setUsagePresets(settings.usagePresets);
    if (settings.baseSystemPrompt) {
        setBaseSystemPrompt(settings.baseSystemPrompt);
    }
    if (settings.ttsVoiceURI) {
        setTtsVoiceURI(settings.ttsVoiceURI);
    }
    // Ensure selectedUsageId is valid
    if (settings.usagePresets.length > 0 && !settings.usagePresets.find((p: UsagePreset) => p.id === selectedUsageId)) {
        setSelectedUsageId(settings.usagePresets[0].id);
    }

    // Load voices
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // --- Confirm Helper ---
  const requestConfirm = (title: string, message: string, onConfirm: () => void, isDestructive: boolean = false) => {
      setConfirmState({
          isOpen: true,
          title,
          message,
          onConfirm,
          isDestructive
      });
  };

  const closeConfirm = () => {
      setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  // --- Auto Save Logic ---
  useEffect(() => {
    const timer = setTimeout(async () => {
        const trimmedText = text.trim();
        if (trimmedText && trimmedText !== lastSavedTextRef.current) {
            await dbHelper.add({
                text: text,
                timestamp: Date.now(),
                usageId: selectedUsageId,
                isAutoSave: true
            });
            lastSavedTextRef.current = text;
            loadHistory();
            console.log('Auto-saved draft');
        }
    }, 3000); // 3 seconds idle

    return () => clearTimeout(timer);
  }, [text, selectedUsageId]);

  // --- Highlight Logic (Regex + AI) ---
  useEffect(() => {
    if (!text) {
      setHighlightRanges([]);
      return;
    }

    const ranges: HighlightRange[] = [];

    // 1. Regex Highlights (Real-time)
    regexRules.forEach(rule => {
      if (rule.enabled) {
        try {
            const pattern = new RegExp(rule.patternStr, 'g');
            let match;
            while ((match = pattern.exec(text)) !== null) {
                ranges.push({ 
                    start: match.index,
                    end: match.index + match[0].length,
                    type: rule.level === 'warning' ? 'regex_warning' : 'regex_info',
                    message: rule.name
                });
            }
        } catch (e) {
            console.warn(`Invalid regex pattern: ${rule.patternStr}`);
        }
      }
    });

    // 2. AI Highlights (Static)
    if (aiResult) {
        aiResult.critiques.forEach(critique => {
            const phrase = critique.original_text;
            if (!phrase) return;
            
            // Safety: Skip high-lighting if the phrase is too long compared to the text (e.g. > 80%)
            // This prevents highlighting the entire text if AI quotes everything.
            if (text.length > 0 && phrase.length / text.length > 0.8) {
                return;
            }

            // Find all occurrences of the phrase
            let startIndex = 0;
            let index;
            while ((index = text.indexOf(phrase, startIndex)) > -1) {
                ranges.push({
                    start: index,
                    end: index + phrase.length,
                    type: 'ai_critique',
                    message: critique.suggestion
                });
                startIndex = index + phrase.length;
            }
        });
    }

    setHighlightRanges(ranges);
  }, [text, regexRules, aiResult]);

  const loadHistory = async () => {
    try {
      const items = await dbHelper.getAll();
      setHistory(items);
      if(items.length > 0 && items[0].isAutoSave) {
          lastSavedTextRef.current = items[0].text;
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    requestConfirm(
        '履歴を削除', 
        'この履歴を削除しますか？\n元に戻すことはできません。', 
        async () => {
            await dbHelper.delete(id);
            loadHistory();
        },
        true
    );
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setText(item.text);
    lastSavedTextRef.current = item.text; // Prevent immediate auto-save on restore
    
    setAiResult(item.aiResult || null);
    
    if (item.usageId) {
        if (usagePresets.find(p => p.id === item.usageId)) {
            setSelectedUsageId(item.usageId);
        }
    }

    if (item.aiResult) {
      setActiveTab('ai');
    } else {
      setActiveTab('realtime');
    }
    
    if (window.innerWidth < 768) setShowHistory(false);
  };

  const runAiCheck = async () => {
    if (!text.trim()) return;
    
    setIsAiLoading(true);
    setActiveTab('ai');
    setAiResult(null);

    const selectedUsage = usagePresets.find(p => p.id === selectedUsageId) || usagePresets[0];

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
      ${baseSystemPrompt}
      
      【現在のチェック用途・コンテキスト】
      ${selectedUsage.name}
      
      【追加の指示・評価基準】
      ${selectedUsage.prompt}
      
      以下のJSONスキーマに従って出力してください。
      改善された文章 (improved_text) は、元の意味を保ちつつ、最もプロフェッショナルで洗練された形に書き換えてください。
      
      【重要】critiques（指摘事項）の作成について：
      - original_text には、問題がある箇所の「正確な部分文字列」のみを引用してください。
      - 文章全体を引用しないでください。あくまで修正が必要な「単語」や「フレーズ」だけを抜き出してください。
      - 該当箇所が特定できない場合は、original_textを空にするか、その指摘を含めないでください。

      対象文章:
      ${text}
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    critiques: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                original_text: { type: Type.STRING },
                                suggestion: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            }
                        }
                    },
                    improved_text: { type: Type.STRING },
                    summary: { type: Type.STRING, description: "全体的な評価とアドバイスの要約" }
                }
            }
        }
      });

      const responseText = result.text;
      if (responseText) {
        const parsedResult = JSON.parse(responseText) as AIAnalysisResult;
        setAiResult(parsedResult);
        
        // Save manual check result
        await dbHelper.add({
            text: text,
            timestamp: Date.now(),
            usageId: selectedUsageId,
            aiResult: parsedResult,
            isAutoSave: false
        });
        lastSavedTextRef.current = text;
        loadHistory();
      }
    } catch (error) {
      console.error("AI Check failed:", error);
      alert("AIチェック中にエラーが発生しました。");
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- New Actions ---
  const handleNewDocument = () => {
      if (!text) {
          // No text, just clear everything immediately
          setText('');
          setAiResult(null);
          setHighlightRanges([]);
          return;
      }
      
      requestConfirm(
          '新規作成', 
          '現在の文章は消去されます。\n自動保存されていない内容は失われますが、よろしいですか？', 
          () => {
            setText('');
            setAiResult(null);
            setHighlightRanges([]);
          },
          true
      );
  };

  const handleReplaceText = () => {
      if (!aiResult) return;
      requestConfirm(
          '修正案を適用',
          '現在の文章を、AIの修正案で完全に置き換えますか？\nこの操作は元に戻せません。',
          () => {
              setText(aiResult.improved_text);
          },
          true // Destructive because it replaces content
      );
  };

  // --- TTS ---
  const handleSpeak = (textToSpeak: string, source: 'editor' | 'ai') => {
      if (playingSource) {
          window.speechSynthesis.cancel();
          if (playingSource === source) {
              setPlayingSource(null);
              return;
          }
      }

      if (!textToSpeak) return;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ja-JP';
      if (ttsVoiceURI) {
          const voice = availableVoices.find(v => v.voiceURI === ttsVoiceURI);
          if (voice) utterance.voice = voice;
      }
      utterance.onend = () => setPlayingSource(null);
      utterance.onerror = () => setPlayingSource(null);
      
      setPlayingSource(source);
      window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
      window.speechSynthesis.cancel();
      setPlayingSource(null);
  };


  // Filter history
  const filteredHistory = history.filter(item => {
      const matchesSearch = item.text.includes(searchTerm) || (item.aiResult && item.aiResult.summary.includes(searchTerm));
      const matchesFilter = filterUsageId === 'all' || item.usageId === filterUsageId;
      return matchesSearch && matchesFilter;
  });

  // Group history by usage
  const groupedHistory = useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {};
    
    filteredHistory.forEach(item => {
        const uid = item.usageId || 'unknown';
        if (!groups[uid]) {
            groups[uid] = [];
        }
        groups[uid].push(item);
    });

    // Create array for rendering, sorting groups by latest item
    const groupArray = Object.keys(groups).map(uid => {
        const preset = usagePresets.find(p => p.id === uid);
        const name = preset ? preset.name : 'その他・削除済み';
        return {
            id: uid,
            name,
            items: groups[uid],
            latest: Math.max(...groups[uid].map(i => i.timestamp))
        };
    });

    return groupArray.sort((a, b) => b.latest - a.latest);
  }, [filteredHistory, usagePresets]);

  const toggleGroup = (groupId: string) => {
      setCollapsedGroups(prev => ({
          ...prev,
          [groupId]: !prev[groupId]
      }));
  };

  // Scroll Sync Handler
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
        backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Render Highlights with Interval Split Logic
  const highlightedText = useMemo(() => {
    if (!text || highlightRanges.length === 0) return text;

    // 1. Collect all boundaries (start and end points)
    const boundaries = new Set<number>();
    boundaries.add(0);
    boundaries.add(text.length);
    highlightRanges.forEach(r => {
        boundaries.add(Math.max(0, Math.min(r.start, text.length)));
        boundaries.add(Math.max(0, Math.min(r.end, text.length)));
    });

    // 2. Sort boundaries
    const sortedPoints = Array.from(boundaries).sort((a, b) => a - b);

    // 3. Build segments
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const start = sortedPoints[i];
        const end = sortedPoints[i+1];
        const segmentText = text.slice(start, end);

        if (!segmentText) continue;

        // Find all ranges active in this segment
        const activeRanges = highlightRanges.filter(r => r.start <= start && r.end >= end);
        
        if (activeRanges.length === 0) {
            elements.push(segmentText);
        } else {
            // Priority: AI Critique > Regex Warning > Regex Info
            const hasAi = activeRanges.some(r => r.type === 'ai_critique');
            const hasWarning = activeRanges.some(r => r.type === 'regex_warning');
            
            let bgClass = 'bg-blue-200/50'; // Default info
            if (hasAi) {
                bgClass = 'bg-red-200/60';
                if (hasWarning) bgClass = 'bg-red-300/60 ring-1 ring-red-400/50'; // Warning + AI
            } else if (hasWarning) {
                bgClass = 'bg-amber-200/50';
            }

            elements.push(
                <span key={`${start}-${end}`} className={`${bgClass} rounded-sm`}>
                    {segmentText}
                </span>
            );
        }
    }
    
    if (text.endsWith('\n')) {
        elements.push(<br key="br"/>);
    }

    return elements;
  }, [text, highlightRanges]);

  return (
    <div className="flex h-full flex-col md:flex-row">
      <ConfirmationModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onClose={closeConfirm}
        isDestructive={confirmState.isDestructive}
      />

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        rules={regexRules}
        setRules={setRegexRules}
        presets={usagePresets}
        setPresets={setUsagePresets}
        basePrompt={baseSystemPrompt}
        setBasePrompt={setBaseSystemPrompt}
        ttsVoiceURI={ttsVoiceURI}
        setTtsVoiceURI={setTtsVoiceURI}
        availableVoices={availableVoices}
        requestConfirm={requestConfirm}
      />

      {/* Sidebar - History */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${showHistory ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <HistoryIcon className="w-5 h-5" /> 履歴
          </h2>
          <button onClick={() => setShowHistory(false)} className="md:hidden text-slate-400">✕</button>
        </div>
        <div className="p-3 bg-slate-50 border-b border-slate-100 space-y-3">
            {/* Search */}
            <div className="relative">
                <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="履歴を検索..." 
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {/* Usage Filter */}
            <div className="relative">
                <FilterIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <select
                    value={filterUsageId}
                    onChange={(e) => setFilterUsageId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-slate-600"
                >
                    <option value="all">すべての用途</option>
                    {usagePresets.map(preset => (
                        <option key={preset.id} value={preset.id}>{preset.name}</option>
                    ))}
                </select>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {groupedHistory.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-4">履歴はありません</p>
            ) : (
                groupedHistory.map(group => (
                    <div key={group.id} className="mb-2">
                        <div 
                            onClick={() => toggleGroup(group.id)}
                            className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100/80 hover:bg-slate-200 rounded-md border border-slate-200 cursor-pointer flex justify-between items-center transition-colors select-none"
                        >
                            <span className="flex items-center gap-1.5">
                                <ChevronRightIcon 
                                    style={{ transform: collapsedGroups[group.id] ? 'rotate(0deg)' : 'rotate(90deg)' }}
                                    className="w-3.5 h-3.5 transition-transform duration-200"
                                />
                                {group.name}
                            </span>
                            <span className="bg-white text-slate-500 rounded-full px-2 py-0.5 text-[10px] shadow-sm">{group.items.length}</span>
                        </div>
                        
                        {!collapsedGroups[group.id] && (
                            <div className="space-y-2 p-1 pt-2">
                                {group.items.map(item => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => handleSelectHistory(item)}
                                        className={`group relative p-3 rounded-lg border cursor-pointer transition-all ${
                                            item.isAutoSave 
                                            ? 'bg-slate-50/50 border-dashed border-slate-300 hover:bg-white hover:border-slate-400' 
                                            : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                                        }`}
                                    >
                                        <div className="text-xs text-slate-400 mb-1 flex justify-between items-center">
                                            <span>{new Date(item.timestamp).toLocaleString('ja-JP')}</span>
                                            {item.isAutoSave && (
                                                <span className="flex items-center gap-1 text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
                                                    <SaveIcon className="w-3 h-3" /> Auto
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-700 font-medium line-clamp-2 mb-1">
                                            {item.text}
                                        </div>
                                        {item.aiResult && !item.isAutoSave && (
                                            <div className="flex items-center gap-1 text-xs text-emerald-600">
                                                <SparklesIcon className="w-3 h-3" /> AIチェック済
                                            </div>
                                        )}
                                        <button 
                                            onClick={(e) => handleDeleteHistory(e, item.id)}
                                            className="absolute right-2 top-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-4">
                <button onClick={() => setShowHistory(!showHistory)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded">
                    <HistoryIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="bg-blue-600 text-white p-1 rounded">Biz</span> Check
                </h1>
            </div>
            <div className="flex items-center gap-3">
                 {/* Usage Dropdown */}
                 <div className="hidden md:flex items-center gap-2 mr-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">用途:</label>
                    <select 
                        value={selectedUsageId} 
                        onChange={(e) => setSelectedUsageId(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 min-w-[160px]"
                    >
                        {usagePresets.map(preset => (
                            <option key={preset.id} value={preset.id}>{preset.name}</option>
                        ))}
                    </select>
                 </div>

                 <button 
                    onClick={handleNewDocument}
                    className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
                    title="新規作成 (リセット)"
                 >
                    <FilePlusIcon className="w-5 h-5" />
                 </button>

                 <button 
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
                    title="設定"
                 >
                    <SettingsIcon className="w-5 h-5" />
                 </button>

                 <button 
                    onClick={runAiCheck}
                    disabled={isAiLoading || !text}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm ${
                        isAiLoading || !text 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md hover:scale-[1.02]'
                    }`}
                >
                    {isAiLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            AI解析中...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-4 h-4" />
                            AIで詳細チェック
                        </>
                    )}
                </button>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            
            {/* Left Column: Editor */}
            <div className="flex-1 flex flex-col p-4 lg:p-6 lg:border-r border-slate-200 bg-slate-50/50 min-h-[40%] lg:h-full">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        作成中の文章
                    </label>
                    {/* Mobile Dropdown */}
                    <div className="md:hidden flex items-center gap-2">
                        <select 
                            value={selectedUsageId} 
                            onChange={(e) => setSelectedUsageId(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-xs rounded p-1"
                        >
                            {usagePresets.map(preset => (
                                <option key={preset.id} value={preset.id}>{preset.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all flex flex-col relative">
                    {/* Backdrop for highlighting */}
                    <div 
                        ref={backdropRef}
                        className="absolute inset-0 p-5 font-mono text-base leading-relaxed whitespace-pre-wrap break-words overflow-hidden pointer-events-none text-transparent"
                        aria-hidden="true"
                    >
                        {highlightedText}
                    </div>

                    <textarea 
                        ref={textareaRef}
                        className="absolute inset-0 w-full h-full p-5 bg-transparent resize-none outline-none text-base leading-relaxed break-words font-mono text-slate-800 placeholder:text-slate-300"
                        placeholder="ここにビジネス文章を入力してください..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onScroll={handleScroll}
                        spellCheck={false}
                    />
                    
                    <div className="absolute bottom-0 right-0 px-4 py-2 bg-slate-50/90 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center w-full z-10 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                             <button
                                onClick={() => handleSpeak(text, 'editor')}
                                className={`p-1.5 rounded-full hover:bg-slate-200 transition-colors ${playingSource === 'editor' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                                title="読み上げ"
                             >
                                {playingSource === 'editor' ? <StopIcon className="w-4 h-4" /> : <Volume2Icon className="w-4 h-4" />}
                             </button>
                        </div>
                        <span>{text.length} 文字</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Analysis */}
            <div className="flex-1 flex flex-col bg-white h-full lg:w-1/2 min-h-[50%]">
                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('realtime')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'realtime' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        リアルタイム校正 
                        {highlightRanges.filter(r => r.type.startsWith('regex')).length > 0 && (
                            <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                                {highlightRanges.filter(r => r.type.startsWith('regex')).length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'ai' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        AI詳細分析
                        {aiResult && <span className="ml-2 text-emerald-500">●</span>}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    
                    {/* Real-time Tab */}
                    {activeTab === 'realtime' && (
                        <div className="space-y-4">
                            {!text && (
                                <div className="text-center py-12 text-slate-400">
                                    <p>文章を入力すると、自動的にチェックが始まります。</p>
                                </div>
                            )}
                            
                            {/* Regex Warnings */}
                            {highlightRanges.filter(r => r.type.startsWith('regex')).map((range, idx) => (
                                <div key={idx} className={`p-4 rounded-lg border flex gap-3 ${
                                    range.type === 'regex_warning' 
                                    ? 'bg-amber-50 border-amber-200 text-amber-900' 
                                    : 'bg-blue-50 border-blue-200 text-blue-900'
                                }`}>
                                    <AlertTriangleIcon className={`w-5 h-5 flex-shrink-0 ${
                                        range.type === 'regex_warning' ? 'text-amber-600' : 'text-blue-600'
                                    }`} />
                                    <div>
                                        <div className="text-sm font-bold mb-1">
                                            検出: 「{text.slice(range.start, range.end)}」付近
                                        </div>
                                        <div className="text-sm opacity-90 leading-relaxed">
                                            {range.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {/* AI Highlights (if tab is realtime but AI result exists) */}
                             {highlightRanges.filter(r => r.type === 'ai_critique').length > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                                        <SparklesIcon className="w-4 h-4" /> AIによる指摘箇所
                                    </h4>
                                    <p className="text-xs text-slate-500 mb-2">詳細は「AI詳細分析」タブを確認してください。</p>
                                    <div className="space-y-2">
                                         {highlightRanges.filter(r => r.type === 'ai_critique').map((range, idx) => (
                                            <div key={`ai-${idx}`} className="flex items-center gap-2 text-sm bg-red-50 text-red-800 p-2 rounded border border-red-100">
                                                <span className="font-bold line-through opacity-70">{text.slice(range.start, range.end)}</span>
                                                <ChevronRightIcon className="w-3 h-3" />
                                                <span className="font-bold text-emerald-700">{range.message}</span>
                                            </div>
                                         ))}
                                    </div>
                                </div>
                            )}

                            {text && highlightRanges.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-emerald-600">
                                    <div className="bg-emerald-100 p-3 rounded-full mb-3">
                                        <CheckCircleIcon className="w-8 h-8" />
                                    </div>
                                    <p className="font-medium">基本的な問題は見つかりませんでした</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Analysis Tab */}
                    {activeTab === 'ai' && (
                        <div className="space-y-6">
                            {!aiResult && !isAiLoading && (
                                <div className="text-center py-12 text-slate-400">
                                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <SparklesIcon className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p>「AIで詳細チェック」ボタンを押して<br/>詳細な分析を開始してください。</p>
                                    <p className="text-xs mt-2 text-slate-500">用途: {usagePresets.find(p => p.id === selectedUsageId)?.name}</p>
                                </div>
                            )}

                            {isAiLoading && (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-24 bg-slate-200 rounded-lg"></div>
                                    <div className="h-40 bg-slate-200 rounded-lg"></div>
                                    <div className="h-24 bg-slate-200 rounded-lg"></div>
                                </div>
                            )}

                            {aiResult && (
                                <>
                                    {/* Overall Summary */}
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <SparklesIcon className="w-4 h-4 text-purple-500" /> 
                                            AIサマリー ({usagePresets.find(p => p.id === selectedUsageId)?.name})
                                        </h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {aiResult.summary}
                                        </p>
                                    </div>

                                    {/* Revised Text */}
                                    <div className="bg-gradient-to-br from-white to-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-blue-900 flex items-center gap-2">
                                                <CheckCircleIcon className="w-4 h-4 text-blue-600" /> 
                                                修正案
                                            </h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSpeak(aiResult.improved_text, 'ai')}
                                                    className={`p-1.5 rounded bg-white border border-blue-100 transition-colors ${playingSource === 'ai' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-500'}`}
                                                    title="読み上げ"
                                                >
                                                    {playingSource === 'ai' ? <StopIcon className="w-4 h-4" /> : <Volume2Icon className="w-4 h-4" />}
                                                </button>
                                                <button 
                                                    onClick={() => navigator.clipboard.writeText(aiResult.improved_text)}
                                                    className="p-1.5 rounded bg-white border border-blue-100 text-slate-400 hover:text-blue-500 transition-colors"
                                                    title="コピー"
                                                >
                                                    <CopyIcon className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={handleReplaceText}
                                                    className="p-1.5 rounded bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors"
                                                    title="修正案をエディタに反映 (置換)"
                                                >
                                                    <RefreshCwIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border border-blue-100 text-slate-800 leading-relaxed whitespace-pre-wrap text-sm">
                                            {aiResult.improved_text}
                                        </div>
                                    </div>

                                    {/* Critiques */}
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-slate-700 ml-1">修正・改善ポイント ({aiResult.critiques.length})</h3>
                                        {aiResult.critiques.map((critique, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="mb-2">
                                                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded line-through mr-2">
                                                                {critique.original_text}
                                                            </span>
                                                            <ChevronRightIcon className="inline w-3 h-3 text-slate-400 mx-1" />
                                                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                                                {critique.suggestion}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                                                            💡 {critique.reason}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
