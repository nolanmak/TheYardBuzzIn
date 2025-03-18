const puppeteer = require('puppeteer-core');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { pressButtons, checkUnlockSuccess } = require('./BuzzButton');

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
    
    // Wait for Chrome to start - increased wait time to ensure Chrome is fully loaded
    console.log('Waiting for Chrome to start and load the page...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
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
    
    // Wait for the page to be fully loaded
    console.log('Waiting for page to load completely...');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {
      console.log('Navigation timeout, continuing anyway...');
    });
    
    // Additional wait to ensure all JavaScript has executed and the page is fully rendered
    console.log('Page loaded, waiting for content to render...');
    await new Promise(resolve => setTimeout(resolve, 20000)); // Increased wait time
    
    // Now that the browser is loaded, start trying to press buttons
    await pressButtons(page);
    
    // Wait a bit longer to ensure the unlock action has been processed by the server
    console.log('Waiting for unlock action to be processed...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if we were successful
    await checkUnlockSuccess(page);
    
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

module.exports = { unlockDoor };
