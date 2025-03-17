// Solução para problemas de sessão e redirecionamento
console.log('Session fix loaded');

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
window.Session = {
    isAuthenticated: isUserAuthenticated,
    getUser: getCurrentUser,
    logout: logout
};

// Verificar a página atual e redirecionar se necessário
(function() {
    const currentPath = window.location.pathname;
    
    // Se for a página 404, não fazer nada
    if (currentPath === '/404.html' || currentPath === '/404') {
        return;
    }
    
    const isAuthenticated = isUserAuthenticated();
    
    console.log('Current path:', currentPath);
    console.log('Is authenticated:', isAuthenticated);
    
    // Páginas que requerem autenticação
    const protectedPages = ['/menu', '/game'];
    
    // Páginas de autenticação
    const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
    
    // Se estiver em uma página protegida e não estiver autenticado
    if (protectedPages.some(page => currentPath === page || currentPath.endsWith(page + '.html'))) {
        if (!isAuthenticated) {
            console.log('Redirecionando para login - acesso não autorizado');
            window.location.href = '/login';
        }
    }
    
    // Se estiver em uma página de autenticação e já estiver autenticado
    if (authPages.some(page => currentPath === page || currentPath.endsWith(page + '.html'))) {
        // Não redirecionar se estiver na página de recuperação de senha ou redefinição de senha
        if (currentPath === '/forgot-password' || currentPath === '/forgot-password.html' ||
            currentPath === '/reset-password' || currentPath === '/reset-password.html') {
            return;
        }
        
        if (isAuthenticated) {
            console.log('Redirecionando para menu - já autenticado');
            window.location.href = '/menu';
        }
    }
})();

// Verificar periodicamente se o token ainda é válido
setInterval(function() {
    if (isUserAuthenticated()) {
        fetch('/api/auth/verify-token', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Token inválido');
            }
            return response.json();
        })
        .then(data => {
            console.log('Token verificado com sucesso');
        })
        .catch(error => {
            console.error('Erro ao verificar token:', error);
            // Não fazer logout automaticamente para evitar problemas
        });
    }
}, 5 * 60 * 1000); // Verificar a cada 5 minutos 