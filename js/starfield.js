// ==========================================================================
// COSMOS — persistent Three.js environment: starfield, nebula, camera,
// and a small toolkit of reusable particle/visual effects shared by every
// state in the experience (intro, lab, experiments, merger, gold journey).
// ==========================================================================
(function(){

  const Cosmos = {
    scene: null, camera: null, renderer: null,
    clock: null,
    layers: {},
    frameCallbacks: [],
    _camTarget: null,
    _camLookAt: new THREE.Vector3(0,0,0),
    _camAnim: null,
  };

  function init(canvas){
    Cosmos.scene = new THREE.Scene();
    Cosmos.scene.fog = new THREE.FogExp2(0x02040a, 0.0009);

    Cosmos.camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 6000);
    Cosmos.camera.position.set(0, 0, 400);

    Cosmos.renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'high-performance' });
    Cosmos.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    Cosmos.renderer.setSize(window.innerWidth, window.innerHeight);
    Cosmos.renderer.setClearColor(0x02040a, 1);

    Cosmos.clock = new THREE.Clock();

    buildStarfield();
    buildNebula();
    buildAmbientLight();

    window.addEventListener('resize', onResize);
    requestAnimationFrame(loop);
  }

  function onResize(){
    Cosmos.camera.aspect = window.innerWidth/window.innerHeight;
    Cosmos.camera.updateProjectionMatrix();
    Cosmos.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ---------------- Starfield (parallax depth layers) ----------------
  function buildStarfield(){
    const layerDefs = [
      { count: 2200, radius: 2600, size: 1.6, speed: 0.0006, color: 0xaac4ff },
      { count: 1400, radius: 1600, size: 2.2, speed: 0.0012, color: 0xffffff },
      { count: 700,  radius: 900,  size: 3.0, speed: 0.002,  color: 0xffe9c8 },
    ];
    Cosmos.layers.stars = [];
    layerDefs.forEach(def=>{
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(def.count*3);
      for(let i=0;i<def.count;i++){
        const r = def.radius * (0.4 + 0.6*Math.random());
        const theta = Math.random()*Math.PI*2;
        const phi = Math.acos((Math.random()*2)-1);
        positions[i*3]   = r*Math.sin(phi)*Math.cos(theta);
        positions[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
        positions[i*3+2] = r*Math.cos(phi);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
      const mat = new THREE.PointsMaterial({
        color: def.color, size: def.size, sizeAttenuation:true,
        transparent:true, opacity:0.85, depthWrite:false,
      });
      const pts = new THREE.Points(geo, mat);
      pts.userData.speed = def.speed;
      Cosmos.scene.add(pts);
      Cosmos.layers.stars.push(pts);
    });
  }

  // ---------------- Subtle nebula (soft sprite blobs) ----------------
  function buildNebula(){
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128,128,0,128,128,128);
    grad.addColorStop(0, 'rgba(120,140,255,0.35)');
    grad.addColorStop(0.5, 'rgba(90,60,160,0.14)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,256,256);
    const tex = new THREE.CanvasTexture(canvas);

    const group = new THREE.Group();
    const blobCount = 5;
    for(let i=0;i<blobCount;i++){
      const mat = new THREE.SpriteMaterial({ map: tex, transparent:true, opacity:0.5, depthWrite:false, blending: THREE.AdditiveBlending });
      const spr = new THREE.Sprite(mat);
      const s = 800 + Math.random()*900;
      spr.scale.set(s,s,1);
      spr.position.set((Math.random()-0.5)*2000, (Math.random()-0.5)*1200, -600-Math.random()*1200);
      group.add(spr);
    }
    Cosmos.layers.nebula = group;
    Cosmos.scene.add(group);
  }

  function buildAmbientLight(){
    Cosmos.scene.add(new THREE.AmbientLight(0x304070, 1.2));
    const pl = new THREE.PointLight(0x6fa8ff, 0.6, 4000);
    pl.position.set(0,0,200);
    Cosmos.scene.add(pl);
    Cosmos.layers.keyLight = pl;
  }

  // ---------------- Generic particle burst system ----------------
  // opts: {position, count, color, spread, speed, size, life, gravity, asymmetric}
  function spawnBurst(opts){
    opts = Object.assign({
      position: new THREE.Vector3(0,0,0), count:200, color:0xffffff,
      spread: 40, speed: 60, size: 3, life: 2.2, drag: 0.98, asymmetric:false
    }, opts);
    const count = opts.count;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count*3);
    const velocities = new Float32Array(count*3);
    for(let i=0;i<count;i++){
      let dir = new THREE.Vector3((Math.random()-0.5), (Math.random()-0.5), (Math.random()-0.5)).normalize();
      if(opts.asymmetric){
        // bias along a tidal-tail axis for kilonova-style ejecta
        dir.x += 1.4; dir.normalize();
      }
      const spd = opts.speed * (0.4+Math.random()*1.1);
      velocities[i*3] = dir.x*spd; velocities[i*3+1] = dir.y*spd; velocities[i*3+2] = dir.z*spd;
      positions[i*3]=opts.position.x; positions[i*3+1]=opts.position.y; positions[i*3+2]=opts.position.z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
    const mat = new THREE.PointsMaterial({
      color: opts.color, size: opts.size, transparent:true, opacity:1,
      depthWrite:false, blending: THREE.AdditiveBlending, sizeAttenuation:true
    });
    const pts = new THREE.Points(geo, mat);
    Cosmos.scene.add(pts);
    const start = performance.now();
    const update = ()=>{
      const t = (performance.now()-start)/1000;
      const arr = geo.attributes.position.array;
      for(let i=0;i<count;i++){
        velocities[i*3]*=opts.drag; velocities[i*3+1]*=opts.drag; velocities[i*3+2]*=opts.drag;
        arr[i*3]+=velocities[i*3]*0.016;
        arr[i*3+1]+=velocities[i*3+1]*0.016;
        arr[i*3+2]+=velocities[i*3+2]*0.016;
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = Math.max(0, 1 - t/opts.life);
      if(t >= opts.life){
        Cosmos.scene.remove(pts); geo.dispose(); mat.dispose();
        Cosmos.frameCallbacks = Cosmos.frameCallbacks.filter(f=>f!==update);
      }
    };
    Cosmos.frameCallbacks.push(update);
    return pts;
  }

  // ---------------- Orbiting pair (neutron star merger) ----------------
  function createOrbitingPair(colorA, colorB){
    const group = new THREE.Group();
    const geo = new THREE.SphereGeometry(6, 24, 24);
    const matA = new THREE.MeshBasicMaterial({ color: colorA });
    const matB = new THREE.MeshBasicMaterial({ color: colorB });
    const a = new THREE.Mesh(geo, matA);
    const b = new THREE.Mesh(geo, matB);
    const glowA = new THREE.PointLight(colorA, 1.4, 300); a.add(glowA);
    const glowB = new THREE.PointLight(colorB, 1.4, 300); b.add(glowB);
    group.add(a); group.add(b);
    Cosmos.scene.add(group);

    const state = { radius: 220, angle:0, speed:0.004, a, b, group };
    const update = ()=>{
      state.angle += state.speed;
      const rA = state.radius*0.52, rB = state.radius*0.48;
      a.position.set(Math.cos(state.angle)*rA, Math.sin(state.angle)*rA*0.35, Math.sin(state.angle)*rA);
      b.position.set(-Math.cos(state.angle)*rB, -Math.sin(state.angle)*rB*0.35, -Math.sin(state.angle)*rB);
    };
    Cosmos.frameCallbacks.push(update);
    state._update = update;
    return state;
  }

  function removeOrbitingPair(state){
    Cosmos.frameCallbacks = Cosmos.frameCallbacks.filter(f=>f!==state._update);
    Cosmos.scene.remove(state.group);
  }

  // ---------------- Spacetime grid (ripples on inspiral) ----------------
  function createSpacetimeGrid(){
    const size = 900, seg = 48;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI/2.4);
    const mat = new THREE.MeshBasicMaterial({ color:0x3a5fb0, wireframe:true, transparent:true, opacity:0.22 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -120;
    Cosmos.scene.add(mesh);
    const basePos = geo.attributes.position.array.slice();
    const state = { mesh, geo, basePos, rippleT:0, active:true };
    const update = ()=>{
      if(!state.active) return;
      state.rippleT += 0.045;
      const pos = geo.attributes.position;
      for(let i=0;i<pos.count;i++){
        const x = basePos[i*3], z = basePos[i*3+2];
        const d = Math.sqrt(x*x+z*z);
        const wave = Math.sin(d*0.05 - state.rippleT*state.freq)*state.amp;
        pos.setY(i, wave);
      }
      pos.needsUpdate = true;
    };
    state.amp = 4; state.freq = 2;
    Cosmos.frameCallbacks.push(update);
    state._update = update;
    return state;
  }
  function removeSpacetimeGrid(state){
    state.active=false;
    Cosmos.frameCallbacks = Cosmos.frameCallbacks.filter(f=>f!==state._update);
    Cosmos.scene.remove(state.mesh);
  }

  // ---------------- Molecular cloud → star collapse ----------------
  function createCloud(count, spread, color){
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count*3);
    const targets = new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const r = spread*Math.pow(Math.random(),0.5);
      const theta = Math.random()*Math.PI*2, phi = Math.acos(Math.random()*2-1);
      positions[i*3]=r*Math.sin(phi)*Math.cos(theta);
      positions[i*3+1]=r*Math.sin(phi)*Math.sin(theta)*0.4;
      positions[i*3+2]=r*Math.cos(phi);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
    const mat = new THREE.PointsMaterial({ color, size:2.4, transparent:true, opacity:0.75, blending:THREE.AdditiveBlending, depthWrite:false });
    const pts = new THREE.Points(geo, mat);
    Cosmos.scene.add(pts);
    return { pts, geo, mat };
  }

  // ---------------- Camera controls ----------------
  function lerpCameraTo(pos, lookAt, duration, ease){
    return new Promise(resolve=>{
      const start = Cosmos.camera.position.clone();
      const startLook = Cosmos._camLookAt.clone();
      const t0 = performance.now();
      ease = ease || (t=> t<0.5 ? 2*t*t : -1+(4-2*t)*t);
      function step(){
        const t = Math.min(1, (performance.now()-t0)/duration);
        const e = ease(t);
        Cosmos.camera.position.lerpVectors(start, pos, e);
        const look = new THREE.Vector3().lerpVectors(startLook, lookAt, e);
        Cosmos.camera.lookAt(look);
        Cosmos._camLookAt.copy(look);
        if(t<1){ requestAnimationFrame(step); } else { resolve(); }
      }
      step();
    });
  }

  function autoOrbitCamera(radius, height, speed){
    Cosmos._autoOrbit = { radius, height, speed, angle: Cosmos._autoOrbit ? Cosmos._autoOrbit.angle : 0, active:true };
  }
  function stopAutoOrbit(){ if(Cosmos._autoOrbit) Cosmos._autoOrbit.active = false; }

  function setNebulaOpacity(v){
    Cosmos.layers.nebula.children.forEach(s=> s.material.opacity = v);
  }

  function loop(){
    const dt = Cosmos.clock.getDelta();
    Cosmos.layers.stars.forEach(pts=>{ pts.rotation.y += pts.userData.speed*dt*10; });
    Cosmos.layers.nebula.rotation.y += 0.00006;

    if(Cosmos._autoOrbit && Cosmos._autoOrbit.active){
      const o = Cosmos._autoOrbit;
      o.angle += o.speed;
      Cosmos.camera.position.set(Math.cos(o.angle)*o.radius, o.height, Math.sin(o.angle)*o.radius);
      Cosmos.camera.lookAt(0,0,0);
    }

    Cosmos.frameCallbacks.forEach(fn=>{ try{ fn(dt); }catch(e){ console.error(e); } });
    Cosmos.renderer.render(Cosmos.scene, Cosmos.camera);
    requestAnimationFrame(loop);
  }

  Cosmos.init = init;
  Cosmos.spawnBurst = spawnBurst;
  Cosmos.createOrbitingPair = createOrbitingPair;
  Cosmos.removeOrbitingPair = removeOrbitingPair;
  Cosmos.createSpacetimeGrid = createSpacetimeGrid;
  Cosmos.removeSpacetimeGrid = removeSpacetimeGrid;
  Cosmos.createCloud = createCloud;
  Cosmos.lerpCameraTo = lerpCameraTo;
  Cosmos.autoOrbitCamera = autoOrbitCamera;
  Cosmos.stopAutoOrbit = stopAutoOrbit;
  Cosmos.setNebulaOpacity = setNebulaOpacity;

  window.Cosmos = Cosmos;
})();
