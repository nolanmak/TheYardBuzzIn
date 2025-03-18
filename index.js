const { unlockDoor } = require('./UnlockDoor');
const { startBot } = require('./DiscordBot');
require('dotenv').config();

// Run the functions
unlockDoor();

// Start the Discord bot with the token from .env
console.log('Starting Discord bot...');
startBot(process.env.DISCORD_BOT_TOKEN);
