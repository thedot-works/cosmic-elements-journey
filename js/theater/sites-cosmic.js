// ==========================================================================
// COSMIC SITES — the Big Bang, cosmic-ray collisions, neutron-star mergers,
// radioactive decay inside Earth, and human laboratories. Plus the teaching
// paths for combinations that don't forge anything.
// ==========================================================================
(function(){
  const V3 = (x,y,z)=> new THREE.Vector3(x,y,z);
  const U = window.SiteUtil;
  const Sites = window.Sites = window.Sites || {};

  // ------------------------------------------------------------------ Big Bang
  Sites.bigbang = async function(ctx){
    const p = ctx.el;
    const stage = ctx.newScene('bigbang');
    Cosmos.fadeStars(0.0, 400); Cosmos.fadeNebula(0.0, 400);
    FX.post.bloomStrength = 1.15;
    FX.cam.set(V3(0,0,60), V3(0,0,0));
    const sky = FX.fireSky({ stage, radius:700, scale:2.4 });
    sky.u.uColor.value.copy(FX.blackbody(9000));
    sky.u.uBright.value = 6.0;
    // a fog of protons and neutrons
    FX.pointCloud({ stage, count:9000, opacity:0.9, twinkle:0.5,
      gen:()=>{ const r = 30+Math.random()*140, th=Math.random()*6.283, ph=Math.acos(Math.random()*2-1);
        const isP = Math.random()<0.87;
        return { p:[r*Math.sin(ph)*Math.cos(th), r*Math.sin(ph)*Math.sin(th), r*Math.cos(ph)],
          c: FX.lin(isP ? '#ff8a5c' : '#bcd2f0').multiplyScalar(1.1), s: 2.6 }; }});
    ctx.cap('THE UNIVERSE IS ONE MILLIONTH OF A SECOND OLD.', 'Too hot for atoms. Too hot even for nuclei.');
    ctx.hud(`<div class="hud-row"><span>Age</span><b id="bb-age">0.000001 s</b></div>
             <div class="hud-row"><span>Temperature</span><b id="bb-temp">10 trillion °C</b></div>`);
    const age = document.getElementById('bb-age'), temp = document.getElementById('bb-temp');
    const beats = [
      ['0.000001 s', '10 trillion °C', 'QUARKS BIND INTO PROTONS AND NEUTRONS.', 'The first building blocks exist — but nothing can hold them together yet.', 9000],
      ['1 second',   '10 billion °C',  'THE UNIVERSE IS A FOG OF LIGHT AND PARTICLES.', 'Neutrinos stop interacting and stream away, still crossing space today.', 7200],
      ['3 minutes',  '1 billion °C',   'COOL ENOUGH FOR NUCLEI TO STICK.', 'Protons and neutrons begin fusing — the only twenty minutes in which this happens.', 5200],
      ['20 minutes', '300 million °C', 'AND THEN IT STOPS.', 'The universe has thinned out too much. Whatever was made is what there is.', 3400],
    ];
    for(const [a,t,l1,l2,K] of beats){
      if(ctx.skipped()) break;
      if(age) age.textContent = a; if(temp) temp.textContent = t;
      ctx.cap(l1, l2);
      FX.animate(1600, k=>{ sky.u.uColor.value.copy(FX.blackbody(K)); sky.u.uBright.value = FX.lerp(6.0, 2.2, k*0.35); });
      await ctx.wait(3000);
    }
    await FX.animate(1600, t=>{ sky.u.uOpacity.value = 1-t; sky.u.uBright.value = FX.lerp(2.2, 0.2, t); });

    await U.micro(ctx, { l1: p.z===1 ? 'A PROTON IS A HYDROGEN NUCLEUS' : 'THE ONLY FUSION THE BIG BANG EVER DID',
      l2: p.where, tint:'#3a2a6a' });
    await ctx.nuclear(p.steps);
    if(p.z===1){
      ctx.cap('380,000 YEARS LATER', 'The fog clears. The universe becomes transparent — and that light is still arriving as the cosmic microwave background.');
      FX.flash(0.5, '#ffd9b0', 1.6);
      await ctx.wait(3200);
    } else {
      ctx.say('A quarter of all ordinary matter came out of those twenty minutes as helium — and it still is.', { cls:'small', top:'60%', ms:3600 });
      await ctx.wait(2800);
    }
  };

  // ------------------------------------------------------------------ cosmic-ray spallation
  Sites.spallation = async function(ctx){
    const p = ctx.el;
    const stage = ctx.newScene('galaxy');
    Cosmos.fadeStars(0.35, 700); Cosmos.fadeNebula(0.08, 700);
    FX.cam.set(V3(0, 130, 330), V3(0,0,0));
    FX.galaxy({ stage, radius: 420, count: 17000, arms: 2, spin: 0.015 });
    ctx.cap('COSMIC RAYS CROSS THE GALAXY.', 'Atomic nuclei flung out by exploding stars, moving at almost the speed of light.');
    FX.cam.drift(V3(0,0,0), 330, 120, 0.02);
    ctx.hud(`<div class="hud-row"><span>Particles</span><b>Mostly bare protons</b></div>
             <div class="hud-row science-only"><span>Speed</span><b>&gt;99% of light speed</b></div>
             <div class="hud-row science-only"><span>Journey</span><b>Millions of years, bent by magnetic fields</b></div>`);
    let acc = 0;
    stage.onFrame(dt=>{ acc += dt; if(acc > 0.22){ acc = 0;
      const a = Math.random()*6.283, r = 420;
      FX.streak({ stage, from: V3(Math.cos(a)*r, (Math.random()-0.5)*120, Math.sin(a)*r),
        to: V3(-Math.cos(a)*r*0.4, (Math.random()-0.5)*80, -Math.sin(a)*r*0.4),
        color:'#bfe8ff', size:2.4, intensity:2.2, ms:1100, segments:14, fadeMs:260 });
    }});
    await ctx.wait(4200);

    // dive into a molecular cloud where the gas is
    const st2 = ctx.newScene('cloud');
    ctx.cap('IN THE GAS BETWEEN THE STARS…', 'Carbon and oxygen nuclei drift, waiting to be hit.');
    FX.cam.set(V3(0, 6, 60), V3(0,0,0));
    FX.pointCloud({ stage: st2, count: 6000, opacity:0.6, twinkle:0.1, spin:0.02,
      gen:()=>{ const r = 90*Math.pow(Math.random(), 0.5), th=Math.random()*6.283, ph=Math.acos(Math.random()*2-1);
        return { p:[r*Math.sin(ph)*Math.cos(th), r*Math.sin(ph)*Math.sin(th)*0.6, r*Math.cos(ph)],
          c: FX.lin('#7f6fd0').multiplyScalar(0.3+Math.random()*0.5), s: 3.4 }; }});
    await ctx.wait(2600);

    await U.micro(ctx, { l1:'A DIRECT HIT', l2:'A cosmic ray shatters a nucleus — the pieces are the new elements', tint:'#2a5f5a' });
    await ctx.nuclear(p.steps);
    ctx.say('Stars destroy these fragile nuclei instead of making them. Collisions in empty space are how the universe gets them.',
      { cls:'small', top:'60%', ms:4000 });
    await ctx.wait(3000);
  };

  // ------------------------------------------------------------------ neutron-star merger (r-process)
  Sites.merger = async function(ctx){
    const p = ctx.el;
    const stage = ctx.newScene('merger');
    Cosmos.fadeStars(0.55, 800); Cosmos.fadeNebula(0.1, 800);
    FX.post.bloomStrength = 1.0;
    FX.cam.set(V3(90, 70, 210), V3(0,0,0));
    const grid = FX.spacetime({ stage, size:1100, segments:170, depth:70, sigma:44, spacing:26, color:'#4f7dff', opacity:0.8, position:V3(0,-55,0) });
    const nsA = FX.star({ stage, radius:2.2, temp:120000, granulation:30, brightness:3.0, glowScale:9, glow:0.7, corona:0.9 });
    const nsB = FX.star({ stage, radius:2.0, temp:110000, granulation:30, brightness:2.9, glowScale:9, glow:0.7, corona:0.9 });
    const orbit = { ang:0, sep:150, omega:0.35, gw:0, merged:false };
    stage.onFrame(dt=>{
      // Once they have merged there is one object at the centre, not two, so
      // the pair of wells falls together into a single deep one and the
      // orbital wobble winds down — otherwise the well keeps circling under
      // stars that are no longer there.
      if(orbit.merged){
        orbit.sep -= orbit.sep * Math.min(1, 2.2*dt);
        orbit.omega *= Math.exp(-1.6*dt);
      }
      orbit.ang += orbit.omega*dt;
      const a = orbit.ang, rA = orbit.sep*0.5, rB = orbit.sep*0.5;
      nsA.group.position.set(Math.cos(a)*rA, 0, Math.sin(a)*rA);
      nsB.group.position.set(-Math.cos(a)*rB, 0, -Math.sin(a)*rB);
      grid.u.uA.value.copy(nsA.group.position); grid.u.uB.value.copy(nsB.group.position);
      grid.u.uPhase.value = a; grid.u.uGW.value = orbit.gw;
      grid.u.uDepth.value = 70 * (150/Math.max(20, orbit.sep));
    });
    ctx.cap('TWO NEUTRON STARS, LOCKED IN A DEATH SPIRAL.', 'Each one is heavier than the Sun and smaller than a city.');
    ctx.hud(`<div class="hud-row"><span>Separation</span><b id="ns-sep">150 km</b></div>
             <div class="hud-row science-only"><span>Masses</span><b>~1.4 and ~1.3 solar masses</b></div>
             <div class="hud-row science-only"><span>Density</span><b>A teaspoon would weigh a billion tonnes</b></div>`);
    await ctx.wait(2600);
    ctx.cap('THEIR ORBIT RADIATES GRAVITATIONAL WAVES.', 'Ripples in spacetime itself carry energy away — so the orbit shrinks, faster and faster.');
    const sepEl = document.getElementById('ns-sep');
    await FX.animate(7000, t=>{
      orbit.sep = FX.lerp(150, 26, t);
      orbit.omega = FX.lerp(0.35, 5.2, Math.pow(t, 1.7));
      orbit.gw = FX.lerp(0, 26, t);
      if(sepEl) sepEl.textContent = Math.round(orbit.sep) + ' km';
      if(t > 0.5) Ambient.tick();
    }, FX.ease.in);

    // merger
    FX.flash(1.5, '#fff6e6', 1.6);
    Ambient.impact();
    FX.cam.shake(3.6, 1400);
    nsA.group.visible = nsB.group.visible = false;
    // these have to go through the orbit state, not the uniforms: the frame
    // handler rewrites uGW and uDepth every tick, so assigning them here was
    // overwritten before it ever reached the screen
    orbit.gw = 0; orbit.merged = true;
    ctx.cap('MERGER.', 'For a moment, matter reaches densities nothing else in the universe achieves.');
    FX.burst(stage, { position:V3(0,0,0), count:2600, color:'#fff0d0', color2:'#8fb0ff', speed:200, size:2.6, life:2.6, drag:0.5, intensity:1.6 });
    await ctx.wait(1800);

    // kilonova: blue polar ejecta, red equatorial ejecta, and polar jets
    ctx.cap('A KILONOVA.', 'Neutron-rich debris is flung out — and it glows for days as fresh radioactive atoms decay.');
    const blue = FX.nebula({ stage, radius:60, count:5000, inner:'#bfe4ff', outer:'#6aa8ff', bipolar:true, squash:1.6, brightness:1.6, size:2.8, spin:0.055 });
    const red  = FX.nebula({ stage, radius:75, count:6000, inner:'#ff9a6a', outer:'#c0342a', squash:0.35, brightness:1.4, size:3.4, clumpy:true, spin:-0.04 });
    blue.u.uExpand.value = 0.1; red.u.uExpand.value = 0.1;
    blue.u.uTwinkle.value = 0.30; red.u.uTwinkle.value = 0.20;

    // The explosion is driven per frame rather than by one tween that ends,
    // so it stays alive for the whole act instead of freezing into a still
    // while the spacetime grid behind it carries on rippling.
    //
    // Three things are happening at once, and all three are real: the debris
    // coasts outward with its expansion decelerating, it churns as it goes,
    // and it dims — a kilonova's light comes from freshly made radioactive
    // nuclei decaying, so it fades as they run out, which is exactly why the
    // 2017 event was only visible for a couple of weeks.
    const ejecta = { t:0, vB:0.50, vR:0.38 };
    stage.onFrame(dt=>{
      ejecta.t += dt;
      const slow = Math.exp(-0.25*dt);         // frame-rate independent drag
      ejecta.vB *= slow; ejecta.vR *= slow;
      blue.u.uExpand.value += ejecta.vB * dt;
      red.u.uExpand.value  += ejecta.vR * dt;
      // the light curve: bright at first, then a long slow dim to a floor, with
      // a slight churn on top so the cloud never reads as a static texture
      const churn = 1 + 0.05*Math.sin(ejecta.t*0.9) + 0.03*Math.sin(ejecta.t*2.3);
      const fade  = 0.52 + 0.48*Math.exp(-ejecta.t*0.05);
      blue.u.uOpacity.value = Math.min(1, 0.95 * fade * churn);
      red.u.uOpacity.value  = Math.min(1, 0.92 * Math.max(0.55, fade*1.05) * churn);
      // as the shell spreads, its particles thin out — grow them a little so
      // the cloud keeps its body instead of dissolving into specks
      blue.u.uSizeMul.value = 1 + ejecta.t*0.012;
      red.u.uSizeMul.value  = 1 + ejecta.t*0.010;
    });

    // Polar jets, spawning over a long window rather than one burst, so the
    // outflow keeps streaming for as long as the kilonova is on screen.
    [1,-1].forEach(s=>{
      FX.particles({ stage, count:1100, drag:0.2, intensity:1.6, keep:false,
        spawn:()=>{ const r = Math.random()*6;
          const a = Math.random()*6.283;
          return { p:[Math.cos(a)*r, s*2, Math.sin(a)*r], v:[Math.cos(a)*6, s*(120+Math.random()*90), Math.sin(a)*6],
            c: FX.lin('#dfe9ff').multiplyScalar(1.4), s:2.0, d:Math.random()*18, l:2.6 }; }});
    });
    ctx.hud(`<div class="hud-row"><span>Ejected</span><b>Thousands of Earth-masses of heavy elements</b></div>
             <div class="hud-row science-only"><span>Observed</span><b>GW170817 — 17 August 2017, 130 million light-years away</b></div>`);
    await ctx.wait(3600);

    // Three things came out of this collision. We look at all of them, in
    // order, and then follow the one that carries the elements.
    ctx.cap('WHAT CAME OUT OF THE COLLISION.', 'Three things left the scene. All three are worth a look.');
    await ctx.wait(2400);

    ctx.cap('ONE — THE REMNANT.', 'What is left at the centre is either a heavier neutron star or, if the combined mass is high enough, a new black hole.');
    ctx.hud(`<div class="hud-row"><span>At the centre</span><b>A heavier neutron star, or a black hole</b></div>
             <div class="hud-row"><span>GW170817</span><b>Almost certainly collapsed to a black hole within seconds</b></div>`);
    await ctx.wait(3600);

    ctx.cap('TWO — THE GRAVITATIONAL WAVES.', 'The last seconds of the spiral reached Earth as a rising chirp — and 1.7 seconds later a gamma-ray burst arrived from the same patch of sky.');
    ctx.hud(`<div class="hud-row"><span>Detected</span><b>LIGO and Virgo, 17 August 2017</b></div>
             <div class="hud-row"><span>Distance</span><b>130 million light-years</b></div>
             <div class="hud-row"><span>Follow-up</span><b>About 70 observatories saw the afterglow</b></div>`);
    await ctx.wait(4000);

    ctx.cap('THREE — THE EJECTA.', 'And this is the part that matters for the periodic table: neutron-rich matter, thrown clear before it could collapse.');
    ctx.hud(`<div class="hud-row"><span>Ejected</span><b>Thousands of Earth-masses of heavy elements</b></div>
             <div class="hud-row"><span>Free neutrons</span><b>Enough to build every element past iron</b></div>`);
    await ctx.wait(3400);

    // When no particular element was asked for, the honest answer to "what
    // does this collision make?" is the whole band at once — not just the
    // famous one. Show all of it, then follow one nucleus down.
    if(ctx.mode !== 'target'){
      ctx.hud(null);
      ctx.cap('IT DOES NOT MAKE ONE ELEMENT.', 'A single merger forges most of the heavy half of the periodic table in the same second.');
      await U.harvest(ctx, 'merger', p.z);
    }

    // scale dive into the debris
    ctx.cap('FOLLOW ONE PACKET OF DEBRIS.', 'Down, and down, and down.');
    await U.scaleDive(ctx, [['100 km','glowing debris'],['1 km','debris'],['1 m','matter'],['1 mm','matter'],
      ['10⁻⁶ m','atoms'],['10⁻⁹ m','a single atom'],['10⁻¹⁴ m','its nucleus'],['10⁻¹⁵ m','nucleons']], { ms:420 });

    // ------------------------------------------------------------------
    // The r-process, done so it actually lands on the chosen element.
    //
    // The books have to balance: a neutron capture adds 1 to A, a β⁻ decay
    // leaves A alone and moves one neutron into the proton column. So to get
    // from an iron-56 seed to the nucleus this element's own last reaction
    // starts from, the path needs exactly (A_end - 56) captures and
    // (Z_end - 26) beta decays — no more, no fewer.
    // ------------------------------------------------------------------
    await U.micro(ctx, { l1:'RAPID NEUTRON CAPTURE', l2:'Hundreds of neutrons in less than a second', tint:'#5a2a5f' });

    const firstIn = (p.steps[0] && p.steps[0].ins[0]) || null;
    const handover = firstIn && firstIn.kind === 'nucleus' && firstIn.Z < p.z && firstIn.Z > 26;
    const endZ = handover ? firstIn.Z : p.z;
    const endA = (firstIn && firstIn.kind === 'nucleus') ? firstIn.A : p.iso.A;
    const endN = endA - endZ;
    const SEED_Z = 26, SEED_A = 56, SEED_N = 30;

    const chart = ctx.chart({ n0: 20, n1: Math.max(endN + 16, 140), z0: 20, z1: Math.max(endZ + 8, 70),
      title:'The r-process path <b>schematic</b>' });
    chart.mark(p.z, p.N, p.sym + '-' + p.iso.A);
    const seed = Nuclear.nucleus(ctx.stage, { Z:SEED_Z, N:SEED_N, position:V3(0,0,0), capacity: endA + 30 });
    // this nucleus grows to ~200 nucleons, so the label needs to clear it
    seed.setLabel('<b>\u2075\u2076Fe</b><span>an iron seed nucleus</span>', { offset:[0, -Math.round(58 + endA*0.42)] });
    await FX.cam.to(V3(0, 2, 18 + Nuclear.radiusOf(endA)*6.4), V3(0,0,0), 1400);
    chart.seed(SEED_Z, SEED_N);
    ctx.explain({
      label: 'THE R-PROCESS',
      step: 'Phase 1 of 4',
      title: 'An iron seed, dropped into a flood of neutrons',
      body: 'Everything heavier than iron needs neutrons, and it needs them faster than it can fall apart. ' +
        'That is the whole idea behind the <b>r-process</b> — the <b>r</b> is for <b>rapid</b>. ' +
        'The debris leaving this collision is the most neutron-rich matter in the universe: roughly ' +
        'a hundred free neutrons for every seed nucleus like the iron-56 on screen.',
      note: '<b>Watch the chart:</b> every neutron pushes the nucleus one square right. Every decay pushes it one square up.',
    });

    let Z = SEED_Z, N = SEED_N, captured = 0, decayed = 0;
    const capturesTotal = Math.max(1, endA - SEED_A);
    const betasTotal = Math.max(1, endZ - SEED_Z);
    const betasAfter = Math.min(betasTotal, Math.max(3, Math.round(betasTotal * 0.22)));
    const betasDuring = betasTotal - betasAfter;

    const isoOf = (zz, nn)=>{
      const e = ElementProfiles.get(zz);
      return `<b>${ElementProfiles.sup(zz+nn)}${e ? e.sym : '?'}</b><span>${e ? e.name.toLowerCase() : 'unknown'}-${zz+nn}</span>`;
    };
    const counter = ctx.readout('<b>0</b><span>neutrons captured</span>');
    const tick = ()=>{
      const e = ElementProfiles.get(Z);
      counter.innerHTML = `<b>${captured}</b><span>neutrons captured</span>` +
        `<b>${e ? e.sym : '?'}-${Z+N}</b><span>the nucleus right now</span>`;
    };

    // Adds k neutrons: a handful arrive visibly, the rest arrive with them.
    async function capture(k){
      const shown = Math.min(k, 4);
      const jobs = [];
      for(let i=0;i<shown;i++){
        jobs.push(seed.absorb('n', { ms: 170 + i*40, distance: 13 + seed.radius }));
        setTimeout(()=> Ambient.capture(), 140 + i*55);
      }
      await Promise.all(jobs);
      if(k > shown) seed.setComposition(Z, N + k);       // the rest of the burst
      for(let i=0;i<k;i++){ N++; chart.step(Z, N, 'capture'); }
      captured += k;
      tick();
    }
    async function decay(ms){
      Ambient.fuse('beta-');
      await seed.beta({ ms });
      Z++; N--; decayed++;
      chart.step(Z, N, 'beta');
      seed.setLabel(isoOf(Z, N));
      tick();
    }

    // a few single captures, slow enough to see what one capture does
    for(let i=0;i<5 && captured<capturesTotal; i++){
      if(ctx.skipped()) break;
      Ambient.capture();
      await seed.absorb('n', { ms: 300, distance: 12 + seed.radius });
      N++; captured++; chart.step(Z, N, 'capture'); tick();
    }
    seed.setLabel(isoOf(Z, N));
    ctx.cap('THE NUCLEUS FILLS UP WITH NEUTRONS.', 'It can only hold so many. When it is overloaded, one neutron turns into a proton — and the climb carries on one element higher.');
    ctx.explain({
      label: 'THE R-PROCESS',
      step: 'Phase 2 of 4',
      title: 'Neutron capture — heavier, but still the same element',
      body: 'A free neutron sticks to the nucleus and stays. The nucleus gets heavier with every one it swallows, ' +
        'but it does <b>not</b> change element: what names an element is its proton count, and no protons have been added. ' +
        'Iron with thirty extra neutrons is still iron — just a wildly unstable version of it.',
      note: '<b>Why it has to be fast:</b> these overloaded nuclei would normally decay in a fraction of a second. Here the next neutron arrives first.',
    });
    await ctx.wait(2400);

    // the zig-zag: capture, capture, capture, one beta, and again
    const CYCLES = 11;
    for(let c=0; c<CYCLES; c++){
      if(ctx.skipped()) break;
      const left = CYCLES - c;
      const capNow = Math.max(0, Math.ceil((capturesTotal - captured)/left));
      const betaNow = Math.max(0, Math.ceil((betasDuring - decayed)/left));
      if(capNow) await capture(capNow);
      for(let b=0; b<betaNow; b++){
        if(ctx.skipped()) break;
        await decay(200);
      }
    }
    // whatever rounding left over
    if(captured < capturesTotal && !ctx.skipped()) await capture(capturesTotal - captured);
    while(decayed < betasDuring && !ctx.skipped()) await decay(140);

    seed.pulse('#bcd6ff', 1.2);
    ctx.cap('THE NEUTRONS RUN OUT.', `Freeze-out. What is left is a wildly neutron-rich nucleus, and now nothing is holding it together — it decays back toward stability.`);
    ctx.explain({
      label: 'THE R-PROCESS',
      step: 'Phase 3 of 4',
      title: 'Freeze-out — the neutrons run out',
      body: 'Within about a second the debris has expanded and thinned, and there are no free neutrons left to catch. ' +
        'What remains is a nucleus carrying far more neutrons than it can hold together, ' +
        'with nothing left to stop it from falling apart.',
      note: 'Everything after this point is the nucleus repairing itself — and that is where the new elements appear.',
    });
    await ctx.wait(2600);

    ctx.explain({
      label: 'THE R-PROCESS',
      step: 'Phase 4 of 4',
      title: 'Beta decay — this is where new elements appear',
      body: 'With no neutrons left to catch, the nucleus fixes itself from the inside: a surplus neutron turns into a proton ' +
        'and throws out an electron. The mass barely changes, but the proton count goes up by one — ' +
        'and the proton count <b>is</b> the element. Each decay is a step up the periodic table.',
      note: 'This is the moment the heavy elements are actually made. Everything before it was only loading the nucleus up.',
    });

    // the cascade back: A stays put, each decay moves one step up in Z
    for(let i=0; i<betasAfter; i++){
      if(ctx.skipped()) break;
      await decay(i < 3 ? 420 : 240);
      await ctx.wait(i < 3 ? 260 : 90);
    }
    // land exactly where the element's own reaction picks up
    if(Z !== endZ || N !== endN){
      Z = endZ; N = endN;
      seed.setComposition(Z, N);
      chart.step(Z, N, 'beta');
      seed.setLabel(isoOf(Z, N));
      tick();
    }
    const endEl = ElementProfiles.get(endZ);
    ctx.cap('THE CASCADE STOPS HERE.', handover
      ? `${endEl.name} — ${ElementProfiles.sup(endA)}${endEl.sym}. One decay away from ${p.name}.`
      : `${p.name} — ${ElementProfiles.sup(endA)}${p.sym}. Atomic number ${p.z}.`);
    seed.pulse('#ffe6c0', 1.4);
    await ctx.wait(3000);
    ctx.side(null);
    seed.dispose();

    ctx.newScene('final');
    FX.microBackdrop({ stage: ctx.stage, tint:'#5a2a5f' }).fadeIn(500);
    ctx.cap(handover ? 'THE LAST STEP — ' + p.name.toUpperCase() : 'THE REACTION ITSELF', p.where);
    await ctx.nuclear(p.steps);
    ctx.say('The r-process makes a whole spread of heavy elements at once — this is one of them.', { cls:'small', top:'60%', ms:3400 });
    await ctx.wait(3800);
  };

  // ------------------------------------------------------------------ radioactive decay inside Earth
  Sites.decay = async function(ctx){
    const p = ctx.el;
    const stage = ctx.newScene('earth');
    Cosmos.fadeStars(0.4, 700); Cosmos.fadeNebula(0.08, 700);
    FX.cam.set(V3(0, 10, 120), V3(0,0,0));
    const earth = FX.earth({ stage, radius:26 });
    ctx.cap('EARTH, FOUR AND A HALF BILLION YEARS OLD.', 'Inside it, uranium and thorium have been decaying since the day it formed.');
    FX.cam.drift(V3(0,0,0), 120, 14, 0.03);
    ctx.hud(`<div class="hud-row"><span>Element</span><b>${p.name} — made by decay, not by stars</b></div>
             <div class="hud-row science-only"><span>Radiogenic heat</span><b>About half the heat leaving Earth</b></div>`);
    await ctx.wait(3200);
    await FX.cam.to(V3(0, 4, 46), V3(0,0,0), 2200);

    const st2 = ctx.newScene('ore');
    ctx.cap('A PIECE OF URANIUM ORE.', 'Every second, a few nuclei in this rock fall apart.');
    FX.cam.set(V3(0, 2.5, 16), V3(0,0.6,0));
    const ore = new THREE.Mesh(Specimen.blob(3.4, 3, 0.3, 42, 1.5, true),
      Specimen.dielectric('#2b2620', 0.8, {}, { metalness:0.35 }));
    ore.position.y = 0.6; st2.add(ore);
    st2.onFrame(dt=>{ ore.rotation.y += dt*0.15; });
    let acc = 0;
    st2.onFrame(dt=>{ acc += dt; if(acc > 0.4){ acc = 0;
      const a = Math.random()*6.283, ph = Math.acos(Math.random()*2-1);
      const dir = V3(Math.sin(ph)*Math.cos(a), Math.cos(ph), Math.sin(ph)*Math.sin(a));
      FX.streak({ stage: st2, from: dir.clone().multiplyScalar(3.2).add(V3(0,0.6,0)), to: dir.clone().multiplyScalar(7).add(V3(0,0.6,0)),
        color:'#cfe4ff', size:0.8, intensity:1.4, ms:320, segments:7, fadeMs:300 });
    }});
    await ctx.wait(3000);

    // walk the decay chain
    await U.micro(ctx, { l1:'A DECAY CHAIN', l2:`From uranium down to ${p.name.toLowerCase()}`, tint:'#2a5f3a' });
    const chain = U.CHAINS[p.chain.series].slice();
    const stopIdx = chain.findIndex(c=> c[0] === p.chain.stop);
    const branch = U.CHAIN_BRANCH[p.chain.stop];
    const walk = stopIdx >= 0 ? chain.slice(0, stopIdx+1)
                              : chain.slice(0, chain.findIndex(c=> c[0] === (branch ? branch.from : '')) + 1);
    const isos = walk.map(c=> U.parseIso(c[0]));
    const Ns = isos.map(i=>i.N), Zs = isos.map(i=>i.Z);
    const chart = ctx.chart({ n0: Math.min(...Ns)-6, n1: Math.max(...Ns)+6, z0: Math.min(...Zs)-4, z1: Math.max(...Zs)+4,
      title:'Decay chain <b>' + (p.chain.series==='U238' ? 'uranium-238 series' : 'uranium-235 series') + '</b>' });
    chart.mark(p.z, p.N, p.sym + '-' + p.iso.A);
    const first = isos[0];
    const nuc = Nuclear.nucleus(ctx.stage, { Z:first.Z, N:first.N, position:V3(0,0,0), capacity: first.A + 8 });
    nuc.setLabel(`<b>${first.label}</b><span>${walk[0][2]}</span>`);
    await FX.cam.to(V3(0, 2, 16 + Nuclear.radiusOf(first.A)*7), V3(0,0,0), 1300);
    chart.seed(first.Z, first.N);
    for(let i=1;i<walk.length;i++){
      if(ctx.skipped()) break;
      const mode = walk[i-1][1], iso = isos[i];
      ctx.readout(`<b>${walk[i-1][2]}</b><span>half-life of ${isos[i-1].label}</span>`);
      if(mode === 'α'){ await nuc.emitAlpha({ distance:20, ms: i<4 ? 900 : 420 }); }
      else { await nuc.beta({}); }
      nuc.setComposition(iso.Z, iso.N);
      nuc.setLabel(`<b>${iso.label}</b><span>${ElementProfiles.get(iso.Z) ? ElementProfiles.get(iso.Z).name : ''}</span>`);
      chart.step(iso.Z, iso.N, mode === 'α' ? 'alpha' : 'beta');
      await ctx.wait(i<4 ? 700 : 260);
    }
    if(branch){
      ctx.cap('A RARE BRANCH.', branch.note);
      await ctx.wait(1800);
    }
    await ctx.wait(1200);
    ctx.side(null); nuc.dispose(); ctx.hud(null);

    ctx.newScene('final');
    FX.microBackdrop({ stage: ctx.stage, tint:'#2a5f3a' }).fadeIn(500);
    ctx.cap('THE STEP THAT MAKES IT', p.where);
    await ctx.nuclear(p.steps);
    ctx.say('Its parent uranium was forged in a neutron-star collision long before Earth existed. This element is its grandchild.',
      { cls:'small', top:'60%', ms:4000 });
    await ctx.wait(3000);
  };

  // ------------------------------------------------------------------ human laboratory
  Sites.lab = async function(ctx){
    const p = ctx.el;
    const L = p.lab || { type:'cyclotron', place:'a laboratory', year:'', atoms:'' };
    const stage = ctx.newScene('lab');
    Cosmos.fadeStars(0.12, 700); Cosmos.fadeNebula(0.03, 700);
    FX.post.bloomStrength = 0.95;
    ctx.hud(`<div class="hud-row"><span>Made at</span><b>${L.place}</b></div>
             <div class="hud-row"><span>Year</span><b>${L.year}</b></div>
             <div class="hud-row science-only"><span>Quantity</span><b>${L.atoms}</b></div>`);

    if(L.type === 'reactor'){
      FX.cam.set(V3(0, 12, 34), V3(0,0,0));
      ctx.cap('A NUCLEAR REACTOR.', 'Uranium splitting, over and over, in a pool of water.');
      const rods = new THREE.Group(); stage.add(rods);
      const rodMat = Specimen.metalMat({ f0:[0.62,0.64,0.68], rough:0.3 }, {});
      for(let x=-3;x<=3;x++) for(let z=-3;z<=3;z++){
        const r = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.45, 0.45, 16, 12), rodMat);
        r.position.set(x*1.6, 0, z*1.6); rods.add(r);
      }
      const glow = FX.glowSprite('#4fa8ff', 40, { intensity:0.75 }); stage.add(glow);
      FX.pointCloud({ stage, count:4000, opacity:0.6, twinkle:0.5,
        gen:()=>({ p:[(Math.random()-0.5)*14, (Math.random()-0.5)*18, (Math.random()-0.5)*14],
          c: FX.lin('#6ab6ff').multiplyScalar(1.2), s: 2.2 }) });
      FX.cam.drift(V3(0,0,0), 34, 12, 0.06);
      await ctx.wait(3000);
      ctx.cap('CHERENKOV LIGHT.', 'That blue glow is particles moving through water faster than light can.');
      await ctx.wait(3000);
    } else if(L.type === 'bomb'){
      FX.cam.set(V3(0, 8, 60), V3(0,4,0));
      ctx.cap('NOVEMBER 1952.', 'These two elements were first found in the fallout of the first thermonuclear test.');
      const sea = new THREE.Mesh(new THREE.PlaneBufferGeometry(600, 600),
        new THREE.MeshStandardMaterial({ color:FX.lin('#050a12'), roughness:0.15, metalness:0.2, envMap:FX.env, envMapIntensity:0.6 }));
      sea.rotation.x = -Math.PI/2; sea.position.y = -6; stage.add(sea);
      const dome = FX.glowSprite('#ffe6b0', 56, { intensity:0.8 });
      dome.position.set(-40, 2, -220); stage.add(dome);
      FX.flash(0.9, '#fff0d0', 1.2);
      await ctx.wait(2600);
      ctx.cap('IN THE DEBRIS: NEW ELEMENTS.', 'Uranium nuclei had swallowed more than a dozen neutrons in a fraction of a second.');
      await ctx.wait(3200);
    } else {
      // accelerator: a beam of ions, a target, and a detector
      FX.cam.set(V3(0, 10, 40), V3(0,0,0));
      const isCyc = L.type === 'cyclotron';
      ctx.cap(isCyc ? 'A CYCLOTRON.' : 'A LINEAR ACCELERATOR.',
        isCyc ? 'Ions spiral outward, gaining energy on every turn.' : 'Ions are pushed up to a tenth of light speed down a long tube.');
      const metal = Specimen.metalMat({ f0:[0.6,0.63,0.68], rough:0.3 }, {});
      if(isCyc){
        [1,-1].forEach(s=>{
          const dee = new THREE.Mesh(new THREE.CylinderBufferGeometry(11, 11, 1.6, 40, 1, false, 0, Math.PI), metal);
          dee.rotation.y = s>0 ? 0.08 : Math.PI+0.08; dee.position.y = s*1.6; stage.add(dee);
        });
        const spiral = t=>{ const a = t*Math.PI*7, r = 1 + t*9.6; return V3(Math.cos(a)*r, 0, Math.sin(a)*r); };
        for(let k=0;k<4;k++){
          FX.streak({ stage, from: V3(1,0,0), to: V3(9.6,0,0), curve: spiral, color:'#8fd4ff', size:1.4, intensity:2.0, ms:2200, segments:16, fadeMs:300 });
        }
      } else {
        const tube = new THREE.Mesh(new THREE.CylinderBufferGeometry(1.1, 1.1, 46, 24, 1, true), metal);
        tube.rotation.z = Math.PI/2; stage.add(tube);
        for(let i=-10;i<=10;i++){
          const ring = new THREE.Mesh(new THREE.TorusBufferGeometry(1.5, 0.16, 8, 28), metal);
          ring.rotation.y = Math.PI/2; ring.position.x = i*2.2; stage.add(ring);
        }
        FX.flow({ stage, count:1200, speed:0.55, size:2.0, width:0.5, widthEnd:0.2,
          points:[V3(-24,0,0), V3(-8,0,0), V3(8,0,0), V3(22,0,0)], colorA:'#8fd4ff', colorB:'#ffffff', intensity:2.0 });
      }
      const target = new THREE.Mesh(new THREE.CylinderBufferGeometry(3.2, 3.2, 0.2, 40), Specimen.metalMat({ f0:[0.8,0.72,0.5], rough:0.35 }, {}));
      target.rotation.z = Math.PI/2; target.position.x = isCyc ? 12 : 24; stage.add(target);
      ctx.stage.label('<b>target</b><span>a thin foil of heavy atoms</span>', V3(isCyc?12:24, 4, 0), { cls:'shell-label' });
      FX.cam.drift(V3(isCyc?6:0,0,0), 40, 12, 0.05);
      await ctx.wait(3400);
      ctx.cap('TRILLIONS OF IONS PER SECOND.', 'Almost all of them miss. Once in a while, two nuclei actually merge.');
      await ctx.wait(3000);
      FX.flash(0.6, '#cfe4ff', 2.4);
      FX.burst(stage, { position:V3(isCyc?12:24, 0, 0), count:600, color:'#cfe4ff', color2:'#ffd9a0', speed:40, size:1.8, life:1.6, intensity:1.6 });
      await ctx.wait(1200);
    }

    await U.micro(ctx, { l1:'ONE NUCLEUS AT A TIME', l2:p.where, tint:'#3a4a6a' });
    await ctx.nuclear(p.steps);
    if(p.iso.half){
      ctx.say(`Then it falls apart: ${p.iso.label} lasts about ${p.iso.half}.`, { cls:'small', top:'60%', ms:3400 });
      await ctx.wait(2600);
    }
    ctx.say('No star makes this element in any lasting amount. Every atom of it was made by people.', { cls:'small', top:'60%', ms:3400 });
    await ctx.wait(2400);
  };

  // ------------------------------------------------------------------ teaching paths
  Sites.wdAlone = async function(ctx){
    const stage = ctx.newScene('wd');
    FX.cam.set(V3(0, 3, 26), V3(0,0,0));
    FX.star({ stage, radius:1.2, temp:20000, granulation:22, brightness:2.2, glowScale:8, glow:0.7 });
    ctx.cap('A WHITE DWARF, ALONE.', 'A dead star the size of Earth, slowly cooling. No fusion at all.');
    FX.cam.drift(V3(0,0,0), 26, 5, 0.08);
    await ctx.wait(3400);
    await U.verdict(ctx, { word:'NOTHING NEW', cls:'no',
      sub:'On its own a white dwarf just cools for billions of years. Give it a companion to steal gas from, and it becomes one of the most violent events in the universe.',
      next:'Try pairing it with a Sun-like star.' });
  };

  Sites.gasAlone = async function(ctx){
    const stage = ctx.newScene('gas');
    FX.cam.set(V3(0, 8, 90), V3(0,0,0));
    FX.pointCloud({ stage, count:7000, opacity:0.6, twinkle:0.08, spin:0.02,
      gen:()=>{ const r = 100*Math.pow(Math.random(),0.5), th=Math.random()*6.283, ph=Math.acos(Math.random()*2-1);
        return { p:[r*Math.sin(ph)*Math.cos(th), r*Math.sin(ph)*Math.sin(th)*0.6, r*Math.cos(ph)],
          c: FX.lin('#8f6fff').multiplyScalar(0.3+Math.random()*0.5), s:3.4 }; }});
    ctx.cap('COLD GAS AND DUST.', 'A few atoms per cubic centimetre, at 10 degrees above absolute zero.');
    await ctx.wait(3400);
    await U.verdict(ctx, { word:'NOTHING NEW', cls:'no',
      sub:'Interstellar gas is where new elements end up, not where they are made. It needs an energy source — a star, an explosion, or cosmic rays crashing into it.',
      next:'Try adding cosmic rays.' });
  };

  Sites.raysAlone = async function(ctx){
    const stage = ctx.newScene('rays');
    FX.cam.set(V3(0, 0, 60), V3(0,0,0));
    let acc = 0;
    stage.onFrame(dt=>{ acc += dt; if(acc > 0.18){ acc = 0;
      const a = Math.random()*6.283;
      FX.streak({ stage, from: V3(Math.cos(a)*70, Math.sin(a)*70, -40), to: V3(-Math.cos(a)*70, -Math.sin(a)*70, 40),
        color:'#bfe8ff', size:2.0, intensity:2.0, ms:900, segments:12, fadeMs:220 });
    }});
    ctx.cap('COSMIC RAYS, RACING THROUGH EMPTY SPACE.', 'Nothing to hit.');
    await ctx.wait(3600);
    await U.verdict(ctx, { word:'NOTHING TO HIT', cls:'no',
      sub:'A cosmic ray only makes new elements when it slams into something. Put a cloud of interstellar gas in its way.',
      next:'Try cosmic rays + interstellar gas.' });
  };

  Sites.magnetar = async function(ctx){
    const stage = ctx.newScene('magnetar');
    FX.cam.set(V3(0, 6, 30), V3(0,0,0));
    const ns = FX.star({ stage, radius:1.0, temp:60000, granulation:26, brightness:2.6, glowScale:10, glow:0.7 });
    // twisted field lines
    for(let i=0;i<14;i++){
      const a = i/14*Math.PI*2;
      const pts = [];
      for(let k=0;k<=24;k++){
        const t = k/24, th = Math.PI*t;
        const r = 1.0 + 7.5*Math.sin(th);
        pts.push(new THREE.Vector3(Math.cos(a + t*1.4)*r*0.6, Math.cos(th)*8.5, Math.sin(a + t*1.4)*r*0.6));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color:FX.lin('#ff7ad0').multiplyScalar(1.4), transparent:true, opacity:0.5 }));
      stage.add(line);
    }
    ctx.cap('A MAGNETAR.', 'A neutron star with the strongest magnetic field known — a thousand trillion times Earth\'s.');
    FX.cam.drift(V3(0,0,0), 30, 7, 0.07);
    ctx.hud(`<div class="hud-row"><span>Status</span><b>Active area of research</b></div>`);
    await ctx.wait(3200);
    ctx.cap('A GIANT FLARE.', 'The crust cracks, the field snaps, and a burst of energy erupts.');
    FX.flash(1.2, '#ffd0ea', 1.8);
    FX.burst(stage, { position:V3(0,0,0), count:1600, color:'#ff9ad4', color2:'#ffe6f4', speed:110, size:2.2, life:2.4, intensity:1.5 });
    FX.cam.shake(1.8, 800);
    await ctx.wait(3000);
    await U.verdict(ctx, { word:'MAYBE — A LITTLE', cls:'no',
      sub:'In 2025, researchers reported signs of freshly made heavy elements in the glow of a 2004 magnetar giant flare. Flares like it may account for a few per cent of the galaxy\'s heavy elements — but neutron-star mergers remain the confirmed site.',
      next:'Try merging two neutron stars.' });
  };

  Sites.recycle = async function(ctx){
    const stage = ctx.newScene('recycle');
    FX.cam.set(V3(0, 10, 100), V3(0,0,0));
    FX.pointCloud({ stage, count:8000, opacity:0.7, twinkle:0.1, spin:0.03,
      gen:()=>{ const r = 90*Math.pow(Math.random(),0.5), th=Math.random()*6.283, ph=Math.acos(Math.random()*2-1);
        return { p:[r*Math.sin(ph)*Math.cos(th), r*Math.sin(ph)*Math.sin(th)*0.6, r*Math.cos(ph)],
          c: FX.lin(Math.random()<0.5 ? '#ffcf8f' : '#8f9fff').multiplyScalar(0.35+Math.random()*0.6), s:3.2 }; }});
    FX.burst(stage, { position:V3(0,0,0), count:1400, color:'#ffcf8f', speed:60, size:2.4, life:3.0, radius:20, intensity:1.2 });
    ctx.cap('ENRICHED DEBRIS MEETS THE INTERSTELLAR MEDIUM.', 'The ashes of dead stars mix into the gas that will build the next ones.');
    await ctx.wait(3600);
    await U.verdict(ctx, { word:'RECYCLED, NOT CREATED', cls:'no',
      sub:'This step does not forge anything new — it spreads what earlier stars already made, so that new stars and planets (and people) can inherit it.',
      next:'Make something first, then recycle it.' });
  };

  Sites.nsSingle = async function(ctx){
    const stage = ctx.newScene('ns');
    FX.cam.set(V3(0, 4, 24), V3(0,0,0));
    FX.star({ stage, radius:0.9, temp:100000, granulation:30, brightness:3.0, glowScale:12, glow:0.8 });
    ctx.cap('ONE NEUTRON STAR.', 'A sun squeezed into a city. Its matter is locked away by its own gravity.');
    FX.cam.drift(V3(0,0,0), 24, 5, 0.09);
    await ctx.wait(3400);
    await U.verdict(ctx, { word:'NOTHING ESCAPES', cls:'no',
      sub:'A lone neutron star keeps everything it has. To get that neutron-rich matter out into space, something has to tear it apart — like a second neutron star.',
      next:'Try two neutron stars together.' });
  };

  Sites.mismatch = async function(ctx){
    const stage = ctx.newScene('mismatch');
    FX.cam.set(V3(0, 6, 70), V3(0,0,0));
    U.idleObjects(ctx, ctx.objects || []);
    ctx.cap((ctx.label||'THIS PAIRING').toUpperCase(), 'Let\'s see what actually happens.');
    FX.cam.drift(V3(0,0,0), 70, 8, 0.05);
    await ctx.wait(3600);
    await U.verdict(ctx, { word:'NO REACTION', cls:'no',
      sub:'These two do not interact in a way that builds new nuclei. Nucleosynthesis needs specific conditions: enormous temperature, enormous density, or a flood of neutrons.',
      next:'Press “Need a hint”, or click any dark cell on the Discovery Map.' });
  };
})();
