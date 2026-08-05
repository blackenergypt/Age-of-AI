import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { allKingdomSlugs, getKingdom } from '@/content/ranks';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return allKingdomSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const kingdom = getKingdom(slug);
  if (!kingdom) return { title: 'Reino — Age of AI' };
  return {
    title: `${kingdom.name} — Age of AI`,
    description: kingdom.bio
  };
}

function formatScore(n: number) {
  return n.toLocaleString('pt-PT');
}

export default async function KingdomProfilePage({ params }: Props) {
  const { slug } = await params;
  const kingdom = getKingdom(slug);
  if (!kingdom) notFound();

  return (
    <>
      <SiteNav />
      <main className="page-shell">
        <article className="profile-page">
          <p className="blog-kicker">
            <span>Reino</span>
            <span>{kingdom.region}</span>
          </p>
          <h1>{kingdom.name}</h1>
          <p className="profile-title">“{kingdom.motto}”</p>
          <p className="profile-bio">{kingdom.bio}</p>

          <dl className="profile-stats">
            <div>
              <dt>Posição</dt>
              <dd>#{String(kingdom.place).padStart(2, '0')}</dd>
            </div>
            <div>
              <dt>Pontos</dt>
              <dd>{formatScore(kingdom.score)}</dd>
            </div>
            <div>
              <dt>Membros</dt>
              <dd>{kingdom.members}</dd>
            </div>
            <div>
              <dt>Líder</dt>
              <dd>
                <Link href={`/jogador/${kingdom.leaderSlug}`}>{kingdom.leader}</Link>
              </dd>
            </div>
          </dl>

          <div className="profile-actions">
            <Link href="/ranks" className="text-link">
              ← Voltar ao ranking
            </Link>
            <Link href={`/jogador/${kingdom.leaderSlug}`} className="text-link">
              Ver líder
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
