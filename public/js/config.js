// Configurações do jogo
const CONFIG = {
    // Configurações gerais
    game: {
        version: '1.0.0',
        name: 'Age of AI',
        fps: 60,
        debug: false
    },
    
    // Configurações do servidor
    server: {
        url: window.location.hostname === 'localhost' ? 'ws://localhost:3000' : 'wss://' + window.location.host,
        reconnectInterval: 3000,
        maxReconnectAttempts: 5
    },
    
    // Configurações do mundo
    world: {
        tileSize: 32,
        chunkSize: 16,
        viewDistance: 3,
        dayNightCycle: true,
        dayLength: 600 // em segundos
    },
    
    // Configurações de recursos
    resources: {
        types: ['food', 'wood', 'stone', 'gold'],
        initialAmount: {
            food: 100,
            wood: 100,
            stone: 50,
            gold: 20
        }
    },
    
    // Configurações de unidades
    units: {
        types: ['villager', 'warrior', 'archer', 'cavalry'],
        stats: {
            villager: {
                health: 25,
                attack: 3,
                defense: 0,
                speed: 1.0,
                buildPower: 1.0,
                gatherPower: 1.0,
                cost: {
                    food: 50,
                    wood: 0,
                    stone: 0,
                    gold: 0
                }
            },
            warrior: {
                health: 60,
                attack: 7,
                defense: 2,
                speed: 0.8,
                cost: {
                    food: 60,
                    wood: 0,
                    stone: 0,
                    gold: 20
                }
            },
            archer: {
                health: 35,
                attack: 5,
                defense: 0,
                speed: 1.0,
                range: 5,
                cost: {
                    food: 40,
                    wood: 30,
                    stone: 0,
                    gold: 10
                }
            },
            cavalry: {
                health: 100,
                attack: 10,
                defense: 3,
                speed: 1.5,
                cost: {
                    food: 80,
                    wood: 0,
                    stone: 0,
                    gold: 30
                }
            }
        }
    },
    
    // Configurações de edifícios
    buildings: {
        types: ['townCenter', 'house', 'barracks', 'farm', 'lumberCamp', 'stoneMine', 'goldMine'],
        stats: {
            townCenter: {
                health: 1000,
                size: [4, 4],
                buildTime: 0,
                cost: {
                    food: 0,
                    wood: 0,
                    stone: 0,
                    gold: 0
                }
            },
            house: {
                health: 200,
                size: [2, 2],
                buildTime: 30,
                population: 5,
                cost: {
                    food: 0,
                    wood: 30,
                    stone: 0,
                    gold: 0
                }
            },
            barracks: {
                health: 500,
                size: [3, 3],
                buildTime: 60,
                cost: {
                    food: 0,
                    wood: 150,
                    stone: 50,
                    gold: 0
                }
            },
            farm: {
                health: 100,
                size: [3, 3],
                buildTime: 45,
                resourceGeneration: {
                    food: 0.5
                },
                cost: {
                    food: 0,
                    wood: 60,
                    stone: 0,
                    gold: 0
                }
            },
            lumberCamp: {
                health: 150,
                size: [2, 2],
                buildTime: 40,
                gatherBonus: {
                    wood: 0.2
                },
                cost: {
                    food: 0,
                    wood: 100,
                    stone: 0,
                    gold: 0
                }
            },
            stoneMine: {
                health: 200,
                size: [2, 2],
                buildTime: 40,
                gatherBonus: {
                    stone: 0.2
                },
                cost: {
                    food: 0,
                    wood: 100,
                    stone: 0,
                    gold: 0
                }
            },
            goldMine: {
                health: 200,
                size: [2, 2],
                buildTime: 40,
                gatherBonus: {
                    gold: 0.2
                },
                cost: {
                    food: 0,
                    wood: 100,
                    stone: 0,
                    gold: 0
                }
            }
        }
    },
    
    // Configurações de áudio
    audio: {
        music: {
            volume: 0.3,
            tracks: ['main-theme', 'battle', 'peaceful']
        },
        sfx: {
            volume: 0.5,
            categories: ['ui', 'combat', 'building', 'ambient']
        }
    },
    
    // Configurações de interface
    ui: {
        minimap: {
            size: 200,
            zoom: 0.1
        },
        tooltips: true,
        showTutorials: true
    }
}; 