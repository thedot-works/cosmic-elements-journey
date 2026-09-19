// ==========================================================================
// SPECIMEN — what the element actually looks like, built procedurally:
// metals with their real reflectance and tarnish, brittle faceted metalloids,
// crystal clusters, liquids in sealed ampoules, noble gases glowing in
// discharge tubes with their true colours, radioluminescent actinides, and
// "atoms only" for the elements nobody has ever seen in bulk.
// ==========================================================================
(function(){
  const V3 = (x,y,z)=> new THREE.Vector3(x,y,z);

  // ---------------------------------------------------------------- JS noise (Perlin)
  function makeNoise(seed){
    const rnd = FX.rng(seed||1);
    const p = []; for(let i=0;i<256;i++) p.push(i);
    for(let i=255;i>0;i--){ const j = Math.floor(rnd()*(i+1)); const t=p[i]; p[i]=p[j]; p[j]=t; }
    const perm = new Int32Array(512); for(let i=0;i<512;i++) perm[i] = p[i&255];
    const fade = t=> t*t*t*(t*(t*6-15)+10);
    const lerp = (a,b,t)=> a+(b-a)*t;
    function grad(h,x,y,z){
      switch(h&15){
        case 0: return x+y; case 1: return -x+y; case 2: return x-y; case 3: return -x-y;
        case 4: return x+z; case 5: return -x+z; case 6: return x-z; case 7: return -x-z;
        case 8: return y+z; case 9: return -y+z; case 10: return y-z; case 11: return -y-z;
        case 12: return y+x; case 13: return -y+z; case 14: return y-x; default: return -y-z;
      }
    }
    function noise(x,y,z){
      const X=Math.floor(x)&255, Y=Math.floor(y)&255, Z=Math.floor(z)&255;
      x-=Math.floor(x); y-=Math.floor(y); z-=Math.floor(z);
      const u=fade(x), v=fade(y), w=fade(z);
      const A=perm[X]+Y, AA=perm[A&255]+Z, AB=perm[(A+1)&255]+Z;
      const B=perm[(X+1)&255]+Y, BA=perm[B&255]+Z, BB=perm[(B+1)&255]+Z;
      return lerp(
        lerp(lerp(grad(perm[AA&255],x,y,z), grad(perm[BA&255],x-1,y,z), u),
             lerp(grad(perm[AB&255],x,y-1,z), grad(perm[BB&255],x-1,y-1,z), u), v),
        lerp(lerp(grad(perm[(AA+1)&255],x,y,z-1), grad(perm[(BA+1)&255],x-1,y,z-1), u),
             lerp(grad(perm[(AB+1)&255],x,y-1,z-1), grad(perm[(BB+1)&255],x-1,y-1,z-1), u), v), w);
    }
    return { noise, fbm(x,y,z,oct=4){ let f=0,a=0.5,s=1; for(let i=0;i<oct;i++){ f+=a*noise(x*s,y*s,z*s); s*=2.03; a*=0.5; } return f; } };
  }

  // ---------------------------------------------------------------- geometry helpers
  function displace(geo, fn){
    const pos = geo.attributes.position;
    const v = V3();
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos, i);
      const k = fn(v);
      pos.setXYZ(i, v.x*k, v.y*k, v.z*k);
    }
    geo.computeVertexNormals();
    return geo;
  }
  function blob(radius, detail, amp, seed, freq, flat){
    const nz = makeNoise(seed);
    let geo = new THREE.IcosahedronBufferGeometry(radius, detail);
    displace(geo, v=>{
      const n = nz.fbm(v.x*freq, v.y*freq, v.z*freq, 4);
      return 1 + amp*n;
    });
    if(flat){ geo = geo.toNonIndexed(); geo.computeVertexNormals(); }
    return geo;
  }
  function roundedBox(w,h,d,r,seg=6){
    const geo = new THREE.BoxBufferGeometry(w,h,d, seg,seg,seg);
    const pos = geo.attributes.position, v = V3();
    const hx=w/2-r, hy=h/2-r, hz=d/2-r;
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i);
      const c = V3(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
      const dir = v.clone().sub(c);
      if(dir.lengthSq() > 1e-9) dir.normalize().multiplyScalar(r);
      pos.setXYZ(i, c.x+dir.x, c.y+dir.y, c.z+dir.z);
    }
    geo.computeVertexNormals();
    return geo;
  }
  // A crystal bar: faceted panels down its length, growth striations, a slight
  // lean, and broken uneven ends rather than a machined disc.
  function crystalBarGeo(radius, height, seed){
    const nz = makeNoise(seed);
    const rnd = FX.rng(seed||7);
    const geo = new THREE.CylinderBufferGeometry(radius*0.88, radius, height, 24, 16, false);
    const pos = geo.attributes.position, nrm = geo.attributes.normal, v = V3();
    const panels = 5 + Math.floor(rnd()*3);
    const lean = (rnd()-0.5)*0.16;
    const phase = rnd()*6.28;
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i);
      const capped = Math.abs(nrm.getY(i)) > 0.9;
      const ty = v.y/height + 0.5;                       // 0 bottom → 1 top
      const rr = Math.hypot(v.x, v.z);
      if(capped){
        const d = nz.fbm(v.x*5.0, ty*9.0, v.z*5.0, 2);
        pos.setXYZ(i, v.x + lean*v.y, v.y + d*height*0.06, v.z);
      } else if(rr > 1e-4){
        const ang = Math.atan2(v.z, v.x);
        const n = nz.fbm(v.x*2.6, v.y*2.2, v.z*2.6, 3);
        const facet = 1 - 0.07*Math.abs(Math.sin(ang*panels*0.5 + phase));
        const stria = 0.045*Math.sin(v.y*13.0 + n*4.0);
        const taper = 1 - 0.2*Math.pow(Math.abs(ty*2-1), 3);
        const k = facet * taper * (1 + 0.17*n + stria);
        pos.setXYZ(i, v.x*k + lean*v.y, v.y, v.z*k);
      }
    }
    const g2 = geo.toNonIndexed(); g2.computeVertexNormals();
    return g2;
  }
  function lathe(points, seg=48){
    return new THREE.LatheBufferGeometry(points.map(p=> new THREE.Vector2(p[0], p[1])), seg);
  }

  // ---------------------------------------------------------------- materials
  function envOf(opts){ return opts.env !== undefined ? opts.env : FX.env; }

  function metalMat(look, opts){
    const m = new THREE.MeshStandardMaterial({
      color: look.f0 ? FX.lin(look.f0) : FX.lin(look.color||'#c9c9c9'),
      metalness: look.metal!=null ? look.metal : 1,
      roughness: look.rough!=null ? look.rough : 0.25,
      envMap: envOf(opts), envMapIntensity: look.envInt!=null ? look.envInt : 1.3,
    });
    if(look.tarnish) patchTarnish(m, look.tarnish, look.tarnishAmt!=null?look.tarnishAmt:0.3, look.tarnishScale||2.2);
    else if(look.irid) patchIridescent(m);
    else if(look.micro !== false) patchMicro(m, look.seed||1);
    return m;
  }
  // Real metal is never uniformly smooth: a faint, seeded roughness grain keeps
  // grey metals from reading as one flat plastic highlight.
  function patchMicro(mat, seed){
    const off = ((seed*13)%97)*0.37;
    mat.onBeforeCompile = (sh)=>{
      sh.uniforms.uMicroOff = { value: off };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n vObjPos = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;\nuniform float uMicroOff;\n' + FX.glsl.noise)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          float _mg = fbm3(vObjPos*7.0 + vec3(uMicroOff));
          float _mf = fbm3(vObjPos*26.0 - vec3(uMicroOff*0.5));
          roughnessFactor = clamp(roughnessFactor + _mg*0.06 + _mf*0.035, 0.02, 1.0);`);
    };
    mat.needsUpdate = true;
    return mat;
  }
  function dielectric(color, rough, opts, extra){
    return new THREE.MeshStandardMaterial(Object.assign({ color:FX.lin(color), roughness:rough, metalness:0.05,
      envMap:envOf(opts), envMapIntensity:0.9 }, extra||{}));
  }
  function emissive(color, strength){
    return new THREE.MeshBasicMaterial({ color: FX.lin(color).multiplyScalar(strength) });
  }
  function glassMat(opts, tint){
    return new THREE.MeshStandardMaterial({ color:FX.lin(tint||'#dfe9ff'), roughness:0.04, metalness:0.0,
      envMap:envOf(opts), envMapIntensity:1.5, transparent:true, opacity:0.12, side:THREE.DoubleSide, depthWrite:false });
  }
  // Oxide / tarnish patches: noise-masked colour + rougher, less metallic surface.
  function patchTarnish(mat, color, amount, scale){
    mat.onBeforeCompile = (sh)=>{
      sh.uniforms.uTarn = { value: FX.lin(color) };
      sh.uniforms.uTarnAmt = { value: amount };
      sh.uniforms.uTarnScale = { value: scale };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n vObjPos = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;\nuniform vec3 uTarn;\nuniform float uTarnAmt;\nuniform float uTarnScale;\n' + FX.glsl.noise)
        .replace('#include <map_fragment>', `#include <map_fragment>
          float _tn = fbm3(vObjPos*uTarnScale);
          float _mask = clamp(smoothstep(-0.18, 0.3, _tn)*uTarnAmt*1.5, 0.0, 1.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, uTarn, _mask);`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          float _tn2 = fbm3(vObjPos*uTarnScale);
          float _mask2 = clamp(smoothstep(-0.18, 0.3, _tn2)*uTarnAmt*1.5, 0.0, 1.0);
          roughnessFactor = mix(roughnessFactor, 0.82, _mask2);`)
        .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
          float _tn3 = fbm3(vObjPos*uTarnScale);
          float _mask3 = clamp(smoothstep(-0.18, 0.3, _tn3)*uTarnAmt*1.5, 0.0, 1.0);
          metalnessFactor = mix(metalnessFactor, 0.15, _mask3);`);
    };
    mat.needsUpdate = true;
    return mat;
  }
  // Thin-film iridescence (bismuth's rainbow oxide skin)
  function patchIridescent(mat){
    mat.onBeforeCompile = (sh)=>{
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n vObjPos = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;\n' + FX.glsl.noise)
        .replace('#include <map_fragment>', `#include <map_fragment>
          float _ang = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition)));
          float _film = fbm3(vObjPos*2.6)*0.5 + 0.5;
          vec3 _ir = 0.5 + 0.5*cos(6.28318*(vec3(0.0, 0.33, 0.67) + _ang*2.6 + _film*1.8));
          diffuseColor.rgb = mix(diffuseColor.rgb, _ir*_ir, 0.34);`);
    };
    mat.needsUpdate = true;
    return mat;
  }

  // Glowing plasma column inside a discharge tube
  function plasmaMat(color, strength){
    return new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
      uniforms:{ uTime:{value:0}, uColor:{value:FX.lin(color).multiplyScalar(strength||3.0)} },
      vertexShader:`varying vec3 vN; varying vec3 vV; varying float vY;
        void main(){ vY = uv.y; vec4 wp = modelMatrix*vec4(position,1.0);
          vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix*viewMatrix*wp; }`,
      fragmentShader: FX.glsl.noise + `uniform vec3 uColor; uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY;
        void main(){
          float edge = pow(1.0 - abs(dot(vN, vV)), 1.6);
          float flick = 0.86 + 0.14*snoise(vec3(vY*6.0, uTime*2.2, 0.0));
          gl_FragColor = vec4(uColor*flick, (0.35 + 0.75*edge)); }`,
    });
  }

  // ---------------------------------------------------------------- pedestal + lights
  let POOL_TEX = null;
  function poolTexture(){
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(128,128,0,128,128,128);
    gr.addColorStop(0,'rgba(255,255,255,0.55)'); gr.addColorStop(0.35,'rgba(255,255,255,0.22)');
    gr.addColorStop(0.7,'rgba(255,255,255,0.05)'); gr.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0,0,256,256);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }

  function studio(stage, opts={}){
    const g = new THREE.Group();
    const R = opts.radius || 2.4;
    // a soft pool of light on the floor instead of a lit plate: no stray
    // specular, and the specimen reads as if it is standing in a studio
    if(!POOL_TEX) POOL_TEX = poolTexture();
    const pool = new THREE.Mesh(new THREE.PlaneBufferGeometry(R*2, R*2),
      new THREE.MeshBasicMaterial({ map:POOL_TEX, color:FX.lin('#6f8fd0'), transparent:true, opacity:0.5, depthWrite:false }));
    pool.rotation.x = -Math.PI/2; pool.position.y = 0.002; g.add(pool);
    const ring = new THREE.Mesh(new THREE.TorusBufferGeometry(R*0.62, 0.008, 8, 96),
      new THREE.MeshBasicMaterial({ color:FX.lin('#5f8be0').multiplyScalar(0.8), transparent:true, opacity:0.5 }));
    ring.rotation.x = Math.PI/2; g.add(ring);
    // Kept deliberately low: on a metalness-1 surface a directional light is a
    // point-sized specular that clips to white. The environment does the work;
    // these only shape the dielectrics (glass, sulfur, crystals).
    const key = new THREE.DirectionalLight(FX.lin('#fff2e2'), 0.5); key.position.set(-4, 6, 5); g.add(key);
    const fill = new THREE.DirectionalLight(FX.lin('#9fc4ff'), 0.22); fill.position.set(5, 1.5, 4); g.add(fill);
    const rim = new THREE.DirectionalLight(FX.lin('#cfe2ff'), 0.45); rim.position.set(1, 2.5, -6); g.add(rim);
    stage.add(g);
    return g;
  }

  // ---------------------------------------------------------------- form builders
  const FORMS = {};

  FORMS.nugget = (L, o, stage)=>{
    const g = new THREE.Group();
    const m = metalMat(L, o);
    const sd = L.seed||3, r = FX.rng(sd);
    const main = new THREE.Mesh(blob(1.15, 4, 0.16+r()*0.14, sd, 1.2+r()*0.9), m);
    main.rotation.set(r()*1.2, r()*6.28, r()*1.2); g.add(main);
    const n = 2 + (r() < 0.45 ? 1 : 0);
    for(let i=0;i<n;i++){
      const s = 0.26 + r()*0.24;
      const c = new THREE.Mesh(blob(s, 3, 0.22+r()*0.16, sd+13*(i+1), 2.2+r()*1.0), m);
      const a = r()*Math.PI*2;
      c.position.set(Math.cos(a)*(0.95+r()*0.3), -0.42 - r()*0.2, Math.sin(a)*(0.8+r()*0.3));
      c.rotation.set(r()*3, r()*3, r()*3);
      g.add(c);
    }
    return g;
  };

  FORMS.bar = (L, o)=>{
    const g = new THREE.Group();
    const m = metalMat(L, o);
    const r = FX.rng(L.seed||19);
    const bar = new THREE.Mesh(roundedBox(2.2+r()*0.7, 0.62+r()*0.3, 1.1+r()*0.35, 0.10+r()*0.08, 5), m);
    // ingot taper
    const pos = bar.geometry.attributes.position, v = V3();
    for(let i=0;i<pos.count;i++){ v.fromBufferAttribute(pos,i); const k = v.y > 0 ? 0.88 : 1.0; pos.setXYZ(i, v.x*k, v.y, v.z*k); }
    bar.geometry.computeVertexNormals();
    bar.position.y = 0.42; g.add(bar);
    const small = new THREE.Mesh(roundedBox(1.0, 0.35, 0.6, 0.08, 4), m);
    small.position.set(-1.25, 0.18, 0.95); small.rotation.y = 0.4; g.add(small);
    return g;
  };

  FORMS.chunk = (L, o)=>{
    const g = new THREE.Group();
    const m = metalMat(L, o);
    const sd = L.seed||5, r = FX.rng(sd);
    const main = new THREE.Mesh(blob(1.2, 4, 0.2+r()*0.16, sd, 1.4+r()*0.9, true), m);
    main.rotation.set(r()*1.4, r()*6.28, r()*1.0); g.add(main);
    // a freshly cut, bright face
    if(L.cut !== false){
      const cutMat = new THREE.MeshStandardMaterial({ color: L.f0 ? FX.lin(L.f0) : FX.lin('#d0d0d0'), metalness:1, roughness:0.09, envMap:envOf(o), envMapIntensity:1.4 });
      const face = new THREE.Mesh(new THREE.CircleBufferGeometry(0.58+r()*0.24, 32), cutMat);
      const a = r()*Math.PI*2;
      face.position.set(Math.cos(a)*0.3, 0.5+r()*0.25, Math.sin(a)*0.4);
      face.rotation.set(-0.7-r()*0.5, a, r()*0.4); g.add(face);
    }
    const chip = new THREE.Mesh(blob(0.32+r()*0.2, 3, 0.3, sd+29, 2.6, true), m);
    const ca = r()*Math.PI*2;
    chip.position.set(Math.cos(ca)*1.1, -0.5, Math.sin(ca)*0.8); g.add(chip);
    return g;
  };

  FORMS.crystalChunk = (L, o)=>{
    const g = new THREE.Group();
    const m = metalMat(L, o);
    const sd = L.seed||13, r = FX.rng(sd);
    const main = new THREE.Mesh(blob(1.15, 3, 0.26+r()*0.2, sd, 1.6+r()*1.0, true), m);
    main.rotation.set(r()*1.5, r()*6.28, r()*1.5); g.add(main);
    const n = 2 + Math.floor(r()*3);
    for(let i=0;i<n;i++){
      const c = new THREE.Mesh(blob(0.26+r()*0.24, 2, 0.34+r()*0.2, sd+31*(i+1), 2.4+r()*1.2, true), m);
      const a = i/n*Math.PI*2 + r()*1.2;
      c.position.set(Math.cos(a)*(1.0+r()*0.3), -0.6 + r()*0.35, Math.sin(a)*(0.9+r()*0.3));
      c.rotation.set(r()*3, r()*3, r()*3);
      g.add(c);
    }
    return g;
  };

  FORMS.crystalBar = (L, o)=>{
    const g = new THREE.Group();
    const m = metalMat(L, o);
    const sd = L.seed||17, r = FX.rng(sd);
    const bar = new THREE.Mesh(crystalBarGeo(0.42+r()*0.16, 2.3+r()*0.7, sd), m);
    bar.rotation.set(0.1+r()*0.2, r()*6.28, 0.2+r()*0.3); bar.position.y = 0.3; g.add(bar);
    const chip = new THREE.Mesh(blob(0.3+r()*0.2, 3, 0.32, sd+37, 2.4, true), m);
    const a = r()*Math.PI*2;
    chip.position.set(Math.cos(a)*1.1, -0.65, Math.sin(a)*0.5); g.add(chip);
    return g;
  };

  FORMS.dendrite = (L, o)=>{
    const g = new THREE.Group();
    const m = metalMat(L, o);
    const rnd = FX.rng(L.seed||31);
    for(let i=0;i<16;i++){
      const s = 0.18 + rnd()*0.3;
      const c = new THREE.Mesh(blob(s, 2, 0.45, (L.seed||31)+40+i*3, 3.0+rnd()*0.9, true), m);
      const a = rnd()*Math.PI*2, r = rnd()*1.15;
      c.position.set(Math.cos(a)*r, 0.1 + rnd()*0.55 - r*0.25, Math.sin(a)*r);
      c.rotation.set(rnd()*3, rnd()*3, rnd()*3);
      c.scale.set(1, 1+rnd()*1.3, 1);
      g.add(c);
    }
    return g;
  };

  FORMS.pellets = (L, o)=>{
    const g = new THREE.Group();
    const m = metalMat(L, o);
    const rnd = FX.rng(L.seed||41);
    const place = [[0,0.42,0],[0.78,0.36,0.25],[-0.7,0.36,-0.3],[0.2,0.34,-0.8],[-0.25,0.34,0.8],[0.05,1.02,0.05]];
    place.forEach((p,i)=>{
      const s = 0.32 + rnd()*0.14;
      const b = new THREE.Mesh(blob(s, 3, 0.06+rnd()*0.05, (L.seed||41)+50+i*3, 2.0), m);
      b.position.set(p[0]+(rnd()-0.5)*0.16, p[1], p[2]+(rnd()-0.5)*0.16);
      b.rotation.set(rnd()*3, rnd()*3, rnd()*3);
      b.scale.y = 0.74 + rnd()*0.18;
      g.add(b);
    });
    return g;
  };

  FORMS.melting = (L, o)=>{
    const g = new THREE.Group();
    const m = metalMat(L, o);
    const liquid = new THREE.MeshStandardMaterial({ color:FX.lin(L.f0||'#c7c7cc'), metalness:1, roughness:0.02, envMap:envOf(o), envMapIntensity:1.6 });
    const puddle = new THREE.Mesh(lathe([[0,0],[0.9,0.02],[1.35,0.09],[1.5,0.13],[1.52,0.0]]), liquid);
    puddle.position.y = 0.02; g.add(puddle);
    const chunk = new THREE.Mesh(blob(0.72, 2, 0.3, 61, 2.2, true), m);
    chunk.position.set(-0.1, 0.62, 0.05); chunk.rotation.set(0.4,0.6,0.2); g.add(chunk);
    const drop = new THREE.Mesh(new THREE.SphereBufferGeometry(0.16, 24, 16), liquid);
    drop.position.set(0.62, 0.18, 0.45); drop.scale.y = 0.7; g.add(drop);
    return g;
  };

  FORMS.liquidMetal = (L, o)=>{
    const g = new THREE.Group();
    const liquid = new THREE.MeshStandardMaterial({ color:FX.lin(L.f0||'#c9c9cc'), metalness:1, roughness:0.015, envMap:envOf(o), envMapIntensity:1.8 });
    const dish = new THREE.Mesh(lathe([[0,0.0],[1.5,0.0],[1.6,0.08],[1.62,0.34],[1.52,0.34],[1.5,0.1],[0,0.06]]), dielectric('#0d1018', 0.35, o, { metalness:0.2 }));
    g.add(dish);
    const bead = new THREE.Mesh(new THREE.SphereBufferGeometry(0.62, 48, 32), liquid);
    bead.scale.set(1.18, 0.66, 1.18); bead.position.y = 0.4; g.add(bead);
    [[0.95,0.2],[-0.85,-0.35],[0.15,0.95]].forEach((p,i)=>{
      const d = new THREE.Mesh(new THREE.SphereBufferGeometry(0.16 - i*0.03, 24, 16), liquid);
      d.scale.set(1.1,0.6,1.1); d.position.set(p[0], 0.13, p[1]); g.add(d);
    });
    return g;
  };

  FORMS.sulfur = (L, o)=>{
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color:FX.lin('#f5d312'), roughness:0.22, metalness:0.0, envMap:envOf(o), envMapIntensity:1.2,
      emissive:FX.lin('#3a2c00'), flatShading:true });
    const rnd = FX.rng(83);
    for(let i=0;i<11;i++){
      const c = new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.34 + rnd()*0.26, 0), m);
      const a = rnd()*Math.PI*2, r = rnd()*1.0;
      c.position.set(Math.cos(a)*r, 0.28 + rnd()*0.5 - r*0.2, Math.sin(a)*r);
      c.rotation.set(rnd()*3, rnd()*3, rnd()*3);
      c.scale.set(1, 1.5+rnd()*0.8, 1);
      g.add(c);
    }
    return g;
  };

  FORMS.iodine = (L, o, stage)=>{
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color:FX.lin('#2a1436'), roughness:0.12, metalness:0.62, envMap:envOf(o), envMapIntensity:1.5, flatShading:true });
    const rnd = FX.rng(97);
    for(let i=0;i<13;i++){
      const c = new THREE.Mesh(new THREE.BoxBufferGeometry(0.42+rnd()*0.3, 0.07+rnd()*0.05, 0.3+rnd()*0.25), m);
      const a = rnd()*Math.PI*2, r = rnd()*1.05;
      c.position.set(Math.cos(a)*r, 0.1 + rnd()*0.45, Math.sin(a)*r);
      c.rotation.set(rnd()*0.6, rnd()*3, rnd()*0.6);
      g.add(c);
    }
    if(stage){
      FX.pointCloud({ stage, parent:g, count:220, opacity:0.32, twinkle:0.3, spin:0.2, spinPow:0.2,
        gen:()=>{ const a=Math.random()*Math.PI*2, r=0.3+Math.random()*0.9, y=0.35+Math.random()*1.5;
          return { p:[Math.cos(a)*r, y, Math.sin(a)*r], c:FX.lin('#8f4ac0').multiplyScalar(0.35+Math.random()*0.4), s:1.5 }; }});
    }
    return g;
  };

  FORMS.carbon = (L, o)=>{
    const g = new THREE.Group();
    // graphite: dark, layered, semi-metallic sheen
    const gm = new THREE.MeshStandardMaterial({ color:FX.lin('#1a1c20'), roughness:0.42, metalness:0.55, envMap:envOf(o), envMapIntensity:0.9, flatShading:true });
    const graph = new THREE.Mesh(blob(0.85, 2, 0.22, 3, 1.8, true), gm);
    graph.position.set(-1.0, 0.5, 0); graph.scale.set(1.1, 0.72, 1.0); g.add(graph);
    for(let i=0;i<4;i++){
      const plate = new THREE.Mesh(new THREE.BoxBufferGeometry(1.0-0.1*i, 0.05, 0.8-0.08*i), gm);
      plate.position.set(-1.0, 0.16+0.1*i, 0.1*i-0.1); plate.rotation.y = 0.2*i; g.add(plate);
    }
    // diamond: octahedral crystal, bright and glassy
    const dm = new THREE.MeshStandardMaterial({ color:FX.lin('#f4faff'), roughness:0.01, metalness:0.06, envMap:envOf(o), envMapIntensity:3.4,
      transparent:true, opacity:0.42, flatShading:true });
    const dia = new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.78, 0), dm);
    dia.position.set(1.0, 0.72, 0); dia.rotation.y = 0.5; g.add(dia);
    const sparkle = FX.glowSprite('#ffffff', 1.5, { intensity:1.4 });
    sparkle.position.set(1.0, 0.75, 0.35); g.add(sparkle);
    return g;
  };

  FORMS.phosphorus = (L, o, stage)=>{
    const g = new THREE.Group();
    // jar of water with waxy white sticks
    const jar = new THREE.Mesh(lathe([[0,0],[1.0,0],[1.02,0.1],[1.02,1.7],[0.95,1.78],[0.0,1.8]]), glassMat(o));
    g.add(jar);
    const water = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.94, 0.94, 1.35, 40), new THREE.MeshStandardMaterial({
      color:FX.lin('#8fd0e8'), transparent:true, opacity:0.24, roughness:0.05, metalness:0, envMap:envOf(o), envMapIntensity:1.2, depthWrite:false }));
    water.position.y = 0.72; g.add(water);
    const wax = new THREE.MeshStandardMaterial({ color:FX.lin('#f2ecc8'), roughness:0.55, metalness:0.0, envMap:envOf(o), envMapIntensity:0.5,
      emissive:FX.lin('#7fff9f').multiplyScalar(0.28) });
    [[-0.3,0.35,0.1,0.5],[0.25,0.3,-0.2,-0.4],[0.0,0.55,0.25,0.9]].forEach(p=>{
      const capGeo = THREE.CapsuleBufferGeometry ? new THREE.CapsuleBufferGeometry(0.16,0.5,6,12) : new THREE.CylinderBufferGeometry(0.16,0.16,0.7,14);
      const s = new THREE.Mesh(capGeo, wax);
      s.position.set(p[0], p[1], p[2]); s.rotation.z = p[3]; s.rotation.x = 0.3; g.add(s);
    });
    const glow = FX.glowSprite('#7fff9f', 2.4, { intensity:0.9 }); glow.position.y = 0.5; g.add(glow);
    // red phosphorus powder beside the jar
    const red = new THREE.Mesh(lathe([[0,0],[0.5,0.02],[0.75,0.16],[0.8,0.2],[0.82,0]]), dielectric('#6e1410', 0.85, o));
    red.position.set(1.65, 0.0, 0.2); g.add(red);
    return g;
  };

  FORMS.bismuth = (L, o)=>{
    const g = new THREE.Group();
    const m = metalMat({ f0:[0.75,0.68,0.66], rough:0.12, irid:true }, o);
    // hopper crystal: nested stepped squares
    for(let lvl=0; lvl<7; lvl++){
      const s = 1.5 - lvl*0.17;
      const ring = new THREE.Mesh(new THREE.BoxBufferGeometry(s, 0.13, s), m);
      ring.position.y = 0.1 + lvl*0.13;
      ring.rotation.y = 0.18*lvl;
      g.add(ring);
      if(lvl>0){
        const inner = new THREE.Mesh(new THREE.BoxBufferGeometry(s*0.55, 0.13, s*0.55), m);
        inner.position.y = 0.1 + lvl*0.13; inner.rotation.y = 0.18*lvl + 0.25;
        g.add(inner);
      }
    }
    return g;
  };

  FORMS.tube = (L, o, stage)=>{
    const g = new THREE.Group();
    const len = 2.6;
    const glass = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.3, 0.3, len, 40, 1, true), glassMat(o));
    glass.rotation.z = Math.PI/2; glass.position.y = 0.9; g.add(glass);
    const capMat = metalMat({ f0:[0.62,0.62,0.64], rough:0.3 }, o);
    [-1,1].forEach(s=>{
      const cap = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.34, 0.34, 0.3, 28), capMat);
      cap.rotation.z = Math.PI/2; cap.position.set(s*(len/2+0.1), 0.9, 0); g.add(cap);
      const bulb = new THREE.Mesh(new THREE.SphereBufferGeometry(0.34, 28, 20), glassMat(o));
      bulb.position.set(s*(len/2-0.15), 0.9, 0); g.add(bulb);
    });
    const pm = plasmaMat(L.glow, 3.4);
    const plasma = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.19, 0.19, len-0.1, 32, 1, true), pm);
    plasma.rotation.z = Math.PI/2; plasma.position.y = 0.9; g.add(plasma);
    const core = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.07, 0.07, len-0.2, 20), emissive(L.glow, 4.5));
    core.rotation.z = Math.PI/2; core.position.y = 0.9; g.add(core);
    const spill = FX.glowSprite(L.glow, 4.2, { intensity:1.1 }); spill.position.y = 0.9; g.add(spill);
    const stand = new THREE.Mesh(lathe([[0,0],[0.5,0.02],[0.52,0.12],[0.14,0.2],[0.14,0.62],[0.0,0.62]]), dielectric('#12161f', 0.6, o, { metalness:0.3 }));
    g.add(stand);
    if(stage) stage.onFrame(dt=>{ pm.uniforms.uTime.value += dt; });
    return g;
  };

  FORMS.gas = (L, o, stage)=>{
    const g = new THREE.Group();
    const sphere = new THREE.Mesh(new THREE.SphereBufferGeometry(1.15, 48, 32), glassMat(o));
    sphere.position.y = 1.15; g.add(sphere);
    const gasMat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, side:THREE.DoubleSide,
      uniforms:{ uTime:{value:0}, uColor:{value:FX.lin(L.tint).multiplyScalar(1.2)}, uDensity:{value:L.density||0.75} },
      vertexShader:`varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vec4 wp = modelMatrix*vec4(position,1.0);
        vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition-wp.xyz); gl_Position = projectionMatrix*viewMatrix*wp; }`,
      fragmentShader: FX.glsl.noise + `uniform float uTime, uDensity; uniform vec3 uColor; varying vec3 vP; varying vec3 vN; varying vec3 vV;
        void main(){ float n = fbm3(vP*1.6 + vec3(uTime*0.08, uTime*0.05, 0.0));
          float edge = pow(1.0 - abs(dot(vN, vV)), 1.2);
          float a = uDensity*(0.35 + 0.45*(n*0.5+0.5)) * (0.35 + 0.8*edge);
          gl_FragColor = vec4(uColor*(0.8 + 0.5*n), a); }` });
    const inner = new THREE.Mesh(new THREE.SphereBufferGeometry(1.08, 48, 32), gasMat);
    inner.position.y = 1.15; g.add(inner);
    const neck = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.16, 0.2, 0.5, 24), glassMat(o));
    neck.position.y = 0.2; g.add(neck);
    const stand = new THREE.Mesh(lathe([[0,0],[0.62,0.02],[0.64,0.1],[0.2,0.16],[0,0.16]]), dielectric('#12161f', 0.6, o, { metalness:0.3 }));
    g.add(stand);
    if(stage) stage.onFrame(dt=>{ gasMat.uniforms.uTime.value += dt; });
    return g;
  };

  FORMS.dewar = (L, o, stage)=>{
    const g = new THREE.Group();
    const flask = new THREE.Mesh(lathe([[0,0],[1.05,0],[1.08,0.12],[1.08,1.85],[1.16,1.95],[1.0,1.98],[0.98,1.9],[0.98,0.14],[0,0.1]]), glassMat(o));
    g.add(flask);
    const liq = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.97, 0.97, 1.15, 48), new THREE.MeshStandardMaterial({
      color:FX.lin(L.liquid), transparent:true, opacity:0.85, roughness:0.12, metalness:0, envMap:envOf(o), envMapIntensity:0.5,
      emissive:FX.lin(L.liquid).multiplyScalar(0.25) }));
    liq.position.y = 0.66; g.add(liq);
    const surf = new THREE.Mesh(new THREE.CircleBufferGeometry(0.97, 48), new THREE.MeshStandardMaterial({
      color:FX.lin(L.liquid).multiplyScalar(1.3), roughness:0.02, metalness:0.1, envMap:envOf(o), envMapIntensity:1.8, transparent:true, opacity:0.85 }));
    surf.rotation.x = -Math.PI/2; surf.position.y = 1.235; g.add(surf);
    if(stage){
      // boiling + cold fog rolling over the rim
      FX.particles({ stage, parent:g, count:320, keep:true, drag:0.5, gravity:V3(0,-0.1,0), intensity:0.35, normal:false,
        spawn:()=>{ const a=Math.random()*Math.PI*2, r=Math.random()*0.85;
          return { p:[Math.cos(a)*r, 1.2, Math.sin(a)*r], v:[Math.cos(a)*0.2, 0.35+Math.random()*0.3, Math.sin(a)*0.2],
            c:FX.lin('#bcd8f0').multiplyScalar(0.35), s:2.2+Math.random()*2.6, d:Math.random()*6, l:2.6 }; },
        timeScale:1 });
    }
    return g;
  };

  FORMS.ampoule = (L, o, stage)=>{
    const g = new THREE.Group();
    const glass = new THREE.Mesh(lathe([[0,0],[0.62,0.05],[0.66,0.2],[0.66,1.55],[0.5,1.75],[0.14,1.95],[0.12,2.2],[0,2.25]]), glassMat(o, '#e6f0ff'));
    g.add(glass);
    if(L.fill === 'metal'){
      const m = metalMat(L, o);
      if(L.molten){
        const pool = new THREE.Mesh(lathe([[0,0.1],[0.5,0.12],[0.58,0.35],[0.6,0.6],[0,0.62]]), new THREE.MeshStandardMaterial({
          color:FX.lin(L.f0), metalness:1, roughness:0.02, envMap:envOf(o), envMapIntensity:1.7 }));
        g.add(pool);
        const bead = new THREE.Mesh(new THREE.SphereBufferGeometry(0.3, 32, 24), new THREE.MeshStandardMaterial({
          color:FX.lin(L.f0), metalness:1, roughness:0.03, envMap:envOf(o), envMapIntensity:1.7 }));
        bead.position.y = 0.85; bead.scale.y = 0.8; g.add(bead);
      } else {
        for(let i=0;i<3;i++){
          const c = new THREE.Mesh(blob(0.3+0.06*i, 2, 0.3, 120+i, 2.6, true), m);
          c.position.set((Math.random()-0.5)*0.3, 0.3+i*0.42, (Math.random()-0.5)*0.3);
          c.rotation.set(Math.random()*3, Math.random()*3, Math.random()*3); g.add(c);
        }
      }
    } else if(L.fill === 'liquid'){
      const liq = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.58, 0.58, 0.85, 40), new THREE.MeshStandardMaterial({
        color:FX.lin(L.color), roughness:0.06, metalness:0.0, envMap:envOf(o), envMapIntensity:1.3, transparent:true, opacity:0.92 }));
      liq.position.y = 0.55; g.add(liq);
      const vapMat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, side:THREE.DoubleSide,
        uniforms:{ uTime:{value:0}, uColor:{value:FX.lin(L.vapor).multiplyScalar(1.1)} },
        vertexShader:`varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: FX.glsl.noise + `uniform float uTime; uniform vec3 uColor; varying vec3 vP;
          void main(){ float n = fbm3(vP*2.2 + vec3(0.0, -uTime*0.25, uTime*0.1));
            float a = smoothstep(-0.1, 0.6, n)*0.55; gl_FragColor = vec4(uColor, a); }` });
      const vap = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.56, 0.56, 0.62, 32, 1, true), vapMat);
      vap.position.y = 1.3; g.add(vap);
      if(stage) stage.onFrame(dt=> vapMat.uniforms.uTime.value += dt);
    }
    const holder = new THREE.Mesh(lathe([[0,0],[0.75,0.02],[0.78,0.12],[0.3,0.18],[0,0.18]]), dielectric('#12161f', 0.55, o, { metalness:0.3 }));
    g.add(holder);
    return g;
  };

  FORMS.radon = (L, o, stage)=>{
    const g = FORMS.ampoule({ form:'ampoule' }, o, stage);
    // alpha-particle tracks, like a cloud chamber
    if(stage){
      const tracks = [];
      const spawn = ()=>{
        const a = Math.random()*Math.PI*2, y = 0.3 + Math.random()*1.2;
        const from = V3(Math.cos(a)*0.1, y, Math.sin(a)*0.1);
        const to = from.clone().add(V3(Math.cos(a), (Math.random()-0.5)*0.6, Math.sin(a)).multiplyScalar(0.55));
        FX.streak({ stage, parent:g, from, to, color:'#dfe9ff', size:0.55, intensity:1.2, ms:260, segments:8, fadeMs:420 });
      };
      let acc = 0;
      stage.onFrame(dt=>{ acc += dt; if(acc > 0.35){ acc = 0; spawn(); } });
    }
    return g;
  };

  FORMS.glowMetal = (L, o, stage)=>{
    const g = new THREE.Group();
    const m = metalMat(L, o);
    const scale = L.small ? 0.55 : 1;
    const main = new THREE.Mesh(blob(0.85*scale, 3, 0.26, L.seed||55, 2.0, true), m);
    main.position.y = 0.6*scale; main.rotation.set(0.4,0.5,0.2); g.add(main);
    const halo = FX.glowSprite(L.glow, 3.0*scale, { intensity:(L.strength||0.8)*0.9 });
    halo.position.y = 0.6*scale; g.add(halo);
    const pad = new THREE.Mesh(lathe([[0,0],[0.9,0.02],[0.92,0.1],[0.4,0.14],[0,0.14]]), dielectric('#0f1219', 0.5, o, { metalness:0.25 }));
    g.add(pad);
    if(stage){
      FX.pointCloud({ stage, parent:g, count:420, opacity:0.55, twinkle:0.8,
        gen:()=>{ let x=Math.random()*2-1,y=Math.random()*2-1,z=Math.random()*2-1; const mm=Math.hypot(x,y,z)||1;
          const r = (0.9 + Math.random()*1.5)*scale;
          return { p:[x/mm*r, 0.6*scale + y/mm*r*0.8, z/mm*r], c:FX.lin(L.glow).multiplyScalar(0.5+Math.random()), s:1.4 }; }});
      stage.onFrame((dt,t)=>{ halo.material.opacity = 0.75 + 0.25*Math.sin(t*1.7); });
    }
    return g;
  };

  FORMS.glowPellet = (L, o, stage)=>{
    const g = new THREE.Group();
    const hotMat = new THREE.ShaderMaterial({
      uniforms:{ uTime:{value:0} },
      vertexShader:`varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP = position; vec4 wp = modelMatrix*vec4(position,1.0);
        vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition-wp.xyz); gl_Position = projectionMatrix*viewMatrix*wp; }`,
      fragmentShader: FX.glsl.noise + `uniform float uTime; varying vec3 vN; varying vec3 vV; varying vec3 vP;
        void main(){ float n = fbm3(vP*3.0 + vec3(uTime*0.15));
          float f = pow(1.0 - abs(dot(vN,vV)), 1.5);
          vec3 hot = vec3(5.0, 0.9, 0.16), cool = vec3(1.3, 0.16, 0.03);
          vec3 c = mix(cool, hot, clamp(n*0.7+0.5, 0.0, 1.0)) * (0.7 + 0.8*f);
          gl_FragColor = vec4(c, 1.0); }` });
    const pellet = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.62, 0.62, 0.7, 40), hotMat);
    pellet.position.y = 0.6; g.add(pellet);
    const halo = FX.glowSprite('#ff6a1a', 3.0, { intensity:1.2 }); halo.position.y = 0.6; g.add(halo);
    const holder = new THREE.Mesh(lathe([[0,0],[1.0,0.02],[1.02,0.14],[0.7,0.24],[0.66,0.26],[0,0.26]]), dielectric('#14181f', 0.45, o, { metalness:0.4 }));
    g.add(holder);
    if(stage) stage.onFrame(dt=> hotMat.uniforms.uTime.value += dt);
    return g;
  };

  FORMS.glowSalt = (L, o, stage)=>{
    const g = new THREE.Group();
    const vial = new THREE.Mesh(lathe([[0,0],[0.52,0.03],[0.54,0.12],[0.54,1.5],[0.44,1.62],[0.2,1.68],[0.2,1.85],[0,1.88]]), glassMat(o));
    g.add(vial);
    const powder = new THREE.Mesh(lathe([[0,0.1],[0.44,0.12],[0.5,0.42],[0.52,0.6],[0,0.62]]), new THREE.MeshStandardMaterial({
      color:FX.lin('#dfeee8'), roughness:0.9, metalness:0, envMap:envOf(o), emissive:FX.lin(L.glow).multiplyScalar(0.7) }));
    g.add(powder);
    const halo = FX.glowSprite(L.glow, 2.1, { intensity:0.75 }); halo.position.y = 0.5; g.add(halo);
    if(stage) stage.onFrame((dt,t)=>{ halo.material.opacity = 0.7 + 0.3*Math.sin(t*2.1); });
    return g;
  };

  FORMS.microBead = (L, o, stage)=>{
    const g = new THREE.Group();
    const m = metalMat(L, o);
    const bead = new THREE.Mesh(blob(0.3, 3, 0.2, 77, 3.0), m);
    bead.position.y = 0.34; g.add(bead);
    const holder = new THREE.Mesh(lathe([[0,0],[1.1,0.02],[1.12,0.1],[0.35,0.22],[0.3,0.3],[0,0.3]]), dielectric('#101319', 0.4, o, { metalness:0.45 }));
    g.add(holder);
    const glow = FX.glowSprite('#cfe0ff', 1.6, { intensity:0.5 }); glow.position.y = 0.34; g.add(glow);
    const tweezer = new THREE.Mesh(new THREE.BoxBufferGeometry(0.06, 0.9, 0.06), metalMat({ f0:[0.7,0.7,0.72], rough:0.25 }, o));
    tweezer.position.set(0.35, 0.8, 0); tweezer.rotation.z = 0.45; g.add(tweezer);
    return g;
  };

  // Roughly how long a half-life phrase means, in seconds. Used only to set the
  // rhythm of the flicker, never displayed as a number.
  function halfSeconds(text){
    if(!text) return 1;
    const t = String(text).toLowerCase();
    if(/thousandth|millisecond/.test(t)) return 0.001;
    const num = parseFloat((t.match(/[\d.]+/)||['1'])[0]) || 1;
    if(/year/.test(t)) return num*3.15e7;
    if(/day/.test(t)) return num*86400;
    if(/hour/.test(t)) return num*3600;
    if(/minute/.test(t)) return num*60;
    return num;
  }

  FORMS.atoms = (L, o, stage)=>{
    const g = new THREE.Group();
    const r = FX.rng(L.seed||71);
    // a detector grid with a few individual atoms flashing into existence and decaying
    const grid = new THREE.Mesh(new THREE.PlaneBufferGeometry(3.4, 2.2, 14, 9),
      new THREE.MeshBasicMaterial({ color:FX.lin('#2a3c66'), wireframe:true, transparent:true, opacity:0.5 }));
    grid.position.set(0, 1.1, -0.6); g.add(grid);
    // How many atoms flicker, and for how long, follows what is actually known
    // about the element: a handful ever made, gone in under a millisecond.
    const said = String(L.count||'').toLowerCase();
    const n = /handful|few/.test(said) ? 2 : (/individual|single/.test(said) ? 3 : 5);
    const sec = halfSeconds(L.halfText);
    const base = FX.clamp(0.3 + 0.5*Math.log10(1 + sec), 0.3, 2.4);
    const place = a=> a.s.position.set((r()-0.5)*2.4, 0.5 + r()*1.5, (r()-0.5)*0.4);
    const atoms = [];
    for(let i=0;i<n;i++){
      const s = FX.glowSprite('#bcd8ff', 0.85, { intensity:2.2 });
      s.material.opacity = 0; g.add(s);
      const a = { s, t: r()*3, life: base*(0.7 + r()*0.6) };
      place(a); atoms.push(a);
    }
    if(stage) stage.onFrame(dt=>{
      atoms.forEach(a=>{
        a.t += dt;
        if(a.t > a.life + 0.9){
          a.t = 0; a.life = base*(0.7 + r()*0.6);
          place(a);
          FX.streak({ stage, parent:g, from:a.s.position.clone(), to:a.s.position.clone().add(V3((r()-0.5)*2, (r()-0.5)*1.4, 0.6)),
            color:'#ffd9a0', size:0.5, intensity:1.4, ms:320, segments:6, fadeMs:240 });
        }
        const k = FX.clamp(a.t/a.life, 0, 1.4);
        a.s.material.opacity = Math.max(0, Math.sin(Math.PI*Math.min(1,k)));
      });
    });
    return g;
  };

  FORMS.atomTrap = (L, o, stage)=>{
    const g = new THREE.Group();
    // six crossed laser beams holding a tiny glowing cloud
    const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    dirs.forEach(d=>{
      FX.beam({ stage, parent:g, from:V3(d[0]*2.4, 1.1+d[1]*2.4, d[2]*2.4), to:V3(0,1.1,0), color:'#ff3a2a', radius:0.045, intensity:1.6 });
    });
    const cloud = FX.pointCloud({ stage, parent:g, count:700, opacity:0.9, twinkle:0.5,
      gen:()=>{ let x=Math.random()*2-1,y=Math.random()*2-1,z=Math.random()*2-1; const m=Math.hypot(x,y,z)||1;
        const r = 0.3*Math.pow(Math.random(),0.4);
        return { p:[x/m*r, 1.1 + y/m*r, z/m*r], c:FX.lin('#ff6a4a').multiplyScalar(1.4), s:2.6 }; }});
    const halo = FX.glowSprite('#ff7a4a', 1.5, { intensity:1.6 }); halo.position.y = 1.1; g.add(halo);
    const chamber = new THREE.Mesh(new THREE.SphereBufferGeometry(1.9, 40, 28), new THREE.MeshStandardMaterial({
      color:FX.lin('#9fb6d8'), roughness:0.06, metalness:0, envMap:envOf(o), envMapIntensity:1.4, transparent:true, opacity:0.08, side:THREE.DoubleSide, depthWrite:false }));
    chamber.position.y = 1.1; g.add(chamber);
    return g;
  };

  // Bounding box over solid geometry only — sprites and point clouds excluded.
  const _b = new THREE.Box3(), _t = new THREE.Box3();
  function solidBox(root){
    _b.makeEmpty();
    root.updateWorldMatrix(false, true);
    root.traverse(o=>{
      if(!o.isMesh || !o.geometry) return;
      if(!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      _t.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      _b.union(_t);
    });
    if(_b.isEmpty()) _b.setFromObject(root);
    return _b.clone();
  }

  // ---------------------------------------------------------------- build
  function build(stage, profile, opts={}){
    const L = Object.assign({}, profile.look);
    // Every specimen gets its own seed so two elements sharing a form still
    // come out as two different lumps, in two different poses.
    if(L.seed == null) L.seed = (profile.z || 1) * 7 + 3;
    if(L.halfText == null && profile.iso) L.halfText = profile.iso.half;
    const form = FORMS[L.form] || FORMS.nugget;
    const group = new THREE.Group();
    const inner = form(L, opts, stage);
    group.add(inner);
    // Loose lumps can sit any way up; anything standing on the pedestal
    // (tubes, ampoules, bars, flasks) only gets a small turn.
    if(L.pose !== false){
      const loose = /^(nugget|chunk|crystalChunk|dendrite|bismuth|pellets|microBead)$/.test(L.form||'');
      const r = FX.rng(L.seed + 101);
      // Tubes, ampoules and bars have a front: turning them far would point
      // them at the camera. Loose lumps can land any way up.
      inner.rotation.y += (r()*2-1) * (loose ? Math.PI : 0.3);
      if(loose){
        inner.rotation.x += (r()*2-1) * 0.45;
        inner.rotation.z += (r()*2-1) * 0.38;
      }
    }
    // normalise scale so every specimen frames the same way.
    // Glow sprites and point clouds are light, not substance: measuring them
    // would shrink the real object to a dot inside its own halo.
    const box = solidBox(inner);
    const size = box.getSize(V3());
    const centre = box.getCenter(V3());
    // Fit both ways: wide specimens fill the frame, tall ones stop short of the
    // top edge instead of being cropped by it.
    const target = opts.target || 2.7;
    const targetH = opts.targetH || target * 0.92;
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const k = Math.min(target / (Math.max(size.x, size.z) || 1), targetH / (size.y || 1));
    inner.scale.setScalar(k);
    inner.position.set(-centre.x*k, -box.min.y*k, -centre.z*k);
    stage.add(group, opts.parent);
    if(opts.position) group.position.copy(opts.position);
    return { group, inner, radius: maxDim*k*0.5, caption: L.cap, form: L.form };
  }

  // ---------------------------------------------------------------- lab-panel preview
  // A tiny self-contained renderer so the selected element can be shown, as it
  // really looks, right in the lab panel.
  function preview(canvas){
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'low-power' });
    } catch(e){ return { show(){}, clear(){}, attach(){}, dispose(){} }; }
    const W = canvas.width || 196, H = canvas.height || 132;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
    renderer.setSize(W, H, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(36, W/H, 0.1, 200);
    cam.position.set(0, 2.2, 7.0); cam.lookAt(0, 1.05, 0);
    let env = null;
    try { env = FX.buildStudioEnv(renderer); } catch(e){}
    scene.add(new THREE.AmbientLight(FX.lin('#334466'), 0.5));

    let fns = [], group = null, built = null, raf = null, last = performance.now();
    const shim = {
      alive:true,
      group: new THREE.Group(),
      add(o, parent){ (parent || shim.group).add(o); return o; },
      onFrame(fn){ fns.push(fn); return ()=>{ fns = fns.filter(f=>f!==fn); }; },
      label(){ return { set(){}, remove(){} }; },
      dom(el){ return el; },
      timeout(fn, ms){ return setTimeout(fn, ms); },
      track(){},
      dispose(){},
    };
    scene.add(shim.group);

    function clear(){
      fns = [];
      while(shim.group.children.length) shim.group.remove(shim.group.children[0]);
      built = null;
    }
    function show(profile){
      clear();
      built = build(shim, profile, { env, target: 2.6 });
      built.group.rotation.y = -0.5;
      if(!raf) loop();
    }
    function attach(newCanvas){
      // the panel was re-rendered: move the live canvas back into place
      if(newCanvas && newCanvas !== canvas && newCanvas.parentNode){
        newCanvas.parentNode.replaceChild(canvas, newCanvas);
      }
    }
    function loop(){
      const now = performance.now();
      const dt = Math.min(0.05, (now-last)/1000); last = now;
      fns.forEach(fn=>{ try{ fn(dt, now/1000); }catch(e){} });
      // keep point sprites sized for this small canvas rather than the window
      shim.group.traverse(o=>{
        if(o.material && o.material.uniforms && o.material.uniforms.uScale) o.material.uniforms.uScale.value = H*0.5;
      });
      if(built) built.group.rotation.y += dt*0.35;
      renderer.render(scene, cam);
      raf = requestAnimationFrame(loop);
    }
    return { show, clear, attach, canvas,
      dispose(){ if(raf) cancelAnimationFrame(raf); clear(); renderer.dispose(); } };
  }

  window.Specimen = { build, studio, preview, FORMS, makeNoise, blob, roundedBox, lathe, metalMat, dielectric, glassMat, emissive, plasmaMat, patchTarnish };
})();
