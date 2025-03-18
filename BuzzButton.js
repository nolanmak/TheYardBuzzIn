/**
 * BuzzButton.js
 * Handles the logic for finding and clicking unlock buttons on the Kisi dashboard
 */

/**
 * Attempts to find and click unlock buttons on the page
 * @param {Page} page - Puppeteer Page object
 * @returns {Promise<boolean>} - Whether buttons were successfully found and clicked
 */
async function pressButtons(page) {
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
          try {
            // Check if the button still exists before clicking
            const buttonExists = await page.evaluate((id) => {
              const button = document.getElementById(id);
              if (button) {
                return true;
              } else {
                // Try to find and mark the button again if it was removed/replaced
                const lockIconBtns = Array.from(document.querySelectorAll('button.MuiButtonBase-root.MuiIconButton-root.MuiIconButton-sizeLarge'));
                const buttonsWithLockIcon = lockIconBtns.filter(btn => {
                  const img = btn.querySelector('img[alt="LockIcon"]');
                  return img !== null;
                });
                
                if (buttonsWithLockIcon.length > 0) {
                  // Re-add the ID to the first button
                  buttonsWithLockIcon[0].setAttribute('id', id);
                  return true;
                }
                return false;
              }
            }, buttonId);
            
            if (buttonExists) {
              await page.click(`#${buttonId}`).catch(e => console.error(`Error clicking button ${buttonId}:`, e));
            } else {
              console.log(`Button ${buttonId} no longer exists in the DOM for click ${i+1}`);
              // Try to find buttons again using alternative methods
              await page.evaluate(() => {
                const allButtons = document.querySelectorAll('button');
                const lockButtons = Array.from(allButtons).filter(btn => {
                  return btn.innerHTML.includes('LockIcon');
                });
                if (lockButtons[0]) lockButtons[0].click();
              });
            }
          } catch (e) {
            console.error(`Error with button ${buttonId}:`, e);
          }
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay between clicks
        }
      }
      
      return true;
    } else {
      // Last resort: Try to directly click based on the exact HTML structure
      console.log('Trying one last approach - direct evaluation and click...');
      
      // Try clicking buttons multiple times with delays between attempts
      for (let attempt = 0; attempt < 5; attempt++) {
        console.log(`Last resort attempt ${attempt+1} of 5`);
        
        const lastAttempt = await page.evaluate(() => {
          // This is the exact button structure from the user's input
          const buttonSelector = 'button.MuiButtonBase-root.MuiIconButton-root.MuiIconButton-sizeLarge[data-test-id="unlock-button"]';
          const buttons = document.querySelectorAll(buttonSelector);
          let clickedAny = false;
          
          // Function to click buttons simultaneously
          const clickButtons = (buttonArray) => {
            if (buttonArray.length > 0) {
              // Click buttons simultaneously
              if (buttonArray[0]) {
                console.log('Clicking first button');
                buttonArray[0].click();
                clickedAny = true;
              }
              if (buttonArray[1]) {
                console.log('Clicking second button');
                buttonArray[1].click();
                clickedAny = true;
              }
            }
            return clickedAny;
          };
          
          if (buttons.length === 0) {
            // Try a more general selector
            const allButtons = document.querySelectorAll('button');
            const lockButtons = Array.from(allButtons).filter(btn => {
              return btn.innerHTML.includes('LockIcon');
            });
            
            if (lockButtons.length > 0) {
              console.log(`Found ${lockButtons.length} lock buttons`);
              clickButtons(lockButtons);
            }
            
            // Try even more general approach - any button that might be related to locks
            if (!clickedAny) {
              const possibleLockButtons = Array.from(allButtons).filter(btn => {
                const buttonText = btn.textContent || '';
                return buttonText.toLowerCase().includes('unlock') || 
                       buttonText.toLowerCase().includes('lock') || 
                       buttonText.toLowerCase().includes('door');
              });
              
              if (possibleLockButtons.length > 0) {
                console.log(`Found ${possibleLockButtons.length} possible lock-related buttons by text`);
                clickButtons(possibleLockButtons);
              }
            }
          } else {
            console.log(`Found ${buttons.length} buttons with exact selector`);
            clickButtons(buttons);
          }
          
          return clickedAny;
        });
        
        if (lastAttempt) {
          console.log('Successfully clicked buttons in last attempt');
          // Wait between attempts
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          console.log(`No buttons found in attempt ${attempt+1}`);
          // Wait before trying again
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Take a screenshot after all attempts
      await page.screenshot({ path: '/Users/nolanmakatche/TheYardBuzzIn/buttons-after-attempts.png' });
      console.log('Screenshot saved as buttons-after-attempts.png');
      
      return true;
    }
  } else {
    // We found buttons using the selector, now click both buttons simultaneously 5 times with a delay
    console.log('Clicking both unlock buttons simultaneously 5 times with a 3-second delay');
    
    // Click both buttons 5 times simultaneously
    for (let i = 0; i < 5; i++) {
      console.log(`Click attempt ${i+1} on both buttons simultaneously`);
      
      try {
        // Re-query the DOM for buttons each time to avoid detached node errors
        const freshButtons = await page.$$('button[data-test-id="unlock-button"]');
        const altButtons = await page.$$('button:has(img[alt="LockIcon"])');
        
        // Create an array to hold our click promises
        const clickPromises = [];
        
        // Try to click the first button
        if (freshButtons.length > 0) {
          console.log('Clicking first button with primary selector');
          clickPromises.push(freshButtons[0].click().catch(e => console.error('Error clicking first button with primary selector:', e)));
        } else if (altButtons.length > 0) {
          console.log('Clicking first button with alternative selector');
          clickPromises.push(altButtons[0].click().catch(e => console.error('Error clicking first button with alternative selector:', e)));
        } else {
          console.log(`No first button found for click ${i+1}`);
        }
        
        // Try to click the second button
        if (freshButtons.length > 1) {
          console.log('Clicking second button with primary selector');
          clickPromises.push(freshButtons[1].click().catch(e => console.error('Error clicking second button with primary selector:', e)));
        } else if (altButtons.length > 1) {
          console.log('Clicking second button with alternative selector');
          clickPromises.push(altButtons[1].click().catch(e => console.error('Error clicking second button with alternative selector:', e)));
        } else {
          console.log(`No second button found for click ${i+1}`);
        }
        
        // Execute all clicks simultaneously
        if (clickPromises.length > 0) {
          await Promise.all(clickPromises);
          console.log(`Successfully clicked ${clickPromises.length} button(s) simultaneously`);
        } else {
          // If no buttons were found with standard selectors, try page.evaluate as a fallback
          console.log('No buttons found with standard selectors, trying page.evaluate');
          await page.evaluate(() => {
            const allButtons = document.querySelectorAll('button');
            const lockButtons = Array.from(allButtons).filter(btn => {
              return btn.innerHTML.includes('LockIcon');
            });
            
            // Click buttons simultaneously
            if (lockButtons[0]) lockButtons[0].click();
            if (lockButtons[1]) lockButtons[1].click();
          });
        }
      } catch (e) {
        console.error('Error during simultaneous button clicks:', e);
      }
      
      // Wait between click attempts
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay between clicks
    }
    
    return true;
  }
  
  return false;
}

/**
 * Checks if the door was successfully unlocked
 * @param {Page} page - Puppeteer Page object
 * @returns {Promise<boolean>} - Whether the door was successfully unlocked
 */
async function checkUnlockSuccess(page) {
  // Take a screenshot to see what's on the page after clicking
  await page.screenshot({ path: '/Users/nolanmakatche/TheYardBuzzIn/dashboard-after.png' });
  console.log('Screenshot saved as dashboard-after.png');
  
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
  }
  
  return doorUnlocked;
}

module.exports = { pressButtons, checkUnlockSuccess };
