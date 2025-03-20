const puppeteer = require('puppeteer-core');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { pressButtons, checkUnlockSuccess } = require('./BuzzButton');
const os = require('os');
const path = require('path');

// Keep a global reference to the browser connection
let globalBrowser = null;

async function getChromeExecutablePath() {
  const platform = os.platform();
  if (platform === 'darwin') { // macOS
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else if (platform === 'win32') { // Windows
    const possiblePaths = [
      path.join(process.env['ProgramFiles'], 'Google/Chrome/Application/chrome.exe'),
      path.join(process.env['ProgramFiles(x86)'], 'Google/Chrome/Application/chrome.exe'),
      path.join(process.env['LocalAppData'], 'Google/Chrome/Application/chrome.exe')
    ];
    for (const path of possiblePaths) {
      try {
        if (require('fs').existsSync(path)) {
          return path;
        }
      } catch (e) {}
    }
    throw new Error('Could not find Chrome installation');
  }
  throw new Error('Unsupported platform');
}

async function ensureChromeIsRunning() {
  try {
    // Try to connect to existing Chrome instance first
    globalBrowser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    });
    console.log('Connected to existing Chrome instance');
    return true;
  } catch (e) {
    console.log('No existing Chrome instance found, starting new one...');
    try {
      // Get the appropriate Chrome path for the current OS
      const chromePath = await getChromeExecutablePath();
      
      // Start Chrome with remote debugging enabled
      const chromeCommand = `"${chromePath}" --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir="${path.join(os.tmpdir(), 'chrome-debug-profile')}"`;
      await execPromise(chromeCommand);
      
      // Wait for Chrome to be ready
      console.log('Waiting for Chrome debugging port to be ready...');
      const http = require('http');
      const maxAttempts = 30;
      let attempts = 0;
      
      await new Promise((resolve, reject) => {
        const checkChromeReady = () => {
          attempts++;
          const req = http.get('http://127.0.0.1:9222/json/version', (res) => {
            if (res.statusCode === 200) {
              console.log(`Chrome is ready after ${attempts} attempts`);
              resolve();
            } else if (attempts < maxAttempts) {
              setTimeout(checkChromeReady, 500);
            } else {
              resolve();
            }
          });
          
          req.on('error', (err) => {
            if (attempts < maxAttempts) {
              setTimeout(checkChromeReady, 500);
            } else {
              resolve();
            }
          });
          req.end();
        };
        checkChromeReady();
      });
      
      // Connect to the new Chrome instance
      globalBrowser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
      });
      console.log('Connected to new Chrome instance');
      return true;
    } catch (error) {
      console.error('Failed to start Chrome:', error);
      return false;
    }
  }
}

async function unlockDoor() {
  console.log('Starting the door unlock process...');
  
  try {
    // Ensure Chrome is running and we're connected
    if (!await ensureChromeIsRunning()) {
      throw new Error('Failed to connect to Chrome');
    }
    
    // Get all pages
    const pages = await globalBrowser.pages();
    let page;
    
    // Check if there's already a Kisi page open
    for (const existingPage of pages) {
      const url = await existingPage.url();
      if (url.includes('kisi.io')) {
        console.log('Found existing Kisi page, reusing it...');
        page = existingPage;
        break;
      }
    }
    
    // If no existing Kisi page found, create a new one
    if (!page) {
      console.log('No existing Kisi page found, creating new one...');
      page = await globalBrowser.newPage();
      await page.goto('https://web.kisi.io/organization/4103/dashboard');
    }
    
    // Wait for the page to be fully loaded
    console.log('Waiting for page to load completely...');
    try {
      // First try to wait for navigation to complete
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
        page.waitForSelector('button[data-test-id="unlock-button"]', { timeout: 10000 }),
        page.waitForSelector('img[alt="LockIcon"]', { timeout: 10000 })
      ]);
      console.log('Page loaded or important elements detected');
    } catch (e) {
      console.log('Navigation/element detection timeout, continuing anyway...');
    }
    
    // Check if the page has any content
    const pageContent = await page.content();
    if (pageContent.includes('Kisi') || pageContent.includes('lock') || pageContent.includes('door')) {
      console.log('Kisi dashboard content detected, proceeding...');
    } else {
      // If no relevant content is found, wait a bit more but not as long as before
      console.log('Waiting a bit more for content to load...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
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
    // Don't disconnect on error, just log it
  }
  // Don't disconnect from browser anymore - keep the connection alive
}

// Add a cleanup function that can be called when the application is shutting down
async function cleanup() {
  if (globalBrowser) {
    try {
      await globalBrowser.disconnect();
      console.log('Disconnected from browser');
    } catch (error) {
      console.error('Error disconnecting from browser:', error);
    }
    globalBrowser = null;
  }
}

module.exports = { unlockDoor, cleanup };
