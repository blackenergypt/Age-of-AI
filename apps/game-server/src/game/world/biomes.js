const { createNoise2D } = require('simplex-noise');
// Remover dependências desnecessárias
// const { createCanvas } = require('canvas');
// const THREE = require('three');

class BiomeSystem {
    constructor() {
        this.noise2D = createNoise2D(() => 42);
        this.biomes = new Map();
        // Remover configuração do ambiente global
        // global.document = { createElement: () => createCanvas(800, 600) };
        // global.window = { innerWidth: 800, innerHeight: 600 };
        // global.requestAnimationFrame = callback => setTimeout(callback, 1000 / 60);
    }

    determineBiomeType(elevation, moisture) {
        if (elevation < 0.2) return 'ocean';
        if (elevation < 0.3) return 'beach';
        
        if (elevation > 0.8) {
            if (moisture > 0.6) return 'snow_mountain';
            return 'mountain';
        }
        
        if (elevation > 0.6) {
            if (moisture > 0.7) return 'highland_forest';
            if (moisture > 0.4) return 'hills';
            return 'rocky_hills';
        }
        
        if (moisture > 0.8) return 'swamp';
        if (moisture > 0.6) return 'forest';
        if (moisture > 0.4) return 'plains';
        if (moisture > 0.2) return 'savanna';
        return 'desert';
    }

    getBiomeResources() {
        return {
            ocean: ['fish', 'pearls', 'salt'],
            beach: ['salt', 'clay', 'coconut'],
            forest: ['wood', 'berries', 'game', 'herbs'],
            highland_forest: ['wood', 'game', 'rare_herbs'],
            plains: ['food', 'cattle', 'horses'],
            savanna: ['food', 'exotic_wood', 'game'],
            desert: ['gold', 'gems', 'stone'],
            mountain: ['stone', 'iron', 'coal'],
            snow_mountain: ['silver', 'gems', 'fur'],
            swamp: ['herbs', 'rare_herbs', 'clay'],
            hills: ['stone', 'iron', 'clay'],
            rocky_hills: ['stone', 'gold', 'gems']
        };
    }

    generateBiomes(terrainGrid, width, height) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const moisture = this.generatePerlinNoise(x, y, 0.003);
                terrainGrid[y][x].moisture = moisture;
                
                const elevation = terrainGrid[y][x].elevation;
                const biomeType = this.determineBiomeType(elevation, moisture);
                terrainGrid[y][x].biomeType = biomeType;
                
                if (!this.biomes.has(biomeType)) {
                    this.biomes.set(biomeType, []);
                }
                this.biomes.get(biomeType).push({x, y});
            }
        }
        return terrainGrid;
    }

    generatePerlinNoise(x, y, scale) {
        return (this.noise2D(x * scale, y * scale) + 1) / 2;
    }
}

module.exports = BiomeSystem; 