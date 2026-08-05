import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { allPlayerSlugs, getPlayer } from '@/content/ranks';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return allPlayerSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const player = getPlayer(slug);
  if (!player) return { title: 'Jogador — Age of AI' };
  return {
    title: `${player.name} — Age of AI`,
    description: player.bio
  };
}

function formatScore(n: number) {
  return n.toLocaleString('pt-PT');
}

export default async function PlayerProfilePage({ params }: Props) {
  const { slug } = await params;
  const player = getPlayer(slug);
  if (!player) notFound();

  return (
    <>
      <SiteNav />
      <main className="page-shell">
        <article className="profile-page">
          <p className="blog-kicker">
            <span>Jogador</span>
            <span>#{String(player.place).padStart(2, '0')} na temporada</span>
          </p>
          <h1>{player.name}</h1>
          <p className="profile-title">{player.title}</p>
          <p className="profile-bio">{player.bio}</p>

          <dl className="profile-stats">
            <div>
              <dt>Pontos</dt>
              <dd>{formatScore(player.score)}</dd>
            </div>
            <div>
              <dt>Vitórias</dt>
              <dd>{player.wins}</dd>
            </div>
            <div>
              <dt>Derrotas</dt>
              <dd>{player.losses}</dd>
            </div>
            <div>
              <dt>Reino</dt>
              <dd>
                <Link href={`/reino/${player.kingdomSlug}`}>{player.kingdom}</Link>
              </dd>
            </div>
          </dl>

          <div className="profile-actions">
            <Link href="/ranks" className="text-link">
              ← Voltar ao ranking
            </Link>
            <Link href={`/reino/${player.kingdomSlug}`} className="text-link">
              Ver reino
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
