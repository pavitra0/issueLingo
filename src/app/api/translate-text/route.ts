import { NextResponse } from 'next/server';
import { LingoDotDevEngine } from 'lingo.dev/sdk';

const langCodeMap: Record<string, string> = {
    'Spanish': 'es',
    'French': 'fr',
    'Japanese': 'ja',
    'Hindi': 'hi',
    'German': 'de',
};

export async function POST(req: Request) {
    try {
        const { text, targetLanguage } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Accept ISO codes or full names using the map
        const requestedLang = targetLanguage || 'es';
        const targetLocale = langCodeMap[requestedLang] || requestedLang;

        const lingo = new LingoDotDevEngine({
            apiKey: process.env.LINGO_API_KEY || ''
        });

        let sourceLocale = 'en';

        // --- Markdown Protection Logic ---
        const protectedBlocks: string[] = [];
        let protectedText = text;

        // 1. Protect code blocks (```...```)
        protectedText = protectedText.replace(/```[\s\S]*?```/g, (match: string) => {
            const placeholder = `[[PROTECTED_BLOCK_${protectedBlocks.length}]]`;
            protectedBlocks.push(match);
            return placeholder;
        });

        // 2. Protect inline code (`...`)
        protectedText = protectedText.replace(/`[^`\n]+`/g, (match: string) => {
            const placeholder = `[[PROTECTED_BLOCK_${protectedBlocks.length}]]`;
            protectedBlocks.push(match);
            return placeholder;
        });

        let translatedText = protectedText;

        try {
            if (!process.env.LINGO_API_KEY || process.env.LINGO_API_KEY === 'your_lingo_dev_api_key_here') {
                throw new Error('No Lingo API Key configured');
            }

            sourceLocale = await lingo.recognizeLocale(text).catch(() => 'en');

            translatedText = await lingo.localizeText(protectedText, {
                sourceLocale: sourceLocale,
                targetLocale: targetLocale,
            });

            // 3. Restore protected blocks
            protectedBlocks.forEach((originalContent, index) => {
                const placeholder = `[[PROTECTED_BLOCK_${index}]]`;
                // Use split/join instead of replace to avoid issues with special characters in the original code
                translatedText = translatedText.split(placeholder).join(originalContent);
            });

        } catch (translateError) {
            console.error("Translation Error:", translateError);
            translatedText = `[Translated to ${targetLanguage}]\n\n${text}`; // fallback
        }

        return NextResponse.json({
            translatedText,
            sourceLocale
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

