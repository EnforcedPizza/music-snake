import { Router } from 'express';
import { validateWithAI } from '../services/ai.js';
import { ValidateRequest } from '../types.js';

const router = Router();

router.post('/', async (req, res) => {
  const body = req.body as ValidateRequest;
  const { artist, filterLabel, guess, usedSongs } = body;
  if (!artist || !filterLabel || !guess) { res.status(400).json({ valid: false, reason: 'Missing required fields' }); return; }
  try {
    const result = await validateWithAI(artist, filterLabel, guess, usedSongs ?? []);
    res.json(result);
  } catch (err) {
    console.error('Validate error:', err);
    res.status(500).json({ valid: false, reason: 'Validation service unavailable' });
  }
});

export default router;
