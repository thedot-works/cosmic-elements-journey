// ==========================================================================
// NUCLEAR — nuclei built out of real nucleon counts (protons warm, neutrons
// cool), packed by relaxation, and animated through the actual reaction that
// makes each element: fusion, neutron capture, beta decay, electron capture,
// alpha emission, spallation, fission, even quark binding and recombination.
// This is what makes every element's story its own rather than a re-skin.
// ==========================================================================
(function(){
  const V3 = (x,y,z)=> new THREE.Vector3(x,y,z);
  const NR = 0.5;                                  // nucleon radius (scene units)
  const P_COL = '#ff6a3a', N_COL = '#a9bdd8';
  const cache = {};

  // ------------------------------------------------------------------ packing
  function packing(A){
    if(cache[A]) return cache[A];
    const R = Math.max(NR, NR*Math.pow(A/0.62, 1/3));
    const rnd = FX.rng(A*31+7);
    const p = new Float32Array(A*3);
    for(let i=0;i<A;i++){
      let x,y,z,d2;
      do { x=rnd()*2-1; y=rnd()*2-1; z=rnd()*2-1; d2=x*x+y*y+z*z; } while(d2>1);
      p[i*3]=x*R; p[i*3+1]=y*R; p[i*3+2]=z*R;
    }
    const minD = NR*1.92, iter = A>200 ? 26 : 44;
    for(let it=0; it<iter; it++){
      for(let i=0;i<A;i++){
        for(let j=i+1;j<A;j++){
          const dx=p[j*3]-p[i*3], dy=p[j*3+1]-p[i*3+1], dz=p[j*3+2]-p[i*3+2];
          let d = Math.sqrt(dx*dx+dy*dy+dz*dz);
          if(d < 1e-5){ p[j*3]+=0.01; d = 0.01; }
          if(d < minD){
            const push = (minD-d)/2/d;
            const ox=dx*push, oy=dy*push, oz=dz*push;
            p[i*3]-=ox; p[i*3+1]-=oy; p[i*3+2]-=oz;
            p[j*3]+=ox; p[j*3+1]+=oy; p[j*3+2]+=oz;
          }
        }
      }
      // keep the nucleus compact
      const lim = R*1.02;
      for(let i=0;i<A;i++){
        const x=p[i*3], y=p[i*3+1], z=p[i*3+2];
        const len = Math.sqrt(x*x+y*y+z*z) || 1;
        if(len > lim){ const k = lim/len; p[i*3]=x*k; p[i*3+1]=y*k; p[i*3+2]=z*k; }
        else { const k = 0.995; p[i*3]=x*k; p[i*3+1]=y*k; p[i*3+2]=z*k; }
      }
    }
    cache[A] = { pos:p, R };
    return cache[A];
  }
  function radiusOf(A){ return packing(Math.max(1,A)).R; }

  // ------------------------------------------------------------------ shared assets
  let GEO = null, MAT_P = null, MAT_N = null;
  function assets(){
    if(GEO) return;
    GEO = new THREE.SphereBufferGeometry(NR, 18, 12); GEO.userData.shared = true;
    MAT_P = new THREE.MeshStandardMaterial({ color:FX.lin(P_COL), roughness:0.34, metalness:0.12, envMap:FX.env, envMapIntensity:0.9,
      emissive:FX.lin(P_COL).multiplyScalar(0.18) });
    MAT_N = new THREE.MeshStandardMaterial({ color:FX.lin(N_COL), roughness:0.42, metalness:0.1, envMap:FX.env, envMapIntensity:0.8,
      emissive:FX.lin(N_COL).multiplyScalar(0.1) });
    MAT_P.userData.shared = MAT_N.userData.shared = true;
  }

  // ------------------------------------------------------------------ nucleus object
  // opts: { Z, N, position, capacity, label, scale }
  function nucleus(stage, opts){
    assets();
    const cap = opts.capacity || (opts.Z + opts.N + 24);
    const group = new THREE.Group();
    if(opts.position) group.position.copy(opts.position);
    stage.add(group, opts.parent);

    const pm = new THREE.InstancedMesh(GEO, MAT_P, cap);
    const nm = new THREE.InstancedMesh(GEO, MAT_N, cap);
    pm.frustumCulled = nm.frustumCulled = false;
    pm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    nm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(pm); group.add(nm);
    const glow = FX.glowSprite('#ffd9b0', 1, { intensity:0 });
    group.add(glow);

    const nucleons = [];   // { type:'p'|'n', base:Vector3, cur:Vector3, phase, amp }
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = V3(1,1,1);

    const NU = {
      group, glow, nucleons,
      Z:0, N:0,
      get A(){ return this.Z + this.N; },
      radius: NR,
      jiggle: 0.06,
      labelObj: null,
    };

    function layout(A){
      const pk = packing(Math.max(1,A));
      NU.radius = pk.R;
      return pk.pos;
    }
    // Fill the nucleus with Z protons and N neutrons at packed positions.
    function fill(Z, N){
      NU.Z = Z; NU.N = N;
      const A = Z+N;
      const pos = layout(A);
      nucleons.length = 0;
      const order = [];
      for(let i=0;i<A;i++) order.push(i);
      // protons biased slightly outward (Coulomb) — purely cosmetic
      order.sort((a,b)=>{
        const ra = pos[a*3]**2+pos[a*3+1]**2+pos[a*3+2]**2;
        const rb = pos[b*3]**2+pos[b*3+1]**2+pos[b*3+2]**2;
        return rb-ra;
      });
      const rnd = FX.rng(A+Z*13);
      const protonSlots = new Set();
      let assigned = 0, i = 0;
      while(assigned < Z && i < order.length){
        if(rnd() < 0.62 || order.length - i <= Z - assigned){ protonSlots.add(order[i]); assigned++; }
        i++;
      }
      for(let k=0;k<A;k++){
        const base = V3(pos[k*3], pos[k*3+1], pos[k*3+2]);
        nucleons.push({ type: protonSlots.has(k) ? 'p' : 'n', base, cur: base.clone(), phase: Math.random()*Math.PI*2, amp: 0.5+Math.random()*0.5 });
      }
      glow.scale.setScalar(NU.radius*3.2);
    }
    fill(opts.Z, opts.N);

    // re-pack to a new nucleon count, keeping identities (used after absorb/emit)
    function repackTargets(){
      const pos = layout(NU.A);
      nucleons.forEach((nu,k)=>{ nu.base.set(pos[k*3], pos[k*3+1], pos[k*3+2]); });
      glow.scale.setScalar(NU.radius*3.2);
    }

    let morphing = null; // {from:[], to:[], t}
    stage.onFrame((dt, t)=>{
      let pi=0, ni=0;
      for(let k=0;k<nucleons.length;k++){
        const nu = nucleons[k];
        // settle toward base position
        nu.cur.lerp(nu.base, Math.min(1, dt*6));
        const j = NU.jiggle*nu.amp;
        const x = nu.cur.x + Math.sin(t*2.1 + nu.phase)*j;
        const y = nu.cur.y + Math.sin(t*1.7 + nu.phase*1.3)*j;
        const z = nu.cur.z + Math.cos(t*2.4 + nu.phase*0.7)*j;
        M.compose(V3(x,y,z), Q, S);
        if(nu.type==='p'){ pm.setMatrixAt(pi++, M); } else { nm.setMatrixAt(ni++, M); }
      }
      pm.count = pi; nm.count = ni;
      pm.instanceMatrix.needsUpdate = true; nm.instanceMatrix.needsUpdate = true;
      if(glow.material.opacity > 0) glow.material.opacity = Math.max(0, glow.material.opacity - dt*1.9);
    });

    NU.setLabel = (html, opts2={})=>{
      if(NU.labelObj){ NU.labelObj.set(html); return NU.labelObj; }
      NU.labelObj = stage.label(html, group, Object.assign({ cls:'nuc-label', offset:[0,-46] }, opts2));
      return NU.labelObj;
    };
    NU.hideLabel = ()=>{ if(NU.labelObj){ NU.labelObj.remove(); NU.labelObj = null; } };
    NU.pulse = (color='#ffd9b0', strength=0.7)=>{
      glow.material.color.copy(FX.lin(color).multiplyScalar(strength));
      glow.material.opacity = 1;
    };
    NU.setVisible = v=>{ pm.visible = nm.visible = v; };
    NU.worldPos = ()=> group.getWorldPosition(V3());
    NU.tweenTo = (p, ms=700, easing)=>{ const from = group.position.clone(); return FX.animate(ms, t=> group.position.lerpVectors(from, p, t), easing||FX.ease.inOut); };

    // Absorb a nucleon (neutron or proton) flying in from outside.
    NU.absorb = async function(type='n', o={}){
      const dir = o.dir || V3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
      const start = dir.clone().multiplyScalar(NU.radius + (o.distance||14));
      const mesh = new THREE.Mesh(GEO, type==='p'?MAT_P:MAT_N);
      mesh.position.copy(start); group.add(mesh);
      const trail = FX.glowSprite(type==='p'?P_COL:'#cfe0ff', 3.2, { intensity:0.7 });
      mesh.add(trail);
      await FX.animate(o.ms||420, t=>{ mesh.position.lerpVectors(start, V3(0,0,0), t); }, FX.ease.in);
      group.remove(mesh);
      // add to composition at the surface, then re-pack
      const pos = dir.clone().multiplyScalar(NU.radius);
      nucleons.push({ type, base:pos.clone(), cur:pos.clone(), phase:Math.random()*Math.PI*2, amp:0.6 });
      if(type==='p') NU.Z++; else NU.N++;
      repackTargets();
      NU.pulse(type==='p' ? '#ffb07a' : '#bcd6ff', 0.55);
      if(o.gamma) emitParticle(stage, 'γ', group.getWorldPosition(V3()), { ms:520 });
      return NU;
    };

    // Beta-minus: a neutron becomes a proton, throwing out an electron and an antineutrino.
    NU.beta = async function(o={}){
      const idx = pickSurface('n');
      if(idx<0) return NU;
      nucleons[idx].type = 'p'; NU.N--; NU.Z++;
      NU.pulse('#7fd4ff', 0.7);
      const from = group.localToWorld(nucleons[idx].base.clone());
      emitParticle(stage, 'e-', from, { ms: o.ms||700 });
      emitParticle(stage, 'ν̄', from, { ms: (o.ms||700)*0.8 });
      repackTargets();
      return NU;
    };
    // Beta-plus: a proton becomes a neutron, throwing out a positron and a neutrino.
    NU.betaPlus = async function(o={}){
      const idx = pickSurface('p');
      if(idx<0) return NU;
      nucleons[idx].type = 'n'; NU.Z--; NU.N++;
      NU.pulse('#ff9fd0', 0.7);
      const from = group.localToWorld(nucleons[idx].base.clone());
      emitParticle(stage, 'e+', from, { ms:o.ms||700 });
      emitParticle(stage, 'ν', from, { ms:(o.ms||700)*0.8 });
      repackTargets();
      return NU;
    };
    // Electron capture: an electron falls in, a proton becomes a neutron, a neutrino leaves.
    NU.electronCapture = async function(o={}){
      const target = group.getWorldPosition(V3());
      await incomingParticle(stage, 'e-', target, { ms:o.ms||600, distance:16 });
      const idx = pickSurface('p');
      if(idx>=0){ nucleons[idx].type = 'n'; NU.Z--; NU.N++; }
      NU.pulse('#cfe4ff', 0.7);
      emitParticle(stage, 'ν', target, { ms:600 });
      repackTargets();
      return NU;
    };
    // Alpha emission: two protons and two neutrons leave as a helium nucleus.
    NU.emitAlpha = async function(o={}){
      const dir = o.dir || V3(Math.random()-0.5, Math.random()*0.4, Math.random()-0.5).normalize();
      const taken = [];
      for(let k=0;k<2;k++){ const i = pickSurface('p', dir); if(i>=0){ taken.push(i); } }
      for(let k=0;k<2;k++){ const i = pickSurface('n', dir); if(i>=0){ taken.push(i); } }
      taken.sort((a,b)=>b-a).forEach(i=> nucleons.splice(i,1));
      NU.Z -= 2; NU.N -= 2;
      repackTargets();
      NU.pulse('#ffd9b0', 0.7);
      const alpha = nucleus(stage, { Z:2, N:2, position: group.getWorldPosition(V3()).add(dir.clone().multiplyScalar(NU.radius)), parent: opts.parent });
      alpha.jiggle = 0.03;
      if(o.label!==false) alpha.setLabel('<b>⁴He</b><span>alpha particle</span>');
      const to = group.getWorldPosition(V3()).add(dir.clone().multiplyScalar((o.distance||26)));
      alpha.tweenTo(to, o.ms||1100, FX.ease.out);
      return alpha;
    };
    NU.emit = (kind, o)=> emitParticle(stage, kind, group.getWorldPosition(V3()), o);

    function pickSurface(type, dir){
      let best = -1, bestScore = -1e9;
      nucleons.forEach((nu,i)=>{
        if(nu.type!==type) return;
        let score = nu.base.length();
        if(dir) score += nu.base.dot(dir)*2;
        if(score > bestScore){ bestScore = score; best = i; }
      });
      return best;
    }
    NU.setComposition = (Z,N)=>{ fill(Z,N); };
    NU.dispose = ()=>{ if(NU.labelObj) NU.labelObj.remove(); if(group.parent) group.parent.remove(group); };
    return NU;
  }

  // ------------------------------------------------------------------ light particles
  const PKIND = {
    'γ':  { color:'#fff6c9', size:2.4, label:'γ', name:'gamma ray', wave:1.1, speed:1.0 },
    'e-': { color:'#7fd0ff', size:1.5, label:'e⁻', name:'electron' },
    'e+': { color:'#ff9ad4', size:1.5, label:'e⁺', name:'positron' },
    'ν':  { color:'#dfe9ff', size:0.9, label:'ν',  name:'neutrino', faint:true },
    'ν̄':  { color:'#dfe9ff', size:0.9, label:'ν̄',  name:'antineutrino', faint:true },
    'n':  { color:'#c9d9f0', size:2.0, label:'n',  name:'neutron' },
    'p':  { color:'#ff8a5c', size:2.0, label:'p',  name:'proton' },
  };
  function emitParticle(stage, kind, from, o={}){
    const K = PKIND[kind] || PKIND['γ'];
    const dir = o.dir || V3(Math.random()-0.5, Math.random()-0.5, (Math.random()-0.5)*0.4).normalize();
    const to = from.clone().add(dir.multiplyScalar(o.distance||30));
    const s = FX.streak({ stage, from, to, color:K.color, size:K.size*(K.faint?0.7:1.4), intensity: K.faint?0.5:1.8,
      ms:o.ms||700, segments: K.faint?6:12, wave: K.wave ? K.wave : 0, easing:FX.ease.out, fadeMs:250 });
    if(o.label !== false && !K.faint){
      const L = stage.label(`<b>${K.label}</b><span>${K.name}</span>`, to, { cls:'nuc-label small' });
      stage.timeout(()=> L.remove(), (o.ms||700)+900);
    }
    return s.done;
  }
  function incomingParticle(stage, kind, target, o={}){
    const K = PKIND[kind] || PKIND['e-'];
    const dir = o.dir || V3(Math.random()-0.5, Math.random()-0.5, 0).normalize();
    const from = target.clone().add(dir.multiplyScalar(o.distance||18));
    const s = FX.streak({ stage, from, to:target, color:K.color, size:K.size*1.4, intensity:1.6, ms:o.ms||600, segments:10, easing:FX.ease.in, fadeMs:180 });
    return s.done;
  }

  // ------------------------------------------------------------------ reaction HUD
  function hud(stage, steps, opts={}){
    const wrap = document.createElement('div');
    wrap.className = 'nuc-hud';
    wrap.innerHTML = steps.map((st,i)=>{
      const half = st.half ? `<span class="nuc-half">${st.half}</span>` : '';
      return `<div class="nuc-step" data-i="${i}"><div class="nuc-eq">${ElementProfiles.equationHTML(st)}${half}</div>` +
             `<div class="nuc-note">${st.note||''}</div></div>`;
    }).join('');
    stage.dom(wrap, opts.parent);
    const host = wrap.parentElement;
    if(host){ host.classList.add('scrim'); stage.track(()=> host.classList.remove('scrim')); }
    requestAnimationFrame(()=> wrap.classList.add('show'));
    return {
      el: wrap,
      highlight(i){
        [...wrap.children].forEach((c,k)=> c.className = 'nuc-step' + (k===i ? ' active' : (k<i ? ' done' : '')));
        const cur = wrap.children[i];
        if(cur) cur.scrollIntoView({ block:'nearest' });
      },
      done(){ [...wrap.children].forEach(c=> c.className = 'nuc-step done'); },
    };
  }

  // Plain-English gloss for each reaction mode, shown in the side panel next
  // to the chart while that step plays — so "what's actually going on" is
  // never left to the equation and jargon alone.
  const MODE_EXPLAIN = {
    fusion: 'Two nuclei collide and stick together, fusing into one heavier nucleus — a heavier element.',
    capture: 'A free neutron sticks to the nucleus. It gets heavier, but for now it is still the same element.',
    'beta-': 'The nucleus has too many neutrons. One flips into a proton — throwing out an electron — and the atom becomes the <b>next element up</b>.',
    'beta+': 'The nucleus has too many protons. One flips into a neutron — throwing out a positron — and the atom becomes the <b>next element down</b>.',
    ec: 'The nucleus grabs one of its own electrons and uses it to turn a proton into a neutron — the atom becomes the next element down.',
    alpha: 'The nucleus is too heavy to hold together. It spits out an alpha particle — two protons and two neutrons bound as one — dropping two places on the periodic table.',
    decay: 'The nucleus is unstable and throws off a particle, settling into a different, more stable nucleus.',
    spallation: 'A nucleus moving near light speed slams into another and shatters — chipping off a smaller, lighter nucleus.',
    fission: 'A heavy, overloaded nucleus splits apart into two lighter nuclei, releasing the neutrons that were holding it together.',
    hadron: 'Three quarks bind together — the simplest possible nucleus, a single proton.',
    recombination: 'A bare proton captures a passing electron and becomes the first hydrogen atom.',
  };

  // ------------------------------------------------------------------ the reaction player
  // Plays a parsed reaction (ElementProfiles steps) as a physical animation.
  // ctx: { stage, wait(ms), caption, skipped }
  async function play(ctx, steps, o={}){
    const stage = ctx.stage;
    const wait = ctx.wait || (ms=> new Promise(r=>setTimeout(r,ms)));
    const maxA = steps.reduce((m,st)=> Math.max(m, ...st.ins.map(t=>t.A||1), ...st.outs.map(t=>t.A||1)), 4);
    const dist = 6.5 + radiusOf(maxA)*5.2;
    if(o.camera !== false){
      // Look a little below the nucleus so it sits high in the frame and the
      // equation stack underneath it stays readable.
      await FX.cam.to(V3(0, dist*0.10, dist), V3(0, -dist*0.13, 0), o.cameraMs||1400);
    }
    const H = o.hud === false ? null : hud(stage, steps, { parent: o.hudParent });
    let live = {};        // token -> nucleus
    let lastMain = null;

    for(let si=0; si<steps.length; si++){
      const st = steps[si];
      if(H) H.highlight(si);
      if(ctx.skipped && ctx.skipped()) break;
      if(ctx.explain && o.explain !== false) ctx.explain(MODE_EXPLAIN[st.mode] || null);
      lastMain = await playStep(ctx, st, live, lastMain, o);
      await wait(st.half ? 2300 : 1800);
    }
    if(H) H.done();
    return { main:lastMain, live, hud:H };
  }

  function nucTokens(list){ return list.filter(t=> t.kind==='nucleus' || t.kind==='p' || t.kind==='n'); }
  function tokenZ(t){ return t.kind==='p' ? 1 : (t.kind==='n' ? 0 : t.Z); }
  function tokenN(t){ return t.kind==='p' ? 0 : (t.kind==='n' ? 1 : (t.A - t.Z)); }
  function tokLabel(t){ return `<b>${t.label}</b><span>${t.name}</span>`; }

  async function playStep(ctx, st, live, lastMain, o){
    const stage = ctx.stage, wait = ctx.wait;
    const insN = nucTokens(st.ins), outsN = nucTokens(st.outs).concat(st.outs.filter(t=>t.kind==='atom'));

    // ---- special: quarks binding into a proton
    if(st.mode==='hadron'){
      const q = [];
      const cols = ['#ff5a5a','#6affa0','#6aa8ff'];
      for(let i=0;i<3;i++){
        const a = i/3*Math.PI*2;
        const s = FX.glowSprite(cols[i], 2.2, { intensity:2.4 });
        s.position.set(Math.cos(a)*5, Math.sin(a)*5, 0);
        stage.add(s); q.push(s);
      }
      const ql = stage.label('<b>quarks</b><span>up, up, down</span>', V3(0,6,0), { cls:'nuc-label small' });
      await FX.animate(1500, t=>{
        q.forEach((s,i)=>{ const a = i/3*Math.PI*2 + t*7; const r = 5*(1-t)+0.4; s.position.set(Math.cos(a)*r, Math.sin(a)*r, 0); });
      }, FX.ease.in);
      FX.flash(0.22, '#ffd9b0', 4.0);
      q.forEach(s=> s.parent && s.parent.remove(s));
      ql.remove();
      const pr = nucleus(stage, { Z:1, N:0, position:V3(0,0,0) });
      pr.setLabel('<b>p</b><span>proton — a hydrogen nucleus</span>');
      live['p'] = pr;
      return pr;
    }

    // ---- special: a proton catching an electron (first atoms)
    if(st.mode==='recombination'){
      let pr = live['p'] || lastMain;
      if(!pr){ pr = nucleus(stage, { Z:1, N:0, position:V3(0,0,0) }); pr.setLabel('<b>p</b><span>proton</span>'); }
      const target = pr.worldPos();
      await incomingParticle(stage, 'e-', target.clone().add(V3(3,0,0)), { ms:900, distance:22 });
      // electron settles into a fuzzy orbital cloud
      const cloud = FX.pointCloud({ stage, count:900, opacity:0, twinkle:0.4,
        gen:()=>{ const u=Math.random(), r = 3.2*Math.pow(u,0.45);
          const th=Math.random()*Math.PI*2, ph=Math.acos(Math.random()*2-1);
          return { p:[r*Math.sin(ph)*Math.cos(th), r*Math.sin(ph)*Math.sin(th), r*Math.cos(ph)], c:FX.lin('#8fd0ff').multiplyScalar(0.9), s:1.3 }; }});
      cloud.points.position.copy(pr.group.position);
      await FX.animate(1100, t=>{ cloud.u.uOpacity.value = t*0.9; });
      pr.setLabel('<b>H</b><span>the first hydrogen atom</span>');
      FX.flash(0.2, '#9fd0ff', 3.6);
      return pr;
    }

    // ---- gather / create input nuclei
    const nucObjs = [];
    const spacing = 4.5 + radiusOf(Math.max(...insN.map(t=>t.A||1), 4))*3.2;
    for(let i=0;i<insN.length;i++){
      const t = insN[i];
      const key = t.token;
      let nu = live[key];
      const slotX = insN.length===1 ? 0 : (i===0 ? -spacing : spacing);
      if(nu){
        nu.tweenTo(V3(slotX,0,0), 600);
      } else if(t.count>1 || t.kind==='n' || t.kind==='p'){
        nu = null; // handled as incoming particles below
      } else {
        nu = nucleus(stage, { Z: tokenZ(t), N: tokenN(t), position: V3(slotX + (i===0?-18:18), (Math.random()-0.5)*4, 0) });
        nu.setLabel(tokLabel(t));
        live[key] = nu;
        nu.tweenTo(V3(slotX,0,0), 900, FX.ease.out);
      }
      if(nu) nucObjs.push({ t, nu });
    }
    // the biggest nucleus present is the one that keeps its identity
    let host = nucObjs.length ? nucObjs.reduce((a,b)=> (a.t.A||1) >= (b.t.A||1) ? a : b).nu : lastMain;
    if(!host && insN.length){
      const t = insN[0];
      host = nucleus(stage, { Z:tokenZ(t), N:tokenN(t), position:V3(0,0,0) });
      host.setLabel(tokLabel(t));
      live[t.token] = host;
    }
    await wait(nucObjs.length>1 ? 700 : 300);

    // ---- incoming loose nucleons (neutron capture, proton capture, n·15)
    const loose = st.ins.filter(t=> (t.kind==='n' || t.kind==='p') && !live[t.token]);
    for(const t of loose){
      const many = t.count>1;
      const each = many ? Math.max(90, 520/Math.min(t.count,12)) : 420;
      for(let k=0; k<t.count; k++){
        if(ctx.skipped && ctx.skipped() && k>2) break;
        await host.absorb(t.kind, { ms:each, distance: 12 + host.radius });
        if(many && k===0 && t.count>3) ctx.caption && ctx.caption(null, null);
      }
      if(many) host.pulse('#cfe4ff', 1.8);
    }

    // ---- electron capture
    if(st.mode==='ec'){
      await host.electronCapture({ ms:700 });
      const prod = st.outs.find(x=>x.kind==='nucleus');
      if(prod){
        host.setComposition(tokenZ(prod), tokenN(prod));
        host.setLabel(tokLabel(prod));
        Object.keys(live).forEach(k=>{ if(live[k]===host) delete live[k]; });
        live[prod.token] = host;
        if(st.outs.some(x=>x.kind==='gamma')) emitParticle(stage, 'γ', host.worldPos(), {});
      }
      return host;
    }

    // ---- decays
    if(st.mode==='beta-' || st.mode==='beta+' || st.mode==='alpha' || st.mode==='decay'){
      if(st.mode==='beta-'){
        const reps = st.outs.filter(x=>x.kind==='e-').reduce((a,x)=>a+x.count,0) || 1;
        for(let k=0;k<reps;k++){ await host.beta({}); await wait(reps>1 ? 220 : 420); }
      } else if(st.mode==='beta+'){
        await host.betaPlus({});
      } else if(st.mode==='alpha'){
        await host.emitAlpha({ distance:24, ms:1100 });
      }
      const prod = st.outs.filter(x=>x.kind==='nucleus').sort((a,b)=>b.A-a.A)[0];
      if(prod){
        host.setComposition(tokenZ(prod), tokenN(prod));
        host.setLabel(tokLabel(prod));
        Object.keys(live).forEach(k=>{ if(live[k]===host) delete live[k]; });
        live[prod.token] = host;
      }
      host.pulse('#ffe6c0', 0.8);
      await wait(600);
      return host;
    }

    // ---- fusion / capture / spallation / fission: bring together, flash, re-form
    if(nucObjs.length>1){
      const centres = nucObjs.map(x=>x.nu);
      await Promise.all(centres.map((nu,i)=> nu.tweenTo(V3(0,0,0), st.mode==='spallation'?380:620, st.mode==='spallation'?FX.ease.in:FX.ease.inOut)));
      FX.flash(st.mode==='spallation'?0.3:0.2, '#fff0d0', 4.2);
      FX.cam.shake(st.mode==='spallation'?1.4:0.7, 380);
      FX.burst(stage, { position:V3(0,0,0), count:200, color:'#ffd9a0', color2:'#ff7a3a', speed:22, size:1.1, life:1.0, intensity:0.8 });
      centres.forEach(nu=>{ if(nu!==host){ nu.hideLabel(); nu.dispose(); Object.keys(live).forEach(k=>{ if(live[k]===nu) delete live[k]; }); } });
      await wait(160);
    }

    // build the outputs
    const mainOut = outsN.sort((a,b)=>(b.A||0)-(a.A||0))[0];
    const others = outsN.filter(t=>t!==mainOut);
    if(mainOut){
      host.setComposition(tokenZ(mainOut), tokenN(mainOut));
      host.setLabel(tokLabel(mainOut));
      host.pulse('#ffe0b0', 0.9);
      Object.keys(live).forEach(k=>{ if(live[k]===host) delete live[k]; });
      live[mainOut.token] = host;
      host.tweenTo(V3(0,0,0), 400);
    }
    // ejected nuclei (alpha particles, protons, neutrons, fission fragments)
    let ang = Math.random()*Math.PI*2;
    for(const t of others){
      for(let k=0;k<t.count;k++){
        ang += 2.2;
        const dir = V3(Math.cos(ang), Math.sin(ang)*0.7, Math.sin(ang*1.7)*0.3).normalize();
        if(t.kind==='p' || t.kind==='n'){
          emitParticle(stage, t.kind, host.worldPos(), { dir, ms:800, distance: 24 });
        } else {
          const ej = nucleus(stage, { Z:tokenZ(t), N:tokenN(t), position: host.worldPos().clone().add(dir.clone().multiplyScalar(host.radius+1)) });
          ej.jiggle = 0.03;
          ej.setLabel(tokLabel(t));
          ej.tweenTo(host.worldPos().clone().add(dir.clone().multiplyScalar(host.radius + 26)), 1100, FX.ease.out);
          stage.timeout(()=>{ ej.hideLabel(); }, 2400);
        }
      }
    }
    // fission fragments / spallation debris
    if(st.outs.some(t=>t.kind==='frag')){
      const rest = Math.max(4, (st.ins.reduce((a,t)=>a+(t.A||0)*t.count,0)) - (mainOut? mainOut.A:0));
      const pieces = st.mode==='fission' ? 1 : 3;
      for(let i=0;i<pieces;i++){
        ang += 2.4;
        const dir = V3(Math.cos(ang), Math.sin(ang)*0.8, 0).normalize();
        const A = Math.max(2, Math.round(rest/pieces));
        const Zf = Math.max(1, Math.round(A*0.4));
        const ej = nucleus(stage, { Z:Zf, N:A-Zf, position: host.worldPos().clone().add(dir.clone().multiplyScalar(host.radius)) });
        ej.jiggle = 0.04;
        if(i===0) ej.setLabel('<b>fragments</b><span>lighter nuclei fly apart</span>');
        ej.tweenTo(host.worldPos().clone().add(dir.clone().multiplyScalar(host.radius+30)), 1300, FX.ease.out);
        stage.timeout(()=> ej.hideLabel(), 2600);
      }
      FX.burst(stage, { position:host.worldPos(), count:260, color:'#cfe4ff', color2:'#ffd9a0', speed:34, size:1.6, life:1.4 });
    }
    // gammas / neutrinos / leptons
    st.outs.filter(t=>['gamma','nu','nubar','e-','e+'].includes(t.kind)).forEach((t,i)=>{
      for(let k=0;k<t.count;k++){
        const kind = t.kind==='gamma'?'γ' : t.kind==='nu'?'ν' : t.kind==='nubar'?'ν̄' : t.token;
        stage.timeout(()=> emitParticle(stage, kind, host ? host.worldPos() : V3(0,0,0), { ms:700, distance:30, label: k===0 }), 120 + i*120 + k*90);
      }
    });
    return host;
  }

  window.Nuclear = { nucleus, packing, radiusOf, play, emitParticle, incomingParticle, hud, NR, P_COL, N_COL };
})();
