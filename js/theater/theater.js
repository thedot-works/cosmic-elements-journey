// ==========================================================================
// THEATER — runs one "forge" performance: the cosmic site that makes the
// chosen element (Act I), the nuclear reaction itself (Act II), and the
// element reveal (Act III). Owns the overlay, captions, keyboard (Enter to
// advance, Esc to skip), scene cleanup and the return to the lab.
// ==========================================================================
(function(){
  const Theater = { busy:false, skip:false, closeRequested:false, ctx:null };
  const el = (tag, cls, html)=>{ const e = document.createElement(tag); if(cls) e.className = cls; if(html!=null) e.innerHTML = html; return e; };
  const $ = id=> document.getElementById(id);

  // ---------------------------------------------------------------- overlay
  function open(){
    Cosmos.stopAutoOrbit();
    document.getElementById('lab-root').classList.add('dimmed');
    const root = $('experiment-root');
    root.classList.add('active');
    ['exp-body','exp-hud','exp-side','exp-foot','exp-actions','fx-labels'].forEach(id=>{ const n = $(id); if(n) n.innerHTML = ''; });
    caption('', '');
    $('exp-skip').classList.add('show');
  }
  function close(){
    $('experiment-root').classList.remove('active');
    document.getElementById('lab-root').classList.remove('dimmed');
    $('exp-skip').classList.remove('show');
    ['exp-body','exp-hud','exp-side','exp-foot','exp-actions','fx-labels'].forEach(id=>{ const n = $(id); if(n) n.innerHTML = ''; });
  }
  function caption(l1, l2){
    if(l1 != null) $('exp-caption-1').textContent = l1;
    if(l2 != null) $('exp-caption-2').textContent = l2;
  }

  // ---------------------------------------------------------------- keyboard + actions
  let primaryAction = null;
  function setPrimary(fn){ primaryAction = fn; }
  document.addEventListener('keydown', e=>{
    if(e.key === 'Enter'){
      if(primaryAction){ e.preventDefault(); const f = primaryAction; primaryAction = null; f(); }
    } else if(e.key === 'Escape'){
      if(Theater.busy){ Theater.skip = true; }
    }
  });

  function actionButton(label, opts={}){
    return new Promise(resolve=>{
      const wrap = $('exp-actions');
      const btn = el('div', 'exp-btn ' + (opts.cls||'primary'), `${label}<i class="kbd">⏎</i>`);
      wrap.appendChild(btn);
      const go = ()=>{ setPrimary(null); wrap.innerHTML = ''; resolve(true); };
      btn.addEventListener('click', go, { once:true });
      setPrimary(go);
    });
  }
  function choice(options){
    return new Promise(resolve=>{
      const wrap = $('exp-actions');
      wrap.innerHTML = '';
      const row = el('div','choice-row');
      let rec = null;
      options.forEach(o=>{
        const b = el('div','choice-btn'+(o.recommended?' recommended':''), o.label + (o.recommended ? '<i class="kbd">⏎</i>' : ''));
        b.addEventListener('click', ()=>{ setPrimary(null); wrap.innerHTML=''; resolve(o.id); }, { once:true });
        row.appendChild(b);
        if(o.recommended) rec = o;
      });
      wrap.appendChild(row);
      if(rec) setPrimary(()=>{ wrap.innerHTML=''; resolve(rec.id); });
    });
  }

  // ---------------------------------------------------------------- run context
  function makeCtx(stage, profile){
    let explainNode = null;   // the plain-english "what's happening" card, if shown
    const ctx = {
      stage, el: profile,
      get sci(){ return true; },   // all the detail, all the time
      skipped: ()=> Theater.skip,
      cap: caption,
      // Polls in short slices rather than one long setTimeout so that a Skip
      // click (or Esc) mid-wait is noticed within ~80ms instead of only at
      // the next wait() call — otherwise Skip appears to do nothing until
      // whatever multi-second wait happened to be running finally elapses.
      wait(ms){
        if(Theater.skip) return new Promise(r=> setTimeout(r, Math.min(40, ms)));
        const total = ms * FX.timeScale;
        return new Promise(resolve=>{
          let elapsed = 0;
          const STEP = 80;
          const tick = ()=>{
            if(Theater.skip || elapsed >= total || !ctx.stage){ resolve(); return; }
            const next = Math.min(STEP, total - elapsed);
            elapsed += next;
            ctx.stage.timeout(tick, next);
          };
          tick();
        });
      },
      // swap the 3-D scene: everything the previous act built is disposed
      newScene(name){
        if(ctx.stage) ctx.stage.dispose();
        // never let a flash from the last beat bleed over the next one
        FX.post.flash = 0;
        ctx.stage = ctx.root.sub(name||'scene');
        return ctx.stage;
      },
      // a centred cinematic line that fades itself out
      say(html, opts={}){
        const d = el('div', 'cine-text ' + (opts.cls||'mid') + ' show', html);
        if(opts.top) d.style.top = opts.top;
        ctx.stage.dom(d, $('exp-body'));
        if(opts.hold !== false) ctx.stage.timeout(()=>{ d.classList.remove('show'); ctx.stage.timeout(()=> d.remove(), 900); }, opts.ms||2600);
        return d;
      },
      hud(html){
        const n = $('exp-hud');
        if(html == null) { n.innerHTML = ''; return null; }
        n.innerHTML = `<div class="hud-card">${html}</div>`;
        return n.firstChild;
      },
      readout(html){
        let r = $('exp-hud').querySelector('.readout');
        if(!r){ r = el('div','readout'); $('exp-hud').appendChild(r); }
        r.innerHTML = html;
        return r;
      },
      side(node){
        const n = $('exp-side');
        if(node === null){ n.innerHTML = ''; explainNode = null; return; }
        n.appendChild(node);
        requestAnimationFrame(()=> node.classList.add('show'));
        return node;
      },
      // A short plain-English note on what the reaction is actually doing
      // right now — lives next to the chart on the right. Calling it again
      // updates the same card in place rather than stacking new ones; pass
      // null to remove it early.
      explain(html){
        const host = $('exp-side');
        if(!host) return null;
        if(html == null){ if(explainNode){ explainNode.remove(); explainNode = null; } return null; }
        if(!explainNode){
          explainNode = el('div', 'explain-card', `<div class="explain-label">WHAT'S HAPPENING</div><div class="explain-body"></div>`);
          host.appendChild(explainNode);
          requestAnimationFrame(()=> explainNode.classList.add('show'));
        }
        explainNode.querySelector('.explain-body').innerHTML = html;
        return explainNode;
      },
      chart(opts){
        const c = Charts.nuclide(opts);
        ctx.side(c.el);
        return c;
      },
      async nuclear(steps, opts={}){
        const r = await Nuclear.play(ctx, steps || (profile && profile.steps) || [], Object.assign({ hudParent: $('exp-foot') }, opts));
        return r;
      },
      button: actionButton,
      choice,
      flash: FX.flash,
      discover(z){ PTable.discover(z); },
      queue(zs){ PTable.queueDiscovery(zs); },
    };
    return ctx;
  }

  // ---------------------------------------------------------------- the run
  // opts: { site, z (element to feature or null), mode:'target'|'free'|'teach', objects:[ids], label }
  async function run(opts){
    if(Theater.busy) return;
    Theater.busy = true; Theater.skip = false; Theater.closeRequested = false;
    const profile = opts.z ? ElementProfiles.get(opts.z) : null;
    const root = FX.stage('run:' + opts.site + (opts.z||''));
    const stage = root.sub('site');
    const ctx = makeCtx(stage, profile);
    ctx.root = root;
    Theater.ctx = ctx;
    ctx.mode = opts.mode || 'free';
    ctx.site = opts.site;
    open();
    const restore = { star: Cosmos.layers.stars[0].u.uOpacity.value, neb: Cosmos.layers.nebula.children[0].material.opacity,
      bloom: FX.post.bloomStrength, exposure: FX.post.exposure, sat: FX.post.saturation, vig: FX.post.vignette };
    try {
      const seq = window.Sites[opts.site];
      if(!seq) throw new Error('no sequence for site '+opts.site);
      await seq(ctx);
      if(profile && ctx.reveal !== false && !Theater.closeRequested){
        Theater.skip = false;
        if(ctx.stage) ctx.stage.dispose();
        await Reveal.show(ctx);
      }
    } catch(e){
      console.error('[theater]', e);
    }
    // restore the environment and hand control back to the lab
    FX.post.bloomStrength = restore.bloom; FX.post.exposure = restore.exposure;
    FX.post.saturation = restore.sat; FX.post.vignette = restore.vig;
    Cosmos.setStarOpacity(restore.star); Cosmos.setNebulaOpacity(restore.neb);
    FX.cam.stopDrift();
    root.dispose();
    close();
    Theater.busy = false; Theater.skip = false; Theater.closeRequested = false; setPrimary(null);
    Cosmos.autoOrbitCamera(420, 30, 0.00028);
    if(window.Lab && Lab.afterExperiment) Lab.afterExperiment();
  }

  // Skip — fast-forwards to the reveal (or, during the gold journey's
  // closing act, bails straight back to the Forge; see gold-journey.js).
  document.addEventListener('DOMContentLoaded', ()=>{
    const s = $('exp-skip');
    if(s) s.addEventListener('click', ()=>{ if(Theater.busy) Theater.skip = true; });
  });

  // ---------------------------------------------------------------- ExpUI (used by the gold journey)
  const ExpUI = {
    open, close, caption,
    body(){ return $('exp-body'); },
    async verdict({word, cls, sub, next}){
      const box = el('div','exp-verdict', `<div class="verdict-word ${cls}">${word}</div><div class="verdict-sub">${sub}</div>` +
        (next ? `<div class="verdict-next">${next}</div>` : ''));
      $('exp-body').appendChild(box);
      await actionButton('Return to the Forge', { cls:'ghost' });
      box.remove();
    },
  };

  window.Theater = Theater;
  Theater.run = run;
  Theater.actionButton = actionButton;
  Theater.choice = choice;
  Theater.setPrimary = setPrimary;
  window.ExpUI = ExpUI;
})();
