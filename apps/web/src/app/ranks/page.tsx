import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { RankList } from '@/components/RankList';
import { seasonRanks } from '@/content/ranks';
import { ROUTES } from '@/lib/app-paths';

export const metadata: Metadata = {
  title: 'Ranking — Age of AI',
  description: 'Ranking da temporada Age of AI.'
};

export default function RanksPage() {
  const { season, updatedLabel, entries } = seasonRanks;

  return (
    <>
      <SiteNav />
      <main className="page-shell">
        <header className="page-hero">
          <h1>Ranking</h1>
          <p>
            {season}. {updatedLabel}.
          </p>
        </header>

        <RankList entries={entries} className="rank-list-full" />

        <p className="rank-note">
          Ranking editorial da Temporada I — será ligado a dados reais quando a persistência de
          partidas estiver activa.{' '}
          <Link href={ROUTES.login} className="text-link">
            Entra e sobe
          </Link>
        </p>
      </main>
    </>
  );
}
