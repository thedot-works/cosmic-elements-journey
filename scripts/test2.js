const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push('[console] ' + msg.text()); });
  page.on('pageerror', err => errors.push('[pageerror] ' + err.message));

  await page.goto('http://localhost:8123/index.html', { waitUntil: 'load' });
  console.log('letting full intro autoplay run (no skip)...');
  await page.waitForSelector('#lab-root.active', { timeout: 20000 });
  console.log('lab active automatically after intro, took < 20s. errors:', errors.length);
  errors.forEach(e=>console.log(e));

  // Test hint system
  await page.click('#hint-btn');
  let hint1 = await page.$eval('#hint-text', el => el.textContent);
  console.log('hint1:', hint1);
  await page.click('#hint-btn');
  let hint2 = await page.$eval('#hint-text', el => el.textContent);
  console.log('hint2:', hint2);

  // Test wrong combo: main-sequence + massive star (mismatched pair -> generic wrong)
  await page.click('.cosmic-obj[data-id="mainseq"]');
  await page.click('.cosmic-obj[data-id="massive"]');
  await page.click('#activate-btn');
  await page.waitForSelector('.exp-continue', { timeout: 15000 });
  console.log('generic wrong combo verdict shown ok');
  await page.click('.exp-continue');
  await page.waitForSelector('#experiment-root:not(.active)', { timeout: 5000 });

  // switch target to Carbon and try massive star (should succeed)
  await page.click('.target-chip[data-id="C"]');
  await page.click('.cosmic-obj[data-id="massive"]');
  await page.click('#activate-btn');
  await page.waitForSelector('.exp-continue', { timeout: 25000 });
  const verdictWord = await page.$eval('.verdict-word', el => el.textContent);
  console.log('massive star -> Carbon verdict:', verdictWord);
  await page.click('.exp-continue');
  await page.waitForSelector('#experiment-root:not(.active)', { timeout: 5000 });

  // science mode toggle
  await page.click('#mode-toggle button[data-mode="science"]');
  const scienceOn = await page.$eval('body', el => el.classList.contains('science-mode'));
  console.log('science mode on:', scienceOn);

  // mute toggle
  await page.click('#mute-btn');
  const muteLabel = await page.$eval('#mute-btn', el => el.textContent);
  console.log('mute label after toggle:', muteLabel);

  console.log('TOTAL ERRORS:', errors.length);
  errors.forEach(e=>console.log(e));

  await browser.close();
})();
