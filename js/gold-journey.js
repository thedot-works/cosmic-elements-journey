// ==========================================================================
// GOLD JOURNEY — the closing act, and the only place the app is about gold:
// one nucleus rides the kilonova out into a molecular cloud, falls into a new
// star, ends up in the Earth, and finally sits on someone's hand. It answers
// the title question — and only here does it say: imagine, the gold in your
// jewellery could be this old.
// ==========================================================================
(function(){
  const V3 = (x,y,z)=> new THREE.Vector3(x,y,z);
  const $ = id=> document.getElementById(id);
  const el = (tag, cls, html)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; };

  // Thrown from bail() to unwind the whole journey the instant a Skip is
  // seen — never caught as a real error, just a fast way out of deeply
  // nested awaits without threading a "was skipped?" flag through every step.
  const SKIP = Symbol('gold-journey-skip');

  async function run(target){
    const stage = FX.stage('goldjourney');
    // Skip-aware, like Theater's ctx.wait: polls in short slices so a Skip
    // click mid-wait is noticed almost immediately instead of only at the
    // next wait() call.
    const wait = ms=> new Promise(resolve=>{
      if(Theater.skip){ setTimeout(resolve, Math.min(40, ms)); return; }
      let elapsed = 0; const STEP = 80;
      const tick = ()=>{
        if(Theater.skip || elapsed >= ms){ resolve(); return; }
        const next = Math.min(STEP, ms - elapsed);
        elapsed += next;
        stage.timeout(tick, next);
      };
      tick();
    });
    // Skip here means "I don't want to watch this" — the journey visits half
    // a dozen full 3-D scenes (a cloud, a star system, a planet, a galaxy),
    // each of which takes real time to build no matter how short the waits
    // between them are. Racing through every scene anyway is what made Skip
    // feel broken here even though it worked fine during the reaction itself.
    // So instead of just shortening the pauses, a Skip during this act jumps
    // straight out and back to the Forge, checked before each new scene is
    // built rather than only between waits.
    const bail = ()=>{ if(Theater.skip) throw SKIP; };
    const cap = (a,b)=> ExpUI.caption(a,b);
    const body = ()=> $('exp-body');
    const say = (html, opts={})=>{
      const d = el('div','cine-text ' + (opts.cls||'mid') + ' show', html);
      if(opts.top) d.style.top = opts.top;
      stage.dom(d, body());
      if(opts.hold !== false) stage.timeout(()=>{ d.classList.remove('show'); stage.timeout(()=> d.remove(), 900); }, opts.ms||3000);
      return d;
    };
    const readout = html=>{ let r = $('exp-hud').querySelector('.readout'); if(!r){ r = el('div','readout'); $('exp-hud').appendChild(r); } r.innerHTML = html; return r; };

    Cosmos.fadeStars(0.55, 900); Cosmos.fadeNebula(0.18, 900);
    FX.post.bloomStrength = 0.95; FX.post.vignette = 0.4;
    $('exp-side').innerHTML = '';

    try {

    // ---------------- 1. riding the kilonova debris
    cap('FOLLOW YOUR GOLD.', 'One nucleus among trillions, thrown outward at a tenth of the speed of light.');
    FX.cam.set(V3(0, 26, 190), V3(0,0,0));
    const debris = FX.nebula({ stage, radius:70, count:9000, inner:'#ffe0a8', outer:'#c0483a', clumpy:true, brightness:1.3, size:3.0, spin:0.03 });
    FX.cam.drift(V3(0,0,0), 190, 24, 0.03);
    const t = readout('<b>100 years</b><span>after the merger</span>');
    const times = [['100 years',''],['100,000 years',''],['10 million years','']];
    for(const [time] of times){
      t.innerHTML = `<b>${time}</b><span>after the merger</span>`;
      FX.animate(900, k=>{ debris.u.uExpand.value = 1 + k*0.5; });
      await wait(900);
    }
    cap('THE DEBRIS THINS OUT AND MIXES IN.', 'Your gold is now one atom among countless others in a vast, cold cloud.');
    await wait(1600);

    // ---------------- 2. the molecular cloud
    bail();
    const st2 = FX.stage('cloud'); stage.children.push(st2);
    const cloud = FX.pointCloud({ stage: st2, count:12000, opacity:0.75, twinkle:0.1, spin:0.04,
      gen:()=>{ const r = 150*Math.pow(Math.random(),0.55), th=Math.random()*6.283, ph=Math.acos(Math.random()*2-1);
        return { p:[r*Math.sin(ph)*Math.cos(th), r*Math.sin(ph)*Math.sin(th)*0.7, r*Math.cos(ph)],
          c: FX.lin(Math.random()<0.25 ? '#ffcf8f' : '#8f7fd0').multiplyScalar(0.3+Math.random()*0.6), s:3.2 }; }});
    FX.animate(1400, k=>{ debris.u.uOpacity.value = 0.95*(1-k); });
    cap('A MOLECULAR CLOUD.', 'Light-years across, and drifting for hundreds of millions of years.');
    await wait(1700);

    // ---------------- 3. collapse into a new star
    bail();
    cap('THEN SOMETHING NUDGES IT.', 'Gravity takes over, and the cloud begins to fall inward.');
    readout('<b>~4.6 billion years ago</b><span>our solar system begins</span>');
    await FX.animate(2400, k=>{ cloud.u.uExpand.value = 1 - 0.82*k; cloud.u.uOpacity.value = 0.75 - 0.35*k; }, FX.ease.in);
    FX.flash(0.9, '#ffe9c0', 1.8);
    const sun = FX.star({ stage: st2, radius:7, temp:5772, granulation:8, brightness:1.3, spots:0.3, glowScale:3.6 });
    cap('A NEW STAR IGNITES.', 'The Sun, four and a half billion years ago.');
    const disk = FX.disk({ stage: st2, inner:12, outer:95, count:9000, spin:1.6, tIn:5200, tOut:900, thickness:0.05, size:2.4, brightness:1.1 });
    await FX.cam.to(V3(0, 40, 170), V3(0,0,0), 1800);
    await wait(1100);
    cap('A DISK OF DUST AND DEBRIS SPINS AROUND IT.', 'Grains stick together. Pebbles become boulders. Boulders become worlds.');
    await wait(1800);

    // ---------------- 4. Earth forms
    bail();
    const st3 = FX.stage('earth'); stage.children.push(st3);
    FX.animate(1600, k=>{ disk.u.uOpacity.value = 1-k; cloud.u.uOpacity.value = 0.4*(1-k); });
    const earth = FX.earth({ stage: st3, radius:14, molten:1 });
    FX.cam.set(V3(0, 8, 92), V3(0,0,0));
    await FX.cam.to(V3(0, 6, 46), V3(0,0,0), 1800);
    cap('EARTH FORMS — MOLTEN, AND STILL BEING HIT.', 'Your gold nucleus is now part of a planet.');
    FX.cam.drift(V3(0,0,0), 46, 7, 0.035);
    await wait(1700);
    cap('IT COOLS. OCEANS CONDENSE.', 'Most of Earth\'s gold sinks with the iron into the core — out of reach forever.');
    await FX.animate(2600, k=>{ earth.u.uMolten.value = 1-k; });
    await wait(1000);
    say('The gold we can actually mine sits in the crust — much of it delivered by later impacts, after the core had already formed.',
      { cls:'small', top:'60%', ms:3000 });
    await wait(2000);

    // ---------------- 5. how old is gold
    bail();
    cap('HOW OLD IS GOLD?', '');
    await wait(900);
    const imagine = say('Imagine: the gold in your jewellery could be this old.', { cls:'mid', top:'40%', hold:false });
    await wait(2400);
    imagine.classList.remove('show');
    await wait(600);
    imagine.remove();
    const compare = el('div','age-compare');
    compare.innerHTML = `
      <div class="age-card"><div class="age-label">Earth</div><div class="age-val">~4.54 billion years</div></div>
      <div class="age-card gold"><div class="age-label">The gold in it</div><div class="age-val">Older than Earth</div>
        <div class="age-tag">Forged before our planet existed</div></div>`;
    compare.style.cssText = 'position:absolute; left:50%; top:56%; transform:translate(-50%,-50%);';
    stage.dom(compare, body());
    requestAnimationFrame(()=> compare.classList.add('show'));
    await wait(1800);
    say('A single gold atom does not come with a birth certificate, so nobody can put one exact age on it — only that it predates the Earth.',
      { cls:'small', top:'78%', ms:2800 });
    await wait(2200);
    compare.classList.remove('show');
    await wait(500);
    compare.remove();

    // ---------------- 6. out of the ground, onto a hand
    bail();
    cap('FROM THE GROUND TO YOUR HAND.', '');
    $('exp-hud').innerHTML = '';   // the timeline readout has done its job
    st3.dispose(); st2.dispose();  // leave Earth, the Sun and the disk behind
    Cosmos.fadeStars(0.35, 900);
    await wait(500);
    const refine = el('div','refine-row');
    [['⛏','Gold-bearing rock'],['⚙','Extraction'],['🔥','Refining'],['🟡','Pure gold'],['💍','Jewellery']].forEach((s,i)=>{
      if(i) refine.appendChild(el('span','arrow','→'));
      refine.appendChild(el('div','step', `<div>${s[0]}</div><div class="cap">${s[1]}</div>`));
    });
    refine.style.cssText = 'position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);';
    stage.dom(refine, body());
    requestAnimationFrame(()=> refine.classList.add('show'));
    await wait(1900);
    refine.remove();

    // ---------------- 7. the ring
    bail();
    const st4 = FX.stage('ring'); stage.children.push(st4);
    Cosmos.fadeStars(0.2, 900);
    Specimen.studio(st4, {});
    FX.cam.set(V3(0, 1.5, 5.4), V3(0, 1.2, 0));
    const ring = new THREE.Mesh(new THREE.TorusBufferGeometry(1.15, 0.34, 40, 120),
      Specimen.metalMat({ f0:[1.0,0.766,0.336], rough:0.09, micro:false }, {}));
    ring.position.y = 1.15; ring.rotation.x = 0.52; ring.rotation.z = 0.2;
    st4.add(ring);
    st4.onFrame(dt=>{ ring.rotation.z += dt*0.25; });
    FX.flash(0.4, '#ffd9a0', 2.6);
    cap('', '');
    await wait(900);
    for(const line of ['THE GOLD YOU WEAR', 'WAS NOT MADE ON EARTH.', 'EARTH INHERITED IT FROM THE UNIVERSE.']){
      const d = say(line, { cls:'mid', top:'13%', hold:false });
      await wait(1400);
      d.classList.remove('show'); stage.timeout(()=> d.remove(), 800);
    }
    const big = say('THE GOLD YOU WEAR<br>IS A PIECE OF COSMIC HISTORY.', { cls:'big gold', top:'14%', hold:false });
    await wait(1700);
    const sub = say('Long before it became jewellery, its atoms were forged in one of the most violent events the universe can produce.',
      { cls:'small', top:'89%', hold:false });
    await wait(2200);
    big.classList.remove('show'); sub.classList.remove('show');

    // ---------------- 8. pull back to the galaxy
    bail();
    FX.animate(2600, k=>{ ring.scale.setScalar(1 - 0.85*k); });
    Cosmos.fadeStars(1.0, 2200); Cosmos.fadeNebula(0.3, 2200);
    const st5 = FX.stage('galaxyEnd'); stage.children.push(st5);
    FX.galaxy({ stage: st5, radius: 460, count: 16000, spin: 0.015, opacity: 0 });
    const gal = st5.group.children[0];
    FX.animate(3000, k=>{ if(gal && gal.material.uniforms) gal.material.uniforms.uOpacity.value = k; });
    await FX.cam.to(V3(0, 150, 620), V3(0,0,0), 2200);
    const f1 = say('WE ARE MADE FROM A UNIVERSE', { cls:'big', top:'42%', hold:false });
    const f2 = say('THAT LEARNED TO BUILD ELEMENTS.', { cls:'big', top:'54%', hold:false });
    await wait(2200);
    f1.classList.remove('show'); f2.classList.remove('show');
    await wait(800);
    await Theater.actionButton('Return to the forge', { cls:'ghost' });

    } catch(e){
      if(e !== SKIP) throw e;
    } finally {
      stage.dispose();
    }
  }

  window.GoldJourney = { run };
})();
