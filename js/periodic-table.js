// ==========================================================================
// PTABLE — renders the periodic table as the user's discovery map.
// Two instances share state: the compact intro table and the lab panel table.
// ==========================================================================
(function(){

  const ORIGIN_NOTE = {
    bbn: "Formed within minutes of the Big Bang, when the hot early universe cooled enough for nuclei to form.",
    star: "Built inside ordinary stars through nuclear fusion over their lifetimes.",
    massive: "Formed in the advanced fusion stages of massive stars, near the iron-group region.",
    rprocess: "Built by rapid neutron capture in extreme, neutron-rich environments such as neutron-star mergers.",
    synthetic: "Not found in nature in meaningful quantity — made artificially in laboratories.",
  };

  const PTable = {
    discovered: new Set([1,2,3]), // H, He, Li known from the start (Li shown faint)
    litFull: new Set([1,2]),      // fully-illuminated elements (Li starts faint, not here)
    cellsByZ: {}, // z -> array of {el, cellEl}
    onCellClick: null,            // set by lab.js: (z) => void — "show me how this is made"
  };

  function buildGrid(container, {compact=false, interactive=true} = {}){
    container.innerHTML = '';
    const cells = {};
    window.ELEMENTS.forEach(el=>{
      const cell = document.createElement('div');
      cell.className = 'pcell' + (el.z===79 ? ' au-cell' : '');
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
        cell.addEventListener('click', ()=>{ if(PTable.onCellClick) PTable.onCellClick(el.z); });
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
      const isLithiumFaint = el.z===3 && disc && !PTable.litFull.has(3);
      cell.classList.toggle('lit', disc && !isLithiumFaint);
      cell.classList.toggle('faint', isLithiumFaint);
    });
  }

  function discover(z, {pulse=true, showZ=true} = {}){
    if(PTable.discovered.has(z) && PTable.litFull.has(z)) { if(pulse) pulseCell(z); return; }
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
  }

  function pulseCell(z){
    Object.keys(PTable.cellsByZ).forEach(which=>{
      const cell = PTable.cellsByZ[which][z];
      if(cell) triggerPulse(cell);
    });
  }
  function triggerPulse(cell){
    cell.classList.remove('pulse');
    void cell.offsetWidth;
    cell.classList.add('pulse');
  }

  // Fills the table one element at a time rather than in a simultaneous
  // burst, so discovery visibly reads as progress across the whole table.
  function discoverMany(zs, opts={}){
    const stagger = opts.stagger || 320;
    zs.forEach((z,i)=> setTimeout(()=>discover(z, opts), i*stagger));
  }

  function updateCount(){
    const el = document.getElementById('ptable-count');
    if(el) el.textContent = `${PTable.discovered.size} / 118`;
    const list = document.getElementById('discovered-list');
    if(list){
      const syms = Array.from(PTable.discovered).sort((a,b)=>a-b)
        .map(z=> (window.ELEMENTS.find(e=>e.z===z)||{}).sym).filter(Boolean);
      list.innerHTML = syms.slice(-14).map(s=>`<b>${s}</b>`).join(' ');
    }
  }

  function elementByZ(z){ return window.ELEMENTS.find(e=>e.z===z); }

  let tooltipEl;
  function showTooltip(e, el){
    tooltipEl = tooltipEl || document.getElementById('elem-tooltip');
    if(!tooltipEl) return;
    const disc = PTable.discovered.has(el.z);
    const undiscoveredHint = el.origin==='synthetic'
      ? "Not found in nature — made artificially in laboratories."
      : "Not yet discovered in your forge. Click to see how it could be made.";
    tooltipEl.innerHTML = `<b>${el.name} (${el.sym})</b> — Z=${el.z}<br>` +
      (disc ? ORIGIN_NOTE[el.origin] : undiscoveredHint);
    tooltipEl.classList.add('show');
    positionTooltip(e);
  }
  function positionTooltip(e){
    if(!tooltipEl) return;
    let x = e.clientX + 16, y = e.clientY + 16;
    if(x + 230 > window.innerWidth) x = e.clientX - 246;
    if(y + 80 > window.innerHeight) y = e.clientY - 90;
    tooltipEl.style.left = x+'px'; tooltipEl.style.top = y+'px';
  }
  function hideTooltip(){ if(tooltipEl) tooltipEl.classList.remove('show'); }

  window.PTable = PTable;
  window.PTable.buildGrid = buildGrid;
  window.PTable.discover = discover;
  window.PTable.discoverMany = discoverMany;
  window.PTable.pulseCell = pulseCell;
  window.PTable.elementByZ = elementByZ;
  window.PTable.updateCount = updateCount;
  window.PTable.ORIGIN_NOTE = ORIGIN_NOTE;
})();
