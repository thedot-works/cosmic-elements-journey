// ==========================================================================
// APP — boots the persistent environment and drives the top-level state
// machine (INTRO → LAB, with EXPERIMENT/MERGER/GOLD_JOURNEY as sub-states
// entered and exited from the lab). Nothing here reloads the page or cuts
// to a new scene — every transition is a continuous visual move.
// ==========================================================================
(function(){
  const App = { state: 'boot', muted: true, mode: 'story' };

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
    document.querySelectorAll('#mode-toggle button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('#mode-toggle button').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        App.mode = btn.dataset.mode;
        document.body.classList.toggle('science-mode', App.mode === 'science');
      });
    });
    document.getElementById('mute-btn').addEventListener('click', ()=>{
      App.muted = !App.muted;
      Ambient.setMuted(App.muted);
    });
  }

  function wireFirstInteractionAudio(){
    const unlock = ()=>{ Ambient.unlock(); Ambient.setMuted(App.muted); window.removeEventListener('pointerdown', unlock); };
    window.addEventListener('pointerdown', unlock, { once:true });
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
