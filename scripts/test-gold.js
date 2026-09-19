// Runs gold end to end: click Au on the map, press Enter, ride the merger, the
// reveal, and the closing journey — checking the "imagine" line actually lands.
// usage: node scripts/test-gold.js [speed]
const { chromium } = require('playwright');
const SPEED = process.argv[2] || '0.3';

(async () => {
  const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('console', m => { if(m.type()==='error') errs.push(m.text().slice(0,200)); });
  page.on('pageerror', e => errs.push('PAGEERROR: '+e.message.slice(0,200)));
  const seen = { imagine:false, ageCompare:false, refine:false, ring:false, galaxy:false };
  const choices = [];

  await page.goto(`http://localhost:8123/index.html?hq&fast=${SPEED}`);
  await page.waitForTimeout(1300);
  await page.click('#skip-intro');
  await page.waitForSelector('#lab-root.active', { timeout: 20000 });
  await page.waitForTimeout(900);
  await page.evaluate(()=>{ document.querySelector('#lab-ptable .pcell[data-z="79"]').click(); });
  await page.waitForTimeout(500);
  const armed = await page.evaluate(()=> document.getElementById('question-banner').classList.contains('armed'));
  const autoRan = await page.evaluate(()=> document.getElementById('experiment-root').classList.contains('active'));
  await page.keyboard.press('Enter');
  await page.waitForSelector('#experiment-root.active', { timeout: 40000 });

  let shot = 0;
  for(let i=0;i<900;i++){
    const st = await page.evaluate(()=>{
      const pick = document.querySelector('.choice-btn.recommended') || document.querySelector('.choice-btn');
      const label = pick ? pick.textContent.replace(/\s+/g,' ').trim() : null;
      if(pick) pick.click();
      const gold = document.querySelector('#exp-actions .exp-btn.gold');
      const goldLabel = gold ? gold.textContent.replace(/\s+/g,' ').trim() : null;
      if(gold && /follow your gold/i.test(goldLabel)) gold.click();
      const text = (document.getElementById('exp-body')||{}).innerText || '';
      return { label, goldLabel,
        imagine: text.toLowerCase().includes('imagine: the gold'),
        ageCompare: !!document.querySelector('.age-compare'),
        refine: !!document.querySelector('.refine-row'),
        cosmicHistory: text.toLowerCase().includes('piece of cosmic history'),
        madeFrom: text.toLowerCase().includes('made from a universe'),
        card: !!document.querySelector('.reveal-card.show'),
        done: !!document.querySelector('#exp-actions .ghost'),
      };
    });
    if(st.label) choices.push(st.label);
    if(st.imagine && !seen.imagine){ seen.imagine = true; await page.screenshot({ path:'/tmp/gold-imagine.png' }); }
    if(st.ageCompare && !seen.ageCompare){ seen.ageCompare = true; await page.screenshot({ path:'/tmp/gold-age.png' }); }
    if(st.refine && !seen.refine){ seen.refine = true; await page.screenshot({ path:'/tmp/gold-refine.png' }); }
    if(st.cosmicHistory && !seen.ring){ seen.ring = true; await page.screenshot({ path:'/tmp/gold-ring.png' }); }
    if(st.madeFrom && !seen.galaxy){ seen.galaxy = true; await page.screenshot({ path:'/tmp/gold-galaxy.png' }); }
    if(st.card && shot === 0){ shot = 1; await page.waitForTimeout(1500); await page.screenshot({ path:'/tmp/gold-reveal.png' }); }
    if(seen.galaxy && st.done) break;
    await page.waitForTimeout(450);
  }

  console.log(JSON.stringify({ armed, autoRan, choices, seen, errors: errs.length, firstErrors: errs.slice(0,4) }, null, 1));
  await browser.close();
  process.exit(0);
})();
