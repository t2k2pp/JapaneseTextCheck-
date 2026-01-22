import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- Icons (SVG Components) ---
const CheckCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const AlertTriangleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);
const SparklesIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"></path></svg>
);
const HistoryIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><path d="M12 7v5l4 2"></path></svg>
);
const ChevronRightIcon = ({ className, onClick, style }: { className?: string, onClick?: React.MouseEventHandler<SVGSVGElement>, style?: React.CSSProperties }) => (
  <svg onClick={onClick} style={style} xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
);
const SearchIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const TrashIcon = ({ className, onClick }: { className?: string, onClick?: React.MouseEventHandler<SVGSVGElement> }) => (
  <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const SettingsIcon = ({ className, onClick }: { className?: string, onClick?: React.MouseEventHandler<SVGSVGElement> }) => (
  <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const XIcon = ({ className, onClick }: { className?: string, onClick?: React.MouseEventHandler<SVGSVGElement> }) => (
  <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const PlusIcon = ({ className, onClick }: { className?: string, onClick?: React.MouseEventHandler<SVGSVGElement> }) => (
  <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const EditIcon = ({ className, onClick }: { className?: string, onClick?: React.MouseEventHandler<SVGSVGElement> }) => (
    <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);
const MagicWandIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 2 2 2-2 2-2-2 2-2Z"/><path d="m5 7 5 5-5 5-5-5 5-5Z"/><path d="m15 11-2 2 4 4 2-2-4-4Z"/></svg>
);
const FilterIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
);
const SaveIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);
const FilePlusIcon = ({ className, onClick }: { className?: string, onClick?: React.MouseEventHandler<SVGSVGElement> }) => (
    <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
);
const Volume2Icon = ({ className, onClick }: { className?: string, onClick?: React.MouseEventHandler<SVGSVGElement> }) => (
    <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
);
const StopIcon = ({ className, onClick }: { className?: string, onClick?: React.MouseEventHandler<SVGSVGElement> }) => (
    <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect></svg>
);
const RefreshCwIcon = ({ className, onClick }: { className?: string, onClick?: React.MouseEventHandler<SVGSVGElement> }) => (
    <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);
const CopyIcon = ({ className, onClick }: { className?: string, onClick?: React.MouseEventHandler<SVGSVGElement> }) => (
    <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);
const PlayIcon = ({ className, onClick }: { className?: string, onClick?: React.MouseEventHandler<SVGSVGElement> }) => (
    <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);
const CodeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
);
const PenToolIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"></path><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="m2 2 7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
);
const CpuIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
);

// --- Types ---
interface Critique {
  original_text: string;
  suggestion: string;
  reason: string;
}

interface AIAnalysisResult {
  critiques: Critique[];
  improved_text: string;
  summary: string;
}

interface HistoryItem {
  id: number;
  text: string;
  timestamp: number;
  usageId: string;
  aiResult?: AIAnalysisResult;
  isAutoSave?: boolean;
}

interface RegexRule {
  id: string;
  name: string;      // User friendly name
  patternStr: string;
  message: string;
  level: 'warning' | 'info';
  enabled: boolean;  // Toggle state
}

// Unified interface for highlighting
interface HighlightRange {
    start: number;
    end: number;
    type: 'regex_warning' | 'regex_info' | 'ai_critique';
    message?: string;
}

interface UsagePreset {
    id: string;
    name: string;
    prompt: string;
}

// --- Defaults ---
const DEFAULT_REGEX_RULES: RegexRule[] = [
  { id: 'redundant_can', name: '冗長な「ことができます」', patternStr: 'ことができます', message: '「ことができます」は冗長です。「〜できます」や動詞の可能形への言い換えを検討してください。', level: 'info', enabled: true },
  { id: 'humble_overuse', name: '過剰な「させていただく」', patternStr: '(させていただき|させていただきます)', message: '「させていただく」の多用は慇懃無礼な印象を与えることがあります。「いたします」などで簡潔にできないか確認してください。', level: 'warning', enabled: true },
  { id: 'vague_ga', name: '逆接の「が」', patternStr: 'が、', message: '逆接でない「が、」は文章をだらだらと繋げてしまいます。句点「。」で区切ることを検討してください。', level: 'warning', enabled: true },
  { id: 'do_noun', name: '冗長な「〜を行う」', patternStr: 'を行う', message: '「〜を行う」は「〜する」と言い換えられる場合が多いです。（例：確認を行う→確認する）', level: 'info', enabled: true },
  { id: 'double_negative', name: '二重否定', patternStr: 'なく（は｜も）ない', message: '二重否定は分かりにくい表現です。肯定文への言い換えを検討してください。', level: 'warning', enabled: true },
  { id: 'taritari', name: '並列の「たり」', patternStr: 'たり(?!.*たり)', message: '「たり」は通常「〜たり〜たり」と繰り返して使います。単独の場合は「など」の使用を検討してください。', level: 'warning', enabled: true },
  { id: 'yori_check', name: '「より」の用法', patternStr: 'より', message: '「より」は比較（〜よりも）で使うのが推奨されます。起点（〜から）の意味で使っている場合は、「から」への言い換えを検討してください。', level: 'info', enabled: true },
];

