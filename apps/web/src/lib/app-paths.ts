/** Rotas públicas da app (URLs limpas). */
export const ROUTES = {
  home: '/',
  login: '/entrar',
  register: '/registar',
  forgotPassword: '/recuperar-senha',
  resetPassword: '/redefinir-senha',
  authSuccess: '/auth/success',
  authFailure: '/auth/failure',
  menu: '/menu',
  game: '/jogo',
  store: '/loja',
  blog: '/blog',
  ranks: '/ranks',
  terms: '/terms'
} as const;

/** Assets estáticos do cliente de jogo (Three.js, CSS, imagens). */
export const APP_ASSET_PREFIX = '/app';

export const APP_MENU_PATH = ROUTES.menu;
export const APP_GAME_PATH = ROUTES.game;
export const APP_STORE_PATH = ROUTES.store;
export const APP_PREFIX = APP_ASSET_PREFIX;

export function appAsset(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p.startsWith(`${APP_ASSET_PREFIX}/`) || p === APP_ASSET_PREFIX) return p;
  return `${APP_ASSET_PREFIX}${p}`;
}
