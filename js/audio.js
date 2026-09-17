// ==========================================================================
// AMBIENT — very quiet cinematic UI audio. No "realistic space sound" claims.
// Never autoplays loud; starts muted until the user's first interaction,
// and always respects the mute toggle.
// ==========================================================================
(function(){
  let ctx=null, master=null, pad=null, muted=true, started=false;

  function ensureCtx(){
    if(ctx) return;
    try{
      ctx = new (window.AudioContext||window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.05;
      master.connect(ctx.destination);
    }catch(e){ ctx = null; }
  }

  function startPad(){
    if(!ctx || started) return;
    started = true;
    const osc1 = ctx.createOscillator(); osc1.type='sine'; osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator(); osc2.type='sine'; osc2.frequency.value = 82.5;
    const g = ctx.createGain(); g.gain.value = 0.6;
    osc1.connect(g); osc2.connect(g); g.connect(master);
    osc1.start(); osc2.start();
    // slow drift for a living, ambient feel
    let t=0;
    setInterval(()=>{ t+=0.01; osc1.frequency.value = 55 + Math.sin(t)*1.5; }, 200);
  }

  function pulse(freq=220, dur=0.6, vol=0.12){
    if(!ctx || muted) return;
    const o = ctx.createOscillator(); o.type='sine'; o.frequency.value=freq;
    const g = ctx.createGain(); g.gain.value=0;
    o.connect(g); g.connect(master);
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(vol, now+0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now+dur);
    o.start(now); o.stop(now+dur+0.05);
  }

  function tick(){ pulse(680, 0.08, 0.05); }
  function impact(){ pulse(90, 1.4, 0.18); setTimeout(()=>pulse(180,1.0,0.1), 80); }
  function discoveryChime(){ pulse(660,0.9,0.09); setTimeout(()=>pulse(880,1.1,0.08),120); setTimeout(()=>pulse(990,1.4,0.06),260); }

  function setMuted(v){
    muted = v;
    if(master) master.gain.linearRampToValueAtTime(muted?0:0.05, (ctx?ctx.currentTime:0)+0.4);
    const btn = document.getElementById('mute-btn');
    if(btn) btn.textContent = muted ? '✕' : '♪';
  }

  function unlock(){
    ensureCtx();
    if(ctx && ctx.state==='suspended') ctx.resume();
    startPad();
  }

  window.Ambient = { unlock, setMuted, tick, impact, discoveryChime, isMuted: ()=>muted };
})();
