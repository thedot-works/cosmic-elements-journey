// Focuses on Act II: does the nuclear reaction actually render nuclei, labels
// and the right equation for this element?
// usage: node scripts/test-nuclear.js 8
const { chromium } = require('playwright');
const Z = parseInt(process.argv[2] || '8', 10);
const TAG = process.argv[3] || ('z'+Z);
(async () => {
  const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('console', m => { if(m.type()==='error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
  await page.goto('http://localhost:8123/index.html?hq&fast=0.7');
  await page.waitForTimeout(1500);
  await page.click('#skip-intro');
  await page.waitForSelector('#lab-root.active', { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.evaluate(z=>{ document.querySelector(`#lab-ptable .pcell[data-z="${z}"]`).click(); }, Z);
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.nuc-eq', { timeout: 90000 });
  console.log('nuclear act reached');
  for(let i=0;i<7;i++){
    const st = await page.evaluate(()=>{
      let inst = 0, nuclei = 0, labels = [];
      FX.scene.traverse(o=>{ if(o.isInstancedMesh){ inst += o.count; if(o.count>0) nuclei++; } });
      document.querySelectorAll('.fx-label').forEach(l=> labels.push(l.textContent.replace(/\s+/g,' ').trim()));
      return { inst, nuclei, labels: labels.slice(0,6),
        eq: (document.querySelector('.nuc-step.active .nuc-eq')||{}).textContent,
        note: (document.querySelector('.nuc-step.active .nuc-note')||{}).textContent,
        cap: document.getElementById('exp-caption-1').textContent };
    });
    console.log(i, JSON.stringify(st));
    await page.screenshot({ path: `/tmp/nuc-${TAG}-${i}.png` });
    await page.waitForTimeout(900);
  }
  console.log('ERRORS', errs.length); errs.slice(0,8).forEach(e=>console.log(' -', e.slice(0,300)));
  await browser.close();
  process.exit(0);
})();
