export interface YouTubeResult {
  videoId: string;
  title: string;
  thumbnail: string;
}

export async function fetchYouTubeVideo(artist: string, song: string): Promise<YouTubeResult | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`/api/youtube?artist=${encodeURIComponent(artist)}&song=${encodeURIComponent(song)}`, {
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json() as YouTubeResult;
  } catch {
    return null;
  }
}
