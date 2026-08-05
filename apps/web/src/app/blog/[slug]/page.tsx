import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { blogPosts, getPost } from '@/content/blog';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Crónica — Age of AI' };
  return {
    title: `${post.title} — Age of AI`,
    description: post.excerpt
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <>
      <SiteNav />
      <main className="page-shell">
        <article className="blog-article">
          <p className="blog-kicker">
            <span>{post.category}</span>
            <time dateTime={post.date}>{post.dateLabel}</time>
          </p>
          <h1>{post.title}</h1>
          {post.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
          <Link href="/blog" className="text-link">
            ← Todas as crónicas
          </Link>
        </article>
      </main>
    </>
  );
}
