/**
 * Paths do panel:
 * - Auth na raiz: /login, /register, /auth/success
 * - App: /app/menu, /app/game (gateway) ou /menu (standalone :8081)
 */
(function () {
  const base = typeof window.AGE_BASE_PATH === 'string' ? window.AGE_BASE_PATH.replace(/\/$/, '') : '';
  const assetBase = typeof window.AGE_ASSET_BASE === 'string' ? window.AGE_ASSET_BASE.replace(/\/$/, '') : '';

  const ROOT_AUTH = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/success',
    '/auth/failure'
  ];

  function isAuthPath(pathname) {
    const clean = (pathname || '').split('?')[0];
    return ROOT_AUTH.some((p) => clean === p);
  }

  /** Prefixo das rotas autenticadas (menu/game/store). */
  function appPrefix() {
    if (base) return base;
    // Auth servido pelo gateway com assets em /app
    if (assetBase) return assetBase;
    return '';
  }

  function agePath(path) {
    if (!path) {
      const prefix = appPrefix();
      return prefix ? `${prefix}/menu` : '/menu';
    }
    if (/^https?:\/\//i.test(path)) return path;
    const p = path.startsWith('/') ? path : `/${path}`;
    if (p === '/') return '/';
    if (isAuthPath(p)) return p;
    return `${appPrefix()}${p}`;
  }

  function getApiBase() {
    if (typeof window.AGE_API_URL === 'string') return window.AGE_API_URL.replace(/\/$/, '');
    if (window.CONFIG?.api?.baseUrl) return window.CONFIG.api.baseUrl.replace(/\/$/, '');
    if (base || assetBase || isAuthPath(window.location.pathname)) return '';
    if (!window.location.port || window.location.port === '80' || window.location.port === '443') return '';
    return 'http://localhost:3001';
  }

  window.agePath = agePath;
  window.getApiBase = getApiBase;
  window.AGE_BASE_PATH = base;
  window.AGE_AUTH_PATHS = ROOT_AUTH;
})();
