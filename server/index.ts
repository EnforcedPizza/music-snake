import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import discographyRouter from './routes/discography.js';
import validateRouter from './routes/validate.js';
import youtubeRouter from './routes/youtube.js';
import artistfactRouter from './routes/artistfact.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001');

app.use(cors());
app.use(express.json());

app.use('/api/discography', discographyRouter);
app.use('/api/validate', validateRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/artistfact', artistfactRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

if (isProd) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🐍 Music Snake server running on http://localhost:${PORT}`);
});
