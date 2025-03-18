const { Client, GatewayIntentBits } = require('discord.js');

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// Function to send a message to the general channel
async function sendMessageToGeneral() {
  try {
    // Wait for the client to be ready
    console.log('Discord bot is starting...');
    
    // Find the general channel
    const guilds = client.guilds.cache;
    console.log(`Connected to ${guilds.size} guild(s)`);
    
    for (const guild of guilds.values()) {
      console.log(`Looking for general channel in guild: ${guild.name}`);
      
      try {
        // Fetch all channels in the guild
        const channels = await guild.channels.fetch();
        
        // Try to find a channel named "general"
        const generalChannel = channels.find(
          channel => channel.name.toLowerCase() === 'general' && channel.isTextBased()
        );
        
        if (generalChannel) {
          console.log(`Found general channel in ${guild.name}, sending message...`);
          await generalChannel.send('hello world');
          console.log('Message sent successfully!');
        } else {
          console.log(`Could not find general channel in ${guild.name}`);
          
          // List available text channels for debugging
          const textChannels = channels.filter(channel => channel.isTextBased());
          console.log('Available text channels:');
          textChannels.forEach(channel => console.log(`- ${channel.name}`));
        }
      } catch (fetchError) {
        console.error(`Error fetching channels for guild ${guild.name}:`, fetchError);
      }
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Event: When the client is ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  sendMessageToGeneral();
});

// Login to Discord with your bot token
function startBot(token) {
  if (!token) {
    console.error('No Discord bot token provided!');
    return;
  }
  
  console.log('Attempting to log in to Discord...');
  client.login(token)
    .catch(error => {
      console.error('Failed to log in to Discord:', error);
    });
}

module.exports = { startBot };
