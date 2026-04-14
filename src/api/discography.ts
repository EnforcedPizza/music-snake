import { Song } from '../types.js';

export interface DiscographyResponse {
  artist: string;
  songs: Song[];
  fetchedAt: number;
}

export async function fetchDiscography(artist: string): Promise<DiscographyResponse> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`/api/discography/${encodeURIComponent(artist)}`, {
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json() as { error: string };
      throw new Error(err.error ?? 'Failed to fetch discography');
    }
    return await res.json() as DiscographyResponse;
  } finally {
    clearTimeout(id);
  }
}
