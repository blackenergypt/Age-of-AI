function bootAgeOfAiGame() {
    console.log('Página do jogo carregada');

    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
        window.location.href = (typeof agePath==='function'?agePath('/entrar'):'/entrar');
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
        window.location.href = (typeof agePath==='function'?agePath('/entrar'):'/entrar');
        return;
    }

    console.log('Usuário autenticado:', userData.email || userData.nickname || userData.name);

    const backgroundMusic = document.getElementById('background-music');
    function readGameSettings() {
        try {
            const raw = localStorage.getItem('gameSettings');
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    const gameSettings = readGameSettings();
    if (backgroundMusic) {
        backgroundMusic.volume = (gameSettings.musicVolume ?? 30) / 100;
    }
    window.__AGE_GAME_SETTINGS__ = {
        musicVolume: gameSettings.musicVolume ?? 30,
        sfxVolume: gameSettings.sfxVolume ?? 50,
        graphicsQuality: gameSettings.graphicsQuality || 'medium',
        showFps: gameSettings.showFps !== false,
        enableShadows: !!gameSettings.enableShadows,
        showTutorials: gameSettings.showTutorials !== false,
        autoSave: gameSettings.autoSave !== false,
        cameraSpeed: gameSettings.cameraSpeed ?? 5,
        muteInBackground: gameSettings.muteInBackground !== false
    };
    if (window.CONFIG && window.CONFIG.ui) {
        window.CONFIG.ui.showTutorials = window.__AGE_GAME_SETTINGS__.showTutorials;
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

    async function initializeGame() {
        try {
            const gameClient = new GameClient();

            gameClient.playerName = userData.nickname || userData.name || userData.email || 'Jogador';

            const stored = (() => {
                try {
                    const raw = sessionStorage.getItem('ageMatchIntent');
                    if (!raw) return null;
                    sessionStorage.removeItem('ageMatchIntent');
                    return JSON.parse(raw);
                } catch (e) {
                    sessionStorage.removeItem('ageMatchIntent');
                    return null;
                }
            })();

            // Compat: query sem password (password só via sessionStorage)
            const urlParams = new URLSearchParams(window.location.search);
            const gameMode = stored?.mode || urlParams.get('mode') || 'public';
            const gameName = stored?.name || urlParams.get('name');
            const matchId = stored?.matchId || urlParams.get('match');
            const password = stored?.password || null;
            const maxPlayers = stored?.maxPlayers || urlParams.get('max');
            const kingdomName = stored?.kingdomName || urlParams.get('kingdom');

            if (window.location.search) {
                window.history.replaceState({}, '', window.location.pathname);
            }

            if (matchId) {
                gameClient.matchId = matchId;
            }

            if (password) {
                gameClient.matchPassword = password;
            }

            if (kingdomName) {
                gameClient.kingdomName = kingdomName;
            }

            if (maxPlayers) {
                gameClient.maxPlayers = Number(maxPlayers) || 4;
            }

            if (gameMode === 'private' && gameName) {
                gameClient.gameMode = 'private';
                gameClient.gameName = gameName;
            }

            const intent = {
                matchId: matchId || null,
                mode: gameMode === 'private' ? 'private' : 'public',
                name: gameName || null,
                maxPlayers: Number(maxPlayers) || 4,
                password: password || null,
                kingdomName: kingdomName || null
            };

            let assignment = null;
            try {
                if (!window.AgeMatchmaking) {
                    throw new Error('matchmaking.js não carregado');
                }
                assignment = await AgeMatchmaking.resolveMatchmaking(intent);
                console.log('Matchmaking:', assignment.nodeId, assignment.wsUrl, assignment.action);
            } catch (mmError) {
                console.warn('Matchmaking falhou, a usar fallback CONFIG.server.url:', mmError.message);
                if (gameClient.uiManager) {
                    gameClient.uiManager.showNotification(
                        'Matchmaking indisponível — a ligar ao servidor local',
                        'warning',
                        4000
                    );
                }
            }

            gameClient.connectToServer(assignment);
            window.gameClient = gameClient;

            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
            }, 2000);
        } catch (error) {
            console.error('Erro ao inicializar o jogo:', error);
            alert(error.message || 'Ocorreu um erro ao inicializar o jogo. Por favor, recarregue a página.');
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
        const authHeader = () =>
            `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`;

        if (createKingdomButton) {
            createKingdomButton.addEventListener('click', async () => {
                const kingdomName = document.getElementById('kingdom-name')?.value;
                if (kingdomName) {
                    const response = await fetch('/api/create-kingdom', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: authHeader()
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
                            Authorization: authHeader()
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
            if (window.gameClient) {
                window.gameClient.collectResource('wood');
            }
        });
    }

    const collectStoneButton = document.getElementById('collect-stone');
    if (collectStoneButton) {
        collectStoneButton.addEventListener('click', () => {
            if (window.gameClient) {
                window.gameClient.collectResource('stone');
            }
        });
    }

    const buildHouseButton = document.getElementById('build-house');
    if (buildHouseButton) {
        buildHouseButton.addEventListener('click', () => {
            if (window.gameClient) {
                window.gameClient.buildHouse();
            }
        });
    }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAgeOfAiGame);
} else {
  bootAgeOfAiGame();
}
