export function getApiBase(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL !== undefined) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const port = window.location.port;
    if (!port || port === '80' || port === '443') return '';
  }
  return 'http://localhost:3001';
}

export type GameStats = {
  onlinePlayers: number;
  kingdoms: number;
  registeredUsers: number;
  discordMembers: number;
};

export async function fetchGameStats(): Promise<GameStats> {
  const base = getApiBase();
  const res = await fetch(`${base}/api/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('stats failed');
  const data = await res.json();
  return {
    onlinePlayers: data.onlinePlayers ?? 0,
    kingdoms: data.kingdoms ?? 0,
    registeredUsers: data.registeredUsers ?? 0,
    discordMembers: data.discordMembers ?? 0
  };
}
