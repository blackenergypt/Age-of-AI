const { createNoise2D } = require('simplex-noise');

class TerrainSystem {
    constructor() {
        this.noise2D = createNoise2D(() => 42);
    }

    generateTerrain(width, height) {
        const terrainGrid = new Array(height);
        for (let y = 0; y < height; y++) {
            terrainGrid[y] = new Array(width);
            for (let x = 0; x < width; x++) {
                const elevation = this.generatePerlinNoise(x, y, 0.005);
                terrainGrid[y][x] = {
                    elevation,
                    moisture: 0,
                    biomeType: null,
                    passable: elevation > 0.2,
                    temperature: 0
                };
            }
        }
        return terrainGrid;
    }

    generatePerlinNoise(x, y, scale) {
        return (this.noise2D(x * scale, y * scale) + 1) / 2;
    }

    getTerrainData(terrainGrid, width, height) {
        const terrainData = [];
        const sampleRate = 4;
        
        for (let y = 0; y < height; y += sampleRate) {
            const row = [];
            for (let x = 0; x < width; x += sampleRate) {
                if (terrainGrid[y] && terrainGrid[y][x]) {
                    row.push({
                        biomeType: terrainGrid[y][x].biomeType,
                        passable: terrainGrid[y][x].passable,
                        x,
                        y
                    });
                }
            }
            terrainData.push(row);
        }
        return terrainData;
    }
}

module.exports = TerrainSystem; 