import { RegexRule, UsagePreset } from '../types';
import { DEFAULT_REGEX_RULES, DEFAULT_USAGE_PRESETS, DEFAULT_BASE_PROMPT } from '../constants';

const SETTINGS_KEY = 'bizCheck_settings';

export const loadSettings = () => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    
    // Initial default settings
    let settings = {
        regexRules: DEFAULT_REGEX_RULES,
        usagePresets: DEFAULT_USAGE_PRESETS,
        baseSystemPrompt: DEFAULT_BASE_PROMPT,
        ttsVoiceURI: ''
    };

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            
            // Merge saved Regex Rules with any new Defaults
            if (parsed.regexRules && Array.isArray(parsed.regexRules)) {
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
            if (parsed.usagePresets && Array.isArray(parsed.usagePresets)) {
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
        } catch (e) {
            console.error("Failed to parse settings", e);
            // Fallback to defaults (already set)
        }
    }
    return settings;
};

export const saveSettings = (rules: RegexRule[], presets: UsagePreset[], basePrompt: string, ttsVoiceURI: string) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ 
        regexRules: rules, 
        usagePresets: presets, 
        baseSystemPrompt: basePrompt,
        ttsVoiceURI: ttsVoiceURI
    }));
};
