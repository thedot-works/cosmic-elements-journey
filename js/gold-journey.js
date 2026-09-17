// ==========================================================================
// GOLD JOURNEY — from a freshly-forged nucleus to a ring on someone's hand.
// The closing act: scale flips from femtometres to a human lifetime, and the
// project answers its title question, "How Old Is Gold?"
// ==========================================================================
(function(){
  const sleep = ms => new Promise(r=>setTimeout(r, ms));
  const body = () => ExpUI.body();
  function el(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
  function clearBody(){ body().innerHTML = ''; }

  async function run(target){
    clearBody();
    ExpUI.caption('FOLLOW YOUR GOLD', 'One nucleus, carried outward on the tide of the kilonova.');
    await Cosmos.lerpCameraTo(new THREE.Vector3(0,40,320), new THREE.Vector3(0,0,0), 1800);

    const timeEl = el('div','time-readout', '100 years');
    body().appendChild(timeEl);
    const cloud = Cosmos.createCloud(2400, 260, 0xffcf8f);
    Cosmos.spawnBurst({count:120, color:0xf4c96a, spread:20, speed:20, life:3});

    const times = ['100 years','100,000 years','10 million years','100 million years'];
    for(const t of times){ timeEl.textContent = t; await sleep(1000); }
    ExpUI.caption('THE GOLD MIXES INTO INTERSTELLAR GAS AND DUST.', 'Carried within a vast molecular cloud, drifting for ages.');
    await sleep(2200);

    // Cloud collapses into a new star
    ExpUI.caption('THE CLOUD COLLAPSES.', 'Gravity pulls the material inward. A new star begins to form.');
    cloud.mat.size = 3.2;
    await sleep(1600);
    const starCore = starGlowSprite();
    await sleep(1400);
    timeEl.remove();

    ExpUI.caption('~4.6 BILLION YEARS AGO', 'OUR SOLAR SYSTEM BEGINS TO FORM');
    await sleep(2200);
    ExpUI.caption('A PROTOPLANETARY DISK SPINS AROUND THE YOUNG SUN.', 'Dust collides. Planetesimals grow.');
    const disk = protoDisk();
    await sleep(2400);

    ExpUI.caption('EARTH FORMS.', 'Your gold nucleus becomes part of the young planet.');
    disk.remove(); if(starCore) starCore.remove();
    Cosmos.scene.remove(cloud.pts);
    const earth = earthSprite();
    await sleep(2200);

    // HOW OLD IS GOLD — the one moment this whole journey has been building
    // toward: a closing "imagine" aside, not the app's whole point.
    clearBodyKeep(earth);
    ExpUI.caption('HOW OLD IS GOLD?', '');
    await sleep(1400);
    const imagine = el('div','cine-text mid show', 'Imagine: the gold in your jewelry could be this old.');
    imagine.style.top = '42%';
    body().appendChild(imagine);
    await sleep(2400);
    imagine.remove();
    const compare = el('div','age-compare');
    compare.innerHTML = `
      <div class="age-card"><div class="age-label">Earth</div><div class="age-val">~4.54 Billion Years</div></div>
      <div class="age-card gold"><div class="age-label">Gold on Earth</div><div class="age-val">Older than Earth</div><div class="age-tag">Forged before our planet existed</div></div>
    `;
    compare.style.position='absolute'; compare.style.left='50%'; compare.style.top='55%'; compare.style.transform='translate(-50%,-50%)';
    body().appendChild(compare);
    await sleep(2600);
    const note = el('div','cine-text small show', 'The gold atoms incorporated into Earth were created before our planet formed.');
    note.style.top = '76%';
    body().appendChild(note);
    await sleep(2400);
    const note2 = el('div','cine-text small show', 'An individual gold atom usually does not come with an exact cosmic birth certificate, so we cannot assign one precise age to every gold atom.');
    note2.style.top = '84%'; note2.style.maxWidth='680px'; note2.style.left='50%'; note2.style.width='80vw';
    body().appendChild(note2);
    await sleep(3200);
    compare.remove(); note.remove(); note2.remove();

    // Refinement sequence
    ExpUI.caption('', '');
    await sleep(300);
    const refine = el('div','refine-row');
    refine.style.cssText='position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);';
    const steps = [
      ['⛏','Gold-bearing rock'], ['⚙','Extraction'], ['🔥','Refining'], ['🟡','Gold metal'], ['💍','Jewelry']
    ];
    steps.forEach((s,i)=>{
      if(i>0) refine.appendChild(el('span','arrow','→'));
      const st = el('div','step', `<div>${s[0]}</div><div class="cap">${s[1]}</div>`);
      refine.appendChild(st);
    });
    if(earth) earth.remove();
    body().appendChild(refine);
    await sleep(2600);
    refine.remove();

    // The ring
    const ring = el('div','gold-ring');
    body().appendChild(ring);
    await sleep(1400);
    const l1 = el('div','cine-text mid show', 'THE GOLD YOU WEAR'); l1.style.top='24%';
    body().appendChild(l1);
    await sleep(2000);
    l1.remove();
    const l2 = el('div','cine-text mid show', 'WAS NOT MADE ON EARTH.'); l2.style.top='24%';
    body().appendChild(l2);
    await sleep(2000);
    l2.remove();
    const l3 = el('div','cine-text mid show', 'EARTH INHERITED IT FROM THE UNIVERSE.'); l3.style.top='24%';
    body().appendChild(l3);
    await sleep(2200);
    l3.remove();

    const l4 = el('div','cine-text big gold show', 'THE GOLD YOU WEAR<br>IS A PIECE OF COSMIC HISTORY.'); l4.style.top='40%';
    body().appendChild(l4);
    await sleep(2800);
    const l5 = el('div','cine-text small show', 'Long before it became jewelry, its atoms were forged by events among the stars.');
    l5.style.top='58%';
    body().appendChild(l5);
    await sleep(2800);
    l4.remove(); l5.remove();

    // Reverse zoom
    ring.style.transition = 'transform 2.4s ease, opacity 2.4s ease';
    ring.style.transform = 'translate(-50%,-50%) scale(0.15)';
    ring.style.opacity = '0.25';
    await Cosmos.lerpCameraTo(new THREE.Vector3(0,300,1600), new THREE.Vector3(0,0,0), 2400);
    await sleep(2600);
    ring.remove();

    // periodic table faintly at galaxy scale
    const introTable = document.getElementById('intro-ptable');
    if(!introTable.children.length) PTable.buildGrid(introTable, {compact:true, interactive:false});
    introTable.style.display = 'block';
    introTable.style.opacity = 0.18;
    introTable.style.transform = 'translate(-50%,-50%) scale(1)';
    document.getElementById('intro-root').style.display = 'block';
    document.getElementById('intro-root').style.opacity = 1;
    document.getElementById('intro-root').style.pointerEvents = 'none';

    const final1 = el('div','cine-text big show', 'WE ARE MADE FROM A UNIVERSE'); final1.style.top='42%';
    const final2 = el('div','cine-text big show', 'THAT LEARNED TO BUILD ELEMENTS.'); final2.style.top='52%';
    body().appendChild(final1); body().appendChild(final2);
    await sleep(3600);
    final1.remove(); final2.remove();
    introTable.style.transition = 'opacity 1.2s ease';
    introTable.style.opacity = 0;
    setTimeout(()=>{ document.getElementById('intro-root').style.display='none'; }, 1300);

    await Cosmos.lerpCameraTo(new THREE.Vector3(0,0,400), new THREE.Vector3(0,0,0), 1600);
  }

  function clearBodyKeep(keepEl){
    [...body().children].forEach(c=>{ if(c!==keepEl) c.remove(); });
  }

  function starGlowSprite(){
    const d = el('div');
    d.style.cssText = 'position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:120px; height:120px; border-radius:50%; background:radial-gradient(circle at 38% 35%, #fff, #ffd27a 45%, transparent 78%); box-shadow:0 0 90px #ffd27a;';
    body().appendChild(d);
    return d;
  }
  function protoDisk(){
    const d = el('div');
    d.style.cssText = 'position:absolute; left:50%; top:50%; width:70vh; height:14vh; transform:translate(-50%,-50%) rotateX(72deg); border-radius:50%; background:radial-gradient(ellipse at center, rgba(255,210,140,0.35), rgba(255,210,140,0.05) 60%, transparent 80%); border:1px solid rgba(255,210,140,0.25);';
    body().appendChild(d);
    return d;
  }
  function earthSprite(){
    const d = el('div');
    d.style.cssText = 'position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:110px; height:110px; border-radius:50%; background:radial-gradient(circle at 35% 30%, #bfe3ff, #3a7bd5 45%, #1a3a6b 100%); box-shadow:0 0 50px rgba(60,120,220,0.6);';
    body().appendChild(d);
    return d;
  }

  window.GoldJourney = { run };
})();