const DEFAULT_BASE_PROMPT = `あなたはプロのビジネス文書校正者です。ユーザーから提供されたビジネス文章をチェックし、改善点を指摘してください。
指摘にあたっては、以下の観点を基本としてください：
1. 敬語の適切さ（二重敬語、過剰な謙譲語、尊敬語の誤用など）
2. 簡潔さ・明瞭さ（冗長な表現の削除、一文一義）
3. 論理構成（因果関係の明確化）
4. 表記ゆれや誤字脱字
5. 助詞の適切な使用（特に「より」が起点（〜から）の意味で使われている場合は、比較の意味と混同しやすいため「から」への修正を推奨）`;

const DEFAULT_USAGE_PRESETS: UsagePreset[] = [
    { 
        id: 'general', 
        name: '一般ビジネス', 
        prompt: `【役割】
一般的なビジネス文書の校正者

【トーン＆マナー】
・失礼がなく、かつ事務的になりすぎない丁寧なトーン
・相手への配慮を示しつつ、要件を明確に伝える

【重点チェック項目】
・冗長な言い回しを避け、読み手の時間を奪わない
・誤解を招く曖昧な表現を具体化する` 
    },
    { 
        id: 'email_apology', 
        name: 'メール返信（謝罪）', 
        prompt: `【役割】
クレーム対応やミスに対する謝罪メールの専門家

【トーン＆マナー】
・深く反省していることが伝わる、誠実で重厚なトーン
・言い訳がましく聞こえる表現は徹底的に排除する

【重点チェック項目】
・謝罪の言葉（申し訳ございません等）が適切な位置にあるか
・原因と対策が明確に、かつ客観的に記述されているか
・今後の関係維持に向けた前向きな姿勢が含まれているか` 
    },
    { 
        id: 'report', 
        name: '日報・報告書', 
        prompt: `【役割】
社内文書・報告書のレビュアー

【トーン＆マナー】
・感情を排した、客観的で論理的な「です・ます」調
・過度な敬語は不要。簡潔さを最優先する

【重点チェック項目】
・「事実」と「意見/推測」が明確に区別されているか
・結論（結果）が最初に述べられているか（PREP法など）
・数値を用いて具体的に記述されているか` 
    },
    { 
        id: 'proposal', 
        name: '提案書・企画書', 
        prompt: `【役割】
説得力のある提案書を作成するコピーライター

【トーン＆マナー】
・自信に満ちた、ポジティブで力強いトーン
・読み手（顧客）のメリット（ベネフィット）を強調する

【重点チェック項目】
・「〜と思います」といった自信のない表現を避ける
・受動態ではなく能動態を使用し、主体性をアピールする
・課題解決のプロセスが論理的に繋がっているか` 
    },
    { 
        id: 'chat', 
        name: 'チャット連絡', 
        prompt: `【役割】
Slack/Teamsなどのビジネスチャットでのコミュニケーター

【トーン＆マナー】
・迅速なやり取りに適した、短く端的な表現
・「お疲れ様です」などの定型挨拶は最小限にする

【重点チェック項目】
・改行を適切に使い、スマホでも読みやすくする
・結論やアクション（何をしてほしいか）が明確か
・絵文字などは、文脈に合わせて許容範囲で使用する（親しみやすさ）` 
    },
    {
        id: 'ai_prompt_refinement',
        name: '生成AIプロンプト改善',
        prompt: `【役割】
シニア・プロンプトエンジニア（2026年基準）

【目的】
ユーザーが入力したプロンプト案を、大規模言語モデル（LLM）が最大限のパフォーマンスを発揮できるように最適化・リファクタリングする。

【トーン＆マナー】
・分析的かつ建設的
・プロンプトエンジニアリングの専門用語を用いて論理的に説明する

【適用すべき最新手法（2026年時点）】
1. **Context-Driven Structuring**: 「背景」「制約」「入力」「出力要件」を明確なセクションに分割する。
2. **Meta-Cognitive Prompting**: AIに対し、回答前に自身の思考プロセスを評価・修正するよう指示する（"Think before you answer" の高度化）。
3. **Delimiter Enforcing**: 入力データや可変部分を \`"""\` や \`###\` などの区切り文字で厳格に分離し、プロンプトインジェクションや混同を防ぐ。
4. **Few-Shot with Reasoning**: 単なる例示だけでなく、「なぜその例が正解なのか」の理由（Reasoning）を併記するCoT（Chain of Thought）スタイルを含める。
5. **Output Schema Validation**: 出力形式をJSONやMarkdownテーブルなどで厳密に指定し、後処理の容易性を担保する。

【重点チェック項目】
・指示は具体的か（曖昧性の排除）
・役割（Persona）は定義されているか
・ステップバイステップの思考（CoT）が促されているか`
    }
];

