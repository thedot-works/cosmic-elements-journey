// Why are metals black? Checks the studio environment map and material lighting.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  page.on('console', m => console.log('CONSOLE['+m.type()+']', m.text().slice(0,700)));
  await page.goto('http://localhost:8123/dev/specimens.html?from=79&to=79');
  await page.waitForFunction(()=> document.title === 'SHEET READY', { timeout: 120000 });
  const out = await page.evaluate(()=>{
    const r = FX.renderer;
    const info = {
      env: !!FX.env, envType: FX.env && FX.env.constructor.name,
      mapping: FX.env && FX.env.mapping, encoding: FX.env && FX.env.encoding,
      isWebGL2: r.capabilities.isWebGL2, hdrType: FX.hdrType,
      lights: [], meshes: 0,
    };
    // build a fresh test scene with the same renderer
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 4/3, 0.1, 100);
    cam.position.set(0,0,4); cam.lookAt(0,0,0);
    const mat = new THREE.MeshStandardMaterial({ color:new THREE.Color(1.0,0.766,0.336), metalness:1, roughness:0.15,
      envMap: FX.env, envMapIntensity:1.2 });
    const sphere = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 48, 32), mat);
    scene.add(sphere);
    const key = new THREE.DirectionalLight(new THREE.Color(1,1,1), 3.0); key.position.set(-3,4,4); scene.add(key);
    r.toneMapping = THREE.ACESFilmicToneMapping; r.outputEncoding = THREE.sRGBEncoding;
    r.setRenderTarget(null);
    r.setSize(200,150,false);
    r.compile(scene, cam);
    r.render(scene, cam);
    const gl = r.getContext();
    info.glError = gl.getError();
    info.programs = r.info.programs.length;
    const px = new Uint8Array(200*150*4);
    gl.readPixels(0,0,200,150,gl.RGBA,gl.UNSIGNED_BYTE,px);
    let sum=0, max=0; for(let i=0;i<px.length;i+=4){ const v=(px[i]+px[i+1]+px[i+2])/3; sum+=v; max=Math.max(max,v); }
    info.metalAvg = (sum/(px.length/4)).toFixed(1); info.metalMax = max;
    // same but with a dielectric
    mat.metalness = 0; mat.needsUpdate = true;
    r.render(scene, cam);
    gl.readPixels(0,0,200,150,gl.RGBA,gl.UNSIGNED_BYTE,px);
    sum=0; max=0; for(let i=0;i<px.length;i+=4){ const v=(px[i]+px[i+1]+px[i+2])/3; sum+=v; max=Math.max(max,v); }
    info.dielectricAvg = (sum/(px.length/4)).toFixed(1); info.dielectricMax = max;
    // and with no env at all
    mat.metalness = 1; mat.envMap = null; mat.needsUpdate = true;
    r.render(scene, cam);
    gl.readPixels(0,0,200,150,gl.RGBA,gl.UNSIGNED_BYTE,px);
    sum=0; max=0; for(let i=0;i<px.length;i+=4){ const v=(px[i]+px[i+1]+px[i+2])/3; sum+=v; max=Math.max(max,v); }
    info.metalNoEnvAvg = (sum/(px.length/4)).toFixed(1); info.metalNoEnvMax = max;
    return info;
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
  process.exit(0);
})();
