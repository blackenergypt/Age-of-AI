const Resource = require('../entities/resource');
const { v4: uuidv4 } = require('uuid');
const BiomeSystem = require('./biomes');

class ResourceSystem {
    constructor() {
        this.resources = new Map();
        this.regenerationRules = {
            wood: {
                rate: 10,
                interval: 300,
                conditions: (tile) => tile.biomeType === 'forest' || tile.biomeType === 'highland_forest'
            },
            berries: {
                rate: 5,
                interval: 180,
                conditions: (tile) => tile.biomeType === 'forest' || tile.biomeType === 'plains'
            },
            game: {
                rate: 8,
                interval: 240,
                conditions: (tile) => tile.biomeType !== 'ocean' && tile.biomeType !== 'desert'
            }
        };
    }

    getResourceProperties(type) {
        const resourceProps = {
            wood: { amount: 500, harvestRate: 10 },
            food: { amount: 500, harvestRate: 12 },
            stone: { amount: 400, harvestRate: 8 },
            gold: { amount: 300, harvestRate: 5 },
            iron: { amount: 350, harvestRate: 7 },
            coal: { amount: 400, harvestRate: 8 },
            fish: { amount: 450, harvestRate: 10 },
            pearls: { amount: 200, harvestRate: 3 },
            salt: { amount: 350, harvestRate: 7 },
            clay: { amount: 400, harvestRate: 8 },
            berries: { amount: 300, harvestRate: 15 },
            game: { amount: 350, harvestRate: 8 },
            cattle: { amount: 300, harvestRate: 7 },
            horses: { amount: 250, harvestRate: 5 },
            coconut: { amount: 300, harvestRate: 8 },
            fruits: { amount: 400, harvestRate: 10 },
            herbs: { amount: 300, harvestRate: 6 },
            exotic_wood: { amount: 350, harvestRate: 5 },
            fur: { amount: 300, harvestRate: 6 },
            gems: { amount: 200, harvestRate: 3 },
            silver: { amount: 250, harvestRate: 4 },
            rare_herbs: { amount: 200, harvestRate: 3 }
        };
        
        return resourceProps[type] || { amount: 300, harvestRate: 5 };
    }

    addResourceAt(x, y, type) {
        const resourceId = uuidv4();
        const resourceProps = this.getResourceProperties(type);
        
        const resource = new Resource(
            resourceId,
            x,
            y,
            type,
            resourceProps.amount,
            resourceProps.harvestRate
        );
        
        this.resources.set(resourceId, resource);
        return resource;
    }

    distributeResources(biomes, terrainGrid) {
        const biomeResources = new BiomeSystem().getBiomeResources();
        
        for (const [biomeType, locations] of biomes.entries()) {
            if (!biomeResources[biomeType]) continue;
            
            const resourceTypes = biomeResources[biomeType];
            const resourceCount = Math.floor(locations.length * 0.05);
            
            for (let i = 0; i < resourceCount; i++) {
                const locationIndex = Math.floor(Math.random() * locations.length);
                const location = locations[locationIndex];
                const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
                
                this.addResourceAt(location.x, location.y, resourceType);
            }
        }
    }
}

module.exports = ResourceSystem; 