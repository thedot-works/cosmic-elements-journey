const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push('[console] ' + msg.text()); });
  page.on('pageerror', err => errors.push('[pageerror] ' + err.message));

  await page.goto('http://localhost:8123/index.html');
  await page.click('#skip-intro');
  await page.waitForSelector('#lab-root.active');

  async function runSingle(id, label){
    await page.click(`.cosmic-obj[data-id="${id}"]`);
    await page.click('#activate-btn');
    await page.waitForSelector('.exp-continue', { timeout: 20000 });
    const word = await page.$eval('.verdict-word', el => el.textContent).catch(()=>'(no verdict word)');
    console.log(label, '-> verdict:', word);
    await page.click('.exp-continue');
    await page.waitForSelector('#experiment-root:not(.active)', { timeout: 5000 });
  }

  await runSingle('early', 'Early Universe');
  await runSingle('whitedwarf', 'White Dwarf');
  await runSingle('magnetar', 'Magnetar');
  await runSingle('gas', 'Gas alone');

  // gas + massive (recycle path)
  await page.click('.cosmic-obj[data-id="gas"]');
  await page.click('.cosmic-obj[data-id="massive"]');
  await page.click('#activate-btn');
  await page.waitForSelector('.exp-continue', { timeout: 20000 });
  console.log('Gas + Massive -> verdict:', await page.$eval('.verdict-word', el => el.textContent));
  await page.click('.exp-continue');
  await page.waitForSelector('#experiment-root:not(.active)', { timeout: 5000 });

  // mobile viewport check
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  const labVisible = await page.$eval('#lab-root', el => getComputedStyle(el).opacity);
  console.log('lab opacity at mobile width:', labVisible);
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  console.log('horizontal overflow at mobile width:', overflowX);

  console.log('TOTAL ERRORS:', errors.length);
  errors.forEach(e => console.log(e));

  await browser.close();
})();
