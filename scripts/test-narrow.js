// Checks the narrow-screen layout: lab, an element run, and the reveal card,
// looking for anything that overflows or sits on top of something else.
// usage: node scripts/test-narrow.js [width] [height]
const { chromium } = require('playwright');
const W = parseInt(process.argv[2] || '430', 10), H = parseInt(process.argv[3] || '900', 10);

const overlaps = (a, b)=> !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);

(async () => {
  const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  page.on('console', m => { if(m.type()==='error') errs.push(m.text().slice(0,160)); });
  page.on('pageerror', e => errs.push('PAGEERROR: '+e.message.slice(0,160)));

  await page.goto('http://localhost:8123/index.html?hq&fast=0.3');
  await page.waitForTimeout(1300);
  await page.click('#skip-intro');
  await page.waitForSelector('#lab-root.active', { timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path:`/tmp/narrow-${W}-lab.png` });

  const check = async (tag, sels)=>{
    const boxes = await page.evaluate(ss=>{
      const out = [];
      ss.forEach(s=> document.querySelectorAll(s).forEach(el=>{
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        if(st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) return;
        if(r.width < 2 || r.height < 2) return;
        out.push({ sel:s, left:r.left, top:r.top, right:r.right, bottom:r.bottom });
      }));
      return out;
    }, sels);
    const issues = [];
    boxes.forEach(b=>{
      if(b.right > W + 1 || b.left < -1) issues.push(`${tag}: ${b.sel} overflows x (${b.left.toFixed(0)}..${b.right.toFixed(0)})`);
      if(b.bottom > H + 1 || b.top < -1) issues.push(`${tag}: ${b.sel} overflows y (${b.top.toFixed(0)}..${b.bottom.toFixed(0)})`);
    });
    for(let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++){
      if(boxes[i].sel !== boxes[j].sel && overlaps(boxes[i], boxes[j]))
        issues.push(`${tag}: ${boxes[i].sel} overlaps ${boxes[j].sel}`);
    }
    return issues;
  };

  const found = [];
  found.push(...await check('lab', ['#forge-slots', '#target-panel', '.ptable-panel', '#question-banner', '#object-library', '.lab-header', '#discovered-ticker']));

  await page.evaluate(()=>{ document.querySelector('#lab-ptable .pcell[data-z="8"]').click(); });
  await page.waitForTimeout(700);
  await page.screenshot({ path:`/tmp/narrow-${W}-armed.png` });
  found.push(...await check('armed', ['#forge-slots', '#target-panel', '.ptable-panel', '#question-banner']));

  await page.keyboard.press('Enter');
  await page.waitForSelector('#experiment-root.active', { timeout: 40000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path:`/tmp/narrow-${W}-act1.png` });
  found.push(...await check('act1', ['.exp-caption', '#exp-hud', '#exp-side', '#exp-foot', '#exp-actions']));

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
  await page.screenshot({ path:`/tmp/narrow-${W}-reveal.png` });
  found.push(...await check('reveal', ['.reveal-card', '.spec-caption', '.sibling-row', '#exp-actions', '#exp-foot']));

  console.log(JSON.stringify({ viewport:`${W}x${H}`, issues: found, errors: errs.length, firstErrors: errs.slice(0,3) }, null, 1));
  await browser.close();
  process.exit(0);
})();
