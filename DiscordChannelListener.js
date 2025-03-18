/**
 * Discord Channel Listener
 * 
 * This module creates a Discord bot that listens for messages in channels
 * and triggers the door unlocking process when specific commands or phrases are detected.
 * 
 * The bot requires the MESSAGE_CONTENT intent to be enabled in the Discord Developer Portal.
 * 
 * @module DiscordChannelListener
 */

const { Client, GatewayIntentBits, Events } = require('discord.js');
const { unlockDoor } = require('./UnlockDoor');
const { startBot } = require('./DiscordBot');

// Create a new Discord client with necessary intents
// Note: The MESSAGE_CONTENT intent is now enabled in the Discord Developer Portal
// https://discord.com/developers/applications
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // Now enabled in the Discord Developer Portal
  ]
});

// Set up error handling for the client
client.on('error', error => {
  console.error('Discord client error:', error);
});

client.on('warn', warning => {
  console.warn('Discord client warning:', warning);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

/**
 * Starts the Discord channel listener
 * 
 * This function initializes the Discord client, sets up event handlers,
 * and starts listening for messages in all channels the bot has access to.
 * 
 * @param {string} token - The Discord bot token
 * @returns {void}
 */
function startDiscordChannelListener(token) {
  if (!token) {
    console.error('No Discord bot token provided!');
    return;
  }
  
  console.log('Starting Discord channel listener...');
  
  // Event: When the client is ready
  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('Listening for messages in all channels...');
    
    // Check if we have the MESSAGE_CONTENT intent
    const hasMessageContent = (client.options.intents & GatewayIntentBits.MessageContent) === GatewayIntentBits.MessageContent;
    
    if (!hasMessageContent) {
      console.warn('\nWARNING: MESSAGE_CONTENT intent is not enabled.');
      console.warn('The bot will only respond to commands prefixed with "!unlock" or "!buzz"');
      console.warn('For full functionality, please enable the MESSAGE_CONTENT intent in the Discord Developer Portal.\n');
    } else {
      console.log('MESSAGE_CONTENT intent is enabled. The bot will respond to all messages.');
    }
    
    // Check bot permissions in all guilds
    client.guilds.cache.forEach(guild => {
      console.log(`\nChecking permissions in guild: ${guild.name}`);
      
      try {
        // Get the bot's member object in this guild
        const botMember = guild.members.cache.get(client.user.id);
        
        if (botMember) {
          console.log('Bot is a member of this guild');
          
          // List all channels the bot can see
          console.log('Channels the bot can see:');
          guild.channels.cache
            .filter(channel => channel.type === 0) // 0 is text channel
            .forEach(channel => {
              try {
                console.log(`- ${channel.name}`);
              } catch (error) {
                console.error(`Error checking channel: ${error.message}`);
              }
            });
        } else {
          console.log('Could not find bot member in this guild');
        }
      } catch (error) {
        console.error(`Error checking guild permissions: ${error.message}`);
      }
    });
  });
  
  // Event: When a message is received
  client.on('messageCreate', async (message) => {
    try {
      // Ignore messages from bots (including our own bot)
      if (message.author.bot) {
        return;
      }
      
      console.log(`Received message from ${message.author.username} in ${message.channel.name}`);
      
      // Check if we have access to message content
      const hasMessageContent = (client.options.intents & GatewayIntentBits.MessageContent) === GatewayIntentBits.MessageContent;
      const hasContent = message.content !== undefined && message.content !== null;
      
      // Now that we have the MESSAGE_CONTENT intent enabled, we can be more selective
      // about which messages trigger the door unlock
      console.log(`Message content: ${message.content}`);
      const lowerContent = message.content.toLowerCase();
      
      // Check for debug command first
      if (lowerContent === '!debug') {
        try {
          const debugInfo = {
            botUsername: client.user.username,
            botID: client.user.id,
            guildName: message.guild ? message.guild.name : 'DM',
            channelName: message.channel.name,
            authorUsername: message.author.username,
            authorID: message.author.id,
            messageContent: message.content,
            hasMessageContentIntent: hasMessageContent,
            intents: {
              guilds: (client.options.intents & GatewayIntentBits.Guilds) === GatewayIntentBits.Guilds,
              guildMessages: (client.options.intents & GatewayIntentBits.GuildMessages) === GatewayIntentBits.GuildMessages,
              messageContent: hasMessageContent
            }
          };
          
          await message.reply(`Debug info: \`\`\`json\n${JSON.stringify(debugInfo, null, 2)}\n\`\`\``);
          console.log('Debug command executed');
          return;
        } catch (error) {
          console.error('Error processing debug command:', error);
        }
      }
      
      // Check for specific unlock commands
      if (lowerContent.startsWith('!unlock') || lowerContent.startsWith('!buzz')) {
        // Command prefixed with ! - explicit command
        console.log('Explicit unlock command detected');
        await processUnlockCommand(message, token);
        return;
      }
      
      // Check for common phrases that should trigger the door unlock
      const unlockPhrases = [
        'buzz me in',
        'buzz in',
        'unlock the door',
        'open the door',
        'let me in',
        'i\'m here',
        'i am here',
        'i\'m at the door',
        'i am at the door',
        'at the door'
      ];
      
      // Check if the message contains any of the unlock phrases
      for (const phrase of unlockPhrases) {
        if (lowerContent.includes(phrase)) {
          console.log(`Unlock phrase detected: "${phrase}"`);
          await processUnlockCommand(message, token);
          return;
        }
      }
      
      // Single word commands
      if (lowerContent === 'buzz' || lowerContent === 'unlock' || lowerContent === 'open') {
        console.log('Single word unlock command detected');
        await processUnlockCommand(message, token);
        return;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  /**
   * Helper function to process unlock commands
   * 
   * This function handles the door unlocking process when a command is detected.
   * It responds to the message, calls the unlockDoor function, and sends a confirmation message.
   * 
   * @param {Object} message - The Discord message object
   * @param {string} token - The Discord bot token
   * @returns {Promise<void>}
   */
  async function processUnlockCommand(message, token) {
    console.log('Unlock command detected! Preparing to unlock door...');
    
    try {
      // Respond to the message
      await message.reply('Unlocking the door for you! Please wait...');
      
      // Call the unlockDoor function and wait for it to complete
      console.log('Triggering door unlock...');
      try {
        // Use await to ensure we wait for the door unlock process to complete
        await new Promise((resolve, reject) => {
          try {
            // Call unlockDoor and set a timeout to ensure we don't wait forever
            unlockDoor();
            
            // Wait 45 seconds for the door unlock process to complete before sending confirmation
            // This gives Chrome time to start, load the page, and click the buttons
            setTimeout(resolve, 45000);
          } catch (err) {
            reject(err);
          }
        });
        
        // Send a confirmation message using the DiscordBot after waiting
        console.log('Door unlock process completed. Sending confirmation message...');
        try {
          startBot(token, client);
          
          // Also send a direct confirmation in this channel
          await message.channel.send('✅ Door unlock process completed! The door should now be unlocked.');
        } catch (botError) {
          console.error('Error sending confirmation message:', botError);
          await message.channel.send('Door should be unlocked, but there was an error sending the confirmation message.');
        }
      } catch (unlockError) {
        console.error('Error unlocking door:', unlockError);
        await message.reply('Sorry, there was an error unlocking the door. Please try again or contact support.');
        return;
      }
    } catch (error) {
      console.error('Error processing unlock command:', error);
      try {
        await message.channel.send('Sorry, there was an error processing your command. Please try again later.');
      } catch (replyError) {
        console.error('Error sending error message:', replyError);
      }
    }
  }
  
  // Login to Discord with the token
  client.login(token)
    .catch(error => {
      console.error('Failed to log in to Discord:', error);
      
      if (error.message.includes('disallowed intents')) {
        console.error('\nERROR: You need to enable the MESSAGE_CONTENT intent in the Discord Developer Portal.');
        console.error('Please visit https://discord.com/developers/applications');
        console.error('1. Select your application');
        console.error('2. Go to the "Bot" tab');
        console.error('3. Scroll down to "Privileged Gateway Intents"');
        console.error('4. Enable "MESSAGE CONTENT INTENT"');
        console.error('5. Save changes and restart this application\n');
      }
    });
}

module.exports = { startDiscordChannelListener };
