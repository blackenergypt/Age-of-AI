// Sistema de autenticação simplificado - solução para o problema de redirecionamento
console.log('Auth solution loaded');

// Função para verificar se o usuário está autenticado
function isUserAuthenticated() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return !!token; // Retorna true se o token existir, false caso contrário
}

// Função para obter o usuário atual
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

// Função para fazer logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
}

// Expor funções globalmente
window.AuthSolution = {
    isAuthenticated: isUserAuthenticated,
    getUser: getCurrentUser,
    logout: logout
};

// Verificar a página atual e redirecionar se necessário
(function() {
    const currentPath = window.location.pathname;
    const isAuthenticated = isUserAuthenticated();
    
    console.log('Current path:', currentPath);
    console.log('Is authenticated:', isAuthenticated);
    
    // Páginas que requerem autenticação
    const protectedPages = ['/menu', '/game'];
    
    // Páginas de autenticação
    const authPages = ['/login', '/register'];
    
    // Se estiver em uma página protegida e não estiver autenticado
    if (protectedPages.some(page => currentPath === page || currentPath.endsWith(page + '.html'))) {
        if (!isAuthenticated) {
            console.log('Redirecionando para login - acesso não autorizado');
            window.location.href = '/login';
        }
    }
    
    // Se estiver em uma página de autenticação e já estiver autenticado
    if (authPages.some(page => currentPath === page || currentPath.endsWith(page + '.html'))) {
        if (isAuthenticated) {
            console.log('Redirecionando para menu - já autenticado');
            window.location.href = '/menu';
        }
    }
})(); 