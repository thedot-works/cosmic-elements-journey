// ==========================================================================
// CHARTS — the 2-D companions to the 3-D scenes: an animated Bohr atom with
// the element's real electron shells, its origin mix, its visible emission
// spectrum, a schematic chart of nuclides that traces s-process, r-process
// and decay paths, and a supernova light curve.
// ==========================================================================
(function(){
  const DPR = ()=> Math.min(2, window.devicePixelRatio||1);

  function fit(canvas, w, h){
    const d = DPR();
    canvas.width = w*d; canvas.height = h*d;
    canvas.style.width = w+'px'; canvas.style.height = h+'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(d,0,0,d,0,0);
    return ctx;
  }

  // ---------------------------------------------------------------- Bohr atom
  // Nucleus with the real proton/neutron count, and electrons in their real shells.
  function atom(canvas, profile, opts={}){
    const w = opts.w||300, h = opts.h||300;
    const ctx = fit(canvas, w, h);
    const shells = profile.shells;
    const cx = w/2, cy = h/2;
    const maxR = Math.min(w,h)/2 - 12;
    const nucR = Math.max(9, Math.min(22, 8 + Math.pow(profile.iso.A, 0.33)*2.4));
    let raf = null, t0 = performance.now();
    const speeds = shells.map((n,i)=> 0.5/(i+1.1) * (opts.speed||1));

    function draw(){
      const t = (performance.now()-t0)/1000;
      ctx.clearRect(0,0,w,h);
      // shells
      shells.forEach((count, i)=>{
        const r = nucR + 12 + (maxR-nucR-12) * ((i+1)/shells.length);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(150,180,255,0.16)';
        ctx.lineWidth = 1;
        ctx.stroke();
        const shown = Math.min(count, 18);
        for(let k=0;k<shown;k++){
          const a = (k/shown)*Math.PI*2 + t*speeds[i] + i*0.6;
          const x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r*0.92;
          const g = ctx.createRadialGradient(x,y,0,x,y,4.6);
          g.addColorStop(0,'rgba(190,225,255,1)'); g.addColorStop(0.5,'rgba(120,180,255,0.75)'); g.addColorStop(1,'rgba(90,150,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(x,y,4.6,0,Math.PI*2); ctx.fill();
        }
        if(count > shown){
          ctx.fillStyle = 'rgba(160,190,255,0.5)';
          ctx.font = '9px -apple-system, Segoe UI, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('×'+count, cx, cy - r + 10);
        }
      });
      // nucleus: protons and neutrons as a tight cluster
      const A = profile.iso.A, Z = profile.z;
      const rnd = FX.rng(A*7+Z);
      ctx.save();
      ctx.translate(cx, cy);
      const shown = Math.min(A, 90);
      for(let k=0;k<shown;k++){
        const ang = rnd()*Math.PI*2, rr = Math.sqrt(rnd())*nucR*0.95;
        const x = Math.cos(ang)*rr, y = Math.sin(ang)*rr;
        const isP = k < Math.round(shown*Z/A);
        ctx.fillStyle = isP ? 'rgba(255,120,80,0.95)' : 'rgba(170,195,225,0.9)';
        ctx.beginPath(); ctx.arc(x + Math.sin(t*1.5+k)*0.5, y + Math.cos(t*1.3+k)*0.5, Math.max(1.6, nucR/6), 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
      const glow = ctx.createRadialGradient(cx,cy,0,cx,cy,nucR*2.2);
      glow.addColorStop(0,'rgba(255,190,140,0.22)'); glow.addColorStop(1,'rgba(255,190,140,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx,cy,nucR*2.2,0,Math.PI*2); ctx.fill();
      raf = requestAnimationFrame(draw);
    }
    draw();
    return { stop(){ if(raf) cancelAnimationFrame(raf); } };
  }

  // ---------------------------------------------------------------- origin mix bar
  function originBar(profile){
    const wrap = document.createElement('div');
    wrap.className = 'origin-bar-wrap';
    const entries = Object.entries(profile.mix).sort((a,b)=>b[1]-a[1]);
    const total = entries.reduce((a,[,v])=>a+v, 0);
    const bar = document.createElement('div');
    bar.className = 'origin-bar';
    entries.forEach(([k,v])=>{
      const seg = document.createElement('i');
      seg.style.width = (v/total*100).toFixed(1)+'%';
      seg.style.background = ElementProfiles.ORIGINS[k].color;
      seg.title = ElementProfiles.ORIGINS[k].label;
      bar.appendChild(seg);
    });
    wrap.appendChild(bar);
    const leg = document.createElement('div');
    leg.className = 'origin-legend';
    leg.innerHTML = entries.map(([k,v])=>{
      const o = ElementProfiles.ORIGINS[k];
      const word = v>=3 ? 'most' : (v===2 ? 'much' : 'some');
      return `<span><i style="background:${o.color}"></i>${o.label} <b>${word}</b></span>`;
    }).join('');
    wrap.appendChild(leg);
    return wrap;
  }

  // ---------------------------------------------------------------- emission spectrum
  function spectrum(profile){
    if(!profile.spec || !profile.spec.length) return null;
    const wrap = document.createElement('div');
    wrap.className = 'spectrum-wrap';
    const strip = document.createElement('div');
    strip.className = 'spectrum';
    const lo = 380, hi = 750;
    profile.spec.filter(nm=>nm>=lo && nm<=hi).forEach(nm=>{
      const line = document.createElement('i');
      line.style.left = ((nm-lo)/(hi-lo)*100).toFixed(2)+'%';
      line.style.background = FX.wavelengthCSS(nm);
      line.style.boxShadow = `0 0 7px ${FX.wavelengthCSS(nm)}`;
      line.title = nm.toFixed(1)+' nm';
      strip.appendChild(line);
    });
    wrap.appendChild(strip);
    const cap = document.createElement('div');
    cap.className = 'spectrum-cap';
    cap.textContent = profile.specLabel || 'Its fingerprint in light — the lines this element emits';
    wrap.appendChild(cap);
    return wrap;
  }

  // ---------------------------------------------------------------- chart of nuclides
  // Schematic: neutron number across, proton number up, with the valley of
  // stability, magic numbers, and an animated path (captures, decays).
  function nuclide(opts={}){
    const w = opts.w||420, h = opts.h||280;
    const el = document.createElement('div');
    el.className = 'nuclide-chart ' + (opts.cls||'');
    const canvas = document.createElement('canvas');
    el.appendChild(canvas);
    const ctx = fit(canvas, w, h);
    const title = document.createElement('div');
    title.className = 'nuclide-title';
    title.innerHTML = opts.title || 'Chart of nuclides <b>schematic</b>';
    el.appendChild(title);

    let view = { n0: opts.n0||0, n1: opts.n1||190, z0: opts.z0||0, z1: opts.z1||120 };
    const pad = { l:26, r:8, t:8, b:18 };
    const X = n=> pad.l + (n-view.n0)/(view.n1-view.n0)*(w-pad.l-pad.r);
    const Y = z=> h-pad.b - (z-view.z0)/(view.z1-view.z0)*(h-pad.t-pad.b);
    const MAGIC = [2,8,20,28,50,82,126];
    const path = [];       // {Z,N,kind}
    let marker = null;

    function zStable(A){ return A/(1.98 + 0.0155*Math.pow(A, 2/3)); }

    function draw(){
      ctx.clearRect(0,0,w,h);
      // frame
      ctx.strokeStyle = 'rgba(150,180,255,0.18)'; ctx.lineWidth = 1;
      ctx.strokeRect(pad.l, pad.t, w-pad.l-pad.r, h-pad.t-pad.b);
      ctx.font = '9px -apple-system, Segoe UI, sans-serif';
      ctx.fillStyle = 'rgba(150,175,225,0.55)';
      ctx.textAlign = 'center'; ctx.fillText('neutrons  N →', (w-pad.l)/2+pad.l, h-5);
      ctx.save(); ctx.translate(11, (h-pad.b+pad.t)/2); ctx.rotate(-Math.PI/2);
      ctx.fillText('protons  Z →', 0, 0); ctx.restore();
      // magic numbers
      ctx.setLineDash([3,4]);
      MAGIC.forEach(m=>{
        if(m>=view.n0 && m<=view.n1){
          ctx.strokeStyle = 'rgba(255,220,150,0.20)';
          ctx.beginPath(); ctx.moveTo(X(m), pad.t); ctx.lineTo(X(m), h-pad.b); ctx.stroke();
        }
        if(m>=view.z0 && m<=view.z1 && m<=92){
          ctx.strokeStyle = 'rgba(255,220,150,0.14)';
          ctx.beginPath(); ctx.moveTo(pad.l, Y(m)); ctx.lineTo(w-pad.r, Y(m)); ctx.stroke();
        }
      });
      ctx.setLineDash([]);
      // valley of stability
      ctx.beginPath();
      let first = true;
      for(let A=1; A<=300; A++){
        const z = zStable(A), n = A - z;
        if(n<view.n0-5 || n>view.n1+5) continue;
        const x = X(n), y = Y(z);
        if(first){ ctx.moveTo(x,y); first = false; } else ctx.lineTo(x,y);
      }
      ctx.strokeStyle = 'rgba(160,230,190,0.75)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(160,230,190,0.16)'; ctx.lineWidth = 9; ctx.stroke();
      ctx.lineWidth = 1;
      // path
      if(path.length){
        ctx.beginPath();
        path.forEach((p,i)=>{ const x = X(p.N), y = Y(p.Z); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
        ctx.strokeStyle = 'rgba(255,145,190,0.9)'; ctx.lineWidth = 1.6; ctx.stroke();
        path.forEach((p,i)=>{
          const x = X(p.N), y = Y(p.Z);
          ctx.fillStyle = p.kind==='beta' ? 'rgba(130,210,255,0.95)' : (p.kind==='alpha' ? 'rgba(255,205,140,0.95)' : 'rgba(255,145,190,0.95)');
          ctx.beginPath(); ctx.arc(x,y, i===path.length-1 ? 3.6 : 2.2, 0, Math.PI*2); ctx.fill();
        });
        const last = path[path.length-1];
        const lx = X(last.N), ly = Y(last.Z);
        const g = ctx.createRadialGradient(lx,ly,0,lx,ly,9);
        g.addColorStop(0,'rgba(255,255,255,0.85)'); g.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx,ly,9,0,Math.PI*2); ctx.fill();
      }
      // marker (target isotope)
      if(marker){
        const x = X(marker.N), y = Y(marker.Z);
        ctx.strokeStyle = 'rgba(255,240,180,0.95)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle = 'rgba(255,240,180,0.95)';
        ctx.font = '10px -apple-system, Segoe UI, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(marker.label||'', x+9, y+3);
      }
    }
    draw();
    return {
      el, canvas,
      setView(v){ Object.assign(view, v); draw(); },
      step(Z, N, kind){ path.push({Z,N,kind}); draw(); },
      seed(Z, N){ path.length = 0; path.push({Z,N,kind:'seed'}); draw(); },
      mark(Z, N, label){ marker = {Z,N,label}; draw(); },
      clearPath(){ path.length = 0; draw(); },
      redraw: draw,
    };
  }

  // ---------------------------------------------------------------- SN Ia light curve
  function lightCurve(opts={}){
    const w = opts.w||330, h = opts.h||170;
    const el = document.createElement('div');
    el.className = 'lc-chart';
    const canvas = document.createElement('canvas');
    el.appendChild(canvas);
    const ctx = fit(canvas, w, h);
    const cap = document.createElement('div');
    cap.className = 'lc-cap';
    cap.innerHTML = opts.caption || 'Brightness powered by radioactive decay <b>schematic</b>';
    el.appendChild(cap);
    let upto = 0;
    const pad = { l:28, r:10, t:10, b:20 };
    // canonical-ish shape: rise to peak ~19 days, then a decline that tracks
    // cobalt-56 decay (about 0.01 mag per day on the tail)
    function mag(d){
      if(d<=19) return 1 - Math.pow((19-d)/19, 2)*0.98;
      const tail = Math.exp(-(d-19)/60);
      return 0.15 + 0.85*tail;
    }
    function draw(){
      ctx.clearRect(0,0,w,h);
      ctx.strokeStyle = 'rgba(150,180,255,0.18)';
      ctx.strokeRect(pad.l, pad.t, w-pad.l-pad.r, h-pad.t-pad.b);
      ctx.font = '9px -apple-system, Segoe UI, sans-serif';
      ctx.fillStyle = 'rgba(150,175,225,0.55)'; ctx.textAlign='center';
      ctx.fillText('days after the explosion', (w+pad.l)/2, h-5);
      ctx.save(); ctx.translate(11,(h-pad.b+pad.t)/2); ctx.rotate(-Math.PI/2); ctx.fillText('brightness', 0,0); ctx.restore();
      const X = d=> pad.l + d/120*(w-pad.l-pad.r);
      const Y = m=> h-pad.b - m*(h-pad.t-pad.b);
      ctx.beginPath();
      for(let d=0; d<=Math.min(120, upto); d++){ const x=X(d), y=Y(mag(d)); if(d===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }
      ctx.strokeStyle = 'rgba(255,210,140,0.95)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,210,140,0.12)'; ctx.stroke(); ctx.lineWidth = 1;
      if(upto > 19){
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'left';
        ctx.fillText('⁵⁶Ni → ⁵⁶Co', X(22), Y(0.92));
        if(upto > 70) ctx.fillText('⁵⁶Co → ⁵⁶Fe', X(64), Y(0.42));
      }
    }
    draw();
    return { el, to(days){ return FX.animate(Math.max(400, days*16), t=>{ upto = days*t; draw(); }, FX.ease.out); } };
  }

  window.Charts = { atom, originBar, spectrum, nuclide, lightCurve, fit };
})();
