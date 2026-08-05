import Link from 'next/link';
import { blogPosts, getFeaturedPost } from '@/content/blog';

export function BlogSection() {
  const featured = getFeaturedPost();
  const others = blogPosts.filter((p) => p.slug !== featured.slug).slice(0, 3);

  return (
    <section id="cronicas" className="section section-blog">
      <div className="section-inner">
        <header className="section-head section-head-row">
          <div>
            <h2>Crónicas</h2>
            <p>Notícias, guias e notas do reino.</p>
          </div>
          <Link href="/blog" className="text-link">
            Ver todas
          </Link>
        </header>

        <article className="blog-featured">
          <p className="blog-kicker">
            <span>{featured.category}</span>
            <time dateTime={featured.date}>{featured.dateLabel}</time>
          </p>
          <h3>
            <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
          </h3>
          <p>{featured.excerpt}</p>
          <Link href={`/blog/${featured.slug}`} className="text-link">
            Ler crónica
          </Link>
        </article>

        <ul className="blog-list">
          {others.map((post) => (
            <li key={post.slug}>
              <p className="blog-kicker">
                <span>{post.category}</span>
                <time dateTime={post.date}>{post.dateLabel}</time>
              </p>
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              <p>{post.excerpt}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
