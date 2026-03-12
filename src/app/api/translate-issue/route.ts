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
    const { payloadObject, targetLanguage } = await req.json();

    if (!payloadObject) {
      return NextResponse.json({ error: 'payloadObject is required' }, { status: 400 });
    }

    const targetLocale = targetLanguage || 'es'; // Accept ISO codes directly (es, ja, hi...)

    // Initialize Lingo.dev SDK
    const lingo = new LingoDotDevEngine({
      apiKey: process.env.LINGO_API_KEY || ''
    });

    let localizedPayload;
    try {
      if (!process.env.LINGO_API_KEY || process.env.LINGO_API_KEY === 'your_lingo_dev_api_key_here') {
        throw new Error('No Lingo API Key configured');
      }

      localizedPayload = await lingo.localizeObject(payloadObject, {
        sourceLocale: 'en',
        targetLocale: targetLocale,
      });
    } catch (translateError) {
      console.error("Translation Error:", translateError);
      // Fallback if API key is not set or SDK fails
      localizedPayload = {
        title: `[Translated to ${targetLanguage}] ` + payloadObject.title,
        body: `[Translated to ${targetLanguage}]\n\n` + payloadObject.body,
        comments: payloadObject.comments.map((c: string) => `[Translated to ${targetLanguage}]\n\n` + c)
      };
    }

    return NextResponse.json(localizedPayload);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
