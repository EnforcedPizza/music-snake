import { GameState, GameAction, StepResult, Difficulty, DIFFICULTY_CONFIG } from '../types.js';
import { Filter } from '../types.js';

function getGuessesForDifficulty(difficulty: Difficulty): number {
  return DIFFICULTY_CONFIG[difficulty].guessesPerFilter;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function createInitialState(
  artist: string,
  difficulty: Difficulty,
  filters: Filter[]
): GameState {
  return {
    artist,
    difficulty,
    filters,
    step: 0,
    usedSongs: [],
    results: [],
    guessesLeft: getGuessesForDifficulty(difficulty),
    score: 0,
    combo: 0,
    maxCombo: 0,
    elapsedMs: 0,
    status: 'playing',
    feedback: null,
    skipExamples: [],
    lastCorrectSong: null,
    lastCorrectVideoId: null,
  };
}

function pickExamples(filter: Filter, usedSongs: string[], count = 4): string[] {
  return filter.songs.filter(s => !usedSongs.includes(s)).slice(0, count);
}

function scoreForGuess(guessesLeft: number, combo: number, maxGuesses: number): number {
  const accuracyBonus = guessesLeft === maxGuesses ? 50 : guessesLeft * 10;
  const comboBonus = combo * 20;
  return 100 + accuracyBonus + comboBonus;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK':
      if (state.status === 'playing') {
        return { ...state, elapsedMs: state.elapsedMs + action.deltaMs };
      }
      return state;

    case 'START_VERIFYING':
      return { ...state, status: 'verifying', feedback: { ok: null, msg: 'Checking...' } };

    case 'LOCAL_MATCH': {
      const maxGuesses = getGuessesForDifficulty(state.difficulty);
      const newCombo = state.combo + 1;
      const newScore = state.score + scoreForGuess(state.guessesLeft, newCombo, maxGuesses);
      const currentFilter = state.filters[state.step];
      const result: StepResult = {
        filter: currentFilter,
        guessedTitle: action.canonical,
        skipped: false,
        timedOut: false,
        guessesUsed: maxGuesses - state.guessesLeft + 1,
        aiVerified: false,
        examplesShown: [],
      };
      return {
        ...state,
        status: 'transitioning',
        usedSongs: [...state.usedSongs, action.canonical],
        score: newScore,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        results: [...state.results, result],
        feedback: { ok: true, msg: `✓ "${action.canonical}"` },
        lastCorrectSong: action.canonical,
        lastCorrectVideoId: null,
      };
    }

    case 'AI_VERIFIED': {
      const maxGuesses = getGuessesForDifficulty(state.difficulty);
      const newCombo = state.combo + 1;
      const newScore = state.score + scoreForGuess(state.guessesLeft, newCombo, maxGuesses);
      const currentFilter = state.filters[state.step];
      const result: StepResult = {
        filter: currentFilter,
        guessedTitle: action.canonical,
        skipped: false,
        timedOut: false,
        guessesUsed: maxGuesses - state.guessesLeft + 1,
        aiVerified: true,
        examplesShown: [],
      };
      return {
        ...state,
        status: 'transitioning',
        usedSongs: [...state.usedSongs, action.canonical],
        score: newScore,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        results: [...state.results, result],
        feedback: { ok: true, msg: `✓ "${action.canonical}" (AI verified!)` },
        lastCorrectSong: action.canonical,
        lastCorrectVideoId: null,
      };
    }

    case 'LOCAL_REJECT':
    case 'AI_REJECTED': {
      const newGuessesLeft = state.guessesLeft - 1;
      const currentFilter = state.filters[state.step];

      if (newGuessesLeft <= 0) {
        // Auto-skip: out of guesses
        const examples = pickExamples(currentFilter, state.usedSongs);
        const result: StepResult = {
          filter: currentFilter,
          guessedTitle: null,
          skipped: true,
          timedOut: false,
          guessesUsed: getGuessesForDifficulty(state.difficulty),
          aiVerified: false,
          examplesShown: examples,
        };
        return {
          ...state,
          guessesLeft: 0,
          combo: 0,
          results: [...state.results, result],
          skipExamples: examples,
          status: 'transitioning',
          feedback: { ok: false, msg: `Out of guesses! Could've been: ${examples.slice(0, 2).join(', ')}` },
        };
      }

      const reason = action.type === 'AI_REJECTED' && 'reason' in action ? action.reason : action.type === 'LOCAL_REJECT' ? action.reason : 'Not a match!';
      return {
        ...state,
        guessesLeft: newGuessesLeft,
        combo: 0,
        status: 'playing',
        feedback: { ok: false, msg: reason ?? 'Not a match!' },
      };
    }

    case 'AI_TIMEOUT': {
      return {
        ...state,
        status: 'playing',
        feedback: { ok: false, msg: "Couldn't verify — try a different song" },
      };
    }

    case 'SKIP': {
      const currentFilter = state.filters[state.step];
      const examples = pickExamples(currentFilter, state.usedSongs);
      const result: StepResult = {
        filter: currentFilter,
        guessedTitle: null,
        skipped: true,
        timedOut: false,
        guessesUsed: getGuessesForDifficulty(state.difficulty) - state.guessesLeft,
        aiVerified: false,
        examplesShown: examples,
      };
      return {
        ...state,
        combo: 0,
        results: [...state.results, result],
        skipExamples: examples,
        status: 'transitioning',
        feedback: { ok: null, msg: `Skipped! Could've been: ${examples.slice(0, 2).join(', ')}` },
      };
    }

    case 'NEXT_FILTER':
    case 'ADVANCE': {
      const nextStep = state.step + 1;
      if (nextStep >= state.filters.length) {
        return { ...state, step: nextStep, status: 'done' };
      }
      return {
        ...state,
        step: nextStep,
        guessesLeft: getGuessesForDifficulty(state.difficulty),
        status: 'playing',
        feedback: null,
        skipExamples: [],
        lastCorrectSong: null,
        lastCorrectVideoId: null,
      };
    }

    case 'SET_VIDEO':
      return { ...state, lastCorrectVideoId: action.videoId };

    case 'CLEAR_FEEDBACK':
      return { ...state, feedback: null };

    default:
      return state;
  }
}

export function computeFinalScore(state: GameState): { score: number; pct: number } {
  const maxPossiblePerFilter = 100 + 50 + state.filters.length * 20;
  const maxScore = maxPossiblePerFilter * state.filters.length;
  return { score: state.score, pct: clamp(state.score / maxScore, 0, 1) };
}
