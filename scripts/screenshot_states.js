const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:8123/index.html');
  await page.click('#skip-intro');
  await page.waitForSelector('#lab-root.active');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/s1-lab.png' });

  // select neutron pair to show extreme-tag + slots + question banner overlap zone
  await page.click('.cosmic-obj[data-id="neutronA"]');
  await page.click('.cosmic-obj[data-id="neutronB"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/s2-lab-extreme.png' });

  // hint click a few times
  await page.click('#hint-btn');
  await page.click('#hint-btn');
  await page.click('#hint-btn');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/s3-lab-hint.png' });

  // activate merger, capture various points
  await page.click('#activate-btn');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/s4-merger-start.png' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: '/tmp/s5-merger-inspiral.png' });

  await page.waitForSelector('.choice-btn', { timeout: 20000 });
  await page.screenshot({ path: '/tmp/s6-merger-choice.png' });
  await page.click('.choice-btn.recommended');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/s7-scale-zoom.png' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/tmp/s8-rprocess.png' });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: '/tmp/s9-rprocess2.png' });

  await page.waitForSelector('.followup-btn', { timeout: 60000 });
  await page.screenshot({ path: '/tmp/s10-gold-created.png' });
  await page.click('.followup-btn');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/s11-gold-journey1.png' });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: '/tmp/s12-gold-journey2.png' });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: '/tmp/s13-gold-journey3.png' });

  await browser.close();
})();
