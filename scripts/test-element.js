// Runs one element end to end: click its cell on the Discovery Map, check the
// recipe loads and WAITS, press Enter, then watch for the reveal card.
// usage: node scripts/test-element.js 8 [shots]
const { chromium } = require('playwright');

const Z = parseInt(process.argv[2] || '8', 10);
const SHOTS = process.argv[3] === 'shots';
const TAG = process.argv[4] || ('z'+Z);

(async () => {
  const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('console', m => { if(m.type()==='error') errs.push('CONSOLE: '+m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
  const log = [];
  const say = (...a)=>{ log.push(a.join(' ')); console.log(...a); };

  await page.goto('http://localhost:8123/index.html?hq&fast=0.3');
  await page.waitForTimeout(1500);
  await page.click('#skip-intro');
  await page.waitForSelector('#lab-root.active', { timeout: 20000 });
  await page.waitForTimeout(1500);

  const name = await page.evaluate(z=> ElementProfiles.get(z).name, Z);
  const recipe = await page.evaluate(z=> ElementProfiles.get(z).recipe, Z);
  say(`## ${name} (Z=${Z}) — recipe ${recipe}`);

  // click the cell
  await page.evaluate(z=>{ document.querySelector(`#lab-ptable .pcell[data-z="${z}"]`).click(); }, Z);
  await page.waitForTimeout(700);
  const armed = await page.evaluate(()=>({
    slotA: document.getElementById('slot-a').textContent.replace(/\s+/g,' ').trim(),
    slotB: document.getElementById('slot-b').textContent.replace(/\s+/g,' ').trim(),
    banner: document.getElementById('question-banner-text').textContent.replace(/\s+/g,' ').trim(),
    bannerArmed: document.getElementById('question-banner').classList.contains('armed'),
    glowing: [...document.querySelectorAll('.cosmic-obj.hint-glow')].map(e=>e.dataset.id),
    running: document.getElementById('experiment-root').classList.contains('active'),
    activateReady: document.getElementById('activate-btn').classList.contains('ready'),
  }));
  say('slots:', JSON.stringify(armed));
  if(armed.running) say('!! FAIL: experiment auto-started without Enter');
  if(SHOTS) await page.screenshot({ path:`/tmp/el-${TAG}-1-armed.png` });

  // wait a beat to prove it does NOT auto-run
  await page.waitForTimeout(2500);
  const stillWaiting = !(await page.evaluate(()=> document.getElementById('experiment-root').classList.contains('active')));
  say('still waiting for Enter after 2.5s:', stillWaiting);

  // press Enter
  await page.keyboard.press('Enter');
  await page.waitForSelector('#experiment-root.active', { timeout: 8000 });
  say('experiment started on Enter');

  // capture a few frames through the sequence
  const marks = [];
  for(let i=0;i<9;i++){
    await page.waitForTimeout(3000);
    const st = await page.evaluate(()=>({
      c1: document.getElementById('exp-caption-1').textContent,
      eq: (document.querySelector('.nuc-step.active .nuc-eq')||{}).textContent || '',
      card: !!document.querySelector('.reveal-card'),
    }));
    marks.push(st.c1);
    if(SHOTS && i%2===0) await page.screenshot({ path:`/tmp/el-${TAG}-seq${i}.png` });
    if(st.card) break;
  }
  say('captions seen:', JSON.stringify([...new Set(marks.filter(Boolean))].slice(0,12)));

  // reveal
  try {
    await page.waitForSelector('.reveal-card.show', { timeout: 90000 });
  } catch(e){ say('!! FAIL: reveal card never appeared'); }
  await page.waitForTimeout(2000);
  const card = await page.evaluate(()=>{
    const c = document.querySelector('.reveal-card');
    if(!c) return null;
    return {
      sym: (c.querySelector('.rc-sym')||{}).textContent,
      name: (c.querySelector('.rc-name')||{}).textContent,
      shells: (c.querySelector('.rc-atom-info')||{}).textContent.replace(/\s+/g,' ').slice(0,140),
      site: (c.querySelector('.rc-site')||{}).textContent.replace(/\s+/g,' ').slice(0,110),
      eq: (c.querySelector('.rc-eq')||{}).textContent.replace(/\s+/g,' '),
      today: (c.querySelector('.rc-text')||{}).textContent.slice(0,90),
      origins: [...c.querySelectorAll('.origin-legend span')].map(s=>s.textContent.trim()),
      specimenCaption: (document.querySelector('.spec-caption')||{}).textContent,
      siblings: (document.querySelector('.sibling-row')||{}).textContent,
      hasSpectrum: !!c.querySelector('.spectrum'),
    };
  });
  say('card:', JSON.stringify(card, null, 1));
  if(SHOTS) await page.screenshot({ path:`/tmp/el-${TAG}-reveal.png` });

  // continue and check we are back in the lab with the element lit
  await page.keyboard.press('Enter');
  await page.waitForTimeout(Z===79 ? 4000 : 2500);
  if(Z===79){
    say('gold journey started:', await page.evaluate(()=> document.getElementById('exp-caption-1').textContent));
    const sawImagine = await page.waitForFunction(()=> document.body.innerText.toLowerCase().includes('imagine: the gold'), { timeout: 120000 }).then(()=>true).catch(()=>false);
    say('imagine line appeared:', sawImagine);
    if(SHOTS) await page.screenshot({ path:`/tmp/el-${TAG}-imagine.png` });
  } else {
    await page.waitForSelector('#experiment-root:not(.active)', { timeout: 20000 });
    await page.waitForTimeout(3500);
    const back = await page.evaluate(z=>({
      lit: document.querySelector(`#lab-ptable .pcell[data-z="${z}"]`).classList.contains('lit'),
      count: document.getElementById('ptable-count').textContent,
      slotsCleared: document.getElementById('slot-a').textContent.includes('+'),
    }), Z);
    say('back in lab:', JSON.stringify(back));
    if(SHOTS) await page.screenshot({ path:`/tmp/el-${TAG}-back.png` });
  }

  say('ERRORS', errs.length);
  errs.slice(0,12).forEach(e=> say(' -', e.slice(0,400)));
  await browser.close();
  process.exit(0);
})();
