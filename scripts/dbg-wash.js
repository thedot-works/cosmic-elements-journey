// Why is the frame washed out during some nuclear acts?
// Isolates the culprit by hiding candidate objects one at a time.
// usage: node scripts/dbg-wash.js 26
const { chromium } = require('playwright');
const Z = parseInt(process.argv[2] || '26', 10);

(async () => {
  const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto('http://localhost:8123/index.html?hq&fast=0.4');
  await page.waitForTimeout(1400);
  await page.click('#skip-intro');
  await page.waitForSelector('#lab-root.active', { timeout: 20000 });
  await page.waitForTimeout(900);
  await page.evaluate(z=>{ document.querySelector(`#lab-ptable .pcell[data-z="${z}"]`).click(); }, Z);
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter');

  // wait until nucleons are on screen, then inspect
  for(let i=0;i<120;i++){
    const inst = await page.evaluate(()=>{ let n=0; FX.scene.traverse(o=>{ if(o.isInstancedMesh) n+=o.count; }); return n; });
    if(inst>0) break;
    await page.waitForTimeout(400);
  }
  const report = await page.evaluate(()=>{
    const out = { flash: FX.post.flash, bloom: FX.post.bloomStrength, exposure: FX.post.exposure,
      vignette: FX.post.vignette, objs: [] };
    FX.scene.traverse(o=>{
      if(!o.isMesh && !o.isPoints && !o.isSprite) return;
      const m = o.material || {};
      out.objs.push({ name:o.name||o.type, type:o.type, side:m.side, blending:m.blending,
        vis:o.visible, ro:o.renderOrder, uOpacity: m.uniforms && m.uniforms.uOpacity ? +m.uniforms.uOpacity.value.toFixed(3) : null,
        scale: +o.scale.x.toFixed(2), dist: +o.position.distanceTo(FX.camera.position).toFixed(1) });
    });
    return out;
  });
  console.log(JSON.stringify(report, null, 1).slice(0, 4000));

  await page.screenshot({ path:'/tmp/wash-all.png' });
  // hide the BackSide backdrop
  await page.evaluate(()=>{ FX.scene.traverse(o=>{ if(o.isMesh && o.material && o.material.side === THREE.BackSide) o.visible = false; }); });
  await page.waitForTimeout(400);
  await page.screenshot({ path:'/tmp/wash-nobd.png' });
  // restore, then hide everything additive
  await page.evaluate(()=>{ FX.scene.traverse(o=>{ if(o.isMesh && o.material && o.material.side === THREE.BackSide) o.visible = true;
    if((o.isPoints||o.isSprite) && o.material && o.material.blending === THREE.AdditiveBlending) o.visible = false; }); });
  await page.waitForTimeout(400);
  await page.screenshot({ path:'/tmp/wash-noadd.png' });
  // bloom off
  await page.evaluate(()=>{ FX.post.bloomStrength = 0; });
  await page.waitForTimeout(400);
  await page.screenshot({ path:'/tmp/wash-nobloom.png' });
  await browser.close();
  process.exit(0);
})();
