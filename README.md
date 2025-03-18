# TheYardBuzzIn

A Discord bot that listens for messages and automatically unlocks the door at The Yard coworking space.

## Features

- **Discord Message Listener**: Monitors Discord channels for door unlock requests
- **Automatic Door Unlocking**: Uses Puppeteer to automate the door unlocking process via the Kisi dashboard
- **Confirmation Messages**: Sends confirmation messages back to Discord when the door has been unlocked

## Project Structure

- `index.js`: Main entry point that starts the Discord channel listener
- `DiscordChannelListener.js`: Listens for messages in Discord channels and triggers the door unlock process
- `UnlockDoor.js`: Contains the logic for unlocking the door via the Kisi dashboard
- `DiscordBot.js`: Handles sending confirmation messages to Discord

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A Discord bot token with appropriate permissions
- Google Chrome installed

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following content:
   ```
   DISCORD_BOT_TOKEN=your_discord_bot_token
   ```

### Discord Bot Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to the "Bot" tab
4. Under "Privileged Gateway Intents", enable the following intents:
   - MESSAGE CONTENT INTENT
5. Save your changes

## Usage

### Running the Bot

```
node index.js
```

### Running as a Background Service

You can use the included start.sh script to run the bot as a background service using PM2:

```
./start.sh
```

This will install PM2 if it's not already installed, start the bot, and configure it to start automatically on system boot.

### Commands

The bot responds to the following commands and phrases in any Discord channel it has access to:

#### Explicit Commands
- `!unlock`: Triggers the door unlock process
- `!buzz`: Alternative command to trigger the door unlock process

#### Single Word Commands
- `buzz`: Triggers the door unlock process
- `unlock`: Triggers the door unlock process
- `open`: Triggers the door unlock process

#### Phrases
The bot also recognizes common phrases like:
- "buzz me in"
- "unlock the door"
- "open the door"
- "let me in"
- "I'm here"
- "I'm at the door"

#### Debug Command
- `!debug`: Displays debug information about the bot and the current message

## Troubleshooting

### Missing Intents

If you see a warning about missing intents, follow these steps:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to the "Bot" tab
4. Under "Privileged Gateway Intents", enable the "MESSAGE CONTENT INTENT"
5. Save your changes and restart the bot

### Chrome Issues

If the bot has trouble connecting to Chrome, make sure:

1. Google Chrome is installed at the default location
2. There are no existing Chrome processes using port 9222
3. The bot has permission to execute Chrome

## License

ISC
