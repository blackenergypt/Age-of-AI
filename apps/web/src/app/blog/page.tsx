import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { blogPosts } from '@/content/blog';

export const metadata: Metadata = {
  title: 'Crónicas — Age of AI',
  description: 'Notícias, guias e notas do reino Age of AI.'
};

export default function BlogIndexPage() {
  return (
    <>
      <SiteNav />
      <main className="page-shell">
        <header className="page-hero">
          <h1>Crónicas</h1>
          <p>Actualizações, estratégias e o pulso do reino.</p>
        </header>

        <ul className="blog-index">
          {blogPosts.map((post) => (
            <li key={post.slug}>
              <p className="blog-kicker">
                <span>{post.category}</span>
                <time dateTime={post.date}>{post.dateLabel}</time>
              </p>
              <h2>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p>{post.excerpt}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
