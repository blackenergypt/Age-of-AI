export type GraphicsQuality = 'low' | 'medium' | 'high';

export type GameSettings = {
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: GraphicsQuality;
  showFps: boolean;
  enableShadows: boolean;
  showTutorials: boolean;
  autoSave: boolean;
  cameraSpeed: number;
  muteInBackground: boolean;
};

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  musicVolume: 30,
  sfxVolume: 50,
  graphicsQuality: 'medium',
  showFps: true,
  enableShadows: false,
  showTutorials: true,
  autoSave: true,
  cameraSpeed: 5,
  muteInBackground: true
};

export const GAME_SETTINGS_KEY = 'gameSettings';
export const GAME_SETTINGS_EVENT = 'age-of-ai:settings';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function normalizeGameSettings(raw: Partial<GameSettings> | null | undefined): GameSettings {
  const s = { ...DEFAULT_GAME_SETTINGS, ...(raw || {}) };
  return {
    musicVolume: clamp(Number(s.musicVolume) || 0, 0, 100),
    sfxVolume: clamp(Number(s.sfxVolume) || 0, 0, 100),
    graphicsQuality:
      s.graphicsQuality === 'low' || s.graphicsQuality === 'high' ? s.graphicsQuality : 'medium',
    showFps: !!s.showFps,
    enableShadows: !!s.enableShadows,
    showTutorials: !!s.showTutorials,
    autoSave: !!s.autoSave,
    cameraSpeed: clamp(Number(s.cameraSpeed) || 5, 1, 10),
    muteInBackground: !!s.muteInBackground
  };
}

export function loadGameSettings(): GameSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_GAME_SETTINGS };
  try {
    const raw = localStorage.getItem(GAME_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_GAME_SETTINGS };
    return normalizeGameSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_GAME_SETTINGS };
  }
}

export function saveGameSettings(partial: Partial<GameSettings>): GameSettings {
  const next = normalizeGameSettings({ ...loadGameSettings(), ...partial });
  localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(next));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GAME_SETTINGS_EVENT, { detail: next }));
  }
  applyGameSettings(next);
  return next;
}

export function applyMusicVolume(volumePercent: number) {
  const audio = document.getElementById('site-bg-audio') as HTMLAudioElement | null;
  if (audio) audio.volume = clamp(volumePercent, 0, 100) / 100;
  const gameAudio = document.getElementById('background-music') as HTMLAudioElement | null;
  if (gameAudio) gameAudio.volume = clamp(volumePercent, 0, 100) / 100;
}

export function applyGameSettings(settings: GameSettings = loadGameSettings()) {
  applyMusicVolume(settings.musicVolume);
  document.documentElement.dataset.showFps = settings.showFps ? '1' : '0';
  document.documentElement.dataset.graphicsQuality = settings.graphicsQuality;
  document.documentElement.dataset.enableShadows = settings.enableShadows ? '1' : '0';
  document.documentElement.dataset.cameraSpeed = String(settings.cameraSpeed);
  document.documentElement.dataset.showTutorials = settings.showTutorials ? '1' : '0';
  document.documentElement.dataset.sfxVolume = String(settings.sfxVolume);
}
