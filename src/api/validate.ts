export interface ValidateResponse {
  valid: boolean;
  canonical?: string;
  reason?: string;
}

export async function validateGuess(
  artist: string,
  filterLabel: string,
  guess: string,
  usedSongs: string[]
): Promise<ValidateResponse> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artist, filterLabel, guess, usedSongs }),
      signal: controller.signal,
    });
    if (!res.ok) {
      return { valid: false, reason: 'Validation service unavailable' };
    }
    return await res.json() as ValidateResponse;
  } catch {
    return { valid: false, reason: "Couldn't verify — try a different song" };
  } finally {
    clearTimeout(id);
  }
}
