import { NextResponse } from 'next/server';
import { LingoDotDevEngine } from 'lingo.dev/sdk';

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const lingo = new LingoDotDevEngine({
            apiKey: process.env.LINGO_API_KEY || ''
        });

        let translatedText = text;

        try {
            if (!process.env.LINGO_API_KEY || process.env.LINGO_API_KEY === 'your_lingo_dev_api_key_here') {
                throw new Error('No Lingo API Key configured');
            }

            const sourceLocale = await lingo.recognizeLocale(text).catch(() => null);

            translatedText = await lingo.localizeText(text, {
                sourceLocale: sourceLocale,
                targetLocale: 'en',
            });
        } catch (translateError) {
            console.error("Translation Error:", translateError);
            translatedText = `[English Translation]: ${text}`; // fallback
        }

        return NextResponse.json({
            translatedText
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
