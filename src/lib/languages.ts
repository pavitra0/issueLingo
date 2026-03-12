export type Language = {
    code: string;
    name: string;
    nativeName: string;
    region: string;
};

export const REGIONS = [
    'European',
    'East Asian',
    'South Asian',
    'Southeast Asian',
    'Middle Eastern',
    'African',
    'Americas',
];

export const SUPPORTED_LANGUAGES: Language[] = [
    // Global / Default
    { code: 'en', name: 'English', nativeName: 'English', region: 'European' },
    // European
    { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'European' },
    { code: 'fr', name: 'French', nativeName: 'Français', region: 'European' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'European' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', region: 'European' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'European' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'European' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', region: 'European' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', region: 'European' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', region: 'European' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', region: 'European' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română', region: 'European' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', region: 'European' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', region: 'European' },
    // East Asian
    { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文（简体）', region: 'East Asian' },
    { code: 'zh-tw', name: 'Chinese (Traditional)', nativeName: '中文（繁體）', region: 'East Asian' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'East Asian' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'East Asian' },
    // South Asian
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'South Asian' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'South Asian' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'South Asian' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'South Asian' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'South Asian' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'South Asian' },
    // Southeast Asian
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Southeast Asian' },
    { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย', region: 'Southeast Asian' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Southeast Asian' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'Southeast Asian' },
    { code: 'tl', name: 'Filipino', nativeName: 'Filipino', region: 'Southeast Asian' },
    // Middle Eastern
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'Middle Eastern' },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی', region: 'Middle Eastern' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', region: 'Middle Eastern' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', region: 'Middle Eastern' },
    // African
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', region: 'African' },
    { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', region: 'African' },
    { code: 'ha', name: 'Hausa', nativeName: 'Hausa', region: 'African' },
    // Americas
    { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', region: 'Americas' },
    { code: 'es-mx', name: 'Spanish (Mexico)', nativeName: 'Español (México)', region: 'Americas' },
];

export function getLanguageByCode(code: string): Language | undefined {
    return SUPPORTED_LANGUAGES.find((l) => l.code === code);
}
