// ==========================================================================
// APP — boots the persistent environment and drives the top-level state
// machine (INTRO → LAB, with EXPERIMENT/MERGER/GOLD_JOURNEY as sub-states
// entered and exited from the lab). Nothing here reloads the page or cuts
// to a new scene — every transition is a continuous visual move.
// ==========================================================================
(function(){
  // Sound is on by default — the score is part of the piece, not an extra.
  // Nothing can actually be heard until the first gesture unlocks the audio
  // context (browser policy), which wireFirstInteractionAudio handles.
  const App = { state: 'boot', muted: false, mode: 'story' };

  function boot(){
    const canvas = document.getElementById('scene-canvas');
    Cosmos.init(canvas);

    Lab.init(); // build DOM structures now; lab-root stays invisible until enterLab()

    wireTopControls();
    wireFirstInteractionAudio();

    App.state = 'intro';
    Intro.run();
  }

  function wireTopControls(){
    // There is no Story/Science split: every piece of detail is always shown.
    document.getElementById('mute-btn').addEventListener('click', ()=>{
      App.muted = !App.muted;
      Ambient.setMuted(App.muted);
    });
  }

  function wireFirstInteractionAudio(){
    // A browser will not let an AudioContext make a sound until the user has
    // interacted with the page, so the score starts on whichever comes first
    // — a click, a tap or a keypress.
    const unlock = ()=>{
      Ambient.unlock();
      Ambient.setMuted(App.muted);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
  }

  function enterLab(){
    App.state = 'lab';
    document.getElementById('lab-root').classList.add('active');
    Cosmos.setNebulaOpacity(0.22);
    Cosmos.autoOrbitCamera(420, 30, 0.00028);
  }

  window.App = App;
  window.App.enterLab = enterLab;

  document.addEventListener('DOMContentLoaded', boot);
})();
