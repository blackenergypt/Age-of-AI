document.addEventListener('DOMContentLoaded', function() {
    console.log('Página inicial carregada');
    
    // Configurar áudio do jogo
    const backgroundMusic = document.getElementById('background-music');
    
    // Verificar se o elemento existe antes de definir o volume
    if (backgroundMusic) {
        // Carregar configurações de áudio
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                backgroundMusic.volume = (settings.musicVolume || 30) / 100;
            } catch (e) {
                console.error('Erro ao analisar configurações de áudio:', e);
                backgroundMusic.volume = 0.3; // 30% do volume máximo
            }
        } else {
            backgroundMusic.volume = 0.3; // 30% do volume máximo
        }
    }
    
    // Botão de alternar som
    const toggleSoundBtn = document.getElementById('toggle-sound');
    const soundIcon = document.getElementById('sound-icon');
    
    if (toggleSoundBtn && soundIcon && backgroundMusic) {
        toggleSoundBtn.addEventListener('click', function() {
            if (backgroundMusic.paused) {
                backgroundMusic.play();
                soundIcon.textContent = '🔊';
            } else {
                backgroundMusic.pause();
                soundIcon.textContent = '🔇';
            }
        });
    }
    
    // Verificar se o usuário está autenticado (apenas para atualizar a UI, não para redirecionar)
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && userStr) {
        try {
            const userData = JSON.parse(userStr);
            if (userData) {
                console.log('Usuário autenticado:', userData.email || userData.nickname || userData.name);
                
                // Atualizar a UI para mostrar que o usuário está logado
                const loginBtn = document.getElementById('login-btn');
                const accountBtn = document.getElementById('account-btn');
                
                if (loginBtn) loginBtn.style.display = 'none';
                if (accountBtn) {
                    accountBtn.style.display = 'inline-block';
                    accountBtn.textContent = userData.nickname || userData.name || 'Minha Conta';
                }
            }
        } catch (e) {
            console.error('Erro ao analisar dados do usuário:', e);
        }
    }
    
    // Definir valores padrão para estatísticas
    setDefaultStats();
    
    // Tentar carregar estatísticas do jogo
    fetchGameStats();
    
    // Função para definir valores padrão para estatísticas
    function setDefaultStats() {
        document.getElementById('online-players-welcome').textContent = '0';
        document.getElementById('kingdoms-count-welcome').textContent = '0';
        document.getElementById('registered-users-count').textContent = '0';
        document.getElementById('discord-members-count').textContent = '0';
    }
    
    // Função para buscar estatísticas do jogo
    async function fetchGameStats() {
        try {
            const response = await fetch('/api/stats');
            console.log('Fetching stats from /api/stats'); // Log para verificar a requisição
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const stats = await response.json();
            
            // Atualizar estatísticas na tela com dados reais da API
            document.getElementById('online-players-welcome').textContent = stats.onlinePlayers;
            document.getElementById('kingdoms-count-welcome').textContent = stats.kingdoms;
            document.getElementById('registered-users-count').textContent = stats.registeredUsers;
            document.getElementById('discord-members-count').textContent = stats.discordMembers;
        } catch (error) {
            console.error('Error fetching game stats:', error);
            // Em caso de erro, definir valores padrão
            setDefaultStats();
        }
    }
});