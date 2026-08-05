const fetch = require('node-fetch');
const config = require('../config');

// Função para obter o número de membros do Discord
async function getDiscordMembersCount() {
    try {
        // Você precisará de um token de bot do Discord e o ID do servidor
        const response = await fetch(`https://discord.com/api/v9/guilds/${config.discord.guildId}?with_counts=true`, {
            headers: {
                Authorization: `Bot ${config.discord.botToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro na API do Discord: ${response.status}`);
        }
        
        const data = await response.json();
        return data.approximate_member_count || 0;
    } catch (error) {
        console.error('Erro ao obter contagem de membros do Discord:', error);
        return 0;
    }
}

module.exports = {
    getDiscordMembersCount
}; 