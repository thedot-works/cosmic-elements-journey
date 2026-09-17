// ==========================================================================
// INTRO — fast (~12s) cinematic autoplay. Same persistent environment as
// the lab; nothing here is a separate page or scene cut. Ends by handing
// control to App.enterLab().
// ==========================================================================
(function(){
  const sleep = ms => new Promise(r=>setTimeout(r, ms));
  let skipped = false;
  let finished = false;

  function stackEl(){ return document.getElementById('intro-stack'); }

  function setText(html, opts={}){
    const stack = stackEl();
    stack.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'cine-text ' + (opts.cls||'big');
    div.innerHTML = html;
    stack.appendChild(div);
    requestAnimationFrame(()=> div.classList.add('show'));
    return div;
  }
  function clearText(){ const s = stackEl(); s.innerHTML=''; }

  async function typeGlyphs(list){
    const stack = stackEl();
    stack.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'glyph-row';
    stack.appendChild(row);
    for(const g of list){
      const d = document.createElement('div');
      d.className = 'elem-glyph' + (g.tiny?' tiny':'');
      d.innerHTML = `<div class="sym">${g.sym}</div><div class="name">${g.name}</div>`;
      row.appendChild(d);
      await sleep(40);
      requestAnimationFrame(()=> d.classList.add('show'));
      await sleep(g.tiny?170:300);
    }
  }

  async function flashSymbols(list){
    const el = document.getElementById('flash-symbols');
    el.innerHTML = list.map(s=>`<span data-s="${s}">${s}</span>`).join('');
    const spans = [...el.children];
    for(const s of spans){ s.classList.add('on'); if(s.dataset.s==='Au') s.classList.add('au'); await sleep(110); }
    await sleep(350);
    spans.forEach(s=>s.classList.remove('on'));
    await sleep(250);
    el.innerHTML = '';
  }

  async function run(){
    if(skipped) return;
    document.getElementById('skip-intro').addEventListener('click', ()=>{ skipped = true; finish(); });

    Cosmos.camera.position.set(0,0,420);
    Cosmos.setNebulaOpacity(0.15);

    await sleep(300);
    if(skipped) return;
    setText('13.8 Billion Years Ago', {cls:'big'});
    await sleep(1100);
    if(skipped) return;
    clearText();

    // Hot early universe cooling → particles combine → first elements
    await typeGlyphs([
      {sym:'H', name:'Hydrogen'},
      {sym:'He', name:'Helium'},
      {sym:'Li', name:'Lithium', tiny:true},
    ]);
    await sleep(500);
    if(skipped) return;
    clearText();

    // Periodic table materializes, only H/He/Li lit
    const introTable = document.getElementById('intro-ptable');
    if(!introTable.children.length) PTable.buildGrid(introTable, {compact:true, interactive:false});
    introTable.style.opacity = 1;
    await sleep(700);
    if(skipped) return;

    await flashSymbols(['C','O','Fe','Ag','Au','U']);
    if(skipped) return;

    setText('If the universe started with so little...', {cls:'mid'});
    await sleep(1400);
    if(skipped) return;
    setText('Where did everything else come from?', {cls:'big rise'});
    await sleep(1500);
    if(skipped) return;
    clearText();

    // Table dominant, Au pulses
    introTable.style.transform = 'translate(-50%,-50%) scale(1.08)';
    const auCell = introTable.querySelector('.au-cell');
    if(auCell){ auCell.classList.add('lit'); triggerAuPulse(auCell); }
    await sleep(900);
    if(skipped) return;

    setText('How did the universe create Gold?', {cls:'big gold'});
    await sleep(1600);
    if(skipped) return;
    clearText();

    // Dissolve table into particles / stars, quiet
    dissolveTable(introTable);
    await sleep(700);
    if(skipped) return;

    setText('You Are The Universe.', {cls:'big'});
    await sleep(1000);
    if(skipped) return;
    const sub = document.createElement('div');
    sub.className = 'cine-text mid show';
    sub.style.top = '58%';
    sub.textContent = 'Build the elements. Discover what the cosmos can create.';
    stackEl().appendChild(sub);
    await sleep(1300);
    if(skipped) return;

    finish();
  }

  function triggerAuPulse(cell){
    if(skipped) return;
    cell.classList.remove('pulse'); void cell.offsetWidth; cell.classList.add('pulse');
    setTimeout(()=>{ if(!skipped && document.body.contains(cell)) triggerAuPulse(cell); }, 1500);
  }

  function dissolveTable(introTable){
    const rect = introTable.getBoundingClientRect();
    introTable.style.transition = 'opacity 1.4s ease, transform 1.4s ease';
    introTable.style.opacity = 0;
    introTable.style.transform = 'translate(-50%,-50%) scale(0.7)';
    Cosmos.spawnBurst({ position: new THREE.Vector3(0,0,0), count: 260, color:0x9fc0ff, spread:10, speed:90, size:2.4, life:2.4 });
  }

  function finish(){
    if(finished) return;
    finished = true;
    const skipBtn = document.getElementById('skip-intro');
    if(skipBtn) skipBtn.style.display = 'none';
    document.getElementById('intro-root').style.transition = 'opacity 1.2s ease';
    document.getElementById('intro-root').style.opacity = 0;
    setTimeout(()=>{
      document.getElementById('intro-root').style.display = 'none';
      window.App.enterLab();
    }, 1000);
  }

  window.Intro = { run };
})();
