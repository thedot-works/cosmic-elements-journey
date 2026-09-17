// ==========================================================================
// EXPERIMENTS — single-object / non-merger visualizations run full-screen
// inside #experiment-root. Every path teaches something, even the failures.
// ==========================================================================
(function(){
  const sleep = ms => new Promise(r=>setTimeout(r, ms));

  const ExpUI = {
    open(){
      Cosmos.stopAutoOrbit();
      document.getElementById('lab-root').classList.add('dimmed');
      document.getElementById('experiment-root').classList.add('active');
      document.getElementById('exp-body').innerHTML = '';
      document.getElementById('exp-caption-1').textContent = '';
      document.getElementById('exp-caption-2').textContent = '';
    },
    caption(l1, l2=''){
      document.getElementById('exp-caption-1').textContent = l1;
      document.getElementById('exp-caption-2').textContent = l2;
    },
    body(){ return document.getElementById('exp-body'); },
    async verdict({word, cls, sub, next}){
      const box = document.createElement('div');
      box.className = 'exp-verdict';
      box.innerHTML = `<div class="verdict-word ${cls}">${word}</div><div class="verdict-sub">${sub}</div><div class="verdict-next">${next||''}</div>`;
      ExpUI.body().appendChild(box);
      await sleep(60);
      return waitContinue();
    },
    close(){
      document.getElementById('experiment-root').classList.remove('active');
      document.getElementById('lab-root').classList.remove('dimmed');
      Lab.resetSlotsAfterExperiment();
      Cosmos.autoOrbitCamera(420, 30, 0.00028);
    }
  };

  function waitContinue(label='Return to the Forge'){
    return new Promise(resolve=>{
      const btn = document.createElement('div');
      btn.className = 'exp-continue';
      btn.textContent = label;
      ExpUI.body().appendChild(btn);
      btn.addEventListener('click', ()=>{ btn.remove(); resolve(); }, {once:true});
    });
  }

  function starGlow(color, size){
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:${size}px; height:${size}px; border-radius:50%; background:radial-gradient(circle at 38% 35%, #fff, ${color} 45%, transparent 78%); box-shadow:0 0 90px ${color};`;
    ExpUI.body().appendChild(wrap);
    return wrap;
  }

  function onionView(shells){
    const wrap = document.createElement('div');
    wrap.id = 'onion-view';
    ExpUI.body().appendChild(wrap);
    shells.forEach((s,i)=>{
      const d = document.createElement('div');
      d.className = 'shell';
      const scale = 1 - i*0.14;
      d.style.width = (scale*100)+'%'; d.style.height = (scale*100)+'%';
      d.style.left = ((1-scale)/2*100)+'%'; d.style.top = ((1-scale)/2*100)+'%';
      d.innerHTML = `<div class="shell-label">${s}</div>`;
      wrap.appendChild(d);
    });
    return wrap;
  }
  async function lightShells(wrap, count, delay){
    const shells = [...wrap.children];
    for(let i=0;i<count && i<shells.length;i++){
      shells[i].classList.add('on');
      Ambient.tick();
      await sleep(delay);
    }
  }

  // ---------------- EARLY UNIVERSE ----------------
  async function runEarlyUniverse(target){
    ExpUI.open();
    ExpUI.caption('BIG BANG NUCLEOSYNTHESIS', 'The first three minutes.');
    const glow = starGlow('#7fa8ff', 220);
    Cosmos.spawnBurst({count:180, color:0x9fc0ff, spread:6, speed:50, life:2});
    await sleep(1400);
    ExpUI.caption('BIG BANG NUCLEOSYNTHESIS', 'Mostly Hydrogen and Helium, with a trace of Lithium.');
    PTable.discoverMany([1,2,3]);
    await sleep(1400);
    await ExpUI.verdict({
      word: target.z<=3 ? (target.z===3?'PARTLY':'YES') : 'NOT YET',
      cls: target.z<=2 ? 'yes' : 'no',
      sub: target.z<=2
        ? `${target.name} is exactly what the early universe produced in abundance.`
        : `The Big Bang produced almost nothing beyond Hydrogen, Helium and a little Lithium. ${target.name} comes later, from stars.`,
      next: 'Try a star next.'
    });
    ExpUI.close();
  }

  // ---------------- MAIN-SEQUENCE STAR ----------------
  async function runMainSequence(target){
    ExpUI.open();
    ExpUI.caption('ORDINARY STELLAR FUSION', 'Hydrogen nuclei combine under gravity and heat.');
    const wrap = onionView(['Hydrogen envelope', 'Helium core']);
    starGlow('#ffd27a', 200);
    await sleep(600);
    await lightShells(wrap, 1, 900);
    ExpUI.caption('H → He', 'Four hydrogen nuclei fuse into one helium nucleus, releasing energy.');
    await sleep(1600);
    await lightShells(wrap, 2, 900);
    PTable.discover(2);
    await sleep(1200);

    const success = target.z<=2;
    await ExpUI.verdict({
      word: success ? 'YES' : 'NO',
      cls: success ? 'yes':'no',
      sub: success
        ? `An ordinary Sun-like star fuses Hydrogen into Helium for most of its life — exactly what you asked for.`
        : `A Main-Sequence star mainly builds Helium from Hydrogen. ${target.name} needs a more massive star, or something far more extreme.`,
      next: success ? '' : 'Try a Massive Star.'
    });
    ExpUI.close();
  }

  // ---------------- MASSIVE STAR (+ supernova) ----------------
  async function runMassiveStar(target, isRedSupergiant){
    ExpUI.open();
    ExpUI.caption(isRedSupergiant ? 'A RED SUPERGIANT IGNITES ADVANCED FUSION' : 'A MASSIVE STAR IGNITES ADVANCED FUSION',
      'Layer by layer, heavier nuclei form in its core.');
    const shellsLabels = ['Hydrogen shell','Helium shell','Carbon shell','Oxygen shell','Neon / Magnesium shell','Silicon shell','Iron-group core'];
    const wrap = onionView(shellsLabels.slice().reverse());
    starGlow('#a9c4ff', 220);
    await sleep(700);

    const stages = [
      { n:1, els:[2], label:'He forms as H fuses' },
      { n:2, els:[6], label:'C forms as He fuses' },
      { n:3, els:[8], label:'O forms from Carbon burning' },
      { n:4, els:[10,12], label:'Ne, Mg from Neon burning' },
      { n:5, els:[14,16], label:'Si, S from Oxygen burning' },
      { n:6, els:[18,20,22,24], label:'Ar, Ca, Ti, Cr from Silicon burning' },
      { n:7, els:[26,27,28], label:'Fe, Co, Ni — the iron-group core' },
    ];
    for(const st of stages){
      await lightShells(wrap, st.n, 1);
      ExpUI.caption('ADVANCED FUSION', st.label);
      PTable.discoverMany(st.els);
      await sleep(950);
    }

    await sleep(500);
    ExpUI.caption('STELLAR FUSION HAS REACHED ITS ENERGY LIMIT.', 'Fusing beyond the iron-group region no longer releases energy.');
    await sleep(2200);

    // Core collapse → supernova (explosive nucleosynthesis + dispersal)
    ExpUI.caption('CORE COLLAPSE.', 'The core implodes — and rebounds as a supernova.');
    await sleep(1400);
    wrap.style.transition = 'transform .6s ease, opacity .6s ease';
    wrap.style.transform = 'scale(0.5)'; wrap.style.opacity = '0.3';
    Ambient.impact();
    Cosmos.spawnBurst({count:420, color:0xffcf8f, spread:8, speed:170, size:3.2, life:2.6});
    await sleep(300);
    ExpUI.caption('SUPERNOVA', 'The outer layers are blasted into space, seeding the galaxy with new elements.');
    const extra = [30,34,36]; // Zn, Se, Kr — explosive nucleosynthesis / rapid dispersal, modest reach
    PTable.discoverMany(extra);
    await sleep(2000);

    const reachedZ = 36;
    const success = target.z<=reachedZ && target.z>=6;
    await ExpUI.verdict({
      word: success ? 'YES' : 'NO',
      cls: success ? 'yes' : 'no',
      sub: success
        ? `Massive-star fusion and its supernova built ${target.name} and scattered it into space.`
        : `Massive stars and their supernovae build many elements up through the iron-group region and a bit beyond — but ${target.name} is far heavier. This is not a confirmed pathway to it; the relative contribution of supernovae to the very heaviest elements is still being studied.`,
      next: success ? '' : 'Try something more extreme.'
    });
    ExpUI.close();
  }

  // ---------------- WHITE DWARF ----------------
  async function runWhiteDwarf(target){
    ExpUI.open();
    ExpUI.caption('A WHITE DWARF SITS QUIETLY.', 'A compact stellar remnant — no fusion is occurring.');
    starGlow('#dfe8ff', 140);
    await sleep(1800);
    await ExpUI.verdict({
      word:'NO', cls:'no',
      sub:`On its own, a white dwarf no longer fuses anything new. ${target.name} isn't created here. (Under special circumstances a white dwarf merger can trigger its own kind of explosion — but that's a different experiment.)`,
      next:'Try something more extreme.'
    });
    ExpUI.close();
  }

  // ---------------- MAGNETAR ----------------
  async function runMagnetar(target){
    ExpUI.open();
    ExpUI.caption('A MAGNETAR SPINS, WRAPPED IN AN IMMENSE MAGNETIC FIELD.', 'ACTIVE AREA OF RESEARCH');
    const glow = starGlow('#ffc0e0', 150);
    glow.style.animation = 'cellPulse 2.2s ease infinite';
    Cosmos.spawnBurst({count:140, color:0xff8fc0, spread:10, speed:60, life:2});
    await sleep(2200);
    ExpUI.caption('MAGNETAR GIANT FLARES', 'Some researchers investigate magnetar flares as a possible, minor contributor to rapid neutron capture.');
    await sleep(2200);
    await ExpUI.verdict({
      word:'INCONCLUSIVE', cls:'no',
      sub:`This is genuinely active research — not yet a confirmed pathway to ${target.name}. Neutron-star mergers remain the confirmed site of large-scale rapid neutron capture.`,
      next:'Try merging two neutron stars.'
    });
    ExpUI.close();
  }

  // ---------------- GAS ALONE ----------------
  async function runGasAlone(target){
    ExpUI.open();
    ExpUI.caption('DIFFUSE INTERSTELLAR GAS AND DUST.', 'Cold, quiet, and not doing very much on its own.');
    const cloud = Cosmos.createCloud(1200, 90, 0x8f6fff);
    await sleep(2200);
    await ExpUI.verdict({
      word:'NOTHING NEW', cls:'no',
      sub:`Interstellar gas needs an energy source or enrichment from a dying star to build or deliver new elements. Try combining it with stellar debris.`,
      next:''
    });
    Cosmos.scene.remove(cloud.pts);
    ExpUI.close();
  }

  // ---------------- GAS + STELLAR DEBRIS (recycling) ----------------
  async function runGasRecycle(target){
    ExpUI.open();
    ExpUI.caption('ENRICHED MATERIAL MEETS THE INTERSTELLAR MEDIUM.', 'Elements forged in earlier stars mix into the surrounding cloud.');
    const cloud = Cosmos.createCloud(1600, 110, 0xffcf8f);
    Cosmos.spawnBurst({count:200, color:0xffcf8f, spread:30, speed:40, life:2.4});
    await sleep(2200);
    ExpUI.caption('RECYCLING', 'This cloud now carries the elements of a previous generation of stars — raw material for the next.');
    await sleep(2000);
    await ExpUI.verdict({
      word:'RECYCLED, NOT CREATED', cls:'no',
      sub:`This step doesn't forge ${target.name} directly — it spreads elements already made elsewhere, so future stars and planets can inherit them.`,
      next:'Try creating something new first, then recycle it.'
    });
    Cosmos.scene.remove(cloud.pts);
    ExpUI.close();
  }

  // ---------------- GENERIC WRONG COMBINATION ----------------
  async function runGenericWrong(target, comboLabel){
    ExpUI.open();
    ExpUI.caption(comboLabel.toUpperCase(), 'Let\'s see what actually happens.');
    starGlow('#8fa0c8', 170);
    Cosmos.spawnBurst({count:150, color:0xaac4ff, spread:20, speed:60, life:2});
    await sleep(1800);
    ExpUI.caption('YOU CREATED SOMETHING —', `BUT NOT ${target.name.toUpperCase()}.`);
    await sleep(1800);
    await ExpUI.verdict({
      word:'WHY?', cls:'no',
      sub:`Not every combination of cosmic objects produces useful nucleosynthesis. Some pairings just don't interact in a way that builds new elements — try objects and events with a real physical relationship instead.`,
      next:'Press Need a Hint for a nudge.'
    });
    ExpUI.close();
  }

  window.Experiments = {
    runEarlyUniverse, runMainSequence, runMassiveStar, runWhiteDwarf,
    runMagnetar, runGasAlone, runGasRecycle, runGenericWrong,
  };
  window.ExpUI = ExpUI;
})();
