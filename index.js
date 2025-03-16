const puppeteer = require('puppeteer-core');
const { exec } = require('child_process');

async function unlockDoor() {
  console.log('Starting the door unlock process...');
  
  try {
    // Simply open Chrome with the target URL
    console.log('Opening Chrome with Kisi dashboard...');
    
    // Use the open command to launch Chrome with the specific URL
    exec('open -a "Google Chrome" "https://web.kisi.io/organization/4103/dashboard"');
    
    console.log('Chrome launched with Kisi dashboard');
    console.log('Please manually click the unlock button in the opened browser window');
    
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the function
unlockDoor();