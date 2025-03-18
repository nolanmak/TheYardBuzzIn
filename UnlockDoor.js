const puppeteer = require('puppeteer-core');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: '/Users/nolanmakatche/TheYardBuzzIn/dashboard-before.png' });
    console.log('Screenshot saved as dashboard-before.png');
    
    // Look specifically for buttons with data-test-id="unlock-button"
    console.log('Looking for unlock buttons...');
    
    // Take a screenshot to see what's on the page before we start
    await page.screenshot({ path: '/Users/nolanmakatche/TheYardBuzzIn/dashboard-before.png' });
    console.log('Screenshot saved as dashboard-before.png');
    
    // Wait for the unlock buttons to be available
    console.log('Waiting for unlock buttons to be available...');
    try {
      await page.waitForSelector('button[data-test-id="unlock-button"]', { timeout: 10000 });
    } catch (e) {
      console.log('Timeout waiting for unlock buttons, will try to find them anyway');
    }
    
    // Find all unlock buttons
    const unlockButtons = await page.$$('button[data-test-id="unlock-button"]');
    console.log(`Found ${unlockButtons.length} unlock buttons on the page`);
    
    if (unlockButtons.length === 0) {
      console.log('No unlock buttons found. Trying alternative selectors...');
      
      // Try to find buttons with LockIcon images
      try {
        await page.waitForSelector('img[alt="LockIcon"]', { timeout: 5000 });
      } catch (e) {
        console.log('Timeout waiting for LockIcon images, will try to find them anyway');
      }
      
      const buttonsWithLockIcon = await page.$$('button:has(img[alt="LockIcon"])');
      console.log(`Found ${buttonsWithLockIcon.length} buttons with LockIcon images`);
      
      if (buttonsWithLockIcon.length > 0) {
        unlockButtons.push(...buttonsWithLockIcon);
      }
    }
    
    if (unlockButtons.length === 0) {
      console.log('Still no unlock buttons found. Trying to evaluate in page context...');
      
      // Try to find and click buttons using page.evaluate
      const clickResult = await page.evaluate(() => {
        // Find all buttons with the unlock button data-test-id
        const unlockBtns = Array.from(document.querySelectorAll('button[data-test-id="unlock-button"]'));
        console.log('Found', unlockBtns.length, 'buttons with data-test-id="unlock-button"');
        
        // Find buttons containing LockIcon images - this matches the exact HTML provided by the user
        const lockIconBtns = Array.from(document.querySelectorAll('button.MuiButtonBase-root.MuiIconButton-root.MuiIconButton-sizeLarge'));
        console.log('Found', lockIconBtns.length, 'buttons with MuiIconButton-sizeLarge class');
        
        // Filter to only those with LockIcon images
        const buttonsWithLockIcon = lockIconBtns.filter(btn => {
          const img = btn.querySelector('img[alt="LockIcon"]');
          return img !== null;
        });
        console.log('Found', buttonsWithLockIcon.length, 'buttons with LockIcon images');
        
        if (buttonsWithLockIcon.length > 0) {
          // Return the IDs of the buttons we found so we can click them from outside
          const buttonIds = [];
          for (let i = 0; i < Math.min(2, buttonsWithLockIcon.length); i++) {
            // Add a unique ID to each button so we can find it later
            const uniqueId = 'unlock-btn-' + i;
            buttonsWithLockIcon[i].setAttribute('id', uniqueId);
            buttonIds.push(uniqueId);
          }
          return buttonIds;
        }
        
        return [];
      });
      
      if (clickResult.length > 0) {
        console.log(`Found ${clickResult.length} buttons to click`);
        
        // Click each button 5 times with a 3-second delay
        for (const buttonId of clickResult) {
          console.log(`Clicking button with ID ${buttonId} 5 times...`);
          
          for (let i = 0; i < 5; i++) {
            console.log(`Click ${i+1} on button ${buttonId}`);
            await page.click(`#${buttonId}`).catch(e => console.error(`Error clicking button ${buttonId}:`, e));
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay between clicks
          }
        }
      } else {
        // Last resort: Try to directly click based on the exact HTML structure
        console.log('Trying one last approach - direct evaluation and click...');
        
        const lastAttempt = await page.evaluate(() => {
          // This is the exact button structure from the user's input
          const buttonSelector = 'button.MuiButtonBase-root.MuiIconButton-root.MuiIconButton-sizeLarge[data-test-id="unlock-button"]';
          const buttons = document.querySelectorAll(buttonSelector);
          
          if (buttons.length === 0) {
            // Try a more general selector
            const allButtons = document.querySelectorAll('button');
            const lockButtons = Array.from(allButtons).filter(btn => {
              return btn.innerHTML.includes('LockIcon');
            });
            
            if (lockButtons.length > 0) {
              // Click the first two buttons
              if (lockButtons[0]) lockButtons[0].click();
              if (lockButtons[1]) lockButtons[1].click();
              return true;
            }
          } else {
            // Click the first two buttons
            if (buttons[0]) buttons[0].click();
            if (buttons[1]) buttons[1].click();
            return true;
          }
          
          return false;
        });
        
        if (lastAttempt) {
          console.log('Successfully clicked buttons in last attempt');
        } else {
          console.log('No buttons found using any method');
        }
      }
    } else {
      // We found buttons using the selector, now click the first two buttons 5 times each with a delay
      console.log('Clicking the first two unlock buttons 5 times each with a 3-second delay');
      
      // Click the first button 5 times
      if (unlockButtons.length >= 1) {
        console.log('Clicking the first unlock button 5 times...');
        for (let i = 0; i < 5; i++) {
          console.log(`Click ${i+1} on first button`);
          await unlockButtons[0].click().catch(e => console.error('Error clicking first button:', e));
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay between clicks
        }
      }
      
      // Click the second button 5 times
      if (unlockButtons.length >= 2) {
        console.log('Clicking the second unlock button 5 times...');
        for (let i = 0; i < 5; i++) {
          console.log(`Click ${i+1} on second button`);
          await unlockButtons[1].click().catch(e => console.error('Error clicking second button:', e));
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay between clicks
        }
      }
    }
    
    // Take another screenshot to see what's on the page after clicking
    await page.screenshot({ path: '/Users/nolanmakatche/TheYardBuzzIn/dashboard-after.png' });
    console.log('Screenshot saved as dashboard-after.png');
    
    // Wait a bit longer to ensure the unlock action has been processed by the server
    console.log('Waiting for unlock action to be processed...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if we were successful
    const doorUnlocked = await page.evaluate(() => {
      // Look for success messages or indicators
      const successElements = Array.from(document.querySelectorAll('*')).filter(el => 
        (el.textContent || '').includes('successfully') || 
        (el.textContent || '').includes('unlocked')
      );
      return successElements.length > 0;
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

module.exports = { unlockDoor };
