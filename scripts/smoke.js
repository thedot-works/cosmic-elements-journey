// Boots the app headless, skips the intro, and reports every console error.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('console', m => { if(m.type()==='error') errs.push('CONSOLE: '+m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
  await page.goto('http://localhost:8123/index.html?hq');
  await page.waitForTimeout(2500);
  await page.click('#skip-intro');
  await page.waitForSelector('#lab-root.active', { timeout: 20000 });
  await page.waitForTimeout(2500);
  const info = await page.evaluate(()=>({
    objects: document.querySelectorAll('.cosmic-obj').length,
    cells: document.querySelectorAll('#lab-ptable .pcell').length,
    banner: document.getElementById('question-banner-text').textContent.trim(),
    result: document.getElementById('slot-result').textContent.trim().slice(0,40),
    hint: !!document.getElementById('hint-btn'),
    fxReady: !!(window.FX && FX.ready), env: !!(window.FX && FX.env),
    sites: window.Sites ? Object.keys(window.Sites).length : 0,
    profiles: !!(window.ElementProfiles && ElementProfiles.get(79)),
  }));
  console.log(JSON.stringify(info));
  await page.screenshot({ path: '/tmp/v3-lab.png' });
  console.log('ERRORS', errs.length);
  errs.slice(0,25).forEach(e=>console.log(' -', e.slice(0,500)));
  await browser.close();
  process.exit(0);
})();
