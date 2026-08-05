'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightFromBracket,
  faChevronDown,
  faGamepad,
  faGear,
  faStore,
  faTrophy,
  faUsers,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import { SoundToggle } from '@/components/SoundToggle';
import { RequireAuth } from '@/components/app/RequireAuth';
import { APP_GAME_PATH, APP_STORE_PATH, ROUTES, appAsset } from '@/lib/app-paths';
import { clearSession, readSession, type AuthUser } from '@/lib/auth-session';
import { setMatchIntent } from '@/lib/match-intent';
import {
  DEFAULT_GAME_SETTINGS,
  loadGameSettings,
  saveGameSettings,
  type GameSettings,
  type GraphicsQuality
} from '@/lib/game-settings';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [privateTab, setPrivateTab] = useState<'create' | 'join'>('create');
  const [settingsTab, setSettingsTab] = useState<'audio' | 'graphics' | 'gameplay'>('audio');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [settingsMsg, setSettingsMsg] = useState('');

  const [gameName, setGameName] = useState('');
  const [gamePassword, setGamePassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  useEffect(() => {
    const session = readSession();
    setUser(session?.user || null);
    setSettings(loadGameSettings());
  }, []);

  useEffect(() => {
    if (modal === 'settings') setSettings(loadGameSettings());
  }, [modal]);

  useEffect(() => {
    if (!modal && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModal(null);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [menuOpen]);

  function logout() {
    clearSession();
    window.location.href = '/';
  }

  function openSettings() {
    setMenuOpen(false);
    setModal('settings');
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

  function updateSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]) {
    const next = saveGameSettings({ [key]: value });
    setSettings(next);
    setSettingsMsg('Guardado');
    window.setTimeout(() => setSettingsMsg(''), 1200);
  }

  function resetSettings() {
    const next = saveGameSettings({ ...DEFAULT_GAME_SETTINGS });
    setSettings(next);
    setSettingsMsg('Predefinições restauradas');
    window.setTimeout(() => setSettingsMsg(''), 1600);
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
              <div className={`app-user-menu${menuOpen ? ' is-open' : ''}`} ref={menuRef}>
                <button
                  type="button"
                  className="app-user-profile"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatar} alt="" className="app-avatar" width={40} height={40} />
                  <div className="app-user-meta">
                    <span className="app-username" title={displayName}>
                      {displayName}
                    </span>
                    <span className="app-user-status">
                      <span className="app-user-dot" aria-hidden="true" />
                      Online
                    </span>
                  </div>
                  <FontAwesomeIcon icon={faChevronDown} className="app-user-caret" aria-hidden />
                </button>

                {menuOpen && (
                  <div className="app-user-dropdown" role="menu">
                    <Link href={ROUTES.menu} role="menuitem" onClick={() => setMenuOpen(false)}>
                      <FontAwesomeIcon icon={faGamepad} aria-hidden />
                      Lobby
                    </Link>
                    <Link href={ROUTES.store} role="menuitem" onClick={() => setMenuOpen(false)}>
                      <FontAwesomeIcon icon={faStore} aria-hidden />
                      Loja
                    </Link>
                    <Link href={ROUTES.ranks} role="menuitem" onClick={() => setMenuOpen(false)}>
                      <FontAwesomeIcon icon={faTrophy} aria-hidden />
                      Ranks
                    </Link>
                    <button type="button" role="menuitem" onClick={openSettings}>
                      <FontAwesomeIcon icon={faGear} aria-hidden />
                      Configurações
                    </button>
                    <div className="app-user-dropdown-sep" role="separator" />
                    <button type="button" role="menuitem" className="is-danger" onClick={logout}>
                      <FontAwesomeIcon icon={faArrowRightFromBracket} aria-hidden />
                      Sair
                    </button>
                  </div>
                )}
              </div>
              <SoundToggle variant="nav" />
            </div>
          </header>

          <main className="app-lobby">
            <section className="app-lobby-hero">
              <p className="app-lobby-kicker">Bem-vindo</p>
              <h1 className="app-lobby-name">{displayName}</h1>
              <p className="app-lobby-lead">O teu reino aguarda. Entra no campo de batalha ou reúne os teus aliados.</p>

              <button type="button" className="app-play" onClick={playOnline}>
                <FontAwesomeIcon icon={faGamepad} aria-hidden />
                <span>
                  <strong>Jogar online</strong>
                  <small>Matchmaking em tempo real</small>
                </span>
              </button>
            </section>

            <nav className="app-lobby-nav" aria-label="Ações do reino">
              <button type="button" className="app-nav-item" onClick={() => setModal('private')}>
                <span className="app-nav-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faUsers} />
                </span>
                <span className="app-nav-copy">
                  <strong>Partida privada</strong>
                  <small>Cria ou entra com amigos</small>
                </span>
              </button>
              <button type="button" className="app-nav-item" onClick={() => setModal('store')}>
                <span className="app-nav-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faStore} />
                </span>
                <span className="app-nav-copy">
                  <strong>Loja</strong>
                  <small>Itens e personalizações</small>
                </span>
              </button>
              <button type="button" className="app-nav-item" onClick={() => setModal('settings')}>
                <span className="app-nav-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faGear} />
                </span>
                <span className="app-nav-copy">
                  <strong>Configurações</strong>
                  <small>Áudio, gráficos e jogabilidade</small>
                </span>
              </button>
            </nav>
          </main>
        </div>
      </div>

      {modal === 'private' && (
        <div
          className="app-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-private-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="app-modal-panel">
            <div className="app-modal-head">
              <div>
                <p className="app-modal-kicker">Multiplayer</p>
                <h2 id="modal-private-title">Partida privada</h2>
              </div>
              <button
                type="button"
                className="app-modal-close"
                aria-label="Fechar"
                onClick={() => setModal(null)}
              >
                <FontAwesomeIcon icon={faXmark} aria-hidden />
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
                    Senha <span className="app-optional">(opcional)</span>
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
        <div
          className="app-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-settings-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="app-modal-panel app-modal-panel-settings">
            <div className="app-modal-head">
              <div>
                <p className="app-modal-kicker">Preferências</p>
                <h2 id="modal-settings-title">Configurações</h2>
              </div>
              <button
                type="button"
                className="app-modal-close"
                aria-label="Fechar"
                onClick={() => setModal(null)}
              >
                <FontAwesomeIcon icon={faXmark} aria-hidden />
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
                    {tab === 'audio' ? 'Áudio' : tab === 'graphics' ? 'Gráficos' : 'Jogo'}
                  </button>
                ))}
              </div>

              {settingsTab === 'audio' && (
                <div className="app-settings">
                  <div className="app-setting">
                    <div className="app-setting-top">
                      <span>Música</span>
                      <strong>{settings.musicVolume}%</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.musicVolume}
                      onChange={(e) => updateSetting('musicVolume', Number(e.target.value))}
                    />
                  </div>
                  <div className="app-setting">
                    <div className="app-setting-top">
                      <span>Efeitos</span>
                      <strong>{settings.sfxVolume}%</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.sfxVolume}
                      onChange={(e) => updateSetting('sfxVolume', Number(e.target.value))}
                    />
                  </div>
                  <label className="app-toggle">
                    <span>
                      <strong>Silenciar em segundo plano</strong>
                      <small>Pausa a música quando sais do separador</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.muteInBackground}
                      onChange={(e) => updateSetting('muteInBackground', e.target.checked)}
                    />
                  </label>
                </div>
              )}

              {settingsTab === 'graphics' && (
                <div className="app-settings">
                  <div className="app-setting">
                    <div className="app-setting-top">
                      <span>Qualidade</span>
                    </div>
                    <div className="app-choice-row" role="group" aria-label="Qualidade gráfica">
                      {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                        <button
                          key={q}
                          type="button"
                          className={settings.graphicsQuality === q ? 'is-active' : ''}
                          onClick={() => updateSetting('graphicsQuality', q)}
                        >
                          {q === 'low' ? 'Baixa' : q === 'medium' ? 'Média' : 'Alta'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="app-toggle">
                    <span>
                      <strong>Mostrar FPS</strong>
                      <small>Contador no canto do jogo</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.showFps}
                      onChange={(e) => updateSetting('showFps', e.target.checked)}
                    />
                  </label>
                  <label className="app-toggle">
                    <span>
                      <strong>Sombras</strong>
                      <small>Mais realismo, mais exigente</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.enableShadows}
                      onChange={(e) => updateSetting('enableShadows', e.target.checked)}
                    />
                  </label>
                </div>
              )}

              {settingsTab === 'gameplay' && (
                <div className="app-settings">
                  <label className="app-toggle">
                    <span>
                      <strong>Tutoriais</strong>
                      <small>Dicas e ajuda no jogo</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.showTutorials}
                      onChange={(e) => updateSetting('showTutorials', e.target.checked)}
                    />
                  </label>
                  <label className="app-toggle">
                    <span>
                      <strong>Guardar automaticamente</strong>
                      <small>Mantém progresso local</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => updateSetting('autoSave', e.target.checked)}
                    />
                  </label>
                  <div className="app-setting">
                    <div className="app-setting-top">
                      <span>Velocidade da câmara</span>
                      <strong>{settings.cameraSpeed}</strong>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={settings.cameraSpeed}
                      onChange={(e) => updateSetting('cameraSpeed', Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              <div className="app-settings-footer">
                {settingsMsg ? <p className="app-ok">{settingsMsg}</p> : <p className="app-muted-inline">Alterações aplicadas de imediato</p>}
                <div className="app-actions">
                  <button type="button" className="app-secondary" onClick={resetSettings}>
                    Restaurar
                  </button>
                  <button type="button" className="app-primary" onClick={() => setModal(null)}>
                    Concluído
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === 'store' && (
        <div
          className="app-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-store-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="app-modal-panel">
            <div className="app-modal-head">
              <div>
                <p className="app-modal-kicker">Comércio</p>
                <h2 id="modal-store-title">Loja</h2>
              </div>
              <button
                type="button"
                className="app-modal-close"
                aria-label="Fechar"
                onClick={() => setModal(null)}
              >
                <FontAwesomeIcon icon={faXmark} aria-hidden />
              </button>
            </div>
            <div className="app-modal-body">
              <p className="app-muted">
                A loja ainda está em desenvolvimento. Abre a página completa para ver os itens disponíveis.
              </p>
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
