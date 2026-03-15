import { NextResponse } from 'next/server';
import { callGeminiWithRotation } from '@/lib/gemini';
import { LingoDotDevEngine } from 'lingo.dev/sdk';

export async function POST(req: Request) {
    try {
        const { title, body, comments, targetLanguage } = await req.json();

        if (!body) {
            return NextResponse.json({ error: 'Missing issue body' }, { status: 400 });
        }

        // Build a compact thread context (cap total size for token efficiency)
        const topComments = (comments || []).slice(0, 8);
        const commentsContext = topComments
            .map((c: any, i: number) => `--- Comment ${i + 1} by ${c.author} ---\n${c.body}`)
            .join('\n\n');

        const prompt = `
You are an expert open-source developer. Read the following GitHub issue thread and produce a CONCISE developer summary.

Issue Title: ${title}

Issue Body:
${body.substring(0, 2000)}

${commentsContext ? `Latest Comments:\n${commentsContext.substring(0, 2000)}` : ''}

Your response must be in exactly this format (no extra text):

## 🐛 The Problem
[One sentence describing the core bug or request]

## 📍 Current Status
[One sentence on where the discussion is now — fixed, needs PR, investigating, etc.]

## 🙋 How You Can Help
[One sentence on exactly what kind of contributor is needed right now]

Keep each section to 1-2 sentences. Be technical and precise.
`.trim();

        // Call Gemini for real AI reasoning
        const aiSummary = await callGeminiWithRotation(prompt);

        const langCodeMap: Record<string, string> = {
            'english': 'en',
            'spanish': 'es',
            'french': 'fr',
            'japanese': 'ja',
            'hindi': 'hi',
            'german': 'de'
        };
        const requestedLang = (targetLanguage || '').toLowerCase().trim();
        const targetLocale = langCodeMap[requestedLang] || requestedLang;

        // If a target language is provided and it's not English, translate the result
        if (targetLocale && targetLocale !== 'en') {
            const lingo = new LingoDotDevEngine({ apiKey: process.env.LINGO_API_KEY! });
            const translated = await lingo.localizeText(aiSummary, {
                sourceLocale: 'en',
                targetLocale: targetLocale,
            });
            return NextResponse.json({ summary: translated });
        }

        return NextResponse.json({ summary: aiSummary });

    } catch (error: any) {
        console.error('Summarize Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to generate summary'
        }, { status: 500 });
    }
}
