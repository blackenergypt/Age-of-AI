import Link from 'next/link';
import type { RankEntry } from '@/content/ranks';

function formatScore(n: number) {
  return n.toLocaleString('pt-PT');
}

type RankListProps = {
  entries: RankEntry[];
  className?: string;
};

export function RankList({ entries, className }: RankListProps) {
  return (
    <ol className={className ? `rank-list ${className}` : 'rank-list'}>
      {entries.map((entry) => (
        <li key={entry.place} className={entry.place <= 3 ? 'rank-top' : undefined}>
          <span className="rank-place">{String(entry.place).padStart(2, '0')}</span>
          <div className="rank-who">
            <Link href={`/jogador/${entry.playerSlug}`} className="rank-player">
              {entry.name}
            </Link>
            <Link href={`/reino/${entry.kingdomSlug}`} className="rank-kingdom">
              {entry.kingdom}
            </Link>
          </div>
          <div className="rank-meta">
            <span>{formatScore(entry.score)} pts</span>
            <span>{entry.wins} vitórias</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
