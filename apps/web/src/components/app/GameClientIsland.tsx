'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments,
  faCube,
  faHouse,
  faStore,
  faTree,
  faMountain,
  faWheatAwn
} from '@fortawesome/free-solid-svg-icons';
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

const STYLE_HREFS = ['/app/css/main.css'];

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
      <div id="game-container">
        <div id="three-js-container" aria-hidden="true" />
        <canvas id="game-canvas" />

        <div id="game-ui">
          <header className="hud-top">
            <div className="hud-top-left">
              <Link href={APP_MENU_PATH} className="game-exit" id="game-menu-link">
                Menu
              </Link>
              <p className="hud-brand">Age of AI</p>
            </div>

            <div id="resources-panel" className="hud-resources">
              <div className="resource" data-resource="food">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={appAsset('/images/icons/wheat.png')} alt="" />
                <div className="resource-meta">
                  <span className="resource-label">Comida</span>
                  <span id="food-count">0</span>
                </div>
              </div>
              <div className="resource" data-resource="wood">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={appAsset('/images/icons/log.png')} alt="" />
                <div className="resource-meta">
                  <span className="resource-label">Madeira</span>
                  <span id="wood-count">0</span>
                </div>
                <button type="button" id="collect-wood" className="resource-action" title="Coletar madeira">
                  <FontAwesomeIcon icon={faTree} aria-hidden />
                  <span>Coletar</span>
                </button>
              </div>
              <div className="resource" data-resource="stone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={appAsset('/images/icons/granite.png')} alt="" />
                <div className="resource-meta">
                  <span className="resource-label">Pedra</span>
                  <span id="stone-count">0</span>
                </div>
                <button type="button" id="collect-stone" className="resource-action" title="Coletar pedra">
                  <FontAwesomeIcon icon={faMountain} aria-hidden />
                  <span>Coletar</span>
                </button>
              </div>
              <div className="resource" data-resource="gold">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={appAsset('/images/icons/gold.png')} alt="" />
                <div className="resource-meta">
                  <span className="resource-label">Ouro</span>
                  <span id="gold-count">0</span>
                </div>
              </div>
              <button type="button" id="build-house" className="hud-build" title="Construir casa">
                <FontAwesomeIcon icon={faHouse} aria-hidden />
                <span>Construir casa</span>
              </button>
            </div>

            <div className="hud-top-right">
              <button type="button" id="toggle-3d-btn" className="hud-chip">
                <FontAwesomeIcon icon={faCube} aria-hidden />
                <span>Alternar 3D</span>
              </button>
            </div>
          </header>

          <aside id="chat-panel" className="hud-chat">
            <div className="hud-panel-head">
              <FontAwesomeIcon icon={faComments} aria-hidden />
              <span>Chat</span>
            </div>
            <div id="chat-messages" />
            <div id="chat-input-container">
              <input type="text" id="chat-input" placeholder="Escreve uma mensagem…" autoComplete="off" />
              <button type="button" id="chat-send">
                Enviar
              </button>
            </div>
          </aside>

          <div id="action-panel" className="hud-actions">
            <div className="hud-panel-head">
              <FontAwesomeIcon icon={faWheatAwn} aria-hidden />
              <span>Ações</span>
            </div>
            <div className="hud-actions-row">
              <button type="button" id="open-store" className="hud-store">
                <FontAwesomeIcon icon={faStore} aria-hidden />
                <span>Loja</span>
              </button>
              <div id="action-buttons" className="hud-dynamic-actions" />
            </div>
          </div>

          <div id="minimap" className="hud-minimap">
            <span className="hud-minimap-label">Mapa</span>
            <canvas id="minimap-canvas" />
          </div>

          <div id="notification-area" />
        </div>
      </div>

      <div id="loading-screen">
        <div className="loader" />
        <p className="hud-loading-brand">Age of AI</p>
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
