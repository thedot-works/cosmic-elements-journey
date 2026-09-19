// ==========================================================================
// FX OBJECTS — reusable, shader-driven building blocks for every cosmic scene:
// stars (granulation, limb darkening, corona), onion-shell cutaways, GPU
// particles, point clouds (galaxies, disks, nebulae), shock shells, a
// gravitational-wave spacetime grid, a procedural Earth, streaks and beams.
// Every factory accepts a Stage (FX.stage) and registers its own animation.
// ==========================================================================
(function(){
  const NOISE = () => FX.glsl.noise;
  const V3 = (x,y,z)=> new THREE.Vector3(x,y,z);

  function pointScale(){ return window.innerHeight * FX.quality.pixelRatio * 0.5; }

  // ------------------------------------------------------------------ sprites
  FX.glowSprite = function(color, size, opts={}){
    const mat = new THREE.SpriteMaterial({ map: opts.flare ? FX.tex.flare : FX.tex.glow, color: FX.lin(color).multiplyScalar(opts.intensity||1),
      transparent:true, depthWrite:false, depthTest: opts.depthTest!==undefined ? opts.depthTest : true, blending:THREE.AdditiveBlending, opacity: opts.opacity!=null?opts.opacity:1 });
    const s = new THREE.Sprite(mat); s.scale.set(size,size,1);
    if(opts.stage) opts.stage.add(s, opts.parent);
    return s;
  };

  // ------------------------------------------------------------------ GPU ballistic particles
  // spawn(i) -> { p:[x,y,z], v:[x,y,z], c:THREE.Color(linear), s:size, d:delay(s), l:life(s) }
  FX.particles = function(opts){
    const n = opts.count;
    const pos = new Float32Array(n*3), vel = new Float32Array(n*3), col = new Float32Array(n*3), size = new Float32Array(n), life = new Float32Array(n*2);
    let maxLife = 0;
    for(let i=0;i<n;i++){
      const q = opts.spawn(i);
      pos.set(q.p||[0,0,0], i*3); vel.set(q.v||[0,0,0], i*3);
      const c = q.c || new THREE.Color(1,1,1); col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
      size[i] = q.s!=null ? q.s : 2; life[i*2] = q.d||0; life[i*2+1] = q.l||2;
      maxLife = Math.max(maxLife, (q.d||0)+(q.l||2));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos,3));
    g.setAttribute('aVel', new THREE.BufferAttribute(vel,3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col,3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size,1));
    g.setAttribute('aLife', new THREE.BufferAttribute(life,2));
    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending: opts.normal ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms:{ uTime:{value:0}, uDrag:{value:opts.drag!=null?opts.drag:1.2}, uGravity:{value: opts.gravity||V3(0,0,0)},
        uScale:{value:pointScale()}, uFadeStart:{value: opts.fadeStart!=null?opts.fadeStart:0.35}, uIntensity:{value: opts.intensity||1},
        uGrow:{value: opts.grow||0} },
      vertexShader:`attribute vec3 aVel; attribute vec3 aColor; attribute float aSize; attribute vec2 aLife;
        uniform float uTime, uDrag, uScale, uFadeStart, uGrow; uniform vec3 uGravity;
        varying vec3 vColor; varying float vAlpha;
        void main(){
          float t = uTime - aLife.x;
          float alive = step(0.0, t) * step(t, aLife.y);
          float tt = max(t, 0.0);
          vec3 disp = uDrag > 0.0 ? aVel * (1.0 - exp(-uDrag*tt)) / uDrag : aVel*tt;
          vec3 p = position + disp + 0.5*uGravity*tt*tt;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float k = clamp(tt / aLife.y, 0.0, 1.0);
          vAlpha = alive * (1.0 - smoothstep(uFadeStart, 1.0, k)) * smoothstep(0.0, 0.04, k);
          gl_PointSize = clamp(aSize * (1.0 + uGrow*k) * uScale / -mv.z, 0.0, 256.0);
          vColor = aColor;
        }`,
      fragmentShader:`uniform float uIntensity; varying vec3 vColor; varying float vAlpha;
        void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); a *= a;
          if(vAlpha*a < 0.002) discard; gl_FragColor = vec4(vColor*uIntensity, vAlpha*a); }`,
    });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
    if(opts.position) pts.position.copy(opts.position);
    const stage = opts.stage;
    if(stage) stage.add(pts, opts.parent); else (opts.parent||FX.scene).add(pts);
    const t0 = FX.time;
    const P = { points:pts, material:mat, maxLife };
    const stop = (stage ? stage.onFrame : FX.onFrame)((dt, t)=>{
      mat.uniforms.uTime.value = (FX.time - t0) * (opts.timeScale||1);
      mat.uniforms.uScale.value = pointScale();
      if(!opts.keep && mat.uniforms.uTime.value > maxLife + 0.1){
        stop(); if(pts.parent) pts.parent.remove(pts); g.dispose(); mat.dispose();
      }
    });
    return P;
  };

  // Spherical burst helper
  FX.burst = function(stage, o){
    const c1 = FX.lin(o.color||'#ffffff'), c2 = FX.lin(o.color2||o.color||'#ffffff');
    const rnd = Math.random;
    return FX.particles(Object.assign({ stage, count:o.count||400, drag:o.drag!=null?o.drag:1.6, position:o.position, gravity:o.gravity,
      intensity:o.intensity||1, fadeStart:o.fadeStart, grow:o.grow,
      spawn:()=>{
        let x=rnd()*2-1, y=rnd()*2-1, z=rnd()*2-1; const m=Math.hypot(x,y,z)||1; x/=m; y/=m; z/=m;
        if(o.flatten) y *= o.flatten;
        if(o.bias){ x += o.bias[0]; y += o.bias[1]; z += o.bias[2]; }
        const sp = (o.speed||40)*(0.35 + rnd()*0.9);
        const r = (o.radius||0)*rnd();
        return { p:[x*r,y*r,z*r], v:[x*sp,y*sp,z*sp], c:c1.clone().lerp(c2, rnd()), s:(o.size||3)*(0.5+rnd()), d:(o.delay||0)*rnd(), l:(o.life||2)*(0.6+rnd()*0.6) };
      } }, o.extra||{}));
  };

  // ------------------------------------------------------------------ persistent point clouds
  // positions/colors (linear)/sizes; optional Keplerian or rigid spin about Y, twinkle.
  FX.pointCloud = function(opts){
    const n = opts.count;
    const pos = new Float32Array(n*3), col = new Float32Array(n*3), size = new Float32Array(n), seed = new Float32Array(n);
    for(let i=0;i<n;i++){
      const q = opts.gen(i);
      pos[i*3]=q.p[0]; pos[i*3+1]=q.p[1]; pos[i*3+2]=q.p[2];
      col[i*3]=q.c.r; col[i*3+1]=q.c.g; col[i*3+2]=q.c.b; size[i]=q.s; seed[i]=Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos,3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col,3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size,1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed,1));
    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending: opts.normal ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms:{ uTime:{value:0}, uScale:{value:pointScale()}, uOpacity:{value: opts.opacity!=null?opts.opacity:1},
        uSpin:{value:opts.spin||0}, uSpinPow:{value: opts.spinPow!=null?opts.spinPow:0}, uTwinkle:{value:opts.twinkle||0},
        uSizeMul:{value:1}, uSoft:{value: opts.soft!=null?opts.soft:1}, uExpand:{value:1}, uSwirl:{value: opts.swirl||0} },
      vertexShader:`attribute vec3 aColor; attribute float aSize; attribute float aSeed;
        uniform float uTime, uScale, uOpacity, uSpin, uSpinPow, uTwinkle, uSizeMul, uExpand, uSwirl;
        varying vec3 vColor; varying float vA;
        void main(){
          vec3 p = position * uExpand;
          if(uSpin != 0.0){
            float r = length(position.xz) + 0.001;
            float ang = uSpin * uTime * pow(r, -uSpinPow) + uSwirl*aSeed;
            float c = cos(ang), s = sin(ang);
            p.xz = vec2(c*p.x - s*p.z, s*p.x + c*p.z);
          }
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float tw = 1.0 + uTwinkle * sin(uTime*(1.5+aSeed*3.0) + aSeed*40.0);
          gl_PointSize = clamp(aSize * uSizeMul * uScale / -mv.z, 0.0, 200.0);
          vColor = aColor * tw; vA = uOpacity;
        }`,
      fragmentShader:`uniform float uSoft; varying vec3 vColor; varying float vA;
        void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.5 - 0.5*uSoft, d); a *= a;
          if(a*vA < 0.003) discard; gl_FragColor = vec4(vColor, a*vA); }`,
    });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
    if(opts.stage) opts.stage.add(pts, opts.parent);
    (opts.stage ? opts.stage.onFrame : FX.onFrame)((dt)=>{ mat.uniforms.uTime.value += dt * (opts.timeScale||1); mat.uniforms.uScale.value = pointScale(); });
    return { points:pts, material:mat, u:mat.uniforms };
  };

  // ------------------------------------------------------------------ star
  const STAR_VERT = `
    varying vec3 vNormalW; varying vec3 vPosO; varying vec3 vViewDir;
    #include <clipping_planes_pars_vertex>
    void main(){
      vPosO = position;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vNormalW = normalize(mat3(modelMatrix) * normal);
      vViewDir = normalize(cameraPosition - wp.xyz);
      vec4 mvPosition = viewMatrix * wp;
      gl_Position = projectionMatrix * mvPosition;
      #include <clipping_planes_vertex>
    }`;

  FX.star = function(opts={}){
    const stage = opts.stage;
    const group = new THREE.Group();
    const radius = opts.radius||10;
    const col = opts.temp ? FX.blackbody(opts.temp) : FX.lin(opts.color||'#ffd27a');
    const hot = col.clone().lerp(new THREE.Color(1,1,1), 0.3);
    const surfMat = new THREE.ShaderMaterial({
      clipping: !!opts.clip, clippingPlanes: opts.clip||null, clipIntersection: !!opts.clip,
      uniforms:{ uTime:{value:Math.random()*100}, uColor:{value:col}, uHot:{value:hot}, uGran:{value:opts.granulation||9},
        uBright:{value:opts.brightness!=null?opts.brightness:1.15}, uSpots:{value:opts.spots||0}, uContrast:{value:opts.contrast!=null?opts.contrast:0.9},
        uLimb:{value:opts.limb!=null?opts.limb:0.8}, uFlow:{value:opts.flow||1} },
      vertexShader: STAR_VERT,
      fragmentShader: NOISE() + `
        uniform float uTime, uGran, uBright, uSpots, uContrast, uLimb, uFlow; uniform vec3 uColor, uHot;
        varying vec3 vNormalW; varying vec3 vPosO; varying vec3 vViewDir;
        #include <clipping_planes_pars_fragment>
        void main(){
          #include <clipping_planes_fragment>
          float mu = clamp(dot(vNormalW, vViewDir), 0.0, 1.0);
          vec3 p = normalize(vPosO);
          float t = uTime * 0.04 * uFlow;
          float g1 = snoise(p*uGran + vec3(t, -t*0.8, t*0.6));
          float g2 = snoise(p*uGran*2.7 + vec3(-t*1.4, t, 0.0));
          float cells = 1.0 - abs(g1);            // bright granule centres, dark lanes
          float gran = cells*0.75 + 0.25*(g2*0.5+0.5);
          float big = fbm3(p*2.1 + vec3(0.0, t*0.3, 7.0));
          float spot = smoothstep(0.42, 0.6, big) * uSpots;
          float limb = mix(1.0, pow(mu, 0.6), uLimb);
          vec3 c = mix(uColor*0.72, uHot, gran);
          c *= (1.0 - uContrast*0.5) + uContrast*0.85*gran;
          c *= limb * mix(1.0, 0.22, spot);
          gl_FragColor = vec4(c * uBright, 1.0);
        }`,
    });
    const surf = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 96, 64), surfMat);
    surf.scale.setScalar(radius);
    group.add(surf);

    // corona: fresnel shell just outside the photosphere
    const corMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.BackSide,
      clipping: !!opts.clip, clippingPlanes: opts.clip||null, clipIntersection: !!opts.clip,
      uniforms:{ uColor:{value:col.clone().lerp(new THREE.Color(1,1,1),0.15)}, uIntensity:{value: opts.corona!=null?opts.corona:0.8}, uPower:{value:3.4} },
      vertexShader: STAR_VERT,
      fragmentShader:`uniform vec3 uColor; uniform float uIntensity, uPower; varying vec3 vNormalW; varying vec3 vPosO; varying vec3 vViewDir;
        #include <clipping_planes_pars_fragment>
        void main(){
          #include <clipping_planes_fragment>
          float f = 1.0 - abs(dot(vNormalW, vViewDir)); f = pow(f, uPower);
          gl_FragColor = vec4(uColor*uIntensity, f); }`,
    });
    const corona = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 64, 32), corMat);
    corona.scale.setScalar(radius*1.18);
    if(!opts.noCorona) group.add(corona);

    let glow = null;
    if(!opts.noGlow){
      glow = FX.glowSprite(col.clone().lerp(new THREE.Color(1,1,1),0.1), radius*(opts.glowScale||3.4), { intensity: opts.glow!=null?opts.glow:0.42 });
      group.add(glow);
    }
    if(opts.position) group.position.copy(opts.position);
    if(stage){
      stage.add(group, opts.parent);
      stage.onFrame((dt)=>{ surfMat.uniforms.uTime.value += dt; });
    }
    const S = { group, surf, corona, glow, uniforms: surfMat.uniforms, radius };
    S.setRadius = r=>{ S.radius = r; surf.scale.setScalar(r); corona.scale.setScalar(r*1.18); if(glow) glow.scale.set(r*(opts.glowScale||6), r*(opts.glowScale||6), 1); };
    S.setTemp = K=>{ const c = FX.blackbody(K); surfMat.uniforms.uColor.value.copy(c); surfMat.uniforms.uHot.value.copy(c.clone().lerp(new THREE.Color(1,1,1),0.55)); corMat.uniforms.uColor.value.copy(c.clone().lerp(new THREE.Color(1,1,1),0.3)); if(glow) glow.material.color.copy(c.clone().lerp(new THREE.Color(1,1,1),0.1)).multiplyScalar(opts.glow!=null?opts.glow:0.42); };
    S.setColor = hex=>{ const c = FX.lin(hex); surfMat.uniforms.uColor.value.copy(c); surfMat.uniforms.uHot.value.copy(c.clone().lerp(new THREE.Color(1,1,1),0.55)); corMat.uniforms.uColor.value.copy(c); if(glow) glow.material.color.copy(c); };
    S.setBright = b=>{ surfMat.uniforms.uBright.value = b; };
    return S;
  };

  // ------------------------------------------------------------------ onion-shell cutaway caps
  // shells: [{r (0..1 fraction of outer radius), color:'#hex', label}] ordered inner→outer
  FX.onionCaps = function(opts){
    const stage = opts.stage;
    const R = opts.radius;
    const shells = opts.shells;
    const radii = new Array(8).fill(1), colors = new Array(8).fill(0).map(()=>new THREE.Color(0,0,0));
    shells.forEach((s,i)=>{ radii[i] = s.r; colors[i] = FX.lin(s.color).multiplyScalar(s.intensity||1); });
    const mat = new THREE.ShaderMaterial({
      side:THREE.DoubleSide, extensions:{ derivatives:true },
      uniforms:{ uR:{value:R}, radii:{value:radii}, colors:{value:colors}, count:{value:shells.length}, uActive:{value:-1}, uTime:{value:0}, uPulse:{value:0}, uBright:{value:opts.brightness||1.4} },
      vertexShader:`varying vec2 vLocal; void main(){ vLocal = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: NOISE() + `
        uniform float uR, uTime, uPulse, uBright; uniform float radii[8]; uniform vec3 colors[8]; uniform int count; uniform float uActive;
        varying vec2 vLocal;
        void main(){
          if(vLocal.x < 0.0 || vLocal.y < 0.0) discard;
          float r = length(vLocal) / uR; if(r > 1.0) discard;
          vec3 c = colors[0]; float act = 0.0; float found = 0.0; float inner = 0.0; float outer = 1.0;
          for(int i=0;i<8;i++){
            if(found < 0.5 && i < count && r <= radii[i]){ c = colors[i]; outer = radii[i]; act = abs(float(i) - uActive) < 0.5 ? 1.0 : 0.0; found = 1.0; }
            if(found < 0.5 && i < count) inner = radii[i];
          }
          float turb = snoise(vec3(vLocal/uR*7.0, uTime*0.25));
          c *= 0.82 + 0.3*turb;
          // hotter toward the core within each layer
          c *= 1.0 + 0.35*(1.0 - smoothstep(inner, outer, r));
          float w = fwidth(r)*1.5;
          float edge = smoothstep(0.0, w, abs(r - outer)) * smoothstep(0.0, w, abs(r - inner) + step(inner, 0.0001));
          c *= mix(0.35, 1.0, edge);
          c *= 1.0 + act * uPulse * (0.9 + 0.5*sin(uTime*5.0));
          gl_FragColor = vec4(c*uBright, 1.0);
        }`,
    });
    const geo = new THREE.PlaneBufferGeometry(R*2, R*2, 1, 1);
    // Cap 1 lies in the XY plane (z=0) facing +z for x>0,y>0 → we rotate to cover the two cut faces.
    const capA = new THREE.Mesh(geo, mat);             // plane z = 0, covers x>0
    const capB = new THREE.Mesh(geo, mat);             // plane x = 0, covers z>0
    capB.rotation.y = -Math.PI/2;
    const group = new THREE.Group();
    // We need both quadrants y>0 and y<0 on each cut plane: mirror copies.
    const capA2 = capA.clone(); capA2.scale.y = -1;
    const capB2 = capB.clone(); capB2.scale.y = -1;
    [capA, capA2, capB, capB2].forEach(m=>group.add(m));
    if(opts.position) group.position.copy(opts.position);
    if(stage){ stage.add(group, opts.parent); stage.onFrame(dt=>{ mat.uniforms.uTime.value += dt; }); }
    return { group, material:mat, u:mat.uniforms,
      activate(i, pulse=0.9){ mat.uniforms.uActive.value = i; mat.uniforms.uPulse.value = pulse; } };
  };
  // Clipping planes that remove the (x>0, z>0) quarter of anything at `center`.
  FX.quarterClip = function(center){
    const c = center || V3(0,0,0);
    return [ new THREE.Plane(V3(-1,0,0), c.x), new THREE.Plane(V3(0,0,-1), c.z) ];
  };

  // ------------------------------------------------------------------ shock / ejecta shell
  FX.shockShell = function(opts){
    const stage = opts.stage;
    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
      uniforms:{ uTime:{value:0}, uAmp:{value:opts.amp||0.25}, uColor:{value:FX.lin(opts.color||'#ffd9a0')}, uColor2:{value:FX.lin(opts.color2||'#ff5a2a')},
        uOpacity:{value:opts.opacity!=null?opts.opacity:1}, uFreq:{value:opts.freq||2.6}, uIntensity:{value:opts.intensity||2.0} },
      vertexShader: NOISE() + `uniform float uTime, uAmp, uFreq; varying float vN; varying vec3 vNormalW; varying vec3 vViewDir;
        void main(){ float n = fbm3(normal*uFreq + vec3(uTime*0.25)); vN = n;
          vec3 p = position + normal * n * uAmp;
          vec4 wp = modelMatrix * vec4(p,1.0); vNormalW = normalize(mat3(modelMatrix)*normal); vViewDir = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader:`uniform vec3 uColor, uColor2; uniform float uOpacity, uIntensity; varying float vN; varying vec3 vNormalW; varying vec3 vViewDir;
        void main(){ float f = pow(1.0 - abs(dot(vNormalW, vViewDir)), 2.2);
          float k = clamp(vN*1.6 + 0.5, 0.0, 1.0);
          vec3 c = mix(uColor2, uColor, k);
          float a = (0.08 + f*0.9) * smoothstep(-0.2, 0.35, vN) * uOpacity;
          gl_FragColor = vec4(c*uIntensity, a); }`,
    });
    const mesh = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 96, 64), mat);
    mesh.scale.setScalar(opts.radius||1);
    if(opts.position) mesh.position.copy(opts.position);
    if(stage){ stage.add(mesh, opts.parent); stage.onFrame(dt=>{ mat.uniforms.uTime.value += dt; }); }
    return { mesh, u:mat.uniforms };
  };

  // Flat expanding ring (shockwave in a plane)
  FX.ring = function(opts){
    const mat = new THREE.MeshBasicMaterial({ map:FX.tex.ring, color:FX.lin(opts.color||'#bfe0ff').multiplyScalar(opts.intensity||2),
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, opacity:1 });
    const m = new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2), mat);
    if(opts.position) m.position.copy(opts.position);
    if(opts.rotation) m.rotation.copy(opts.rotation); else m.rotation.x = -Math.PI/2;
    m.scale.setScalar(0.01);
    opts.stage.add(m, opts.parent);
    const ms = opts.ms||1400, to = opts.to||50;
    FX.animate(ms, (t)=>{ m.scale.setScalar(0.01 + to*t); mat.opacity = 1 - t; }, FX.ease.out).then(()=>{ if(m.parent) m.parent.remove(m); });
    return m;
  };

  // ------------------------------------------------------------------ comet streak (glowing head + fading tail)
  FX.streak = function(opts){
    const stage = opts.stage;
    const n = opts.segments||14;
    const col = FX.lin(opts.color||'#ffffff');
    const group = new THREE.Group();
    const sprites = [];
    for(let i=0;i<n;i++){
      const k = 1 - i/n;
      const s = FX.glowSprite(col, (opts.size||2)*(0.35+0.65*k), { intensity:(opts.intensity||1.6)*k*k });
      group.add(s); sprites.push(s);
    }
    stage.add(group, opts.parent);
    const hist = [];
    const from = opts.from.clone(), to = opts.to.clone();
    const ms = opts.ms||900;
    const curve = opts.curve; // optional function t -> Vector3
    const done = FX.animate(ms, (t)=>{
      const p = curve ? curve(t) : from.clone().lerp(to, t);
      if(opts.wave){ const dir = to.clone().sub(from).normalize(); const perp = V3(-dir.y, dir.x, 0).normalize(); p.add(perp.multiplyScalar(Math.sin(t*60)*opts.wave)); }
      hist.unshift(p.clone()); if(hist.length > n*2) hist.pop();
      sprites.forEach((s,i)=>{ const h = hist[Math.min(hist.length-1, i*2)]; s.position.copy(h); });
    }, opts.easing||FX.ease.linear).then(()=>{
      return FX.animate(opts.fadeMs||300, t=>{ sprites.forEach(s=> s.material.opacity = 1-t); }).then(()=>{ if(group.parent) group.parent.remove(group); });
    });
    return { group, done };
  };

  // ------------------------------------------------------------------ accretion disk + stream
  FX.disk = function(opts){
    const rin = opts.inner, rout = opts.outer, rnd = FX.rng(opts.seed||11);
    const Tin = opts.tIn||26000, Tout = opts.tOut||3500;
    return FX.pointCloud({ stage:opts.stage, parent:opts.parent, count:opts.count||6000, spin:opts.spin||6, spinPow:1.5, twinkle:0.15, opacity:opts.opacity!=null?opts.opacity:1,
      gen:(i)=>{
        const u = rnd(); const r = rin + (rout-rin)*Math.pow(u, 1.6);
        const a = rnd()*Math.PI*2; const h = (rnd()-0.5)*(opts.thickness||0.04)*r;
        const T = Tin * Math.pow(r/rin, -0.75);
        const c = FX.blackbody(Math.max(Tout, T)).multiplyScalar((opts.brightness||1.4) * (0.5 + 0.8*Math.pow(rin/r, 0.8)));
        return { p:[Math.cos(a)*r, h, Math.sin(a)*r], c, s:(opts.size||1.4)*(0.6+rnd()*0.9) };
      }});
  };

  // Particles flowing along a cubic Bézier (mass transfer, jets, beams of ions)
  FX.flow = function(opts){
    const n = opts.count||900, rnd = FX.rng(opts.seed||3);
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n*3), aS = new Float32Array(n), aJ = new Float32Array(n*3);
    for(let i=0;i<n;i++){ aS[i] = rnd(); aJ[i*3]=rnd()-0.5; aJ[i*3+1]=rnd()-0.5; aJ[i*3+2]=rnd()-0.5; }
    g.setAttribute('position', new THREE.BufferAttribute(pos,3));
    g.setAttribute('aS', new THREE.BufferAttribute(aS,1));
    g.setAttribute('aJ', new THREE.BufferAttribute(aJ,3));
    const cp = opts.points.map(p=>p.clone());
    const mat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{value:0}, uSpeed:{value:opts.speed||0.25}, p0:{value:cp[0]}, p1:{value:cp[1]}, p2:{value:cp[2]}, p3:{value:cp[3]},
        uColA:{value:FX.lin(opts.colorA||'#ffcf8f').multiplyScalar(opts.intensity||1.5)}, uColB:{value:FX.lin(opts.colorB||'#ffffff').multiplyScalar(opts.intensity||1.5)},
        uWidth:{value:opts.width||1}, uWidthEnd:{value: opts.widthEnd!=null?opts.widthEnd:0.3}, uScale:{value:pointScale()}, uSize:{value:opts.size||1.6}, uOpacity:{value:1} },
      vertexShader:`attribute float aS; attribute vec3 aJ; uniform float uTime, uSpeed, uWidth, uWidthEnd, uScale, uSize; uniform vec3 p0,p1,p2,p3;
        varying float vT;
        void main(){ float t = fract(aS + uTime*uSpeed); vT = t; float it = 1.0 - t;
          vec3 p = it*it*it*p0 + 3.0*it*it*t*p1 + 3.0*it*t*t*p2 + t*t*t*p3;
          p += aJ * mix(uWidth, uWidthEnd, t);
          vec4 mv = modelViewMatrix * vec4(p,1.0); gl_Position = projectionMatrix*mv;
          gl_PointSize = clamp(uSize * uScale / -mv.z, 0.0, 64.0); }`,
      fragmentShader:`uniform vec3 uColA, uColB; uniform float uOpacity; varying float vT;
        void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d); a*=a;
          float fade = smoothstep(0.0,0.08,vT)*smoothstep(1.0,0.85,vT);
          gl_FragColor = vec4(mix(uColA, uColB, vT), a*fade*uOpacity); }` });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
    opts.stage.add(pts, opts.parent);
    opts.stage.onFrame(dt=>{ mat.uniforms.uTime.value += dt; mat.uniforms.uScale.value = pointScale(); });
    return { points:pts, u:mat.uniforms };
  };

  // ------------------------------------------------------------------ galaxy
  FX.galaxy = function(opts){
    const R = opts.radius||400, rnd = FX.rng(opts.seed||5), arms = opts.arms||2;
    const bulge = FX.lin('#ffd9a6'), young = FX.lin('#a9c6ff'), hii = FX.lin('#ff7eb6'), mid = FX.lin('#fff1dc');
    return FX.pointCloud({ stage:opts.stage, parent:opts.parent, count:opts.count||16000, spin:opts.spin||0.02, spinPow:0.0, twinkle:0.12, opacity:opts.opacity!=null?opts.opacity:1,
      gen:(i)=>{
        const inBulge = rnd() < 0.22;
        if(inBulge){
          const r = R*0.16*Math.pow(rnd(),1.4); const th = rnd()*Math.PI*2, ph = Math.acos(rnd()*2-1);
          return { p:[r*Math.sin(ph)*Math.cos(th), r*Math.cos(ph)*0.55, r*Math.sin(ph)*Math.sin(th)], c:bulge.clone().multiplyScalar(1.1+rnd()), s:2.4+rnd()*2.2 };
        }
        const r = R*(0.08 + 0.92*Math.pow(rnd(), 0.75));
        const arm = Math.floor(rnd()*arms);
        const theta = arm*(Math.PI*2/arms) + Math.log(r/(R*0.05))/Math.tan(0.24) + (rnd()-0.5)*(0.55 + 0.35*(1-r/R));
        const y = (rnd()-0.5)*R*0.03*Math.exp(-r/R);
        const k = rnd();
        const c = (k<0.05 ? hii.clone().multiplyScalar(2.2) : (k<0.55 ? young.clone() : mid.clone())).multiplyScalar(0.7+rnd()*0.9);
        return { p:[Math.cos(theta)*r, y, Math.sin(theta)*r], c, s: k<0.05 ? 3.6 : 1.4+rnd()*2.0 };
      }});
  };

  // ------------------------------------------------------------------ nebula shell (planetary nebula / remnant)
  FX.nebula = function(opts){
    const R = opts.radius||50, rnd = FX.rng(opts.seed||9);
    const inner = FX.lin(opts.inner||'#4fe0d2'), outer = FX.lin(opts.outer||'#ff4e6a');
    return FX.pointCloud({ stage:opts.stage, parent:opts.parent, count:opts.count||9000, opacity:opts.opacity!=null?opts.opacity:0.9, twinkle:0.05, soft:1,
      spin: opts.spin||0, spinPow:0,
      gen:()=>{
        let x=rnd()*2-1,y=rnd()*2-1,z=rnd()*2-1; const m=Math.hypot(x,y,z)||1; x/=m;y/=m;z/=m;
        const bip = opts.bipolar ? (0.55 + 0.9*Math.abs(y)) : 1;
        const shellT = Math.pow(rnd(), opts.filled?0.5:0.25);
        const r = R*bip*(0.45 + 0.55*shellT) * (0.9 + 0.2*Math.sin(x*9+z*7)*(opts.clumpy?1:0.3));
        const k = (r/(R*bip));
        const c = inner.clone().lerp(outer, Math.pow(k,1.6)).multiplyScalar((opts.brightness||1)*(0.4+rnd()*0.9));
        return { p:[x*r, y*r*(opts.squash||1), z*r], c, s:(opts.size||3.2)*(0.5+rnd()*1.1) };
      }});
  };

  // ------------------------------------------------------------------ spacetime grid with GW spiral
  FX.spacetime = function(opts){
    const size = opts.size||900, seg = opts.segments||180;
    const geo = new THREE.PlaneBufferGeometry(size, size, seg, seg); geo.rotateX(-Math.PI/2);
    const mat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, extensions:{derivatives:true},
      uniforms:{ uTime:{value:0}, uA:{value:V3(60,0,0)}, uB:{value:V3(-60,0,0)}, uDepth:{value:opts.depth||60}, uSigma:{value:opts.sigma||45},
        uGW:{value:0}, uPhase:{value:0}, uK:{value:0.02}, uSpacing:{value:opts.spacing||22}, uColor:{value:FX.lin(opts.color||'#4f7dff').multiplyScalar(1.6)},
        uOpacity:{value:opts.opacity!=null?opts.opacity:0.75}, uSize:{value:size}, uMerge:{value:0} },
      vertexShader:`uniform vec3 uA, uB; uniform float uDepth, uSigma, uGW, uPhase, uK, uMerge; varying vec2 vXZ; varying float vH;
        void main(){ vec3 p = position;
          float dA = distance(p.xz, uA.xz), dB = distance(p.xz, uB.xz);
          float well = -uDepth*(exp(-dA*dA/(uSigma*uSigma)) + exp(-dB*dB/(uSigma*uSigma)));
          float r = length(p.xz); float phi = atan(p.z, p.x);
          float gw = uGW * cos(2.0*(phi - uPhase) + uK*r) * smoothstep(40.0, 140.0, r) / (1.0 + r*0.004);
          p.y += well + gw; vXZ = p.xz; vH = well + gw;
          gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader:`uniform float uSpacing, uOpacity, uSize; uniform vec3 uColor; varying vec2 vXZ; varying float vH;
        void main(){ vec2 g = vXZ/uSpacing; vec2 w = fwidth(g); vec2 gr = abs(fract(g - 0.5) - 0.5) / max(w, vec2(1e-4));
          float line = 1.0 - min(min(gr.x, gr.y), 1.0);
          float fade = 1.0 - smoothstep(uSize*0.25, uSize*0.5, length(vXZ));
          vec3 c = uColor * (0.7 + clamp(-vH*0.02, 0.0, 1.2));
          gl_FragColor = vec4(c, line*fade*uOpacity); }` });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
    if(opts.position) mesh.position.copy(opts.position);
    opts.stage.add(mesh, opts.parent);
    opts.stage.onFrame(dt=>{ mat.uniforms.uTime.value += dt; });
    return { mesh, u:mat.uniforms };
  };

  // ------------------------------------------------------------------ planet Earth (molten → ocean world)
  FX.earth = function(opts){
    const mat = new THREE.ShaderMaterial({
      uniforms:{ uTime:{value:0}, uSun:{value:V3(-0.6,0.35,0.7).normalize()}, uMolten:{value:opts.molten||0} },
      vertexShader:`varying vec3 vN; varying vec3 vP; varying vec3 vV; void main(){ vP = position; vec4 wp = modelMatrix*vec4(position,1.0);
        vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix*viewMatrix*wp; }`,
      fragmentShader: NOISE() + `uniform float uTime, uMolten; uniform vec3 uSun; varying vec3 vN; varying vec3 vP; varying vec3 vV;
        void main(){ vec3 p = normalize(vP);
          float n = fbm(p*2.3 + 4.1); float land = smoothstep(0.03, 0.08, n); float lat = abs(p.y);
          vec3 ocean = mix(vec3(0.004,0.03,0.12), vec3(0.01,0.09,0.25), fbm3(p*7.0)*0.5+0.5);
          vec3 ground = mix(vec3(0.07,0.13,0.035), vec3(0.32,0.25,0.13), smoothstep(-0.1,0.4,fbm3(p*5.0)));
          ground = mix(ground, vec3(0.9), smoothstep(0.8, 0.92, lat));
          vec3 base = mix(ocean, ground, land);
          float light = clamp(dot(vN, uSun), 0.0, 1.0);
          float spec = pow(max(dot(reflect(-uSun, vN), vV), 0.0), 60.0)*(1.0-land)*0.8;
          vec3 col = base*(0.02 + 1.2*light) + spec*light;
          float cl = smoothstep(0.05, 0.55, fbm(p*3.2 + vec3(uTime*0.02, 0.0, 0.0)));
          col = mix(col, vec3(1.0)*(0.02 + 1.1*light), cl*0.65*(1.0-uMolten));
          // molten crust: dark basalt with glowing cracks
          float cr = 1.0 - abs(snoise(p*6.0 + vec3(uTime*0.05)));
          float cracks = smoothstep(0.86, 0.99, cr);
          vec3 lava = vec3(0.05,0.03,0.025)*(0.3+light) + vec3(4.0,1.1,0.2)*cracks*(0.6+0.4*sin(uTime*2.0+p.x*10.0));
          col = mix(col, lava, uMolten);
          float rim = pow(1.0 - max(dot(vN, vV), 0.0), 3.0);
          col += mix(vec3(0.25,0.55,1.3), vec3(1.2,0.4,0.1), uMolten) * rim * (0.15 + 0.9*light);
          gl_FragColor = vec4(col, 1.0); }` });
    const mesh = new THREE.Mesh(new THREE.SphereBufferGeometry(opts.radius||10, 96, 64), mat);
    if(opts.position) mesh.position.copy(opts.position);
    opts.stage.add(mesh, opts.parent);
    opts.stage.onFrame(dt=>{ mat.uniforms.uTime.value += dt; mesh.rotation.y += dt*0.05; });
    return { mesh, u:mat.uniforms };
  };

  // ------------------------------------------------------------------ fireball sky (Big Bang / inside a blast)
  FX.fireSky = function(opts){
    const mat = new THREE.ShaderMaterial({ side:THREE.BackSide, depthWrite:false, transparent:true,
      uniforms:{ uTime:{value:0}, uColor:{value:FX.lin('#ffffff')}, uBright:{value:3}, uOpacity:{value:1}, uScale:{value:opts.scale||2.2} },
      vertexShader:`varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: NOISE() + `uniform float uTime, uBright, uOpacity, uScale; uniform vec3 uColor; varying vec3 vD;
        void main(){ float n = fbm(vD*uScale + vec3(0.0, uTime*0.15, uTime*0.1));
          float m = fbm3(vD*uScale*3.0 - vec3(uTime*0.3));
          vec3 c = uColor * (0.45 + 0.9*(n*0.5+0.5) + 0.35*m);
          gl_FragColor = vec4(c*uBright, uOpacity); }` });
    const mesh = new THREE.Mesh(new THREE.SphereBufferGeometry(opts.radius||800, 64, 32), mat);
    mesh.renderOrder = -10;
    opts.stage.add(mesh, opts.parent);
    opts.stage.onFrame(dt=>{ mat.uniforms.uTime.value += dt; mesh.position.copy(FX.camera.position); });
    return { mesh, u:mat.uniforms };
  };

  // ------------------------------------------------------------------ dark micro-scale backdrop (nuclear scenes)
  FX.microBackdrop = function(opts){
    const mat = new THREE.ShaderMaterial({ side:THREE.BackSide, depthWrite:false, transparent:true,
      uniforms:{ uTime:{value:0}, uTint:{value:FX.lin(opts.tint||'#2a3a78')}, uOpacity:{value:0} },
      vertexShader:`varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: NOISE() + `uniform float uTime, uOpacity; uniform vec3 uTint; varying vec3 vD;
        void main(){ float n = fbm(vD*3.0 + vec3(uTime*0.03)); float f = fbm3(vD*9.0 - vec3(uTime*0.06));
          vec3 c = uTint * (0.05 + 0.18*smoothstep(-0.2, 0.8, n)) + vec3(0.6,0.7,1.0)*pow(max(f,0.0), 6.0)*0.25;
          gl_FragColor = vec4(c, uOpacity); }` });
    const mesh = new THREE.Mesh(new THREE.SphereBufferGeometry(opts.radius||600, 48, 24), mat);
    mesh.renderOrder = -9;
    opts.stage.add(mesh, opts.parent);
    opts.stage.onFrame(dt=>{ mat.uniforms.uTime.value += dt; mesh.position.copy(FX.camera.position); });
    return { mesh, u:mat.uniforms, fadeIn(ms=900){ return FX.animate(ms, t=> mat.uniforms.uOpacity.value = t); } };
  };

  // ------------------------------------------------------------------ glowing beam tube
  FX.beam = function(opts){
    const from = opts.from, to = opts.to;
    const len = from.distanceTo(to);
    const mat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ uColor:{value:FX.lin(opts.color||'#8fd4ff').multiplyScalar(opts.intensity||2.5)}, uTime:{value:0}, uOpacity:{value:1} },
      vertexShader:`varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vY = position.y; vec4 wp = modelMatrix*vec4(position,1.0);
        vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix*viewMatrix*wp; }`,
      fragmentShader:`uniform vec3 uColor; uniform float uTime, uOpacity; varying vec3 vN; varying vec3 vV; varying float vY;
        void main(){ float f = abs(dot(vN, vV)); float core = pow(f, 3.0);
          float pulse = 0.75 + 0.25*sin(vY*0.8 - uTime*14.0);
          gl_FragColor = vec4(uColor*pulse, core*uOpacity); }` });
    const geo = new THREE.CylinderBufferGeometry(opts.radius||0.4, opts.radius||0.4, len, 16, 1, true);
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(from).lerp(to, 0.5);
    m.quaternion.setFromUnitVectors(V3(0,1,0), to.clone().sub(from).normalize());
    opts.stage.add(m, opts.parent);
    opts.stage.onFrame(dt=>{ mat.uniforms.uTime.value += dt; });
    return { mesh:m, u:mat.uniforms };
  };

  // Standard lit material helpers (linear colours, studio env)
  FX.metal = function(f0, rough, extra={}){
    return new THREE.MeshStandardMaterial(Object.assign({ color:FX.lin(f0), metalness:1, roughness:rough, envMap:FX.env, envMapIntensity:1.0 }, extra));
  };
  FX.matte = function(hex, rough=0.8, extra={}){
    return new THREE.MeshStandardMaterial(Object.assign({ color:FX.lin(hex), metalness:0, roughness:rough, envMap:FX.env, envMapIntensity:0.6 }, extra));
  };
})();
