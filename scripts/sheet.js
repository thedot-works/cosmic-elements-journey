// Screenshots the specimen contact sheet (dev/specimens.html) for visual QA.
// usage: node scripts/sheet.js [from] [to] [outfile]
const { chromium } = require('playwright');
const from = process.argv[2] || 1, to = process.argv[3] || 118;
const out = process.argv[4] || `/tmp/sheet-${from}-${to}.png`;
(async () => {
  const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1780, height: 1000 } });
  const errs = [];
  page.on('console', m => { if(m.type()==='error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
  await page.goto(`http://localhost:8123/dev/specimens.html?from=${from}&to=${to}`);
  await page.waitForFunction(()=> document.title === 'SHEET READY', { timeout: 240000 });
  await page.waitForTimeout(500);
  const el = await page.$('#sheet');
  await el.screenshot({ path: out });
  console.log('wrote', out, 'errors', errs.length);
  errs.slice(0,10).forEach(e=>console.log(' -', e.slice(0,300)));
  await browser.close();
  process.exit(0);
})();
