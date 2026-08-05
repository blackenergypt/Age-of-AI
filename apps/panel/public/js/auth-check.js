// Função para verificar se o usuário está autenticado
function checkAuthentication() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (!token || !userStr) {
        console.log('Usuário não autenticado');
        return false;
    }
    
    try {
        // Verificar se os dados do usuário são válidos
        const userData = JSON.parse(userStr);
        if (!userData || !userData.id) {
            console.log('Dados de usuário inválidos');
            return false;
        }
        
        // Verificar se o token não expirou (se possível)
        // Isso requer que o token seja um JWT decodificável no cliente
        
        return true;
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return false;
    }
}

// Função para redirecionar com base na autenticação
function redirectBasedOnAuth(publicPages = ['/login', '/register', '/']) {
    const isAuthenticated = checkAuthentication();
    const currentPath = window.location.pathname;
    
    // Se estiver em uma página pública, não redirecionar se não estiver autenticado
    const isPublicPage = publicPages.some(page => currentPath === page || currentPath.startsWith(page));
    
    if (!isAuthenticated && !isPublicPage) {
        // Não autenticado e não está em uma página pública
        console.log('Redirecionando para login - não autenticado');
        window.location.href = '/login';
        return;
    }
    
    if (isAuthenticated && (currentPath === '/login' || currentPath === '/register')) {
        // Autenticado e está tentando acessar login/registro
        console.log('Redirecionando para menu - já autenticado');
        window.location.href = '/menu';
        return;
    }
}

// Função para verificar o token no servidor
function verifyTokenWithServer() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (!token) {
        return Promise.reject('Token não encontrado');
    }
    
    return fetch('/api/auth/verify-token', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Token inválido');
        }
        return response.json();
    });
}

// Função para limpar dados de autenticação
function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
}

// Exportar funções
window.AuthCheck = {
    check: checkAuthentication,
    redirect: redirectBasedOnAuth,
    verify: verifyTokenWithServer,
    clear: clearAuthData
}; 