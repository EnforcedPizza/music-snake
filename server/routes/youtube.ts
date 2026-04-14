import { Router } from 'express';
import { searchYouTube } from '../services/youtube.js';
import { cache } from '../services/cache.js';

const router = Router();

router.get('/', async (req, res) => {
  const artist = (req.query['artist'] as string) ?? '';
  const song = (req.query['song'] as string) ?? '';
  if (!artist || !song) { res.status(400).json({ error: 'artist and song required' }); return; }
  const cacheKey = `yt:${artist.toLowerCase()}:${song.toLowerCase()}`;
  const cached = cache.get<object>(cacheKey);
  if (cached) { res.json(cached); return; }
  try {
    const result = await searchYouTube(artist, song);
    if (!result) { res.status(404).json({ error: 'No video found' }); return; }
    cache.set(cacheKey, result, 3600000);
    res.json(result);
  } catch (err) {
    console.error('YouTube error:', err);
    res.status(500).json({ error: 'YouTube search failed' });
  }
});

export default router;
