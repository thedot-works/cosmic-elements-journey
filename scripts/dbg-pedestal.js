const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 500, height: 400 } });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto('http://localhost:8123/dev/specimens.html?from=26&to=26');
  await page.waitForFunction(()=> document.title === 'SHEET READY', { timeout: 120000 });
  const out = await page.evaluate(()=>{
    const r = FX.renderer;
    const found = [];
    FX.scene.traverse(o=>{
      if(o.isMesh){
        const m = o.material;
        found.push({ type:o.geometry.type, name:o.name||'', mat:m.type,
          color: m.color ? '#'+m.color.getHexString() : null,
          rough: m.roughness, metal: m.metalness, env: !!m.envMap, envI: m.envMapIntensity,
          y: +o.position.y.toFixed(2), scale:+o.scale.x.toFixed(2),
          visible:o.visible });
      }
      if(o.isLight) found.push({ light:o.type, intensity:o.intensity, color:'#'+o.color.getHexString() });
    });
    return found;
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
  process.exit(0);
})();
