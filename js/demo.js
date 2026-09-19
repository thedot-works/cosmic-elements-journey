// ==========================================================================
// DEMO — a hands-free guided tour of the real application, for recording a
// showcase without anyone having to drive it.
//
// The tour runs itself for about four minutes: a simulated cursor moves to
// the real controls and clicks them, a narration band explains what is on
// screen, and the app behaves exactly as it does for a visitor. Nothing here
// fakes a result — every scene is the app's own.
//
// Three ways to start it, because the easiest one depends on how the page was
// opened — a file opened by double-clicking has an unwieldy path in the
// address bar, and nobody wants to edit that with a recorder running:
//
//   press D          starts the tour, any time, no URL to edit
//   ?demo / #demo    starts it automatically on load
//   &nocursor        hide the simulated pointer
//   &speed=N         scale the app's internal pacing (default 0.38)
//   &minutes=N       stretch or compress the whole cut (default 4)
// ==========================================================================
(function(){
  // accept the options from either the query string or the hash, so
  // "…journey.html#demo&minutes=5" works as well as "?demo&minutes=5"
  const params = new URLSearchParams(
    (location.search || '').replace(/^\?/, '') + '&' + (location.hash || '').replace(/^#/, '')
  );
  const AUTO = params.has('demo');

  const SPEED = parseFloat(params.get('speed') || '0.38');
  // The tour is written against an absolute clock rather than a chain of
  // sleeps, so it lands on four minutes even though the scenes it is
  // narrating take slightly different times on different machines: if a beat
  // overruns its slot the next one simply starts late and the following
  // pace() call absorbs it.
  const TOTAL = parseFloat(params.get('minutes') || '4') * 60;
  const SHOW_CURSOR = !params.has('nocursor');
  const $ = s=> document.querySelector(s);
  const el = (tag, cls, html)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; };
  const sleep = ms=> new Promise(r=> setTimeout(r, ms));

  let cursor = null, band = null, bandText = null, started = false;

  function build(){
    const root = el('div','demo-root');
    band = el('div','demo-band');
    band.innerHTML = `<div class="demo-chapter"></div><div class="demo-say"></div>`;
    bandText = band.querySelector('.demo-say');
    root.appendChild(band);
    if(SHOW_CURSOR){
      cursor = el('div','demo-cursor');
      root.appendChild(cursor);
      cursor.style.left = (window.innerWidth*0.5)+'px';
      cursor.style.top  = (window.innerHeight*0.62)+'px';
    }
    document.body.appendChild(root);
  }

  function chapter(text){
    const c = band.querySelector('.demo-chapter');
    c.textContent = text || '';
    c.style.display = text ? '' : 'none';
  }
  function say(text){
    band.classList.add('show');
    bandText.innerHTML = text;
    lastSayAt = clock();
  }
  function hideBand(){ band.classList.remove('show'); }

  // Glide the pointer to an element and press it, so a recording shows the
  // interface being used rather than driving itself by magic.
  async function moveTo(node){
    if(!cursor || !node) return;
    const r = node.getBoundingClientRect();
    cursor.style.left = (r.left + r.width/2) + 'px';
    cursor.style.top  = (r.top + r.height/2) + 'px';
    await sleep(760);
  }
  async function press(node){
    if(!node) return false;
    await moveTo(node);
    if(cursor){
      cursor.classList.add('click');
      setTimeout(()=> cursor && cursor.classList.remove('click'), 420);
    }
    await sleep(160);
    node.click();
    await sleep(240);
    return true;
  }
  const pressSel = async sel=> press($(sel));

  // Wait for a condition, but never hang the tour on it.
  async function until(fn, timeout=60000, step=220){
    const t0 = Date.now();
    while(Date.now() - t0 < timeout){
      if(fn()) return true;
      await sleep(step);
    }
    return false;
  }

  // Let a sequence play for a while, auto-answering any choice prompt the
  // same way a visitor would, then move on.
  async function watch(ms, opts={}){
    const t0 = Date.now();
    while(Date.now() - t0 < ms){
      const pick = $('.choice-btn.recommended') || $('.choice-btn');
      if(pick){ await press(pick); continue; }
      if(opts.onTick) opts.onTick(Date.now() - t0);
      await sleep(260);
    }
  }

  // ---- the tour clock -------------------------------------------------
  let T0 = 0, lastSayAt = -99;
  const clock = ()=> (Date.now() - T0)/1000;
  const MIN_SAY = 5.5;   // no narration line is ever on screen for less than this
  // Hold until the tour clock reaches this mark, answering prompts while we
  // wait. Returns immediately if the mark has already passed, so a slow
  // machine loses slack rather than drifting the whole schedule — except
  // that the current line always gets long enough to be read, otherwise a
  // beat that overran upstream would flash the next one past the viewer.
  async function pace(mark, minSay = MIN_SAY){
    const target = Math.max(mark, lastSayAt + minSay);
    while(clock() < target){
      const pick = $('.choice-btn.recommended') || $('.choice-btn');
      if(pick){ await press(pick); continue; }
      await sleep(240);
    }
  }
  // Both at once: wait for something to appear, but never past this mark.
  async function paceUntil(fn, mark){
    while(clock() < mark && !fn()){
      const pick = $('.choice-btn.recommended') || $('.choice-btn');
      if(pick){ await press(pick); continue; }
      await sleep(240);
    }
    return fn();
  }

  // Fast-forward whatever act is running, the way the Skip control does.
  function skip(){ if(window.Theater && Theater.busy) Theater.skip = true; }

  async function titleCard(title, sub, ms){
    const card = el('div','demo-title', `<b>${title}</b><span>${sub}</span>`);
    document.body.appendChild(card);
    requestAnimationFrame(()=> card.classList.add('show'));
    await sleep(ms);
    card.classList.remove('show');
    await sleep(900);
    card.remove();
  }

  // ------------------------------------------------------------------ tour
  // Marks are seconds on the tour clock, for a four-minute cut.
  const M = (f)=> TOTAL * f;

  async function run(){
    if(started) return; started = true;
    build();
    FX.timeScale = SPEED;
    T0 = Date.now();

    // ---- 0:00 — title
    await titleCard('Cosmic Elements Journey',
      'Every element in the periodic table, and the real reaction that made it', 5200);

    // ---- 0:07 — the premise, over the intro cinematic
    chapter('The premise');
    say('Every atom heavier than helium was forged somewhere — inside a star, or in a collision between two dead ones. This is a tour of where each one came from.');
    await pace(M(0.058));                      // ~0:14
    await pressSel('#skip-intro');
    await until(()=> document.getElementById('lab-root').classList.contains('active'), 30000);

    // ---- 0:15 — the workspace
    chapter('The Forge');
    say('The workspace has three parts: the cosmic objects on the left, the forge in the middle, and the discovery map of all 118 elements below.');
    await moveTo($('#object-library'));
    await pace(M(0.083));                      // ~0:20
    say('Those objects are real astrophysical sites — main-sequence stars, red giants, white dwarfs, neutron stars, cosmic rays.');
    await moveTo($('.ptable-panel'));
    await pace(M(0.117));                      // ~0:28
    say('Every cell on the map is an element waiting to be made. Three are lit at the start: the hydrogen, helium and lithium the Big Bang produced.');
    await pace(M(0.15));                       // ~0:36

    // ---- 0:36 — build a chosen element
    chapter('Building a chosen element');
    say('Pick any element and the app loads the recipe that actually makes it. Carbon is built inside ageing low-mass stars.');
    await press($('#lab-ptable .pcell[data-z="6"]'));
    await pace(M(0.183));                      // ~0:44
    say('The forge fills in the objects the reaction needs, and the result slot shows the element itself, rendered as it really looks.');
    await pace(M(0.208));                      // ~0:50
    await pressSel('#activate-btn');
    await until(()=> document.getElementById('experiment-root').classList.contains('active'), 40000);

    say('This is the star that makes it, and the triple-alpha reaction running inside it — nucleus by nucleus, with the equations underneath.');
    await pace(M(0.30));                       // ~1:12
    say('Every element ends on its own reveal: what it looks like in the hand, its atom, the reaction that made it, and where you meet it today.');
    skip();
    await paceUntil(()=> !!$('.reveal-card.show'), M(0.36));
    await pace(M(0.395));                      // ~1:35
    await press($('#exp-actions .exp-btn'));
    await until(()=> !document.getElementById('experiment-root').classList.contains('active'), 30000);

    // ---- 1:36 — free play
    chapter('Free play — combining objects');
    say('You can also work the other way round: combine two cosmic objects and see what the universe does with them. Two neutron stars, for instance.');
    await press($('.cosmic-obj[data-id="neutronA"]'));
    await press($('.cosmic-obj[data-id="neutronB"]'));
    await pace(M(0.43));                       // ~1:43
    await pressSel('#activate-btn');
    await until(()=> document.getElementById('experiment-root').classList.contains('active'), 40000);

    chapter('A neutron-star merger');
    say('Two dead stars spiral together, radiating gravitational waves — the event LIGO and Virgo caught in August 2017.');
    await pace(M(0.50));                       // ~2:00
    say('Then the merger, and the kilonova it throws out: neutron-rich debris, thousands of Earth-masses of it.');
    await pace(M(0.565));                      // ~2:16

    say('And here is what it actually makes — not one element. A single collision forges most of the heavy half of the periodic table at once.');
    await paceUntil(()=> !!$('.yield-chip'), M(0.72));
    await pace(M(0.75));                       // ~3:00

    // ---- 2:48 — the r-process
    chapter('The r-process');
    say('It then follows one of them down to the nucleus and walks through the r-process — rapid neutron capture — with the physics written out on the right.');
    await paceUntil(()=> !!$('.explain-card'), M(0.80));
    await pace(M(0.835));                      // ~3:20
    say('An iron seed swallows neutrons faster than it can decay. Then, with none left to catch, it turns its own neutrons into protons — climbing one element with every flip.');
    await pace(M(0.88));                       // ~3:31

    // ---- 3:28 — gold, and the closing act
    chapter('Follow your gold');
    skip();
    await paceUntil(()=> !!$('.reveal-card.show'), M(0.93));
    say('Gold is the one it follows all the way home.');
    await pace(M(0.945));                      // ~3:47
    await press($('#exp-actions .exp-btn.gold') || $('#exp-actions .exp-btn'));
    say('Out of the collision, into the Milky Way, into the cloud that became the Sun — and into the Earth, which inherited it.');
    // The piece is meant to end on Earth, so wait for that frame properly
    // rather than on a fraction of the total: on a slow machine the closing
    // scenes take longer to build, and ending on time on the wrong image
    // would be the worse trade. On normal hardware this adds nothing.
    await paceUntil(()=> !!$('.age-compare'), clock() + 75);
    await pace(clock() + 5);

    hideBand();
    await sleep(900);
    await titleCard('118 elements, 118 real recipes',
      'Every one with its own formation site, its own reaction chain, and its own specimen', 7000);
  }

  // The tour only starts once the scene is up and the app has booted.
  function startWhenReady(){
    const go = ()=>{
      if(window.FX && window.Theater && window.Lab && document.getElementById('skip-intro')) run();
      else setTimeout(go, 200);
    };
    setTimeout(go, AUTO ? 900 : 0);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    if(AUTO){ startWhenReady(); return; }
    // Otherwise wait for D. Plain D only — Ctrl/Cmd/Alt combinations belong
    // to the browser, and the app itself only listens for Enter and Escape.
    document.addEventListener('keydown', e=>{
      if(started) return;
      if(e.key !== 'd' && e.key !== 'D') return;
      if(e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      startWhenReady();
    });
  });

  // so a recording script (or the console) can trigger it too
  window.Demo = { run: startWhenReady, isRunning: ()=> started };
})();
