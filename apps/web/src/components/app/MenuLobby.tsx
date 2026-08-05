'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { SoundToggle } from '@/components/SoundToggle';
import { RequireAuth } from '@/components/app/RequireAuth';
import { APP_GAME_PATH, APP_STORE_PATH, appAsset } from '@/lib/app-paths';
import { clearSession, readSession, type AuthUser } from '@/lib/auth-session';
import { setMatchIntent } from '@/lib/match-intent';
import '@/components/app/app-shell.css';

type Modal = 'private' | 'settings' | 'store' | null;

export function MenuLobby() {
  return (
    <RequireAuth>
      <MenuLobbyInner />
    </RequireAuth>
  );
}

function MenuLobbyInner() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [privateTab, setPrivateTab] = useState<'create' | 'join'>('create');
  const [settingsTab, setSettingsTab] = useState<'audio' | 'graphics' | 'gameplay'>('audio');

  const [gameName, setGameName] = useState('');
  const [gamePassword, setGamePassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const [musicVolume, setMusicVolume] = useState(30);
  const [sfxVolume, setSfxVolume] = useState(50);
  const [graphicsQuality, setGraphicsQuality] = useState('medium');
  const [showFps, setShowFps] = useState(true);
  const [enableShadows, setEnableShadows] = useState(false);
  const [showTutorials, setShowTutorials] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [cameraSpeed, setCameraSpeed] = useState(5);
  const [muteBackground, setMuteBackground] = useState(true);
  const [settingsMsg, setSettingsMsg] = useState('');

  useEffect(() => {
    const session = readSession();
    setUser(session?.user || null);
    try {
      const raw = localStorage.getItem('gameSettings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.musicVolume != null) setMusicVolume(s.musicVolume);
      if (s.sfxVolume != null) setSfxVolume(s.sfxVolume);
      if (s.graphicsQuality) setGraphicsQuality(s.graphicsQuality);
      if (s.showFps != null) setShowFps(!!s.showFps);
      if (s.enableShadows != null) setEnableShadows(!!s.enableShadows);
      if (s.showTutorials != null) setShowTutorials(!!s.showTutorials);
      if (s.autoSave != null) setAutoSave(!!s.autoSave);
      if (s.cameraSpeed != null) setCameraSpeed(s.cameraSpeed);
      if (s.muteInBackground != null) setMuteBackground(!!s.muteInBackground);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  function logout() {
    clearSession();
    window.location.href = '/';
  }

  function playOnline() {
    setMatchIntent({ mode: 'public' });
    window.location.href = APP_GAME_PATH;
  }

  function createPrivate(e: FormEvent) {
    e.preventDefault();
    if (!gameName.trim()) {
      alert('Escolhe um nome para a partida.');
      return;
    }
    setMatchIntent({
      mode: 'private',
      name: gameName.trim(),
      maxPlayers: Number(maxPlayers) || 4,
      password: gamePassword || null
    });
    window.location.href = APP_GAME_PATH;
  }

  function joinPrivate(e: FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) {
      alert('Introduz o código da partida.');
      return;
    }
    setMatchIntent({
      mode: 'private',
      matchId: joinCode.trim().toUpperCase(),
      password: joinPassword || null
    });
    window.location.href = APP_GAME_PATH;
  }

  function saveSettings() {
    const settings = {
      musicVolume,
      sfxVolume,
      graphicsQuality,
      showFps,
      enableShadows,
      showTutorials,
      autoSave,
      cameraSpeed,
      muteInBackground: muteBackground
    };
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    setSettingsMsg('Configurações guardadas.');
    setTimeout(() => setSettingsMsg(''), 2000);
  }

  const displayName = user?.nickname || user?.name || user?.email || 'Jogador';
  const avatar =
    typeof user?.avatar === 'string' && user.avatar
      ? user.avatar
      : appAsset('/images/default-avatar.svg');

  return (
    <div className="app-page">
      <div className="app-bg" aria-hidden="true" />
      <div className="app-screen">
        <div className="app-shell">
          <header className="app-header">
            <Link href="/" className="app-brand">
              Age of AI
            </Link>
            <div className="app-user">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar} alt="" className="app-avatar" width={40} height={40} />
              <span className="app-username">{displayName}</span>
              <button type="button" className="app-chip" onClick={logout}>
                Sair
              </button>
              <SoundToggle variant="nav" />
            </div>
          </header>

          <div className="app-hero">
            <h1>O teu reino</h1>
            <p>Escolhe como queres entrar no mundo.</p>
          </div>

          <div className="app-grid">
            <button type="button" className="app-card" onClick={playOnline}>
              <span className="app-card-title">Jogar online</span>
              <span className="app-card-desc">Matchmaking com jogadores em tempo real</span>
            </button>
            <button type="button" className="app-card" onClick={() => setModal('private')}>
              <span className="app-card-title">Partida privada</span>
              <span className="app-card-desc">Cria ou entra com amigos</span>
            </button>
            <button type="button" className="app-card" onClick={() => setModal('store')}>
              <span className="app-card-title">Loja</span>
              <span className="app-card-desc">Itens e personalizações</span>
            </button>
            <button type="button" className="app-card" onClick={() => setModal('settings')}>
              <span className="app-card-title">Configurações</span>
              <span className="app-card-desc">Áudio, gráficos e jogabilidade</span>
            </button>
          </div>
        </div>
      </div>

      {modal === 'private' && (
        <div className="app-modal" role="dialog" aria-modal="true">
          <div className="app-modal-panel">
            <div className="app-modal-head">
              <h2>Partida privada</h2>
              <button type="button" className="app-modal-close" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className="app-modal-body">
              <div className="app-tabs">
                <button
                  type="button"
                  className={privateTab === 'create' ? 'is-active' : ''}
                  onClick={() => setPrivateTab('create')}
                >
                  Criar
                </button>
                <button
                  type="button"
                  className={privateTab === 'join' ? 'is-active' : ''}
                  onClick={() => setPrivateTab('join')}
                >
                  Entrar
                </button>
              </div>

              {privateTab === 'create' ? (
                <form onSubmit={createPrivate} className="app-form">
                  <label>
                    Nome
                    <input value={gameName} onChange={(e) => setGameName(e.target.value)} required />
                  </label>
                  <label>
                    Senha (opcional)
                    <input
                      type="password"
                      value={gamePassword}
                      onChange={(e) => setGamePassword(e.target.value)}
                    />
                  </label>
                  <label>
                    Jogadores
                    <select value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)}>
                      <option value="2">2</option>
                      <option value="4">4</option>
                      <option value="6">6</option>
                      <option value="8">8</option>
                    </select>
                  </label>
                  <button type="submit" className="app-primary">
                    Criar partida
                  </button>
                </form>
              ) : (
                <form onSubmit={joinPrivate} className="app-form">
                  <label>
                    Código
                    <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required />
                  </label>
                  <label>
                    Senha
                    <input
                      type="password"
                      value={joinPassword}
                      onChange={(e) => setJoinPassword(e.target.value)}
                    />
                  </label>
                  <button type="submit" className="app-primary">
                    Entrar
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {modal === 'settings' && (
        <div className="app-modal" role="dialog" aria-modal="true">
          <div className="app-modal-panel">
            <div className="app-modal-head">
              <h2>Configurações</h2>
              <button type="button" className="app-modal-close" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className="app-modal-body">
              <div className="app-tabs">
                {(['audio', 'graphics', 'gameplay'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={settingsTab === tab ? 'is-active' : ''}
                    onClick={() => setSettingsTab(tab)}
                  >
                    {tab === 'audio' ? 'Áudio' : tab === 'graphics' ? 'Gráficos' : 'Jogabilidade'}
                  </button>
                ))}
              </div>

              {settingsTab === 'audio' && (
                <div className="app-form">
                  <label>
                    Música ({musicVolume}%)
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={musicVolume}
                      onChange={(e) => setMusicVolume(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Efeitos ({sfxVolume}%)
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sfxVolume}
                      onChange={(e) => setSfxVolume(Number(e.target.value))}
                    />
                  </label>
                  <label className="app-check">
                    <input
                      type="checkbox"
                      checked={muteBackground}
                      onChange={(e) => setMuteBackground(e.target.checked)}
                    />
                    Silenciar em segundo plano
                  </label>
                </div>
              )}

              {settingsTab === 'graphics' && (
                <div className="app-form">
                  <label>
                    Qualidade
                    <select
                      value={graphicsQuality}
                      onChange={(e) => setGraphicsQuality(e.target.value)}
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </select>
                  </label>
                  <label className="app-check">
                    <input type="checkbox" checked={showFps} onChange={(e) => setShowFps(e.target.checked)} />
                    Mostrar FPS
                  </label>
                  <label className="app-check">
                    <input
                      type="checkbox"
                      checked={enableShadows}
                      onChange={(e) => setEnableShadows(e.target.checked)}
                    />
                    Sombras
                  </label>
                </div>
              )}

              {settingsTab === 'gameplay' && (
                <div className="app-form">
                  <label className="app-check">
                    <input
                      type="checkbox"
                      checked={showTutorials}
                      onChange={(e) => setShowTutorials(e.target.checked)}
                    />
                    Tutoriais
                  </label>
                  <label className="app-check">
                    <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
                    Guardar automaticamente
                  </label>
                  <label>
                    Velocidade da câmara ({cameraSpeed})
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={cameraSpeed}
                      onChange={(e) => setCameraSpeed(Number(e.target.value))}
                    />
                  </label>
                </div>
              )}

              {settingsMsg && <p className="app-ok">{settingsMsg}</p>}
              <div className="app-actions">
                <button type="button" className="app-primary" onClick={saveSettings}>
                  Guardar
                </button>
                <button type="button" className="app-secondary" onClick={() => setModal(null)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === 'store' && (
        <div className="app-modal" role="dialog" aria-modal="true">
          <div className="app-modal-panel">
            <div className="app-modal-head">
              <h2>Loja</h2>
              <button type="button" className="app-modal-close" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className="app-modal-body">
              <p className="app-muted">Loja em desenvolvimento. Abre a página completa para ver itens.</p>
              <div className="app-actions">
                <Link href={APP_STORE_PATH} className="app-primary">
                  Ir à loja
                </Link>
                <button type="button" className="app-secondary" onClick={() => setModal(null)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
