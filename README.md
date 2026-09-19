# Cosmic Elements Journey — How Old Is Gold?

An interactive single-page piece about where the elements came from. A short
cinematic intro plays inside a persistent 3D star field and then hands you the
**Cosmic Forge**: combine cosmic objects, or click any cell on the periodic
table, and watch that element actually get made — the astrophysical site, the
nuclear reaction that builds it, and finally the element itself, rendered as it
really looks.

Every one of the 118 elements has its own recipe, its own reaction, and its own
specimen. Gold is the closing act, not the whole show.

There are no slides or page transitions. One environment, one continuous
journey: `INTRO → LAB → THEATER (site → nucleus → reveal) → back to LAB`, with
gold alone continuing into its own closing sequence.

## Run it

Fully static — no build step, no server-side code.

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000/
```

**Important:** `index.html` loads `css/main.css` and the files under `js/` as
relative sibling paths. If you copy or download `index.html` *by itself*, away
from its `css/` and `js/` folders, the browser has nothing to load and you get
an unstyled, plain-HTML page. Keep the folder together — or use the single-file
build below, which has no such requirement.

`js/vendor/three.min.js` (Three.js r128) is vendored in the repo, so the page
works fully offline and depends on no CDN.

### Single-file build

```bash
node scripts/bundle.js
# writes dist/cosmic-elements-journey.html — CSS and every script inlined
```

That file is self-contained and opens from anywhere, including `file://` with
no server. Regenerate it after any change to `index.html`, `css/` or `js/`.

## How it works

### The knowledge layer

`js/data/element-profiles.js` (Z 1–54) and `js/data/element-profiles-2.js`
(Z 55–118) hold one profile per element: its formation site, the mix of origins
its atoms come from, the reaction chain that builds it, what it looks like in
the hand, where you meet it today, who found it, its spectral lines and its
decay chain. Reactions are written as readable strings —

```
'12C + 4He -> 16O + γ @6 days :: a helium capture in the shell'
```

— and parsed into steps with a mode (fusion, capture, beta-, beta+, electron
capture, alpha, spallation, fission, hadron, recombination), a product and a
half-life. `scripts/validate_profiles.js` checks every profile: electron shells
sum to Z, and every reaction conserves both charge and nucleon number.

```bash
node scripts/validate_profiles.js   # → ALL PROFILES VALID
```

Everything downstream — the sequence you watch, the nuclei that move, the
equations on screen, the object in the reveal — is driven from these profiles.
Nothing is hard-coded to gold.

### The rendering layer (`js/fx/`)

- `core.js` — HDR scene render → soft-knee bright pass → dual-filter bloom →
  ACES tone mapping → sRGB, with vignette, film grain and a flash-driven
  chromatic aberration. Linear colour throughout. Also the camera director,
  projected DOM labels, seeded RNG, GLSL noise, and **Stages**, which own every
  mesh, frame callback, DOM node, label and timer a sequence creates so that
  skipping or finishing cleans up completely.
  The studio environment is rendered with a `CubeCamera` rather than
  `PMREMGenerator`: r128's PMREM path stores RGBE, which decodes to NaN on some
  drivers and turns every metal black.
- `objects.js` — stars, accretion disks, mass-transfer streams, shock shells,
  nebulae, galaxies, the spacetime grid, a molten Earth, particle bursts.
- `nucleus.js` — nuclei as relaxation-packed protons and neutrons in two
  instanced meshes, with absorb / beta / beta-plus / electron-capture / alpha
  animations, and a player that renders *this* element's reaction with a
  live equation HUD.
- `specimen.js` — 25 procedural forms (nuggets, chunks, crystal bars,
  dendrites, pellets, sealed ampoules, dewars, discharge tubes, liquid metal,
  radioluminescent actinides, "atoms only" for the superheavies) with real
  reflectance values, tarnish, iridescence and a seeded micro-roughness grain,
  so two elements sharing a form still come out as two different objects.
- `charts.js` — animated Bohr atom, origin bars, emission spectra, a schematic
  nuclide chart, a supernova light curve.

### The theatre layer (`js/theater/`)

