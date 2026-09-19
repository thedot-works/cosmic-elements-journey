// ==========================================================================
// STELLAR SITES — the sequences that happen inside and around stars:
// an ordinary Sun-like star, a dying red giant (with its slow neutron
// captures), a massive star and its supernova, an exploding white dwarf, and
// a nova eruption. Each one is steered by the element being forged.
// ==========================================================================
(function(){
  const V3 = (x,y,z)=> new THREE.Vector3(x,y,z);
  const U = window.SiteUtil;
  const Sites = window.Sites = window.Sites || {};

  // ------------------------------------------------------------------ helpers
  function shellLabels(ctx, caps, shells, radius){
    // place a label at the middle of each shell along the cut edge
    const labels = [];
    shells.forEach((s,i)=>{
      const rInner = i===0 ? 0 : shells[i-1].r;
      const r = (rInner + s.r)/2 * radius;
      const L = ctx.stage.label(`<b>${s.label}</b>${s.sub?`<span>${s.sub}</span>`:''}`, V3(r*0.72, 0.6, r*0.72), { cls:'shell-label' });
      labels.push(L);
    });
    return labels;
  }

  async function cutOpen(ctx, star, planes, radius, shells, opts={}){
    ctx.cap(opts.l1 || 'LOOK INSIDE.', opts.l2 || 'Layers of nuclear burning, stacked like an onion.');
    await FX.animate(1400, t=>{ planes[0].constant = FX.lerp(1000, 0, t); planes[1].constant = FX.lerp(1000, 0, t); }, FX.ease.inOut);
    const caps = FX.onionCaps({ stage: ctx.stage, radius, shells, brightness: opts.brightness||1.5 });
    caps.group.scale.setScalar(0.001);
    await FX.animate(700, t=> caps.group.scale.setScalar(t));
    const labels = shellLabels(ctx, caps, shells, radius);
    return { caps, labels };
  }

  // ------------------------------------------------------------------ Sun-like star (helium)
  Sites.sunlike = async function(ctx){
    const stage = ctx.newScene('star');
    Cosmos.fadeStars(0.5, 800); Cosmos.fadeNebula(0.1, 800);
    FX.cam.set(V3(0, 6, 46), V3(0,0,0));
    const R = 12;
    const planes = FX.quarterClip(V3(0,0,0));
    planes.forEach(p=> p.constant = 1000);
    const star = FX.star({ stage, radius:R, temp:5772, granulation:8.5, brightness:1.3, spots:0.35, corona:0.8, glow:0.45, glowScale:3.2, clip:planes });
    ctx.cap('AN ORDINARY STAR, HALFWAY THROUGH ITS LIFE', 'Gravity squeezes; fusion pushes back. The balance holds for billions of years.');
    FX.cam.drift(V3(0,0,0), 46, 7, 0.06);
    ctx.hud(`<div class="hud-row science-only"><span>Core temperature</span><b>15 million °C</b></div>
             <div class="hud-row science-only"><span>Hydrogen fused</span><b>600 million tonnes / second</b></div>
             <div class="hud-row"><span>Star</span><b>Sun-like, 1 solar mass</b></div>`);
    await ctx.wait(2600);

    const { caps } = await cutOpen(ctx, star, planes, R, [
      { r:0.25, color:'#fff3d0', label:'Core', sub:'where fusion happens', intensity:1.6 },
      { r:0.7,  color:'#ffb347', label:'Radiative zone', sub:'light crawls outward' },
      { r:1.0,  color:'#d9641e', label:'Convective zone', sub:'boiling gas' },
    ], { brightness:1.6 });
    caps.activate(0, 1.0);
    await ctx.wait(2400);
    ctx.cap('IN THE CORE, HYDROGEN BECOMES HELIUM.', 'Four nuclei go in; one helium nucleus comes out, and light carries away the difference.');
    await ctx.wait(2600);

    await U.micro(ctx, { l1:'PROTON BY PROTON', l2:'The chain that lights the Sun' });
    await ctx.nuclear(ctx.el.steps);
    ctx.say('Most helium in the universe is older than any star — but stars keep adding to it.', { cls:'small', top:'60%', ms:3600 });
    await ctx.wait(2400);
  };

  // ------------------------------------------------------------------ dying Sun-like star (AGB): C, N, F and the s-process
  Sites.agb = async function(ctx){
    const p = ctx.el;
    const stage = ctx.newScene('agb');
    Cosmos.fadeStars(0.45, 800); Cosmos.fadeNebula(0.12, 800);
    FX.cam.set(V3(0, 10, 92), V3(0,0,0));
    const R = 26;
    const planes = FX.quarterClip(V3(0,0,0));
    planes.forEach(pl=> pl.constant = 1000);
    const star = FX.star({ stage, radius:R, temp:3250, granulation:4.2, brightness:1.02, spots:0.5, contrast:1.15, corona:0.6, glow:0.4, glowScale:3.0, clip:planes });
    // dusty wind streaming away
    FX.pointCloud({ stage, count:5000, opacity:0.55, twinkle:0.08, spin:0.05, spinPow:0.4,
      gen:()=>{ const r = R*(1.1 + Math.random()*2.6); const th = Math.random()*6.283, ph = Math.acos(Math.random()*2-1);
        return { p:[r*Math.sin(ph)*Math.cos(th), r*Math.sin(ph)*Math.sin(th), r*Math.cos(ph)],
          c: FX.lin('#ff9e5a').multiplyScalar(0.2 + Math.random()*0.35), s: 3.0 }; }});
    ctx.cap('THE STAR HAS BURNED THROUGH ITS HYDROGEN.', 'It swells into a red giant, hundreds of times wider than the Sun.');
    FX.cam.drift(V3(0,0,0), 92, 12, 0.05);
    ctx.hud(`<div class="hud-row"><span>Star</span><b>Dying Sun-like star</b></div>
             <div class="hud-row science-only"><span>Radius</span><b>~200 × the Sun</b></div>
             <div class="hud-row science-only"><span>Surface</span><b>~3,000 °C — cool enough for dust</b></div>`);
    // slow pulsation
    stage.onFrame((dt,t)=>{ star.setRadius(R*(1 + 0.03*Math.sin(t*0.35))); });
    await ctx.wait(2800);

    const { caps } = await cutOpen(ctx, star, planes, R, [
      { r:0.10, color:'#eaf2ff', label:'Carbon–oxygen core', sub:'inert, Earth-sized', intensity:1.8 },
      { r:0.17, color:'#ffd27a', label:'Helium shell', sub:'flashes every few thousand years' },
      { r:0.24, color:'#ff9a4a', label:'Hydrogen shell', sub:'burning steadily' },
      { r:1.00, color:'#8f3a20', label:'Convective envelope', sub:'carries new atoms to the surface' },
    ], { l2:'A tiny dead core, two burning shells and an enormous churning envelope.' });
    await ctx.wait(2000);

    // thermal pulse
    ctx.cap('A HELIUM FLASH.', 'Every few thousand years the helium shell ignites and the star convulses.');
    caps.activate(1, 1.4);
    FX.flash(0.4, '#ffd9a0', 2.6);
    FX.burst(stage, { position:V3(0,0,0), count:900, color:'#ffd9a0', color2:'#ff7a3a', speed:22, size:2.2, life:2.6, radius:R*0.2, intensity:1.2 });
    await ctx.wait(2200);

    const isSProcess = p.z >= 29;
    if(isSProcess){
      ctx.cap('SLOW NEUTRON CAPTURE.', 'The helium flash releases neutrons, and iron seeds start collecting them — one every few decades.');
      ctx.hud(null);
      const chart = ctx.chart({ n0: 20, n1: Math.max(140, p.N + 14), z0: 20, z1: Math.max(60, p.z + 8),
        title: 'The s-process path <b>schematic</b>' });
      chart.mark(p.z, p.N, p.sym + '-' + p.iso.A);
      // walk the valley of stability from an iron seed up to the element
      let Z = 26, N = 30;
      chart.seed(Z, N);
      await ctx.wait(900);
      let guard = 0;
      while((Z < p.z || N < p.N) && guard++ < 260){
        if(ctx.skipped()) break;
        const wantBeta = (N - Z) > (p.N - p.z) * (Z / p.z) + 1.5;
        if(wantBeta && Z < p.z){ Z++; N--; chart.step(Z, N, 'beta'); }
        else { N++; chart.step(Z, N, 'capture'); }
        if(guard % 4 === 0) await ctx.wait(ctx.skipped() ? 0 : 70);
      }
      await ctx.wait(1400);
      ctx.say('Neutron by neutron, iron climbs the chart of nuclides — and beta decays nudge it up to the next element.', { cls:'small', top:'60%', ms:3400 });
      await ctx.wait(2600);
      ctx.side(null);
    } else {
      ctx.cap('DEEP IN THE BURNING SHELLS.', p.where);
      await ctx.wait(1800);
    }

    await U.micro(ctx, { l1: isSProcess ? 'THE LAST STEPS' : 'THE REACTION ITSELF', l2: p.where, tint:'#4a2a5f' });
    await ctx.nuclear(p.steps);

    // planetary nebula ending
    const stage2 = ctx.newScene('nebula');
    Cosmos.fadeStars(0.4, 900); Cosmos.fadeNebula(0.15, 900);
    FX.post.bloomStrength = 0.9;
    ctx.cap('THE STAR SHEDS ITS OUTER LAYERS.', `They drift away as a planetary nebula, carrying the new ${p.name.toLowerCase()} into space.`);
    FX.cam.set(V3(0, 18, 150), V3(0,0,0));
    const core = FX.star({ stage: stage2, radius:1.1, temp:40000, granulation:20, brightness:2.6, glowScale:10, glow:0.8 });
    const neb = FX.nebula({ stage: stage2, radius: 60, count: 11000, inner:'#4fe0d2', outer:'#ff4e6a', bipolar:true, clumpy:true, brightness:1.3, size:3.4, spin:0.04 });
    neb.u.uExpand.value = 0.2;
    FX.animate(5200, t=>{ neb.u.uExpand.value = 0.2 + t*1.1; neb.u.uOpacity.value = 0.95 - t*0.25; }, FX.ease.out);
    FX.cam.drift(V3(0,0,0), 150, 22, 0.04);
    await ctx.wait(3800);
    ctx.say('What is left of the star is a white dwarf: a hot, dead ember the size of Earth.', { cls:'small', top:'60%', ms:3200 });
    await ctx.wait(2600);
  };

  // ------------------------------------------------------------------ massive star + core-collapse supernova
  const SHELL_FOR_Z = z=> z<=9 ? 5 : (z<=11 ? 4 : (z<=13 ? 3 : (z<=16 ? 2 : (z<=20 ? 1 : (z<=28 ? 0 : 5)))));

  Sites.massive = async function(ctx){
    const p = ctx.el;
    const stage = ctx.newScene('massive');
    Cosmos.fadeStars(0.5, 800); Cosmos.fadeNebula(0.12, 800);
    FX.cam.set(V3(0, 8, 70), V3(0,0,0));
    let R = 14;
    const planes = FX.quarterClip(V3(0,0,0));
    planes.forEach(pl=> pl.constant = 1000);
    const star = FX.star({ stage, radius:R, temp:26000, granulation:11, brightness:1.6, corona:1.1, glow:0.55, glowScale:3.6, clip:planes });
    ctx.cap('A MASSIVE STAR — TWENTY-FIVE TIMES THE SUN.', 'It burns furiously, and it will not last long.');
    FX.cam.drift(V3(0,0,0), 70, 9, 0.05);
    ctx.hud(`<div class="hud-row"><span>Mass</span><b>~25 solar masses</b></div>
             <div class="hud-row science-only"><span>Surface</span><b>~30,000 °C</b></div>
             <div class="hud-row science-only"><span>Lifetime</span><b>~7 million years</b></div>`);
    await ctx.wait(2600);

    // it swells into a red supergiant
    ctx.cap('IT SWELLS INTO A RED SUPERGIANT.', 'Each new fuel burns hotter and faster than the last.');
    await FX.animate(2600, t=>{ star.setTemp(FX.lerp(26000, 3900, t)); star.setRadius(FX.lerp(14, 30, t)); });
    R = 30;
    await ctx.wait(700);

    const { caps } = await cutOpen(ctx, star, planes, R, [
      { r:0.13, color:'#eaf4ff', label:'Iron core', sub:'fusion ends here', intensity:2.0 },
      { r:0.26, color:'#ffe3a0', label:'Silicon shell', sub:'burns in a day' },
      { r:0.40, color:'#ffb347', label:'Oxygen shell', sub:'burns in six months' },
      { r:0.55, color:'#ff8a3a', label:'Neon shell', sub:'burns in a year' },
      { r:0.72, color:'#d9541e', label:'Carbon shell', sub:'burns for 600 years' },
      { r:0.88, color:'#8f3a18', label:'Helium shell', sub:'burns for 700,000 years' },
      { r:1.00, color:'#5a2410', label:'Hydrogen envelope', sub:'burned for 7 million years' },
    ], { l1:'AN ONION OF NUCLEAR ASH.', l2:'Every layer is the ash of the layer outside it.' });
    await ctx.wait(2600);

    const explosive = p.z >= 21 && p.z <= 28;
    const shellIdx = SHELL_FOR_Z(p.z);
    if(!explosive){
      caps.activate(shellIdx, 1.3);
      ctx.cap(`${p.name.toUpperCase()} FORMS HERE.`, p.where);
      await ctx.wait(2600);
      await U.micro(ctx, { l1:'THE REACTION ITSELF', l2:p.where, tint:'#2a4a7a' });
      await ctx.nuclear(p.steps);
      // then the star dies anyway — that's how the element escapes
      const st2 = ctx.newScene('sn');
      Cosmos.fadeStars(0.35, 600);
      FX.cam.set(V3(0, 12, 120), V3(0,0,0));
      const dying = FX.star({ stage: st2, radius:18, temp:3900, granulation:5, brightness:1.15, spots:0.5, glowScale:3.4 });
      ctx.cap('BUT THE STAR IS OUT OF FUEL.', 'Iron cannot release energy by fusing — and without that push, gravity wins.');
      await ctx.wait(2600);
      await U.supernova(ctx, { star:dying, r0:18 });
      remnant(ctx, st2);
      ctx.say(`The blast scatters the new ${p.name.toLowerCase()} across light-years of space.`, { cls:'small', top:'60%', ms:3200 });
      await ctx.wait(2400);
    } else {
      caps.activate(0, 1.3);
      ctx.cap('THE CORE IS IRON. FUSION HAS NOTHING LEFT TO GIVE.', 'This element is not made during the star\'s life — it is made in the explosion.');
      await ctx.wait(2800);
      const st2 = ctx.newScene('sn');
      FX.cam.set(V3(0, 12, 110), V3(0,0,0));
      const dying = FX.star({ stage: st2, radius:18, temp:3900, granulation:5, brightness:1.15, spots:0.5, glowScale:3.4 });
      await U.supernova(ctx, { star:dying, r0:18 });
      remnant(ctx, st2);
      await ctx.wait(1200);
      await U.micro(ctx, { l1:'INSIDE THE BLAST', l2:p.where, tint:'#5a2a2a' });
      await ctx.nuclear(p.steps);
    }
  };

  function remnant(ctx, stage){
    FX.nebula({ stage, radius: 110, count: 9000, inner:'#7fe0ff', outer:'#ff6a5a', clumpy:true, brightness:1.2, size:3.0, spin:0.02, opacity:0.8 });
    const ns = FX.star({ stage, radius:0.6, temp:120000, granulation:26, brightness:3.2, glowScale:14, glow:0.8 });
    ctx.cap('A SUPERNOVA REMNANT.', 'At its centre: a neutron star, a city-sized ball left over from the core.');
    return ns;
  }

  // ------------------------------------------------------------------ exploding white dwarf (Type Ia)
  Sites.typeIa = async function(ctx){
    const p = ctx.el;
    const stage = ctx.newScene('ia');
    Cosmos.fadeStars(0.45, 800); Cosmos.fadeNebula(0.1, 800);
    FX.cam.set(V3(6, 12, 62), V3(12,0,0));
    const B = U.binary(ctx, { wdRadius:0.7, wdTemp:24000, compRadius:7.5, compTemp:4300, sep:34 });
    ctx.cap('A WHITE DWARF, FEEDING.', 'A dead star the size of Earth pulls gas off its living companion.');
    FX.cam.drift(V3(14,0,0), 62, 14, 0.05);
    ctx.hud(`<div class="hud-row"><span>White dwarf mass</span><b id="wd-mass">1.02 M☉</b></div>
             <div class="hud-row science-only"><span>Limit</span><b>1.4 M☉ — the Chandrasekhar limit</b></div>
             <div class="hud-row science-only"><span>Size</span><b>Earth-sized, denser than anything on Earth</b></div>`);
    await ctx.wait(3000);

    ctx.cap('THE STOLEN GAS PILES ON.', 'As the white dwarf approaches 1.4 times the Sun\'s mass, its core cannot hold.');
    const mass = document.getElementById('wd-mass');
    await FX.animate(4200, t=>{ if(mass) mass.textContent = (1.02 + 0.38*t).toFixed(2) + ' M☉'; B.wd.setBright(2.2 + t*1.6); }, FX.ease.in);
    await ctx.wait(500);

    ctx.cap('CARBON IGNITES AT THE CENTRE.', 'A thermonuclear flame crosses the star in about a second.');
    await FX.cam.to(V3(0, 4, 16), V3(0,0,0), 1600);
    FX.flash(0.7, '#fff0c0', 2.2);
    const flame = FX.shockShell({ stage, radius:0.6, amp:0.4, color:'#ffe9c0', color2:'#ff7a2a', intensity:3.0, freq:3.6 });
    await FX.animate(1400, t=>{ flame.mesh.scale.setScalar(0.6 + t*1.6); });
    FX.flash(1.3, '#fff6e0', 1.8);
    Ambient.impact();
    FX.cam.shake(3.0, 1100);
    ctx.cap('NOTHING IS LEFT BEHIND.', 'The whole white dwarf is blown apart — and about half of it is freshly made iron-group metal.');
    FX.animate(4000, t=>{ flame.mesh.scale.setScalar(2.2 + 90*t); flame.u.uOpacity.value = 1 - t*0.95; }, FX.ease.out);
    FX.burst(stage, { position:V3(0,0,0), count:3200, color:'#ffe0a8', color2:'#ff5f2a', speed:170, size:2.6, life:3.4, drag:0.3, intensity:1.5, grow:1.1 });
    B.wd.group.visible = false;
    await ctx.wait(2800);

    await U.micro(ctx, { l1:'NICKEL, THEN COBALT, THEN IRON', l2:p.where, tint:'#5a3a22' });
    await ctx.nuclear(p.steps);

    if(p.z === 26 || p.z === 25){
      const lc = Charts.lightCurve({ caption:'Its glow is powered by radioactive decay <b>schematic</b>' });
      ctx.side(lc.el);
      await lc.to(110);
      ctx.say('The light we see from these explosions is literally radioactive nickel and cobalt decaying into iron.', { cls:'small', top:'60%', ms:3600 });
      await ctx.wait(2800);
      ctx.side(null);
    }
    ctx.say('Type Ia explosions are so consistent that astronomers use them as measuring sticks for the universe.', { cls:'small', top:'60%', ms:3400 });
    await ctx.wait(2200);
  };

  // ------------------------------------------------------------------ nova eruption (lithium)
  Sites.nova = async function(ctx){
    const p = ctx.el;
    const stage = ctx.newScene('nova');
    Cosmos.fadeStars(0.5, 800); Cosmos.fadeNebula(0.12, 800);
    FX.cam.set(V3(4, 10, 56), V3(10,0,0));
    const B = U.binary(ctx, { wdRadius:0.7, wdTemp:22000, compRadius:6.5, compTemp:4800, sep:30 });
    ctx.cap('A WHITE DWARF WITH A HUNGRY SURFACE.', 'Hydrogen from its companion settles onto a star already dead.');
    FX.cam.drift(V3(12,0,0), 56, 12, 0.05);
    ctx.hud(`<div class="hud-row"><span>Event</span><b>Classical nova</b></div>
             <div class="hud-row science-only"><span>Recurrence</span><b>Thousands of years</b></div>
             <div class="hud-row science-only"><span>Brightening</span><b>Tens of thousands of times</b></div>`);
    await ctx.wait(3000);

    ctx.cap('THE STOLEN LAYER IGNITES.', 'Not the star itself — just the shell of gas on its surface.');
    await FX.cam.to(V3(0, 3, 12), V3(0,0,0), 1500);
    FX.flash(1.1, '#fff2d0', 2.0);
    Ambient.impact();
    const shell = FX.shockShell({ stage, radius:1.0, amp:0.3, color:'#fff0cf', color2:'#ff9a4a', intensity:2.8 });
    FX.animate(3600, t=>{ shell.mesh.scale.setScalar(1 + 40*t); shell.u.uOpacity.value = 1 - t*0.9; }, FX.ease.out);
    FX.burst(stage, { position:V3(0,0,0), count:1800, color:'#ffe9c0', color2:'#ff8a4a', speed:90, size:2.2, life:3.0, drag:0.4, intensity:1.3 });
    FX.cam.shake(1.6, 700);
    await ctx.wait(2600);
    ctx.cap('THE WHITE DWARF SURVIVES.', 'It will do this again — and again.');
    await ctx.wait(2200);

    await U.micro(ctx, { l1:'IN THE BLAST, BERYLLIUM-7 FORMS', l2:'…and 53 days later it becomes lithium', tint:'#3a4a7a' });
    await ctx.nuclear(p.steps);
    ctx.say('Astronomers have caught beryllium-7 in nova debris — evidence that these eruptions make much of the universe\'s lithium.',
      { cls:'small', top:'60%', ms:4000 });
    await ctx.wait(3000);
  };
})();
