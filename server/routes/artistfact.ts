import { Router } from 'express';
import { getArtistFact } from '../services/ai.js';
import { cache } from '../services/cache.js';

const router = Router();

router.get('/:artist', async (req, res) => {
  const artist = decodeURIComponent(req.params.artist ?? '');
  if (!artist) { res.status(400).json({ error: 'Artist required' }); return; }
  const cacheKey = `fact:${artist.toLowerCase()}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) { res.json({ fact: cached }); return; }
  try {
    const fact = await getArtistFact(artist);
    cache.set(cacheKey, fact, 3600000 * 6);
    res.json({ fact });
  } catch { res.status(500).json({ fact: '' }); }
});

export default router;