`theater.js` runs a three-act sequence and owns the overlay, captions, HUD,
side panel, Enter-to-advance and Esc-to-skip. `sites-*.js` hold seventeen
sequences — Big Bang, nova, cosmic-ray spallation, Sun-like star, AGB star,
massive star, Type Ia, neutron-star merger, decay chain, human lab, plus the
teaching paths for combinations that don't forge anything. `reveal.js` is Act
III: a studio-lit specimen you can drag to turn, next to a fact card with the
element's atom, shells, reaction, origin mix, spectrum and history.

### The rest

- `js/lab.js` — the forge: twelve cosmic objects, six targets, combination
  resolution, hints. Clicking a periodic-table cell loads the matching recipe
  into the slots and **waits** — nothing runs until you press Enter.
- `js/periodic-table.js` — the 118-element discovery map. Elements forged in
  the same event light up one by one when you return to the forge.
- `js/starfield.js` — the persistent scene and render loop.
- `js/gold-journey.js` — gold's closing act only: the nucleus rides the
  kilonova into a molecular cloud, falls into a new star, ends up in the Earth,
  and finally sits on someone's hand.

## Science notes baked into the design

- Big Bang nucleosynthesis produces only H, He and trace Li — nothing else.
- Stellar fusion stops paying at the iron group; everything heavier needs
  neutron capture, a blast, or an accelerator.
- Gold and the other r-process elements come from neutron-star mergers, the
  one confirmed site; magnetars are labelled as active research, not fact.
- Type Ia iron is shown as it actually arrives: nickel-56 decaying through
  cobalt-56, which is also what makes the supernova shine.
- Decay-chain elements (Rn, Ra, Po, Fr, At, Ac, Pa) are shown being made
  continuously inside rock, not in a star.
- The 28 lab-made elements show their real target, beam and reaction, and the
  superheavies are drawn as individual atoms flickering on a detector — with
  the count and the flicker rate following what is actually known about them.
- The closing narration never assigns gold atoms one exact age, only that they
  predate the Earth.
- A **Story / Science** toggle (top right) adds technical detail — masses,
  distances, isotopes, half-lives — to the same visuals, never a separate page.

## Project structure

```
index.html                     Page shell
css/main.css                   All styling
js/vendor/three.min.js         Vendored Three.js r128
js/elements-data.js            Generated 118-element dataset (scripts/gen_elements.js)
js/data/element-profiles.js    Profiles Z 1–54 + tables
js/data/element-profiles-2.js  Profiles Z 55–118 + API
js/fx/core.js                  Post-processing, camera, stages, textures, noise
js/fx/objects.js               Stars, disks, shells, nebulae, galaxies, Earth
js/fx/nucleus.js               Nuclei and the reaction player
js/fx/specimen.js              Procedural specimens for all 118 elements
js/fx/charts.js                Atom, origin bar, spectrum, nuclide chart, light curve
js/starfield.js                Persistent scene + render loop
js/periodic-table.js           Discovery map
js/audio.js                    Muted-by-default ambient audio
js/intro.js                    Autoplay cinematic intro
js/lab.js                      The Cosmic Forge
js/theater/theater.js          Three-act runner, overlay, captions, input
js/theater/sites-common.js     Shared beats: scale dive, binaries, supernovae, verdicts
js/theater/sites-stellar.js    Sun-like, AGB, massive star, Type Ia, nova
js/theater/sites-cosmic.js     Big Bang, spallation, merger, decay, lab
js/theater/reveal.js           Act III: the specimen and its fact card
js/gold-journey.js             Gold's closing sequence
```

## Development scripts

```bash
node scripts/validate_profiles.js        # science check on all 118 profiles
node scripts/smoke.js                    # boot + console-error check
node scripts/test-element.js 8           # one element, end to end
node scripts/test-batch.js 3,26,63,82    # several elements, one screenshot per act
node scripts/test-nuclear.js 26          # Act II only: nuclei, labels, equations
node scripts/test-gold.js                # gold, including the closing journey
node scripts/sheet.js 1 40               # contact sheet of specimens for visual QA
node scripts/bundle.js                   # single-file build
```

`?fast=0.3` speeds every sequence up for testing, `?hq` pins render quality, and
`dev/specimens.html?from=1&to=118` renders the whole specimen set on one page.

## Browser support / performance

Targets desktop Chrome, Edge, Firefox and Safari. Render quality adapts down
automatically if frame times slip, and the flash decays on wall-clock time so a
slow machine never ends up with a white veil hanging over the next scene. On
narrow screens the object library and some panels collapse to keep the core
experience usable; desktop is the primary target.
