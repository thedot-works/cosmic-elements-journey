// ==========================================================================
// ELEMENT PROFILES (part 2) — Z 55–118, plus the query API used by the lab,
// the theater and the reveal.
// ==========================================================================
(function(){
  const { D } = window.ElementProfiles;

  const R = (from, to, half, note) => `${from} -> ${to} + e- + ν̄ @${half} :: ${note}`;

  // =====================================================================
  // Z 55–83
  // =====================================================================
  D(55,'Cs',{ mass:'132.91', phase:'solid', recipe:'merger', mix:{NS:3, LM:1},
    rx:[R('133Xe','133Cs','5.2 days','Xenon-133 decays into caesium-133')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'ampoule', fill:'metal', f0:[0.95,0.80,0.46], rough:0.12, molten:true, cap:'A soft, pale-gold metal that melts at 28.5 °C — a warm day turns it liquid. Kept sealed away from air.' },
    spec:[455.53,459.32],
    today:'Atomic clocks — the second itself is defined by caesium.',
    found:'Robert Bunsen & Gustav Kirchhoff, 1860 — the first element found with a spectroscope, named for its sky-blue lines.' });

  D(56,'Ba',{ mass:'137.33', phase:'solid', recipe:'agb', mix:{LM:3, NS:1},
    rx:['133Cs + n -> 134Cs :: Caesium captures a neutron',
        R('134Cs','134Ba','2 years','Caesium-134 decays into barium'),
        '134Ba + 4n -> 138Ba :: More captures reach barium-138, with a "magic" 82 neutrons'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'chunk', f0:[0.80,0.77,0.64], rough:0.3, tarnish:'#6a6758', tarnishAmt:0.22, cap:'A soft, silvery metal with a slight yellow tint, stored away from air.' },
    spec:[455.40,553.55],
    today:'The green in fireworks, and the "barium meal" that shows up on X-rays.',
    found:'Recognised by Carl Wilhelm Scheele, 1772; isolated by Humphry Davy, 1808.' });

  D(57,'La',{ mass:'138.91', phase:'solid', recipe:'agb', mix:{LM:3, NS:1},
    rx:['138Ba + n -> 139Ba :: Barium captures a neutron',
        R('139Ba','139La','83 minutes','Barium-139 decays into lanthanum-139')],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'chunk', f0:[0.74,0.73,0.70], rough:0.3, tarnish:'#858272', tarnishAmt:0.22, cap:'A soft, silvery-white metal that tarnishes in air.' },
    today:'High-quality camera lenses and hybrid-car batteries.',
    found:'Carl Gustaf Mosander, 1839.' });

  D(58,'Ce',{ mass:'140.12', phase:'solid', recipe:'agb', mix:{LM:3, NS:1},
    rx:['139La + n -> 140La :: Lanthanum captures a neutron',
        R('140La','140Ce','40 hours','Lanthanum-140 decays into cerium-140')],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'chunk', f0:[0.68,0.67,0.64], rough:0.32, tarnish:'#6c695f', tarnishAmt:0.26, cap:'An iron-grey metal. Scrape it and it throws sparks — that\'s why it\'s in lighter flints.' },
    today:'Lighter flints, catalytic converters and glass polish.',
    found:'Jöns Jacob Berzelius & Wilhelm Hisinger (and independently Martin Klaproth), 1803.' });

  D(59,'Pr',{ mass:'140.91', phase:'solid', recipe:'agb', mix:{LM:2, NS:2},
    rx:['140Ce + n -> 141Ce :: Cerium captures a neutron',
        R('141Ce','141Pr','33 days','Cerium-141 decays into praseodymium-141')],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'chunk', f0:[0.72,0.72,0.66], rough:0.3, tarnish:'#8fa05c', tarnishAmt:0.38, cap:'A silvery metal that grows a green oxide coat in air.' },
    today:'Strong aircraft-engine alloys, and the glass in welders\' goggles.',
    found:'Carl Auer von Welsbach, 1885.' });

  D(60,'Nd',{ mass:'144.24', phase:'solid', recipe:'agb', mix:{LM:2, NS:2},
    rx:['141Pr + n -> 142Pr :: Praseodymium captures a neutron',
        R('142Pr','142Nd','19 hours','Praseodymium-142 decays into neodymium-142')],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'chunk', f0:[0.72,0.71,0.68], rough:0.28, tarnish:'#7b766a', tarnishAmt:0.26, cap:'A silvery metal that tarnishes quickly.' },
    today:'The powerful magnets in headphones, electric motors and wind turbines.',
    found:'Carl Auer von Welsbach, 1885.' });

  D(61,'Pm',{ mass:null, phase:'solid', recipe:'lab', mix:{HUMAN:3},
    rx:['235U + n -> 147Nd + frag :: A uranium nucleus splits in a nuclear reactor',
        R('147Nd','147Pm','11 days','Neodymium-147 decays into promethium-147')],
    where:'Uranium fission products from a nuclear reactor, Oak Ridge, 1945',
    lab:{ type:'reactor', place:'Clinton Laboratories (Oak Ridge)', year:'1945', atoms:'Milligram amounts separated from fission debris' },
    iso:{ A:147, half:'2.6 years', label:'promethium-147' },
    look:{ form:'glowSalt', glow:'#9fe9e0', cap:'Radioactive. Its salts glow a pale blue-green in the dark from their own radiation.' },
    today:'Once powered some early pacemaker batteries and luminous dials.',
    found:'Jacob Marinsky, Lawrence Glendenin & Charles Coryell, 1945.' });

  D(62,'Sm',{ mass:'150.36', phase:'solid', recipe:'merger', mix:{NS:2, LM:1},
    rx:[R('152Pm','152Sm','4 minutes','Promethium-152 decays into samarium-152')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'dendrite', f0:[0.74,0.72,0.64], rough:0.25, cap:'A silvery metal with a faint yellow tint.' },
    today:'Samarium–cobalt magnets that survive high heat.',
    found:'Paul-Émile Lecoq de Boisbaudran, 1879.' });

  D(63,'Eu',{ mass:'151.96', phase:'solid', recipe:'merger', mix:{NS:3},
    rx:[R('153Sm','153Eu','46 hours','Samarium-153 decays into europium-153')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'chunk', f0:[0.78,0.72,0.55], rough:0.3, tarnish:'#8c835d', tarnishAmt:0.3, cap:'A soft, silvery metal with a pale yellow tint — the most reactive rare earth, kept under argon.' },
    today:'The red and blue phosphors in screens and LED lighting.',
    found:'Eugène-Anatole Demarçay, 1896–1901.',
    note:'Europium is almost pure r-process, so astronomers use it to trace neutron-star-merger debris in old stars.' });

  D(64,'Gd',{ mass:'157.25', phase:'solid', recipe:'merger', mix:{NS:3, LM:1},
    rx:[R('158Eu','158Gd','46 minutes','Europium-158 decays into gadolinium-158')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'dendrite', f0:[0.74,0.74,0.72], rough:0.2, cap:'A silvery-white metal.' },
    today:'Contrast agents for MRI scans.',
    found:'Jean Charles Galissard de Marignac, 1880.' });

  D(65,'Tb',{ mass:'158.93', phase:'solid', recipe:'merger', mix:{NS:3},
    rx:[R('159Gd','159Tb','19 hours','Gadolinium-159 decays into terbium-159')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'dendrite', f0:[0.73,0.73,0.72], rough:0.22, cap:'A silvery-grey metal.' },
    today:'Green phosphors in lamps and screens.',
    found:'Carl Gustaf Mosander, 1843.' });

  D(66,'Dy',{ mass:'162.50', phase:'solid', recipe:'merger', mix:{NS:3, LM:1},
    rx:[R('164Tb','164Dy','3 minutes','Terbium-164 decays into dysprosium-164')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'dendrite', f0:[0.78,0.78,0.77], rough:0.15, cap:'A bright, silvery metal.' },
    today:'Heat-resistant magnets in electric-car motors.',
    found:'Paul-Émile Lecoq de Boisbaudran, 1886.' });

  D(67,'Ho',{ mass:'164.93', phase:'solid', recipe:'merger', mix:{NS:3},
    rx:[R('165Dy','165Ho','2.3 hours','Dysprosium-165 decays into holmium-165')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'dendrite', f0:[0.76,0.76,0.74], rough:0.2, cap:'A silvery-white metal.' },
    today:'Medical lasers that break up kidney stones.',
    found:'Marc Delafontaine & Jacques-Louis Soret, 1878; Per Teodor Cleve, 1879.' });

  D(68,'Er',{ mass:'167.26', phase:'solid', recipe:'merger', mix:{NS:3, LM:1},
    rx:[R('166Ho','166Er','27 hours','Holmium-166 decays into erbium-166')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'dendrite', f0:[0.76,0.76,0.75], rough:0.2, cap:'A silvery-white metal.' },
    today:'Amplifiers that boost the light carrying internet data through fibre-optic cables.',
    found:'Carl Gustaf Mosander, 1843.' });

  D(69,'Tm',{ mass:'168.93', phase:'solid', recipe:'merger', mix:{NS:3, LM:1},
    rx:[R('169Er','169Tm','9.4 days','Erbium-169 decays into thulium-169')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'dendrite', f0:[0.70,0.71,0.72], rough:0.22, cap:'A silvery-grey metal.' },
    today:'Portable X-ray sources.',
    found:'Per Teodor Cleve, 1879.' });

  D(70,'Yb',{ mass:'173.05', phase:'solid', recipe:'merger', mix:{NS:2, LM:1},
    rx:[R('174Tm','174Yb','5.4 minutes','Thulium-174 decays into ytterbium-174')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'dendrite', f0:[0.80,0.77,0.64], rough:0.18, cap:'A bright, silvery metal with a slight yellow tint.' },
    today:'Some of the most precise atomic clocks ever built.',
    found:'Jean Charles Galissard de Marignac, 1878.' });

  D(71,'Lu',{ mass:'174.97', phase:'solid', recipe:'merger', mix:{NS:3, LM:1},
    rx:[R('175Yb','175Lu','4.2 days','Ytterbium-175 decays into lutetium-175')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'dendrite', f0:[0.76,0.76,0.76], rough:0.2, cap:'A dense, silvery-white metal.' },
    today:'PET-scanner detectors and targeted cancer therapy.',
    found:'Georges Urbain, Carl Auer von Welsbach and Charles James, 1907.' });

  D(72,'Hf',{ mass:'178.49', phase:'solid', recipe:'agb', mix:{LM:2, NS:2},
    rx:['176Lu + n -> 177Lu :: Lutetium captures a neutron',
        R('177Lu','177Hf','6.6 days','Lutetium-177 decays into hafnium-177'),
        '177Hf + 3n -> 180Hf :: More captures reach hafnium-180'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'crystalBar', f0:[0.60,0.59,0.58], rough:0.26, cap:'A lustrous silver-grey metal.' },
    today:'The ultra-thin insulating layer inside modern microchips.',
    found:'Dirk Coster & George de Hevesy, 1923.' });

  D(73,'Ta',{ mass:'180.95', phase:'solid', recipe:'merger', mix:{NS:2, LM:2},
    rx:[R('181Hf','181Ta','42 days','Hafnium-181 decays into tantalum-181')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'bar', f0:[0.52,0.55,0.60], metal:1, rough:0.18, cap:'A hard, blue-grey, lustrous metal, usually rolled into sheet or bar.' },
    today:'Tiny capacitors in phones and laptops.',
    found:'Anders Gustaf Ekeberg, 1802.' });

  D(74,'W',{ mass:'183.84', phase:'solid', recipe:'agb', mix:{LM:2, NS:2},
    rx:['181Ta + n -> 182Ta :: Tantalum captures a neutron',
        R('182Ta','182W','114 days','Tantalum-182 decays into tungsten-182'),
        '182W + 2n -> 184W :: Two more captures — tungsten-184'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'crystalBar', f0:[0.50,0.50,0.48], metal:1, rough:0.2, cap:'A greyish-white metal with the highest melting point of any element (3,422 °C) — drawn into rods and filaments.' },
    today:'Old light-bulb filaments and tungsten-carbide drill bits.',
    found:'Juan José & Fausto Elhuyar, 1783.' });

  D(75,'Re',{ mass:'186.21', phase:'solid', recipe:'merger', mix:{NS:3},
    rx:[R('187W','187Re','24 hours','Tungsten-187 decays into rhenium-187')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'pellets', f0:[0.60,0.60,0.61], metal:1, rough:0.28, cap:'A silvery-grey, very dense metal, normally supplied as pressed pellets.' },
    today:'Jet-engine turbine blades.',
    found:'Walter Noddack, Ida Tacke & Otto Berg, 1925.' });

  D(76,'Os',{ mass:'190.23', phase:'solid', recipe:'merger', mix:{NS:3},
    rx:[R('192Re','192Os','16 seconds','Rhenium-192 decays into osmium-192')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'crystalChunk', f0:[0.55,0.60,0.68], metal:1, rough:0.1, cap:'A bluish-grey metal — the densest element of all.' },
    today:'Hard-wearing electrical contacts; once the tips of fountain-pen nibs.',
    found:'Smithson Tennant, 1803.' });

  D(77,'Ir',{ mass:'192.22', phase:'solid', recipe:'merger', mix:{NS:3},
    rx:[R('193Os','193Ir','30 hours','Osmium-193 decays into iridium-193')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'crystalChunk', f0:[0.72,0.72,0.72], metal:1, rough:0.1, cap:'A silvery-white, extremely hard and corrosion-proof metal.' },
    today:'Long-life spark plugs.',
    found:'Smithson Tennant, 1803.',
    note:'A thin iridium-rich layer in rocks worldwide marks the asteroid impact that ended the age of dinosaurs.' });

  D(78,'Pt',{ mass:'195.08', phase:'solid', recipe:'merger', mix:{NS:3},
    rx:[R('195Ir','195Pt','2.5 hours','Iridium-195 decays into platinum-195')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'nugget', f0:[0.673,0.637,0.585], rough:0.18, cap:'A heavy, silvery-white precious metal.' },
    today:'Catalytic converters and jewellery.',
    found:'Used in pre-Columbian South America; described in Europe by Antonio de Ulloa, 1748.' });

  D(79,'Au',{ mass:'196.97', phase:'solid', recipe:'merger', mix:{NS:3},
    rx:[R('197Pt','197Au','20 hours','Platinum-197 decays into gold-197')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'nugget', f0:[1.0,0.766,0.336], rough:0.12, cap:'A soft, heavy, warm-yellow metal that never tarnishes.' },
    today:'Jewellery, and the connectors in your phone.',
    found:'Known since prehistory.' });

  D(80,'Hg',{ mass:'200.59', phase:'liquid', recipe:'agb', mix:{LM:2, NS:2},
    rx:['197Au + n -> 198Au :: Gold captures a neutron',
        R('198Au','198Hg','2.7 days','Gold-198 decays into mercury-198'),
        '198Hg + 4n -> 202Hg :: More captures reach mercury-202'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'liquidMetal', f0:[0.781,0.779,0.779], cap:'A silvery liquid metal — the only metal that is liquid at room temperature.' },
    spec:[404.66,435.83,546.07,576.96,579.07],
    today:'Old thermometers and fluorescent lamps.',
    found:'Known since ancient times ("quicksilver").' });

  D(81,'Tl',{ mass:'204.38', phase:'solid', recipe:'agb', mix:{LM:3, NS:1},
    rx:['204Hg + n -> 205Hg :: Mercury captures a neutron',
        R('205Hg','205Tl','5 minutes','Mercury-205 decays into thallium-205')],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'chunk', f0:[0.70,0.70,0.72], rough:0.25, tarnish:'#59616d', tarnishAmt:0.3, cap:'A soft, silvery metal that tarnishes bluish-grey. Highly toxic.' },
    spec:[535.05],
    today:'Heart "stress test" scans (thallium-201) and infrared optics.',
    found:'William Crookes, 1861 — named for its bright green spectral line.' });

  D(82,'Pb',{ mass:'207.2', phase:'solid', recipe:'agb', mix:{LM:3, NS:1},
    rx:['205Tl + n -> 206Tl :: Thallium captures a neutron',
        R('206Tl','206Pb','4 minutes','Thallium-206 decays into lead-206'),
        '206Pb + 2n -> 208Pb :: Two more captures — lead-208'],
    where:'Slow neutron captures in a dying Sun-like star (the s-process)',
    look:{ form:'nugget', f0:[0.45,0.46,0.50], rough:0.46, cap:'A soft, heavy, dull bluish-grey metal.' },
    today:'Car batteries and radiation shielding.',
    found:'Known since ancient times.',
    note:'Lead-208 has 82 protons and 126 neutrons — both "magic" numbers — which makes it exceptionally stable.' });

  D(83,'Bi',{ mass:'208.98', phase:'solid', recipe:'merger', mix:{NS:2, LM:2},
    rx:[R('209Pb','209Bi','3.3 hours','Lead-209 decays into bismuth-209')],
    where:'Neutron-rich debris from colliding neutron stars',
    look:{ form:'bismuth', cap:'A silvery-pink metal. Grown in the lab it forms stepped crystals whose thin oxide skin shimmers in rainbow colours.' },
    today:'Stomach remedies, lead-free solder and pearly cosmetics.',
    found:'Known since the Middle Ages; recognised as distinct by Claude Geoffroy, 1753.',
    note:'Bismuth-209 is technically radioactive, with a half-life about a billion times the age of the universe.' });

  // =====================================================================
  // Z 84–92 — decay-chain elements, thorium and uranium
  // =====================================================================
  D(84,'Po',{ mass:null, phase:'solid', recipe:'decay', mix:{EARTH:3},
    rx:[R('210Pb','210Bi','22 years','Lead-210 decays into bismuth-210'),
        R('210Bi','210Po','5 days','Bismuth-210 decays into polonium-210')],
    chain:{ series:'U238', stop:'210Po' },
    where:'The uranium-238 decay chain, inside uranium ore',
    iso:{ A:210, half:'138 days', label:'polonium-210' },
    look:{ form:'glowMetal', f0:[0.65,0.65,0.66], glow:'#7fb0ff', strength:0.8, cap:'A silvery metal so radioactive that the air around a sample glows blue.' },
    today:'Anti-static brushes used in industry.',
    found:'Marie & Pierre Curie, 1898 — named after Poland.' });

  D(85,'At',{ mass:null, phase:'solid', recipe:'decay', mix:{EARTH:3},
    rx:[R('218Po','218At','3 minutes','Very rarely (0.02% of the time), polonium-218 beta-decays into astatine-218')],
    chain:{ series:'U238', stop:'218At' },
    where:'A rare branch of the uranium-238 decay chain',
    iso:{ A:218, half:'about 1.5 seconds', label:'astatine-218' },
    look:{ form:'atoms', count:'Only trace atoms', cap:'No one has ever seen a visible piece. A lump would vaporise from its own radioactive heat.' },
    today:'Being tested for targeted cancer therapy (astatine-211).',
    found:'Dale Corson, Kenneth MacKenzie & Emilio Segrè, 1940 — by bombarding bismuth with alpha particles.',
    note:'At any moment there is probably less than a gram of astatine in all of Earth\'s crust.' });

  D(86,'Rn',{ mass:null, phase:'gas', recipe:'decay', mix:{EARTH:3},
    rx:['226Ra -> 222Rn + 4He @1,600 years :: Radium-226 emits an alpha particle and becomes radon-222'],
    chain:{ series:'U238', stop:'222Rn' },
    where:'The uranium-238 decay chain, in rocks and soil',
    iso:{ A:222, half:'3.8 days', label:'radon-222' },
    look:{ form:'radon', cap:'A colourless, radioactive gas. Its alpha particles leave tracks like these in a cloud chamber.' },
    today:'Seeps out of rocks into basements — testing homes for it matters.',
    found:'Friedrich Ernst Dorn, 1900.' });

  D(87,'Fr',{ mass:null, phase:'solid', recipe:'decay', mix:{EARTH:3},
    rx:['227Ac -> 223Fr + 4He @21.8 years :: About 1.4% of actinium-227 nuclei emit an alpha particle — francium-223'],
    chain:{ series:'U235', stop:'223Fr' },
    where:'A side branch of the uranium-235 decay chain',
    iso:{ A:223, half:'22 minutes', label:'francium-223' },
    look:{ form:'atomTrap', cap:'Never seen in bulk. The most ever gathered in one place: about 300,000 atoms, held in a laser trap at Stony Brook in 2002.' },
    today:'Used only in research.',
    found:'Marguerite Perey, 1939 — the last element discovered in nature.',
    note:'Less than 30 grams of francium exist in Earth\'s crust at any moment.' });

  D(88,'Ra',{ mass:null, phase:'solid', recipe:'decay', mix:{EARTH:3},
    rx:['230Th -> 226Ra + 4He @75,000 years :: Thorium-230 emits an alpha particle and becomes radium-226'],
    chain:{ series:'U238', stop:'226Ra' },
    where:'The uranium-238 decay chain, inside uranium ore',
    iso:{ A:226, half:'1,600 years', label:'radium-226' },
    look:{ form:'glowMetal', f0:[0.80,0.80,0.80], glow:'#9fe6d4', strength:0.55, cap:'A silvery-white metal that blackens in air. Its radiation makes the air around it glow a faint blue-green.' },
    today:'A cancer treatment (radium-223); once, dangerously, glow-in-the-dark watch dials.',
    found:'Marie & Pierre Curie, 1898.' });

  D(89,'Ac',{ mass:null, phase:'solid', recipe:'decay', mix:{EARTH:3},
    rx:['231Pa -> 227Ac + 4He @32,760 years :: Protactinium-231 emits an alpha particle and becomes actinium-227'],
    chain:{ series:'U235', stop:'227Ac' },
    where:'The uranium-235 decay chain, inside uranium ore',
    iso:{ A:227, half:'21.8 years', label:'actinium-227' },
    look:{ form:'glowMetal', f0:[0.78,0.78,0.80], glow:'#9cc0ff', strength:0.7, cap:'A silvery metal that glows pale blue in the dark.' },
    today:'Targeted alpha therapy for cancer (actinium-225).',
    found:'André-Louis Debierne, 1899.' });

  D(90,'Th',{ mass:'232.04', phase:'solid', recipe:'merger', mix:{NS:3},
    rx:[R('232Ac','232Th','2 minutes','Actinium-232 decays into thorium-232')],
    where:'Neutron-rich debris from colliding neutron stars',
    iso:{ A:232, half:'14 billion years', label:'thorium-232' },
    look:{ form:'chunk', f0:[0.58,0.58,0.58], rough:0.3, tarnish:'#2d2d30', tarnishAmt:0.36, cap:'A silvery metal that slowly tarnishes grey-black. Mildly radioactive.' },
    today:'Old gas-lantern mantles; studied as a future nuclear fuel.',
    found:'Jöns Jacob Berzelius, 1829 — named after Thor.',
    note:'Thorium-232\'s half-life is longer than the age of the universe, so most thorium forged before Earth formed is still here.' });

  D(91,'Pa',{ mass:'231.04', phase:'solid', recipe:'decay', mix:{EARTH:3},
    rx:['235U -> 231Th + 4He @704 million years :: Uranium-235 emits an alpha particle',
        R('231Th','231Pa','25.5 hours','Thorium-231 decays into protactinium-231')],
    chain:{ series:'U235', stop:'231Pa' },
    where:'The uranium-235 decay chain, inside uranium ore',
    iso:{ A:231, half:'32,760 years', label:'protactinium-231' },
    look:{ form:'crystalChunk', f0:[0.72,0.72,0.72], metal:1, rough:0.22, cap:'A bright, silvery, radioactive metal.' },
    today:'Used only in research.',
    found:'Kasimir Fajans & Oswald Göhring, 1913; Otto Hahn & Lise Meitner, 1917–18.' });

  D(92,'U',{ mass:'238.03', phase:'solid', recipe:'merger', mix:{NS:3},
    rx:[R('238Pa','238U','2.3 minutes','Protactinium-238 decays into uranium-238')],
    where:'Neutron-rich debris from colliding neutron stars',
    iso:{ A:238, half:'4.5 billion years', label:'uranium-238' },
    look:{ form:'chunk', f0:[0.48,0.48,0.47], rough:0.32, tarnish:'#1e1e1f', tarnishAmt:0.42, cap:'A dense, silvery-grey metal that tarnishes black in air.' },
    today:'Fuel for nuclear power stations.',
    found:'Martin Klaproth, 1789 — named after the newly discovered planet Uranus.',
    note:'Uranium-238\'s half-life is about the age of the Earth, so roughly half the uranium Earth formed with is still here.' });

  // =====================================================================
  // Z 93–118 — made by people
  // =====================================================================
  const LAB = (z, sym, o) => D(z, sym, Object.assign({ mass:null, recipe:'lab', mix:{HUMAN:3} }, o));

  LAB(93,'Np',{ phase:'solid',
    rx:['238U + n -> 239U :: Uranium captures a neutron',
        R('239U','239Np','23 minutes','Uranium-239 decays into neptunium-239')],
    where:'Neutrons from the Berkeley cyclotron, 1940',
    lab:{ type:'cyclotron', place:'Berkeley Radiation Laboratory', year:'1940', atoms:'Trace amounts' },
    iso:{ A:239, half:'2.4 days', label:'neptunium-239' },
    look:{ form:'chunk', f0:[0.62,0.62,0.62], rough:0.26, tarnish:'#4d4d49', tarnishAmt:0.2, cap:'A silvery, radioactive metal.' },
    today:'Used to make plutonium-238 for spacecraft power.',
    found:'Edwin McMillan & Philip Abelson, 1940 — the first element beyond uranium.' });

  LAB(94,'Pu',{ phase:'solid',
    rx:['238U + 2H -> 238Np + 2n :: Uranium struck by deuterons in a cyclotron',
        R('238Np','238Pu','2.1 days','Neptunium-238 decays into plutonium-238')],
    where:'The 60-inch cyclotron at Berkeley, 1940–41',
    lab:{ type:'cyclotron', place:'Berkeley Radiation Laboratory', year:'1940–41', atoms:'Invisible traces at first' },
    iso:{ A:238, half:'88 years', label:'plutonium-238' },
    look:{ form:'glowPellet', cap:'A silvery metal. A pellet of plutonium-238 oxide glows red-hot from its own radioactive decay.' },
    today:'Power for deep-space probes — Voyager, Curiosity and Perseverance run on plutonium-238.',
    found:'Glenn Seaborg, Edwin McMillan, Joseph Kennedy & Arthur Wahl, 1940–41.' });

  LAB(95,'Am',{ phase:'solid',
    rx:['239Pu + 2n -> 241Pu :: Plutonium captures two neutrons in a reactor',
        R('241Pu','241Am','14 years','Plutonium-241 decays into americium-241')],
    where:'Plutonium irradiated in a nuclear reactor, 1944',
    lab:{ type:'reactor', place:'Metallurgical Laboratory, Chicago', year:'1944', atoms:'Microgram traces' },
    iso:{ A:241, half:'432 years', label:'americium-241' },
    look:{ form:'chunk', f0:[0.74,0.74,0.73], rough:0.24, tarnish:'#5d5d58', tarnishAmt:0.12, cap:'A silvery-white, radioactive metal.' },
    today:'The tiny radioactive source inside most household smoke detectors.',
    found:'Glenn Seaborg, Ralph James, Leon Morgan & Albert Ghiorso, 1944.' });

  LAB(96,'Cm',{ phase:'solid',
    rx:['239Pu + 4He -> 242Cm + n :: Plutonium struck by alpha particles in a cyclotron'],
    where:'The 60-inch cyclotron at Berkeley, 1944',
    lab:{ type:'cyclotron', place:'Berkeley / Metallurgical Laboratory', year:'1944', atoms:'Invisible traces at first' },
    iso:{ A:242, half:'163 days', label:'curium-242' },
    look:{ form:'glowMetal', f0:[0.70,0.70,0.70], glow:'#c58cff', strength:0.8, cap:'A silvery metal that glows purple in the dark.' },
    today:'The alpha source in rock-analysing instruments on Mars rovers (curium-244).',
    found:'Glenn Seaborg, Ralph James & Albert Ghiorso, 1944 — named after Marie and Pierre Curie.' });

  LAB(97,'Bk',{ phase:'solid',
    rx:['241Am + 4He -> 243Bk + 2n :: Americium struck by alpha particles in a cyclotron'],
    where:'The 60-inch cyclotron at Berkeley, 1949',
    lab:{ type:'cyclotron', place:'University of California, Berkeley', year:'1949', atoms:'Invisible traces' },
    iso:{ A:243, half:'4.6 hours', label:'berkelium-243' },
    look:{ form:'microBead', f0:[0.72,0.72,0.72], cap:'A silvery, radioactive metal, made only in millionths of a gram.' },
    today:'Target material for making heavier elements, such as tennessine.',
    found:'Stanley Thompson, Albert Ghiorso & Glenn Seaborg, 1949.' });

  LAB(98,'Cf',{ phase:'solid',
    rx:['242Cm + 4He -> 245Cf + n :: Curium struck by alpha particles in a cyclotron'],
    where:'The 60-inch cyclotron at Berkeley, 1950',
    lab:{ type:'cyclotron', place:'University of California, Berkeley', year:'1950', atoms:'About 5,000 atoms in the first run' },
    iso:{ A:245, half:'45 minutes', label:'californium-245' },
    look:{ form:'microBead', f0:[0.72,0.72,0.72], cap:'A silvery, radioactive metal, made in tiny amounts.' },
    today:'Neutron sources that start up reactors and find oil, gold and silver deposits.',
    found:'Stanley Thompson, Kenneth Street Jr., Albert Ghiorso & Glenn Seaborg, 1950.' });

  LAB(99,'Es',{ phase:'solid',
    rx:['238U + 15n -> 253U :: In a split second, uranium swallows fifteen neutrons',
        '253U -> 253Es + 7e- + 7ν̄ :: Seven beta decays turn it into einsteinium-253'],
    where:'Debris from the first thermonuclear test, 1952',
    lab:{ type:'bomb', place:'Debris from the "Ivy Mike" test, Enewetak Atoll', year:'1952', atoms:'About 200 atoms identified at first' },
    iso:{ A:253, half:'20.5 days', label:'einsteinium-253' },
    look:{ form:'glowMetal', f0:[0.72,0.72,0.74], glow:'#8fb2ff', strength:0.9, small:true, cap:'A silvery metal that glows blue from its own radiation — only ever made in sub-milligram amounts.' },
    today:'Used only in research.',
    found:'Albert Ghiorso and colleagues, 1952 — named after Albert Einstein.' });

  LAB(100,'Fm',{ phase:'unknown',
    rx:['238U + 17n -> 255U :: Uranium swallows seventeen neutrons in the blast',
        '255U -> 255Fm + 8e- + 8ν̄ :: Eight beta decays turn it into fermium-255'],
    where:'Debris from the first thermonuclear test, 1952',
    lab:{ type:'bomb', place:'Debris from the "Ivy Mike" test, Enewetak Atoll', year:'1952', atoms:'Tiny traces in the debris' },
    iso:{ A:255, half:'20 hours', label:'fermium-255' },
    look:{ form:'atoms', count:'Never isolated in bulk', cap:'Never made in a quantity large enough to see.' },
    today:'Used only in research.',
    found:'Albert Ghiorso and colleagues, 1952 — named after Enrico Fermi.' });

  LAB(101,'Md',{ phase:'unknown',
    rx:['253Es + 4He -> 256Md + n :: Einsteinium struck by alpha particles'],
    where:'The 60-inch cyclotron at Berkeley, 1955',
    lab:{ type:'cyclotron', place:'University of California, Berkeley', year:'1955', atoms:'17 atoms — the first element identified one atom at a time' },
    iso:{ A:256, half:'78 minutes', label:'mendelevium-256' },
    look:{ form:'atoms', count:'17 atoms in the discovery', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Albert Ghiorso, Bernard Harvey, Gregory Choppin, Stanley Thompson & Glenn Seaborg, 1955 — named after Dmitri Mendeleev.' });

  LAB(102,'No',{ phase:'unknown',
    rx:['238U + 22Ne -> 256No + 4n :: Uranium struck by a beam of neon-22 ions'],
    where:'A heavy-ion cyclotron at Dubna, 1966',
    lab:{ type:'cyclotron', place:'Joint Institute for Nuclear Research, Dubna', year:'1966', atoms:'A few atoms at a time' },
    iso:{ A:256, half:'2.9 seconds', label:'nobelium-256' },
    look:{ form:'atoms', count:'Only individual atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Credited to Dubna, 1966, after disputed claims from Stockholm and Berkeley — named after Alfred Nobel.' });

  LAB(103,'Lr',{ phase:'unknown',
    rx:['252Cf + 11B -> 258Lr + 5n :: Californium struck by boron ions'],
    where:'The heavy-ion linear accelerator at Berkeley, 1961',
    lab:{ type:'linac', place:'Lawrence Radiation Laboratory, Berkeley', year:'1961', atoms:'Only individual atoms' },
    iso:{ A:258, half:'about 4 seconds', label:'lawrencium-258' },
    look:{ form:'atoms', count:'Only individual atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Albert Ghiorso and colleagues, Berkeley, 1961 (credit shared with Dubna) — named after Ernest Lawrence, inventor of the cyclotron.' });

  LAB(104,'Rf',{ phase:'unknown',
    rx:['249Cf + 12C -> 257Rf + 4n :: Californium struck by carbon-12 ions'],
    where:'Heavy-ion accelerators at Dubna (1964) and Berkeley (1969)',
    lab:{ type:'linac', place:'Dubna and Berkeley', year:'1964–69', atoms:'Only individual atoms' },
    iso:{ A:257, half:'about 5 seconds', label:'rutherfordium-257' },
    look:{ form:'atoms', count:'Only individual atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Credited jointly to Dubna and Berkeley — named after Ernest Rutherford.' });

  LAB(105,'Db',{ phase:'unknown',
    rx:['249Cf + 15N -> 260Db + 4n :: Californium struck by nitrogen-15 ions'],
    where:'Heavy-ion accelerators at Dubna and Berkeley, 1968–70',
    lab:{ type:'linac', place:'Dubna and Berkeley', year:'1968–70', atoms:'Only individual atoms' },
    iso:{ A:260, half:'about 1.5 seconds', label:'dubnium-260' },
    look:{ form:'atoms', count:'Only individual atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Credited jointly to Dubna and Berkeley — named after the town of Dubna.' });

  LAB(106,'Sg',{ phase:'unknown',
    rx:['249Cf + 18O -> 263Sg + 4n :: Californium struck by oxygen-18 ions'],
    where:'The SuperHILAC accelerator at Berkeley, 1974',
    lab:{ type:'linac', place:'Lawrence Berkeley Laboratory', year:'1974', atoms:'Only individual atoms' },
    iso:{ A:263, half:'about 1 second', label:'seaborgium-263' },
    look:{ form:'atoms', count:'Only individual atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Albert Ghiorso and colleagues, 1974 — named after Glenn Seaborg, while he was still alive.' });

  LAB(107,'Bh',{ phase:'unknown',
    rx:['209Bi + 54Cr -> 262Bh + n :: Bismuth struck by chromium-54 ions'],
    where:'The UNILAC accelerator at GSI, Darmstadt, 1981',
    lab:{ type:'linac', place:'GSI Helmholtz Centre, Darmstadt', year:'1981', atoms:'Only individual atoms' },
    iso:{ A:262, half:'a fraction of a second', label:'bohrium-262' },
    look:{ form:'atoms', count:'Only individual atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Peter Armbruster, Gottfried Münzenberg and colleagues, GSI, 1981 — named after Niels Bohr.' });

  LAB(108,'Hs',{ phase:'unknown',
    rx:['208Pb + 58Fe -> 265Hs + n :: Lead struck by iron-58 ions'],
    where:'The UNILAC accelerator at GSI, Darmstadt, 1984',
    lab:{ type:'linac', place:'GSI Helmholtz Centre, Darmstadt', year:'1984', atoms:'Three atoms in the discovery run' },
    iso:{ A:265, half:'a few thousandths of a second', label:'hassium-265' },
    look:{ form:'atoms', count:'A handful of atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Peter Armbruster, Gottfried Münzenberg and colleagues, GSI, 1984 — named after the German state of Hesse.' });

  LAB(109,'Mt',{ phase:'unknown',
    rx:['209Bi + 58Fe -> 266Mt + n :: Bismuth struck by iron-58 ions'],
    where:'The UNILAC accelerator at GSI, Darmstadt, 1982',
    lab:{ type:'linac', place:'GSI Helmholtz Centre, Darmstadt', year:'1982', atoms:'One atom, after a week of bombardment' },
    iso:{ A:266, half:'a few thousandths of a second', label:'meitnerium-266' },
    look:{ form:'atoms', count:'1 atom in the discovery', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Peter Armbruster, Gottfried Münzenberg and colleagues, GSI, 1982 — named after Lise Meitner.' });

  LAB(110,'Ds',{ phase:'unknown',
    rx:['208Pb + 62Ni -> 269Ds + n :: Lead struck by nickel-62 ions'],
    where:'The UNILAC accelerator at GSI, Darmstadt, 1994',
    lab:{ type:'linac', place:'GSI Helmholtz Centre, Darmstadt', year:'1994', atoms:'Only individual atoms' },
    iso:{ A:269, half:'under a thousandth of a second', label:'darmstadtium-269' },
    look:{ form:'atoms', count:'Only individual atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Sigurd Hofmann and colleagues, GSI, 1994 — named after Darmstadt.' });

  LAB(111,'Rg',{ phase:'unknown',
    rx:['209Bi + 64Ni -> 272Rg + n :: Bismuth struck by nickel-64 ions'],
    where:'The UNILAC accelerator at GSI, Darmstadt, 1994',
    lab:{ type:'linac', place:'GSI Helmholtz Centre, Darmstadt', year:'1994', atoms:'Three atoms in the discovery run' },
    iso:{ A:272, half:'a few thousandths of a second', label:'roentgenium-272' },
    look:{ form:'atoms', count:'A handful of atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Sigurd Hofmann and colleagues, GSI, 1994 — named after Wilhelm Röntgen.' });

  LAB(112,'Cn',{ phase:'unknown',
    rx:['208Pb + 70Zn -> 277Cn + n :: Lead struck by zinc-70 ions'],
    where:'The UNILAC accelerator at GSI, Darmstadt, 1996',
    lab:{ type:'linac', place:'GSI Helmholtz Centre, Darmstadt', year:'1996', atoms:'Only individual atoms' },
    iso:{ A:277, half:'about a thousandth of a second', label:'copernicium-277' },
    look:{ form:'atoms', count:'Only individual atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Sigurd Hofmann and colleagues, GSI, 1996 — named after Nicolaus Copernicus.' });

  LAB(113,'Nh',{ phase:'unknown',
    rx:['209Bi + 70Zn -> 278Nh + n :: Bismuth struck by zinc-70 ions'],
    where:'The RIKEN linear accelerator, Japan, 2004–2012',
    lab:{ type:'linac', place:'RIKEN Nishina Center, Wakō, Japan', year:'2004–2012', atoms:'Three atoms in nine years of running' },
    iso:{ A:278, half:'a few thousandths of a second', label:'nihonium-278' },
    look:{ form:'atoms', count:'3 atoms in nine years', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Kōsuke Morita and colleagues, RIKEN — the first element discovered in Asia, named after Japan (Nihon).' });

  LAB(114,'Fl',{ phase:'unknown',
    rx:['244Pu + 48Ca -> 289Fl + 3n :: Plutonium struck by calcium-48 ions'],
    where:'The U400 cyclotron at Dubna, 1998–99',
    lab:{ type:'cyclotron', place:'Joint Institute for Nuclear Research, Dubna (with Lawrence Livermore)', year:'1998–99', atoms:'Only individual atoms' },
    iso:{ A:289, half:'about 2 seconds', label:'flerovium-289' },
    look:{ form:'atoms', count:'Only individual atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Yuri Oganessian and colleagues, Dubna, with Lawrence Livermore — named after the Flerov Laboratory.' });

  LAB(115,'Mc',{ phase:'unknown',
    rx:['243Am + 48Ca -> 288Mc + 3n :: Americium struck by calcium-48 ions'],
    where:'The U400 cyclotron at Dubna, 2003–04',
    lab:{ type:'cyclotron', place:'Joint Institute for Nuclear Research, Dubna (with Lawrence Livermore)', year:'2003–04', atoms:'Only individual atoms' },
    iso:{ A:288, half:'a fraction of a second', label:'moscovium-288' },
    look:{ form:'atoms', count:'Only individual atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Yuri Oganessian and colleagues, Dubna, with Lawrence Livermore — named after the Moscow region.' });

  LAB(116,'Lv',{ phase:'unknown',
    rx:['248Cm + 48Ca -> 292Lv + 4n :: Curium struck by calcium-48 ions'],
    where:'The U400 cyclotron at Dubna, 2000',
    lab:{ type:'cyclotron', place:'Joint Institute for Nuclear Research, Dubna (with Lawrence Livermore)', year:'2000', atoms:'Only individual atoms' },
    iso:{ A:292, half:'a few hundredths of a second', label:'livermorium-292' },
    look:{ form:'atoms', count:'Only individual atoms', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Yuri Oganessian and colleagues, Dubna, with Lawrence Livermore — named after Livermore, California.' });

  LAB(117,'Ts',{ phase:'unknown',
    rx:['249Bk + 48Ca -> 294Ts + 3n :: Berkelium from Oak Ridge struck by calcium-48 ions'],
    where:'The U400 cyclotron at Dubna, 2010',
    lab:{ type:'cyclotron', place:'Dubna, with berkelium made at Oak Ridge', year:'2010', atoms:'Six atoms in the discovery run' },
    iso:{ A:294, half:'a few hundredths of a second', label:'tennessine-294' },
    look:{ form:'atoms', count:'6 atoms in the discovery', cap:'Only individual atoms have ever been made.' },
    today:'Used only in research.',
    found:'Dubna, Oak Ridge, Vanderbilt & Lawrence Livermore, 2010 — named after Tennessee.' });

  LAB(118,'Og',{ phase:'unknown',
    rx:['249Cf + 48Ca -> 294Og + 3n :: Californium struck by calcium-48 ions'],
    where:'The U400 cyclotron at Dubna, 2002–05',
    lab:{ type:'cyclotron', place:'Joint Institute for Nuclear Research, Dubna (with Lawrence Livermore)', year:'2002–05', atoms:'Only a handful of atoms, ever' },
    iso:{ A:294, half:'under a thousandth of a second', label:'oganesson-294' },
    look:{ form:'atoms', count:'A handful of atoms, ever', cap:'Only a handful of atoms have ever been made — each gone in under a millisecond.' },
    today:'Used only in research.',
    found:'Yuri Oganessian and colleagues, Dubna, with Lawrence Livermore — named after Oganessian, the second element named after a living person.' });

  // =====================================================================
  // API
  // =====================================================================
  const EP = window.ElementProfiles;
  const SYM2Z = {};
  window.ELEMENTS.forEach(e=>{ SYM2Z[e.sym] = e.z; });

  const PARTICLES = {
    'p':    { kind:'p',  Z:1, A:1, label:'p',  name:'proton' },
    'p*':   { kind:'p',  Z:1, A:1, label:'p',  name:'cosmic-ray proton', fast:true },
    'n':    { kind:'n',  Z:0, A:1, label:'n',  name:'neutron' },
    'e-':   { kind:'e-', label:'e⁻', name:'electron' },
    'e+':   { kind:'e+', label:'e⁺', name:'positron' },
    'ν':    { kind:'nu', label:'ν',  name:'neutrino' },
    'ν̄':    { kind:'nubar', label:'ν̄', name:'antineutrino' },
    'γ':    { kind:'gamma', label:'γ', name:'gamma ray' },
    'uud':  { kind:'quarks', label:'quarks', name:'three quarks' },
    'Hatom':{ kind:'atom', Z:1, A:1, label:'H', name:'hydrogen atom' },
    'frag': { kind:'frag', label:'fragments', name:'fragments' },
  };
  const SUP = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
  function sup(n){ return String(n).split('').map(c=>SUP[c]||c).join(''); }

  // Parses one token: "56Ni", "p", "3n", "7e-", "ν̄", "frag" ...
  function parseToken(tok){
    tok = tok.trim();
    let count = 1;
    const m = tok.match(/^(\d+)(n|e-|e\+|ν̄|ν|p|γ)$/);
    if(m){ count = +m[1]; tok = m[2]; }
    if(PARTICLES[tok]) return Object.assign({ count, token:tok }, PARTICLES[tok]);
    const nm = tok.match(/^(\d+)([A-Z][a-z]?)$/);
    if(nm){
      const A = +nm[1], sym = nm[2], Z = SYM2Z[sym];
      if(!Z && sym!=='H') throw new Error('Unknown nuclide '+tok);
      const el = window.ELEMENTS.find(e=>e.z===Z);
      if(A===4 && sym==='He') return { kind:'nucleus', Z:2, A:4, sym, count, token:tok, label:'⁴He', name:'helium-4 (alpha particle)' };
      return { kind:'nucleus', Z: Z||1, A, sym, count, token:tok, label: sup(A)+sym, name: `${el ? el.name.toLowerCase() : sym}-${A}` };
    }
    throw new Error('Unparseable token '+tok);
  }

  // "12C + 4He -> 16O + γ @6 days :: note"
  function parseStep(str){
    let note = '', half = '';
    let s = str;
    if(s.includes('::')){ const i = s.indexOf('::'); note = s.slice(i+2).trim(); s = s.slice(0,i); }
    if(s.includes('@')){ const i = s.indexOf('@'); half = s.slice(i+1).trim(); s = s.slice(0,i); }
    const [lhs, rhs] = s.split('->').map(x=>x.trim());
    const ins = lhs.split(' + ').map(parseToken);
    const outs = rhs.split(' + ').map(parseToken);
    const nucIn = ins.filter(t=>t.kind==='nucleus' || t.kind==='p' || t.kind==='n');
    const nucOut = outs.filter(t=>t.kind==='nucleus' || t.kind==='atom');
    const isDecay = ins.length===1 && ins[0].kind==='nucleus';
    const isEC = ins.length===2 && ins[1].kind==='e-' && ins[0].kind==='nucleus';
    const product = outs.filter(t=>t.kind==='nucleus' || t.kind==='atom' || (t.kind==='p' && outs.length===1))
                        .sort((a,b)=>(b.A||0)-(a.A||0))[0] || null;
    let mode = 'fusion';
    if(isDecay){
      const emits = outs.map(o=>o.kind);
      if(emits.includes('e-')) mode = 'beta-';
      else if(emits.includes('e+')) mode = 'beta+';
      else if(outs.some(o=>o.token==='4He')) mode = 'alpha';
      else mode = 'decay';
    } else if(isEC) mode = 'ec';
    else if(outs.some(o=>o.kind==='frag') && ins.some(t=>t.kind==='n')) mode = 'fission';
    else if(ins.some(t=>t.kind==='n') && ins.length===2 && ins.find(t=>t.kind==='nucleus')) mode = 'capture';
    else if(ins.some(t=>t.fast)) mode = 'spallation';
    else if(ins[0] && ins[0].kind==='quarks') mode = 'hadron';
    else if(outs.some(o=>o.kind==='atom')) mode = 'recombination';
    return { raw:str, ins, outs, note, half, product, mode };
  }

  function equationHTML(step){
    const part = t => {
      const c = t.count>1 ? `<i class="eq-count">${t.count}</i>` : '';
      if(t.kind==='nucleus') return `${c}<span class="eq-nuc"><sup>${t.A}</sup>${t.sym}</span>`;
      if(t.kind==='atom') return `<span class="eq-nuc">H atom</span>`;
      if(t.kind==='frag') return `<span class="eq-part">fragments</span>`;
      if(t.kind==='quarks') return `<span class="eq-part">3 quarks</span>`;
      return `${c}<span class="eq-part">${t.label}</span>`;
    };
    return `${step.ins.map(part).join('<b class="eq-op">+</b>')}<b class="eq-arrow">→</b>${step.outs.map(part).join('<b class="eq-op">+</b>')}`;
  }

  const cache = {};
  function get(z){
    if(cache[z]) return cache[z];
    const base = window.ELEMENTS.find(e=>e.z===z);
    const p = EP.P[z];
    if(!base || !p) return null;
    const steps = (p.rx||[]).map(parseStep);
    const last = steps[steps.length-1];
    let iso = p.iso ? Object.assign({}, p.iso) : null;
    if(!iso && last && last.product){
      const pr = last.product;
      iso = { A: pr.A, label: `${base.name.toLowerCase()}-${pr.A}` };
    }
    if(!iso) iso = { A: Math.round(parseFloat(p.mass)||z*2), label: base.name.toLowerCase() };
    const prof = Object.assign({}, base, p, {
      shells: EP.SHELLS[z-1],
      categoryLabel: EP.CATEGORY_LABEL[base.category] || base.category,
      steps, iso,
      N: iso.A - z,
      site: EP.SITES[p.recipe],
    });
    cache[z] = prof;
    return prof;
  }

  // Elements whose primary recipe is this site, ordered for free-play reveals.
  const FREEPLAY_ORDER = {
    bigbang:[2,1], nova:[3], spallation:[4,5], sunlike:[2],
    agb:[6,7,56,82,38,9,40,39,57,58,41,42,37,50,48,60,59,80,81,72,74],
    massive:[8,14,20,10,12,16,11,13,15,18,19,17,22,21,23,27,29,30,31,32,33,34,35,36],
    typeIa:[26,28,25,24],
    merger:[79,78,63,92,90,53,54,47,76,77,75,52,55,45,44,46,49,51,62,64,65,66,67,68,69,70,71,73,83],
    decay:[88,86,84,89,91,87,85],
    lab:[43,93,94,95,96,61,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118],
  };
  function elementsForSite(site){
    return (FREEPLAY_ORDER[site]||[]).slice();
  }

  Object.assign(EP, { get, parseStep, parseToken, equationHTML, elementsForSite, sup, SYM2Z, FREEPLAY_ORDER });
})();
