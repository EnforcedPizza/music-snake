import { Song } from '../types.js';

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function cleanAlbum(name: string): string {
  return name
    .replace(/\s*[\(\[](deluxe|remastered|special|expanded|anniversary|platinum|gold|standard|super|complete|bonus|edition|version|remaster|re-issue|re-release|collectors?|digital|original|explicit|clean|radio|soundtrack|ost)[^\)\]]*[\)\]]/gi, '')
    .replace(/\s*-\s*(deluxe|remastered|special|expanded|anniversary|edition|version)\s*$/gi, '')
    .trim();
}

function cleanTitle(name: string): string {
  return name
    .replace(/\s*[\(\[](remastered?|re-recorded|re-record|acoustic|live|demo|alt(?:ernate)?|alternative|radio edit|single version|music video|official video|explicit|clean|feat\.|ft\.|featuring)[^\)\]]*[\)\]]/gi, '')
    .trim();
}

function normArtist(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

interface ItunesTrack {
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  releaseDate?: string;
  trackTimeMillis?: number;
  trackExplicitness?: string;
  wrapperType?: string;
  kind?: string;
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function searchItunes(term: string, entity: string, limit = 200): Promise<ItunesTrack[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=${limit}&media=music`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const data = await res.json() as { results?: ItunesTrack[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

async function lookupByArtistId(artistId: number): Promise<ItunesTrack[]> {
  const url = `https://itunes.apple.com/lookup?id=${artistId}&entity=song&limit=200`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const data = await res.json() as { results?: ItunesTrack[] };
    return (data.results ?? []).filter(r => r.wrapperType === 'track');
  } catch {
    return [];
  }
}

export async function fetchDiscography(artist: string): Promise<Song[]> {
  const normQ = normArtist(artist);

  // Parallel: search for songs + search for artist entity
  const [songResults, artistResults] = await Promise.all([
    searchItunes(artist, 'song', 200),
    searchItunes(artist, 'musicArtist', 5),
  ]);

  // Find artist IDs from artist search
  const artistIds: number[] = [];
  for (const r of artistResults) {
    const raw = r as Record<string, unknown>;
    if (typeof raw['artistId'] === 'number') {
      const normName = normArtist((raw['artistName'] as string) ?? '');
      if (normName === normQ || normName.includes(normQ) || normQ.includes(normName)) {
        artistIds.push(raw['artistId'] as number);
      }
    }
  }

  // Lookup by artist ID for more songs
  const lookupResults = await Promise.all(artistIds.slice(0, 2).map(id => lookupByArtistId(id)));
  const allRaw = [...songResults, ...lookupResults.flat()];

  // Filter to songs matching the artist
  const filtered = allRaw.filter(r => {
    if (!r.trackName || !r.artistName) return false;
    if (r.wrapperType === 'artist') return false;
    if (r.kind && r.kind !== 'song') return false;
    const normArt = normArtist(r.artistName);
    return (
      normArt === normQ ||
      levenshtein(normArt, normQ) <= 2 ||
      normArt.includes(normQ) ||
      normQ.includes(normArt)
    );
  });

  // Map to Song
  const mapped: Song[] = filtered.map(r => ({
    title: cleanTitle(r.trackName ?? ''),
    rawTitle: r.trackName ?? '',
    album: cleanAlbum(r.collectionName ?? ''),
    year: r.releaseDate ? parseInt(r.releaseDate.slice(0, 4)) : 0,
    durationMs: r.trackTimeMillis ?? 0,
    hasFeat: /feat\.|ft\.|featuring/i.test(r.trackName ?? ''),
    explicit: r.trackExplicitness === 'explicit',
  }));

  // Deduplicate by normalized title — keep earliest year
  const seen = new Map<string, Song>();
  for (const song of mapped) {
    const key = normTitle(song.title);
    const existing = seen.get(key);
    if (!existing || (song.year > 0 && (existing.year === 0 || song.year < existing.year))) {
      seen.set(key, song);
    }
  }

  // Sort by year ascending
  return Array.from(seen.values()).sort((a, b) => a.year - b.year);
}
