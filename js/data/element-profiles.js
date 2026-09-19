// ==========================================================================
// ELEMENT PROFILES — the per-element knowledge that personalises every
// visualization: where the element was forged (recipe + origin mix), the
// signature nuclear reaction, what it really looks like, its electron shells,
// the nucleus shown, and where you meet it today.
//
// Origin mixes are deliberately qualitative (1 = some, 2 = a lot, 3 = most).
// Sources: Johnson 2019 (Science 363, 474) / SDSS origin table; Kobayashi,
// Karakas & Lugaro 2020 (ApJ 900, 179); s/r splits after Busso et al. 2022 and
// Sneden, Cowan & Gallino 2008. The r-process site is still debated, so it is
// labelled "neutron-star mergers & other rare explosions".
// ==========================================================================
(function(){

  // ---------------- Origin categories (for the origin-mix bar) ----------------
  const ORIGINS = {
    BB:    { label:'Big Bang',                         color:'#8fb8ff' },
    CR:    { label:'Cosmic-ray collisions',            color:'#7fe0d0' },
    NOVA:  { label:'Nova eruptions',                   color:'#ffd27a' },
    LM:    { label:'Dying Sun-like stars',             color:'#ff9f6b' },
    MS:    { label:'Exploding massive stars',          color:'#9f8cff' },
    WD:    { label:'Exploding white dwarfs',           color:'#f2f2f2' },
    NS:    { label:'Neutron-star mergers & other rare explosions', color:'#ff6fae' },
    EARTH: { label:'Radioactive decay on Earth',       color:'#b8e07a' },
    HUMAN: { label:'Made by people',                   color:'#9aa6b8' },
  };

  // ---------------- Sites (visualization + recipe) ----------------
  const SITES = {
    bigbang:    { label:'The Big Bang',                     objs:['early'] },
    nova:       { label:'A nova eruption',                  objs:['whitedwarf','sunlike'] },
    spallation: { label:'Cosmic rays shattering nuclei',    objs:['cosmicrays','gas'] },
    sunlike:    { label:'A Sun-like star',                  objs:['sunlike'] },
    agb:        { label:'A dying Sun-like star',            objs:['redgiant'] },
    massive:    { label:'A massive star and its supernova', objs:['massive'] },
    typeIa:     { label:'An exploding white dwarf',         objs:['whitedwarf','sunlike'] },
    merger:     { label:'Colliding neutron stars',          objs:['neutronA','neutronB'] },
    decay:      { label:'Radioactive decay inside Earth',   objs:['rock'] },
    lab:        { label:'A human laboratory',               objs:['humanlab'] },
  };

  // Electron shells (K, L, M, N, O, P, Q) indexed by Z.
  const SHELLS = ("1|2|2,1|2,2|2,3|2,4|2,5|2,6|2,7|2,8|2,8,1|2,8,2|2,8,3|2,8,4|2,8,5|2,8,6|2,8,7|2,8,8|"+
    "2,8,8,1|2,8,8,2|2,8,9,2|2,8,10,2|2,8,11,2|2,8,13,1|2,8,13,2|2,8,14,2|2,8,15,2|2,8,16,2|2,8,18,1|2,8,18,2|"+
    "2,8,18,3|2,8,18,4|2,8,18,5|2,8,18,6|2,8,18,7|2,8,18,8|2,8,18,8,1|2,8,18,8,2|2,8,18,9,2|2,8,18,10,2|"+
    "2,8,18,12,1|2,8,18,13,1|2,8,18,13,2|2,8,18,15,1|2,8,18,16,1|2,8,18,18|2,8,18,18,1|2,8,18,18,2|2,8,18,18,3|"+
    "2,8,18,18,4|2,8,18,18,5|2,8,18,18,6|2,8,18,18,7|2,8,18,18,8|2,8,18,18,8,1|2,8,18,18,8,2|2,8,18,18,9,2|"+
    "2,8,18,19,9,2|2,8,18,21,8,2|2,8,18,22,8,2|2,8,18,23,8,2|2,8,18,24,8,2|2,8,18,25,8,2|2,8,18,25,9,2|"+
    "2,8,18,27,8,2|2,8,18,28,8,2|2,8,18,29,8,2|2,8,18,30,8,2|2,8,18,31,8,2|2,8,18,32,8,2|2,8,18,32,9,2|"+
    "2,8,18,32,10,2|2,8,18,32,11,2|2,8,18,32,12,2|2,8,18,32,13,2|2,8,18,32,14,2|2,8,18,32,15,2|2,8,18,32,17,1|"+
    "2,8,18,32,18,1|2,8,18,32,18,2|2,8,18,32,18,3|2,8,18,32,18,4|2,8,18,32,18,5|2,8,18,32,18,6|2,8,18,32,18,7|"+
    "2,8,18,32,18,8|2,8,18,32,18,8,1|2,8,18,32,18,8,2|2,8,18,32,18,9,2|2,8,18,32,18,10,2|2,8,18,32,20,9,2|"+
    "2,8,18,32,21,9,2|2,8,18,32,22,9,2|2,8,18,32,24,8,2|2,8,18,32,25,8,2|2,8,18,32,25,9,2|2,8,18,32,27,8,2|"+
    "2,8,18,32,28,8,2|2,8,18,32,29,8,2|2,8,18,32,30,8,2|2,8,18,32,31,8,2|2,8,18,32,32,8,2|2,8,18,32,32,8,3|"+
    "2,8,18,32,32,10,2|2,8,18,32,32,11,2|2,8,18,32,32,12,2|2,8,18,32,32,13,2|2,8,18,32,32,14,2|"+
    "2,8,18,32,32,15,2|2,8,18,32,32,16,2|2,8,18,32,32,17,2|2,8,18,32,32,18,2|2,8,18,32,32,18,3|"+
    "2,8,18,32,32,18,4|2,8,18,32,32,18,5|2,8,18,32,32,18,6|2,8,18,32,32,18,7|2,8,18,32,32,18,8")
    .split('|').map(s=>s.split(',').map(Number));

  const CATEGORY_LABEL = {
    nonmetal:'Reactive nonmetal', noble:'Noble gas', alkali:'Alkali metal', alkaline:'Alkaline-earth metal',
    metalloid:'Metalloid', halogen:'Halogen', posttransition:'Post-transition metal', transition:'Transition metal',
    lanthanide:'Lanthanide', actinide:'Actinide',
  };

  const P = {};
  function D(z, sym, o){ P[z] = Object.assign({ z, sym }, o); }

  // =====================================================================
  // Z 1–54
  // =====================================================================
  D(1,'H',{ mass:'1.008', phase:'gas', recipe:'bigbang', mix:{BB:3},
    rx:['uud -> p :: Within a millionth of a second, quarks bind into protons — hydrogen nuclei',
        'p + e- -> Hatom @380,000 years :: The universe cools enough for protons to hold on to electrons'],
    where:'The first moments of the universe',
    look:{ form:'tube', glow:'#ff5ea8', cap:'An invisible gas. Electrified in a glass tube it glows pink-violet — the mix of its red and blue spectral lines.' },
    spec:[410.17,434.05,486.13,656.28],
    today:'Two of every three atoms in the water you drink.',
    found:'Recognised as an element by Henry Cavendish, 1766.',
    note:'Every hydrogen atom in your body is about 13.8 billion years old.' });

  D(2,'He',{ mass:'4.0026', phase:'gas', recipe:'bigbang', mix:{BB:3, LM:1},
    rx:['p + n -> 2H + γ :: A proton and a neutron stick together as deuterium',
        '2H + 2H -> 3He + n :: Deuterium nuclei collide',
        '3He + 2H -> 4He + p @3–20 minutes :: Helium-4 forms — about a quarter of all ordinary matter'],
    where:'The first twenty minutes after the Big Bang',
    look:{ form:'tube', glow:'#ffb48c', cap:'An invisible, unreactive gas. In a discharge tube it glows a soft peach-orange.' },
    spec:[447.15,471.31,492.19,501.57,587.56,667.82,706.52],
    today:'Party balloons, and the super-cold coolant inside MRI scanners.',
    found:'Seen in the Sun\'s spectrum in 1868 (Janssen, Lockyer) — decades before it was found on Earth (Ramsay, 1895).' });

  D(3,'Li',{ mass:'6.94', phase:'solid', recipe:'nova', mix:{NOVA:2, BB:1, CR:1},
    rx:['3He + 4He -> 7Be + γ :: In the nova blast, helium nuclei fuse into beryllium-7',
        '7Be + e- -> 7Li + ν @53 days :: Beryllium-7 captures an electron and becomes lithium-7'],
    where:'The thermonuclear blast on a white dwarf\'s surface',
    look:{ form:'chunk', f0:[0.84,0.84,0.82], rough:0.28, tarnish:'#3c3c44', tarnishAmt:0.35,
      cap:'The lightest metal — soft enough to cut with a knife, light enough to float on oil. Tarnishes dark in air.' },
    spec:[610.36,670.78],
    today:'The rechargeable batteries in your phone and in electric cars.',
    found:'Johan August Arfwedson, 1817.',
    note:'The Big Bang made a little lithium, but most of it is now thought to come from nova eruptions.' });

  D(4,'Be',{ mass:'9.0122', phase:'solid', recipe:'spallation', mix:{CR:3},
    rx:['p* + 16O -> 9Be + frag :: A cosmic-ray proton smashes into an oxygen nucleus and chips off beryllium'],
    where:'Interstellar gas, struck by cosmic rays',
    look:{ form:'crystalChunk', f0:[0.62,0.63,0.65], metal:1, rough:0.32, cap:'A light, hard, steel-grey metal.' },
    today:'The mirror segments of the James Webb Space Telescope are made of beryllium.',
    found:'Recognised by Louis-Nicolas Vauquelin, 1798; isolated in 1828.',
    note:'Beryllium is too fragile to survive inside stars — cosmic-ray collisions are how the universe makes it.' });

  D(5,'B',{ mass:'10.81', phase:'solid', recipe:'spallation', mix:{CR:3, MS:1},
    rx:['p* + 12C -> 11C + p + n :: A cosmic-ray proton knocks a neutron out of a carbon nucleus',
        '11C -> 11B + e+ + ν @20 minutes :: Carbon-11 decays into boron-11'],
    where:'Interstellar gas, struck by cosmic rays',
    look:{ form:'crystalChunk', color:'#1d1b1b', metal:0.35, rough:0.2, cap:'Hard, black crystals with a glassy, metallic lustre.' },
    today:'Heat-proof borosilicate glass, like oven-safe dishes and lab flasks.',
    found:'Gay-Lussac & Thénard and Humphry Davy, 1808.' });

  D(6,'C',{ mass:'12.011', phase:'solid', recipe:'agb', mix:{LM:2, MS:2},
    rx:['4He + 4He -> 8Be :: Two helium nuclei stick together for a split second',
        '8Be + 4He -> 12C + γ :: A third helium nucleus arrives just in time — carbon forms (the triple-alpha process)'],
    where:'The helium-burning core of an ageing star',
    look:{ form:'carbon', cap:'Graphite (left) is soft, black and slightly shiny. Diamond is the same atoms packed differently — clear, and the hardest natural material.' },
    today:'Every living cell — and your pencil.',
    found:'Known since prehistory (charcoal, soot, diamond).',
    note:'Carbon forms only because of a lucky resonance in the carbon-12 nucleus predicted by Fred Hoyle in 1953.' });

  D(7,'N',{ mass:'14.007', phase:'gas', recipe:'agb', mix:{LM:3, MS:1},
    rx:['12C + p -> 13N + γ :: Carbon captures a proton',
        '13N -> 13C + e+ + ν @10 minutes :: Nitrogen-13 decays to carbon-13',
        '13C + p -> 14N + γ :: Another proton makes nitrogen-14, which piles up because the next step is so slow'],
    where:'The hydrogen-burning shell of a dying Sun-like star (the CNO cycle)',
    look:{ form:'tube', glow:'#b98cff', cap:'A colourless gas that makes up 78% of the air. In a discharge tube it glows violet-pink.' },
    today:'78% of every breath — and part of every protein and strand of DNA in you.',
    found:'Daniel Rutherford, 1772.' });

  D(8,'O',{ mass:'15.999', phase:'gas', recipe:'massive', mix:{MS:3, LM:1},
    rx:['12C + 4He -> 16O + γ :: A carbon nucleus captures a helium nucleus'],
    where:'The helium-burning core of a massive star',
    look:{ form:'dewar', liquid:'#8cc8ff', cap:'Colourless as a gas. Chilled to −183 °C it becomes a pale-blue liquid that sticks to magnets.' },
    spec:[557.73,630.03], specLabel:'Oxygen\'s auroral glow (green and red)',
    today:'The air you breathe, and about 65% of your body\'s mass.',
    found:'Carl Wilhelm Scheele (c. 1772) and Joseph Priestley (1774).' });

  D(9,'F',{ mass:'18.998', phase:'gas', recipe:'agb', mix:{LM:2, MS:1},
    rx:['14N + 4He -> 18F + γ :: Nitrogen captures helium during a helium flash',
        '18F -> 18O + e+ + ν @110 minutes :: Fluorine-18 decays to oxygen-18',
        '18O + p -> 15N + 4He :: A proton splits off a helium nucleus',
        '15N + 4He -> 19F + γ :: Nitrogen-15 captures helium — stable fluorine-19'],
    where:'Helium flashes deep inside a dying Sun-like star',
    look:{ form:'gas', tint:'#e9e27a', cap:'A pale-yellow gas — the most reactive of all elements, handled only in special sealed containers.' },
    today:'Fluoride in toothpaste, and non-stick pan coatings.',
    found:'Isolated by Henri Moissan, 1886.',
    note:'Where the universe\'s fluorine comes from is still debated; dying Sun-like stars are the leading source.' });

  D(10,'Ne',{ mass:'20.180', phase:'gas', recipe:'massive', mix:{MS:3},
    rx:['12C + 12C -> 20Ne + 4He :: Two carbon nuclei fuse'],
    where:'The carbon-burning shell of a massive star',
    look:{ form:'tube', glow:'#ff4a1c', cap:'A colourless gas that glows vivid red-orange in a discharge tube — the original neon sign.' },
    spec:[540.06,585.25,588.19,594.48,597.55,603.00,607.43,609.62,614.31,616.36,621.73,626.65,633.44,638.30,640.22,650.65,659.90,667.83,671.70,692.95,703.24],
    today:'Glowing red-orange signs.',
    found:'William Ramsay & Morris Travers, 1898.' });

  D(11,'Na',{ mass:'22.990', phase:'solid', recipe:'massive', mix:{MS:3, LM:1},
    rx:['12C + 12C -> 23Na + p :: Two carbon nuclei fuse and fling out a proton'],
    where:'The carbon-burning shell of a massive star',
    look:{ form:'chunk', f0:[0.86,0.85,0.82], rough:0.22, tarnish:'#d6cfbf', tarnishAmt:0.45,
      cap:'Soft, silvery metal with a fresh-cut shine that dulls within seconds. Stored under oil.' },
    spec:[588.995,589.592],
    today:'Table salt, and the orange glow of old street lights.',
    found:'Humphry Davy, 1807.' });

  D(12,'Mg',{ mass:'24.305', phase:'solid', recipe:'massive', mix:{MS:3},
    rx:['20Ne + 4He -> 24Mg + γ :: Neon captures a helium nucleus'],
    where:'The neon-burning shell of a massive star',
    look:{ form:'dendrite', f0:[0.80,0.80,0.80], rough:0.22, cap:'A shiny, light, silver-grey metal (shown as crystals grown from vapour).' },
    today:'The atom at the heart of every chlorophyll molecule; light alloys.',
    found:'Recognised by Joseph Black, 1755; isolated by Humphry Davy, 1808.' });

  D(13,'Al',{ mass:'26.982', phase:'solid', recipe:'massive', mix:{MS:3},
    rx:['26Mg + p -> 27Al + γ :: Magnesium-26 captures a proton'],
    where:'The carbon- and neon-burning shells of a massive star',
    look:{ form:'bar', f0:[0.91,0.92,0.92], rough:0.3, cap:'A light, silvery-white metal.' },
    today:'Drink cans, foil and aircraft.',
    found:'Hans Christian Ørsted, 1825.',
    note:'Radioactive aluminium-26 from massive stars glows in gamma rays across the whole Milky Way.' });

  D(14,'Si',{ mass:'28.085', phase:'solid', recipe:'massive', mix:{MS:3, WD:1},
    rx:['16O + 16O -> 28Si + 4He :: Two oxygen nuclei fuse'],
    where:'The oxygen-burning shell of a massive star',
    look:{ form:'crystalChunk', f0:[0.36,0.39,0.46], metal:0.9, rough:0.16, cap:'Hard, brittle crystals with a blue-grey metallic sheen.' },
    today:'Computer chips, sand and glass.',
    found:'Jöns Jacob Berzelius, 1824.' });

  D(15,'P',{ mass:'30.974', phase:'solid', recipe:'massive', mix:{MS:3},
    rx:['16O + 16O -> 31P + p :: Two oxygen nuclei fuse and release a proton'],
    where:'The oxygen-burning shell of a massive star',
    look:{ form:'phosphorus', cap:'White phosphorus is waxy and glows faintly green in air, so it is kept under water. Red phosphorus is a stable dark-red powder.' },
    today:'The backbone of your DNA, and the strike strip on a matchbox.',
    found:'Hennig Brand, 1669 — boiled down from urine.' });

  D(16,'S',{ mass:'32.06', phase:'solid', recipe:'massive', mix:{MS:3, WD:1},
    rx:['28Si + 4He -> 32S + γ :: Silicon captures a helium nucleus'],
    where:'The oxygen- and silicon-burning shells of a massive star',
    look:{ form:'sulfur', cap:'Bright yellow, brittle crystals.' },
    today:'Proteins in your hair and skin; the smell around volcanic vents.',
    found:'Known since ancient times ("brimstone").' });

  D(17,'Cl',{ mass:'35.45', phase:'gas', recipe:'massive', mix:{MS:3, WD:1},
    rx:['34S + p -> 35Cl + γ :: Sulfur-34 captures a proton'],
    where:'The oxygen-burning shell of a massive star',
    look:{ form:'gas', tint:'#c3df4f', cap:'A dense, yellow-green, choking gas.' },
    today:'Table salt and swimming-pool disinfectant.',
    found:'Carl Wilhelm Scheele, 1774; named by Humphry Davy, 1810.' });

  D(18,'Ar',{ mass:'39.95', phase:'gas', recipe:'massive', mix:{MS:3, WD:1},
    rx:['32S + 4He -> 36Ar + γ :: Sulfur captures a helium nucleus'],
    where:'The silicon-burning shell of a massive star',
    look:{ form:'tube', glow:'#c49cff', cap:'A colourless gas, nearly 1% of the air. It glows lavender-violet in a discharge tube.' },
    spec:[415.86,419.83,420.07,425.94,427.22,430.01,696.54,706.72,714.70,727.29,738.40,750.39,751.47],
    today:'Almost 1% of every breath; the shield gas in welding.',
    found:'Lord Rayleigh & William Ramsay, 1894.',
    note:'In space most argon is argon-36. On Earth it is mostly argon-40, made by radioactive potassium decaying in rocks.' });

  D(19,'K',{ mass:'39.098', phase:'solid', recipe:'massive', mix:{MS:3, WD:1},
    rx:['38Ar + p -> 39K + γ :: Argon-38 captures a proton'],
    where:'The oxygen-burning shell of a massive star',
    look:{ form:'ampoule', fill:'metal', f0:[0.80,0.80,0.80], rough:0.2, cap:'A soft, silvery metal that reacts violently with water — kept sealed away from air.' },
    spec:[404.41,404.72,766.49,769.90],
    today:'Bananas, and every nerve signal in your body.',
    found:'Humphry Davy, 1807.' });

  D(20,'Ca',{ mass:'40.078', phase:'solid', recipe:'massive', mix:{MS:3, WD:1},
    rx:['36Ar + 4He -> 40Ca + γ :: Argon captures a helium nucleus'],
    where:'The silicon-burning shell of a massive star',
    look:{ form:'dendrite', f0:[0.72,0.70,0.66], rough:0.42, tarnish:'#b9b3a6', tarnishAmt:0.3, cap:'Pure calcium is a dull, silvery-grey metal — nothing like the chalky compounds you know.' },
    spec:[393.37,396.85,422.67],
    today:'Your bones and teeth; limestone and marble.',
    found:'Humphry Davy, 1808.' });

  D(21,'Sc',{ mass:'44.956', phase:'solid', recipe:'massive', mix:{MS:3},
    rx:['44Ca + p -> 45Sc + γ :: Calcium-44 captures a proton'],
    where:'The blast of a core-collapse supernova',
    look:{ form:'dendrite', f0:[0.74,0.72,0.68], rough:0.25, cap:'A soft, silvery-white metal that can pick up a faint yellowish tint in air.' },
    today:'Aluminium–scandium alloys in bike frames; stadium floodlights.',
    found:'Lars Fredrik Nilson, 1879 — the "eka-boron" Mendeleev predicted.' });

  D(22,'Ti',{ mass:'47.867', phase:'solid', recipe:'massive', mix:{MS:3, WD:1},
    rx:['44Ti + 4He -> 48Cr + γ :: Titanium-44 captures a helium nucleus in the supernova blast',
        '48Cr -> 48V + e+ + ν @22 hours :: Chromium-48 decays',
        '48V -> 48Ti + e+ + ν @16 days :: Vanadium-48 decays into stable titanium-48'],
    where:'The blast of a core-collapse supernova',
    look:{ form:'crystalBar', f0:[0.54,0.50,0.45], rough:0.3, cap:'A lustrous silver-grey metal, strong and light.' },
    today:'Aircraft, joint implants, and the white pigment in paint and sunscreen.',
    found:'William Gregor, 1791; named by Martin Klaproth, 1795.' });

  D(23,'V',{ mass:'50.942', phase:'solid', recipe:'massive', mix:{MS:2, WD:2},
    rx:['50Cr + p -> 51Mn + γ :: Chromium-50 captures a proton',
        '51Mn -> 51Cr + e+ + ν @46 minutes :: Manganese-51 decays',
        '51Cr + e- -> 51V + ν @28 days :: Chromium-51 captures an electron — vanadium-51'],
    where:'The blast of a supernova',
    look:{ form:'crystalBar', f0:[0.55,0.57,0.60], rough:0.28, cap:'A hard, steel-grey metal.' },
    today:'Tough chrome-vanadium steel in wrenches and tools.',
    found:'Andrés Manuel del Río, 1801; rediscovered by Nils Sefström, 1830.' });

  D(24,'Cr',{ mass:'51.996', phase:'solid', recipe:'typeIa', mix:{WD:2, MS:2},
    rx:['48Cr + 4He -> 52Fe + γ :: In the searing blast, chromium-48 captures helium',
        '52Fe -> 52Mn + e+ + ν @8.3 hours :: Iron-52 decays',
        '52Mn -> 52Cr + e+ + ν @5.6 days :: Manganese-52 decays into chromium-52'],
    where:'The thermonuclear explosion of a white dwarf',
    look:{ form:'crystalChunk', f0:[0.55,0.56,0.56], metal:1, rough:0.1, cap:'A very hard, brilliantly shiny steel-grey metal.' },
    today:'Chrome plating and stainless steel.',
    found:'Louis-Nicolas Vauquelin, 1797.' });

  D(25,'Mn',{ mass:'54.938', phase:'solid', recipe:'typeIa', mix:{WD:3, MS:1},
    rx:['54Fe + p -> 55Co + γ :: Iron-54 captures a proton in the dense blast',
        '55Co -> 55Fe + e+ + ν @17.5 hours :: Cobalt-55 decays',
        '55Fe + e- -> 55Mn + ν @2.7 years :: Iron-55 captures an electron — manganese-55'],
    where:'The thermonuclear explosion of a white dwarf',
    look:{ form:'crystalChunk', f0:[0.55,0.55,0.54], metal:1, rough:0.36, cap:'A hard, brittle, silvery-grey metal.' },
    today:'Steel, and alkaline batteries.',
    found:'Johan Gottlieb Gahn, 1774.',
    note:'Manganese is one of the clearest fingerprints of exploding white dwarfs.' });

  D(26,'Fe',{ mass:'55.845', phase:'solid', recipe:'typeIa', mix:{WD:2, MS:2},
    rx:['52Fe + 4He -> 56Ni + γ :: Helium capture builds nickel-56 — the blast makes a lot of it',
        '56Ni + e- -> 56Co + ν @6.1 days :: Nickel-56 decays; its energy makes the supernova shine',
        '56Co -> 56Fe + e+ + ν @77 days :: Cobalt-56 decays into stable iron-56'],
    where:'The thermonuclear explosion of a white dwarf',
    look:{ form:'nugget', f0:[0.56,0.57,0.58], rough:0.34, tarnish:'#7a3b1c', tarnishAmt:0.14, cap:'A lustrous grey metal that rusts in moist air.' },
    today:'The haemoglobin in your blood, steel, and Earth\'s core.',
    found:'Known since ancient times — the first iron people used fell from the sky as meteorites.',
    note:'About half of the universe\'s iron comes from exploding white dwarfs; exploding massive stars made the rest.' });

  D(27,'Co',{ mass:'58.933', phase:'solid', recipe:'massive', mix:{MS:3, WD:1},
    rx:['55Co + 4He -> 59Cu + γ :: Helium capture in the supernova blast',
        '59Cu -> 59Ni + e+ + ν @82 seconds :: Copper-59 decays',
        '59Ni + e- -> 59Co + ν @76,000 years :: Nickel-59 captures an electron — cobalt-59'],
    where:'The blast of a core-collapse supernova',
    look:{ form:'crystalChunk', f0:[0.66,0.65,0.63], metal:1, rough:0.22, cap:'A hard, lustrous, silver-grey metal.' },
    today:'Deep-blue glass, lithium-ion batteries, and vitamin B12.',
    found:'Georg Brandt, c. 1735.' });

  D(28,'Ni',{ mass:'58.693', phase:'solid', recipe:'typeIa', mix:{WD:2, MS:2},
    rx:['54Fe + 4He -> 58Ni + γ :: Iron-54 captures helium in the blast'],
    where:'The thermonuclear explosion of a white dwarf',
    look:{ form:'pellets', f0:[0.66,0.61,0.53], rough:0.2, cap:'A silvery metal with a faint golden tinge.' },
    today:'Coins, stainless steel, and — with iron — Earth\'s core.',
    found:'Axel Fredrik Cronstedt, 1751.' });

  D(29,'Cu',{ mass:'63.546', phase:'solid', recipe:'massive', mix:{MS:3, LM:1},
    rx:['62Ni + n -> 63Ni :: Nickel captures a neutron',
        '63Ni -> 63Cu + e- + ν̄ @100 years :: A neutron turns into a proton — copper-63'],
    where:'Slow neutron captures inside a massive star',
    look:{ form:'nugget', f0:[0.955,0.638,0.538], rough:0.26, cap:'The reddish-orange metal — one of the very few metals that isn\'t grey or silver.' },
    today:'The wiring in your walls and the circuits in your phone.',
    found:'Known since prehistory.' });

  D(30,'Zn',{ mass:'65.38', phase:'solid', recipe:'massive', mix:{MS:3, LM:1},
    rx:['63Cu + n -> 64Cu :: Copper captures a neutron',
        '64Cu -> 64Zn + e- + ν̄ @13 hours :: Copper-64 decays into zinc-64'],
    where:'Neutron captures inside a massive star',
    look:{ form:'crystalChunk', f0:[0.66,0.72,0.76], metal:1, rough:0.3, cap:'A bluish-silver metal.' },
    today:'Galvanised steel, brass, and hundreds of enzymes in your body.',
    found:'Used in brass since antiquity; isolated in Europe by Andreas Marggraf, 1746.' });

  D(31,'Ga',{ mass:'69.723', phase:'solid', recipe:'massive', mix:{MS:2, LM:2},
    rx:['68Zn + n -> 69Zn :: Zinc captures a neutron',
        '69Zn -> 69Ga + e- + ν̄ @56 minutes :: Zinc-69 decays into gallium-69'],
    where:'Neutron captures inside a massive star',
    look:{ form:'melting', f0:[0.78,0.78,0.80], cap:'A silvery metal that melts in your hand — at 29.8 °C.' },
    today:'Blue and white LEDs, and fast chips in phones.',
    found:'Paul-Émile Lecoq de Boisbaudran, 1875 — Mendeleev\'s predicted "eka-aluminium".' });

  D(32,'Ge',{ mass:'72.630', phase:'solid', recipe:'massive', mix:{MS:2, LM:2},
    rx:['71Ga + n -> 72Ga :: Gallium captures a neutron',
        '72Ga -> 72Ge + e- + ν̄ @14 hours :: Gallium-72 decays into germanium-72'],
    where:'Neutron captures inside a massive star',
    look:{ form:'crystalChunk', f0:[0.55,0.56,0.57], metal:1, rough:0.14, cap:'A lustrous, hard, greyish-white metalloid.' },
    today:'Fibre-optic cables and infrared camera lenses.',
    found:'Clemens Winkler, 1886 — Mendeleev\'s predicted "eka-silicon".' });

  D(33,'As',{ mass:'74.922', phase:'solid', recipe:'massive', mix:{MS:2, NS:1, LM:1},
    rx:['74Ge + n -> 75Ge :: Germanium captures a neutron',
        '75Ge -> 75As + e- + ν̄ @83 minutes :: Germanium-75 decays into arsenic-75'],
    where:'Neutron captures inside a massive star',
    look:{ form:'crystalChunk', f0:[0.42,0.43,0.44], metal:1, rough:0.25, cap:'Brittle, grey, metallic-looking crystals.' },
    today:'Gallium-arsenide chips in phones and satellites.',
    found:'Known since antiquity; described by Albertus Magnus, c. 1250.' });

  D(34,'Se',{ mass:'78.971', phase:'solid', recipe:'massive', mix:{MS:2, NS:1, LM:1},
    rx:['75As + n -> 76As :: Arsenic captures a neutron',
        '76As -> 76Se + e- + ν̄ @26 hours :: Arsenic-76 decays into selenium-76'],
    where:'Neutron captures inside a massive star',
    look:{ form:'crystalChunk', f0:[0.40,0.40,0.42], metal:0.9, rough:0.3, cap:'Its stable form is grey and metallic-looking; it also comes as a red powder.' },
    today:'An essential nutrient — Brazil nuts are packed with it.',
    found:'Jöns Jacob Berzelius, 1817.' });

  D(35,'Br',{ mass:'79.904', phase:'liquid', recipe:'massive', mix:{MS:2, NS:1, LM:1},
    rx:['80Se + n -> 81Se :: Selenium captures a neutron',
        '81Se -> 81Br + e- + ν̄ @18 minutes :: Selenium-81 decays into bromine-81'],
    where:'Neutron captures inside a massive star',
    look:{ form:'ampoule', fill:'liquid', color:'#5a1005', vapor:'#b3501f', cap:'A dark red-brown liquid that gives off orange-brown fumes — one of only two elements that are liquid at room temperature.' },
    today:'Flame retardants in electronics.',
    found:'Antoine Balard and Carl Löwig, 1825–26.' });

  D(36,'Kr',{ mass:'83.798', phase:'gas', recipe:'massive', mix:{MS:2, NS:1, LM:1},
    rx:['81Br + n -> 82Br :: Bromine captures a neutron',
        '82Br -> 82Kr + e- + ν̄ @35 hours :: Bromine-82 decays into krypton-82'],
    where:'Neutron captures inside a massive star',
    look:{ form:'tube', glow:'#e8ddff', cap:'A colourless gas that glows a smoky white in a discharge tube.' },
    spec:[427.40,431.96,436.26,445.39,446.37,450.24,557.03,587.09,758.74,760.15],
    today:'Insulating gas in energy-efficient windows. From 1960 to 1983 the metre was defined by a krypton spectral line.',
    found:'William Ramsay & Morris Travers, 1898.' });

  D(37,'Rb',{ mass:'85.468', phase:'solid', recipe:'agb', mix:{LM:2, NS:1, MS:1},
    rx:['84Kr + n -> 85Kr :: Krypton captures a neutron',
        '85Kr -> 85Rb + e- + ν̄ @11 years :: Krypton-85 decays into rubidium-85'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'ampoule', fill:'metal', f0:[0.80,0.79,0.77], rough:0.18, cap:'A soft, silvery-white metal that melts at 39 °C and bursts into flame in air.' },
    spec:[420.18,421.55,780.03,794.76],
    today:'Atomic clocks, including many aboard GPS satellites.',
    found:'Robert Bunsen & Gustav Kirchhoff, 1861 — named for its deep-red spectral lines.' });

  D(38,'Sr',{ mass:'87.62', phase:'solid', recipe:'agb', mix:{LM:3, NS:1},
    rx:['85Rb + n -> 86Rb :: Rubidium captures a neutron',
        '86Rb -> 86Sr + e- + ν̄ @19 days :: Rubidium-86 decays into strontium',
        '86Sr + 2n -> 88Sr :: Two more captures — strontium-88, with a "magic" 50 neutrons'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'dendrite', f0:[0.80,0.75,0.60], rough:0.3, cap:'A soft, silvery metal that quickly turns yellowish in air.' },
    spec:[407.77,421.55,460.73],
    today:'The red in fireworks, and glow-in-the-dark toys.',
    found:'Adair Crawford, 1790; isolated by Humphry Davy, 1808.',
    note:'In 2019 astronomers spotted freshly made strontium in the kilonova from a neutron-star merger.' });

  D(39,'Y',{ mass:'88.906', phase:'solid', recipe:'agb', mix:{LM:3, NS:1},
    rx:['88Sr + n -> 89Sr :: Strontium captures a neutron',
        '89Sr -> 89Y + e- + ν̄ @51 days :: Strontium-89 decays into yttrium-89'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'dendrite', f0:[0.75,0.75,0.74], rough:0.2, cap:'A silvery, crystalline metal.' },
    today:'Lasers, superconductors, and the red dots in old TV screens.',
    found:'Johan Gadolin, 1794 — named after the Swedish village of Ytterby.' });

  D(40,'Zr',{ mass:'91.224', phase:'solid', recipe:'agb', mix:{LM:3, NS:1},
    rx:['89Y + n -> 90Y :: Yttrium captures a neutron',
        '90Y -> 90Zr + e- + ν̄ @64 hours :: Yttrium-90 decays into zirconium-90'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'crystalBar', f0:[0.62,0.61,0.60], rough:0.28, cap:'A lustrous, greyish-white metal.' },
    today:'Nuclear fuel-rod cladding, and cubic-zirconia gems.',
    found:'Martin Klaproth, 1789.' });

  D(41,'Nb',{ mass:'92.906', phase:'solid', recipe:'agb', mix:{LM:2, NS:1},
    rx:['92Zr + n -> 93Zr :: Zirconium captures a neutron',
        '93Zr -> 93Nb + e- + ν̄ @1.6 million years :: Zirconium-93 slowly decays into niobium-93'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'crystalChunk', f0:[0.58,0.57,0.59], metal:1, rough:0.25, cap:'A soft, grey, lustrous metal.' },
    today:'The superconducting magnets inside MRI scanners.',
    found:'Charles Hatchett, 1801.' });

  D(42,'Mo',{ mass:'95.95', phase:'solid', recipe:'agb', mix:{LM:2, NS:1},
    rx:['93Nb + n -> 94Nb :: Niobium captures a neutron',
        '94Nb + n -> 95Nb :: …and another',
        '95Nb -> 95Mo + e- + ν̄ @35 days :: Niobium-95 decays into molybdenum-95'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'bar', f0:[0.60,0.60,0.62], metal:1, rough:0.24, cap:'A silvery-grey metal with one of the highest melting points — usually pressed and sintered into bars.' },
    today:'High-strength steel, and the enzymes plants use to take nitrogen from the air.',
    found:'Carl Wilhelm Scheele, 1778; isolated by Peter Jacob Hjelm, 1781.' });

  D(43,'Tc',{ mass:null, phase:'solid', recipe:'lab', mix:{HUMAN:3},
    rx:['96Mo + 2H -> 97Tc + n :: Molybdenum struck by deuterons in a cyclotron'],
    where:'A cyclotron at Berkeley, 1937',
    lab:{ type:'cyclotron', place:'Berkeley Radiation Laboratory (analysed in Palermo)', year:'1937', atoms:'A few trace samples' },
    iso:{ A:99, half:'211,000 years', label:'technetium-99' },
    look:{ form:'pellets', f0:[0.62,0.62,0.63], metal:1, rough:0.3, cap:'A silvery-grey, radioactive metal, usually handled as pellets or powder. Every piece has been made by people.' },
    today:'Medical scans — technetium-99m is used in tens of millions of imaging procedures a year.',
    found:'Carlo Perrier & Emilio Segrè, 1937 — the first element made artificially.',
    note:'Red giants make technetium too — spotting it in their spectra in 1952 proved stars forge new elements.' });

  D(44,'Ru',{ mass:'101.07', phase:'solid', recipe:'merger', mix:{NS:2, LM:1},
    rx:['102Tc -> 102Ru + e- + ν̄ @5 seconds :: The last step of a rapid decay chain lands on ruthenium-102'],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'crystalChunk', f0:[0.70,0.70,0.70], metal:1, rough:0.14, cap:'A hard, silvery-white metal.' },
    today:'Hard-disk drives and electrical contacts.',
    found:'Karl Ernst Claus, 1844.' });

  D(45,'Rh',{ mass:'102.91', phase:'solid', recipe:'merger', mix:{NS:3, LM:1},
    rx:['103Ru -> 103Rh + e- + ν̄ @39 days :: Ruthenium-103 decays into rhodium-103'],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'crystalChunk', f0:[0.85,0.84,0.82], metal:1, rough:0.08, cap:'A silvery-white, highly reflective metal.' },
    today:'Catalytic converters in car exhausts.',
    found:'William Hyde Wollaston, 1803.' });

  D(46,'Pd',{ mass:'106.42', phase:'solid', recipe:'merger', mix:{NS:2, LM:2},
    rx:['106Rh -> 106Pd + e- + ν̄ @30 seconds :: Rhodium-106 decays into palladium-106'],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'nugget', f0:[0.733,0.697,0.652], rough:0.15, cap:'A lustrous, silvery-white metal.' },
    today:'Catalytic converters, electronics and dentistry.',
    found:'William Hyde Wollaston, 1803.' });

  D(47,'Ag',{ mass:'107.87', phase:'solid', recipe:'merger', mix:{NS:3, LM:1},
    rx:['107Pd -> 107Ag + e- + ν̄ @6.5 million years :: Palladium-107 slowly decays into silver-107'],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'bar', f0:[0.972,0.960,0.915], rough:0.1, cap:'A brilliant white metal — the most reflective of all.' },
    today:'Jewellery, mirrors and electronics.',
    found:'Known since ancient times.' });

  D(48,'Cd',{ mass:'112.41', phase:'solid', recipe:'agb', mix:{LM:2, NS:2},
    rx:['109Ag + n -> 110Ag :: Silver captures a neutron',
        '110Ag -> 110Cd + e- + ν̄ @25 seconds :: Silver-110 decays into cadmium-110'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'crystalChunk', f0:[0.70,0.72,0.75], metal:1, rough:0.25, cap:'A soft, bluish-silver metal.' },
    today:'Rechargeable nickel–cadmium batteries and bright yellow pigments.',
    found:'Friedrich Stromeyer, 1817.' });

  D(49,'In',{ mass:'114.82', phase:'solid', recipe:'merger', mix:{NS:2, LM:1},
    rx:['115Cd -> 115In + e- + ν̄ @54 hours :: Cadmium-115 decays into indium-115'],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'bar', f0:[0.80,0.80,0.81], rough:0.18, cap:'So soft you can mark it with a fingernail; silvery-white and lustrous.' },
    spec:[410.18,451.13],
    today:'The transparent conductive coating on touchscreens.',
    found:'Ferdinand Reich & Theodor Richter, 1863 — named for its indigo spectral line.' });

  D(50,'Sn',{ mass:'118.71', phase:'solid', recipe:'agb', mix:{LM:2, NS:1},
    rx:['115In + n -> 116In :: Indium captures a neutron',
        '116In -> 116Sn + e- + ν̄ @14 seconds :: Indium-116 decays into tin-116'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'nugget', f0:[0.75,0.75,0.74], rough:0.25, cap:'A silvery-white metal.' },
    today:'Solder in electronics, and bronze.',
    found:'Known since ancient times — the tin in Bronze Age bronze.' });

  D(51,'Sb',{ mass:'121.76', phase:'solid', recipe:'merger', mix:{NS:2, LM:1},
    rx:['121Sn -> 121Sb + e- + ν̄ @27 hours :: Tin-121 decays into antimony-121'],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'crystalChunk', f0:[0.65,0.65,0.66], metal:1, rough:0.1, cap:'A silvery, brittle metalloid with a flaky, crystalline surface.' },
    today:'Flame retardants and lead-acid batteries.',
    found:'Known since ancient times.' });

  D(52,'Te',{ mass:'127.60', phase:'solid', recipe:'merger', mix:{NS:3, LM:1},
    rx:['130Sb -> 130Te + e- + ν̄ @40 minutes :: Antimony-130 decays into tellurium-130'],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'crystalChunk', f0:[0.60,0.60,0.62], metal:1, rough:0.15, cap:'A silvery-white, brittle, lustrous metalloid.' },
    today:'Thin-film solar panels.',
    found:'Franz-Joseph Müller von Reichenstein, 1782.' });

  D(53,'I',{ mass:'126.90', phase:'solid', recipe:'merger', mix:{NS:3},
    rx:['127Te -> 127I + e- + ν̄ @9.4 hours :: Tellurium-127 decays into iodine-127'],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'iodine', cap:'Shiny violet-black crystals that give off a violet vapour when warmed.' },
    today:'The hormones made by your thyroid, and iodised salt.',
    found:'Bernard Courtois, 1811 — from seaweed ash.' });

  D(54,'Xe',{ mass:'131.29', phase:'gas', recipe:'merger', mix:{NS:3, LM:1},
    rx:['132I -> 132Xe + e- + ν̄ @2.3 hours :: Iodine-132 decays into xenon-132'],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'tube', glow:'#7aa2ff', cap:'A colourless, heavy gas that glows bright blue in a discharge tube.' },
    spec:[450.10,452.47,462.43,467.12,473.42,480.70,482.97,492.32],
    today:'Ion thrusters on spacecraft, and bright car headlights.',
    found:'William Ramsay & Morris Travers, 1898.' });

  window.ElementProfiles = { P, D, SITES, ORIGINS, SHELLS, CATEGORY_LABEL };
})();
