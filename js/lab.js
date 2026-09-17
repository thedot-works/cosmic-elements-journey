// ==========================================================================
// LAB — the Cosmic Forge. Object library, target selection, hint system,
// and the combination resolver that routes an activated pair/single object
// to the right full-screen experiment. The default mode is free exploration
// across the whole periodic table; aiming at one element (Gold included) is
// optional guidance, not the point of the app.
// ==========================================================================
(function(){

  const OBJECTS = [
    { id:'early',    label:'Early Universe',        sub:'Primordial matter',                 glyph:'g-early' },
    { id:'mainseq',  label:'Main-Sequence Star',     sub:'Glowing Sun-like star',              glyph:'g-mainseq' },
    { id:'massive',  label:'Massive Star',           sub:'Large blue-white star',              glyph:'g-massive' },
    { id:'redsuper', label:'Red Supergiant',         sub:'Expanded late-stage massive star',   glyph:'g-redsuper' },
    { id:'whitedwarf', label:'White Dwarf',          sub:'Compact white stellar remnant',      glyph:'g-whitedwarf' },
    { id:'neutronA', label:'Neutron Star A',         sub:'Tiny, dense pulsating remnant',      glyph:'g-neutron' },
    { id:'neutronB', label:'Neutron Star B',         sub:'Second neutron star',                glyph:'g-neutron' },
    { id:'magnetar', label:'Magnetar',               sub:'Highly magnetized neutron star',     glyph:'g-magnetar' },
    { id:'gas',      label:'Interstellar Gas + Dust',sub:'Diffuse molecular material',         glyph:'g-gas' },
  ];

  // The "no target" state — the default. Exploring freely still fills the
  // periodic table; a specific target is just optional direction.
  const EXPLORE = { id:'EXPLORE', sym:null, z:null, name:'Explore', explore:true };

  const TARGETS = [
    { id:'C',  sym:'C',  z:6,  name:'Carbon' },
    { id:'O',  sym:'O',  z:8,  name:'Oxygen' },
    { id:'Fe', sym:'Fe', z:26, name:'Iron' },
    { id:'Ag', sym:'Ag', z:47, name:'Silver' },
    { id:'Au', sym:'Au', z:79, name:'Gold' },
    { id:'U',  sym:'U',  z:92, name:'Uranium' },
  ];

  // Each hint can optionally point at which object(s) to look at on the left.
  const HINTS = {
    EXPLORE: [
      { text:"Every object in the library reacts differently — try one on its own first." },
      { text:"A single evolved star can walk you most of the way up the periodic table." },
      { text:"The densest objects in the universe get interesting when you combine two of them." },
      { text:"Stuck on a specific element? Click any dark cell on the Discovery Map to see how it's made." },
    ],
    Au: [
      { text:"Ordinary stars can build many elements, but Gold needs something more extreme." },
      { text:"Look for an environment with enormous numbers of neutrons." },
      { text:"Some of the densest objects in the Universe become very interesting when you put two together.", highlight:['neutronA','neutronB'] },
      { text:"Try merging two neutron stars.", highlight:['neutronA','neutronB'] },
    ],
    Ag: [
      { text:"Silver is heavier than iron — ordinary fusion stalls before it gets there." },
      { text:"Rapid neutron capture can build silver, just as it builds heavier metals.", highlight:['neutronA','neutronB'] },
      { text:"Try merging two neutron stars.", highlight:['neutronA','neutronB'] },
    ],
    U: [
      { text:"Uranium is among the heaviest elements found in nature." },
      { text:"It needs an extremely neutron-rich environment to be built at all.", highlight:['neutronA','neutronB'] },
      { text:"Try merging two neutron stars.", highlight:['neutronA','neutronB'] },
    ],
    Fe: [
      { text:"Iron sits at the end of the line for energy-releasing fusion." },
      { text:"You need a star massive enough to fuse all the way through its onion-like layers.", highlight:['massive','redsuper'] },
      { text:"Try a Massive Star or a Red Supergiant.", highlight:['massive','redsuper'] },
    ],
    O: [
      { text:"Oxygen forms well inside the layers of an evolved, fairly massive star." },
      { text:"Try a Massive Star.", highlight:['massive'] },
    ],
    C: [
      { text:"Carbon forms when helium nuclei fuse together in a star's core." },
      { text:"Try a Main-Sequence Star, or something larger.", highlight:['mainseq','massive'] },
    ],
  };

  // What to auto-select when the player clicks an undiscovered cell on the
  // periodic table and asks to be shown how it's made.
  function comboForZ(z){
    if(z===1) return { objs:['early'] };
    if(z===2) return { objs:['mainseq'] };
    if(z===3) return { objs:['early'] };
    if(z>=4 && z<=36) return { objs:['massive'] };
    if(z>=93) return { synthetic:true };
    return { objs:['neutronA','neutronB'] };
  }

  const Lab = {
    slots: { a:null, b:null },
    target: EXPLORE,
    hintIndex: {},
    busy: false,
  };

  function init(){
    renderLibrary();
    renderTargets();
    PTable.buildGrid(document.getElementById('lab-ptable'), {compact:false, interactive:true});
    PTable.onCellClick = onPeriodicCellClick;
    PTable.updateCount();

    document.getElementById('activate-btn').addEventListener('click', onActivate);
    document.getElementById('hint-btn').addEventListener('click', onHint);
    document.getElementById('slot-a').addEventListener('click', ()=> clearSlot('a'));
    document.getElementById('slot-b').addEventListener('click', ()=> clearSlot('b'));

    updateFocus();
  }

  function renderLibrary(){
    const lib = document.getElementById('object-library');
    OBJECTS.forEach(o=>{
      const el = document.createElement('div');
      el.className = 'cosmic-obj';
      el.dataset.id = o.id;
      el.innerHTML = `<div class="glyph ${o.glyph}"></div><div class="label"><b>${o.label}</b><span>${o.sub}</span></div>`;
      el.addEventListener('click', ()=> selectObject(o.id));
      lib.appendChild(el);
    });
  }

  function renderTargets(){
    const grid = document.getElementById('target-grid');
    grid.innerHTML = '';

    const exploreChip = document.createElement('div');
    exploreChip.className = 'target-chip explore-chip' + (Lab.target.id==='EXPLORE' ? ' active':'');
    exploreChip.dataset.id = 'EXPLORE';
    exploreChip.innerHTML = `<b>∞</b>Explore All Elements`;
    exploreChip.addEventListener('click', ()=> setTarget('EXPLORE'));
    grid.appendChild(exploreChip);

    TARGETS.forEach(t=>{
      const chip = document.createElement('div');
      chip.className = 'target-chip' + (t.id===Lab.target.id ? ' active':'');
      chip.dataset.id = t.id;
      chip.innerHTML = `<b>${t.id}</b>${t.name}`;
      chip.addEventListener('click', ()=> setTarget(t.id));
      grid.appendChild(chip);
    });
  }

  function setTarget(id){
    Lab.target = id==='EXPLORE' ? EXPLORE : TARGETS.find(t=>t.id===id);
    document.querySelectorAll('.target-chip').forEach(c=> c.classList.toggle('active', c.dataset.id===id));
    document.getElementById('hint-text').classList.remove('show');
    document.getElementById('hint-text').textContent = '';
    Lab.hintIndex[Lab.target.id] = 0;
    clearLibraryHighlight();
    updateFocus();
    updateDiscoveredMarks();
  }

  function updateDiscoveredMarks(){
    document.querySelectorAll('.target-chip').forEach(c=>{
      if(c.dataset.id==='EXPLORE') return;
      const t = TARGETS.find(x=>x.id===c.dataset.id);
      c.classList.toggle('done', PTable.discovered.has(t.z));
    });
  }

  function updateFocus(){
    const t = Lab.target;
    const box = document.getElementById('target-focus');
    if(t.explore){
      box.className = 'target-focus non-gold';
      box.innerHTML = `<div class="big-sym">∞</div><div class="zn">&nbsp;</div><div class="tname">All 118 Elements</div><div class="ask">Fill the periodic table. Anything you build counts.</div>`;
      document.getElementById('question-banner-text').textContent = 'What do you want to create?';
      return;
    }
    box.className = 'target-focus' + (t.id==='Au' ? '' : ' non-gold');
    box.innerHTML = `<div class="big-sym">${t.id}</div><div class="zn">${t.z}</div><div class="tname">${t.name}</div><div class="ask">Can you create it?</div>`;
    document.getElementById('question-banner-text').textContent = `What do you want to create? — Aiming for ${t.name}`;
  }

  function selectObject(id){
    if(Lab.busy) return;
    if(Lab.slots.a && Lab.slots.a===id && !Lab.slots.b){ return; } // no dup auto no-op needed
    if(!Lab.slots.a){ fillSlot('a', id); }
    else if(!Lab.slots.b){ fillSlot('b', id); }
    else { fillSlot('a', id); Lab.slots.b=null; renderSlot('b'); }
    updateActivateState();
  }

  function fillSlot(slot, id){
    Lab.slots[slot] = id;
    renderSlot(slot);
  }
  function clearSlot(slot){
    if(Lab.busy) return;
    Lab.slots[slot] = null;
    renderSlot(slot);
    updateActivateState();
  }
  function renderSlot(slot){
    const o = Lab.slots[slot] && OBJECTS.find(x=>x.id===Lab.slots[slot]);
    const el = document.getElementById('slot-'+slot);
    if(!o){ el.classList.remove('filled'); el.innerHTML = `<div class="slot-label">Object / Event ${slot.toUpperCase()}</div><div class="placeholder">+</div>`; return; }
    el.classList.add('filled');
    el.innerHTML = `<div class="slot-label">Object / Event ${slot.toUpperCase()}</div><div class="glyph ${o.glyph}"></div><div class="name">${o.label}</div>`;
  }

  function updateActivateState(){
    const btn = document.getElementById('activate-btn');
    const hasA = !!Lab.slots.a, hasB = !!Lab.slots.b;
    const isMerger = Lab.slots.a==='neutronA' && Lab.slots.b==='neutronB' || Lab.slots.a==='neutronB' && Lab.slots.b==='neutronA';
    btn.disabled = !hasA;
    btn.textContent = isMerger ? 'Merge' : 'Activate';
    btn.classList.toggle('merge', isMerger);

    const extreme = document.getElementById('extreme-tag');
    extreme.classList.toggle('show', isMerger);
    if(isMerger) Ambient.tick();
  }

  // ---------------- Library highlighting (used by hints and auto-solve) ----------------
  function highlightLibraryObjects(ids){
    clearLibraryHighlight();
    if(!ids || !ids.length) return;
    let first = null;
    ids.forEach(id=>{
      const el = document.querySelector(`.cosmic-obj[data-id="${id}"]`);
      if(el){ el.classList.add('selected', 'hint-glow'); first = first || el; }
    });
    if(first) first.scrollIntoView({ block:'nearest', behavior:'smooth' });
  }
  function clearLibraryHighlight(){
    document.querySelectorAll('.cosmic-obj.hint-glow').forEach(el=> el.classList.remove('hint-glow'));
    // Only clear 'selected' from cards that aren't actually sitting in a slot.
    document.querySelectorAll('.cosmic-obj.selected').forEach(el=>{
      if(el.dataset.id!==Lab.slots.a && el.dataset.id!==Lab.slots.b) el.classList.remove('selected');
    });
  }

  function comboKey(){
    const ids = [Lab.slots.a, Lab.slots.b].filter(Boolean).sort();
    return ids.join('+');
  }

  async function onActivate(){
    if(Lab.busy || !Lab.slots.a) return;
    Lab.busy = true;
    document.getElementById('activate-btn').disabled = true;
    Ambient.unlock();
    clearLibraryHighlight();

    const key = comboKey();
    // The merger's r-process demo needs a concrete element to climb to; if the
    // player hasn't aimed at one, Gold is the flagship example — but the UI
    // never frames the rest of the game around it.
    const target = Lab.target;
    const mergerTarget = target.explore ? TARGETS.find(t=>t.id==='Au') : target;
    const single = !Lab.slots.b;

    try{
      if(single && Lab.slots.a==='early'){
        await Experiments.runEarlyUniverse(target);
      } else if(single && Lab.slots.a==='mainseq'){
        await Experiments.runMainSequence(target);
      } else if(single && (Lab.slots.a==='massive' || Lab.slots.a==='redsuper')){
        await Experiments.runMassiveStar(target, Lab.slots.a==='redsuper');
      } else if(single && Lab.slots.a==='whitedwarf'){
        await Experiments.runWhiteDwarf(target);
      } else if(single && Lab.slots.a==='magnetar'){
        await Experiments.runMagnetar(target);
      } else if(single && Lab.slots.a==='gas'){
        await Experiments.runGasAlone(target);
      } else if(key==='neutronA+neutronB'){
        await Merger.run(mergerTarget, { explicit: !target.explore });
      } else if((Lab.slots.a==='gas'||Lab.slots.b==='gas') &&
                (Lab.slots.a==='massive'||Lab.slots.b==='massive'||Lab.slots.a==='redsuper'||Lab.slots.b==='redsuper'||Lab.slots.a==='whitedwarf'||Lab.slots.b==='whitedwarf')){
        await Experiments.runGasRecycle(target);
      } else {
        await Experiments.runGenericWrong(target, describeCombo());
      }
    } catch(e){
      console.error(e);
    }

    updateDiscoveredMarks();
    PTable.updateCount();
    Lab.busy = false;
    document.getElementById('activate-btn').disabled = !Lab.slots.a;
  }

  function describeCombo(){
    const a = Lab.slots.a && OBJECTS.find(o=>o.id===Lab.slots.a);
    const b = Lab.slots.b && OBJECTS.find(o=>o.id===Lab.slots.b);
    if(a && b) return `${a.label} + ${b.label}`;
    return a ? a.label : 'Nothing';
  }

  function onHint(){
    const t = Lab.target;
    const list = HINTS[t.id] || HINTS.EXPLORE;
    const idx = Lab.hintIndex[t.id] || 0;
    const entry = list[Math.min(idx, list.length-1)];
    const box = document.getElementById('hint-text');
    box.textContent = entry.text;
    box.classList.add('show');
    Lab.hintIndex[t.id] = Math.min(idx+1, list.length-1);
    if(entry.highlight) highlightLibraryObjects(entry.highlight);
  }

  // ---------------- "Show me how" — click a periodic table cell ----------------
  function onPeriodicCellClick(z){
    if(Lab.busy) return;
    const el = PTable.elementByZ(z);
    if(!el) return;
    const combo = comboForZ(z);

    if(combo.synthetic){
      showSynthNote(el);
      return;
    }

    // Aim at this element (if it's one of our named targets) and load the
    // objects that make it, so the player sees exactly what to click next time.
    const namedTarget = TARGETS.find(t=>t.z===z);
    Lab.target = namedTarget || { id: el.sym, sym: el.sym, z: el.z, name: el.name };
    document.querySelectorAll('.target-chip').forEach(c=> c.classList.toggle('active', c.dataset.id===Lab.target.id));
    updateFocus();

    Lab.slots.a = combo.objs[0] || null;
    Lab.slots.b = combo.objs[1] || null;
    renderSlot('a'); renderSlot('b');
    updateActivateState();
    highlightLibraryObjects(combo.objs);

    document.getElementById('question-banner-text').textContent = `Showing how ${el.name} is made…`;
    setTimeout(()=>{ if(!Lab.busy) onActivate(); }, 1100);
  }

  function showSynthNote(el){
    const tip = document.getElementById('elem-tooltip');
    if(!tip) return;
    tip.innerHTML = `<b>${el.name} (${el.sym})</b><br>Not found in nature in meaningful quantity — made artificially in laboratories, so there's no cosmic pathway to demonstrate here.`;
    tip.style.left = '50%'; tip.style.top = '50%'; tip.style.transform = 'translate(-50%,-50%)';
    tip.classList.add('show');
    setTimeout(()=>{ tip.classList.remove('show'); tip.style.transform = ''; }, 3200);
  }

  function resetSlotsAfterExperiment(){
    Lab.slots.a = null; Lab.slots.b = null;
    renderSlot('a'); renderSlot('b');
    updateActivateState();
    clearLibraryHighlight();
  }

  window.Lab = Lab;
  window.Lab.OBJECTS = OBJECTS;
  window.Lab.TARGETS = TARGETS;
  window.Lab.EXPLORE = EXPLORE;
  window.Lab.init = init;
  window.Lab.setTarget = setTarget;
  window.Lab.resetSlotsAfterExperiment = resetSlotsAfterExperiment;
  window.Lab.updateDiscoveredMarks = updateDiscoveredMarks;
})();
