// Sistema de autenticação simplificado
(function() {
    // Variáveis para armazenar o estado de autenticação
    let isAuthenticated = false;
    let currentUser = null;
    let authToken = null;
    
    // Função para verificar se o usuário está autenticado
    function checkAuth() {
        // Tentar obter o token e dados do usuário do armazenamento
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        
        if (!token || !userStr) {
            console.log('Nenhum token ou dados de usuário encontrados');
            return false;
        }
        
        try {
            // Analisar os dados do usuário
            const userData = JSON.parse(userStr);
            
            // Verificar se os dados do usuário são válidos
            if (!userData || !userData.id) {
                console.log('Dados de usuário inválidos');
                return false;
            }
            
            // Armazenar os dados de autenticação
            isAuthenticated = true;
            currentUser = userData;
            authToken = token;
            
            return true;
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            return false;
        }
    }
    
    // Função para obter o usuário atual
    function getCurrentUser() {
        if (!isAuthenticated) {
            checkAuth();
        }
        return currentUser;
    }
    
    // Função para limpar os dados de autenticação
    function logout() {
        // Limpar dados do armazenamento
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        
        // Redefinir variáveis
        isAuthenticated = false;
        currentUser = null;
        authToken = null;
        
        // Redirecionar para a página de login
        window.location.href = '/login';
    }
    
    // Verificar autenticação ao carregar
    checkAuth();
    
    // Expor funções para uso global
    window.AuthSystem = {
        isAuthenticated: function() {
            return isAuthenticated || checkAuth();
        },
        getUser: getCurrentUser,
        logout: logout,
        getToken: function() {
            return authToken;
        }
    };
})(); 