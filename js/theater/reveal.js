// ==========================================================================
// REVEAL — Act III. The element itself: a studio-lit specimen showing what it
// really looks like (drag to turn it), its atom with real electron shells, the
// reaction that made it, where its atoms came from, and where you meet it
// today. Every element gets its own picture — never a stand-in.
// ==========================================================================
(function(){
  const V3 = (x,y,z)=> new THREE.Vector3(x,y,z);
  const $ = id=> document.getElementById(id);
  const el = (tag, cls, html)=>{ const e = document.createElement(tag); if(cls) e.className = cls; if(html!=null) e.innerHTML = html; return e; };

  const CAT_COLOR = {
    alkali:'#ff9e6b', alkaline:'#ffd27a', transition:'#8fc8ff', posttransition:'#9fe0c8',
    metalloid:'#c8b0ff', nonmetal:'#7fe0a8', halogen:'#a8e86a', noble:'#ff8fd0',
    lanthanide:'#ffb0d8', actinide:'#ff9a9a',
  };

  async function show(ctx){
    const p = ctx.el;
    const stage = ctx.root.sub('reveal');
    const accent = CAT_COLOR[p.category] || '#9fc4ff';

    // ---- environment: quiet, dark, studio-like
    ctx.cap('', '');
    ctx.hud(null); ctx.side(null);   // nothing from the forge should follow us in here
    FX.post.flash = 0;
    FX.post.bloomStrength = 0.72; FX.post.exposure = 1.0; FX.post.vignette = 0.5; FX.post.saturation = 1.02;
    Cosmos.fadeStars(0.22, 700); Cosmos.fadeNebula(0.08, 700);
    FX.cam.stopDrift();
    const wide = window.innerWidth > 900;
    FX.cam.set(V3(wide ? 1.15 : 0, 1.95, 6.6), V3(wide ? 0.62 : 0, 1.0, 0));

    // a soft dark backdrop so the specimen reads like a studio shot
    const back = new THREE.Mesh(new THREE.SphereBufferGeometry(120, 32, 16), new THREE.ShaderMaterial({
      side:THREE.BackSide, depthWrite:false,
      vertexShader:`varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader:`varying vec3 vD; void main(){ float y = vD.y*0.5+0.5;
        vec3 c = mix(vec3(0.004,0.006,0.013), vec3(0.03,0.042,0.075), smoothstep(0.1, 0.95, y));
        gl_FragColor = vec4(c, 1.0); }` }));
    stage.add(back);

    // ---- specimen
    Specimen.studio(stage);
    const spec = Specimen.build(stage, p, { target: 2.5 });
    // On a narrow screen the fact card takes the lower half, so the specimen
    // sits smaller and higher, in the space above it.
    const specScale = wide ? 1.0 : 0.55;
    spec.group.scale.setScalar(specScale*0.55);
    spec.group.rotation.y = -0.6;
    if(!wide) spec.group.position.y += 1.5;
    const spin = { v: 0.16, drag:false };
    stage.onFrame((dt)=>{ if(!spin.drag) spec.group.rotation.y += dt*spin.v; });

    // drag to turn the specimen
    const root = $('experiment-root');
    let dragging = false, lastX = 0, vel = 0;
    const onDown = e=>{ if(e.target.closest('.reveal-card') || e.target.closest('#exp-actions')) return; dragging = true; spin.drag = true; lastX = e.clientX; root.classList.add('grabbing'); };
    const onMove = e=>{ if(!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; spec.group.rotation.y += dx*0.008; vel = dx*0.008; };
    const onUp = ()=>{ if(!dragging) return; dragging = false; root.classList.remove('grabbing'); setTimeout(()=>{ spin.drag = false; }, 900); };
    root.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
    stage.track(()=>{ root.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); });

    // entrance
    FX.flash(0.28, accent, 3.4);
    Ambient.discoveryChime();
    await FX.animate(900, t=>{ spec.group.scale.setScalar(specScale*(0.55 + 0.45*t)); }, FX.ease.outBack);
    PTable.discover(p.z);

    // ---- the card
    const card = buildCard(ctx, p, accent);
    stage.dom(card, $('exp-body'));
    requestAnimationFrame(()=> card.classList.add('show'));
    const atomCanvas = card.querySelector('.atom-canvas');
    const atomAnim = Charts.atom(atomCanvas, p, { w:150, h:150, speed:0.8 });
    stage.track(()=> atomAnim.stop());

    // a caption under the specimen: what you are actually looking at
    const cap = el('div','spec-caption', `<b>What ${p.name.toLowerCase()} really looks like</b><span>${spec.caption}</span>`);
    stage.dom(cap, $('exp-body'));
    requestAnimationFrame(()=> cap.classList.add('show'));

    // ---- siblings forged in the same event
    const siblings = ElementProfiles.elementsForSite(p.recipe).filter(z=> z!==p.z && !PTable.discovered.has(z)).slice(0, 10);
    if(siblings.length){
      PTable.queueDiscovery(siblings);
      const row = el('div','sibling-row', `<span class="sib-label">Also forged here</span>` +
        siblings.map(z=>{ const s = ElementProfiles.get(z); return `<i title="${s.name}">${s.sym}</i>`; }).join(''));
      stage.dom(row, $('exp-body'));
      requestAnimationFrame(()=> row.classList.add('show'));
    }

    // ---- gold gets its closing journey; everything else returns to the forge
    if(p.z === 79){
      const go = await Promise.race([
        Theater.actionButton('Follow your gold', { cls:'gold' }).then(()=>'go'),
      ]);
      stage.dispose();
      if(go) await GoldJourney.run(p);
    } else {
      await Theater.actionButton('Return to the forge', { cls:'primary' });
      stage.dispose();
    }
  }

  function buildCard(ctx, p, accent){
    const last = p.steps[p.steps.length-1];
    const card = el('div','reveal-card');
    card.style.setProperty('--accent', accent);
    const phase = { solid:'Solid', liquid:'Liquid', gas:'Gas', unknown:'Unknown' }[p.phase] || '';
    const phaseNote = p.phase==='unknown' ? 'Never made in bulk' : phase + ' at room temperature';
    const massRow = p.mass ? `<div><b>${p.mass}</b><span>atomic mass</span></div>`
                           : `<div><b>${p.iso.half||'—'}</b><span>half-life of ${p.iso.label}</span></div>`;
    card.innerHTML = `
      <div class="rc-head">
        <div class="rc-sym">${p.sym}</div>
        <div class="rc-id">
          <div class="rc-name">${p.name}</div>
          <div class="rc-meta">Element ${p.z} · ${p.categoryLabel}</div>
          <div class="rc-badges"><i>${phaseNote}</i>${p.mass ? '' : '<i class="hot">Radioactive</i>'}</div>
        </div>
      </div>
      <div class="rc-atom">
        <canvas class="atom-canvas"></canvas>
        <div class="rc-atom-info">
          <div class="rc-row"><span>Nucleus shown</span><b>${p.iso.label}</b></div>
          <div class="rc-row"><span>Protons · neutrons</span><b>${p.z} · ${p.N}</b></div>
          <div class="rc-row"><span>Electron shells</span><b>${p.shells.join(' · ')}</b></div>
          ${massRow ? `<div class="rc-row rc-mass">${massRow}</div>` : ''}
        </div>
      </div>
      <div class="rc-block">
        <div class="rc-title">How it was made</div>
        <div class="rc-site">${p.site.label}<i>${p.where}</i></div>
        <div class="rc-eq">${ElementProfiles.equationHTML(last)}${last.half ? `<span class="nuc-half">${last.half}</span>` : ''}</div>
      </div>
      <div class="rc-block">
        <div class="rc-title">Where its atoms came from</div>
        <div class="rc-origin"></div>
      </div>
      <div class="rc-block rc-spec"></div>
      <div class="rc-block">
        <div class="rc-title">Where you meet it</div>
        <div class="rc-text">${p.today}</div>
      </div>
      <div class="rc-block">
        <div class="rc-title">Discovered</div>
        <div class="rc-text">${p.found}</div>
      </div>
      ${p.note ? `<div class="rc-note">${p.note}</div>` : ''}
      <div class="rc-block science-only">
        <div class="rc-title">The full chain</div>
        ${p.steps.map(s=>`<div class="rc-eq small">${ElementProfiles.equationHTML(s)}${s.half?`<span class="nuc-half">${s.half}</span>`:''}</div>`).join('')}
        ${p.lab ? `<div class="rc-row"><span>Made at</span><b>${p.lab.place}, ${p.lab.year}</b></div><div class="rc-row"><span>Quantity</span><b>${p.lab.atoms}</b></div>` : ''}
      </div>`;
    card.querySelector('.rc-origin').appendChild(Charts.originBar(p));
    const sp = Charts.spectrum(p);
    if(sp){ const b = card.querySelector('.rc-spec'); b.innerHTML = '<div class="rc-title">Its light</div>'; b.appendChild(sp); }
    else card.querySelector('.rc-spec').remove();
    return card;
  }

  window.Reveal = { show };
})();
