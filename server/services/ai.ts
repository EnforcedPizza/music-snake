import Anthropic from '@anthropic-ai/sdk';
import { ValidateResponse } from '../types.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function validateWithAI(
  artist: string,
  filterLabel: string,
  guess: string,
  usedSongs: string[]
): Promise<ValidateResponse> {
  const usedList = usedSongs.length > 0 ? usedSongs.join(', ') : 'none';
  const prompt = `Is "${guess}" a real song by ${artist} that satisfies the filter "${filterLabel}"?\nIt must NOT be one of these already-used songs: ${usedList}.\nBe lenient on spelling. Be strict on the filter condition.\nRespond ONLY with JSON: {"valid":true,"canonical":"Exact Official Title"} or {"valid":false,"reason":"..."}`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text.trim()) as ValidateResponse;
    return parsed;
  } catch {
    return { valid: false, reason: 'Could not verify — try a different song' };
  }
}

export async function getArtistFact(artist: string): Promise<string> {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: `Give me one fun, surprising "did you know" fact about ${artist} the musician. Keep it under 2 sentences. Start directly with the fact, no preamble.`,
      }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return text.trim();
  } catch {
    return `${artist} has captivated millions of fans worldwide with their incredible music.`;
  }
}
