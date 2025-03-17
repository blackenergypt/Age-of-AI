document.addEventListener('DOMContentLoaded', function() {
    console.log('Página do menu carregada');
    
    // Verificar se o usuário está autenticado
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
        // Redirecionar para a página de login se não estiver autenticado
        window.location.href = '/login';
        return;
    }
    
    try {
        // Obter dados do usuário
        const user = JSON.parse(userStr);
        
        // Atualizar nome do usuário
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = user.name || 'Jogador';
        }
        
        // Atualizar avatar do usuário
        const userAvatarElement = document.querySelector('.user-avatar');
        if (userAvatarElement) {
            // Se o usuário tem um avatar (do Discord por exemplo), usar ele
            if (user.avatar) {
                userAvatarElement.src = user.avatar;
            } else {
                userAvatarElement.src = '/images/default-avatar.svg';
            }
            
            // Adicionar tratamento de erro para o avatar
            userAvatarElement.onerror = function() {
                this.src = '/images/default-avatar.svg';
            };
        }
        
        // Configurar botão de logout
        const logoutButton = document.getElementById('logout-btn');
        if (logoutButton) {
            logoutButton.addEventListener('click', function() {
                // Limpar dados de autenticação
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                
                // Redirecionar para a página inicial
                window.location.href = '/';
            });
        }
    } catch (error) {
        console.error('Erro ao processar dados do usuário:', error);
    }
    
    // Configurar áudio do jogo
    const backgroundMusic = document.getElementById('background-music');
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
    
    // Inicializar modais
    initializeModals();
    
    // Inicializar configurações
    initializeSettings();
    
    // Função para inicializar modais
    function initializeModals() {
        // Botões para abrir modais
        const privateGameBtn = document.getElementById('private-game');
        const settingsBtn = document.getElementById('settings');
        const storeBtn = document.getElementById('store');
        
        // Modais
        const privateGameModal = document.getElementById('private-game-modal');
        const settingsModal = document.getElementById('settings-modal');
        const storeModal = document.getElementById('store-modal');
        
        // Botões para fechar modais
        const closeButtons = document.querySelectorAll('.close-modal');
        
        // Abrir modais
        if (privateGameBtn && privateGameModal) {
            privateGameBtn.addEventListener('click', function() {
                openModal('private-game-modal');
            });
        }
        
        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', function() {
                openModal('settings-modal');
            });
        }
        
        if (storeBtn && storeModal) {
            storeBtn.addEventListener('click', function() {
                openModal('store-modal');
            });
        }
        
        // Fechar modais
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Fechar modal ao clicar fora
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
        
        // Inicializar abas
        initializeTabs();
    }
    
    // Função para abrir modal
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    // Função para inicializar abas
    function initializeTabs() {
        // Abas de partida privada
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remover classe active de todos os botões
                tabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Adicionar classe active ao botão clicado
                this.classList.add('active');
                
                // Esconder todos os conteúdos
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Mostrar conteúdo correspondente
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
        
        // Abas de configurações
        const settingsTabs = document.querySelectorAll('.settings-tab');
        const settingsContents = document.querySelectorAll('.settings-content');
        
        settingsTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remover classe active de todas as abas
                settingsTabs.forEach(t => t.classList.remove('active'));
                
                // Adicionar classe active à aba clicada
                this.classList.add('active');
                
                // Esconder todos os conteúdos
                settingsContents.forEach(content => content.classList.remove('active'));
                
                // Mostrar conteúdo correspondente
                const settingsId = this.getAttribute('data-settings');
                document.getElementById(`${settingsId}-settings`).classList.add('active');
            });
        });
    }
    
    // Função para inicializar configurações
    function initializeSettings() {
        // Elementos de configuração
        const musicVolumeSlider = document.getElementById('music-volume');
        const musicVolumeValue = document.getElementById('music-volume-value');
        const sfxVolumeSlider = document.getElementById('sfx-volume');
        const sfxVolumeValue = document.getElementById('sfx-volume-value');
        const graphicsQuality = document.getElementById('graphics-quality');
        const showFps = document.getElementById('show-fps');
        const showTutorials = document.getElementById('show-tutorials');
        const autoSave = document.getElementById('auto-save');
        const saveSettingsBtn = document.getElementById('save-settings');
        
        // Carregar configurações salvas
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                
                // Aplicar configurações salvas
                if (musicVolumeSlider) musicVolumeSlider.value = settings.musicVolume || 30;
                if (musicVolumeValue) musicVolumeValue.textContent = `${settings.musicVolume || 30}%`;
                if (sfxVolumeSlider) sfxVolumeSlider.value = settings.sfxVolume || 50;
                if (sfxVolumeValue) sfxVolumeValue.textContent = `${settings.sfxVolume || 50}%`;
                if (graphicsQuality) graphicsQuality.value = settings.graphicsQuality || 'medium';
                if (showFps) showFps.checked = settings.showFps !== undefined ? settings.showFps : true;
                if (showTutorials) showTutorials.checked = settings.showTutorials !== undefined ? settings.showTutorials : true;
                if (autoSave) autoSave.checked = settings.autoSave !== undefined ? settings.autoSave : true;
                
            } catch (e) {
                console.error('Erro ao analisar configurações salvas:', e);
            }
        }
        
        // Atualizar valor do volume da música
        if (musicVolumeSlider && musicVolumeValue) {
            musicVolumeSlider.addEventListener('input', function() {
                musicVolumeValue.textContent = `${this.value}%`;
                
                // Atualizar volume da música em tempo real
                const backgroundMusic = document.getElementById('background-music');
                if (backgroundMusic) {
                    backgroundMusic.volume = this.value / 100;
                }
            });
        }
        
        // Atualizar valor do volume dos efeitos
        if (sfxVolumeSlider && sfxVolumeValue) {
            sfxVolumeSlider.addEventListener('input', function() {
                sfxVolumeValue.textContent = `${this.value}%`;
            });
        }
        
        // Salvar configurações
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', function() {
                const settings = {
                    musicVolume: musicVolumeSlider ? parseInt(musicVolumeSlider.value) : 30,
                    sfxVolume: sfxVolumeSlider ? parseInt(sfxVolumeSlider.value) : 50,
                    graphicsQuality: graphicsQuality ? graphicsQuality.value : 'medium',
                    showFps: showFps ? showFps.checked : true,
                    showTutorials: showTutorials ? showTutorials.checked : true,
                    autoSave: autoSave ? autoSave.checked : true
                };
                
                // Salvar configurações
                localStorage.setItem('gameSettings', JSON.stringify(settings));
                
                // Fechar modal
                const modal = document.getElementById('settings-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Mostrar mensagem de sucesso
                alert('Configurações salvas com sucesso!');
            });
        }
    }

    // Adicionar event listeners para os botões do menu
    const playOnlineBtn = document.getElementById('play-online');
    if (playOnlineBtn) {
        playOnlineBtn.addEventListener('click', function() {
            console.log('Iniciando jogo online...');
            window.location.href = '/game';
        });
    }

    const storeBtn = document.getElementById('store');
    if (storeBtn) {
        storeBtn.addEventListener('click', function() {
            console.log('Abrindo loja...');
            openModal('store-modal');
        });
    }
});

// Remover a verificação periódica do token que pode estar causando problemas
// setInterval(verifyToken, 5 * 60 * 1000); 