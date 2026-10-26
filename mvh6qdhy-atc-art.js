/* ============================================================
   Sign schematics for Activity 2.
   These are illustrative examples drawn for this lesson. The
   source .docx contains no embedded images, so nothing here is
   a reproduction of a photograph of real airport signage.
   ============================================================ */
(function (global) {
  'use strict';

  var T = 'var(--tarmac)';
  var ASPH = 'oklch(30% 0.01 250)';
  var EDGE = 'oklch(62% 0.01 250)';
  var LBL = 'oklch(72% 0.008 250)';
  var DIM = 'oklch(50% 0.01 250)';
  var Y = 'var(--sign-yellow)';
    var R = 'var(--sign-red)';
  var K = 'var(--sign-black)';
  var W = 'var(--paper)';
  var FF = 'font-family="IBM Plex Mono, ui-monospace, monospace"';

  var ART = {
    /* continuous yellow line down the middle of a taxiway
       (FAA AIM 2-3-4: the taxiway centreline is a single continuous
       yellow line — not dashed; runway markings are white) */
    centreline: function () {
      return '<svg viewBox="0 0 320 150" role="img" aria-label="Schematic top view of a taxiway with a continuous yellow centre line">' +
        '<rect width="320" height="150" fill="' + T + '"/>' +
        '<path d="M0 42h320M0 108h320" stroke="' + EDGE + '" stroke-width="2.5"/>' +
        '<path d="M8 75h304" stroke="' + Y + '" stroke-width="3.5"/>' +
        '<text x="160" y="134" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="middle">continuous yellow centre line</text>' +
        '</svg>';
    },

    /* holding position: Pattern A markings across a taxiway, runway ahead */
    holding: function () {
      return '<svg viewBox="0 0 320 150" role="img" aria-label="Schematic of a taxiway holding position in front of a runway, with two solid and two dashed yellow lines across the taxiway">' +
        '<rect width="320" height="150" fill="' + T + '"/>' +
        '<rect x="0" y="6" width="320" height="40" fill="' + ASPH + '"/>' +
        '<path d="M0 26h320" stroke="' + W + '" stroke-width="2" stroke-dasharray="14 12" opacity=".7"/>' +
        '<text x="300" y="20" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="end">RUNWAY</text>' +
        '<rect x="120" y="46" width="80" height="104" fill="' + ASPH + '"/>' +
        '<path d="M160 46v104" stroke="' + Y + '" stroke-width="3"/>' +
        '<path d="M120 62h80M120 71h80" stroke="' + Y + '" stroke-width="3.5" stroke-dasharray="10 8"/>' +
        '<path d="M120 86h80M120 95h80" stroke="' + Y + '" stroke-width="3.5"/>' +
        '<text x="212" y="94" fill="' + LBL + '" ' + FF + ' font-size="10">hold short here</text>' +
        '<text x="212" y="108" fill="' + LBL + '" ' + FF + ' font-size="9">stop at solid lines</text>' +
        '<g fill="' + DIM + '"><rect x="66" y="104" width="4" height="22"/><rect x="82" y="104" width="4" height="22"/></g>' +
        '<rect x="48" y="80" width="56" height="26" fill="' + R + '"/>' +
        '<text x="76" y="98" fill="' + W + '" ' + FF + ' font-size="13" font-weight="600" text-anchor="middle">09-27</text>' +
        '</svg>';
    },


    /* runway designator: the number painted on the runway, readable on approach */
    designator: function () {
      return '<svg viewBox="0 0 320 150" role="img" aria-label="Schematic of a runway designator, the white number 09 painted on a runway">' +
        '<rect width="320" height="150" fill="' + T + '"/>' +
        '<rect x="96" width="128" height="150" fill="' + ASPH + '"/>' +
        '<path d="M102 0v150M218 0v150" stroke="' + W + '" stroke-width="2.5" opacity=".85"/>' +
        '<text x="160" y="76" fill="' + W + '" ' + FF + ' font-size="56" font-weight="600" text-anchor="middle">09</text>' +
        '<path d="M160 98v52" stroke="' + W + '" stroke-width="4" stroke-dasharray="14 10" opacity=".85"/>' +
        '<text x="48" y="70" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="middle">runway</text>' +
        '<text x="48" y="84" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="middle">designator</text>' +
        '<text x="272" y="70" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="middle">heading</text>' +
        '<text x="272" y="84" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="middle">about 090°</text>' +
        '</svg>';
    },


    /* taxiway location sign: yellow letter on black, yellow border */
    location: function () {
      return '<svg viewBox="0 0 320 150" role="img" aria-label="Schematic of a taxiway location sign, a yellow letter A on a black background with a yellow border">' +
        '<rect width="320" height="150" fill="' + T + '"/>' +
        '<g fill="' + DIM + '"><rect x="145" y="104" width="6" height="40"/><rect x="169" y="104" width="6" height="40"/></g>' +
        '<rect x="116" y="26" width="88" height="78" fill="' + K + '" stroke="' + Y + '" stroke-width="3"/>' +
        '<text x="160" y="86" fill="' + Y + '" ' + FF + ' font-size="58" font-weight="600" text-anchor="middle">A</text>' +
        '<text x="160" y="16" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="middle">you are on taxiway A</text>' +
        '</svg>';
    },


    /* direction sign: black on yellow, taxiway letter + arrow */
    direction: function () {
      return '<svg viewBox="0 0 320 150" role="img" aria-label="Schematic of a taxiway direction sign, a black letter A and arrow on a yellow background">' +
        '<rect width="320" height="150" fill="' + T + '"/>' +
        '<g fill="' + DIM + '"><rect x="138" y="106" width="6" height="38"/><rect x="176" y="106" width="6" height="38"/></g>' +
        '<rect x="66" y="30" width="188" height="76" fill="' + Y + '" stroke="' + K + '" stroke-width="2"/>' +
        '<text x="112" y="86" fill="' + K + '" ' + FF + ' font-size="52" font-weight="600" text-anchor="middle">A</text>' +
        '<path d="M156 68h60M200 50l18 18-18 18" stroke="' + K + '" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<text x="160" y="18" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="middle">direction of travel</text>' +
        '</svg>';
    },


    /* ground power unit connected to an aircraft */
    gpu: function () {
      return '<svg viewBox="0 0 320 150" role="img" aria-label="Schematic of a ground power unit connected to an aircraft">' +
        '<rect width="320" height="150" fill="oklch(96.5% 0.004 250)"/>' +
        '<path d="M0 120h320" stroke="oklch(80% 0.008 250)" stroke-width="2"/>' +
        '<rect x="34" y="58" width="82" height="54" rx="3" fill="oklch(52% 0.03 60)"/>' +
        '<rect x="46" y="68" width="32" height="16" rx="2" fill="oklch(88% 0.05 90)"/>' +
        '<g fill="oklch(34% 0.01 250)"><circle cx="52" cy="116" r="9"/><circle cx="98" cy="116" r="9"/></g>' +
        '<path d="M116 82c36 0 26 40 58 40" stroke="oklch(34% 0.01 250)" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<rect x="168" y="114" width="20" height="16" rx="2" fill="oklch(34% 0.01 250)"/>' +
        '<rect x="204" y="36" width="86" height="80" rx="4" fill="oklch(90% 0.005 250)" stroke="oklch(62% 0.01 250)" stroke-width="2"/>' +
        '<g stroke="oklch(58% 0.01 250)" stroke-width="3" stroke-linecap="round"><path d="M224 56h46"/><path d="M224 72h46"/><path d="M224 88h28"/></g>' +
        '<text x="247" y="107" fill="oklch(42% 0.02 250)" ' + FF + ' font-size="9" text-anchor="middle">AIRCRAFT</text>' +
        '<text x="75" y="140" fill="oklch(44% 0.02 250)" ' + FF + ' font-size="10" text-anchor="middle">GPU</text>' +
        '</svg>';
    },

    /* helipad marking */
    helipad: function () {
      return '<svg viewBox="0 0 320 150" role="img" aria-label="Schematic of a helipad marking with the letter H">' +
        '<rect width="320" height="150" fill="' + T + '"/>' +
        '<circle cx="160" cy="72" r="55" fill="none" stroke="' + Y + '" stroke-width="4"/>' +
        '<text x="160" y="94" fill="' + W + '" ' + FF + ' font-size="56" font-weight="600" text-anchor="middle">H</text>' +
        '<text x="160" y="142" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="middle">helicopters only</text>' +
        '</svg>';
    },

    /* ATC instruction, not a sign */
    ahead: function () {
      return '<svg viewBox="0 0 320 150" role="img" aria-label="Controller instruction reading move ahead, shown as an instruction rather than a sign">' +
        '<rect width="320" height="150" fill="var(--ink)"/>' +
        '<rect x="22" y="26" width="276" height="98" rx="4" fill="oklch(27% 0.02 245)" stroke="oklch(40% 0.02 245)"/>' +
        '<text x="42" y="52" fill="oklch(55% 0.016 245)" ' + FF + ' font-size="9.5" letter-spacing="1.6">CONTROLLER INSTRUCTION</text>' +
        '<text x="42" y="96" fill="oklch(92% 0.006 245)" font-family="Inter, sans-serif" font-size="30" font-weight="550">Move ahead</text>' +
        '<path d="M244 78h28M262 66l10 12-10 12" stroke="var(--accent)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';
    },

    /* ATC instruction, not a sign */
    slow: function () {
      return '<svg viewBox="0 0 320 150" role="img" aria-label="Controller instruction reading slow down, shown as an instruction rather than a sign">' +
        '<rect width="320" height="150" fill="var(--ink)"/>' +
        '<rect x="22" y="26" width="276" height="98" rx="4" fill="oklch(27% 0.02 245)" stroke="oklch(40% 0.02 245)"/>' +
        '<text x="42" y="52" fill="oklch(55% 0.016 245)" ' + FF + ' font-size="9.5" letter-spacing="1.6">CONTROLLER INSTRUCTION</text>' +
        '<text x="42" y="96" fill="oklch(92% 0.006 245)" font-family="Inter, sans-serif" font-size="30" font-weight="550">Slow down</text>' +
        '<path d="M258 58v28M246 74l12 12 12-12" stroke="oklch(74% 0.13 78)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';
    },

    /* taxiway A curving in a new direction */
    chgdir: function () {
      return '<svg viewBox="0 0 320 150" role="img" aria-label="Schematic of taxiway A curving in another direction">' +
        '<rect width="320" height="150" fill="' + T + '"/>' +
        '<path d="M0 116h140a58 58 0 0 0 58-58V16" stroke="' + EDGE + '" stroke-width="36" fill="none"/>' +
        '<path d="M0 116h140a58 58 0 0 0 58-58V16" stroke="' + Y + '" stroke-width="3" fill="none"/>' +
        '<path d="M184 32l14-14 14 14" stroke="' + Y + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<rect x="222" y="84" width="48" height="52" fill="' + K + '" stroke="' + Y + '" stroke-width="2.5"/>' +
        '<text x="246" y="126" fill="' + Y + '" ' + FF + ' font-size="34" font-weight="600" text-anchor="middle">A</text>' +
        '<text x="112" y="142" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="middle">taxiway A changes direction</text>' +
        '</svg>';
    },

    /* runway threshold markings */
    threshold: function () {
      return '<svg viewBox="0 0 320 150" role="img" aria-label="Schematic of runway threshold markings with white stripes">' +
        '<rect width="320" height="150" fill="' + T + '"/>' +
        '<rect y="24" width="320" height="102" fill="' + ASPH + '"/>' +
        '<path d="M0 9h320" stroke="oklch(80% 0.01 250)" stroke-width="5"/>' +
        '<g fill="' + W + '">' +
        '<rect x="28" y="38" width="20" height="74"/><rect x="62" y="34" width="16" height="82"/>' +
        '<rect x="92" y="30" width="12" height="90"/><rect x="118" y="30" width="12" height="90"/>' +
        '<rect x="144" y="34" width="16" height="82"/><rect x="174" y="38" width="20" height="74"/>' +
        '</g>' +
        '<text x="230" y="70" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="middle">threshold</text>' +
        '<text x="230" y="88" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="middle">markings</text>' +
        '<text x="160" y="146" fill="' + LBL + '" ' + FF + ' font-size="10" text-anchor="middle">runway</text>' +
        '</svg>';
    },

    /* wind indicator */
    windsock: function () {
      return '<svg viewBox="0 0 320 150" role="img" aria-label="Schematic of a windsock showing wind direction and speed">' +
        '<rect width="320" height="150" fill="oklch(96.5% 0.004 250)"/>' +
        '<path d="M0 124h320" stroke="oklch(80% 0.008 250)" stroke-width="2"/>' +
        '<path d="M104 124V30" stroke="oklch(46% 0.01 250)" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M104 30h13M104 37h17" stroke="oklch(46% 0.01 250)" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M108 42h92l-22 28 22 28h-92z" fill="' + Y + '"/>' +
        '<path d="M136 42h22l-11 28 11 28h-22zM164 42h22l-11 28 11 28h-22z" fill="oklch(58% 0.19 30)"/>' +
        '<text x="104" y="144" fill="oklch(44% 0.02 250)" ' + FF + ' font-size="10" text-anchor="middle">240 / 15</text>' +
        '<text x="246" y="130" fill="oklch(44% 0.02 250)" ' + FF + ' font-size="10" text-anchor="middle">wind 240° / 15 kt</text>' +
        '</svg>';
    }
  };

  global.ATCART = ART;
})(window);
