import { YouTubeResult } from '../types.js';

export async function searchYouTube(artist: string, songTitle: string): Promise<YouTubeResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const query = `${artist} ${songTitle} official`;

  if (apiKey && apiKey.length > 10) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=1&key=${apiKey}`;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) return null;
      const data = await res.json() as {
        items?: Array<{
          id: { videoId: string };
          snippet: { title: string; thumbnails: { medium: { url: string } } };
        }>;
      };
      const item = data.items?.[0];
      if (!item) return null;
      return { videoId: item.id.videoId, title: item.snippet.title, thumbnail: item.snippet.thumbnails.medium.url };
    } catch { return null; }
  }

  return { videoId: `search:${encodeURIComponent(query)}`, title: `${artist} - ${songTitle}`, thumbnail: '' };
}