// --- IndexedDB Helper ---
const DB_NAME = 'BizCheckDB';
const STORE_NAME = 'checkHistory';

const dbHelper = {
  open: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  },
  add: async (item: Omit<HistoryItem, 'id'>): Promise<number> => {
    const db = await dbHelper.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(item);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  },
  getAll: async (): Promise<HistoryItem[]> => {
    const db = await dbHelper.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.getAll();
      request.onsuccess = () => resolve((request.result as HistoryItem[]).reverse());
      request.onerror = () => reject(request.error);
    });
  },
  delete: async (id: number): Promise<void> => {
    const db = await dbHelper.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

// --- Settings Storage ---
const SETTINGS_KEY = 'bizCheck_settings';
const loadSettings = () => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    
    // Initial default settings
    let settings = {
        regexRules: DEFAULT_REGEX_RULES,
        usagePresets: DEFAULT_USAGE_PRESETS,
        baseSystemPrompt: DEFAULT_BASE_PROMPT,
        ttsVoiceURI: ''
    };

    if (saved) {
        const parsed = JSON.parse(saved);
        
        // Merge saved Regex Rules with any new Defaults
        if (parsed.regexRules) {
             const savedRulesFormatted = parsed.regexRules.map((r: any) => ({
                 ...r,
                 name: r.name || r.id,
                 enabled: r.enabled !== false
             }));
             const savedIds = new Set(savedRulesFormatted.map((r: any) => r.id));
             const newRules = DEFAULT_REGEX_RULES.filter(r => !savedIds.has(r.id));
             
             settings.regexRules = [...savedRulesFormatted, ...newRules];
        }

        // Merge saved Usage Presets with any new Defaults
        if (parsed.usagePresets) {
             const savedIds = new Set(parsed.usagePresets.map((p: any) => p.id));
             const newPresets = DEFAULT_USAGE_PRESETS.filter(p => !savedIds.has(p.id));
             settings.usagePresets = [...parsed.usagePresets, ...newPresets];
        }

        if (parsed.baseSystemPrompt) {
            settings.baseSystemPrompt = parsed.baseSystemPrompt;
        }
        
        if (parsed.ttsVoiceURI) {
            settings.ttsVoiceURI = parsed.ttsVoiceURI;
        }
    }
    return settings;
};
const saveSettings = (rules: RegexRule[], presets: UsagePreset[], basePrompt: string, ttsVoiceURI: string) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ 
        regexRules: rules, 
        usagePresets: presets, 
        baseSystemPrompt: basePrompt,
        ttsVoiceURI: ttsVoiceURI
    }));
};

// --- Components ---

const ConfirmationModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onClose,
    isDestructive = false
}: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
    isDestructive?: boolean;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${isDestructive ? 'text-red-600' : 'text-slate-800'}`}>
                        {isDestructive && <AlertTriangleIcon className="w-5 h-5" />}
                        {title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {message}
                    </p>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-3 border-t border-slate-100">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${
                            isDestructive 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        実行する
                    </button>
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ 
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
                // Do not clear patternStr immediately to avoid bad UX, or maybe clear it?
                // setRegexForm(prev => ({...prev, patternStr: ''}));
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

const App = () => {
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

const root = createRoot(document.getElementById('root')!);
root.render(<App />);