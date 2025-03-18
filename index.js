require('dotenv').config();
const { startDiscordChannelListener } = require('./DiscordChannelListener');

// Start the Discord channel listener with the token from .env
console.log('Starting Discord channel listener...');
startDiscordChannelListener(process.env.DISCORD_BOT_TOKEN);
