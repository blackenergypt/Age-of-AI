/**
 * Paths do cliente de jogo:
 * - Páginas: /entrar, /menu, /jogo, /loja (sem prefixo)
 * - Assets estáticos: /app/js, /app/images, …
 */
(function () {
  const assetBase =
    (typeof window.AGE_ASSET_BASE === 'string' && window.AGE_ASSET_BASE.replace(/\/$/, '')) ||
    '/app';

  const ROOT_AUTH = [
    '/entrar',
    '/registar',
    '/recuperar-senha',
    '/redefinir-senha',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/success',
    '/auth/failure'
  ];

  const PAGE_ALIASES = {
    '/login': '/entrar',
    '/register': '/registar',
    '/forgot-password': '/recuperar-senha',
    '/reset-password': '/redefinir-senha',
    '/menu': '/menu',
    '/game': '/jogo',
    '/store': '/loja',
    '/jogo': '/jogo',
    '/loja': '/loja'
  };

  function isAuthPath(pathname) {
    const clean = (pathname || '').split('?')[0];
    return ROOT_AUTH.some((p) => clean === p || clean.startsWith(p + '/'));
  }

  function agePath(path) {
    if (!path) return '/menu';
    if (/^https?:\/\//i.test(path)) return path;
    let p = path.startsWith('/') ? path : `/${path}`;
    if (p === '/') return '/';
    if (PAGE_ALIASES[p]) p = PAGE_ALIASES[p];
    if (isAuthPath(p)) return p;
    // rotas de app sem prefixo /app
    if (p === '/menu' || p === '/jogo' || p === '/loja') return p;
    return p;
  }

  function ageAsset(path) {
    if (!path) return path;
    if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
    const p = path.startsWith('/') ? path : `/${path}`;
    if (p.startsWith(assetBase + '/') || p === assetBase) return p;
    return `${assetBase}${p}`;
  }

  function getApiBase() {
    if (typeof window.AGE_API_URL === 'string') return window.AGE_API_URL.replace(/\/$/, '');
    if (window.CONFIG?.api?.baseUrl) return window.CONFIG.api.baseUrl.replace(/\/$/, '');
    if (!window.location.port || window.location.port === '80' || window.location.port === '443') return '';
    return 'http://localhost:3001';
  }

  window.agePath = agePath;
  window.ageAsset = ageAsset;
  window.getApiBase = getApiBase;
  window.AGE_AUTH_PATHS = ROOT_AUTH;
})();
