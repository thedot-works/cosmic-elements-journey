// ==========================================================================
// PTABLE — the Discovery Map: all 118 elements, dark until you make them.
// Clicking any cell loads that element's recipe into the forge. New
// discoveries from an experiment light up one at a time when you return,
// so the table visibly fills rather than flickering all at once.
// ==========================================================================
(function(){

  const PTable = {
    discovered: new Set([1,2,3]),   // hydrogen, helium and a trace of lithium were already here
    litFull: new Set([1,2]),        // lithium starts faint: the Big Bang made only a little
    cellsByZ: {},
    onCellClick: null,
    pending: [],
  };

  function buildGrid(container, {compact=false, interactive=true} = {}){
    container.innerHTML = '';
    const cells = {};
    window.ELEMENTS.forEach(el=>{
      const cell = document.createElement('div');
      cell.className = 'pcell cat-' + el.category + (el.z===79 ? ' au-cell' : '');
      cell.style.gridColumn = el.group;
      cell.style.gridRow = el.period;
      cell.textContent = el.sym;
      cell.dataset.z = el.z;
      cell.dataset.sym = el.sym;
      const zTag = document.createElement('span');
      zTag.className = 'z'; zTag.textContent = el.z;
      cell.appendChild(zTag);
      container.appendChild(cell);
      cells[el.z] = cell;

      if(interactive){
        cell.addEventListener('mouseenter', (e)=> showTooltip(e, el));
        cell.addEventListener('mousemove', (e)=> positionTooltip(e));
        cell.addEventListener('mouseleave', hideTooltip);
      }
      if(interactive && !compact){
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', ()=>{ hideTooltip(); if(PTable.onCellClick) PTable.onCellClick(el.z); });
      }
    });
    PTable.cellsByZ[compact ? 'intro' : 'lab'] = cells;
    applyState(compact ? 'intro' : 'lab');
    return cells;
  }

  function applyState(which){
    const cells = PTable.cellsByZ[which];
    if(!cells) return;
    window.ELEMENTS.forEach(el=>{
      const cell = cells[el.z];
      const disc = PTable.discovered.has(el.z);
      const faint = el.z===3 && disc && !PTable.litFull.has(3);
      cell.classList.toggle('lit', disc && !faint);
      cell.classList.toggle('faint', faint);
    });
  }

  function discover(z, {pulse=true, showZ=true} = {}){
    if(PTable.discovered.has(z) && PTable.litFull.has(z)){ if(pulse) pulseCell(z); return false; }
    PTable.discovered.add(z);
    PTable.litFull.add(z);
    Object.keys(PTable.cellsByZ).forEach(which=>{
      const cell = PTable.cellsByZ[which][z];
      if(!cell) return;
      cell.classList.add('lit');
      cell.classList.remove('faint');
      if(showZ) cell.classList.add('show-z');
      if(pulse) triggerPulse(cell);
    });
    updateCount();
    return true;
  }

  function pulseCell(z){
    Object.keys(PTable.cellsByZ).forEach(which=>{
      const cell = PTable.cellsByZ[which][z];
      if(cell) triggerPulse(cell);
    });
  }
  function triggerPulse(cell){ cell.classList.remove('pulse'); void cell.offsetWidth; cell.classList.add('pulse'); }

  function discoverMany(zs, opts={}){
    const stagger = opts.stagger || 320;
    zs.forEach((z,i)=> setTimeout(()=> discover(z, opts), i*stagger));
  }

  // Discoveries made while the map was hidden: they light up one at a time
  // when the player comes back to the lab.
  function queueDiscovery(zs){
    zs.forEach(z=>{ if(!PTable.discovered.has(z) && !PTable.pending.includes(z)) PTable.pending.push(z); });
  }
  function playQueue(){
    if(!PTable.pending.length) return;
    const list = PTable.pending.slice();
    PTable.pending.length = 0;
    list.forEach((z,i)=> setTimeout(()=>{
      if(discover(z)){ Ambient.tick(); flashTicker(z); }
    }, 240 + i*280));
  }

  function flashTicker(z){
    const el = document.getElementById('discovered-latest');
    if(!el) return;
    const p = window.ELEMENTS.find(e=>e.z===z);
    el.textContent = p ? p.sym : '';
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }

  function updateCount(){
    const el = document.getElementById('ptable-count');
    if(el) el.textContent = `${PTable.discovered.size} / 118`;
    const list = document.getElementById('discovered-list');
    if(list){
      const syms = Array.from(PTable.discovered).sort((a,b)=>a-b)
        .map(z=> (window.ELEMENTS.find(e=>e.z===z)||{}).sym).filter(Boolean);
      list.innerHTML = syms.slice(-16).map(s=>`<b>${s}</b>`).join(' ');
    }
    const bar = document.getElementById('ptable-progress');
    if(bar) bar.style.width = (PTable.discovered.size/118*100).toFixed(1) + '%';
  }

  function elementByZ(z){ return window.ELEMENTS.find(e=>e.z===z); }

  let tooltipEl;
  function showTooltip(e, el){
    tooltipEl = tooltipEl || document.getElementById('elem-tooltip');
    if(!tooltipEl) return;
    const p = window.ElementProfiles ? ElementProfiles.get(el.z) : null;
    const disc = PTable.discovered.has(el.z);
    let body;
    if(p){
      const main = Object.entries(p.mix).sort((a,b)=>b[1]-a[1])[0];
      const origin = ElementProfiles.ORIGINS[main[0]].label;
      body = disc
        ? `<i>${origin}</i>${p.today}`
        : `<i>${origin}</i>Click to load the recipe and watch it being made.`;
    } else {
      body = disc ? '' : 'Click to see how it is made.';
    }
    tooltipEl.innerHTML = `<b>${el.name} (${el.sym})</b> — Z=${el.z}<br>${body}`;
    tooltipEl.classList.add('show');
    positionTooltip(e);
  }
  function positionTooltip(e){
    if(!tooltipEl) return;
    let x = e.clientX + 16, y = e.clientY + 16;
    if(x + 250 > window.innerWidth) x = e.clientX - 262;
    if(y + 96 > window.innerHeight) y = e.clientY - 104;
    tooltipEl.style.left = x+'px'; tooltipEl.style.top = y+'px';
  }
  function hideTooltip(){ if(tooltipEl) tooltipEl.classList.remove('show'); }

  Object.assign(PTable, { buildGrid, discover, discoverMany, queueDiscovery, playQueue, pulseCell, elementByZ, updateCount, applyState });
  window.PTable = PTable;
})();
