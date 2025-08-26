

A Discord bot that listens for messages and automatically unlocks the door at our coworking space using Puppeteer to interact with the Kisi dashboard.

## Features

- **Discord Message Listener**: Monitors Discord channels for door unlock requests
- **Automatic Door Unlocking**: Uses Puppeteer to automate the door unlocking process via the Kisi dashboard
- **Confirmation Messages**: Sends confirmation messages back to Discord when the door has been unlocked
- **Modular Architecture**: Separation of concerns with dedicated modules for different functionalities
- **Cross-Platform Support**: Works on both macOS and Windows

## Architecture

The system is built with a modular architecture that separates concerns:

- **DiscordChannelListener**: Handles Discord message events and command detection
- **UnlockDoor**: Manages browser initialization and connection to the Kisi dashboard
- **BuzzButton**: Contains the specialized logic for finding and clicking unlock buttons
- **DiscordBot**: Handles sending confirmation messages back to Discord

## Project Structure

- `index.js`: Main entry point that starts the Discord channel listener
- `DiscordChannelListener.js`: Listens for messages in Discord channels and triggers the door unlock process
- `UnlockDoor.js`: Handles browser initialization and connection to the Kisi dashboard
- `BuzzButton.js`: Contains the logic for finding and clicking unlock buttons on the page
- `DiscordBot.js`: Handles sending confirmation messages to Discord
- `start.sh`: Script for running the bot as a background service using PM2

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
2. Create a new application or select your existing one
3. Go to the "Bot" tab
4. Under "Privileged Gateway Intents", enable the following intents:
   - MESSAGE CONTENT INTENT
5. Save your changes
6. Copy your bot token and add it to the `.env` file
7. Use the OAuth2 URL Generator to invite your bot to your server with appropriate permissions

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
- "buzz in"
- "unlock the door"
- "open the door"
- "let me in"
- "I'm here"
- "I'm at the door"
- "at the door"

#### Debug Command
- `!debug`: Displays debug information about the bot and the current message

## How It Works

1. The Discord bot listens for specific commands or phrases in all channels it has access to
2. When a valid command is detected, it launches or connects to a Chrome instance
3. The bot navigates to the Kisi dashboard (or reuses an existing tab)
4. It locates and clicks the appropriate unlock buttons using various selector strategies
5. The system takes screenshots at different stages for debugging purposes
6. A confirmation message is sent back to Discord upon successful unlock

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
4. Check the screenshot files generated in the project directory for visual debugging

## License

ISC
