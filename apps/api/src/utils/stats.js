const User = require('../models/user');
const { Client, GatewayIntentBits } = require('discord.js');
const config = require('../config');
const { isDatabaseConnected } = require('../database');

async function getRegisteredUsersCount() {
  try {
    if (!isDatabaseConnected() || !User) {
      return 0;
    }
    return await User.countDocuments();
  } catch (error) {
    console.error('Error getting registered users count:', error.message);
    return 0;
  }
}

async function getDiscordMembersCount() {
  try {
    if (!config.discord.botToken || !config.discord.guildId) {
      return 0;
    }

    const client = new Client({
      intents: [GatewayIntentBits.Guilds]
    });

    await client.login(config.discord.botToken);
    const guild = await client.guilds.fetch(config.discord.guildId);
    const memberCount = guild.memberCount;

    await client.destroy();
    return memberCount;
  } catch (error) {
    console.error('Error getting Discord members count:', error.message);
    return 0;
  }
}

module.exports = {
  getRegisteredUsersCount,
  getDiscordMembersCount
};
