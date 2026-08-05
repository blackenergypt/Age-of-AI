'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { RequireAuth } from '@/components/app/RequireAuth';
import { APP_MENU_PATH, APP_STORE_PATH, appAsset, ROUTES } from '@/lib/app-paths';
import '@/components/app/game-page.css';

const SCRIPT_CHAIN = [
  '/app/js/paths.js',
  '/app/js/config.js',
  '/app/js/matchmaking.js',
  '/app/js/utils.js',
  '/app/js/renderer.js',
  '/app/js/input-handler.js',
  '/app/js/ui-manager.js',
  '/app/js/game-client.js',
  '/app/js/main.js'
];

const STYLE_HREFS = ['/app/css/main.css', '/app/css/game.css'];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-game-src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.gameSrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha a carregar ${src}`));
    document.body.appendChild(script);
  });
}

function ensureStyles() {
  for (const href of STYLE_HREFS) {
    if (document.querySelector(`link[data-game-css="${href}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.gameCss = href;
    document.head.appendChild(link);
  }
}

export function GameClientIsland() {
  return (
    <RequireAuth
      fallback={
        <div className="game-page">
          <div id="loading-screen" className="is-visible">
            <div className="loader" />
            <p>A verificar sessão…</p>
            <Link href={ROUTES.login} className="game-back-link">
              Ir ao login
            </Link>
          </div>
        </div>
      }
    >
      <GameBoot />
    </RequireAuth>
  );
}

function GameBoot() {
  const started = useRef(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('A carregar motor do jogo…');

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    window.AGE_BASE_PATH = '';
    window.AGE_API_URL = '';
    window.AGE_ASSET_BASE = '/app';
    ensureStyles();

    let cancelled = false;

    (async () => {
      try {
        setStatus('A carregar Three.js…');
        if (!(window as unknown as { THREE?: unknown }).THREE) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        }
        for (const src of SCRIPT_CHAIN) {
          if (cancelled) return;
          setStatus(`A carregar ${src.split('/').pop()}…`);
          await loadScript(src);
        }

        const openStore = document.getElementById('open-store');
        openStore?.addEventListener('click', () => {
          window.location.href = APP_STORE_PATH;
        });
        setStatus('A ligar ao servidor…');
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao iniciar o jogo');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="game-page">
      <Link href={APP_MENU_PATH} className="game-exit">
        Menu
      </Link>

      <div id="game-container">
        <canvas id="game-canvas" />

        <div id="game-ui">
          <div id="resources-panel">
            <div className="resource">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={appAsset('/images/icons/wheat.png')} alt="Comida" />
              <span id="food-count">0</span>
            </div>
            <div className="resource">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={appAsset('/images/icons/log.png')} alt="Madeira" />
              <span id="wood-count">0</span>
              <button type="button" id="collect-wood">
                Coletar Madeira
              </button>
            </div>
            <div className="resource">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={appAsset('/images/icons/granite.png')} alt="Pedra" />
              <span id="stone-count">0</span>
              <button type="button" id="collect-stone">
                Coletar Pedra
              </button>
            </div>
            <div className="resource">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={appAsset('/images/icons/gold.png')} alt="Ouro" />
              <span id="gold-count">0</span>
            </div>
            <button type="button" id="build-house">
              Construir Casa
            </button>
          </div>

          <div id="minimap">
            <canvas id="minimap-canvas" />
          </div>

          <div id="action-panel">
            <h3>Ações</h3>
            <div id="action-buttons">
              <button type="button" id="open-store" className="btn">
                Abrir Loja
              </button>
            </div>
          </div>

          <div id="chat-panel">
            <div id="chat-messages" />
            <div id="chat-input-container">
              <input type="text" id="chat-input" placeholder="Digite sua mensagem..." />
              <button type="button" id="chat-send">
                Enviar
              </button>
            </div>
          </div>

          <div id="notification-area" />
        </div>
      </div>

      <div id="loading-screen">
        <div className="loader" />
        <p>{error || status}</p>
        {error ? (
          <Link href={APP_MENU_PATH} className="game-back-link">
            Voltar ao menu
          </Link>
        ) : null}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    AGE_BASE_PATH?: string;
    AGE_API_URL?: string;
    AGE_ASSET_BASE?: string;
  }
}
