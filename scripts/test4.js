const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('http://localhost:8123/index.html');
  await page.click('#skip-intro');
  await page.waitForSelector('#lab-root.active');
  await page.waitForTimeout(600);

  // 1. default target should be Explore
  const focusText = await page.$eval('#target-focus', el => el.textContent);
  console.log('default focus panel:', focusText.trim());
  const exploreActive = await page.$eval('.target-chip.explore-chip', el => el.classList.contains('active'));
  console.log('explore chip active by default:', exploreActive);

  // 2. select neutron pair, screenshot for overlap check
  await page.click('.cosmic-obj[data-id="neutronA"]');
  await page.click('.cosmic-obj[data-id="neutronB"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/fix1-extreme-tag.png' });

  await page.click('#activate-btn');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/fix2-merger-dimmed.png' });
  await page.waitForSelector('.choice-btn', { timeout: 35000 });
  await page.screenshot({ path: '/tmp/fix3-merger-choice.png' });
  await page.click('.choice-btn.recommended');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/fix4-scale-zoom.png' });

  await page.waitForSelector('.followup-btn', { timeout: 60000 });
  console.log('reached gold reveal; discovered so far:', await page.$eval('#ptable-count', el=>el.textContent));
  await page.click('.followup-btn');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/tmp/fix5-gold-journey.png' });

  // look for "imagine" line at some point during the how-old-is-gold beat
  let sawImagine = false;
  try {
    await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('imagine: the gold'), { timeout: 30000 });
    sawImagine = true;
  } catch(e) { sawImagine = false; }
  console.log('saw "Imagine: the gold..." line:', sawImagine);

  await page.waitForSelector('#experiment-root:not(.active)', { timeout: 60000 });
  console.log('back in lab after full journey');

  // 3. Hint highlighting test: set target to Gold, click hint repeatedly
  await page.click('.target-chip[data-id="Au"]');
  await page.click('#hint-btn');
  await page.click('#hint-btn');
  await page.click('#hint-btn');
  await page.waitForTimeout(300);
  const glowing = await page.$$eval('.cosmic-obj.hint-glow', els => els.map(e=>e.dataset.id));
  console.log('hint-glow highlighted objects:', glowing);
  await page.screenshot({ path: '/tmp/fix6-hint-glow.png' });

  // reset target to explore, clear slots
  await page.click('.target-chip.explore-chip');

  // 4. Click-to-learn on periodic table: find an undiscovered cell (e.g. Carbon, z=6)
  const clicked = await page.evaluate(() => {
    const target = document.querySelector('#lab-ptable .pcell[data-z="6"]');
    if (!target) return false;
    target.click();
    return true;
  });
  console.log('clicked Carbon cell:', clicked);
  await page.waitForTimeout(1400);
  const slotAText = await page.$eval('#slot-a', el => el.textContent);
  console.log('slot A after auto-solve click:', slotAText.trim());
  await page.screenshot({ path: '/tmp/fix7-autosolve-triggered.png' });
  await page.waitForSelector('#experiment-root.active', { timeout: 5000 });
  console.log('auto-solve launched an experiment');
  await page.waitForSelector('.exp-continue', { timeout: 35000 });
  await page.click('.exp-continue');
  await page.waitForSelector('#experiment-root:not(.active)', { timeout: 5000 });

  // 5. synthetic element click (should NOT launch an experiment)
  const clickedSynth = await page.evaluate(() => {
    const target = document.querySelector('#lab-ptable .pcell[data-z="99"]'); // Einsteinium, synthetic
    if (!target) return false;
    target.click();
    return true;
  });
  console.log('clicked synthetic (Es) cell:', clickedSynth);
  await page.waitForTimeout(500);
  const expActiveAfterSynth = await page.$eval('#experiment-root', el => el.classList.contains('active'));
  console.log('experiment launched for synthetic element (should be false):', expActiveAfterSynth);
  const tooltipVisible = await page.$eval('#elem-tooltip', el => el.classList.contains('show'));
  console.log('synthetic info tooltip shown:', tooltipVisible);

  console.log('TOTAL ERRORS:', errors.length);
  errors.forEach(e=>console.log(e));

  await browser.close();
})();
