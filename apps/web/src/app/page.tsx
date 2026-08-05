import Link from 'next/link';
import { HeroCta } from '@/components/HeroCta';
import { RealmStats } from '@/components/RealmStats';
import { RankingsSection } from '@/components/RankingsSection';
import { BlogSection } from '@/components/BlogSection';
import { SiteNav } from '@/components/SiteNav';

export default function HomePage() {
  return (
    <>
      <SiteNav overlay />
      <main>
        <section className="hero" aria-label="Age of AI">
          <div className="hero-backdrop" aria-hidden="true" />
          <div className="hero-veil" aria-hidden="true" />

          <div className="hero-content">
            <p className="hero-brand animate-in">Age of AI</p>
            <h1 className="hero-headline animate-in delay-1">Construa o seu império</h1>
            <p className="hero-support animate-in delay-2">
              Estratégia em tempo real. Reinos, alianças e guerras num mundo vivo.
            </p>

            <HeroCta />

            <a href="#mundo" className="scroll-hint animate-in delay-4" aria-label="Ver mais">
              <span>Explorar</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </a>
          </div>
        </section>

        <section id="mundo" className="section section-world">
          <div className="section-inner">
            <header className="section-head">
              <h2>Um mundo para conquistar</h2>
              <p>Três caminhos. Uma era.</p>
            </header>

            <div className="pillars">
              <article className="pillar">
                <h3>Reino</h3>
                <p>Colete recursos, ergue estruturas e expande o teu território.</p>
              </article>
              <article className="pillar">
                <h3>Guerra</h3>
                <p>Treina exércitos e decide batalhas com estratégia, não só força.</p>
              </article>
              <article className="pillar">
                <h3>Aliança</h3>
                <p>Une reinos, partilha comércio e domina o mapa em conjunto.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section-realm">
          <div className="section-inner realm-grid">
            <div className="realm-copy">
              <h2>O reino já está vivo</h2>
              <p>Entra no lobby público ou cria uma partida privada com os teus aliados.</p>
              <a
                href="https://discord.gg/rhHhxxP43u"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <svg className="discord-mark" viewBox="0 0 127.14 96.36" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
                  />
                </svg>
                Comunidade no Discord
              </a>
            </div>

            <RealmStats />
          </div>
        </section>

        <RankingsSection />
        <BlogSection />
      </main>

      <footer className="site-footer">
        <div className="footer-links">
          <Link href="/blog">Crónicas</Link>
          <Link href="/ranks">Ranking</Link>
          <Link href="/terms">Termos</Link>
        </div>
        <span>Age of AI</span>
      </footer>
    </>
  );
}
