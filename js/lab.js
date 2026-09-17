// ==========================================================================
// LAB — the Cosmic Forge. Object library, target selection, hint system,
// and the combination resolver that routes an activated pair/single object
// to the right full-screen experiment.
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

  const TARGETS = [
    { id:'C',  sym:'C',  z:6,  name:'Carbon' },
    { id:'O',  sym:'O',  z:8,  name:'Oxygen' },
    { id:'Fe', sym:'Fe', z:26, name:'Iron' },
    { id:'Ag', sym:'Ag', z:47, name:'Silver' },
    { id:'Au', sym:'Au', z:79, name:'Gold', def:true },
    { id:'U',  sym:'U',  z:92, name:'Uranium' },
  ];

  const HINTS = {
    Au: [
      "Ordinary stars can build many elements, but Gold needs something more extreme.",
      "Look for an environment with enormous numbers of neutrons.",
      "Some of the densest objects in the Universe become very interesting when you put two together.",
      "Try merging two neutron stars.",
    ],
    Ag: [
      "Silver is heavier than iron — ordinary fusion stalls before it gets there.",
      "Rapid neutron capture can build silver, just as it builds heavier metals.",
      "Try merging two neutron stars.",
    ],
    U: [
      "Uranium is among the heaviest elements found in nature.",
      "It needs an extremely neutron-rich environment to be built at all.",
      "Try merging two neutron stars.",
    ],
    Fe: [
      "Iron sits at the end of the line for energy-releasing fusion.",
      "You need a star massive enough to fuse all the way through its onion-like layers.",
      "Try a Massive Star or a Red Supergiant.",
    ],
    O: [
      "Oxygen forms well inside the layers of an evolved, fairly massive star.",
      "Try a Massive Star.",
    ],
    C: [
      "Carbon forms when helium nuclei fuse together in a star's core.",
      "Try a Main-Sequence Star, or something larger.",
    ],
  };

  const Lab = {
    slots: { a:null, b:null },
    target: TARGETS.find(t=>t.def),
    hintIndex: {},
    busy: false,
  };

  function init(){
    renderLibrary();
    renderTargets();
    PTable.buildGrid(document.getElementById('lab-ptable'), {compact:false, interactive:true});
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
    Lab.target = TARGETS.find(t=>t.id===id);
    document.querySelectorAll('.target-chip').forEach(c=> c.classList.toggle('active', c.dataset.id===id));
    document.getElementById('hint-text').classList.remove('show');
    document.getElementById('hint-text').textContent = '';
    updateFocus();
    updateDiscoveredMarks();
  }

  function updateDiscoveredMarks(){
    document.querySelectorAll('.target-chip').forEach(c=>{
      const t = TARGETS.find(x=>x.id===c.dataset.id);
      c.classList.toggle('done', PTable.discovered.has(t.z));
    });
  }

  function updateFocus(){
    const t = Lab.target;
    const box = document.getElementById('target-focus');
    box.className = 'target-focus' + (t.id==='Au' ? '' : ' non-gold');
    box.innerHTML = `<div class="big-sym">${t.id}</div><div class="zn">${t.z}</div><div class="tname">${t.name}</div><div class="ask">Can you create it?</div>`;
    document.getElementById('question-banner-text').textContent =
      t.id==='Au' ? 'What do you want to create? — Target: Gold' : `What do you want to create? — Target: ${t.name}`;
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

  function comboKey(){
    const ids = [Lab.slots.a, Lab.slots.b].filter(Boolean).sort();
    return ids.join('+');
  }

  async function onActivate(){
    if(Lab.busy || !Lab.slots.a) return;
    Lab.busy = true;
    document.getElementById('activate-btn').disabled = true;
    Ambient.unlock();

    const key = comboKey();
    const target = Lab.target;
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
        await Merger.run(target);
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
    const list = HINTS[t.id] || HINTS.Au;
    const idx = Lab.hintIndex[t.id] || 0;
    const box = document.getElementById('hint-text');
    box.textContent = list[Math.min(idx, list.length-1)];
    box.classList.add('show');
    Lab.hintIndex[t.id] = Math.min(idx+1, list.length-1);
  }

  function resetSlotsAfterExperiment(){
    Lab.slots.a = null; Lab.slots.b = null;
    renderSlot('a'); renderSlot('b');
    updateActivateState();
  }

  window.Lab = Lab;
  window.Lab.OBJECTS = OBJECTS;
  window.Lab.TARGETS = TARGETS;
  window.Lab.init = init;
  window.Lab.setTarget = setTarget;
  window.Lab.resetSlotsAfterExperiment = resetSlotsAfterExperiment;
  window.Lab.updateDiscoveredMarks = updateDiscoveredMarks;
})();
