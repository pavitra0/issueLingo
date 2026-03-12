import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini Key Rotator
 *
 * Add up to N keys in your .env as:
 *   GEMINI_API_KEY_1=...
 *   GEMINI_API_KEY_2=...
 *   GEMINI_API_KEY_3=...
 *
 * This utility picks the next key on each call, rotating through all of them
 * to distribute rate-limit pressure across multiple free-tier API keys.
 */

let currentIndex = 0;

function getApiKeys(): string[] {
  const keys: string[] = [];
  let i = 1;
  while (true) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (!key) break;
    if (!key.toLowerCase().includes('your_')) {
      keys.push(key);
    }
    i++;
  }
  // Fallback: check for a single GEMINI_API_KEY
  if (keys.length === 0 && process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.toLowerCase().includes('your_')) {
    keys.push(process.env.GEMINI_API_KEY);
  }
  return keys;
}

export function getNextGeminiClient(): { client: GoogleGenerativeAI; keyIndex: number } {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error('No Gemini API key found. Add GEMINI_API_KEY_1 to your .env file.');
  }
  const keyIndex = currentIndex % keys.length;
  currentIndex = (currentIndex + 1) % keys.length;
  return {
    client: new GoogleGenerativeAI(keys[keyIndex]),
    keyIndex: keyIndex + 1,
  };
}

/**
 * Retry with the next key if the current one hits a rate limit (429).
 */
export async function callGeminiWithRotation(
  prompt: string,
  modelName = 'gemini-2.5-flash'
): Promise<string> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error('No Gemini API key found.');
  }

  let lastError: Error | null = null;
  // Try each key at most once
  for (let attempt = 0; attempt < keys.length; attempt++) {
    try {
      const { client } = getNextGeminiClient();
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      lastError = err;
      // If rate limited, try the next key
      if (err?.status === 429 || err?.message?.includes('429')) {
        continue;
      }
      // Other errors bubble up immediately
      throw err;
    }
  }
  throw lastError ?? new Error('All Gemini API keys exhausted.');
}
