document.addEventListener('DOMContentLoaded', function() {
    console.log('Página do jogo carregada');
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    let userData;
    try {
        userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
        if (!userData) {
            throw new Error('Dados do usuário inválidos');
        }
    } catch (e) {
        console.error('Erro ao analisar dados do usuário:', e);
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return;
    }
    
    console.log('Usuário autenticado:', userData.email || userData.nickname || userData.name);
    
    const backgroundMusic = document.getElementById('background-music');
    if (backgroundMusic) {
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            backgroundMusic.volume = (settings.musicVolume || 30) / 100;
        } else {
            backgroundMusic.volume = 0.3;
        }
    }
    
    if (typeof GameClient === 'undefined') {
        console.error('GameClient não está definido. Verifique se o arquivo game-client.js foi carregado corretamente.');
        
        const script = document.createElement('script');
        script.src = 'js/game-client.js';
        script.onload = function() {
            console.log('game-client.js carregado com sucesso.');
            if (typeof GameClient !== 'undefined') {
                initializeGame();
            } else {
                console.error('GameClient ainda não está definido após carregar o arquivo.');
                alert('Erro ao inicializar o jogo. Por favor, recarregue a página.');
            }
        };
        script.onerror = function() {
            console.error('Falha ao carregar game-client.js');
            alert('Erro ao carregar recursos do jogo. Por favor, recarregue a página.');
        };
        document.body.appendChild(script);
        return;
    }
    
    initializeGame();
    
    function initializeGame() {
        try {
            const gameClient = new GameClient();
            
            gameClient.playerName = userData.nickname || userData.name || userData.email || 'Jogador';
            
            const urlParams = new URLSearchParams(window.location.search);
            const gameMode = urlParams.get('mode');
            const gameName = urlParams.get('name');
            
            if (gameMode === 'private' && gameName) {
                gameClient.gameMode = 'private';
                gameClient.gameName = gameName;
            }
            
            gameClient.connectToServer();
            window.gameClient = gameClient;
            
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
            }, 2000);
        } catch (error) {
            console.error('Erro ao inicializar o jogo:', error);
            alert('Ocorreu um erro ao inicializar o jogo. Por favor, recarregue a página.');
        }
    }

    const playButton = document.getElementById('play-button');
    const kingdomModal = document.getElementById('kingdom-modal');
    
    if (playButton && kingdomModal) {
        const closeModalButton = document.getElementById('close-modal');
        
        playButton.addEventListener('click', () => {
            kingdomModal.style.display = 'block';
        });

        if (closeModalButton) {
            closeModalButton.addEventListener('click', () => {
                kingdomModal.style.display = 'none';
            });
        }

        const createKingdomButton = document.getElementById('create-kingdom-button');
        const joinKingdomButton = document.getElementById('join-kingdom-button');

        if (createKingdomButton) {
            createKingdomButton.addEventListener('click', async () => {
                const kingdomName = document.getElementById('kingdom-name')?.value;
                if (kingdomName) {
                    const response = await fetch('/api/create-kingdom', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({ name: kingdomName })
                    });

                    if (response.ok) {
                        const newKingdom = await response.json();
                        alert(`Reino "${newKingdom.name}" criado com sucesso!`);
                        kingdomModal.style.display = 'none';
                    } else {
                        const error = await response.json();
                        alert(`Erro ao criar reino: ${error.message}`);
                    }
                }
            });
        }

        if (joinKingdomButton) {
            joinKingdomButton.addEventListener('click', async () => {
                const kingdomId = document.getElementById('join-kingdom-id')?.value;
                if (kingdomId) {
                    const response = await fetch('/api/join-kingdom', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({ kingdomId })
                    });

                    if (response.ok) {
                        alert('Você se juntou ao reino com sucesso!');
                        kingdomModal.style.display = 'none';
                    } else {
                        const error = await response.json();
                        alert(`Erro ao se juntar ao reino: ${error.message}`);
                    }
                }
            });
        }
    }

    const collectWoodButton = document.getElementById('collect-wood');
    if (collectWoodButton) {
        collectWoodButton.addEventListener('click', () => {
            // Lógica para coletar madeira
            if (window.gameClient) {
                window.gameClient.collectResource('wood');
            }
        });
    }

    const buildHouseButton = document.getElementById('build-house');
    if (buildHouseButton) {
        buildHouseButton.addEventListener('click', () => {
            // Lógica para construir uma casa
            if (window.gameClient) {
                window.gameClient.buildHouse();
            }
        });
    }
});