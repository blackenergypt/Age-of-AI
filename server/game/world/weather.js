class WeatherSystem {
    constructor() {
        this.weather = {
            type: 'clear',
            intensity: 0,
            duration: 0,
            effects: {}
        };

        this.weatherTypes = {
            clear: {
                resourceMultiplier: 1,
                movementMultiplier: 1
            },
            rain: {
                resourceMultiplier: 0.8,
                movementMultiplier: 0.9,
                effects: {
                    moisture: 0.2
                }
            },
            storm: {
                resourceMultiplier: 0.6,
                movementMultiplier: 0.7,
                effects: {
                    moisture: 0.4,
                    damage: 1
                }
            },
            drought: {
                resourceMultiplier: 0.5,
                movementMultiplier: 1,
                effects: {
                    moisture: -0.3
                }
            }
        };
    }

    update(deltaTime, terrainGrid, entities) {
        this.weather.duration -= deltaTime;

        if (this.weather.duration <= 0) {
            this.generateNewWeather();
        }

        this.applyWeatherEffects(deltaTime, terrainGrid, entities);
    }

    generateNewWeather() {
        const weatherTypes = Object.keys(this.weatherTypes);
        const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        
        this.weather = {
            type: newWeather,
            intensity: Math.random() * 0.5 + 0.5,
            duration: Math.random() * 600 + 300,
            effects: this.weatherTypes[newWeather].effects || {}
        };
    }

    applyWeatherEffects(deltaTime, terrainGrid, entities) {
        if (this.weather.effects.moisture) {
            this.applyMoistureEffects(deltaTime, terrainGrid);
        }

        if (this.weather.effects.damage) {
            this.applyWeatherDamage(deltaTime, entities);
        }
    }

    // Método para aplicar efeitos de umidade ao terreno
    applyMoistureEffects(deltaTime, terrainGrid) {
        const moistureEffect = this.weather.effects.moisture * this.weather.intensity;
        const affectedRows = Math.min(terrainGrid.length, 100); // Limitar para não processar o mapa inteiro de uma vez
        
        // Selecionar linhas aleatórias para aplicar o efeito
        for (let i = 0; i < affectedRows; i++) {
            const rowIndex = Math.floor(Math.random() * terrainGrid.length);
            const row = terrainGrid[rowIndex];
            
            if (row) {
                const affectedTiles = Math.min(row.length, 100);
                for (let j = 0; j < affectedTiles; j++) {
                    const tileIndex = Math.floor(Math.random() * row.length);
                    const tile = row[tileIndex];
                    
                    if (tile) {
                        // Ajustar a umidade do terreno
                        tile.moisture = Math.max(0, Math.min(1, tile.moisture + moistureEffect * (deltaTime / 10000)));
                        
                        // Atualizar o tipo de bioma se a umidade mudar significativamente
                        if (Math.abs(moistureEffect) > 0.3) {
                            // Em uma implementação real, você pode querer chamar this.biomeSystem.determineBiomeType
                            // para atualizar o bioma com base na nova umidade
                        }
                    }
                }
            }
        }
    }
    
    // Método para aplicar danos de clima às entidades
    applyWeatherDamage(deltaTime, entities) {
        const damageAmount = this.weather.effects.damage * this.weather.intensity * (deltaTime / 1000);
        
        // Aplicar dano a entidades vulneráveis ao clima
        for (const entity of entities.values()) {
            if (entity.type === 'unit' || entity.type === 'building') {
                // Verificar se a entidade está em uma área protegida
                const isProtected = entity.hasEffect('weather_protection');
                
                if (!isProtected) {
                    // Em uma implementação real, você pode querer chamar entity.takeDamage(damageAmount)
                    if (entity.health) {
                        entity.health = Math.max(0, entity.health - damageAmount);
                    }
                }
            }
        }
    }

    getWeatherInfo() {
        return {
            type: this.weather.type,
            intensity: this.weather.intensity,
            duration: this.weather.duration
        };
    }
}

module.exports = WeatherSystem; 