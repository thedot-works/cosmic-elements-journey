// ==========================================================================
// AMBIENT — a small generative score, entirely synthesised (no audio files).
//
// Five layers, all running off one AudioContext:
//   · a sub drone           — the weight of empty space
//   · a slow chord pad      — "the universe humming", breathing through a filter
//   · a band-passed noise   — wind, so the silence isn't clinical
//   · sparse in-key chimes  — stars
//   · event sounds          — fusion, neutron capture, decay, collision
//
// Every reaction step on screen fires a sound, so you hear elements being
// assembled: a rising bloom when nuclei fuse, a soft blip as each neutron
// sticks, a falling tone when a nucleus decays. Every collision (a merger, a
// supernova core-collapse) pushes the pad onto a new chord and brightens it,
// so the music is audibly somewhere else afterwards.
//
// Browsers won't start audio without a gesture, so nothing is created until
// unlock() runs off the first click/keypress. The mute toggle is always
// respected.
// ==========================================================================
(function(){
  const LEVEL = 0.42;         // master level when unmuted

  let ctx=null, master=null, muted=false, started=false;
  let delay=null, feedback=null, wetGain=null;
  let padGain=null, filter=null, lfo=null;
  let sub=null, subGain=null;
  let windGain=null, windFilter=null;
  let noiseBuf=null;
  let oscs = [];              // current chord voices: [{osc, gain, drift}]
  let chordIndex = 0;
  let sparkleTimer = null;

  // Consonant, open-sounding chords (semitone offsets from a low root) so a
  // collision can hop the whole drone to a new one and it still sounds like
  // part of the same piece.
  const CHORDS = [
    [0, 7, 12, 19, 24],    // root + fifth + octaves — open, spacious
    [0, 5, 12, 17, 24],    // sus4-ish
    [-5, 0, 7, 14, 19],    // down a fourth
    [2, 9, 14, 21, 26],    // up a whole step
    [-3, 4, 9, 16, 21],    // minor-ish, for the violent sites
  ];
  const ROOT = 55;           // A1 — the sub drone's home
  const PAD_ROOT = 220;      // A3 — where the chord actually sings; at 55 Hz
                             // the pad was inaudible on laptop speakers
  const semi = n=> PAD_ROOT * Math.pow(2, n/12);
  const subHz = n=> ROOT * Math.pow(2, n/12);

  function ensureCtx(){
    if(ctx) return;
    try{
      ctx = new (window.AudioContext||window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : LEVEL;

      // a feedback delay stands in for reverb — a sense of a very large room
      // without needing an impulse-response file
      delay = ctx.createDelay(2.0); delay.delayTime.value = 0.38;
      feedback = ctx.createGain(); feedback.gain.value = 0.34;
      wetGain = ctx.createGain(); wetGain.gain.value = 0.5;
      delay.connect(feedback); feedback.connect(delay);
      delay.connect(wetGain); wetGain.connect(master);

      // A limiter on the end of the chain, so raising the level cannot make a
      // collision (which briefly stacks a swell, a noise burst and a chord
      // change) clip on the way out.
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -8;
      limiter.knee.value = 6;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.004;
      limiter.release.value = 0.22;
      master.connect(limiter);
      limiter.connect(ctx.destination);

      // one second of white noise, reused by every wind/burst voice
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i] = Math.random()*2 - 1;
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
      g.gain.linearRampToValueAtTime(0.6/intervals.length, now + fadeSec);
      // gentle per-voice detune drift, so the drone never sits perfectly still
      const drift = ctx.createOscillator(); drift.frequency.value = 0.02 + Math.random()*0.03;
      const driftGain = ctx.createGain(); driftGain.gain.value = 2 + Math.random()*3;
      drift.connect(driftGain); driftGain.connect(osc.detune);
      drift.start(now);
      oscs.push({ osc, gain:g, drift });
    });
    // the sub follows the chord root, an octave below it
    if(sub) sub.frequency.linearRampToValueAtTime(subHz(intervals[0]), ctx.currentTime + fadeSec);
  }

  function startPad(){
    if(!ctx || started) return;
    started = true;

    padGain = ctx.createGain(); padGain.gain.value = 0;
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1500; filter.Q.value = 0.5;
    padGain.connect(filter);
    filter.connect(master);
    filter.connect(delay);

    // slow filter "breathing" so the drone reads as alive, not a held note
    lfo = ctx.createOscillator(); lfo.frequency.value = 0.045;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 420;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
    lfo.start();

    // ---- sub drone: the floor under everything
    sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = ROOT/2;
    subGain = ctx.createGain(); subGain.gain.value = 0;
    sub.connect(subGain); subGain.connect(master);
    sub.start();
    subGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 6);

    // ---- wind: band-passed noise, swept very slowly. Barely there, but the
    // mix sounds dead without it.
    const wind = ctx.createBufferSource();
    wind.buffer = noiseBuf; wind.loop = true;
    windFilter = ctx.createBiquadFilter(); windFilter.type = 'bandpass';
    windFilter.frequency.value = 480; windFilter.Q.value = 0.8;
    windGain = ctx.createGain(); windGain.gain.value = 0;
    wind.connect(windFilter); windFilter.connect(windGain); windGain.connect(master);
    const sweep = ctx.createOscillator(); sweep.frequency.value = 0.013;
    const sweepGain = ctx.createGain(); sweepGain.gain.value = 300;
    sweep.connect(sweepGain); sweepGain.connect(windFilter.frequency);
    sweep.start(); wind.start();
    windGain.gain.linearRampToValueAtTime(0.085, ctx.currentTime + 8);

    buildChord(CHORDS[0], 3.0);
    padGain.gain.linearRampToValueAtTime(0.42, ctx.currentTime + 4);

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
        pulse(semi(n), 1.7, 0.05);
      }
      scheduleSparkle();
    }, delayMs);
  }

  function pulse(freq=220, dur=0.6, vol=0.12, type='sine'){
    if(!ctx || muted) return;
    const o = ctx.createOscillator(); o.type=type; o.frequency.value=freq;
    const g = ctx.createGain(); g.gain.value=0;
    o.connect(g); g.connect(master); g.connect(delay);
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(vol, now+0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now+dur);
    o.start(now); o.stop(now+dur+0.05);
  }

  // A swept tone: the workhorse for "something is being built" (rising) and
  // "something fell apart" (falling).
  function sweepTone(f0, f1, dur, vol, type='triangle'){
    if(!ctx || muted) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f0;
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + dur*0.85);
    const g = ctx.createGain(); g.gain.value = 0;
    o.connect(g); g.connect(master); g.connect(delay);
    g.gain.linearRampToValueAtTime(vol, now + Math.min(0.08, dur*0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.start(now); o.stop(now + dur + 0.05);
  }

  // Filtered noise hit: the "matter" in an event — a burst, a crack, a wash.
  function noiseHit(dur, vol, f0, f1, q=1.0){
    if(!ctx || muted || !noiseBuf) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    src.playbackRate.value = 0.8 + Math.random()*0.4;
    const bp = ctx.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=q;
    bp.frequency.value = f0;
    bp.frequency.exponentialRampToValueAtTime(Math.max(40, f1), now + dur*0.9);
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(bp); bp.connect(g); g.connect(master); g.connect(delay);
    g.gain.linearRampToValueAtTime(vol, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.start(now); src.stop(now + dur + 0.05);
  }

  function tick(){ pulse(680, 0.08, 0.05); }

  // ---------------------------------------------------------------- events
  // Event-triggered sounds have been removed in favor of pure ambient atmosphere.
  // The breathing pad, drone, and sparse chimes create a meditative space without
  // the constant sonic feedback of hundreds of reactions. The ambient itself is the
  // score; the physics doesn't need to be sonically confirmed.
  function fuse(mode){
    // Silenced: event sounds were creating anxiety rather than wonder
  }

  // A single neutron sticking to a nucleus — now silent to avoid overwhelming
  // the r-process narration. The ambient pad provides all the audio context needed.
  function capture(){
    // Silenced: event sounds were jarring during rapid-fire captures
  }

  // A collision: the drone shifts to a new chord, brightening the filter gently.
  // No crash sounds—just a harmonic transition that feels like a shift in the cosmos.
  function impact(){
    if(!ctx || muted || !started) return;
    const now = ctx.currentTime;
    // Gently brighten the filter, then settle back
    filter.frequency.cancelScheduledValues(now);
    filter.frequency.setValueAtTime(filter.frequency.value, now);
    filter.frequency.linearRampToValueAtTime(2400, now+0.8);
    filter.frequency.linearRampToValueAtTime(1500, now+4);
    // Subtle lift in the pad
    padGain.gain.cancelScheduledValues(now);
    padGain.gain.setValueAtTime(padGain.gain.value, now);
    padGain.gain.linearRampToValueAtTime(0.58, now+0.5);
    padGain.gain.linearRampToValueAtTime(0.42, now+4);
    // Shift to a new chord
    chordIndex = (chordIndex+1) % CHORDS.length;
    buildChord(CHORDS[chordIndex], 3.0);
  }

  // Each act gets its own colour: the violent sites sit on the darker chord,
  // the quiet ones open back up.
  function mood(kind){
    if(!ctx || !started || muted) return;
    const dark = kind==='merger' || kind==='massive' || kind==='typeIa' || kind==='magnetar';
    const next = dark ? 4 : (kind==='bigbang' ? 0 : 1);
    if(next === chordIndex) return;
    chordIndex = next;
    buildChord(CHORDS[chordIndex], 4.0);
    const now = ctx.currentTime;
    filter.frequency.cancelScheduledValues(now);
    filter.frequency.setValueAtTime(filter.frequency.value, now);
    filter.frequency.linearRampToValueAtTime(dark ? 1050 : 1800, now + 4);
  }

  function discoveryChime(){
    pulse(660,0.9,0.16); setTimeout(()=>pulse(880,1.1,0.14),120); setTimeout(()=>pulse(990,1.4,0.11),260);
  }

  // A short confirmation that the score is actually running. "Is the sound
  // even on?" is otherwise unanswerable from the interface — a drone fading
  // in over four seconds is easy to miss, and the toggle looks the same
  // whether or not the audio context ever started.
  function toast(text){
    let t = document.getElementById('audio-toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'audio-toast';
      t.className = 'audio-toast';
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toast._h);
    toast._h = setTimeout(()=> t.classList.remove('show'), 2600);
  }

  function setMuted(v){
    const was = muted;
    muted = v;
    if(master) master.gain.linearRampToValueAtTime(muted?0:LEVEL, (ctx?ctx.currentTime:0)+0.4);
    if(was !== muted && started) toast(muted ? 'Sound off' : 'Sound on');
    // A distinct glyph from the other round icon, so the control never looks
    // ambiguous when audio happens to be muted.
    const btn = document.getElementById('mute-btn');
    if(btn) btn.textContent = muted ? '🔇' : '♪';
  }

  function unlock(){
    const first = !started;
    ensureCtx();
    if(ctx && ctx.state==='suspended') ctx.resume();
    startPad();
    if(first && ctx && !muted){
      // the pad takes a few seconds to come up, so say so straight away
      toast('Sound on');
      const btn = document.getElementById('mute-btn');
      if(btn) btn.classList.add('live');
    }
  }

  window.Ambient = { unlock, setMuted, tick, fuse, capture, impact, mood, discoveryChime, isMuted: ()=>muted };
})();
