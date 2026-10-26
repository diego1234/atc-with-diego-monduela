/* ============================================================
   Source data — reproduced from "Documento sin título (30).docx"
   Section "3 Ground movements" + the vehicle table on page 2.
   English terms, Spanish translations, vehicle names and the
   printed actions are kept exactly as printed.

   Aviation verification (this lesson revision):
   - Signs and markings checked against FAA Aeronautical
     Information Manual (AIM), Chapter 2, Section 3 —
     https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap2_section_3.html
     (2-3-2 marking colours, 2-3-3 runway markings/designators,
     2-3-4 taxiway markings, 2-3-5 holding position markings,
     2-3-6 other markings, 2-3-7 sign types, 2-3-8 mandatory
     instruction signs, 2-3-9 location signs, 2-3-10 direction signs).
   - Vehicle functions are NOT defined in the FAA AIM. Where the
     printed pairing is not the standard ground-support function,
     the answer key uses the standard function, the printed wording
     is preserved everywhere in the tables, and the item is labelled
     "Instructor review required". Local procedures may differ.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- deterministic helpers shared with the app and tests ---------- */
  function shuf(arr, seed) {
    var a = arr.slice(), s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    function rnd() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function newSeed() { return Math.floor(Math.random() * 2147483646) + 1; }

  /* Per-set schedule of correct-answer positions: a shuffled 0,1,2,3 cycle.
     Guarantees A/B/C/D stay balanced across any quiz of 4+ questions
     (counts differ by at most 1) while remaining unpredictable. */
  function schedule(seed, n) {
    var pos = [];
    for (var i = 0; i < n; i++) pos.push(i % 4);
    return shuf(pos, seed);
  }

  /* Build one question's options: the correct string is inserted at
     `pos`; distractors are deduplicated against it and among themselves,
     then shuffled with `seed`. Deterministic for a given (seed, pos):
     re-renders never move options, restarts change the set seed. */
  function makeOptions(correct, distract, seed, pos) {
    var seen = {}, opts = [];
    seen[String(correct)] = 1;
    for (var i = 0; i < distract.length; i++) {
      var k = String(distract[i]);
      if (!seen[k]) { seen[k] = 1; opts.push(distract[i]); }
    }
    opts = shuf(opts, seed).slice(0, 3);
    if (pos == null || pos < 0) pos = 0;
    if (pos > opts.length) pos = opts.length;
    opts.splice(pos, 0, correct);
    return opts;
  }

  /* 12 ground-movement items.
     `printed` = the letter as it appears in the source.
     `dup` = the source prints "g" twice (items 7 and 8) and then
     jumps to "i", so the a–l series is not continuous. Flagged,
     not corrected. */
  var GROUND = [
    { n: 1,  printed: 'a', en: 'centre line marking',             es: 'Marca de línea central',                      art: 'centreline' },
    { n: 2,  printed: 'b', en: 'runway taxi holding position',     es: 'Posición de espera en la pista',              art: 'holding' },
    { n: 3,  printed: 'c', en: 'runway designator',                es: 'Indicador de pista',                          art: 'designator' },
    { n: 4,  printed: 'd', en: 'taxiway location sign',            es: 'Señal de ubicación de la pista de rodaje',    art: 'location' },
    { n: 5,  printed: 'e', en: 'direction sign',                   es: 'Señal de dirección',                          art: 'direction' },
    { n: 6,  printed: 'f', en: 'connect ground power',             es: 'Conectar la fuente de energía en tierra',     art: 'gpu' },
    { n: 7,  printed: 'g', en: 'reserved for helicopter',          es: 'Reservado para helicópteros',                art: 'helipad' },
    { n: 8,  printed: 'g', dup: true, en: 'move ahead',            es: 'Avanzar',                                     art: 'ahead' },
    { n: 9,  printed: 'i', en: 'taxiway A changing direction',     es: 'Cambio de dirección en la pista de rodaje A', art: 'chgdir' },
    { n: 10, printed: 'j', en: 'slow down',                        es: 'Reducir la velocidad',                        art: 'slow' },
    { n: 11, printed: 'k', en: 'threshold markings',               es: 'Marcas del umbral',                           art: 'threshold' },
    { n: 12, printed: 'l', en: 'wind direction and speed',         es: 'Dirección y velocidad del viento',           art: 'windsock' }
  ];

  /* What kind of thing each ground item is. NOT in the source — this is a
     study aid added by the lesson, labelled as such in the UI. */
  var GROUND_KIND = {
    1: 'Marking', 2: 'Marking', 3: 'Sign', 4: 'Sign', 5: 'Sign', 6: 'Instruction',
    7: 'Marking', 8: 'Instruction', 9: 'Sign', 10: 'Instruction', 11: 'Marking', 12: 'Signal'
  };

  var FAA_AIM = 'FAA AIM, Chapter 2, Section 3 (Airport Marking Aids and Signs): https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap2_section_3.html';

  var GROUND_NOTES = [
    { ids: [8], head: 'Item 8 carries the letter “g” in the source, which item 7 already uses; the printed series then jumps to “i”.',
      body: 'The lettering a–l is therefore not continuous. Letters are reproduced here exactly as printed instead of being renumbered, so the table matches the document.' },
    { ids: [6, 8, 10], head: '“connect ground power”, “move ahead” and “slow down” are ATC instructions, not signs or markings.',
      body: 'The source groups all twelve items under “signals and signs”. The classification shown in the table is an added study aid and is not in the document.' },
    { ids: [1], head: '“centre line marking” is the source term; the FAA/ICAO term is “taxiway centreline marking”.',
      body: 'Verified: the taxiway centreline is a single continuous YELLOW line (FAA AIM 2-3-4); runway markings are white (AIM 2-3-2). The schematic in this lesson draws the continuous line accordingly. Many manuals hyphenate it “taxiway centreline”. Source wording not altered.' },
    { ids: [2], head: '“runway taxi holding position” is the source wording; the standard term is “runway holding position”.',
      body: 'Verified: runway holding position markings are four yellow lines — two solid and two dashed — and “the solid lines are always on the side where the aircraft must hold” (FAA AIM 2-3-5). Aircraft must stop at the solid lines until cleared by ATC. Español estándar: posición de espera (en la pista de rodaje). Left as printed here.' },
    { ids: [3], head: '“Indicador de pista” for runway designator — translation to review.',
      body: 'The designator is the runway number derived from the magnetic direction of the centreline (e.g. runway 09 points about 090°; FAA AIM 2-3-3). In Spanish the usual terms are “designador de pista” or “numeración de la pista”; “indicador” can suggest a device. Instructor review recommended. ' + FAA_AIM },
    { ids: [4], head: '“taxiway location sign” — Señal de ubicación de la pista de rodaje.',
      body: 'Verified: location signs have a yellow inscription on a black background with a yellow border and identify the taxiway the aircraft is on (FAA AIM 2-3-9). The Spanish keeps the article “la” before “pista de rodaje”, which most signage glossaries omit. Left as printed.' },
    { ids: [5], head: '“direction sign” is ambiguous in English.',
      body: 'Verified: direction signs have a black inscription and arrows on a yellow background and show which way to turn at an intersection (FAA AIM 2-3-10). The source does not say whether it means a taxiway direction sign, a runway-exit direction sign or a destination sign. Tutor review recommended.' },
    { ids: [9], head: '“taxiway A changing direction” is not a standard sign category. Instructor review required.',
      body: 'FAA AIM 2-3-7 lists six sign types: mandatory instruction, location, direction, destination, information and runway distance remaining. A change of taxiway direction is shown by the geometry of the taxiway and by direction signs — there is no dedicated “changing direction” sign. The schematic illustrates the curve plus a location sign. ' + FAA_AIM },
    { ids: [11], head: '“threshold markings” verified.',
      body: 'Verified: threshold markings are white stripes that help identify the beginning of the runway available for landing; the number of stripes relates to runway width (FAA AIM 2-3-3, TBL 2-3-2). Marca del umbral: correct.' },
    { ids: [12], head: 'Wind direction and speed — windsock.',
      body: 'A windsock shows wind direction and approximate speed and helps pilots and controllers identify the runway in use. FAA AIM signs section does not cover wind indicators; they are standard aerodrome equipment. Tutor may wish to add the ICAO term “wind direction indicator”.' }
  ];

  /* 10 vehicle rows. `act` is the action exactly as printed (used in the
     Part 2 table, Activity 3 and every source note). `actLabel` cleans a
     pure formatting quirk for quiz display only. `actCorrect` is the
     standard ground-support function, used as the Activity 4 answer key
     where the printed pairing is not technically standard; the printed
     wording is always preserved and shown for instructor review.
     FAA AIM does not define GSE vehicle functions — local practice may
     vary, so every corrected row carries an instructor-review line. */
  var VEHICLES = [
    { n: 1, l: 'a', en: 'aircraft de-icer',  es: 'máquina descongeladora de aeronaves', act: 'spraying icy wings',                   flag: false },
    { n: 2, l: 'b', en: 'bus',               es: 'autobús',                            act: 'transporting passengers',              flag: false },
    { n: 3, l: 'c', en: 'fire engine',       es: 'camión de bomberos',                 act: 'putting out fires',                   flag: false },
    { n: 4, l: 'd', en: 'flat-bed truck',    es: 'camión de plataforma',                act: 'repairing flat tyres',                flag: true,
      actCorrect: 'carrying loads on a flat open platform',
      review: 'Instructor review required.',
      src: 'Function per standard ground-support practice. The FAA AIM does not define GSE vehicle functions — verify against local GSE manuals and ICAO Annex 14, Volume I (aerodrome operations).',
      alt: 'A flat-bed truck is a load carrier with an open platform. Tyre replacement is normally done by a mobile tyre-service unit or a tyre-changing truck, so the printed pairing “repairing flat tyres” is not the standard function of a flat-bed truck.' },
    { n: 5, l: 'e', en: 'fuel tanker',       es: 'camión cisterna de combustible',      act: 'delivering kerosene / Fuel',           actLabel: 'delivering kerosene', flag: false },
    { n: 6, l: 'f', en: 'heavy plant',       es: 'maquinaria pesada',                   act: 'carrying cargo',                      flag: true,
      actCorrect: 'construction and earthmoving on the airfield',
      review: 'Instructor review required.',
      src: 'Function per standard ground-support practice. The FAA AIM does not define GSE vehicle functions — verify against local GSE manuals and ICAO Annex 14, Volume I (aerodrome operations).',
      alt: '“Heavy plant” means construction machinery — loaders, excavators, cranes — which moves earth and material rather than carrying freight as cargo. If freight transport was meant, a flat-bed or cargo truck would be the expected answer.' },
    { n: 7, l: 'g', en: 'maintenance truck', es: 'camión de mantenimiento',             act: 'transporting construction materials', flag: true,
      review: 'Instructor review recommended.',
      src: 'Verify against local airport operations manuals — fleet naming varies by airport.',
      alt: 'A maintenance truck typically carries crew, tools and equipment. Transporting construction materials is plausible for some units but overlaps with rows 4 and 6, so these three functions are easy to confuse in the activities below. Kept as the source pairing.' },
    { n: 8, l: 'h', en: 'push-back tug',     es: 'remolcador de empuje',                act: 'reversing planes',                     flag: true,
      actCorrect: 'pushing the aircraft backwards off its stand',
      review: 'Instructor review required.',
      src: 'Push-back is standard ramp terminology. The FAA AIM does not define GSE vehicle functions — verify against local ramp-operations manuals.',
      alt: 'A push-back tug pushes (or tows) an aircraft backwards off its stand. The printed wording “reversing planes” describes the movement loosely; the vehicle itself is unambiguous.' },
    { n: 9, l: 'i', en: 'snowplough',        es: 'quitanieves',                         act: 'getting rid of compacted ice',        flag: false },
    { n: 10, l: 'j', en: 'sweeper',          es: 'barredora',                           act: 'clearing debris',                     flag: false }
  ];

  /* Source quirks that are not terminology problems — always shown. */
  var VEH_NOTES = [
    { ids: [5], head: 'Row 5 prints “delivering kerosene / Fuel”.',
      body: 'The capital “F” and the slash are reproduced exactly in the tables. Kerosene (Jet A-1) is the standard aviation turbine fuel, so the pairing itself is correct; the Activity 4 option uses the cleaned phrase “delivering kerosene”.' },
    { ids: [1, 9, 10], head: 'Rows 1, 9 and 10 verified against standard ground-support functions.',
      body: 'Aircraft de-icer (spraying de-icing/anti-icing fluid on wings and control surfaces), snowplough (clearing snow and compacted ice) and sweeper (clearing debris, also called FOD, from pavement) match standard aerodrome operations. No changes needed.' }
  ];

  /* Activity 2 — one question per ground item. The correct answer is
     always opts[0]; the app places it at a balanced A/B/C/D position
     when the question set is created. `why` = short explanation shown
     after answering; `ref` = verification reference for the tutor. */
  var A2 = [
    { g: 0, stem: 'centre line marking',
      why: 'The taxiway centreline is a single continuous yellow line that guides aircraft along the taxi path. Runway markings, by contrast, are white.',
      ref: 'FAA AIM 2-3-2 and 2-3-4',
      opts: [
      'The yellow line running down the middle of a taxiway',
      'The white stripes at the start of a runway',
      'The number painted on a runway to identify it',
      'A red sign you must never pass' ] },
    { g: 1, stem: 'runway taxi holding position',
      why: 'Runway holding position markings are four yellow lines — two solid and two dashed. You stop at the solid lines until ATC clears you onto the runway.',
      ref: 'FAA AIM 2-3-5 and 2-3-8',
      opts: [
      'The place where you stop and get clearance before entering a runway',
      'The point at which a taxiway turns',
      'The spot where an aircraft stops for boarding',
      'The far end of a runway' ] },
    { g: 2, stem: 'runway designator',
      why: 'The runway number is the whole number nearest one-tenth of the magnetic direction of the runway centreline — runway 09 points about 090°.',
      ref: 'FAA AIM 2-3-3',
      opts: [
      'The number that identifies the runway, in tens of degrees of magnetic heading',
      'The colour of the runway lights',
      'The length of the runway in metres',
      'The name of the airport' ] },
    { g: 3, stem: 'taxiway location sign',
      why: 'Location signs have a yellow inscription on a black background with a yellow border; they identify the taxiway you are on.',
      ref: 'FAA AIM 2-3-9',
      opts: [
      'The sign that tells you which taxiway you are on at that point',
      'The sign that shows which way to go',
      'The sign that warns of a change of direction ahead',
      'The sign that gives the width of the taxiway' ] },
    { g: 4, stem: 'direction sign',
      why: 'Direction signs have a black inscription and arrows on a yellow background; they show which way to turn at the next intersection.',
      ref: 'FAA AIM 2-3-10',
      opts: [
      'The sign that shows which way to go along the taxiway system',
      'The sign that shows the runway number',
      'The sign that marks a parking stand',
      'The sign that shows the wind' ] },
    { g: 5, stem: 'connect ground power',
      why: 'An instruction to attach the aircraft to the ground power supply — a spoken or printed message, not an airport sign.',
      opts: [
      'An instruction to attach the aircraft to the ground power supply',
      'A sign showing a 400 V outlet',
      'A request for fuel',
      'An instruction to start the auxiliary power unit' ] },
    { g: 6, stem: 'reserved for helicopter',
      why: 'Landing areas for helicopters are marked with a large letter H; at a hospital heliport the H is red on a white cross.',
      ref: 'FAA AIM 2-3-6 (Helicopter Landing Areas)',
      opts: [
      'A marking showing an area used only by helicopters',
      'A sign showing a helicopter flight path',
      'An instruction about rotor speed',
      'A marking showing an area that is closed' ] },
    { g: 7, stem: 'move ahead',
      why: 'A controller instruction to continue taxiing forward — spoken phraseology, not a sign or marking.',
      opts: [
      'An instruction to continue forward',
      'An instruction to stop where you are',
      'An instruction to hold the aircraft',
      'An instruction to change stand' ] },
    { g: 8, stem: 'taxiway A changing direction',
      why: 'In the document this item names a change of direction on taxiway A. FAA sign categories do not include a dedicated “changing direction” sign — see the review note in Part 1.',
      opts: [
      'A sign showing that taxiway A turns in another direction ahead',
      'An instruction to enter taxiway A',
      'A sign showing that taxiway A is closed',
      'An instruction to slow down on taxiway A' ] },
    { g: 9, stem: 'slow down',
      why: 'A controller instruction to reduce taxi speed — spoken phraseology, not a sign.',
      opts: [
      'An instruction to reduce speed',
      'An instruction to stop immediately',
      'An instruction to turn left',
      'An instruction to hold position' ] },
    { g: 10, stem: 'threshold markings',
      why: 'Threshold markings are white stripes that help identify the beginning of the runway available for landing; the number of stripes relates to the runway width.',
      ref: 'FAA AIM 2-3-3 (TBL 2-3-2)',
      opts: [
      'The white stripes marking the beginning of a runway',
      'The yellow lines marking a taxiway centre',
      'The stripes marking a parking stand',
      'The markings showing a closed runway' ] },
    { g: 11, stem: 'wind direction and speed',
      why: 'A windsock shows wind direction and approximate speed; pilots and controllers use it to identify the runway in use.',
      opts: [
      'The reading that tells you the wind and helps identify the runway in use',
      'A sign naming the runway',
      'The markings at the runway end',
      'An instruction about crosswind limits' ] }
  ];

  /* Activity 4 — vehicle → function, four options each, keyed on row. */
  var A4 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  /* Activity 5 — situations, four options each, keyed on the source row. */
  var A5 = [
    { i: 0, s: 'An aircraft on stand needs fuel delivered to its tanks.', a: 5,
      d: ['bus', 'fuel tanker', 'sweeper', 'push-back tug'],
      n: 'The source table pairs fuel tanker with “delivering kerosene / Fuel”. Kerosene (Jet A-1) is the standard aviation turbine fuel.' },
    { i: 1, s: 'Passengers must be taken from the terminal out to the aircraft.', a: 2,
      d: ['bus', 'maintenance truck', 'heavy plant', 'aircraft de-icer'],
      n: 'The source table pairs bus with “transporting passengers”.' },
    { i: 2, s: 'FOD and loose debris are lying on the apron near the taxiway.', a: 10,
      d: ['snowplough', 'flat-bed truck', 'sweeper', 'fire engine'],
      n: 'The source table pairs sweeper with “clearing debris”. FOD = foreign object debris.' },
    { i: 3, s: 'An aircraft has icy wings and cannot be released for departure.', a: 1,
      d: ['snowplough', 'aircraft de-icer', 'fuel tanker', 'heavy plant'],
      n: 'The source table pairs aircraft de-icer with “spraying icy wings” — de-icing/anti-icing fluid is sprayed on wings and control surfaces.' },
    { i: 4, s: 'An aircraft must be moved backwards off its stand before taxiing.', a: 8,
      d: ['push-back tug', 'bus', 'maintenance truck', 'fire engine'],
      n: 'The source table pairs push-back tug with “reversing planes”. The standard function is to push (or tow) the aircraft backwards off its stand — this row is flagged for instructor review in Part 2.' },
    { i: 5, s: 'There is a fire at an aircraft stand and the response is needed immediately.', a: 3,
      d: ['fire engine', 'flat-bed truck', 'sweeper', 'heavy plant'],
      n: 'The source table pairs fire engine with “putting out fires”. At an airport this role is normally Aircraft Rescue and Fire Fighting (ARFF).' }
  ];

  /* Part 3 final test — 14 questions drawn only from the document. */
  var FINAL = [
    { cat: 'Ground movements', q: 'What does a runway designator show?',
      opts: ['The runway number, in tens of degrees of magnetic heading', 'The runway length', 'The runway lighting', 'The wind direction'],
      a: 0, fix: 'Indicador de pista — “runway designator”: the whole number nearest one-tenth of the magnetic direction of the runway centreline (FAA AIM 2-3-3).' },
    { cat: 'English – Spanish', q: 'Select the Spanish for “threshold markings”.',
      opts: ['Marcas del umbral', 'Marca de línea central', 'Indicador de pista', 'Reducir la velocidad'],
      a: 0, fix: 'threshold markings — Marcas del umbral.' },
    { cat: 'English – Spanish', q: 'Select the Spanish for “slow down”.',
      opts: ['Avanzar', 'Reducir la velocidad', 'Reservado para helicópteros', 'Señal de dirección'],
      a: 1, fix: 'slow down — Reducir la velocidad.' },
    { cat: 'Vehicle names', q: 'Which vehicle does the document call “quitanieves”?',
      opts: ['snowplough', 'sweeper', 'fire engine', 'flat-bed truck'],
      a: 0, fix: 'quitanieves — snowplough, paired with “getting rid of compacted ice”.' },
    { cat: 'Vehicle names', q: 'Which vehicle does the document call “barredora”?',
      opts: ['push-back tug', 'snowplough', 'sweeper', 'maintenance truck'],
      a: 2, fix: 'barredora — sweeper, paired with “clearing debris”.' },
    { cat: 'Vehicle functions', q: 'Which vehicle is paired with “putting out fires”?',
      opts: ['fire engine', 'bus', 'fuel tanker', 'heavy plant'],
      a: 0, fix: 'fire engine — camión de bomberos — putting out fires (ARFF).' },
    { cat: 'Vehicle functions', q: 'Which vehicle is paired with “transporting passengers”?',
      opts: ['maintenance truck', 'bus', 'flat-bed truck', 'snowplough'],
      a: 1, fix: 'bus — autobús — transporting passengers.' },
    { cat: 'Vehicle functions', q: 'Which vehicle is paired with “spraying icy wings”?',
      opts: ['snowplough', 'aircraft de-icer', 'sweeper', 'fire engine'],
      a: 1, fix: 'aircraft de-icer — máquina descongeladora de aeronaves — spraying icy wings.' },
    { cat: 'Ground movements', q: 'Where is the “runway taxi holding position”?',
      opts: ['The point where you stop before entering a runway', 'The middle of the apron', 'The end of a taxiway', 'The aircraft stand'],
      a: 0, fix: 'runway taxi holding position — Posición de espera en la pista. Standard term: runway holding position (FAA AIM 2-3-5).' },
    { cat: 'Ground movements', q: 'What does “connect ground power” ask the aircraft to do?',
      opts: ['Attach to the ground power supply', 'Request fuel', 'Start the auxiliary power unit', 'Extend the flaps'],
      a: 0, fix: 'connect ground power — Conectar la fuente de energía en tierra.' },
    { cat: 'Airport situations', q: 'Debris must be cleared from the apron. Which vehicle is listed?',
      opts: ['sweeper', 'snowplough', 'bus', 'push-back tug'],
      a: 0, fix: 'sweeper — barredora — clearing debris.' },
    { cat: 'Airport situations', q: 'An aircraft needs to be pushed back from its stand. Which vehicle is listed?',
      opts: ['bus', 'push-back tug', 'fuel tanker', 'maintenance truck'],
      a: 1, fix: 'push-back tug — remolcador de empuje — pushes the aircraft backwards off its stand. The source table prints “reversing planes”; row flagged for review.' },
    { cat: 'Ground movements', q: 'Which marking shows the beginning of a runway?',
      opts: ['centre line marking', 'threshold markings', 'runway taxi holding position', 'wind direction and speed'],
      a: 1, fix: 'threshold markings — Marcas del umbral (FAA AIM 2-3-3).' },
    { cat: 'English – Spanish', q: 'Select the Spanish for “taxiway location sign”.',
      opts: ['Señal de ubicación de la pista de rodaje', 'Posición de espera en la pista', 'Cambio de dirección en la pista de rodaje A', 'Dirección y velocidad del viento'],
      a: 0, fix: 'taxiway location sign — Señal de ubicación de la pista de rodaje (yellow on black; FAA AIM 2-3-9).' }
  ];

  global.ATCDATA = {
    GROUND: GROUND,
    GROUND_KIND: GROUND_KIND,
    GROUND_NOTES: GROUND_NOTES,
    VEHICLES: VEHICLES,
    VEH_NOTES: VEH_NOTES,
    A2: A2,
    A4: A4,
    A5: A5,
    FINAL: FINAL,
    quiz: { shuf: shuf, newSeed: newSeed, schedule: schedule, makeOptions: makeOptions }
  };
})(window);
