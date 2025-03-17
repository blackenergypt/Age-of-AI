const { User } = require('../models/user');
const { Client, GatewayIntentBits } = require('discord.js');
const config = require('../config');

async function getRegisteredUsersCount() {
  try {
    const count = await User.countDocuments();
    return count;
  } catch (error) {
    console.error('Error getting registered users count:', error);
    return 0;
  }
}

async function getDiscordMembersCount() {
  try {
    const client = new Client({ 
      intents: [GatewayIntentBits.Guilds]
    });

    await client.login(config.discord.botToken);
    const guild = await client.guilds.fetch(config.discord.guildId);
    const memberCount = guild.memberCount;
    
    await client.destroy();
    return memberCount;
  } catch (error) {
    console.error('Error getting Discord members count:', error);
    return 0;
  }
}

module.exports = {
  getRegisteredUsersCount,
  getDiscordMembersCount
};