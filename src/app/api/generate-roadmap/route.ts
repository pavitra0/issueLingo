import { NextResponse } from 'next/server';
import { callGeminiWithRotation } from '@/lib/gemini';
import { LingoDotDevEngine } from 'lingo.dev/sdk';

export async function POST(req: Request) {
    try {
        const { title, body, comments, targetLanguage } = await req.json();

        if (!body || !targetLanguage) {
            return NextResponse.json({ error: 'Missing content or language' }, { status: 400 });
        }

        // Build compact thread context (cap total size)
        const topComments = (comments || []).slice(0, 6);
        const commentsContext = topComments
            .map((c: any, i: number) => `### Comment ${i + 1} by @${c.author}:\n${c.body}`)
            .join('\n\n');

        const prompt = `
You are an expert senior open-source developer and maintainer. Analyze this GitHub issue and create a detailed, actionable "Contribution Roadmap" for a new contributor.

---
**Issue Title:** ${title}

**Issue Description:**
${body.substring(0, 2500)}

${commentsContext ? `**Recent Discussion:**\n${commentsContext.substring(0, 2000)}` : ''}
---

Generate a structured Contribution Roadmap in Markdown. Include the following sections:

## 🎯 Objective
One clear sentence: what exactly needs to be built or fixed.

## 🔍 Investigation Steps
Numbered list of exactly WHERE to look in the codebase (specific files, functions, or modules mentioned in the thread).

## ⚙️ Implementation Plan
Step-by-step numbered list of concrete code changes the contributor needs to make.

## ✅ How to Verify the Fix
Numbered list of test commands or manual steps to confirm it works.

## 💡 Tips & Gotchas
1-3 bullet points of tricky edge cases or important caveats from the discussion.

Be specific, reference exact file paths and function names when they are mentioned. If none are mentioned, give educated guesses based on standard project conventions. Keep each section brief but actionable.
`.trim();

        // Real Gemini AI call
        const aiRoadmap = await callGeminiWithRotation(prompt);

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

        // Translate if not English
        if (targetLocale && targetLocale !== 'en') {
            const lingo = new LingoDotDevEngine({ apiKey: process.env.LINGO_API_KEY! });

            // Protect code blocks before translation
            const protectedBlocks: string[] = [];
            let protectedText = aiRoadmap;

            protectedText = protectedText.replace(/```[\s\S]*?```/g, (match: string) => {
                const placeholder = `[[PROTECTED_${protectedBlocks.length}]]`;
                protectedBlocks.push(match);
                return placeholder;
            });
            protectedText = protectedText.replace(/`[^`\n]+`/g, (match: string) => {
                const placeholder = `[[PROTECTED_${protectedBlocks.length}]]`;
                protectedBlocks.push(match);
                return placeholder;
            });

            let translated = await lingo.localizeText(protectedText, {
                sourceLocale: 'en',
                targetLocale: targetLocale,
            });

            // Restore code blocks
            protectedBlocks.forEach((original, i) => {
                translated = translated.split(`[[PROTECTED_${i}]]`).join(original);
            });

            return NextResponse.json({ roadmap: translated });
        }

        return NextResponse.json({ roadmap: aiRoadmap });

    } catch (error: any) {
        console.error('Roadmap Generation Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to generate contribution roadmap'
        }, { status: 500 });
    }
}
