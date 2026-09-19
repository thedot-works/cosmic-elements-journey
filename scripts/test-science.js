// Checks the Story / Science toggle actually reveals the technical detail,
// in the lab, mid-sequence and on the reveal card.
// usage: node scripts/test-science.js [z]
const { chromium } = require('playwright');
const Z = parseInt(process.argv[2] || '92', 10);

(async () => {
  const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('console', m => { if(m.type()==='error') errs.push(m.text().slice(0,160)); });
  page.on('pageerror', e => errs.push('PAGEERROR: '+e.message.slice(0,160)));

  const count = ()=> page.evaluate(()=>{
    let shown = 0, hidden = 0;
    document.querySelectorAll('.science-only').forEach(el=>{
      (getComputedStyle(el).display === 'none' ? hidden++ : shown++);
    });
    return { shown, hidden, mode: document.body.classList.contains('science-mode') ? 'science' : 'story' };
  });

  await page.goto('http://localhost:8123/index.html?hq&fast=0.3');
  await page.waitForSelector('#skip-intro', { timeout: 30000 });
  await page.waitForTimeout(1300);
  await page.click('#skip-intro');
  await page.waitForSelector('#lab-root.active', { timeout: 20000 });
  await page.waitForTimeout(900);
  await page.evaluate(z=>{ document.querySelector(`#lab-ptable .pcell[data-z="${z}"]`).click(); }, Z);
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForSelector('#experiment-root.active', { timeout: 40000 });
  await page.waitForTimeout(3000);

  const story = await count();
  await page.click('[data-mode="science"]');
  await page.waitForTimeout(700);
  const science = await count();
  await page.screenshot({ path:'/tmp/science-act1.png' });

  for(let i=0;i<300;i++){
    const card = await page.evaluate(()=>{
      const b = document.querySelector('.choice-btn.recommended') || document.querySelector('.choice-btn');
      if(b) b.click();
      return !!document.querySelector('.reveal-card.show');
    });
    if(card) break;
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2200);
  const cardScience = await count();
  await page.screenshot({ path:'/tmp/science-reveal.png' });
  await page.click('[data-mode="story"]');
  await page.waitForTimeout(600);
  const cardStory = await count();
  await page.screenshot({ path:'/tmp/story-reveal.png' });

  console.log(JSON.stringify({ story, science, cardScience, cardStory, errors: errs.length, firstErrors: errs.slice(0,3) }, null, 1));
  await browser.close();
  process.exit(0);
})();
