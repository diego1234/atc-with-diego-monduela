/* ============================================================
   App logic — Interactive Aviation English for ATC
   Tutor: Diego Monduela
   ============================================================ */
(function () {
  'use strict';

  var D = window.ATCDATA;
  var ART = window.ATCART;
  var G = D.GROUND, V = D.VEHICLES, FINAL = D.FINAL;
  var DI = window.ATCDICT || { CATS: [], ENTRIES: [] };
  var LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  /* Quiz helpers live in atc-data.js (shared with the automated tests):
     - shuf(arr, seed): deterministic Fisher–Yates.
     - schedule(seed, n): balanced A/B/C/D positions for a question set.
     - makeOptions(correct, distract, seed, pos): deduplicated options
       with the correct answer inserted at the assigned position.
     Option order is computed ONLY from the per-set seed + question
     index, so re-renders and clicks never move options; a restart
     draws a new set seed and reshuffles. */
  var Q = D.quiz;
  var shuf = Q.shuf;

  var ICO = {
    check: '<svg class="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.4l3.2 3.2L13 4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cross: '<svg class="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    warn: '<svg class="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2.2 14.6 13.4H1.4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.4v3.1M8 11.4v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    arrow: '<svg class="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.8 8h10M9 4.2 12.8 8 9 11.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    shuffle: '<svg class="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 4.2h2.6l6.8 7.6H14M2 11.8h2.6l2.2-2.5M9.4 6.7l2-2.5H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.4 2.2 14 4.2l-1.6 2M12.4 9.8 14 11.8l-1.6 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    reset: '<svg class="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13.4 8a5.4 5.4 0 1 1-1.7-3.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13.6 2v3.2h-3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    doc: '<svg class="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 2h6l3 3v9h-9z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M9.5 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>'
  };
  function flagPill() { return '<span class="pill pill-warn">' + ICO.warn + 'Check this terminology</span>'; }

  /* ---------------- state ---------------- */
  var KEY = 'atc-en-lesson-v3';
  var TOTAL = 12 + 12 + 10 + 10 + 6 + 10 + FINAL.length;
  var S = {
    a1: { done: {}, sel: null, tries: 0, round: 0 },
    a2: { i: 0, score: 0, answered: false, log: {}, pick: null, seed: 0 },
    a3: { done: {}, sel: { en: null, es: null, ac: null }, errors: 0, wrong: [], round: 0 },
    a4: { i: 0, score: 0, answered: false, log: {}, pick: null, seed: 0 },
    a5: { i: 0, score: 0, answered: false, log: {}, pick: null, seed: 0 },
    a6: { i: 0, score: 0, answered: false, log: {}, pick: null, seed: 0 },
    fin: { i: 0, score: 0, answered: false, log: [], pick: null, seed: 0 }
  };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() {
    try {
      var raw = localStorage.getItem(KEY); if (!raw) return;
      var p = JSON.parse(raw);
      Object.keys(S).forEach(function (k) {
        if (p[k]) Object.keys(S[k]).forEach(function (f) { if (p[k][f] !== undefined) S[k][f] = p[k][f]; });
      });
    } catch (e) {}
  }
  /* Every multiple-choice set needs its own random seed, drawn once per
     set (first run or restart) — never per click. */
  function ensureSeeds() {
    ['a2', 'a4', 'a5', 'a6', 'fin'].forEach(function (k) {
      if (!S[k].seed) S[k].seed = Q.newSeed();
    });
    save();
  }

  /* ---------------- shared bits ---------------- */
  function figureFor(g) {
    var fn = ART[g.art]; if (!fn) return '';
    return '<figure class="figure">' + fn() +
      '<figcaption>Illustrative example — a schematic drawn for this lesson, not a photograph of an actual airport sign or marking. The source document contains no images. Source term: “' + esc(g.en) + '”.</figcaption></figure>';
  }
  function focusFirst(sel, what) {
    var el = $(sel + ' ' + what); if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }
  function fb(el, cls, icon, msg) {
    el.className = 'feedback' + (cls ? ' ' + cls : '');
    el.innerHTML = (icon || '') + '<span>' + msg + '</span>';
  }
  function progress() {
    var d = Object.keys(S.a1.done).length
      + Object.keys(S.a2.log).length
      + Object.keys(S.a3.done).length
      + Object.keys(S.a4.log).length
      + Object.keys(S.a5.log).length
      + Object.keys(S.a6.log).length
      + S.fin.log.length;
    d = Math.min(d, TOTAL);
    $('#progFill').style.width = (d / TOTAL * 100).toFixed(1) + '%';
    $('#progPct').textContent = Math.round(d / TOTAL * 100) + '%';
    $('#progFrac').textContent = d + ' / ' + TOTAL;
    var flags = { 'sec-a1': 12, 'sec-a2': 12, 'sec-a3': 10, 'sec-a4': 10, 'sec-a5': 6, 'sec-a6': 10, 'sec-fin': FINAL.length };
    Object.keys(flags).forEach(function (id) {
      var el = $('[data-sec="' + id + '"]'); if (!el) return;
      var got = id === 'sec-a1' ? Object.keys(S.a1.done).length
        : id === 'sec-a2' ? Object.keys(S.a2.log).length
        : id === 'sec-a3' ? Object.keys(S.a3.done).length
        : id === 'sec-a4' ? Object.keys(S.a4.log).length
        : id === 'sec-a5' ? Object.keys(S.a5.log).length
        : id === 'sec-a6' ? Object.keys(S.a6.log).length
        : S.fin.log.length;
      el.classList.toggle('done', got >= flags[id]);
    });
  }

  /* ---------------- strip rack nav ---------------- */
  var SECTIONS = [
    { id: 'sec-src', t: 'SRC', l: 'Source' },
    { id: 'sec-p1', t: 'P1', l: 'Ground movements' },
    { id: 'sec-a1', t: 'A1', l: 'Matching' },
    { id: 'sec-a2', t: 'A2', l: 'Sign meaning' },
    { id: 'sec-p2', t: 'P2', l: 'Vehicles' },
    { id: 'sec-a3', t: 'A3', l: 'Three columns' },
    { id: 'sec-a4', t: 'A4', l: 'Vehicle use' },
    { id: 'sec-a5', t: 'A5', l: 'Situations' },
    { id: 'sec-dict', t: 'DICT', l: 'ATC dictionary' },
    { id: 'sec-a6', t: 'A6', l: 'Dictionary drill' },
    { id: 'sec-fin', t: 'FIN', l: 'Final test' },
    { id: 'sec-rev', t: 'REF', l: 'Vocabulary' }
  ];
  function buildRack() {
    $('#rack').innerHTML = SECTIONS.map(function (s) {
      return '<a class="strip" href="#' + s.id + '" data-sec="' + s.id + '" data-od-id="nav-' + s.id + '">' +
        '<span class="dot"></span><span class="st">' + s.t + '</span><span class="sl">' + s.l + '</span></a>';
    }).join('');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          $$('.strip').forEach(function (el) { el.setAttribute('aria-current', el.dataset.sec === en.target.id ? 'true' : 'false'); });
        });
      }, { rootMargin: '-124px 0px -62% 0px', threshold: 0 });
      SECTIONS.forEach(function (s) { var el = document.getElementById(s.id); if (el) io.observe(el); });
    }
  }

  /* ================= source tables ================= */
  function renderTables() {
    var gh = '';
    G.forEach(function (g) {
      var flagged = D.GROUND_NOTES.some(function (n) { return n.ids.indexOf(g.n) > -1; });
      gh += '<tr' + (flagged ? ' class="flagrow"' : '') + ' data-od-id="ground-row-' + g.n + '">' +
        '<td class="num">' + g.n + '</td>' +
        '<td class="ltr">' + g.printed + (g.dup ? ' <span class="pill pill-warn" style="margin-left:6px">repeated</span>' : '') + '</td>' +
        '<td class="en">' + esc(g.en) + '</td>' +
        '<td class="es">' + esc(g.es) + '</td>' +
        '<td>' + (flagged ? '<span class="pill pill-warn">' + ICO.warn + 'Review</span>' : '<span class="pill pill-q">' + esc(D.GROUND_KIND[g.n]) + '</span>') + '</td>' +
        '</tr>';
    });
    $('#groundBody').innerHTML = gh;

    var gn = '';
    D.GROUND_NOTES.forEach(function (n) {
      gn += '<li><b>' + esc(n.head) + '</b> <span class="src">[' + n.ids.join(', ') + ']</span><br>' + esc(n.body) + '</li>';
    });
    $('#groundNotes').innerHTML = gn;

    var vh = '';
    V.forEach(function (v) {
      vh += '<tr' + (v.flag ? ' class="flagrow"' : '') + ' data-od-id="vehicle-row-' + v.n + '">' +
        '<td class="num">' + v.n + '</td>' +
        '<td class="en">' + esc(v.en) + '</td>' +
        '<td class="es">' + esc(v.es) + '</td>' +
        '<td class="en">' + esc(v.act) + '</td>' +
        '<td>' + (v.flag ? flagPill() : '<span class="pill pill-ok">' + ICO.check + 'Clear</span>') + '</td>' +
        '</tr>';
    });
    $('#vehBody').innerHTML = vh;

    var vn = '';
    (D.VEH_NOTES || []).forEach(function (n) {
      vn += '<li><b>' + esc(n.head) + '</b> <span class="src">[row ' + n.ids.join(', ') + ']</span><br>' + esc(n.body) + '</li>';
    });
    V.filter(function (v) { return v.flag; }).forEach(function (v) {
      vn += '<li><b>Row ' + v.n + ' — ' + esc(v.en) + ' — ' + esc(v.act) + '.</b> ' + esc(v.es) +
        (v.review ? ' <b>' + esc(v.review) + '</b>' : '') +
        '. This pairing is kept exactly as printed in the tables and activities' +
        (v.actCorrect ? '; where it is not the standard function, the Activity 4 answer key uses the standard function and the printed wording is shown for review' : ' and is the answer key in every activity') + '.' +
        '<br><b>Additional information, not in the source document:</b> ' + esc(v.alt) +
        (v.src ? '<br><b>Source for the tutor:</b> ' + esc(v.src) : '') + '</li>';
    });
    $('#vehNotes').innerHTML = vn;

    var rb = '';
    G.forEach(function (g) {
      rb += '<tr data-od-id="review-ground-' + g.n + '"><td class="num mono">P1 · ' + g.printed + '</td>' +
        '<td class="en">' + esc(g.en) + '</td><td class="es">' + esc(g.es) + '</td>' +
        '<td>' + esc(D.GROUND_KIND[g.n]) + (g.dup ? ' · letter repeated in source' : '') + '</td></tr>';
    });
    V.forEach(function (v) {
      rb += '<tr data-od-id="review-vehicle-' + v.n + '"><td class="num mono">P2 · ' + v.l + '</td>' +
        '<td class="en">' + esc(v.en) + '</td><td class="es">' + esc(v.es) + '</td>' +
        '<td>' + esc(v.act) + (v.flag ? ' · check this terminology' : '') + '</td></tr>';
    });
    $('#revBody').innerHTML = rb;
  }

  /* one bar updater, called from every activity render */
  function bar(id, done, total) {
    $(id + 'score').textContent = done;
    $(id + 'mini').style.width = (done / total * 100) + '%';
  }

  /* ================= Activity 1 — matching ================= */
  function renderA1() {
    var enO = shuf(G, 7 + S.a1.round * 13);
    var esO = shuf(G, 101 + S.a1.round * 29);
    var eh = '', sh = '';
    enO.forEach(function (g) {
      var d = !!S.a1.done[g.n];
      eh += '<button type="button" class="mitem' + (d ? ' ok' : '') + (S.a1.sel === 'e' + g.n ? ' sel' : '') + '" data-en="' + g.n + '"' +
        (d ? ' disabled' : '') + ' data-od-id="a1-en-' + g.n + '">' +
        (d ? ICO.check : '<span class="k">' + g.printed + '</span>') + '<span class="t">' + esc(g.en) + '</span></button>';
    });
    esO.forEach(function (g) {
      var d = !!S.a1.done[g.n];
      sh += '<button type="button" class="mitem' + (d ? ' ok' : '') + '" data-es="' + g.n + '"' +
        (d ? ' disabled' : '') + ' data-od-id="a1-es-' + g.n + '">' +
        (d ? ICO.check : '<span class="k">·</span>') + '<span class="t">' + esc(g.es) + '</span></button>';
    });
    $('#a1en').innerHTML = eh;
    $('#a1es').innerHTML = sh;
    var n = Object.keys(S.a1.done).length;
    $('#a1score').textContent = n;
    $('#a1try').textContent = S.a1.tries;
    $('#a1mini').style.width = (n / 12 * 100) + '%';
  }  function a1Click(btn) {
    if (btn.classList.contains('ok')) return;
    if (btn.dataset.en) {
      $$('.mitem').forEach(function (b) { b.classList.remove('sel', 'no'); });
      if (S.a1.sel === 'e' + btn.dataset.en) {            /* click again = deselect */
        S.a1.sel = null; save();
        fb($('#a1fb'), '', '', 'Selection cleared. Select an English term on the left.');
        return;
      }
      S.a1.sel = 'e' + btn.dataset.en; save();
      btn.classList.add('sel');
      fb($('#a1fb'), '', '', 'Now select the Spanish translation on the right.');
      return;
    }
    if (!S.a1.sel || S.a1.sel[0] !== 'e') {
      fb($('#a1fb'), 'no', ICO.cross, 'Select an English term first, then its Spanish translation.');
      return;
    }
    S.a1.tries++;
    var enN = +S.a1.sel.slice(1), esN = +btn.dataset.es;
    if (enN === esN) {
      S.a1.done[enN] = true; S.a1.sel = null;
      var g = G[enN - 1];
      save(); renderA1(); progress(); focusFirst('#a1en', '.mitem:not(:disabled)');
      var left = 12 - Object.keys(S.a1.done).length;
      fb($('#a1fb'), 'ok', ICO.check, '<b>Correct.</b> ' + esc(g.en) + ' <span class="es">— ' + esc(g.es) + '</span>' +
        (left ? ' <span class="es">' + left + ' left.</span>' : ' <b>All 12 matched.</b>'));
    } else {
      var picked = G[esN - 1];
      S.a1.sel = null;                                    /* bug fix: the hidden selection used to survive a wrong answer */
      save(); renderA1();
      fb($('#a1fb'), 'no', ICO.cross, '<b>Not a match.</b> “' + esc(picked.en) + '” is <span class="es">' + esc(picked.es) + '</span> — not the translation of the term you chose. Select the English term again and try another translation.');
    }
  }
  $('#a1en').addEventListener('click', function (e) { var b = e.target.closest('[data-en]'); if (b) a1Click(b); });
  $('#a1es').addEventListener('click', function (e) { var b = e.target.closest('[data-es]'); if (b) a1Click(b); });
  $('#a1shuffle').addEventListener('click', function () {
    S.a1.round++; S.a1.sel = null; save(); renderA1();
    fb($('#a1fb'), '', '', 'Order randomized. Already-matched pairs stay locked.');
  });
  $('#a1reset').addEventListener('click', function () {
    S.a1 = { done: {}, sel: null, tries: 0, round: Q.newSeed() % 1000 };
    save(); renderA1(); progress();
    fb($('#a1fb'), '', '', 'Activity restarted with a new order.');
  });

  /* ================= Activity 2 — sign meaning ================= */
  /* Options are placed by the per-set balanced schedule: the correct
     answer (opts[0]) sits at schedule[question] — a shuffled A/B/C/D
     cycle fixed for the whole set. Clicks and re-renders never move it. */
  function a2Opts(qi) {
    var q = D.A2[qi];
    var pos = Q.schedule(S.a2.seed, D.A2.length)[qi];
    return Q.makeOptions(q.opts[0], q.opts.slice(1), S.a2.seed + 37 + qi * 101, pos);
  }
  function renderA2() {
    var host = $('#a2body');
    bar('#a2', S.a2.score, 12);
    if (S.a2.i >= D.A2.length) {
      var strong = S.a2.score >= 9;
      host.innerHTML =
        '<div class="q-top"><span class="q-num">Activity complete</span></div>' +
        '<div class="' + (strong ? 'empt' : 'review') + '">' + (strong ? ICO.check : ICO.warn) +
        '<div><b>' + S.a2.score + ' / 12 correct.</b> ' +
        (strong ? 'Strong work on the sign vocabulary.' : 'Work through Part 1 again, then retry the ones you missed.') + '</div></div>' +
        '<div class="q-foot"><span class="lbl">Every figure above is an illustrative schematic drawn for this lesson — the source document has no images.</span>' +
        '<button class="btn btn-primary" type="button" data-restart>' + ICO.reset + 'Restart activity</button></div>';
      return;
    }
    var q = D.A2[S.a2.i], g = G[q.g], opts = a2Opts(S.a2.i), ans = S.a2.answered;
    var ok = !!S.a2.log[q.g];
    var oh = opts.map(function (o, i) {
      var cls = '';
      if (ans) cls = (o === q.opts[0]) ? 'ok' : (S.a2.pick === o ? 'no' : 'dim');
      return '<button type="button" class="opt ' + cls + '" data-opt="' + esc(o) + '"' + (ans ? ' disabled' : '') +
        ' data-od-id="a2-opt-' + S.a2.i + '-' + i + '"><span class="mk">' + LETTERS[i] + '</span><span class="lb">' + esc(o) + '</span></button>';
    }).join('');
    host.innerHTML =
      '<div class="q-top"><span class="q-num">Question <b>' + (S.a2.i + 1) + '</b> of 12</span>' +
      (ans ? '<span class="pill ' + (ok ? 'pill-ok' : 'pill-bad') + '">' + (ok ? ICO.check + 'Correct' : ICO.cross + 'Incorrect') + '</span>' : '') + '</div>' +
      '<div class="q-stem">What does this sign or marking mean?</div>' +
      '<div class="q-sub">In the document this item is <b style="font-weight:550;color:var(--fg)">' + esc(g.en) + '</b>.</div>' +
      figureFor(g) +
      '<div class="opts">' + oh + '</div>' +
      (ans
        ? '<div class="reveal' + (ok ? '' : ' bad-edge') + '"><span class="caps">' + (ok ? 'Correct — what it means' : 'The correct answer') + '</span>' +
          '<div class="es-t">' + esc(q.opts[0]) + '</div>' +
          (q.why ? '<div class="en-t">' + esc(q.why) + '</div>' : '') +
          '<div class="en-t"><b style="font-weight:550;color:var(--fg)">' + esc(g.en) + '</b> — <span class="es">' + esc(g.es) + '</span></div>' +
          (q.ref ? '<div class="en-t">Reference for the tutor: ' + esc(q.ref) + '</div>' : '') +
          '</div>'
        : '') +
      '<div class="q-foot"><span class="lbl">' + (ans ? 'Answer recorded.' : 'Select one answer.') + '</span>' +
      '<button class="btn btn-primary" type="button" data-next' + (ans ? '' : ' disabled') + '>' +
      (S.a2.i === D.A2.length - 1 ? 'Finish activity' : 'Next question') + ICO.arrow + '</button></div>';
  }
  $('#a2body').addEventListener('click', function (e) {
    var o = e.target.closest('[data-opt]');
    if (o && !S.a2.answered) {
      var q = D.A2[S.a2.i], right = o.dataset.opt === q.opts[0];
      S.a2.pick = o.dataset.opt; S.a2.answered = true; S.a2.log[q.g] = right;
      if (right) S.a2.score++;
      save(); renderA2(); progress(); focusFirst('#a2body', '[data-next]'); return;
    }
    if (e.target.closest('[data-next]')) { S.a2.i++; S.a2.answered = false; save(); renderA2(); focusFirst('#a2body', '.opt'); }
    if (e.target.closest('[data-restart]')) { S.a2 = { i: 0, score: 0, answered: false, log: {}, pick: null, seed: Q.newSeed() }; save(); renderA2(); progress(); }
  });
  $('#a2reset').addEventListener('click', function () {
    S.a2 = { i: 0, score: 0, answered: false, log: {}, pick: null, seed: Q.newSeed() }; save(); renderA2(); progress();
  });

  /* ================= Activity 3 — three columns ================= */
  function renderA3() {
    function col(list, attr, key) {
      return list.map(function (v) {
        var d = !!S.a3.done[v.n], sel = S.a3.sel[key] === v.n;
        var label = key === 'en' ? v.en : key === 'es' ? v.es : v.act;
        return '<button type="button" class="titem' + (d ? ' ok' : '') + (sel ? ' sel' : '') + '" data-' + attr + '="' + v.n + '"' +
          (d ? ' disabled' : '') + ' data-od-id="a3-' + attr + '-' + v.n + '"><span class="t">' + esc(label) + '</span>' +
          (d ? '<span class="ltr">' + ICO.check + '</span>' : '') + '</button>';   /* bug fix: row letters used to give the answer away */
      }).join('');
    }
    var r3 = (S.a3.round || 0) * 17;
    $('#a3en').innerHTML = col(shuf(V, 11 + r3), 'en', 'en');
    $('#a3es').innerHTML = col(shuf(V, 53 + r3), 'es', 'es');
    $('#a3ac').innerHTML = col(shuf(V, 97 + r3), 'ac', 'ac');
    var n = Object.keys(S.a3.done).length;
    ['#a3c1', '#a3c2', '#a3c3'].forEach(function (s) { $(s).textContent = n + '/10'; });
    $('#a3score').textContent = n;
    $('#a3mini').style.width = (n / 10 * 100) + '%';
    $('#a3err').textContent = S.a3.errors;
    var s = S.a3.sel;
    $('#a3picker').innerHTML =
      '<span class="slot' + (s.en ? ' on' : '') + '">' + (s.en ? esc(V[s.en - 1].en) : 'vehicle in English') + '</span><span class="sep">+</span>' +
      '<span class="slot' + (s.es ? ' on' : '') + '">' + (s.es ? esc(V[s.es - 1].es) : 'vehicle in Spanish') + '</span><span class="sep">+</span>' +
      '<span class="slot' + (s.ac ? ' on' : '') + '">' + (s.ac ? esc(V[s.ac - 1].act) : 'action') + '</span>';

    if (n === 10) fb($('#a3fb'), 'ok', ICO.check, '<b>All ten rows complete.</b> The pairing used is the one printed in the source table.');
    else fb($('#a3fb'), '', '', 'Select one item from each column. A row locks only when all three belong together.');

    var open = S.a3.wrong.filter(function (i) { return !S.a3.done[i]; });
    if (!open.length) { $('#a3review').innerHTML = ''; return; }
    var h = '<div class="review"><div class="review-h">' + ICO.warn + '<h3>Rows to revisit</h3></div><ul>';
    open.forEach(function (i) {
      var v = V[i - 1];
      h += '<li><b>Row ' + v.n + ' — ' + esc(v.en) + ' / ' + esc(v.es) + ' / ' + esc(v.act) + '</b><br>' +
        'Check the English name against its Spanish name and its action, then select all three again. ' +
        (v.flag ? flagPill() : '') + '</li>';
    });
    $('#a3review').innerHTML = h + '</ul></div>';
  }
  function a3Click(btn) {
    var side = btn.dataset.en !== undefined ? 'en' : (btn.dataset.es !== undefined ? 'es' : (btn.dataset.ac !== undefined ? 'ac' : null));
    if (!side || btn.disabled) return;
    var n3 = +btn.dataset[side];
    S.a3.sel[side] = (S.a3.sel[side] === n3) ? null : n3;     /* click again = deselect */
    var s = S.a3.sel;
    if (!(s.en && s.es && s.ac)) { renderA3(); return; }
    if (s.en === s.es && s.es === s.ac) {
      S.a3.done[s.en] = true;
      S.a3.wrong = S.a3.wrong.filter(function (i) { return i !== s.en; });
      S.a3.sel = { en: null, es: null, ac: null };
      var v = V[s.en - 1];
      save(); renderA3(); progress();
      fb($('#a3fb'), 'ok', ICO.check, '<b>Row locked.</b> ' + esc(v.en) + ' — ' + esc(v.es) + ' — ' + esc(v.act) + (v.flag ? ' ' + flagPill() : ''));
    } else {
      S.a3.errors++;
      if (S.a3.wrong.indexOf(s.en) === -1) S.a3.wrong.push(s.en);
      S.a3.sel = { en: null, es: null, ac: null };
      save(); renderA3();
      fb($('#a3fb'), 'no', ICO.cross, '<b>Those three do not belong to the same row.</b> Compare the English name with its Spanish name and its action, then try again.');
    }
  }
  ['#a3en', '#a3es', '#a3ac'].forEach(function (sel) {
    $(sel).addEventListener('click', function (e) { var b = e.target.closest('.titem'); if (b) a3Click(b); });
  });
  $('#a3retry').addEventListener('click', function () {
    S.a3.round = (S.a3.round || 0) + 1; S.a3.sel = { en: null, es: null, ac: null };
    save(); renderA3();
    fb($('#a3fb'), '', '', 'Columns shuffled. Completed rows stay locked.');
  });
  $('#a3reset').addEventListener('click', function () {
    S.a3 = { done: {}, sel: { en: null, es: null, ac: null }, errors: 0, wrong: [], round: Q.newSeed() % 1000 };
    save(); renderA3(); progress();
  });

  /* ================= Activity 4 — vehicle use ================= */
  /* The question tests the real function of the vehicle. The answer key
     is the standard ground-support function (actCorrect when the printed
     pairing is not standard); the printed source phrase joins the
     distractors so the student must tell them apart. Distractors are the
     other vehicles' cleaned action phrases — plausible aviation choices,
     not random filler. Position comes from the per-set schedule. */
  function a4Opts(i) {
    var v = V[i];
    var correct = v.actCorrect || v.actLabel || v.act;
    var distract = [];
    if (v.actCorrect) distract.push(v.act);
    V.forEach(function (x) {
      if (x.n !== v.n) distract.push(x.actLabel || x.act);
    });
    var pos = Q.schedule(S.a4.seed, D.A4.length)[i];
    return Q.makeOptions(correct, distract, S.a4.seed + 131 + i * 101, pos);
  }
  function renderA4() {
    var host = $('#a4body');
    bar('#a4', S.a4.score, 10);
    if (S.a4.i >= D.A4.length) {
      var strong = S.a4.score >= 8;
      host.innerHTML =
        '<div class="q-top"><span class="q-num">Activity complete</span></div>' +
        '<div class="' + (strong ? 'empt' : 'review') + '">' + (strong ? ICO.check : ICO.warn) +
        '<div><b>' + S.a4.score + ' / 10 correct.</b> The answer key is the source table’s own pairing, including the rows flagged for review.</div></div>' +
        '<div class="q-foot"><span class="lbl">Re-read the flagged rows in Part 2 before the final test.</span>' +
        '<button class="btn btn-primary" type="button" data-restart>' + ICO.reset + 'Restart activity</button></div>';
      return;
    }
    var i = S.a4.i, v = V[i], opts = a4Opts(i), ans = S.a4.answered, ok = !!S.a4.log[i];
    var keyFn = v.actCorrect || v.actLabel || v.act;
    var oh = opts.map(function (o, k) {
      var cls = ans ? ((o === keyFn) ? 'ok' : (S.a4.pick === o ? 'no' : 'dim')) : '';
      return '<button type="button" class="opt ' + cls + '" data-opt="' + esc(o) + '"' + (ans ? ' disabled' : '') +
        ' data-od-id="a4-opt-' + i + '-' + k + '"><span class="mk">' + LETTERS[k] + '</span><span class="lb">' + esc(o) + '</span></button>';
    }).join('');
    host.innerHTML =
      '<div class="q-top"><span class="q-num">Question <b>' + (i + 1) + '</b> of 10 — row ' + v.n + ' of the source table</span>' +
      (v.flag ? flagPill() : '') +
      (ans ? '<span class="pill ' + (ok ? 'pill-ok' : 'pill-bad') + '">' + (ok ? ICO.check + 'Correct' : ICO.cross + 'Incorrect') + '</span>' : '') + '</div>' +
      '<div class="q-stem">' + esc(v.en) + '</div>' +
      '<div class="q-sub">The document names it <b style="font-weight:550;color:var(--fg)">' + esc(v.es) + '</b>. What is it used for?</div>' +
      '<div class="opts">' + oh + '</div>' +
      (ans
        ? '<div class="reveal"><span class="caps">' + (v.actCorrect ? 'Standard function of this vehicle' : 'Pairing as printed in the source table') + '</span>' +
          '<div class="es-t">' + esc(v.en) + ' — ' + esc(keyFn) + '</div>' +
          '<div class="en-t">' + esc(v.es) + '</div>' +
          (v.actCorrect
            ? '<div class="en-t">The source table prints “' + esc(v.act) + '”' + (v.actLabel ? ' (shown here as “' + esc(v.actLabel) + '”)' : '') + ' — kept in Part 2 and marked for review.</div>'
            : (v.actLabel ? '<div class="en-t">Printed in the source as “' + esc(v.act) + '”.</div>' : '')) +
          '</div>' +
          (v.alt ? '<div class="review" style="margin-top:12px"><div class="review-h">' + ICO.warn + '<h3>' + (v.actCorrect ? 'Instructor review required' : 'Check this terminology') + '</h3></div><ul><li>' +
            (v.actCorrect ? '<b>Answer key (standard function):</b> ' + esc(v.actCorrect) + '.<br>' : '') +
            '<b>Kept as printed:</b> ' + esc(v.en) + ' — ' + esc(v.act) + '.<br>' +
            '<b>Additional information, not in the source document:</b> ' + esc(v.alt) +
            (v.src ? '<br><b>Source for the tutor:</b> ' + esc(v.src) : '') +
            '</li></ul></div>' : '')
        : '') +
      '<div class="q-foot"><span class="lbl">' + (ans ? 'Answer recorded.' : 'Select one answer.') + '</span>' +
      '<button class="btn btn-primary" type="button" data-next' + (ans ? '' : ' disabled') + '>' +
      (i === D.A4.length - 1 ? 'Finish activity' : 'Next question') + ICO.arrow + '</button></div>';
  }
  $('#a4body').addEventListener('click', function (e) {
    var o = e.target.closest('[data-opt]');
    if (o && !S.a4.answered) {
      var i = S.a4.i, v4 = V[i], right = o.dataset.opt === (v4.actCorrect || v4.actLabel || v4.act);
      S.a4.pick = o.dataset.opt; S.a4.answered = true; S.a4.log[i] = right;
      if (right) S.a4.score++;
      save(); renderA4(); progress(); focusFirst('#a4body', '[data-next]'); return;
    }
    if (e.target.closest('[data-next]')) { S.a4.i++; S.a4.answered = false; save(); renderA4(); focusFirst('#a4body', '.opt'); }
    if (e.target.closest('[data-restart]')) { S.a4 = { i: 0, score: 0, answered: false, log: {}, pick: null, seed: Q.newSeed() }; save(); renderA4(); progress(); }
  });
  $('#a4reset').addEventListener('click', function () {
    S.a4 = { i: 0, score: 0, answered: false, log: {}, pick: null, seed: Q.newSeed() }; save(); renderA4(); progress();
  });

  /* ================= Activity 5 — situations ================= */
  function renderA5() {
    var host = $('#a5body');
    bar('#a5', S.a5.score, 6);
    if (S.a5.i >= D.A5.length) {
      var strong = S.a5.score >= 5;
      host.innerHTML =
        '<div class="q-top"><span class="q-num">Activity complete</span></div>' +
        '<div class="' + (strong ? 'empt' : 'review') + '">' + (strong ? ICO.check : ICO.warn) +
        '<div><b>' + S.a5.score + ' / 6 correct.</b> Every expected answer comes from the source table.</div></div>' +
        '<div class="q-foot"><span class="lbl">Next: the final review test.</span>' +
        '<button class="btn btn-primary" type="button" data-restart>' + ICO.reset + 'Restart activity</button></div>';
      return;
    }
    var q = D.A5[S.a5.i], correct = V[q.a - 1], ans = S.a5.answered, ok = !!S.a5.log[q.i];
    var pos = Q.schedule(S.a5.seed, D.A5.length)[q.i];
    var opts = Q.makeOptions(correct.en, q.d, S.a5.seed + 61 + q.i * 101, pos);
    var oh = opts.map(function (o, k) {
      var cls = ans ? ((o === correct.en) ? 'ok' : (S.a5.pick === o ? 'no' : 'dim')) : '';
      return '<button type="button" class="opt ' + cls + '" data-opt="' + esc(o) + '"' + (ans ? ' disabled' : '') +
        ' data-od-id="a5-opt-' + q.i + '-' + k + '"><span class="mk">' + LETTERS[k] + '</span><span class="lb">' + esc(o) + '</span></button>';
    }).join('');
    host.innerHTML =
      '<div class="q-top"><span class="q-num">Situation <b>' + (q.i + 1) + '</b> of 6</span>' +
      (ans ? '<span class="pill ' + (ok ? 'pill-ok' : 'pill-bad') + '">' + (ok ? ICO.check + 'Correct' : ICO.cross + 'Incorrect') + '</span>' : '') + '</div>' +
      '<div class="q-stem">' + esc(q.s) + '</div>' +
      '<div class="q-sub">Which vehicle does the source table list for this?</div>' +
      '<div class="opts">' + oh + '</div>' +
      (ans
        ? '<div class="reveal"><span class="caps">Row ' + correct.n + ' of the source table</span>' +
          '<div class="es-t">' + esc(correct.en) + ' — ' + esc(correct.act) + '</div>' +
          '<div class="en-t">' + esc(correct.es) + '</div></div>' +
          '<div class="q-sub" style="margin:12px 0 0">' + esc(q.n) + '</div>' +
          (correct.flag ? '<div class="review" style="margin-top:12px"><div class="review-h">' + ICO.warn + '<h3>Check this terminology</h3></div><ul><li>' +
            '<b>Additional information, not in the source document:</b> ' + esc(correct.alt) + '</li></ul></div>' : '')
        : '') +
      '<div class="q-foot"><span class="lbl">' + (ans ? 'Answer recorded.' : 'Select one answer.') + '</span>' +
      '<button class="btn btn-primary" type="button" data-next' + (ans ? '' : ' disabled') + '>' +
      (q.i === D.A5.length - 1 ? 'Finish activity' : 'Next situation') + ICO.arrow + '</button></div>';
  }
  $('#a5body').addEventListener('click', function (e) {
    var o = e.target.closest('[data-opt]');
    if (o && !S.a5.answered) {
      var q = D.A5[S.a5.i], right = o.dataset.opt === V[q.a - 1].en;
      S.a5.pick = o.dataset.opt; S.a5.answered = true; S.a5.log[q.i] = right;
      if (right) S.a5.score++;
      save(); renderA5(); progress(); focusFirst('#a5body', '[data-next]'); return;
    }
    if (e.target.closest('[data-next]')) { S.a5.i++; S.a5.answered = false; save(); renderA5(); focusFirst('#a5body', '.opt'); }
    if (e.target.closest('[data-restart]')) { S.a5 = { i: 0, score: 0, answered: false, log: {}, pick: null, seed: Q.newSeed() }; save(); renderA5(); progress(); }
  });
  $('#a5reset').addEventListener('click', function () {
    S.a5 = { i: 0, score: 0, answered: false, log: {}, pick: null, seed: Q.newSeed() }; save(); renderA5(); progress();
  });


  /* ================= ATC dictionary ================= */
  var SPEAK = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  var SOUND = '<svg class="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 6.2h2.4L8 3.6v8.8L4.9 9.8H2.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.3 3.9a5.8 5.8 0 0 1 0 8.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  function say(text) {
    if (!SPEAK) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text); u.lang = 'en-GB'; u.rate = 0.85;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function norm(t) { return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

  var SRC_ENTRIES = G.map(function (g) {
    return { cat: 'source', en: g.en, es: g.es, def: 'Ground-movement term, Part 1 item ' + g.n + ' of the source (' + D.GROUND_KIND[g.n].toLowerCase() + ').', ex: '' };
  }).concat(V.map(function (v) {
    return { cat: 'source', en: v.en, es: v.es, def: 'Airport vehicle, Part 2 row ' + v.n + ' of the source. Function as printed: ' + v.act + '.', ex: '' };
  }));
  var DICT_CATS = [{ id: 'source', label: 'From the source document' }].concat(DI.CATS);
  var CAT_LABEL = {}; DICT_CATS.forEach(function (c) { CAT_LABEL[c.id] = c.label; });
  var DICT_ALL = SRC_ENTRIES.concat(DI.ENTRIES).map(function (e) {
    e.hay = norm(e.en + ' ' + e.es + ' ' + e.def + ' ' + e.ex);
    return e;
  }).sort(function (a, b) { return a.en.toLowerCase().localeCompare(b.en.toLowerCase()); });
  var DS = { q: '', cat: 'all', cover: false };

  function buildDictChips() {
    var counts = { all: DICT_ALL.length };
    DICT_ALL.forEach(function (e) { counts[e.cat] = (counts[e.cat] || 0) + 1; });
    var all = [{ id: 'all', label: 'All' }].concat(DICT_CATS);
    $('#dchips').innerHTML = all.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + c.id + '" aria-pressed="' + (DS.cat === c.id) + '">' +
        esc(c.label) + ' <span class="n">' + (counts[c.id] || 0) + '</span></button>';
    }).join('');
  }
  function renderDict() {
    var toks = norm(DS.q).split(/\s+/).filter(Boolean);
    var list = DICT_ALL.filter(function (e) {
      if (DS.cat !== 'all' && e.cat !== DS.cat) return false;
      return toks.every(function (t) { return e.hay.indexOf(t) > -1; });
    });
    $$('#dchips .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cat === DS.cat)); });
    $('#dtable').classList.toggle('cover', DS.cover);
    $('#dcover').setAttribute('aria-pressed', String(DS.cover));
    $('#dcount').textContent = 'Showing ' + list.length + ' of ' + DICT_ALL.length + ' entries';
    if (!list.length) {
      $('#dBody').innerHTML = '<tr><td colspan="4" class="dempty">No entry matches “' + esc(DS.q) + '”. Check the spelling, try the Spanish word, or ' +
        '<button type="button" class="linkbtn" id="dclear">clear the search and filter</button>.</td></tr>';
      return;
    }
    $('#dBody').innerHTML = list.map(function (e, i) {
      var src = e.cat === 'source';
      return '<tr' + (src ? ' class="srcrow"' : '') + '>' +
        '<td class="en"><span class="term">' + esc(e.en) + '</span>' +
        (SPEAK ? ' <button type="button" class="say" data-say="' + esc(e.en) + '" aria-label="Listen to ' + esc(e.en) + '" title="Listen">' + SOUND + '</button>' : '') + '</td>' +
        '<td class="es"><button type="button" class="cv" aria-label="Spanish for ' + esc(e.en) + '">' + esc(e.es) + '</button></td>' +
        '<td class="mean">' + esc(e.def) +
        (e.ex ? '<div class="ex"><span class="exl">Example</span> <q>' + esc(e.ex) + '</q>' +
          (SPEAK ? ' <button type="button" class="say" data-say="' + esc(e.ex) + '" aria-label="Listen to the example" title="Listen">' + SOUND + '</button>' : '') + '</div>' : '') + '</td>' +
        '<td class="cat">' + (src ? '<span class="pill pill-ok">Source</span>' : '<span class="pill pill-q">' + esc(CAT_LABEL[e.cat]) + '</span>') + '</td></tr>';
    }).join('');
  }
  $('#dq').addEventListener('input', function (e) { DS.q = e.target.value; renderDict(); });
  $('#dchips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    DS.cat = b.dataset.cat; renderDict();
  });
  $('#dcover').addEventListener('click', function () {
    DS.cover = !DS.cover; renderDict();
  });
  $('#dBody').addEventListener('click', function (e) {
    var sp = e.target.closest('[data-say]'); if (sp) { say(sp.dataset.say); return; }
    var cv = e.target.closest('.cv'); if (cv && DS.cover) { cv.classList.toggle('show'); return; }
    if (e.target.closest('#dclear')) {
      DS.q = ''; DS.cat = 'all'; $('#dq').value = ''; renderDict(); $('#dq').focus();
    }
  });

  /* ================= Activity 6 — dictionary drill ================= */
  var A6Q = null, A6R = -1;
  function a6pick(e, field, seed) {
    var pool = DI.ENTRIES.filter(function (x) { return x.en !== e.en && x[field] !== e[field]; });
    var same = pool.filter(function (x) { return x.cat === e.cat; });
    var rest = pool.filter(function (x) { return x.cat !== e.cat; });
    var seen = {}; seen[e[field]] = true;
    var out = [];
    shuf(same, seed).concat(shuf(rest, seed + 1)).forEach(function (x) {
      if (out.length < 3 && !seen[x[field]]) { seen[x[field]] = true; out.push(x[field]); }
    });
    return out;
  }
  /* A new set draws a fresh random seed: different words AND different
     answer positions. Cached per seed so re-renders never reshuffle. */
  function a6qs() {
    if (A6Q && A6R === S.a6.seed) return A6Q;
    var pos = Q.schedule(900 + S.a6.seed, 10);
    var picks = shuf(DI.ENTRIES, 401 + S.a6.seed).slice(0, 10);
    A6Q = picks.map(function (e, k) {
      var t = k % 3, q, distract;
      if (t === 0) { q = { stem: 'Select the Spanish for “' + e.en + '”.', sub: '', ans: e.es }; distract = a6pick(e, 'es', 500 + k * 11); }
      else if (t === 1) { q = { stem: 'Which term matches this meaning?', sub: e.def, ans: e.en }; distract = a6pick(e, 'en', 600 + k * 11); }
      else { q = { stem: 'Select the English for “' + e.es + '”.', sub: '', ans: e.en }; distract = a6pick(e, 'en', 700 + k * 11); }
      q.e = e;
      q.opts = Q.makeOptions(q.ans, distract, S.a6.seed + 800 + k * 29, pos[k]);
      return q;
    });
    A6R = S.a6.seed;
    return A6Q;
  }
  function a6reset() {
    S.a6 = { i: 0, score: 0, answered: false, log: {}, pick: null, seed: Q.newSeed() };
    save(); renderA6(); progress();
  }
  function renderA6() {
    var host = $('#a6body'), Q = a6qs();
    bar('#a6', S.a6.score, 10);
    if (S.a6.i >= Q.length) {
      var strong = S.a6.score >= 8;
      host.innerHTML =
        '<div class="q-top"><span class="q-num">Drill complete</span></div>' +
        '<div class="' + (strong ? 'empt' : 'review') + '">' + (strong ? ICO.check : ICO.warn) +
        '<div><b>' + S.a6.score + ' / 10 correct.</b> ' + (strong ? 'The new vocabulary is sticking.' : 'Search the dictionary for the terms you missed, then try a new set.') + '</div></div>' +
        '<div class="q-foot"><span class="lbl">A new set picks 10 different terms from the dictionary.</span>' +
        '<button class="btn btn-primary" type="button" data-restart>' + ICO.reset + 'New set of 10</button></div>';
      return;
    }
    var i = S.a6.i, q = Q[i], ans = S.a6.answered, ok = !!S.a6.log[i];
    var oh = q.opts.map(function (o, k) {
      var cls = ans ? ((o === q.ans) ? 'ok' : (S.a6.pick === o ? 'no' : 'dim')) : '';
      return '<button type="button" class="opt ' + cls + '" data-opt="' + esc(o) + '"' + (ans ? ' disabled' : '') +
        ' data-od-id="a6-opt-' + i + '-' + k + '"><span class="mk">' + LETTERS[k] + '</span><span class="lb">' + esc(o) + '</span></button>';
    }).join('');
    host.innerHTML =
      '<div class="q-top"><span class="q-num">Question <b>' + (i + 1) + '</b> of 10</span>' +
      '<span class="pill pill-q">' + esc(CAT_LABEL[q.e.cat]) + '</span>' +
      (ans ? '<span class="pill ' + (ok ? 'pill-ok' : 'pill-bad') + '">' + (ok ? ICO.check + 'Correct' : ICO.cross + 'Incorrect') + '</span>' : '') + '</div>' +
      '<div class="q-stem">' + esc(q.stem) + '</div>' +
      (q.sub ? '<div class="q-sub" style="margin-top:6px">' + esc(q.sub) + '</div>' : '<div style="height:16px"></div>') +
      '<div class="opts">' + oh + '</div>' +
      (ans
        ? '<div class="reveal' + (ok ? '' : ' bad-edge') + '"><span class="caps">Additional vocabulary — not in the source document</span>' +
          '<div class="es-t">' + esc(q.e.en) + ' — ' + esc(q.e.es) + '</div><div class="en-t">' + esc(q.e.def) + '</div>' +
          (q.e.ex ? '<div class="en-t">Example: “' + esc(q.e.ex) + '”</div>' : '') + '</div>'
        : '') +
      '<div class="q-foot"><span class="lbl">' + (ans ? 'Answer recorded.' : 'Select one answer.') + '</span>' +
      '<button class="btn btn-primary" type="button" data-next' + (ans ? '' : ' disabled') + '>' +
      (i === Q.length - 1 ? 'Finish drill' : 'Next question') + ICO.arrow + '</button></div>';
  }
  $('#a6body').addEventListener('click', function (e) {
    var o = e.target.closest('[data-opt]');
    if (o && !S.a6.answered) {
      var i = S.a6.i, right = o.dataset.opt === a6qs()[i].ans;
      S.a6.pick = o.dataset.opt; S.a6.answered = true; S.a6.log[i] = right;
      if (right) S.a6.score++;
      save(); renderA6(); progress(); focusFirst('#a6body', '[data-next]'); return;
    }
    if (e.target.closest('[data-next]')) { S.a6.i++; S.a6.answered = false; save(); renderA6(); focusFirst('#a6body', '.opt'); }
    if (e.target.closest('[data-restart]')) a6reset();
  });
  $('#a6reset').addEventListener('click', a6reset);

  /* ================= Part 3 — final test ================= */
  function renderFinal() {
    var host = $('#fnbody');
    $('#fnscore').textContent = S.fin.score;
    $('#fnmini').style.width = (S.fin.log.length / FINAL.length * 100) + '%';

    if (S.fin.i >= FINAL.length) {
      var pct = Math.round(S.fin.score / FINAL.length * 100);
      var verdict = pct >= 83 ? 'You have the document’s vocabulary under control.'
        : pct >= 67 ? 'Solid, with a few gaps. The mistakes below point at exactly what to re-read.'
        : 'Worth another pass through Parts 1 and 2 before you move on.';
      var C = 2 * Math.PI * 56;
      var ring = '<svg class="ring" viewBox="0 0 128 128" role="img" aria-label="Score ' + S.fin.score + ' out of ' + FINAL.length + '">'
        + '<circle cx="64" cy="64" r="56" fill="none" stroke="var(--border)" stroke-width="12"/>'
        + '<circle cx="64" cy="64" r="56" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="butt"'
        + ' stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - S.fin.score / FINAL.length)).toFixed(1) + '"'
        + ' transform="rotate(-90 64 64)"/>'
        + '<text x="64" y="60" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="26" font-weight="600" fill="var(--fg)">' + S.fin.score + '/' + FINAL.length + '</text>'
        + '<text x="64" y="78" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="var(--muted)">' + pct + '%</text>'
        + '</svg>';

      var rows = S.fin.log.map(function (r, i) {
        var q = FINAL[i];
        return '<div class="rrow" data-od-id="final-row-' + (i + 1) + '">' +
          '<span class="num">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="q">' + esc(q.q) + '<span class="cat">' + esc(q.cat) + '</span></span>' +
          (r.ok ? '<span class="pill pill-ok">' + ICO.check + 'Correct</span>'
                : '<span class="pill pill-bad">' + ICO.cross + 'Missed</span>') + '</div>';
      }).join('');

      var bad = [];
      S.fin.log.forEach(function (r, i) {
        if (r.ok) return;
        var q = FINAL[i];
        bad.push('<div class="mistake" data-od-id="final-mistake-' + (i + 1) + '">' +
          '<div class="mq">' + esc(q.q) + '</div>' +
          '<div class="ma">Correct: ' + esc(q.opts[q.a]) + '</div>' +
          '<div class="my">You chose: ' + esc(r.pick) + '</div>' +
          '<div class="fix">' + esc(q.fix) + '</div></div>');
      });

      host.innerHTML =
        '<div class="q-top"><span class="q-num">Test complete</span>' +
        '<span class="pill ' + (pct >= 67 ? 'pill-ok' : 'pill-warn') + '">' + (pct >= 67 ? ICO.check : ICO.warn) + pct + '%</span></div>' +
        '<div class="result">' +
        '<div><div class="ring-cap">' + ring + '<b>' + S.fin.score + ' / ' + FINAL.length + '</b><span>Final score</span></div></div>' +
        '<div><p style="font-size:16px;margin-bottom:14px">' + esc(verdict) + '</p>' +
        '<div class="summary" style="margin-bottom:18px">' +
        '<div class="sbox"><span class="caps">Correct</span><b>' + S.fin.score + '</b><span>of ' + FINAL.length + ' questions</span></div>' +
        '<div class="sbox"><span class="caps">Missed</span><b>' + (FINAL.length - S.fin.score) + '</b><span>listed below with the fix</span></div>' +
        '<div class="sbox"><span class="caps">Source items</span><b>22</b><span>12 ground + 10 vehicles</span></div>' +
        '</div>' +
        (bad.length ? '<h3 style="font-size:14px;margin-bottom:10px">Mistakes</h3><div class="rlist">' + bad.join('') + '</div>'
                    : '<div class="empt">' + ICO.check + '<div><b>No mistakes.</b> Every answer matched the document.</div></div>') +
        '</div></div>' +
        '<h3 style="font-size:14px;margin:24px 0 10px">Answer review</h3>' +
        '<div class="rbreak">' + rows + '</div>' +
        '<h3 style="font-size:14px;margin:24px 0 10px">Vocabulary review</h3>' +
        '<p class="q-sub" style="margin-bottom:12px">The full source vocabulary is listed at the end of the lesson, with the flagged rows marked.</p>' +
        '<a class="btn" href="#sec-rev" data-od-id="final-jump-review">Go to the vocabulary review' + ICO.arrow + '</a>' +
        '<div class="q-foot"><span class="lbl">Restart to retake the test with the same questions.</span>' +
        '<button class="btn btn-primary" type="button" data-restart>' + ICO.reset + 'Retake the test</button></div>';
      return;
    }

    var q = FINAL[S.fin.i], ans = S.fin.answered, ok = S.fin.log[S.fin.i] && S.fin.log[S.fin.i].ok;
    var rightTxt = q.opts[q.a];
    var fpos = Q.schedule(S.fin.seed, FINAL.length)[S.fin.i];
    var oh = Q.makeOptions(rightTxt, q.opts.filter(function (x, k) { return k !== q.a; }), S.fin.seed + 211 + S.fin.i * 101, fpos).map(function (o, k) {
      var cls = ans ? ((o === rightTxt) ? 'ok' : (S.fin.pick === o ? 'no' : 'dim')) : '';
      return '<button type="button" class="opt ' + cls + '" data-opt="' + esc(o) + '"' + (ans ? ' disabled' : '') +
        ' data-od-id="fn-opt-' + S.fin.i + '-' + k + '"><span class="mk">' + LETTERS[k] + '</span><span class="lb">' + esc(o) + '</span></button>';
    }).join('');
    host.innerHTML =
      '<div class="q-top"><span class="q-num">Question <b>' + (S.fin.i + 1) + '</b> of ' + FINAL.length + '</span>' +
      '<span class="pill pill-q">' + esc(q.cat) + '</span>' +
      (ans ? '<span class="pill ' + (ok ? 'pill-ok' : 'pill-bad') + '">' + (ok ? ICO.check + 'Correct' : ICO.cross + 'Incorrect') + '</span>' : '') + '</div>' +
      '<div class="q-stem">' + esc(q.q) + '</div>' +
      '<div class="opts" style="margin-top:18px">' + oh + '</div>' +
      (ans
        ? '<div class="reveal' + (ok ? '' : ' bad-edge') + '"><span class="caps">' + (ok ? 'From the document' : 'The document says') + '</span>' +
          '<div class="es-t">' + esc(q.opts[q.a]) + '</div><div class="en-t">' + esc(q.fix) + '</div></div>'
        : '') +
      '<div class="q-foot"><span class="lbl">' + (ans ? 'Answer recorded.' : 'Select one answer.') + '</span>' +
      '<button class="btn btn-primary" type="button" data-next' + (ans ? '' : ' disabled') + '>' +
      (S.fin.i === FINAL.length - 1 ? 'Finish test' : 'Next question') + ICO.arrow + '</button></div>';
  }
  $('#fnbody').addEventListener('click', function (e) {
    var o = e.target.closest('[data-opt]');
    if (o && !S.fin.answered) {
      var i = S.fin.i, q = FINAL[i], right = o.dataset.opt === q.opts[q.a];
      S.fin.pick = o.dataset.opt; S.fin.answered = true;
      S.fin.log[i] = { ok: right, pick: o.dataset.opt };
      if (right) S.fin.score++;
      save(); renderFinal(); progress(); focusFirst('#fnbody', '[data-next]'); return;
    }
    if (e.target.closest('[data-next]')) { S.fin.i++; S.fin.answered = false; save(); renderFinal(); focusFirst('#fnbody', '.opt'); }
    if (e.target.closest('[data-restart]')) { S.fin = { i: 0, score: 0, answered: false, log: [], pick: null, seed: Q.newSeed() }; save(); renderFinal(); progress(); }
  });
  $('#fnreset').addEventListener('click', function () {
    S.fin = { i: 0, score: 0, answered: false, log: [], pick: null, seed: Q.newSeed() }; save(); renderFinal(); progress();
  });

  /* ================= init ================= */
  load();
  ensureSeeds();
  buildRack();
  renderTables();
  buildDictChips(); renderDict();
  renderA1(); renderA2(); renderA3(); renderA4(); renderA5(); renderA6(); renderFinal();
  progress();

  document.documentElement.setAttribute('data-atc-ready', '1');
})();
