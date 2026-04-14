export interface Song {
  title: string;
  rawTitle: string;
  album: string;
  year: number;
  durationMs: number;
  hasFeat: boolean;
  explicit: boolean;
}

export interface Filter {
  id: string;
  label: string;
  songs: string[]; // valid canonical titles
  type: string;
  hardness: 'easy' | 'medium' | 'hard';
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface StepResult {
  filter: Filter;
  guessedTitle: string | null; // null if skipped / ran out
  skipped: boolean;
  timedOut: boolean;
  guessesUsed: number;
  aiVerified: boolean;
  examplesShown: string[];
}

export interface GameState {
  artist: string;
  difficulty: Difficulty;
  filters: Filter[];
  step: number;
  usedSongs: string[];
  results: StepResult[];
  guessesLeft: number;
  score: number;
  combo: number;
  maxCombo: number;
  elapsedMs: number;
  status: 'idle' | 'playing' | 'verifying' | 'transitioning' | 'done';
  feedback: { ok: boolean | null; msg: string } | null;
  skipExamples: string[];
  lastCorrectSong: string | null;
  lastCorrectVideoId: string | null;
}

export type GameAction =
  | { type: 'SUBMIT_GUESS'; guess: string }
  | { type: 'LOCAL_MATCH'; canonical: string }
  | { type: 'LOCAL_REJECT'; reason: string }
  | { type: 'AI_VERIFIED'; canonical: string }
  | { type: 'AI_REJECTED'; reason: string }
  | { type: 'AI_TIMEOUT' }
  | { type: 'SKIP' }
  | { type: 'ADVANCE' }
  | { type: 'START_VERIFYING' }
  | { type: 'TICK'; deltaMs: number }
  | { type: 'SET_VIDEO'; videoId: string }
  | { type: 'CLEAR_FEEDBACK' }
  | { type: 'NEXT_FILTER' };

export interface GlobalStats {
  gamesPlayed: number;
  totalScore: number;
  currentStreak: number;
  bestStreak: number;
  fastestTimeMs: number | null;
}

export interface ArtistStat {
  artist: string;
  bestScore: number;
  bestGrade: 'S' | 'A' | 'B' | 'C' | 'D';
  timesPlayed: number;
  bestTimeMs: number | null;
}

export interface DailyChallenge {
  date: string; // YYYY-MM-DD
  artist: string;
  completed: boolean;
  score: number | null;
  grade: string | null;
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export function computeGrade(score: number, maxScore: number): Grade {
  const pct = maxScore > 0 ? score / maxScore : 0;
  if (pct >= 1.0) return 'S';
  if (pct >= 0.8) return 'A';
  if (pct >= 0.6) return 'B';
  if (pct >= 0.4) return 'C';
  return 'D';
}

export const DIFFICULTY_CONFIG = {
  easy:   { filterCount: 7,  guessesPerFilter: 5, label: 'Easy',   emoji: '🌱', color: '#7BC67E' },
  medium: { filterCount: 9,  guessesPerFilter: 4, label: 'Medium', emoji: '🌸', color: '#F4A261' },
  hard:   { filterCount: 12, guessesPerFilter: 3, label: 'Hard',   emoji: '🔥', color: '#E76F51' },
} as const;
