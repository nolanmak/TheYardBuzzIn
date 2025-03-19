#!/bin/bash

# Install PM2 if not already installed
# if ! command -v pm2 &> /dev/null; then
#     echo "Installing PM2 process manager..."
#     npm install -g pm2
# fi

# # Stop any existing instance of the bot
# pm2 stop theyardbuzzin 2>/dev/null || true

# # Start the bot with PM2
# echo "Starting TheYardBuzzIn bot..."
# pm2 start index.js --name theyardbuzzin

# # Save the PM2 configuration to ensure the bot starts on system boot
# pm2 save

# echo "TheYardBuzzIn bot is now running in the background."
# echo "To view logs, run: pm2 logs theyardbuzzin"
# echo "To stop the bot, run: pm2 stop theyardbuzzin"
