export interface Critique {
  original_text: string;
  suggestion: string;
  reason: string;
}

export interface AIAnalysisResult {
  critiques: Critique[];
  improved_text: string;
  summary: string;
}

export interface HistoryItem {
  id: number;
  text: string;
  timestamp: number;
  usageId: string;
  aiResult?: AIAnalysisResult;
  isAutoSave?: boolean;
}

export interface RegexRule {
  id: string;
  name: string;
  patternStr: string;
  message: string;
  level: 'warning' | 'info';
  enabled: boolean;
}

export interface HighlightRange {
  start: number;
  end: number;
  type: 'regex_warning' | 'regex_info' | 'ai_critique';
  message?: string;
}

export interface UsagePreset {
  id: string;
  name: string;
  prompt: string;
}
