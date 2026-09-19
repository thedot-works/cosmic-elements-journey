// ==========================================================================
// GOLD JOURNEY — the closing act, and the only place the app is about gold.
//
// Three beats, deliberately quick: the gold loose in the universe, the Sun
// and the Milky Way it ended up in, and the Earth it was delivered to. It
// finishes on Earth and stays there — that is the answer to the question the
// title asks, so it is the last thing you should be looking at.
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
      // honour the global pacing scale, the same way Theater's ctx.wait does,
      // so ?fast= and the demo tour compress this act along with the rest
      const total = ms * (FX.timeScale || 1);
      let elapsed = 0; const STEP = 80;
      const tick = ()=>{
        if(Theater.skip || elapsed >= total){ resolve(); return; }
        const next = Math.min(STEP, total - elapsed);
        elapsed += next;
        stage.timeout(tick, next);
      };
      tick();
    });
    // Skip here means "I don't want to watch this". Each beat builds a full
    // 3-D scene, which takes real time no matter how short the waits between
    // them are, so a Skip jumps straight out rather than racing through the
    // scenes anyway — checked before each new scene is built.
    const bail = ()=>{ if(Theater.skip) throw SKIP; };
    const cap = (a,b)=> ExpUI.caption(a,b);
    const body = ()=> $('exp-body');
    const say = (html, opts={})=>{
      const d = el('div','cine-text ' + (opts.cls||'mid') + ' show', html);
      if(opts.top) d.style.top = opts.top;
      stage.dom(d, body());
      if(opts.hold !== false) stage.timeout(()=>{ d.classList.remove('show'); stage.timeout(()=> d.remove(), 900); }, opts.ms||2600);
      return d;
    };
    const readout = html=>{ let r = $('exp-hud').querySelector('.readout'); if(!r){ r = el('div','readout'); $('exp-hud').appendChild(r); } r.innerHTML = html; return r; };

    Cosmos.fadeStars(0.55, 900); Cosmos.fadeNebula(0.18, 900);
    FX.post.bloomStrength = 0.95; FX.post.vignette = 0.4;
    $('exp-side').innerHTML = '';

    try {

    // ---------------- 1. the gold, loose in the universe
    cap('YOUR GOLD, LOOSE IN THE UNIVERSE.', 'Thrown clear of the collision at a tenth of the speed of light.');
    FX.cam.set(V3(0, 26, 190), V3(0,0,0));
    const debris = FX.nebula({ stage, radius:70, count:7000, inner:'#ffe0a8', outer:'#c0483a', clumpy:true, brightness:1.3, size:3.0, spin:0.03 });
    FX.cam.drift(V3(0,0,0), 190, 24, 0.035);
    const t = readout('<b>100 years</b><span>after the merger</span>');
    for(const time of ['100 years', '100,000 years', '10 million years']){
      if(Theater.skip) break;
      t.innerHTML = `<b>${time}</b><span>after the merger</span>`;
      FX.animate(700, k=>{ debris.u.uExpand.value = 1 + k*0.5; });
      await wait(700);
    }
    cap('IT THINS OUT AND MIXES IN.', 'Your gold is now loose atoms drifting in the gas between the stars.');
    await wait(1400);

    // ---------------- 2. the Milky Way, and the Sun that formed in it
    bail();
    const st2 = FX.stage('galaxy'); stage.children.push(st2);
    FX.animate(1200, k=>{ debris.u.uOpacity.value = 0.95*(1-k); });
    FX.galaxy({ stage: st2, radius: 440, count: 13000, arms: 2, spin: 0.018 });
    Cosmos.fadeStars(0.8, 1200);
    cap('THE MILKY WAY.', 'One galaxy, a hundred billion stars, and your gold somewhere in the mix.');
    await FX.cam.to(V3(0, 150, 560), V3(0,0,0), 1800);
    readout('<b>~4.6 billion years ago</b><span>a cloud in one spiral arm collapses</span>');
    await wait(1200);

    bail();
    const st3 = FX.stage('sun'); stage.children.push(st3);
    cap('THEN, IN ONE ARM OF IT, A NEW STAR.', 'The Sun — built out of gas that already had the gold in it.');
    FX.flash(0.85, '#ffe9c0', 1.8);
    Ambient.impact();
    const sun = FX.star({ stage: st3, radius:7, temp:5772, granulation:8, brightness:1.35, spots:0.3, glowScale:3.6 });
    const disk = FX.disk({ stage: st3, inner:12, outer:95, count:7000, spin:1.6, tIn:5200, tOut:900, thickness:0.05, size:2.4, brightness:1.1 });
    FX.cam.set(V3(0, 60, 240), V3(0,0,0));
    await FX.cam.to(V3(0, 38, 150), V3(0,0,0), 1700);
    cap('AND A DISK OF DEBRIS AROUND IT.', 'Grains stick together. Pebbles become boulders. Boulders become planets.');
    await wait(1700);

    // ---------------- 3. Earth — where the gold arrived, and where we stop
    bail();
    const st4 = FX.stage('earth'); stage.children.push(st4);
    FX.animate(1300, k=>{ disk.u.uOpacity.value = 1-k; });
    const earth = FX.earth({ stage: st4, radius:14, molten:1 });
    FX.cam.set(V3(0, 8, 92), V3(0,0,0));
    await FX.cam.to(V3(0, 6, 46), V3(0,0,0), 1600);
    cap('EARTH.', 'Your gold is now part of a planet — molten, and still being hit.');
    FX.cam.drift(V3(0,0,0), 46, 7, 0.03);
    await wait(1500);

    cap('IT COOLS.', 'Most of Earth\'s gold sinks with the iron into the core. The gold we can reach was delivered later, by impacts, after the core had already closed.');
    await FX.animate(2000, k=>{ earth.u.uMolten.value = 1-k; });
    // the Sun and the disk have done their job; Earth stays
    st3.dispose(); st2.dispose();
    Cosmos.fadeStars(0.45, 1200);
    await wait(900);

    bail();
    $('exp-hud').innerHTML = '';
    const compare = el('div','age-compare');
    compare.innerHTML = `
      <div class="age-card"><div class="age-label">Earth</div><div class="age-val">~4.54 billion years</div></div>
      <div class="age-card gold"><div class="age-label">The gold in it</div><div class="age-val">Older than Earth</div>
        <div class="age-tag">Forged before our planet existed</div></div>`;
    compare.style.cssText = 'position:absolute; left:50%; top:85%; transform:translate(-50%,-50%);';
    stage.dom(compare, body());
    requestAnimationFrame(()=> compare.classList.add('show'));
    cap('THIS IS WHERE IT ENDED UP.', 'The gold you can wear was made before the Earth existed, and the Earth inherited it.');
    await wait(2600);

    const big = say('THE GOLD YOU WEAR<br>IS OLDER THAN THE GROUND YOU STAND ON.', { cls:'big gold', top:'15%', hold:false });
    await wait(2600);
    big.classList.remove('show');

    // Hold here. Earth stays on screen with the button over it — the last
    // frame of the piece is the planet the gold was delivered to.
    await Theater.actionButton('Return to the forge', { cls:'ghost' });

    } catch(e){
      if(e !== SKIP) throw e;
    } finally {
      stage.dispose();
    }
  }

  window.GoldJourney = { run };
})();
