// ==========================================================================
// COSMOS — the one persistent environment: a temperature-coloured starfield,
// a faint Milky Way band, drifting dust, and the render loop that drives the
// FX pipeline. Every state of the app (intro, lab, theater, gold journey)
// lives inside this single scene; nothing is ever torn down and rebuilt.
// ==========================================================================
(function(){

  const Cosmos = {
    scene:null, camera:null, renderer:null, clock:null,
    layers:{}, frameCallbacks:[],
    _camLookAt: new THREE.Vector3(0,0,0),
    _autoOrbit: null,
  };

  function init(canvas){
    Cosmos.scene = new THREE.Scene();
    Cosmos.camera = new THREE.PerspectiveCamera(52, window.innerWidth/window.innerHeight, 0.05, 12000);
    Cosmos.camera.position.set(0,0,400);

    Cosmos.renderer = new THREE.WebGLRenderer({ canvas, antialias:false, alpha:false, powerPreference:'high-performance', stencil:false });
    Cosmos.renderer.setSize(window.innerWidth, window.innerHeight);
    Cosmos.renderer.setClearColor(0x01030a, 1);
    Cosmos.clock = new THREE.Clock();

    FX.init(Cosmos.renderer, Cosmos.scene, Cosmos.camera);

    buildStarfield();
    buildMilkyWay();
    buildNebula();
    buildLights();

    window.addEventListener('resize', onResize);
    requestAnimationFrame(loop);
  }

  function onResize(){
    Cosmos.camera.aspect = window.innerWidth/window.innerHeight;
    Cosmos.camera.updateProjectionMatrix();
  }

  // ---------------- Starfield: three parallax shells, real stellar colours ----------------
  // Star colours follow a rough field-star temperature mix (mostly cool dwarfs,
  // a sprinkling of hot blue-white stars), so the sky reads as stars, not dots.
  function pickTemp(rnd){
    const r = rnd();
    if(r < 0.42) return 3200 + rnd()*900;    // M / late K
    if(r < 0.68) return 4200 + rnd()*900;    // K
    if(r < 0.84) return 5300 + rnd()*900;    // G
    if(r < 0.93) return 6300 + rnd()*900;    // F
    if(r < 0.985) return 7600 + rnd()*2200;  // A
    return 12000 + rnd()*14000;              // B / O
  }

  function buildStarfield(){
    const defs = [
      { count: 2600, radius: 2600, size: 1.5, speed: 0.0004, bright: 0.55 },
      { count: 1700, radius: 1500, size: 2.1, speed: 0.0010, bright: 0.8 },
      { count: 750,  radius: 850,  size: 3.0, speed: 0.0018, bright: 1.15 },
    ];
    Cosmos.layers.stars = [];
    defs.forEach((def, li)=>{
      const rnd = FX.rng(101+li);
      const pc = FX.pointCloud({ count:def.count, twinkle:0.18, soft:1, opacity:1,
        gen:()=>{
          const r = def.radius*(0.45 + 0.55*rnd());
          const th = rnd()*Math.PI*2, ph = Math.acos(rnd()*2-1);
          const c = FX.blackbody(pickTemp(rnd)).multiplyScalar(def.bright*(0.35 + rnd()*0.9));
          return { p:[r*Math.sin(ph)*Math.cos(th), r*Math.sin(ph)*Math.sin(th), r*Math.cos(ph)], c, s:def.size*(0.6+rnd()*1.1) };
        }});
      pc.points.userData.speed = def.speed;
      Cosmos.scene.add(pc.points);
      Cosmos.layers.stars.push(pc);
    });
  }

  // A faint band of unresolved stars + dust, tilted across the sky.
  function buildMilkyWay(){
    const rnd = FX.rng(77);
    const tilt = new THREE.Matrix4().makeRotationZ(0.42).multiply(new THREE.Matrix4().makeRotationX(0.28));
    const v = new THREE.Vector3();
    const pc = FX.pointCloud({ count: 9000, twinkle:0.06, opacity:0.75,
      gen:()=>{
        const r = 2100 + rnd()*500;
        const th = rnd()*Math.PI*2;
        // gaussian-ish latitude concentration
        const lat = (rnd()+rnd()+rnd()+rnd()-2)*0.16;
        v.set(Math.cos(th)*Math.cos(lat)*r, Math.sin(lat)*r, Math.sin(th)*Math.cos(lat)*r).applyMatrix4(tilt);
        const c = FX.blackbody(pickTemp(rnd)).multiplyScalar(0.16 + rnd()*0.3);
        return { p:[v.x,v.y,v.z], c, s:1.1+rnd()*1.2 };
      }});
    Cosmos.scene.add(pc.points);
    Cosmos.layers.milkyway = pc;
  }

  // ---------------- Soft nebulosity ----------------
  function buildNebula(){
    const group = new THREE.Group();
    const tints = ['#3b5bd0','#5b3fb0','#1f6f8f','#7a3f8f','#26558f','#3f2f8f'];
    for(let i=0;i<7;i++){
      const mat = new THREE.SpriteMaterial({ map:FX.tex.cloud, color:FX.lin(tints[i%tints.length]).multiplyScalar(0.55),
        transparent:true, opacity:0.5, depthWrite:false, blending:THREE.AdditiveBlending });
      const s = new THREE.Sprite(mat);
      const sc = 900 + Math.random()*1400;
      s.scale.set(sc, sc*(0.5+Math.random()*0.6), 1);
      s.position.set((Math.random()-0.5)*2600, (Math.random()-0.5)*1500, -700-Math.random()*1500);
      s.material.rotation = Math.random()*Math.PI;
      group.add(s);
    }
    Cosmos.layers.nebula = group;
    Cosmos.scene.add(group);
  }

  function buildLights(){
    Cosmos.scene.add(new THREE.AmbientLight(FX.lin('#2a3a60'), 0.55));
    const key = new THREE.DirectionalLight(FX.lin('#fff3e0'), 1.1); key.position.set(-6, 8, 10);
    Cosmos.scene.add(key); Cosmos.layers.keyLight = key;
    const rim = new THREE.DirectionalLight(FX.lin('#7fb0ff'), 0.7); rim.position.set(7, -3, -9);
    Cosmos.scene.add(rim); Cosmos.layers.rimLight = rim;
  }

  // ---------------- Opacity helpers used by scene transitions ----------------
  function setStarOpacity(v){
    Cosmos.layers.stars.forEach(pc=> pc.u.uOpacity.value = v);
    if(Cosmos.layers.milkyway) Cosmos.layers.milkyway.u.uOpacity.value = v*0.75;
  }
  function fadeStars(to, ms=800){
    const from = Cosmos.layers.stars[0].u.uOpacity.value;
    return FX.animate(ms, t=> setStarOpacity(FX.lerp(from, to, t)));
  }
  function setNebulaOpacity(v){ Cosmos.layers.nebula.children.forEach(s=> s.material.opacity = v); }
  function fadeNebula(to, ms=800){
    const from = Cosmos.layers.nebula.children[0].material.opacity;
    return FX.animate(ms, t=> setNebulaOpacity(FX.lerp(from, to, t)));
  }

  // ---------------- Compatibility helpers (used by the intro + gold journey) ----------------
  function spawnBurst(opts){
    opts = opts || {};
    return FX.burst(null, {
      position: opts.position, count: opts.count||200, color: '#'+new THREE.Color(opts.color!=null?opts.color:0xffffff).getHexString(),
      speed: opts.speed||60, size: opts.size||3, life: opts.life||2.2, radius: opts.spread||0, drag: 1.4,
      bias: opts.asymmetric ? [1.4,0,0] : null, intensity: 1.2,
    });
  }
  function createCloud(count, spread, color){
    const rnd = FX.rng(23);
    const c = FX.lin('#'+new THREE.Color(color!=null?color:0xffcf8f).getHexString());
    const pc = FX.pointCloud({ count: count||1500, opacity:0.8, twinkle:0.1,
      gen:()=>{
        const r = spread*Math.pow(rnd(), 0.55);
        const th = rnd()*Math.PI*2, ph = Math.acos(rnd()*2-1);
        return { p:[r*Math.sin(ph)*Math.cos(th), r*Math.sin(ph)*Math.sin(th)*0.5, r*Math.cos(ph)],
          c: c.clone().multiplyScalar(0.4+rnd()*0.9), s: 2.2*(0.5+rnd()) };
      }});
    Cosmos.scene.add(pc.points);
    return { pts:pc.points, geo:pc.points.geometry, mat:{ get size(){ return 1; }, set size(v){ pc.u.uSizeMul.value = v/2.4; } }, u:pc.u };
  }
  function lerpCameraTo(pos, lookAt, duration, easing){
    return FX.cam.to(pos, lookAt || new THREE.Vector3(0,0,0), duration||1600, easing);
  }
  function autoOrbitCamera(radius, height, speed){
    Cosmos._autoOrbit = { radius, height, speed, angle: Cosmos._autoOrbit ? Cosmos._autoOrbit.angle : 0.6, active:true };
  }
  function stopAutoOrbit(){ if(Cosmos._autoOrbit) Cosmos._autoOrbit.active = false; }

  // ---------------- Main loop ----------------
  function loop(){
    const dt = Math.min(0.05, Cosmos.clock.getDelta());
    Cosmos.layers.stars.forEach(pc=>{ pc.points.rotation.y += pc.points.userData.speed*dt*10; });
    if(Cosmos.layers.milkyway) Cosmos.layers.milkyway.points.rotation.y += 0.00004;
    Cosmos.layers.nebula.rotation.y += 0.00005;

    if(Cosmos._autoOrbit && Cosmos._autoOrbit.active){
      const o = Cosmos._autoOrbit;
      o.angle += o.speed;
      Cosmos.camera.position.set(Math.cos(o.angle)*o.radius, o.height, Math.sin(o.angle)*o.radius);
      Cosmos._camLookAt.set(0,0,0);
      Cosmos.camera.lookAt(0,0,0);
      FX.cam.look.set(0,0,0);
    }

    Cosmos.frameCallbacks.forEach(fn=>{ try{ fn(dt); }catch(e){ console.error(e); } });
    FX.update(dt);
    FX.render();
    FX.cam.restore();
    FX.adapt(dt);
    requestAnimationFrame(loop);
  }

  Object.assign(Cosmos, { init, spawnBurst, createCloud, lerpCameraTo, autoOrbitCamera, stopAutoOrbit,
    setNebulaOpacity, fadeNebula, setStarOpacity, fadeStars });
  window.Cosmos = Cosmos;
})();
