'use client';

import { useEffect, useState } from 'react';
import { fetchGameStats, type GameStats } from '@/lib/api';

const empty: GameStats = {
  onlinePlayers: 0,
  kingdoms: 0,
  registeredUsers: 0,
  discordMembers: 0
};

export function RealmStats() {
  const [stats, setStats] = useState<GameStats>(empty);

  useEffect(() => {
    let cancelled = false;
    fetchGameStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(empty);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <dl className="realm-stats" aria-label="Estatísticas do reino">
      <div>
        <dt>Jogadores online</dt>
        <dd>{stats.onlinePlayers}</dd>
      </div>
      <div>
        <dt>Reinos</dt>
        <dd>{stats.kingdoms}</dd>
      </div>
      <div>
        <dt>Registos</dt>
        <dd>{stats.registeredUsers}</dd>
      </div>
      <div>
        <dt>Discord</dt>
        <dd>{stats.discordMembers}</dd>
      </div>
    </dl>
  );
}
