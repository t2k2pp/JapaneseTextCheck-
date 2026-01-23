import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SettingsIcon, XIcon, PlusIcon, EditIcon, CodeIcon, PenToolIcon, CpuIcon, MagicWandIcon, TrashIcon, PlayIcon } from './icons';
import { RegexRule, UsagePreset } from '../types';
import { saveSettings } from '../lib/storage';

export const SettingsModal = ({ 
    isOpen, 
    onClose, 
    rules, 
    setRules, 
    presets, 
    setPresets, 
    basePrompt, 
    setBasePrompt,
    ttsVoiceURI,
    setTtsVoiceURI,
    availableVoices,
    requestConfirm
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    rules: RegexRule[]; 
    setRules: (r: RegexRule[]) => void;
    presets: UsagePreset[];
    setPresets: (p: UsagePreset[]) => void;
    basePrompt: string;
    setBasePrompt: (s: string) => void;
    ttsVoiceURI: string;
    setTtsVoiceURI: (s: string) => void;
    availableVoices: SpeechSynthesisVoice[];
    requestConfirm: (title: string, message: string, cb: () => void, isDestructive?: boolean) => void;
}) => {
    const [activeTab, setActiveTab] = useState<'regex' | 'usage' | 'voice'>('usage');
    
    // --- Regex State ---
    const [isEditingRule, setIsEditingRule] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [regexForm, setRegexForm] = useState<RegexRule>({
        id: '', name: '', patternStr: '', message: '', level: 'warning', enabled: true
    });
    
    // Regex Builder State
    const [regexMode, setRegexMode] = useState<'manual' | 'builder' | 'ai'>('manual');
    const [builderType, setBuilderType] = useState<'contains_any' | 'contains_all' | 'starts_with' | 'ends_with'>('contains_any');
    const [builderKeywords, setBuilderKeywords] = useState('');
    const [aiDescription, setAiDescription] = useState('');
    const [isGeneratingRegex, setIsGeneratingRegex] = useState(false);

    // --- Usage State ---
    const [isEditingPreset, setIsEditingPreset] = useState(false);
    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
    const [usageForm, setUsageForm] = useState<UsagePreset>({
        id: '', name: '', prompt: ''
    });
    const [isOptimizing, setIsOptimizing] = useState(false);

    // Save Handlers
    const persist = (newRules: RegexRule[], newPresets: UsagePreset[], newBasePrompt: string, newVoiceURI: string) => {
        saveSettings(newRules, newPresets, newBasePrompt, newVoiceURI);
        setRules(newRules);
        setPresets(newPresets);
        setBasePrompt(newBasePrompt);
        setTtsVoiceURI(newVoiceURI);
    };

    // --- Regex Logic ---
    const handleRegexToggle = (id: string) => {
        const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
        persist(updated, presets, basePrompt, ttsVoiceURI);
    };

    const openRegexEdit = (rule?: RegexRule) => {
        if (rule) {
            setRegexForm({ ...rule });
            setEditingRuleId(rule.id);
            setRegexMode('manual');
        } else {
            setRegexForm({ id: '', name: '', patternStr: '', message: '', level: 'warning', enabled: true });
            setEditingRuleId(null);
            setRegexMode('manual');
        }
        setBuilderKeywords('');
        setAiDescription('');
        setIsEditingRule(true);
    };

    const saveRegexRule = () => {
        if (!regexForm.patternStr || !regexForm.message || !regexForm.name) return;
        try {
            new RegExp(regexForm.patternStr); // Validate regex
            let updated;
            if (editingRuleId) {
                updated = rules.map(r => r.id === editingRuleId ? { ...regexForm, id: editingRuleId } : r);
            } else {
                updated = [...rules, { ...regexForm, id: Date.now().toString() }];
            }
            persist(updated, presets, basePrompt, ttsVoiceURI);
            setIsEditingRule(false);
        } catch (e) {
            alert('正規表現が無効です');
        }
    };

    const deleteRegexRule = (id: string) => {
        requestConfirm(
            'ルールを削除',
            'この正規表現チェックルールを削除しますか？\nこの操作は元に戻せません。',
            () => {
                const updated = rules.filter(r => r.id !== id);
                persist(updated, presets, basePrompt, ttsVoiceURI);
                setIsEditingRule(false);
            },
            true
        );
    };

    // Regex Builder Logic
    useEffect(() => {
        if (regexMode === 'builder') {
            const keywords = builderKeywords.split(/[,、\s]+/).filter(k => k.trim());
            if (keywords.length === 0) {
                return;
            }
            
            const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            let pattern = '';

            switch (builderType) {
                case 'contains_any':
                    pattern = `(${escapedKeywords.join('|')})`;
                    break;
                case 'starts_with':
                    pattern = `^(${escapedKeywords.join('|')})`;
                    break;
                case 'ends_with':
                    pattern = `(${escapedKeywords.join('|')})$`;
                    break;
                case 'contains_all':
                    // Lookahead for single line matching all words
                    pattern = escapedKeywords.map(k => `(?=.*${k})`).join('');
                    break;
            }
            setRegexForm(prev => ({...prev, patternStr: pattern}));
        }
    }, [builderType, builderKeywords, regexMode]);

    // AI Regex Generation
    const generateRegexWithAI = async () => {
        if (!aiDescription.trim()) return;
        setIsGeneratingRegex(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `You are a Regex Expert. Convert the following natural language description into a JavaScript Regular Expression.
            Return ONLY the regex pattern string (without / / delimiters and flags).
            
            Description: ${aiDescription}
            
            Examples:
            "Sentences ending with '...'" -> \.\.\.$
            "Words starting with 'pre'" -> \bpre\w*
            "Email address" -> [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
            `;
            
            const result = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt
            });
            
            if (result.text) {
                const cleanPattern = result.text.trim().replace(/^\/|\/[gimuy]*$/g, ''); // Remove slashes if AI adds them
                setRegexForm(prev => ({ ...prev, patternStr: cleanPattern }));
            }
        } catch (e) {
            console.error(e);
            alert('AIによる正規表現生成に失敗しました');
        } finally {
            setIsGeneratingRegex(false);
        }
    };


    // --- Usage Logic ---
    const openUsageEdit = (preset?: UsagePreset) => {
        if (preset) {
            setUsageForm({ ...preset });
            setEditingPresetId(preset.id);
        } else {
            setUsageForm({ id: '', name: '', prompt: '' });
            setEditingPresetId(null);
        }
        setIsEditingPreset(true);
    };

    const saveUsagePreset = () => {
        if (!usageForm.name || !usageForm.prompt) return;
        let updated;
        if (editingPresetId) {
            updated = presets.map(p => p.id === editingPresetId ? { ...usageForm, id: editingPresetId } : p);
        } else {
            updated = [...presets, { ...usageForm, id: Date.now().toString() }];
        }
        persist(rules, updated, basePrompt, ttsVoiceURI);
        setIsEditingPreset(false);
    };

    const deleteUsagePreset = (id: string) => {
        requestConfirm(
            '用途プリセットを削除',
            'この用途プリセットを削除しますか？',
            () => {
                const updated = presets.filter(p => p.id !== id);
                persist(rules, updated, basePrompt, ttsVoiceURI);
            },
            true
        );
    };

    // Optimize Prompt with AI
    const handleOptimizePrompt = async () => {
        if (!usageForm.prompt.trim()) return;
        setIsOptimizing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `あなたはプロンプトエンジニアです。
ユーザーが入力した以下の「ビジネス文書校正AIへの指示（プロンプト）」を、より効果的で構造化されたプロンプトに書き換えてください。

元の指示:
${usageForm.prompt}

出力フォーマット:
マークダウン形式（箇条書きなどを活用）で、そのままシステムプロンプトとして使えるテキストのみを出力してください。
セクション例：【役割】【トーン＆マナー】【重点チェック項目】などを含めると良いです。`;
            
            const result = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt
            });
            
            if (result.text) {
                setUsageForm(prev => ({ ...prev, prompt: result.text as string }));
            }
        } catch (e) {
            console.error(e);
            alert('プロンプトの最適化に失敗しました');
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleBasePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBasePrompt(e.target.value);
    };
    const saveBasePrompt = () => {
        persist(rules, presets, basePrompt, ttsVoiceURI);
    };

    const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVoice = e.target.value;
        setTtsVoiceURI(newVoice);
        persist(rules, presets, basePrompt, newVoice);
    };

    const handleTestVoice = () => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("これは音声のテストです。BizCheckで文書を校正します。");
        utterance.lang = 'ja-JP';
        if (ttsVoiceURI) {
            const voice = availableVoices.find(v => v.voiceURI === ttsVoiceURI);
            if (voice) utterance.voice = voice;
        }
        window.speechSynthesis.speak(utterance);
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5" /> 設定
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <XIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                
                <div className="flex border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('usage')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'usage' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        用途（プロンプト）設定
                    </button>
                    <button 
                        onClick={() => setActiveTab('regex')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'regex' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        正規表現チェック設定
                    </button>
                    <button 
                        onClick={() => setActiveTab('voice')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'voice' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        音声設定
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {/* Settings Content */}
                    {activeTab === 'regex' && (
                        <div className="space-y-6">
                            {!isEditingRule ? (
                                <>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-sm font-bold text-slate-700">有効なルール一覧</h3>
                                            <button onClick={() => openRegexEdit()} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center gap-1">
                                                <PlusIcon className="w-3 h-3" /> 追加
                                            </button>
                                        </div>
                                        {rules.map(rule => (
                                            <div key={rule.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
                                                <div 
                                                    onClick={() => handleRegexToggle(rule.id)}
                                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${rule.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                                                >
                                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${rule.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className={`text-sm font-bold ${rule.enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                                                        {rule.name}
                                                    </h4>
                                                    <p className={`text-xs ${rule.enabled ? 'text-slate-500' : 'text-slate-300'}`}>
                                                        {rule.message}
                                                    </p>
                                                </div>
                                                <button onClick={() => openRegexEdit(rule)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-base font-bold text-slate-700 mb-4">
                                        {editingRuleId ? 'ルールを編集' : '新規ルール作成'}
                                    </h3>
                                    
                                    <div className="flex gap-2 mb-6 border-b border-slate-100 pb-2">
                                        <button 
                                            onClick={() => setRegexMode('manual')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors ${regexMode === 'manual' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            <CodeIcon className="w-4 h-4" /> 直接入力
                                        </button>
                                        <button 
                                            onClick={() => setRegexMode('builder')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors ${regexMode === 'builder' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            <PenToolIcon className="w-4 h-4" /> ビルダー (簡単)
                                        </button>
                                        <button 
                                            onClick={() => setRegexMode('ai')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors ${regexMode === 'ai' ? 'bg-purple-50 text-purple-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            <CpuIcon className="w-4 h-4" /> AI生成 (自然言語)
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">ルール名 (表示用)</label>
                                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm" value={regexForm.name} onChange={e => setRegexForm({...regexForm, name: e.target.value})} placeholder="例: 逆接の「が」" />
                                        </div>

                                        {/* Builder Mode UI */}
                                        {regexMode === 'builder' && (
                                            <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 mb-4">
                                                <div className="grid grid-cols-3 gap-2 mb-2">
                                                    <div className="col-span-1">
                                                        <label className="block text-[10px] font-bold text-emerald-600 mb-1">条件タイプ</label>
                                                        <select 
                                                            className="w-full px-2 py-1.5 text-sm border border-emerald-200 rounded"
                                                            value={builderType}
                                                            onChange={e => setBuilderType(e.target.value as any)}
                                                        >
                                                            <option value="contains_any">〜のいずれかを含む (OR)</option>
                                                            <option value="contains_all">〜をすべて含む (AND)</option>
                                                            <option value="starts_with">〜で始まる (行頭)</option>
                                                            <option value="ends_with">〜で終わる (行末)</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-[10px] font-bold text-emerald-600 mb-1">キーワード (カンマ区切り)</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full px-2 py-1.5 text-sm border border-emerald-200 rounded"
                                                            value={builderKeywords}
                                                            onChange={e => setBuilderKeywords(e.target.value)}
                                                            placeholder="例: 確認, 検討, 調査"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-emerald-600">※入力すると自動的に正規表現が生成されます。</p>
                                            </div>
                                        )}

                                        {/* AI Mode UI */}
                                        {regexMode === 'ai' && (
                                            <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100 mb-4">
                                                <label className="block text-[10px] font-bold text-purple-600 mb-1">どのようなパターンを検出したいですか？</label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        className="flex-1 px-2 py-1.5 text-sm border border-purple-200 rounded"
                                                        value={aiDescription}
                                                        onChange={e => setAiDescription(e.target.value)}
                                                        placeholder="例: 数字で始まり、.csvで終わる文字列"
                                                        onKeyDown={e => e.key === 'Enter' && generateRegexWithAI()}
                                                    />
                                                    <button 
                                                        onClick={generateRegexWithAI}
                                                        disabled={isGeneratingRegex || !aiDescription}
                                                        className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700 disabled:opacity-50"
                                                    >
                                                        {isGeneratingRegex ? '生成中...' : '生成'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                正規表現パターン 
                                                {regexMode !== 'manual' && <span className="ml-2 text-[10px] text-slate-400 font-normal">(自動生成)</span>}
                                            </label>
                                            <input 
                                                type="text" 
                                                className={`w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono ${regexMode !== 'manual' ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'}`}
                                                value={regexForm.patternStr} 
                                                onChange={e => setRegexForm({...regexForm, patternStr: e.target.value})} 
                                                readOnly={regexMode !== 'manual'}
                                                placeholder="例: が、" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">警告メッセージ</label>
                                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm" value={regexForm.message} onChange={e => setRegexForm({...regexForm, message: e.target.value})} placeholder="ユーザーに表示するヒント" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">レベル</label>
                                            <select className="w-full px-3 py-2 border border-slate-300 rounded text-sm" value={regexForm.level} onChange={e => setRegexForm({...regexForm, level: e.target.value as any})}>
                                                <option value="warning">警告 (Warning)</option>
                                                <option value="info">情報 (Info)</option>
                                            </select>
                                        </div>
                                        
                                        <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                                            {editingRuleId && (
                                                <button onClick={() => deleteRegexRule(editingRuleId)} className="mr-auto text-red-500 text-sm hover:underline">削除</button>
                                            )}
                                            <button onClick={() => setIsEditingRule(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">キャンセル</button>
                                            <button onClick={saveRegexRule} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Restored Usage Settings Block */}
                    {activeTab === 'usage' && (
                        <div className="space-y-6">
                            {!isEditingPreset && (
                                <div className="mb-6">
                                    <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                                        <h3 className="text-sm font-bold text-slate-700 mb-2">共通ベースプロンプト</h3>
                                        <textarea 
                                            className="w-full h-24 p-2 text-xs text-slate-600 border border-slate-300 rounded bg-white resize-none"
                                            value={basePrompt}
                                            onChange={handleBasePromptChange}
                                            onBlur={saveBasePrompt}
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {!isEditingPreset ? (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-bold text-slate-700">用途プリセット一覧</h3>
                                        <button onClick={() => openUsageEdit()} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center gap-1">
                                            <PlusIcon className="w-3 h-3" /> 追加
                                        </button>
                                    </div>
                                    <div className="grid gap-3">
                                        {presets && presets.length > 0 ? (
                                            presets.map(preset => (
                                                <div key={preset.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-slate-800">{preset.name}</h4>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => openUsageEdit(preset)} className="p-1 text-slate-400 hover:text-blue-600">
                                                                <EditIcon className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => deleteUsagePreset(preset.id)} className="p-1 text-slate-400 hover:text-red-500">
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 leading-relaxed border border-slate-100 max-h-24 overflow-hidden relative">
                                                        <pre className="whitespace-pre-wrap font-sans">{preset.prompt}</pre>
                                                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none"></div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-slate-400 text-sm bg-slate-100 rounded border border-dashed border-slate-300">
                                                プリセットがありません
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-base font-bold text-slate-700 mb-4">
                                        {editingPresetId ? '用途を編集' : '新規用途作成'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">用途名</label>
                                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm" value={usageForm.name} onChange={e => setUsageForm({...usageForm, name: e.target.value})} placeholder="例: 社内日報" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">AIへの指示（プロンプト）</label>
                                            <div className="relative">
                                                <textarea 
                                                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm h-64 resize-none leading-relaxed"
                                                    value={usageForm.prompt}
                                                    onChange={e => setUsageForm({...usageForm, prompt: e.target.value})}
                                                    placeholder="ここにAIへの詳細な指示を記述します..."
                                                />
                                            </div>
                                            <div className="mt-2 flex justify-end">
                                                <button 
                                                    onClick={handleOptimizePrompt}
                                                    disabled={isOptimizing || !usageForm.prompt}
                                                    className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                                                        isOptimizing || !usageForm.prompt
                                                        ? 'bg-slate-100 text-slate-400 border-slate-200'
                                                        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                                    }`}
                                                >
                                                    {isOptimizing ? (
                                                        <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <MagicWandIcon className="w-3 h-3" />
                                                    )}
                                                    {isOptimizing ? '最適化中...' : 'AIでプロンプトを最適化'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                                            <button onClick={() => setIsEditingPreset(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">キャンセル</button>
                                            <button onClick={saveUsagePreset} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'voice' && (
                        <div className="space-y-6">
                            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-700 mb-2">読み上げ音声モデル設定</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">音声モデル (Voice)</label>
                                        <div className="flex gap-2">
                                            <select 
                                                className="flex-1 p-2 text-xs text-slate-600 border border-slate-300 rounded bg-white"
                                                value={ttsVoiceURI}
                                                onChange={handleVoiceChange}
                                            >
                                                <option value="">デフォルト</option>
                                                {availableVoices.map(voice => (
                                                    <option key={voice.voiceURI} value={voice.voiceURI}>
                                                        {voice.name} ({voice.lang})
                                                    </option>
                                                ))}
                                            </select>
                                            <button 
                                                onClick={handleTestVoice}
                                                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                title="テスト再生"
                                            >
                                                <PlayIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded border border-blue-100 text-xs text-blue-800 leading-relaxed">
                                        <p>※ 利用可能な音声は、お使いのOSやブラウザによって異なります。</p>
                                        <p>※ Google Chromeなどのブラウザでは、より多くの高品質な音声が利用できる場合があります。</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};