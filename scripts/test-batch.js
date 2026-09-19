// Runs a list of elements end to end in one session, capturing one screenshot
// per act and reporting anything that breaks.
// usage: node scripts/test-batch.js 1,3,5,6,26,63,82,86,118
const { chromium } = require('playwright');
const LIST = (process.argv[2] || '1,6,26,63,86,118').split(',').map(n=>parseInt(n,10));
const SPEED = process.argv[3] || '0.4';

(async () => {
  const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader'] });
  const results = [];
  for(const Z of LIST){
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = [];
    page.on('console', m => { if(m.type()==='error') errs.push(m.text().slice(0,200)); });
    page.on('pageerror', e => errs.push('PAGEERROR: '+e.message.slice(0,200)));
    const r = { z:Z };
    try {
      await page.goto(`http://localhost:8123/index.html?hq&fast=${SPEED}`);
      await page.waitForTimeout(1200);
      await page.click('#skip-intro');
      await page.waitForSelector('#lab-root.active', { timeout: 20000 });
      await page.waitForTimeout(900);
      r.name = await page.evaluate(z=> ElementProfiles.get(z).name, Z);
      r.site = await page.evaluate(z=> ElementProfiles.get(z).recipe, Z);
      await page.evaluate(z=>{ document.querySelector(`#lab-ptable .pcell[data-z="${z}"]`).click(); }, Z);
      await page.waitForTimeout(600);
      r.armed = await page.evaluate(()=> document.getElementById('question-banner').classList.contains('armed'));
      r.autoRan = await page.evaluate(()=> document.getElementById('experiment-root').classList.contains('active'));
      await page.keyboard.press('Enter');
      // Enter kicks off the run; heavy first frames can stall the SwiftShader
      // main thread, so treat Theater.busy as "started" and just wait longer.
      try {
        await page.waitForFunction(()=> window.Theater && Theater.busy, null, { timeout: 8000 });
        r.startedByEnter = true;
      } catch(e){
        r.startedByEnter = false;
        r.stateOnFail = await page.evaluate(()=>({ a:Lab.slots.a, b:Lab.slots.b, labBusy:Lab.busy, thBusy:Theater.busy,
          target:Lab.targetZ, btnDisabled:document.getElementById('activate-btn').disabled }));
        await page.click('#activate-btn');
      }
      await page.waitForSelector('#experiment-root.active', { timeout: 40000 });
      // act I shot
      await page.waitForTimeout(3500);
      await page.screenshot({ path:`/tmp/b-${Z}-act1.png` });
      r.act1 = await page.evaluate(()=> document.getElementById('exp-caption-1').textContent);
      // nuclear shot: poll for nucleons on screen, answering any branch prompt
      let nucShot = false;
      r.choices = [];
      for(let i=0;i<110 && !nucShot;i++){
        const picked = await page.evaluate(()=>{
          const b = document.querySelector('.choice-btn.recommended') || document.querySelector('.choice-btn');
          if(b){ const t = b.textContent; b.click(); return t; }
          return null;
        });
        if(picked){ r.choices.push(picked.replace(/\s+/g,' ').trim()); await page.waitForTimeout(500); }
        const inst = await page.evaluate(()=>{ let n=0; FX.scene.traverse(o=>{ if(o.isInstancedMesh) n+=o.count; }); return n; });
        if(inst > 0){
          await page.screenshot({ path:`/tmp/b-${Z}-nuc.png` });
          r.nucleons = inst;
          r.eq = await page.evaluate(()=> (document.querySelector('.nuc-step.active .nuc-eq')||{}).textContent || '');
          nucShot = true;
        } else await page.waitForTimeout(350);
      }
      r.nuclearSeen = nucShot;
      // reveal (keep answering branch prompts while we wait)
      let card = false;
      for(let i=0;i<300 && !card;i++){
        const picked = await page.evaluate(()=>{
          const b = document.querySelector('.choice-btn.recommended') || document.querySelector('.choice-btn');
          if(b){ const t = b.textContent; b.click(); return t; }
          return null;
        });
        if(picked) r.choices.push(picked.replace(/\s+/g,' ').trim());
        card = await page.evaluate(()=> !!document.querySelector('.reveal-card.show'));
        if(!card) await page.waitForTimeout(500);
      }
      if(!card) throw new Error('reveal card never appeared');
      await page.waitForTimeout(2200);
      await page.screenshot({ path:`/tmp/b-${Z}-reveal.png` });
      r.card = await page.evaluate(()=>{
        const c = document.querySelector('.reveal-card');
        return { sym:(c.querySelector('.rc-sym')||{}).textContent, site:(c.querySelector('.rc-site')||{}).textContent.replace(/\s+/g,' ').slice(0,70),
          eq:(c.querySelector('.rc-eq')||{}).textContent.replace(/\s+/g,' ') };
      });
      r.specimen = await page.evaluate(()=> (document.querySelector('.spec-caption span')||{}).textContent || '');
    } catch(e){
      r.error = e.message.split('\n')[0].slice(0,160);
    }
    r.errors = errs.length; r.firstErrors = errs.slice(0,3);
    results.push(r);
    console.log(JSON.stringify(r));
    await page.close();
  }
  console.log('\n=== summary');
  results.forEach(r=> console.log(`${String(r.z).padStart(3)} ${String(r.name||'?').padEnd(13)} ${String(r.site||'').padEnd(11)} armed=${r.armed} autoRan=${r.autoRan} nuclear=${r.nuclearSeen} card=${r.card?'yes':'NO'} errs=${r.errors} ${r.error||''}`));
  await browser.close();
  process.exit(0);
})();
