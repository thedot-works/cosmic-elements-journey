// ==========================================================================
// MERGER — the visual centerpiece. Neutron-star inspiral → kilonova →
// ejecta inspection → the great scale zoom → r-process mini-simulation →
// heavy-element reveal. This is where Gold (or Silver / Uranium) is made.
// ==========================================================================
(function(){
  const sleep = ms => new Promise(r=>setTimeout(r, ms));
  const body = () => ExpUI.body();

  function el(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }

  function choiceRow(options){
    return new Promise(resolve=>{
      const row = el('div','choice-row');
      options.forEach(o=>{
        const b = el('div','choice-btn'+(o.recommended?' recommended':''), o.label);
        b.addEventListener('click', ()=>{ row.remove(); resolve(o.id); }, {once:true});
        row.appendChild(b);
      });
      body().appendChild(row);
    });
  }

  async function run(target){
    ExpUI.open();
    Ambient.unlock();
    ExpUI.caption('TWO NEUTRON STARS DETECTED.', 'More mass than the Sun compressed into a sphere roughly the size of a city.');

    const stats = el('div','stat-row science-only',
      `<div><b>Star A</b>~1.4 solar masses</div><div><b>Star B</b>~1.3 solar masses</div><div><b>Diameter</b>~20–25 km each</div>`);
    stats.style.position='absolute'; stats.style.left='50%'; stats.style.top='30%'; stats.style.transform='translateX(-50%)';
    body().appendChild(stats);

    const dist = el('div','dist-indicator science-only', '300 km');
    body().appendChild(dist);

    const pair = Cosmos.createOrbitingPair(0xcfe3ff, 0xa9c4ff);
    const grid = Cosmos.createSpacetimeGrid();
    await Cosmos.lerpCameraTo(new THREE.Vector3(140,60,260), new THREE.Vector3(0,0,0), 1800);
    await sleep(900);

    const gwLabel = el('div','cine-text mid show', 'GRAVITATIONAL WAVES');
    gwLabel.style.position='absolute'; gwLabel.style.top='42%';
    body().appendChild(gwLabel);

    const distances = [300,200,100,50,20];
    for(let i=0;i<distances.length;i++){
      dist.textContent = distances[i] + ' km';
      pair.speed += 0.006;
      pair.radius *= 0.72;
      grid.amp = Math.min(22, grid.amp+3.5);
      grid.freq += 0.6;
      Ambient.tick();
      await sleep(700);
    }
    ExpUI.caption('THE ORBIT TIGHTENS.', 'Orbital velocity rises. Tidal forces stretch both stars.');
    await sleep(1200);

    // Collision flash
    document.getElementById('fade-veil').style.transition = 'opacity 0.12s ease';
    document.getElementById('fade-veil').classList.add('on');
    Ambient.impact();
    await sleep(140);
    document.getElementById('fade-veil').classList.remove('on');

    Cosmos.removeOrbitingPair(pair);
    Cosmos.removeSpacetimeGrid(grid);
    gwLabel.remove(); dist.remove(); stats.remove();

    Cosmos.spawnBurst({ position:new THREE.Vector3(0,0,0), count:520, color:0xffe6c2, spread:6, speed:190, size:3.4, life:3.2, asymmetric:true });
    Cosmos.spawnBurst({ position:new THREE.Vector3(0,0,0), count:260, color:0x9fc0ff, spread:6, speed:90, size:2.4, life:3.6 });

    ExpUI.caption('KILONOVA', 'Neutron-rich matter is thrown into space.');
    await sleep(2400);

    // Interactive inspection choice
    ExpUI.caption('WHAT DO YOU WANT TO INSPECT?', '');
    const pick = await choiceRow([
      {id:'remnant', label:'The Remnant'},
      {id:'ejecta', label:'The Ejecta', recommended:true},
      {id:'gw', label:'The Gravitational Waves'},
    ]);

    if(pick==='remnant'){
      ExpUI.caption('THE REMNANT', 'Depending on the combined mass, the merger leaves behind a heavier neutron star or collapses further into a black hole.');
      await sleep(2600);
      ExpUI.caption('WHAT DO YOU WANT TO INSPECT?', '');
      const pick2 = await choiceRow([{id:'ejecta', label:'Follow The Ejecta', recommended:true}]);
    } else if(pick==='gw'){
      ExpUI.caption('GRAVITATIONAL WAVES', 'Ripples in spacetime itself, radiating outward at the speed of light — first directly detected in 2015, and from a neutron-star merger in 2017.');
      await sleep(2800);
      ExpUI.caption('WHAT DO YOU WANT TO INSPECT?', '');
      await choiceRow([{id:'ejecta', label:'Follow The Ejecta', recommended:true}]);
    }

    await followEjecta(target);
  }

  // ---------------- The Great Scale Zoom ----------------
  async function followEjecta(target){
    ExpUI.caption('FOLLOW THE EJECTA', 'One glowing packet of neutron-rich matter, flung outward.');
    const scaleEl = el('div','scale-indicator', '100 km');
    const labelEl = el('div','scale-label', 'Cosmic debris');
    body().appendChild(scaleEl); body().appendChild(labelEl);

    await Cosmos.lerpCameraTo(new THREE.Vector3(0,0,60), new THREE.Vector3(0,0,0), 1600);

    const rungs = [
      ['100 km','Cosmic debris'], ['10 km','Cosmic debris'], ['1 km','Matter'],
      ['100 m','Matter'], ['1 m','Matter'], ['1 cm','Atoms'],
      ['1 mm','Atoms'], ['10⁻⁶ m','Atoms'], ['10⁻⁹ m','Atomic nucleus'],
      ['10⁻¹² m','Atomic nucleus'], ['10⁻¹⁵ m','Atomic nucleus'],
    ];
    for(const [scale,label] of rungs){
      scaleEl.textContent = scale; labelEl.textContent = label;
      Cosmos.spawnBurst({count:26, color:0xffe6c2, spread:4, speed:14, size:1.6, life:1.1});
      await sleep(430);
    }
    scaleEl.remove(); labelEl.remove();

    // is this a light target? merger physically can't make light elements —
    // acknowledge that honestly rather than forcing a false narrative.
    if(target.z < 30){
      ExpUI.caption('INSIDE THE EJECTA', 'This material is extraordinarily neutron-rich and heavy from the start.');
      await sleep(2200);
      await ExpUI.verdict({
        word:'NOT HERE', cls:'no',
        sub:`Neutron-star mergers build very heavy nuclei through rapid neutron capture — not something as light as ${target.name}. For ${target.name}, an ordinary or massive star is the right place to look.`,
        next:'Try a star instead.'
      });
      ExpUI.close();
      return;
    }

    await runRProcess(target);
  }

  // ---------------- r-process mini simulation ----------------
  async function runRProcess(target){
    ExpUI.caption('RAPID NEUTRON CAPTURE', 'r-PROCESS');
    const wrap = el('div'); wrap.style.cssText='position:absolute; inset:0;';
    body().appendChild(wrap);

    const nucleus = el('div');
    nucleus.style.cssText = `position:absolute; left:50%; top:62%; transform:translate(-50%,-50%); width:70px; height:70px; border-radius:50%; background:radial-gradient(circle at 35% 30%, #fff, #9fc0ff 40%, #23407a 100%); box-shadow:0 0 40px rgba(159,192,255,0.7);`;
    wrap.appendChild(nucleus);

    const neutronDensity = el('div','neutron-counter science-only', 'NEUTRON DENSITY: <b>EXTREME</b>');
    wrap.appendChild(neutronDensity);

    const capturedLabel = el('div', null, '');
    capturedLabel.style.cssText = 'position:absolute; left:50%; top:74%; transform:translateX(-50%); font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-faint);';
    capturedLabel.innerHTML = 'Neutrons captured: <b id="ncap" style="color:var(--accent); font-family:monospace; font-size:15px;">0</b>';
    wrap.appendChild(capturedLabel);

    const hud = el('div','rproc-hud');
    hud.innerHTML = `<div class="z-counter" id="zcounter">26</div><div class="z-caption">Atomic Number (approaching ${target.sym})</div>`;
    wrap.appendChild(hud);

    const betaBox = el('div','beta-decay-box',
      `<span>neutron</span><span class="arrow">→</span><span>proton</span><span>+</span><span>electron</span><span>+</span><span>antineutrino</span>`);
    wrap.appendChild(betaBox);

    const milestone = el('div','milestone-chip');
    wrap.appendChild(milestone);

    // flying neutrons
    function fireNeutron(){
      const n = el('div');
      const ang = Math.random()*Math.PI*2, dist = 220+Math.random()*80;
      n.style.cssText = `position:absolute; left:50%; top:62%; width:6px; height:6px; border-radius:50%; background:#dfe8ff; box-shadow:0 0 8px #fff; transform:translate(${Math.cos(ang)*dist}px, ${Math.sin(ang)*dist*0.5}px);transition: transform 0.55s cubic-bezier(.2,.7,.3,1), opacity .55s ease;`;
      wrap.appendChild(n);
      requestAnimationFrame(()=>{ n.style.transform='translate(-50%,-50%)'; });
      setTimeout(()=> n.remove(), 600);
    }

    const captureCounts = [1,2,3,5,8,12,17,23];
    const zStart = 26, zEnd = target.z;
    const milestones = [ [72,'Hf'], [74,'W'], [78,'Pt'] ].filter(m=>m[0] < zEnd);

    const ncapEl = ()=>document.getElementById('ncap');
    const zEl = ()=>document.getElementById('zcounter');

    for(let i=0;i<captureCounts.length;i++){
      fireNeutron(); fireNeutron();
      await sleep(90);
      ncapEl().textContent = captureCounts[i];
      Ambient.tick();
      await sleep(340);
    }
    ExpUI.caption('RAPID NEUTRON CAPTURE', 'Nuclei are capturing neutrons faster than many unstable nuclei can decay.');
    await sleep(1800);

    // beta-decay pulses raising Z, hitting milestones along the way
    let z = zStart;
    betaBox.classList.add('show');
    const totalSteps = 26;
    for(let s=1;s<=totalSteps;s++){
      await sleep(140);
      fireNeutron();
      if(s % 3 === 0){
        z = Math.min(zEnd-1, z+1);
        zEl().textContent = z;
        Ambient.tick();
      }
      const hit = milestones.find(m=>m[0]===z);
      if(hit){
        milestone.innerHTML = `<div class="sym">${hit[1]}</div><div class="z">Z = ${hit[0]}</div>`;
        milestone.classList.add('show');
        await sleep(900);
        milestone.classList.remove('show');
      }
      if(z >= zEnd-1) break;
    }
    betaBox.classList.remove('show');
    await sleep(500);

    // Final approach — slow down, calm
    ExpUI.caption('EVERYTHING SLOWS.', '');
    zEl().textContent = zEnd-3;
    await sleep(700);
    zEl().textContent = zEnd-2;
    await sleep(700);
    zEl().textContent = zEnd-1;
    await sleep(900);

    nucleus.style.transition = 'box-shadow 1.2s ease, background 1.2s ease';
    nucleus.style.boxShadow = '0 0 70px rgba(244,201,106,0.9)';
    nucleus.style.background = 'radial-gradient(circle at 35% 30%, #fff8e6, #f4c96a 45%, #7a5416 100%)';

    zEl().textContent = zEnd;
    zEl().style.color = 'var(--gold-bright)';
    zEl().style.textShadow = '0 0 34px var(--gold-glow)';
    document.querySelector('.z-caption').textContent = target.name.toUpperCase();
    Ambient.discoveryChime();
    Cosmos.spawnBurst({count:180, color:0xf4c96a, spread:4, speed:34, size:2.6, life:2.6});
    await sleep(1600);

    PTable.discover(target.z);
    await sleep(400);

    ExpUI.caption(`${target.sym}  —  ${target.name.toUpperCase()}`, `Atomic Number ${target.z}`);
    await sleep(1800);

    const nuanceText = target.id==='Au'
      ? "The r-process produces a broad range of very heavy nuclei. Gold is one of the elements associated with this neutron-rich nucleosynthesis."
      : `The r-process produces a broad range of very heavy nuclei. ${target.name} is one of the elements associated with this neutron-rich nucleosynthesis.`;
    const created = el('div','exp-verdict');
    created.innerHTML = `<div class="verdict-word yes">${target.name.toUpperCase()} CREATED.</div><div class="verdict-sub">${nuanceText}</div>`;
    body().appendChild(created);
    await sleep(2600);
    created.remove();

    await showGoldInContext(target);
    await showTimelineRecap(target);

    if(target.id==='Au'){
      const btnWrap = el('div'); btnWrap.style.cssText='position:absolute; left:50%; bottom:8%; transform:translateX(-50%);';
      const btn = el('div','followup-btn', 'Follow Your Gold');
      btnWrap.appendChild(btn); body().appendChild(btnWrap);
      await new Promise(resolve=> btn.addEventListener('click', ()=>{ btnWrap.remove(); resolve(); }, {once:true}));
      await GoldJourney.run(target);
    } else {
      await ExpUI.verdict({ word:'DISCOVERED', cls:'yes', sub:`${target.name} now glows on your discovery map.`, next:'' });
    }
    ExpUI.close();
  }

  async function showGoldInContext(target){
    ExpUI.caption(`${target.name.toUpperCase()} WAS NOT CREATED ALONE.`, 'Extreme neutron-capture environments help build many of the heaviest elements in nature.');
    const cluster = el('div','context-cluster');
    const neighbors = [[63,'Eu'],[78,'Pt'],[90,'Th'],[92,'U'],[65,'Tb'],[82,'Pb']].filter(n=>n[0]!==target.z);
    const positions = [ [30,30],[70,25],[20,65],[75,68],[45,20],[55,78] ];
    neighbors.forEach((n,i)=>{
      const s = el('span', null, n[1]);
      const [x,y] = positions[i%positions.length];
      s.style.left = x+'%'; s.style.top = y+'%';
      cluster.appendChild(s);
    });
    body().appendChild(cluster);
    const zs = neighbors.map(n=>n[0]);
    PTable.discoverMany(zs, {pulse:true});
    for(const span of cluster.children){ span.classList.add('show'); await sleep(220); }
    await sleep(1800);
    cluster.remove();
  }

  async function showTimelineRecap(target){
    ExpUI.caption('THE PERIODIC TABLE IS A RECORD OF COSMIC HISTORY.', '');
    const row = el('div','timeline-row');
    row.innerHTML = `
      <div><b>Big Bang</b><span class="arrow">→</span>H, He, some Li</div>
      <div><b>Stars</b><span class="arrow">→</span>many lighter &amp; intermediate elements</div>
      <div><b>Massive-star evolution</b><span class="arrow">→</span>nuclei toward the iron group</div>
      <div><b>Neutron capture</b><span class="arrow">→</span>many elements heavier than iron</div>
      <div><b>Extreme r-process events</b><span class="arrow">→</span>${target.name} and other very heavy elements</div>
    `;
    body().appendChild(row);
    await sleep(3200);
    const note = el('div','cine-text small show', "Scientists are still determining how much different cosmic events contributed to the Universe's total supply of heavy elements.");
    note.style.top = '88%';
    body().appendChild(note);
    await sleep(2600);
    row.remove(); note.remove();
  }

  window.Merger = { run };
})();
