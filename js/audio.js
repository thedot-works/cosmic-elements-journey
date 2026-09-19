// ==========================================================================
// AMBIENT — a small generative score, entirely synthesised (no audio files):
// a slow evolving pad ("the universe humming"), a sparse twinkle layer, and
// short percussive stings for discrete events. Every "collision" moment
// (a merger, a supernova collapse) pushes the pad to a new chord and briefly
// brightens it, so the music is audibly a different place afterwards — the
// same idea as the visuals: something in the universe just changed.
// Never autoplays loud; starts muted until the user's first interaction,
// and always respects the mute toggle.
// ==========================================================================
(function(){
  let ctx=null, master=null, muted=true, started=false;
  let delay=null, feedback=null, wetGain=null;
  let padGain=null, filter=null, lfo=null;
  let oscs = [];          // current chord voices: [{osc, gain, drift}]
  let chordIndex = 0;
  let sparkleTimer = null;

  // A handful of consonant, open-sounding chords (semitone offsets from a
  // low root) so a "collision" can hop the whole drone to a new one and it
  // always still sounds like part of the same piece.
  const CHORDS = [
    [0, 7, 12, 19],    // root + fifth + octave + octave-fifth — open, spacious
    [0, 5, 12, 17],    // sus4-ish
    [-5, 0, 7, 14],    // shifted down a fourth
    [2, 9, 14, 21],    // shifted up a whole step
  ];
  const ROOT = 55; // A1
  const semi = n=> ROOT * Math.pow(2, n/12);

  function ensureCtx(){
    if(ctx) return;
    try{
      ctx = new (window.AudioContext||window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.05;

      // a short feedback delay stands in for reverb — a sense of space
      // without needing an impulse-response file
      delay = ctx.createDelay(2.0); delay.delayTime.value = 0.34;
      feedback = ctx.createGain(); feedback.gain.value = 0.3;
      wetGain = ctx.createGain(); wetGain.gain.value = 0.45;
      delay.connect(feedback); feedback.connect(delay);
      delay.connect(wetGain); wetGain.connect(master);

      master.connect(ctx.destination);
    }catch(e){ ctx = null; }
  }

  function buildChord(intervals, fadeSec){
    const old = oscs; oscs = [];
    const now = ctx.currentTime;
    old.forEach(o=>{
      o.gain.gain.cancelScheduledValues(now);
      o.gain.gain.setValueAtTime(o.gain.gain.value, now);
      o.gain.gain.linearRampToValueAtTime(0, now + fadeSec);
      o.osc.stop(now + fadeSec + 0.15);
      o.drift.stop(now + fadeSec + 0.15);
    });
    intervals.forEach((n,i)=>{
      const osc = ctx.createOscillator();
      osc.type = i===0 ? 'sine' : (i%2 ? 'triangle' : 'sine');
      osc.frequency.value = semi(n);
      const g = ctx.createGain(); g.gain.value = 0;
      osc.connect(g); g.connect(padGain);
      osc.start(now);
      g.gain.linearRampToValueAtTime(0.55/intervals.length, now + fadeSec);
      // gentle per-voice detune drift, so the drone never sits perfectly still
      const drift = ctx.createOscillator(); drift.frequency.value = 0.02 + Math.random()*0.03;
      const driftGain = ctx.createGain(); driftGain.gain.value = 2 + Math.random()*2;
      drift.connect(driftGain); driftGain.connect(osc.detune);
      drift.start(now);
      oscs.push({ osc, gain:g, drift });
    });
  }

  function startPad(){
    if(!ctx || started) return;
    started = true;

    padGain = ctx.createGain(); padGain.gain.value = 0;
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900; filter.Q.value = 0.4;
    padGain.connect(filter);
    filter.connect(master);
    filter.connect(delay);

    // slow filter "breathing" so the drone reads as alive, not a held note
    lfo = ctx.createOscillator(); lfo.frequency.value = 0.045;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 260;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
    lfo.start();

    buildChord(CHORDS[0], 3.0);
    padGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 4);

    scheduleSparkle();
  }

  // A sparse, randomly-timed high "star twinkle" — a soft plucked tone, once
  // every several seconds, always in key with the current chord.
  function scheduleSparkle(){
    if(!ctx) return;
    const delayMs = 3500 + Math.random()*5500;
    sparkleTimer = setTimeout(()=>{
      if(!muted){
        const scale = [0,3,7,10,12,15,19];
        const n = scale[Math.floor(Math.random()*scale.length)] + 24 + CHORDS[chordIndex][0];
        pulse(semi(n), 1.7, 0.04);
      }
      scheduleSparkle();
    }, delayMs);
  }

  function pulse(freq=220, dur=0.6, vol=0.12){
    if(!ctx || muted) return;
    const o = ctx.createOscillator(); o.type='sine'; o.frequency.value=freq;
    const g = ctx.createGain(); g.gain.value=0;
    o.connect(g); g.connect(master); g.connect(delay);
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(vol, now+0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now+dur);
    o.start(now); o.stop(now+dur+0.05);
  }

  function tick(){ pulse(680, 0.08, 0.05); }

  // A collision: a deep swell, a brief brightening of the whole pad, and —
  // the signature move — the drone hops to a new chord, so the music is
  // audibly a different place after a merger or a supernova than before it.
  function impact(){
    pulse(90, 1.4, 0.18); setTimeout(()=>pulse(180,1.0,0.1), 80);
    if(ctx && started){
      const now = ctx.currentTime;
      filter.frequency.cancelScheduledValues(now);
      filter.frequency.setValueAtTime(filter.frequency.value, now);
      filter.frequency.linearRampToValueAtTime(2400, now+0.5);
      filter.frequency.linearRampToValueAtTime(900, now+5);
      padGain.gain.cancelScheduledValues(now);
      padGain.gain.setValueAtTime(padGain.gain.value, now);
      padGain.gain.linearRampToValueAtTime(0.68, now+0.6);
      padGain.gain.linearRampToValueAtTime(0.5, now+5);
      chordIndex = (chordIndex+1) % CHORDS.length;
      buildChord(CHORDS[chordIndex], 2.6);
    }
  }

  function discoveryChime(){ pulse(660,0.9,0.09); setTimeout(()=>pulse(880,1.1,0.08),120); setTimeout(()=>pulse(990,1.4,0.06),260); }

  function setMuted(v){
    muted = v;
    if(master) master.gain.linearRampToValueAtTime(muted?0:0.05, (ctx?ctx.currentTime:0)+0.4);
    // A distinct glyph from the ✕ close button, so the two round icons
    // never look identical when audio happens to be muted.
    const btn = document.getElementById('mute-btn');
    if(btn) btn.textContent = muted ? '🔇' : '♪';
  }

  function unlock(){
    ensureCtx();
    if(ctx && ctx.state==='suspended') ctx.resume();
    startPad();
  }

  window.Ambient = { unlock, setMuted, tick, impact, discoveryChime, isMuted: ()=>muted };
})();
