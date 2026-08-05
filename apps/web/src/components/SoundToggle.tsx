'use client';

import { useEffect, useRef, useState } from 'react';
import {
  applyGameSettings,
  applyMusicVolume,
  GAME_SETTINGS_EVENT,
  loadGameSettings,
  type GameSettings
} from '@/lib/game-settings';

type SoundToggleProps = {
  variant?: 'floating' | 'nav';
};

export function SoundToggle({ variant = 'floating' }: SoundToggleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const wasPlayingBeforeHide = useRef(false);
  const ownsAudio = variant === 'floating';

  useEffect(() => {
    if (!ownsAudio) return;
    const audio = audioRef.current;
    if (!audio) return;
    applyGameSettings(loadGameSettings());
    audio.pause();
  }, [ownsAudio]);

  useEffect(() => {
    const onSettings = (e: Event) => {
      const detail = (e as CustomEvent<GameSettings>).detail;
      if (detail) applyMusicVolume(detail.musicVolume);
    };
    window.addEventListener(GAME_SETTINGS_EVENT, onSettings);
    return () => window.removeEventListener(GAME_SETTINGS_EVENT, onSettings);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      const audio =
        audioRef.current ||
        (document.getElementById('site-bg-audio') as HTMLAudioElement | null);
      if (!audio) return;
      const settings = loadGameSettings();
      if (!settings.muteInBackground) return;

      if (document.hidden) {
        wasPlayingBeforeHide.current = !audio.paused;
        if (!audio.paused) audio.pause();
      } else if (wasPlayingBeforeHide.current) {
        audio.play().catch(() => undefined);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  async function toggle() {
    const audio =
      audioRef.current ||
      (document.getElementById('site-bg-audio') as HTMLAudioElement | null);
    if (!audio) return;

    applyMusicVolume(loadGameSettings().musicVolume);

    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  useEffect(() => {
    const audio =
      audioRef.current ||
      (document.getElementById('site-bg-audio') as HTMLAudioElement | null);
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    setPlaying(!audio.paused);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  return (
    <>
      {ownsAudio && (
        <audio id="site-bg-audio" ref={audioRef} loop preload="auto">
          <source src="/audio/background-music.wav" type="audio/wav" />
        </audio>
      )}
      <button
        type="button"
        className={`sound-toggle sound-toggle-${variant}`}
        aria-label={playing ? 'Silenciar' : 'Ativar som'}
        onClick={toggle}
      >
        <svg
          className={`sound-svg${playing ? '' : ' is-hidden'}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M11 5L6 9H3v6h3l5 4V5z" />
          <path d="M15.5 8.5a5 5 0 010 7" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M18 6a8 8 0 010 12" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <svg
          className={`sound-svg${playing ? ' is-hidden' : ''}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M11 5L6 9H3v6h3l5 4V5z" />
          <path d="M18 9l-6 6M12 9l6 6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </button>
    </>
  );
}
