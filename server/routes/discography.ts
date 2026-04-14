import { Router } from 'express';
import { cache } from '../services/cache.js';
import { fetchDiscography } from '../services/itunes.js';
import { DiscographyResponse } from '../types.js';

const router = Router();
const TTL = parseInt(process.env.CACHE_TTL_MS ?? '86400000');

router.get('/:artist', async (req, res) => {
  const artist = decodeURIComponent(req.params.artist ?? '');
  if (!artist) { res.status(400).json({ error: 'Artist name required' }); return; }
  const cacheKey = `discog:${artist.toLowerCase()}`;
  const cached = cache.get<DiscographyResponse>(cacheKey);
  if (cached) { res.json(cached); return; }
  try {
    const songs = await fetchDiscography(artist);
    if (songs.length === 0) { res.status(404).json({ error: 'Artist not found on iTunes — try a different spelling' }); return; }
    const response: DiscographyResponse = { artist, songs, fetchedAt: Date.now() };
    cache.set(cacheKey, response, TTL);
    res.json(response);
  } catch (err) {
    console.error('Discography error:', err);
    res.status(500).json({ error: 'Failed to fetch discography' });
  }
});

export default router;
