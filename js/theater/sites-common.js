// ==========================================================================
// SITE UTILITIES — shared beats used by the cosmic sequences: the dive down to
// nuclear scale, binary-star setups, supernova blasts, decay chains, and the
// verdict screens for combinations that don't forge anything.
// ==========================================================================
(function(){
  const V3 = (x,y,z)=> new THREE.Vector3(x,y,z);
  const U = {};

  // Fade out the wide universe and drop to the scale of a single nucleus.
  U.micro = async function(ctx, opts={}){
    ctx.newScene('nuclear');
    Cosmos.fadeStars(0.05, 600); Cosmos.fadeNebula(0.02, 600);
    FX.post.bloomStrength = 0.72; FX.post.vignette = 0.46;
    const bd = FX.microBackdrop({ stage: ctx.stage, tint: opts.tint || '#223a6a' });
    bd.fadeIn(800);
    ctx.side(null); ctx.hud(null);
    ctx.cap(opts.l1 || 'DOWN TO A SINGLE NUCLEUS', opts.l2 || (ctx.el ? ctx.el.where : ''));
    await ctx.wait(500);
    return bd;
  };

  // The scale dive, used before the nuclear act: kilometres → femtometres.
  U.scaleDive = async function(ctx, rungs, opts={}){
    const r = ctx.readout('');
    for(const [scale, label] of rungs){
      if(ctx.skipped()) break;
      r.innerHTML = `<b>${scale}</b><span>${label}</span>`;
      await ctx.wait(opts.ms || 380);
    }
    ctx.hud(null);
  };

  // A star + companion with an accretion disk and a mass-transfer stream.
  U.binary = function(ctx, opts={}){
    const stage = ctx.stage;
    const wd = FX.star({ stage, radius: opts.wdRadius||0.55, temp: opts.wdTemp||26000, granulation:22, brightness:2.2,
      corona:1.1, glow:0.7, glowScale:9, position: V3(0,0,0) });
    const comp = FX.star({ stage, radius: opts.compRadius||6.5, temp: opts.compTemp||4600, granulation:7, brightness:1.1,
      spots:0.45, corona:0.5, glow:0.4, glowScale:3.0, position: V3(opts.sep||30, 0, 0) });
    // the companion is stretched toward the white dwarf (tidal / Roche lobe)
    comp.surf.scale.set(opts.compRadius*1.18, opts.compRadius*0.94, opts.compRadius*0.94);
    const disk = FX.disk({ stage, inner: (opts.wdRadius||0.55)*2.2, outer: 7.5, count: 7000, spin: 4.5,
      tIn: 34000, tOut: 3600, thickness: 0.06, size: 1.5, brightness: 1.5 });
    const stream = FX.flow({ stage, count: 1400, speed: 0.22, size: 2.0, width: 0.8, widthEnd: 0.3,
      points: [ V3((opts.sep||30) - (opts.compRadius||6.5)*0.9, 0, 0), V3((opts.sep||30)*0.55, 0, -7), V3(9, 0, -7.5), V3(4.2, 0, -1.2) ],
      colorA: '#ffd9a0', colorB: '#ffffff', intensity: 1.5 });
    return { wd, comp, disk, stream };
  };

  // Core collapse → shock → supernova, with ejecta coloured by what's in it.
  U.supernova = async function(ctx, opts={}){
    const stage = ctx.stage;
    ctx.cap('THE CORE COLLAPSES.', 'In less than a second, an iron core the size of Earth falls into a ball 20 km across.');
    if(opts.star){
      await FX.animate(900, t=>{ opts.star.setRadius(FX.lerp(opts.r0||18, (opts.r0||18)*0.45, t)); opts.star.setBright(FX.lerp(1.15, 2.8, t)); });
    }
    FX.cam.shake(2.2, 700);
    await ctx.wait(400);
    // neutrino burst: 99% of the energy leaves as neutrinos
    ctx.cap('A FLOOD OF NEUTRINOS.', '99% of the energy escapes as neutrinos before the star even knows it has died.');
    FX.burst(stage, { position:V3(0,0,0), count:2600, color:'#dfe9ff', color2:'#9fc4ff', speed:220, size:1.1, life:1.5, drag:0.1, intensity:0.9 });
    await ctx.wait(900);
    FX.flash(1.5, '#fff4e0', 1.6);
    Ambient.impact();
    ctx.cap('SUPERNOVA.', 'The rebounding shock blows the star apart and scatters its new elements across space.');
    const shell = FX.shockShell({ stage, radius: 4, amp: 0.55, color:'#ffe6bd', color2:'#ff5f2a', intensity: 3.2, freq: 3.2 });
    FX.animate(4200, t=>{ shell.mesh.scale.setScalar(4 + 150*t); shell.u.uOpacity.value = 1 - t*0.92; }, FX.ease.out);
    FX.burst(stage, { position:V3(0,0,0), count:3000, color:'#ffd9a0', color2:'#ff5a2a', speed:190, size:2.6, life:3.4, drag:0.35, intensity:1.4, grow:1.2 });
    FX.burst(stage, { position:V3(0,0,0), count:1400, color:'#8fe0ff', color2:'#bda4ff', speed:120, size:2.0, life:3.8, drag:0.3, intensity:1.1 });
    FX.cam.shake(3.2, 1200);
    await ctx.wait(2600);
    return shell;
  };

  // Natural decay chains. Each entry: [isotope, mode, half-life]
  U.CHAINS = {
    U238: [
      ['238U','α','4.5 billion years'], ['234Th','β⁻','24 days'], ['234Pa','β⁻','1.2 minutes'], ['234U','α','245,000 years'],
      ['230Th','α','75,000 years'], ['226Ra','α','1,600 years'], ['222Rn','α','3.8 days'], ['218Po','α','3.1 minutes'],
      ['214Pb','β⁻','27 minutes'], ['214Bi','β⁻','20 minutes'], ['214Po','α','0.16 milliseconds'], ['210Pb','β⁻','22 years'],
      ['210Bi','β⁻','5 days'], ['210Po','α','138 days'], ['206Pb','stable','stable'],
    ],
    U235: [
      ['235U','α','704 million years'], ['231Th','β⁻','25 hours'], ['231Pa','α','32,760 years'], ['227Ac','β⁻','22 years'],
      ['227Th','α','19 days'], ['223Ra','α','11 days'], ['219Rn','α','4 seconds'], ['215Po','α','1.8 milliseconds'],
      ['211Pb','β⁻','36 minutes'], ['211Bi','α','2 minutes'], ['207Tl','β⁻','5 minutes'], ['207Pb','stable','stable'],
    ],
  };
  // Where a chain branches off to reach the rarer members.
  U.CHAIN_BRANCH = {
    '218At': { after:'218Po', from:'218Po', mode:'β⁻', half:'3 minutes', note:'Just 0.02% of polonium-218 nuclei take this path' },
    '223Fr': { after:'227Ac', from:'227Ac', mode:'α', half:'22 years', note:'About 1.4% of actinium-227 nuclei take this path' },
  };

  U.parseIso = function(tok){
    const m = tok.match(/^(\d+)([A-Z][a-z]?)$/);
    if(!m) return null;
    const Z = ElementProfiles.SYM2Z[m[2]];
    return { A:+m[1], sym:m[2], Z, N:+m[1]-Z, label: ElementProfiles.sup(+m[1]) + m[2] };
  };

  // ---------------------------------------------------------------- verdicts
  U.verdict = async function(ctx, { word, cls, sub, next }){
    const box = document.createElement('div');
    box.className = 'exp-verdict';
    box.innerHTML = `<div class="verdict-word ${cls||'no'}">${word}</div><div class="verdict-sub">${sub}</div>` +
      (next ? `<div class="verdict-next">${next}</div>` : '');
    ctx.stage.dom(box, document.getElementById('exp-body'));
    ctx.reveal = false;
    await Theater.actionButton('Return to the forge', { cls:'ghost' });
  };

  // A quick "this pairing does nothing" scene for combinations with no physics.
  U.idleObjects = function(ctx, ids){
    const stage = ctx.stage;
    const made = [];
    const slots = ids.length>1 ? [-16, 16] : [0];
    ids.forEach((id,i)=>{
      const x = slots[i] || 0;
      made.push(U.objectVisual(ctx, id, V3(x, 0, 0)));
    });
    return made;
  };

  // A small stand-in visual for each library object, used in teaching paths.
  U.objectVisual = function(ctx, id, pos){
    const stage = ctx.stage;
    switch(id){
      case 'sunlike':    return FX.star({ stage, radius:7, temp:5772, granulation:8, brightness:1.25, spots:0.35, position:pos });
      case 'massive':    return FX.star({ stage, radius:12, temp:26000, granulation:10, brightness:1.5, corona:1.0, position:pos });
      case 'redgiant':   return FX.star({ stage, radius:16, temp:3300, granulation:5, brightness:1.05, spots:0.5, position:pos });
      case 'whitedwarf': return FX.star({ stage, radius:1.1, temp:22000, granulation:20, brightness:2.2, glowScale:8, position:pos });
      case 'neutronA':
      case 'neutronB':   return FX.star({ stage, radius:0.5, temp:60000, granulation:30, brightness:3.0, glowScale:13, position:pos });
      case 'magnetar':   return FX.star({ stage, radius:0.55, temp:40000, granulation:26, brightness:2.8, glowScale:12, position:pos });
      case 'early':      return FX.fireSky({ stage, radius:600, scale:2.0 });
      case 'gas': {
        const pc = FX.pointCloud({ stage, count:4000, opacity:0.7, twinkle:0.1,
          gen:()=>{ const r = 26*Math.pow(Math.random(),0.5), th=Math.random()*6.283, ph=Math.acos(Math.random()*2-1);
            return { p:[pos.x + r*Math.sin(ph)*Math.cos(th), pos.y + r*Math.sin(ph)*Math.sin(th)*0.6, pos.z + r*Math.cos(ph)],
              c: FX.lin('#8f6fff').multiplyScalar(0.35+Math.random()*0.5), s: 3.2 }; }});
        return pc;
      }
      case 'cosmicrays': {
        const g = new THREE.Group(); stage.add(g);
        let acc = 0;
        ctx.stage.onFrame(dt=>{ acc += dt; if(acc > 0.25){ acc = 0;
          const a = Math.random()*6.283, r = 40;
          FX.streak({ stage, from: pos.clone().add(V3(Math.cos(a)*r, Math.sin(a)*r, -30)), to: pos.clone().add(V3(-Math.cos(a)*r, -Math.sin(a)*r, 30)),
            color:'#bfe8ff', size:1.6, intensity:2.0, ms:700, segments:12, fadeMs:200 });
        }});
        return g;
      }
      case 'rock': {
        const m = new THREE.Mesh(Specimen.blob(7, 3, 0.3, 42, 1.6, true),
          Specimen.dielectric('#2a2622', 0.85, {}, { metalness:0.25 }));
        m.position.copy(pos); stage.add(m); return { group:m };
      }
      case 'humanlab': {
        const g = new THREE.Group(); g.position.copy(pos); stage.add(g);
        const ring = new THREE.Mesh(new THREE.TorusBufferGeometry(9, 0.5, 12, 80), Specimen.metalMat({ f0:[0.62,0.64,0.68], rough:0.32 }, {}));
        ring.rotation.x = Math.PI/2; g.add(ring);
        return { group:g };
      }
      default: return null;
    }
  };

  window.SiteUtil = U;
})();
