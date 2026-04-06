const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  console.log("Capturing Feature Graphic...");
  await page.setViewport({ width: 1024, height: 500 });
  await page.goto('file:///c:/Projects/hala-app/feature.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'c:/Projects/hala-app/playstore_feature.jpg', type: 'jpeg', quality: 100 });
  console.log("Feature graphic captured.");

  console.log("Connecting to Expo web server...");
  await page.setViewport({ width: 414, height: 896, deviceScaleFactor: 2 }); // Results in 828x1792
  
  let connected = false;
  for(let i=0; i<30; i++) {
    try {
      await page.goto('http://localhost:8081', { waitUntil: 'load', timeout: 5000 });
      connected = true;
      break;
    } catch(e) {
      console.log("Waiting for web server...");
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  if (connected) {
    console.log("App loaded. Waiting for render...");
    await new Promise(r => setTimeout(r, 5000)); // give it time to load fonts/assets
    await page.screenshot({ path: 'c:/Projects/hala-app/playstore_screenshot1.png' });
    console.log("Screenshot 1 captured.");

    console.log("Attempting to click radio tab...");
    try {
      // Expo router tabs at bottom. Quick coordinate click as fallback
      // 414 total width, 2 tabs. 1st is at x=100. 2nd is at x=314. y=860
      await page.mouse.click(300, 860);
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: 'c:/Projects/hala-app/playstore_screenshot2.png' });
      console.log("Screenshot 2 captured.");
    } catch(e) {
      console.error(e);
    }
  } else {
    console.log("Failed to connect to Expo web server.");
  }

  await browser.close();
  console.log('Capture complete!');
})();
