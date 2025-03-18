const puppeteer = require('puppeteer-core');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { startBot } = require('./DiscordBot');
require('dotenv').config();

async function unlockDoor() {
  console.log('Starting the door unlock process...');
  let browser = null;
  
  try {
    // Kill any existing Chrome processes that might be using port 9222
    try {
      console.log('Closing any existing Chrome instances using port 9222...');
      await execPromise('pkill -f "Google Chrome.*remote-debugging-port=9222"');
    } catch (e) {
      // It's okay if this fails - it just means no Chrome was running
    }
    
    // Start Chrome with remote debugging enabled - using a more specific command
    console.log('Opening Chrome with remote debugging...');
    await execPromise('/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=/tmp/chrome-debug-profile https://web.kisi.io/organization/4103/dashboard &');
    
    // Wait for Chrome to start
    console.log('Waiting for Chrome to start...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Connect to Chrome - explicitly using 127.0.0.1 instead of localhost
    console.log('Connecting to Chrome...');
    browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    });
    
    console.log('Successfully connected to Chrome');
    
    // Get all pages
    const pages = await browser.pages();
    const page = pages[pages.length - 1]; // Get the last page which should be the Kisi dashboard
    
    console.log('Page loaded, waiting for content to render...');
    await new Promise(resolve => setTimeout(resolve, 15000)); // Increased wait time
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: '/Users/nolanmakatche/TheYardBuzzIn/dashboard-before.png' });
    console.log('Screenshot saved as dashboard-before.png');
    
    // Look specifically for buttons with LockIcon alt text
    console.log('Looking for button with LockIcon alt text...');
    
    const doorUnlocked = await page.evaluate(() => {
      // First find elements containing "CEN - Front Door" text
      const doorElements = Array.from(document.querySelectorAll('*')).filter(el => 
        (el.textContent || '').includes('CEN - Front Door') || 
        (el.textContent || '').includes('CEN-Front Door')
      );
      console.log('Found', doorElements.length, 'elements containing CEN - Front Door text');
      
      if (doorElements.length > 0) {
        // For each door element, look for nearby lock icons
        for (const doorEl of doorElements) {
          // Try to find a card or container that has both the door text and buttons
          let container = doorEl;
          
          // Go up a few levels to find a container
          for (let i = 0; i < 5; i++) {
            if (!container) break;
            
            // Look for lock icons within this container
            const lockImages = container.querySelectorAll('img[alt="LockIcon"]');
            if (lockImages.length > 0) {
              console.log('Found LockIcon near CEN - Front Door');
              
              // Find the button containing this lock icon
              const button = lockImages[0].closest('button');
              if (button) {
                console.log('Found button with LockIcon, clicking it');
                button.click();
                return true;
              }
            }
            
            // Also look for any buttons with SVG icons
            const buttons = container.querySelectorAll('button');
            for (const btn of buttons) {
              if (btn.querySelector('svg')) {
                console.log('Found button with SVG near CEN - Front Door, clicking it');
                btn.click();
                return true;
              }
            }
            
            container = container.parentElement;
          }
        }
      }
      
      // Fallback: Look for any img with alt="LockIcon"
      const lockImages = Array.from(document.querySelectorAll('img[alt="LockIcon"]'));
      console.log('Fallback: Found', lockImages.length, 'images with alt="LockIcon"');
      
      if (lockImages.length > 0) {
        const button = lockImages[0].closest('button');
        if (button) {
          console.log('Clicking first button with LockIcon');
          button.click();
          return true;
        }
      }
      
      return false;
    });
    
    if (doorUnlocked) {
      console.log('CEN - Front Door unlock button clicked successfully!');
    } else {
      console.log('Could not find or click the CEN - Front Door unlock button');
      
      // Take another screenshot to see what's on the page
      await page.screenshot({ path: '/Users/nolanmakatche/TheYardBuzzIn/dashboard-after.png' });
      console.log('Screenshot saved as dashboard-after.png');
    }
    
    // Wait a bit to see the result
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Disconnect from the browser if connected
    if (browser) {
      try {
        await browser.disconnect();
        console.log('Disconnected from browser');
      } catch (closeError) {
        console.error('Error disconnecting from browser:', closeError);
      }
    }
  }
}

// Run the functions
unlockDoor();

// Start the Discord bot with the token from .env
console.log('Starting Discord bot...');
startBot(process.env.DISCORD_BOT_TOKEN);