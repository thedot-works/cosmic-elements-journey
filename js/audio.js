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
  // One sound per reaction step, keyed off the reaction type, so the score
  // tracks what the nucleus on screen is actually doing.
  function fuse(mode){
    if(!ctx || muted) return;
    const root = semi(CHORDS[chordIndex][0] + 24);
    switch(mode){
      case 'beta-': case 'beta+': case 'ec':
        // a neutron flips into a proton: a short, bright falling blip
        sweepTone(root*1.5, root*0.92, 0.5, 0.17, 'triangle');
        break;
      case 'alpha': case 'decay':
        // something leaves: two-note fall, a little heavier
        sweepTone(root, root*0.6, 0.7, 0.18, 'sine');
        setTimeout(()=> pulse(root*0.5, 0.6, 0.11), 130);
        break;
      case 'fission': case 'spallation':
        // a nucleus is broken apart: a crack, then debris
        noiseHit(0.5, 0.24, 2600, 500, 0.7);
        sweepTone(root*0.8, root*0.35, 0.6, 0.17, 'sawtooth');
        break;
      case 'capture':
        capture();
        break;
      case 'recombination': case 'hadron':
        // the very first structure in the universe: a soft bloom
        sweepTone(root*0.7, root*1.25, 1.1, 0.15, 'sine');
        noiseHit(0.8, 0.09, 700, 1800, 1.4);
        break;
      default:
        // fusion: two nuclei become one — a rising bloom that lands in key
        sweepTone(root*0.62, root*1.005, 0.85, 0.21, 'triangle');
        noiseHit(0.42, 0.12, 900, 2400, 1.2);
        setTimeout(()=> pulse(root*1.5, 0.9, 0.095), 260);
    }
  }

  // A single neutron sticking to a nucleus — used hundreds of times during
  // the r-process, so it has to stay small and dry.
  function capture(){
    if(!ctx || muted) return;
    const root = semi(CHORDS[chordIndex][0] + 24);
    const detune = 1 + (Math.random()-0.5)*0.06;
    pulse(root*1.5*detune, 0.16, 0.085, 'sine');
    noiseHit(0.1, 0.05, 1800, 3200, 2.0);
  }

  // A collision: a deep swell, a brief brightening of the whole pad, and —
  // the signature move — the drone hops to a new chord, so the music is
  // audibly a different place after a merger or a supernova than before it.
  function impact(){
    if(!ctx || muted) return;
    pulse(90, 1.6, 0.32); setTimeout(()=>pulse(180,1.1,0.18), 80);
    noiseHit(1.8, 0.26, 1400, 90, 0.5);
    sweepTone(320, 42, 1.5, 0.21, 'sawtooth');
    if(started){
      const now = ctx.currentTime;
      filter.frequency.cancelScheduledValues(now);
      filter.frequency.setValueAtTime(filter.frequency.value, now);
      filter.frequency.linearRampToValueAtTime(3600, now+0.5);
      filter.frequency.linearRampToValueAtTime(1500, now+5);
      padGain.gain.cancelScheduledValues(now);
      padGain.gain.setValueAtTime(padGain.gain.value, now);
      padGain.gain.linearRampToValueAtTime(0.72, now+0.6);
      padGain.gain.linearRampToValueAtTime(0.5, now+5);
      if(windGain){
        windGain.gain.cancelScheduledValues(now);
        windGain.gain.setValueAtTime(windGain.gain.value, now);
        windGain.gain.linearRampToValueAtTime(0.2, now+0.7);
        windGain.gain.linearRampToValueAtTime(0.085, now+6);
      }
      chordIndex = (chordIndex+1) % CHORDS.length;
      buildChord(CHORDS[chordIndex], 2.6);
    }
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
