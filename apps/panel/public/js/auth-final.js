console.log('Auth final solution loaded');

function go(path) {
  const target = typeof window.agePath === 'function' ? window.agePath(path) : path;
  window.location.href = target;
}

function normalizePath(pathname) {
  const base = (window.AGE_BASE_PATH || '').replace(/\/$/, '');
  if (base && pathname.startsWith(base)) {
    return pathname.slice(base.length) || '/';
  }
  if (pathname.startsWith('/app/')) {
    return pathname.slice(4) || '/';
  }
  return pathname;
}

function isUserAuthenticated() {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  return !!token;
}

function getCurrentUser() {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Erro ao analisar dados do usuário:', e);
    return null;
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');
  go('/login');
}

window.Auth = {
  isAuthenticated: isUserAuthenticated,
  getUser: getCurrentUser,
  logout: logout
};

(function () {
  const currentPath = normalizePath(window.location.pathname);
  const isAuthenticated = isUserAuthenticated();
  const protectedPages = ['/menu', '/game', '/store'];
  const authPages = ['/login', '/register'];

  if (protectedPages.some((page) => currentPath === page || currentPath.endsWith(page + '.html'))) {
    if (!isAuthenticated) go('/login');
  }

  if (authPages.some((page) => currentPath === page || window.location.pathname === page)) {
    if (isAuthenticated) go('/menu');
  }
})();
