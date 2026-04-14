function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      dp[i][j] = i === 0 ? j : j === 0 ? i : 0;
    }
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

const ARTICLES = /^(the|a|an)\s+/i;

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(ARTICLES, '')
    .replace(/[^a-z0-9]/g, '');
}

export function fuzzyMatch(guess: string, pool: string[]): string | null {
  if (!guess.trim() || pool.length === 0) return null;

  const normGuess = normalize(guess);
  if (normGuess.length === 0) return null;

  // 1. Exact normalized match
  for (const title of pool) {
    if (normalize(title) === normGuess) return title;
  }

  // 2. Substring match (both >=4 chars)
  if (normGuess.length >= 4) {
    for (const title of pool) {
      const normTitle = normalize(title);
      if (normTitle.length >= 4) {
        if (normTitle.includes(normGuess) || normGuess.includes(normTitle)) {
          return title;
        }
      }
    }
  }

  // 3. Levenshtein <= 2 (guess >=5 chars)
  if (normGuess.length >= 5) {
    for (const title of pool) {
      const normTitle = normalize(title);
      if (levenshtein(normGuess, normTitle) <= 2) return title;
    }
  }

  return null;
}
