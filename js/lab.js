// ==========================================================================
// LAB — the Cosmic Forge. Twelve cosmic objects and events, two slots, and a
// Discovery Map of all 118 elements. Clicking an element loads the combination
// that makes it and then waits: the player presses Enter when they are ready.
// Aiming at an element is optional; the point is to fill the whole table.
// ==========================================================================
(function(){

  const OBJECTS = [
    { id:'early',      label:'The Early Universe',      sub:'The first minutes after the Big Bang', glyph:'g-early' },
    { id:'sunlike',    label:'Sun-like Star',           sub:'An ordinary star fusing hydrogen',     glyph:'g-mainseq' },
    { id:'redgiant',   label:'Red Giant',               sub:'A dying Sun-like star',                glyph:'g-redgiant' },
    { id:'massive',    label:'Massive Star',            sub:'Eight suns or more; dies as a supernova', glyph:'g-massive' },
    { id:'whitedwarf', label:'White Dwarf',             sub:'An Earth-sized stellar corpse',        glyph:'g-whitedwarf' },
    { id:'neutronA',   label:'Neutron Star A',          sub:'A city-sized ball of neutrons',        glyph:'g-neutron' },
    { id:'neutronB',   label:'Neutron Star B',          sub:'A second neutron star',                glyph:'g-neutron' },
    { id:'magnetar',   label:'Magnetar',                sub:'A monstrously magnetised neutron star',glyph:'g-magnetar' },
    { id:'cosmicrays', label:'Cosmic Rays',             sub:'Nuclei at almost the speed of light',  glyph:'g-rays' },
    { id:'gas',        label:'Interstellar Gas + Dust', sub:'Cold clouds between the stars',        glyph:'g-gas' },
    { id:'rock',       label:'Radioactive Rock',        sub:'Uranium and thorium decaying on Earth',glyph:'g-rock' },
    { id:'humanlab',   label:'Human Laboratory',        sub:'Reactors and particle accelerators',   glyph:'g-lab' },
  ];

  const TARGETS = [6, 8, 26, 47, 79, 92];   // C, O, Fe, Ag, Au, U — optional quick picks

  const Lab = { slots:{ a:null, b:null }, targetZ:null, busy:false, hintIndex:{}, preview:null };

  // ------------------------------------------------------------------ recipe resolution
  function resolve(a, b){
    const key = [a,b].filter(Boolean).sort().join('+');
    if(!b){
      switch(a){
        case 'early':      return { site:'bigbang' };
        case 'sunlike':    return { site:'sunlike' };
        case 'redgiant':   return { site:'agb' };
        case 'massive':    return { site:'massive' };
        case 'rock':       return { site:'decay' };
        case 'humanlab':   return { site:'lab' };
        case 'whitedwarf': return { site:'wdAlone', teach:true };
        case 'neutronA':
        case 'neutronB':   return { site:'nsSingle', teach:true };
        case 'magnetar':   return { site:'magnetar', teach:true };
        case 'cosmicrays': return { site:'raysAlone', teach:true };
        case 'gas':        return { site:'gasAlone', teach:true };
      }
    }
    if(key === 'neutronA+neutronB') return { site:'merger' };
    if(key === 'cosmicrays+gas') return { site:'spallation' };
    const has = id=> a===id || b===id;
    if(has('whitedwarf') && (has('sunlike') || has('redgiant'))) return { site:'typeIa', alt:'nova' };
    if(has('gas') && (has('massive') || has('redgiant') || has('whitedwarf') || has('sunlike'))) return { site:'recycle', teach:true };
    return { site:'mismatch', teach:true };
  }

  function chooseRun(){
    const r = resolve(Lab.slots.a, Lab.slots.b);
    if(r.teach) return { site:r.site, mode:'teach', objects:[Lab.slots.a, Lab.slots.b].filter(Boolean), label: describeCombo() };
    const t = Lab.targetZ ? ElementProfiles.get(Lab.targetZ) : null;
    if(t){
      if(t.recipe === r.site) return { site:r.site, z:t.z, mode:'target' };
      if(r.alt && t.recipe === r.alt) return { site:r.alt, z:t.z, mode:'target' };
    }
    let site = r.site;
    // a white dwarf + companion normally detonates; if only lithium is still
    // missing from that pairing, the gentler nova is the interesting story
    if(r.alt === 'nova'){
      const iaLeft = ElementProfiles.elementsForSite('typeIa').some(z=> !PTable.discovered.has(z));
      if(!iaLeft && !PTable.discovered.has(3)) site = 'nova';
    }
    const list = ElementProfiles.elementsForSite(site);
    const z = list.find(zz=> !PTable.discovered.has(zz)) || list[0];
    return { site, z, mode: t ? 'mismatch' : 'free', missed: t ? t : null };
  }

  // ------------------------------------------------------------------ init + rendering
  function init(){
    renderLibrary();
    PTable.buildGrid(document.getElementById('lab-ptable'), { compact:false, interactive:true });
    PTable.onCellClick = onPeriodicCellClick;
    PTable.updateCount();

    document.getElementById('activate-btn').addEventListener('click', onActivate);
    document.getElementById('hint-btn').addEventListener('click', onHint);
    document.getElementById('slot-a').addEventListener('click', ()=> clearSlot('a'));
    document.getElementById('slot-b').addEventListener('click', ()=> clearSlot('b'));
    document.addEventListener('keydown', e=>{
      if(e.key === 'Enter' && !Theater.busy && !Lab.busy && Lab.slots.a){ e.preventDefault(); onActivate(); }
    });
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

  function setTarget(z, opts={}){
    Lab.targetZ = z;
    document.querySelectorAll('#lab-ptable .pcell.target').forEach(c=> c.classList.remove('target'));
    const cell = document.querySelector(`#lab-ptable .pcell[data-z="${z}"]`);
    if(cell) cell.classList.add('target');
    const hint = document.getElementById('hint-text');
    hint.classList.remove('show'); hint.textContent = '';
    Lab.hintIndex[z] = 0;
    if(!opts.keepSlots) clearLibraryHighlight();
    updateFocus();
  }

  function updateDiscoveredMarks(){ /* the quick-pick chips are gone; the map itself is the picker */ }

  // The result slot IS the element display: A + B = the thing itself, rendered
  // as it really looks and turning slowly on the spot.
  function updateFocus(){
    const box = document.getElementById('slot-result');
    const banner = document.getElementById('question-banner-text');
    const look = document.getElementById('result-look');
    if(!Lab.targetZ){
      box.className = 'slot result';
      box.innerHTML = `<div class="placeholder">?</div>`;
      banner.textContent = 'What do you want to create?';
      if(look){ look.textContent = ''; look.classList.remove('show'); }
      if(Lab.preview) Lab.preview.clear();
      return;
    }
    const p = ElementProfiles.get(Lab.targetZ);
    box.className = 'slot result filled';
    box.innerHTML = `
      <canvas class="rs-preview" width="220" height="150"></canvas>
      <div class="rs-id"><b>${p.sym}</b><span>${p.name}</span></div>`;
    requestAnimationFrame(()=> box.classList.add('pop'));
    banner.textContent = `What do you want to create? — aiming for ${p.name}`;
    if(look){ look.textContent = p.look.cap; look.classList.add('show'); }
    const canvas = box.querySelector('.rs-preview');
    if(!Lab.preview) Lab.preview = Specimen.preview(canvas);
    else Lab.preview.attach(canvas);
    Lab.preview.show(p);
  }

  // ------------------------------------------------------------------ slots
  function selectObject(id){
    if(Lab.busy || Theater.busy) return;
    if(!Lab.slots.a){ fillSlot('a', id); }
    else if(!Lab.slots.b){ fillSlot('b', id); }
    else { fillSlot('a', id); Lab.slots.b = null; renderSlot('b'); }
    updateActivateState();
  }
  function fillSlot(slot, id){ Lab.slots[slot] = id; renderSlot(slot); }
  function clearSlot(slot){
    if(Lab.busy || Theater.busy) return;
    Lab.slots[slot] = null; renderSlot(slot); updateActivateState();
  }
  function renderSlot(slot){
    const o = Lab.slots[slot] && OBJECTS.find(x=>x.id===Lab.slots[slot]);
    const el = document.getElementById('slot-'+slot);
    if(!o){ el.classList.remove('filled'); el.innerHTML = `<div class="slot-label">Object / Event ${slot.toUpperCase()}</div><div class="placeholder">+</div>`; return; }
    el.classList.add('filled');
    el.innerHTML = `<div class="slot-label">Object / Event ${slot.toUpperCase()}</div><div class="glyph ${o.glyph}"></div><div class="name">${o.label}</div>`;
  }

  function updateActivateState(opts={}){
    const btn = document.getElementById('activate-btn');
    const hasA = !!Lab.slots.a;
    const r = hasA ? resolve(Lab.slots.a, Lab.slots.b) : null;
    const isMerger = r && r.site === 'merger';
    btn.disabled = !hasA;
    btn.innerHTML = (isMerger ? 'Merge' : 'Activate') + (hasA ? '<i class="kbd">⏎</i>' : '');
    btn.classList.toggle('merge', !!isMerger);
    btn.classList.toggle('ready', !!opts.armed);
    const extreme = document.getElementById('extreme-tag');
    extreme.classList.toggle('show', !!isMerger);
    if(isMerger) Ambient.tick();
    // the slot row explains what the pairing is about to do
    const note = document.getElementById('combo-note');
    if(note){
      if(!hasA){ note.textContent = ''; note.classList.remove('show'); }
      else {
        const label = { bigbang:'The first minutes of the universe', sunlike:'Ordinary stellar fusion', agb:'A dying Sun-like star',
          massive:'A massive star and its supernova', typeIa:'A white dwarf detonating', nova:'A nova eruption',
          merger:'Two neutron stars colliding', spallation:'Cosmic rays shattering nuclei', decay:'Radioactive decay inside Earth',
          lab:'A human laboratory' }[r.site];
        note.textContent = label || '';
        note.classList.toggle('show', !!label);
      }
    }
  }

  // ------------------------------------------------------------------ highlighting
  function highlightLibraryObjects(ids){
    clearLibraryHighlight();
    if(!ids || !ids.length) return;
    let first = null;
    ids.forEach(id=>{
      const el = document.querySelector(`.cosmic-obj[data-id="${id}"]`);
      if(el){ el.classList.add('selected','hint-glow'); first = first || el; }
    });
    if(first) first.scrollIntoView({ block:'nearest', behavior:'smooth' });
  }
  function clearLibraryHighlight(){
    document.querySelectorAll('.cosmic-obj.hint-glow').forEach(el=> el.classList.remove('hint-glow'));
    document.querySelectorAll('.cosmic-obj.selected').forEach(el=>{
      if(el.dataset.id !== Lab.slots.a && el.dataset.id !== Lab.slots.b) el.classList.remove('selected');
    });
  }

  function describeCombo(){
    const a = Lab.slots.a && OBJECTS.find(o=>o.id===Lab.slots.a);
    const b = Lab.slots.b && OBJECTS.find(o=>o.id===Lab.slots.b);
    if(a && b) return `${a.label} + ${b.label}`;
    return a ? a.label : 'Nothing';
  }

  // ------------------------------------------------------------------ "show me how" — clicking the Discovery Map
  // Loads the recipe and then WAITS. The player presses Enter (or Activate).
  function onPeriodicCellClick(z){
    if(Lab.busy || Theater.busy) return;
    const p = ElementProfiles.get(z);
    if(!p) return;
    setTarget(z, { keepSlots:true });
    const objs = p.site.objs.slice();
    Lab.slots.a = objs[0] || null;
    Lab.slots.b = objs[1] || null;
    renderSlot('a'); renderSlot('b');
    updateActivateState({ armed:true });
    highlightLibraryObjects(objs);
    Theater.setPrimary(null);
    // Name the button the banner is pointing at, so the instruction always
    // matches what's actually on screen (the button reads "Merge" instead
    // of "Activate" for neutron-star mergers).
    const r = resolve(Lab.slots.a, Lab.slots.b);
    const label = (r && r.site === 'merger') ? 'Merge' : 'Activate';
    const banner = document.getElementById('question-banner-text');
    banner.innerHTML = `Recipe loaded for <b>${p.name}</b> — press <i class="kbd inline">⏎</i> or click <b>${label}</b> to watch it being made`;
    document.getElementById('question-banner').classList.add('armed');
    Ambient.tick();
  }

  // ------------------------------------------------------------------ activate
  async function onActivate(){
    if(Lab.busy || Theater.busy || !Lab.slots.a) return;
    Lab.busy = true;
    document.getElementById('activate-btn').disabled = true;
    document.getElementById('question-banner').classList.remove('armed');
    Ambient.unlock();
    clearLibraryHighlight();
    const run = chooseRun();
    if(run.missed){
      run.note = `${run.missed.name} is not made here — but watch what is.`;
    }
    try { await Theater.run(run); }
    catch(e){ console.error(e); }
    Lab.busy = false;
    document.getElementById('activate-btn').disabled = !Lab.slots.a;
  }

  // called by the theater when it hands control back
  function afterExperiment(){
    Lab.slots.a = null; Lab.slots.b = null;
    renderSlot('a'); renderSlot('b');
    updateActivateState();
    clearLibraryHighlight();
    updateDiscoveredMarks();
    PTable.updateCount();
    updateFocus();
    PTable.playQueue();
  }

  // ------------------------------------------------------------------ hints
  function hintsFor(z){
    if(!z){
      return [
        { text:'Every object reacts differently. Try one on its own first — a massive star is a good start.', highlight:['massive'] },
        { text:'Some elements need two objects together. The densest objects in the universe get interesting in pairs.', highlight:['neutronA','neutronB'] },
        { text:'Stuck? Click any dark cell on the Discovery Map and its recipe loads for you.', highlight:[] },
      ];
    }
    const p = ElementProfiles.get(z);
    const objs = p.site.objs;
    const first = {
      bigbang:'This one is primordial — it was already here before any star existed.',
      nova:'Look for a small, violent explosion on the surface of a dead star.',
      spallation:'Stars destroy this element rather than make it. Something has to be shattered.',
      sunlike:'An ordinary star will do — this is what stars like the Sun spend their lives making.',
      agb:'Look for a star at the end of its life, puffing its outer layers away.',
      massive:'You need a star big enough to burn through layer after layer of fuel.',
      typeIa:'Iron-group metals come from a detonation, not from a star living quietly.',
      merger:'Ordinary fusion stalls well below this element. You need a flood of neutrons.',
      decay:'No star makes this directly — it appears when something heavier falls apart.',
      lab:'You will not find this in the cosmos in any lasting amount. Someone has to make it.',
    }[p.recipe];
    const second = {
      bigbang:'Try the early universe itself.', nova:'A white dwarf with a companion to steal gas from.',
      spallation:'Cosmic rays need something to hit.', sunlike:'Try a Sun-like star.',
      agb:'Try a red giant.', massive:'Try a massive star.', typeIa:'A white dwarf plus a companion star.',
      merger:'Two neutron stars, together.', decay:'Try radioactive rock on Earth.', lab:'Try a human laboratory.',
    }[p.recipe];
    return [
      { text:first, highlight:[] },
      { text:second, highlight:objs },
      { text:`Try ${objs.map(id=> OBJECTS.find(o=>o.id===id).label).join(' + ')}.`, highlight:objs },
    ];
  }

  function onHint(){
    const z = Lab.targetZ;
    const list = hintsFor(z);
    const key = z || 0;
    const idx = Lab.hintIndex[key] || 0;
    const entry = list[Math.min(idx, list.length-1)];
    const box = document.getElementById('hint-text');
    box.textContent = entry.text;
    box.classList.add('show');
    Lab.hintIndex[key] = Math.min(idx+1, list.length-1);
    if(entry.highlight && entry.highlight.length) highlightLibraryObjects(entry.highlight);
  }

  Object.assign(Lab, { OBJECTS, TARGETS, init, setTarget, afterExperiment, updateDiscoveredMarks, resolve, hintsFor });
  window.Lab = Lab;
})();
