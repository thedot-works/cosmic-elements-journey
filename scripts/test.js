const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium/chrome-linux/chrome', args: ['--use-gl=swiftshader','--ignore-gpu-blocklist'] })
    .catch(async ()=> chromium.launch());
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push('[console] ' + msg.text()); });
  page.on('pageerror', err => errors.push('[pageerror] ' + err.message));

  await page.goto('http://localhost:8123/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  console.log('ERRORS so far:', errors.length);
  errors.forEach(e=>console.log(e));

  // Skip the intro to get to the lab fast
  const skip = await page.$('#skip-intro');
  console.log('skip button found:', !!skip);
  if (skip) await skip.click();
  await page.waitForTimeout(2500);

  console.log('ERRORS after skip:', errors.length);
  errors.forEach(e=>console.log(e));

  const labActive = await page.$eval('#lab-root', el => el.classList.contains('active'));
  console.log('lab active:', labActive);
  if (!labActive) { await browser.close(); process.exit(0); }

  // Select Main-Sequence Star and activate (target default Au -> should fail with a message)
  await page.click('.cosmic-obj[data-id="mainseq"]');
  await page.waitForTimeout(300);
  await page.click('#activate-btn');
  console.log('waiting for mainseq verdict + continue button...');
  await page.waitForSelector('.exp-continue', { timeout: 20000 });
  console.log('continue button appeared, clicking...');
  await page.click('.exp-continue');
  await page.waitForSelector('#experiment-root:not(.active)', { timeout: 5000 });
  console.log('experiment closed, back in lab');
  await page.waitForTimeout(500);
  console.log('ERRORS so far:', errors.length); errors.forEach(e=>console.log(e));

  // Now try the neutron star merger with target Gold (this is the long centerpiece sequence)
  await page.click('.cosmic-obj[data-id="neutronA"]');
  await page.click('.cosmic-obj[data-id="neutronB"]');
  await page.waitForTimeout(300);
  await page.click('#activate-btn');
  console.log('waiting for merger sequence choice buttons...');
  await page.waitForSelector('.choice-btn', { timeout: 25000 });
  console.log('choice buttons appeared:', await page.$$eval('.choice-btn', els => els.map(e=>e.textContent)));
  await page.click('.choice-btn.recommended');
  console.log('picked ejecta, waiting for gold reveal (long sequence)...');

  await page.waitForSelector('.followup-btn', { timeout: 60000 });
  console.log('FOLLOW YOUR GOLD button appeared!');
  console.log('ERRORS so far:', errors.length); errors.forEach(e=>console.log(e));
  await page.click('.followup-btn');

  console.log('waiting for gold journey to finish and return to lab...');
  await page.waitForSelector('#experiment-root:not(.active)', { timeout: 60000 });
  console.log('returned to lab after full gold journey!');

  const discoveredCount2 = await page.$eval('#ptable-count', el => el.textContent);
  console.log('discovered count after full journey:', discoveredCount2);
  const auLit = await page.$eval('.pcell.au-cell', el => el.className);
  console.log('Au cell class:', auLit);

  console.log('ERRORS:', errors.length);
  errors.slice(0,40).forEach(e => console.log(e));

  await browser.close();
})();
