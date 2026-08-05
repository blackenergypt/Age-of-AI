import Link from 'next/link';
import { RankList } from '@/components/RankList';
import { seasonRanks } from '@/content/ranks';

export function RankingsSection() {
  const { season, updatedLabel, entries } = seasonRanks;

  return (
    <section id="ranks" className="section section-ranks">
      <div className="section-inner">
        <header className="section-head section-head-row">
          <div>
            <h2>Ranking da temporada</h2>
            <p>
              {season}. {updatedLabel}.
            </p>
          </div>
          <Link href="/ranks" className="text-link">
            Ver ranking completo
          </Link>
        </header>

        <RankList entries={entries.slice(0, 5)} />
      </div>
    </section>
  );
}
