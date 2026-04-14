export interface Song {
  title: string;
  rawTitle: string;
  album: string;
  year: number;
  durationMs: number;
  hasFeat: boolean;
  explicit: boolean;
}

export interface DiscographyResponse {
  artist: string;
  songs: Song[];
  fetchedAt: number;
}

export interface ValidateRequest {
  artist: string;
  filterLabel: string;
  guess: string;
  usedSongs: string[];
}

export interface ValidateResponse {
  valid: boolean;
  canonical?: string;
  reason?: string;
}

export interface YouTubeResult {
  videoId: string;
  title: string;
  thumbnail: string;
}
