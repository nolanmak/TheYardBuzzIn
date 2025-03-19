const { Client, GatewayIntentBits } = require('discord.js');

// Function to send a confirmation message to the general channel
async function sendConfirmationMessage(existingClient) {
  try {
    console.log('Sending door unlock confirmation message...');
    
    // Find the general channel
    const guilds = existingClient.guilds.cache;
    
    for (const guild of guilds.values()) {
      try {
        // Fetch all channels in the guild
        const channels = await guild.channels.fetch();
        
        // Try to find a channel named "general"
        const generalChannel = channels.find(
          channel => channel.name.toLowerCase() === 'general' && channel.isTextBased()
        );
        
        if (generalChannel) {
          // await generalChannel.send('Door has been unlocked successfully! ✅ BUILD something great today!');
          console.log('Confirmation message sent successfully!');
        }
      } catch (fetchError) {
        console.error(`Error fetching channels for guild ${guild.name}:`, fetchError);
      }
    }
  } catch (error) {
    console.error('Error sending confirmation message:', error);
  }
}

// Function to start the bot and send a message
function startBot(token, existingClient = null) {
  if (existingClient) {
    // If an existing client is provided, use it
    sendConfirmationMessage(existingClient);
  } else {
    console.log('This function is now deprecated. Please use the DiscordChannelListener instead.');
  }
}

module.exports = { startBot };
