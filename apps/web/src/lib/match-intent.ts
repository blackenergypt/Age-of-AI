export type MatchIntent = {
  mode?: 'public' | 'private';
  name?: string | null;
  matchId?: string | null;
  password?: string | null;
  maxPlayers?: number;
  kingdomName?: string | null;
};

const KEY = 'ageMatchIntent';

export function setMatchIntent(intent: MatchIntent) {
  sessionStorage.setItem(KEY, JSON.stringify(intent));
}

export function takeMatchIntent(): MatchIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MatchIntent;
  } catch {
    sessionStorage.removeItem(KEY);
    return null;
  }
}
