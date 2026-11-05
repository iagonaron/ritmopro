/* =====================================================================
   NOTACIÓN · motor de grafía musical para las INTROS DIDÁCTICAS
   (LM at home · Iago González Alonso)

   Dibuja en SVG con la fuente Bravura (SMuFL), la misma familia de
   grafía que usa VexFlow en la web. Todo se mide en "espacios de
   pentagrama" (sp): 1 sp = distancia entre dos líneas del pentagrama.
   Tamaño unificado en toda la intro: NOTA.SP (px por sp).

   Cada elemento musical va en su propio <g> con color "currentColor",
   así una escena puede resaltarlo (rosa teoría) cambiando solo el color.
   ===================================================================== */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const M = window.BRAVURA_M;                       // métricas SMuFL
  const CP = {                                      // puntos de código SMuFL
    gClef: 0xE050,
    timeSigPlus: 0xE08C, timeSigPlusSmall: 0xE08D, timeSigFractionalSlash: 0xE08E,
    timeSigEquals: 0xE08F, timeSigMinus: 0xE090, timeSigComma: 0xE096,
    timeSigFractionQuarter: 0xE097, timeSigFractionHalf: 0xE098,
    noteheadWhole: 0xE0A2, noteheadHalf: 0xE0A3, noteheadBlack: 0xE0A4,
    augmentationDot: 0xE1E7,
    flag8thUp: 0xE240, flag8thDown: 0xE241, flag16thUp: 0xE242, flag16thDown: 0xE243,
    flag32ndUp: 0xE244, flag32ndDown: 0xE245,
    accidentalFlat: 0xE260, accidentalNatural: 0xE261, accidentalSharp: 0xE262,
    restQuarter: 0xE4E5, rest8th: 0xE4E6, rest16th: 0xE4E7,
    noteHalfUp: 0xE1D3, noteQuarterUp: 0xE1D5, note8thUp: 0xE1D7, note16thUp: 0xE1D9,
  };
  for (let i = 0; i < 10; i++) CP['timeSig' + i] = 0xE080 + i;

  // Grosores de grabado de Bravura (engravingDefaults), en sp
  const E = { stem: 0.12, beam: 0.5, beamGap: 0.25, staffLine: 0.13, thinBar: 0.16,
              barSep: 0.4, ledger: 0.16, ledgerExt: 0.4, dash: 0.16 };

  const N = {
    SP: 24,                       // px por espacio de pentagrama (tamaño único de la intro)
    FONT: 'BravuraIntro',
    E, CP, M,
  };

  // ---------------------------------------------------------------- utilidades SVG
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  N.el = el;
  N.group = (parent, cls, attrs) => el('g', Object.assign({ class: cls || null }, attrs || {}), parent);

  /** Glifo SMuFL con su origen (x, y) en px. scale = 1 → tamaño de pentagrama. */
  function glyph(parent, name, x, y, sp, scale) {
    const s = (scale || 1);
    const t = el('text', {
      x: +x.toFixed(2), y: +y.toFixed(2),
      'font-family': N.FONT, 'font-size': +(4 * sp * s).toFixed(2), fill: 'currentColor',
    }, parent);
    t.textContent = String.fromCodePoint(CP[name]);
    return t;
  }
  N.glyph = glyph;
  const adv = (name, s) => M[name].adv * (s || 1);

  function line(parent, x1, y1, x2, y2, w, extra) {
    return el('line', Object.assign({ x1: +x1.toFixed(2), y1: +y1.toFixed(2), x2: +x2.toFixed(2), y2: +y2.toFixed(2),
      stroke: 'currentColor', 'stroke-width': +w.toFixed(2) }, extra || {}), parent);
  }
  N.line = line;

  // ================================================================ COMPASES
  /** Cifra (texto de dígitos) de compás; origen vertical = centro del dígito. Devuelve ancho en px. */
  function cifra(parent, str, x, yc, sp, s) {
    let cx = x;
    for (const ch of String(str)) {
      glyph(parent, 'timeSig' + ch, cx, yc, sp, s);
      cx += adv('timeSig' + ch, s) * sp;
    }
    return cx - x;
  }
  function anchoCifra(str, s) { let w = 0; for (const ch of String(str)) w += adv('timeSig' + ch, s); return w; }

  /**
   * Indicación de compás. spec:
   *  {tipo:'simple', num:'2', den:'4'}
   *  {tipo:'mixto', partes:[{num:'2',den:'4'},{num:'1',den:'8'}]}
   *  {tipo:'decimal', ent:'2', dec:'5', den:'4'}           → 2’5 / 4  (apóstrofo como en el PDF y en teoriapro)
   *  {tipo:'frac', base:'2', signo:'+'|'-', n:'1', d:'2', den:'4'}  → 2 ¹⁄₂ / 4 (fracción pequeña arriba a la dcha.)
   *  {tipo:'interrogante'}
   * Devuelve {g, w, partes:{…}} con w en px. yMid = línea central del pentagrama.
   */
  function compas(parent, spec, x, yMid, sp, opt) {
    sp = sp || N.SP; opt = opt || {};
    const g = N.group(parent, 'compas');
    const partes = {};
    const yNum = yMid - sp, yDen = yMid + sp;
    if (spec.tipo === 'simple') {
      const wn = anchoCifra(spec.num), wd = anchoCifra(spec.den), w = Math.max(wn, wd);
      partes.num = N.group(g, 'num'); partes.den = N.group(g, 'den');
      cifra(partes.num, spec.num, x + (w - wn) / 2 * sp, yNum, sp);
      cifra(partes.den, spec.den, x + (w - wd) / 2 * sp, yDen, sp);
      partes.oNum = { x: x + (w - wn) / 2 * sp, y: yNum }; partes.oDen = { x: x + (w - wd) / 2 * sp, y: yDen };
      return { g, w: w * sp, partes, caja: { x, y: yMid - 2 * sp, w: w * sp, h: 4 * sp } };
    }
    if (spec.tipo === 'mixto') {
      let cx = x; partes.terminos = []; partes.mas = [];
      spec.partes.forEach((p, i) => {
        if (i > 0) {
          const gm = N.group(g, 'mas');
          cx += 0.7 * sp;
          // "+" pequeño, centrado en la línea central (como en el PDF)
          glyph(gm, 'timeSigPlusSmall', cx, yMid + 0.02 * sp, sp);
          partes.mas.push(gm);
          cx += (adv('timeSigPlusSmall') + 0.7) * sp;
        }
        const r = compas(g, { tipo: 'simple', num: p.num, den: p.den }, cx, yMid, sp);
        partes.terminos.push(r);
        cx += r.w;
      });
      return { g, w: cx - x, partes, caja: { x, y: yMid - 2 * sp, w: cx - x, h: 4 * sp } };
    }
    if (spec.tipo === 'decimal') {
      // 2’5 : el apóstrofo es la coma de compás de Bravura, subida a la altura de las cifras
      const s = 1, wi = anchoCifra(spec.ent), wdec = anchoCifra(spec.dec), wa = 0.62;
      const wn = wi + 0.06 + wa + wdec, wd = anchoCifra(spec.den), w = Math.max(wn, wd);
      const x0 = x + (w - wn) / 2 * sp;
      partes.num = N.group(g, 'num');
      partes.ent = N.group(partes.num, 'ent'); partes.apos = N.group(partes.num, 'apos'); partes.dec = N.group(partes.num, 'dec');
      cifra(partes.ent, spec.ent, x0, yNum, sp);
      glyph(partes.apos, 'timeSigComma', x0 + (wi + 0.02) * sp, yNum - 1.0 * sp + 0.62 * sp, sp, 0.8);
      cifra(partes.dec, spec.dec, x0 + (wi + 0.06 + wa) * sp, yNum, sp);
      partes.den = N.group(g, 'den');
      cifra(partes.den, spec.den, x + (w - wd) / 2 * sp, yDen, sp);
      partes.cajaNum = { x: x0, y: yNum - sp, w: wn * sp, h: 2 * sp };
      partes.oEnt = { x: x0, y: yNum }; partes.oDen = { x: x + (w - wd) / 2 * sp, y: yDen };
      return { g, w: w * sp, partes, caja: { x, y: yMid - 2 * sp, w: w * sp, h: 4 * sp } };
    }
    if (spec.tipo === 'frac') {
      // cifra principal + fracción pequeña (≈55 %) alineada arriba, como «2^1/2» del PDF
      const s = 0.55, wb = anchoCifra(spec.base);
      const wMinus = spec.signo === '-' ? adv('timeSigMinus', s) * 0.72 + 0.05 : 0;
      const wf = wMinus + anchoCifra(spec.n, s) + adv('timeSigFractionalSlash', s) * 0.8 + anchoCifra(spec.d, s);
      const wn = wb + 0.08 + wf, wd = anchoCifra(spec.den), w = Math.max(wn, wd);
      const x0 = x + (w - wn) / 2 * sp;
      partes.num = N.group(g, 'num');
      partes.base = N.group(partes.num, 'base'); partes.frac = N.group(partes.num, 'frac');
      cifra(partes.base, spec.base, x0, yNum, sp);
      // parte alta de la cifra grande: yNum - 1.0 sp ; la cifra pequeña mide 2*s sp → su centro
      const ycf = yNum - 1.0 * sp + 1.0 * s * sp;
      let fx = x0 + (wb + 0.08) * sp;
      if (spec.signo === '-') {
        const gmin = N.group(partes.frac, 'menos');
        // raya del signo menos, algo más corta que la de Bravura para que no parezca un guion largo
        const w0 = adv('timeSigMinus', s) * 0.72 * sp;
        line(gmin, fx, ycf, fx + w0, ycf, 0.3 * s * sp * 1.05, { 'stroke-linecap': 'butt' });
        fx += w0 + 0.05 * sp;
      }
      partes.fn = N.group(partes.frac, 'fn'); partes.fs = N.group(partes.frac, 'fs'); partes.fd = N.group(partes.frac, 'fd');
      partes.oN = { x: fx, y: ycf, s };
      cifra(partes.fn, spec.n, fx, ycf, sp, s); fx += anchoCifra(spec.n, s) * sp;
      glyph(partes.fs, 'timeSigFractionalSlash', fx - 0.08 * sp, ycf, sp, s); fx += adv('timeSigFractionalSlash', s) * 0.8 * sp;
      const fx0 = x0 + (wb + 0.08) * sp;
      partes.oD = { x: fx - 0.04 * sp, y: ycf, s };
      cifra(partes.fd, spec.d, fx - 0.04 * sp, ycf, sp, s);
      const fx1 = fx - 0.04 * sp + anchoCifra(spec.d, s) * sp;
      partes.den = N.group(g, 'den');
      cifra(partes.den, spec.den, x + (w - wd) / 2 * sp, yDen, sp);
      partes.oBase = { x: x0, y: yNum }; partes.oDen = { x: x + (w - wd) / 2 * sp, y: yDen };
      partes.cajaFrac = { x: fx0, y: ycf - s * sp, w: fx1 - fx0, h: 2 * s * sp };
      return { g, w: w * sp, partes, caja: { x, y: yMid - 2 * sp, w: w * sp, h: 4 * sp } };
    }
    if (spec.tipo === 'interrogante') {
      const t = el('text', { x: x + 1.05 * sp, y: yMid + 1.55 * sp, 'text-anchor': 'middle',
        'font-family': 'var(--fuente-texto)', 'font-weight': 800, 'font-size': 4.6 * sp, fill: 'currentColor',
        style: 'font-family:"Helvetica Neue",Helvetica,"TeX Gyre Heros",Arial,sans-serif' }, g);
      t.textContent = '?';
      partes.q = t;
      return { g, w: 2.1 * sp, partes };
    }
    throw new Error('compás desconocido ' + JSON.stringify(spec));
  }
  N.compas = compas;
  /** Ancho (px) que ocupará una indicación de compás, sin dibujarla. */
  N.anchoCompas = function (spec, sp) {
    const tmp = el('g'); const r = compas(tmp, spec, 0, 0, sp || N.SP); return r.w;
  };

  // ================================================================ NOTAS (ritmo sin pentagrama, estilo del PDF)
  const DUR = { h: 8, q: 4, '8': 2, '16': 1, '32': 0.5 };     // en semicorcheas
  const FLAG_UP = { '8': 'flag8thUp', '16': 'flag16thUp', '32': 'flag32ndUp' };
  const FLAG_DN = { '8': 'flag8thDown', '16': 'flag16thDown', '32': 'flag32ndDown' };
  const NBEAMS = { '8': 1, '16': 2, '32': 3 };
  N.DUR = DUR;

  /**
   * Ritmo al estilo de los ejemplos del PDF: sin líneas de pentagrama, cabezas a la altura
   * de la 2.ª línea (1 sp por debajo del centro), plicas hacia arriba.
   * items: {n:'q'|'h'|'8'|'16'|'32', punto?, barra?:'grupo'}  ·  {div:'discontinua'|'simple'|'doble'}  ·  {hueco:sp}
   * opt: {sp, espacio:{q,h,8,16,32}, grupoEsp, altoNota}
   * Devuelve {g, w, els:[{tipo, g, x, …}]}
   */
  function ritmo(parent, items, x, yMid, opt) {
    opt = opt || {}; const sp = opt.sp || N.SP;
    const ESP = Object.assign({ h: 6.2, q: 4.6, '8': 3.6, '16': 3.0, '32': 2.8, dot: 0.9 }, opt.espacio || {});
    const GR = opt.grupoEsp || 2.05;                    // separación dentro de un grupo con barra
    const yN = yMid + (opt.altoNota != null ? opt.altoNota : 1.0) * sp;   // altura de las cabezas
    const g = N.group(parent, 'ritmo');
    const els = [];
    let cx = x;
    // 1) colocar
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.hueco != null) { cx += it.hueco * sp; continue; }
      if (it.div) {
        const pre = it.pre != null ? it.pre : 1.6, post = it.post != null ? it.post : 1.9;
        cx += pre * sp;
        const e = { tipo: 'div', clase: it.div, x: cx, g: N.group(g, 'div ' + it.div), it };
        els.push(e);
        cx += (it.div === 'doble' ? (E.barSep + 2 * E.thinBar) * sp : 0) + post * sp;
        continue;
      }
      const e = { tipo: 'nota', it, x: cx, y: yN, dur: it.n, g: N.group(g, 'nota') };
      els.push(e);
      const nxt = items[i + 1];
      const mismoGrupo = it.barra && nxt && nxt.barra === it.barra;
      cx += (mismoGrupo ? GR : (ESP[it.n] + (it.punto ? ESP.dot : 0))) * sp;
    }
    // 2) plicas, barras y corchetes
    const notas = els.filter(e => e.tipo === 'nota');
    const grupos = {};
    for (const e of notas) if (e.it.barra) (grupos[e.it.barra] = grupos[e.it.barra] || []).push(e);
    for (const e of notas) {
      const n = e.it.n;
      const cabeza = n === 'h' ? 'noteheadHalf' : 'noteheadBlack';
      e.cabeza = glyph(e.g, cabeza, e.x, e.y, sp);
      const largo = (n === '32' ? 4.1 : 3.5);
      e.plicaX = e.x + (1.18 - E.stem / 2) * sp;
      e.yPlicaBase = e.y - 0.168 * sp;
      e.yPlicaTop = e.y - largo * sp;
      if (e.it.punto) e.punto = glyph(e.g, 'augmentationDot', e.x + (1.18 + 0.32) * sp, e.y - 0.0 * sp, sp);
    }
    for (const k in grupos) {
      const gr = grupos[k];
      const maxB = Math.max(...gr.map(e => NBEAMS[e.it.n] || 1));
      const yTop = Math.min(...gr.map(e => e.yPlicaTop)) - (maxB >= 3 ? 0.3 : 0) * sp;
      const x1 = gr[0].plicaX - E.stem / 2 * sp, x2 = gr[gr.length - 1].plicaX + E.stem / 2 * sp;
      const gb = N.group(g, 'barras');
      for (let b = 0; b < maxB; b++) {
        const y = yTop + b * (E.beam + E.beamGap) * sp;
        el('rect', { x: +x1.toFixed(2), y: +y.toFixed(2), width: +(x2 - x1).toFixed(2), height: +(E.beam * sp).toFixed(2), fill: 'currentColor' }, gb);
      }
      gr.forEach(e => { e.yPlicaTop = yTop; e.barras = gb; });
    }
    for (const e of notas) {
      const n = e.it.n;
      if (n === 'h' || n === 'q' || e.it.barra || FLAG_UP[n]) {
        e.plica = line(e.g, e.plicaX, e.yPlicaBase, e.plicaX, e.yPlicaTop, E.stem * sp);
      }
      if (!e.it.barra && FLAG_UP[n]) {
        const f = FLAG_UP[n]; const an = M[f].an.stemUpNW;
        e.corchete = glyph(e.g, f, e.plicaX - E.stem / 2 * sp - an[0] * sp, e.yPlicaTop + an[1] * sp, sp);
      }
    }
    // 3) divisorias
    const yA = yMid - 2 * sp, yB = yMid + 2 * sp;
    for (const e of els.filter(e => e.tipo === 'div')) {
      if (e.clase === 'discontinua') {
        const d = (e.it.guion || 0.62) * sp, h = (e.it.hueco || 0.5) * sp;
        e.linea = line(e.g, e.x, yA - 0.1 * sp, e.x, yB + 0.4 * sp, E.dash * sp * 1.25, { 'stroke-dasharray': `${d.toFixed(1)} ${h.toFixed(1)}` });
      } else if (e.clase === 'simple') {
        e.linea = line(e.g, e.x, yA, e.x, yB, E.thinBar * sp);
      } else if (e.clase === 'doble') {
        line(e.g, e.x, yA, e.x, yB, E.thinBar * sp);
        line(e.g, e.x + (E.barSep + E.thinBar) * sp, yA, e.x + (E.barSep + E.thinBar) * sp, yB, E.thinBar * sp);
      }
    }
    return { g, w: cx - x, els, notas, yN };
  }
  N.ritmo = ritmo;

  // ================================================================ PENTAGRAMA CON ALTURAS
  /** Pentagrama de 5 líneas; devuelve {g, lineas}. */
  function pentagrama(parent, x, yMid, ancho, sp) {
    sp = sp || N.SP;
    const g = N.group(parent, 'pentagrama');
    const lineas = [];
    for (let k = -2; k <= 2; k++) lineas.push(line(g, x, yMid + k * sp, x + ancho, yMid + k * sp, E.staffLine * sp));
    return { g, lineas };
  }
  N.pentagrama = pentagrama;
  N.claveSol = (parent, x, yMid, sp) => glyph(parent, 'gClef', x, yMid + (sp || N.SP), sp || N.SP);

  /** Armadura de bemoles en clave de sol (si, mi, la, re, sol, do, fa). Devuelve {g, w}. */
  N.armadura = function (parent, x, yMid, sp, bemoles) {
    sp = sp || N.SP;
    const g = N.group(parent, 'armadura');
    const POS = [0, 1.5, -0.5, 1, -1, 0.5, -1.5];
    let cx = x;
    for (let i = 0; i < (bemoles || 0); i++) {
      glyph(g, 'accidentalFlat', cx, yMid - POS[i] * sp, sp);
      cx += (adv('accidentalFlat') + 0.14) * sp;
    }
    return { g, w: cx - x };
  };

  // posición (en sp desde la línea central, + hacia arriba) de una nota en clave de sol
  const LETRAS = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  N.posSol = function (nota) {      // 'D4', 'Bb4', 'F#4'… (la alteración no cambia la posición)
    const m = /^([A-G])([#b]?)(\d)$/.exec(nota);
    const paso = LETRAS[m[1]] + 7 * (+m[3]);
    const B4 = LETRAS.B + 7 * 4;
    return (paso - B4) / 2;
  };

  /**
   * Melodía en pentagrama (clave de sol). notas: [{p:'D5', n:'8', barra:'g1'}…]
   * Espaciado de grabado (no proporcional): esp por figura en sp.
   * Devuelve {g, w, notas:[{x, y, pos, t0, t1, g…}]}.
   */
  function melodia(parent, notas, x, yMid, opt) {
    opt = opt || {}; const sp = opt.sp || N.SP;
    const ESP = Object.assign({ q: 4.4, '8': 3.0, '16': 3.0, h: 6 }, opt.espacio || {});
    const g = N.group(parent, 'melodia');
    const out = [];
    let cx = x, t = 0;
    for (const it of notas) {
      const pos = N.posSol(it.p);
      const e = { it, pos, x: cx, y: yMid - pos * sp, t0: t, t1: t + DUR[it.n], g: N.group(g, 'nota') };
      out.push(e);
      t += DUR[it.n]; cx += ESP[it.n] * sp;
    }
    // direcciones de plica
    const grupos = {};
    for (const e of out) if (e.it.barra) (grupos[e.it.barra] = grupos[e.it.barra] || []).push(e);
    for (const e of out) if (!e.it.barra) e.arriba = e.pos < 0;
    for (const k in grupos) {
      const gr = grupos[k];
      const lejos = gr.reduce((a, e) => Math.abs(e.pos) > Math.abs(a.pos) ? e : a, gr[0]);
      const arriba = lejos.pos < 0;
      gr.forEach(e => e.arriba = arriba);
    }
    // cabezas, líneas adicionales
    for (const e of out) {
      e.cabeza = glyph(e.g, e.it.n === 'h' ? 'noteheadHalf' : 'noteheadBlack', e.x, e.y, sp);
      for (let lp = -3; lp >= e.pos - 1e-6; lp -= 1) line(e.g, e.x - E.ledgerExt * sp, yMid - lp * sp, e.x + (1.18 + E.ledgerExt) * sp, yMid - lp * sp, E.ledger * sp);
      for (let lp = 3; lp <= e.pos + 1e-6; lp += 1) line(e.g, e.x - E.ledgerExt * sp, yMid - lp * sp, e.x + (1.18 + E.ledgerExt) * sp, yMid - lp * sp, E.ledger * sp);
      e.plicaX = e.arriba ? e.x + (1.18 - E.stem / 2) * sp : e.x + E.stem / 2 * sp;
      e.yBase = e.arriba ? e.y - 0.168 * sp : e.y + 0.168 * sp;
      // plica de 3,5 sp; si la nota está muy lejos del centro, la plica llega a la línea central
      let largo = 3.5;
      if (e.arriba && e.pos < -3.5) largo = Math.max(3.5, -e.pos);
      if (!e.arriba && e.pos > 3.5) largo = Math.max(3.5, e.pos);
      e.yPunta = e.arriba ? e.y - largo * sp : e.y + largo * sp;
    }
    // barras (inclinación moderada según el dibujo melódico)
    for (const k in grupos) {
      const gr = grupos[k];
      const arriba = gr[0].arriba;
      const nb = Math.max(...gr.map(e => NBEAMS[e.it.n] || 1));
      const dx = gr[gr.length - 1].plicaX - gr[0].plicaX;
      const dpos = gr[gr.length - 1].pos - gr[0].pos;
      const incl = Math.sign(dpos) * Math.min(Math.abs(dpos) * 0.5, 1.0) * sp;   // subida total en px (hacia arriba = +)
      const pend = dx > 0 ? -incl / dx : 0;                                        // en coordenadas SVG
      // colocar la barra para que la plica más corta mida 3,5 sp (3,25 con 2 barras o más)
      const minLargo = (nb >= 2 ? 3.25 : 3.5) * sp;
      let c = arriba ? Infinity : -Infinity;                // y de la barra en x = plicaX del primero
      for (const e of gr) {
        const yb = e.y + (arriba ? -minLargo : minLargo) - pend * (e.plicaX - gr[0].plicaX);
        c = arriba ? Math.min(c, yb) : Math.max(c, yb);
      }
      const yAt = xx => c + pend * (xx - gr[0].plicaX);
      const gb = N.group(g, 'barras');
      const x1 = gr[0].plicaX - E.stem / 2 * sp, x2 = gr[gr.length - 1].plicaX + E.stem / 2 * sp;
      for (let b = 0; b < nb; b++) {
        const off = b * (E.beam + E.beamGap) * sp * (arriba ? 1 : -1);
        const y1 = yAt(x1) + off, y2 = yAt(x2) + off;
        const h = E.beam * sp * (arriba ? 1 : -1);
        el('polygon', { points: `${x1.toFixed(2)},${y1.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)} ${x2.toFixed(2)},${(y2 + h).toFixed(2)} ${x1.toFixed(2)},${(y1 + h).toFixed(2)}`, fill: 'currentColor' }, gb);
      }
      gr.forEach(e => { e.yPunta = yAt(e.plicaX); e.barras = gb; });
    }
    for (const e of out) {
      e.plica = line(e.g, e.plicaX, e.yBase, e.plicaX, e.yPunta, E.stem * sp);
      const n = e.it.n;
      if (!e.it.barra && FLAG_UP[n]) {
        if (e.arriba) {
          const f = FLAG_UP[n], an = M[f].an.stemUpNW;
          e.corchete = glyph(e.g, f, e.plicaX - E.stem / 2 * sp - an[0] * sp, e.yPunta + an[1] * sp, sp);
        } else {
          const f = FLAG_DN[n], an = M[f].an.stemDownSW;
          e.corchete = glyph(e.g, f, e.plicaX - E.stem / 2 * sp - an[0] * sp, e.yPunta + an[1] * sp, sp);
        }
      }
    }
    return { g, w: cx - x, notas: out, dur: t };
  }
  N.melodia = melodia;

  // ================================================================ figura suelta (para textos: «½ de ♩ = ♪»)
  /** Figura aislada (negra, corchea…) como glifo único SMuFL, para usar dentro de frases. */
  N.figura = function (parent, n, x, yBase, sp, s) {
    const map = { h: 'noteHalfUp', q: 'noteQuarterUp', '8': 'note8thUp', '16': 'note16thUp' };
    return glyph(parent, map[n], x, yBase, sp, s || 1);
  };
  N.anchoFigura = (n, s) => adv({ h: 'noteHalfUp', q: 'noteQuarterUp', '8': 'note8thUp', '16': 'note16thUp' }[n], s);

  /** Contornos de algunos glifos de Bravura en espacios de pentagrama (origen del glifo, y hacia abajo). */
  N.CONTORNO = {"noteheadHalf": "M0.388 0.5C1.048 0.5 1.18 -0.036 1.18 -0.168C1.18 -0.372 1.016 -0.5 0.784 -0.5C0.188 -0.5 0 -0.04 0 0.168C0 0.38 0.168 0.5 0.388 0.5ZM0.3 0.348C0.216 0.348 0.168 0.304 0.14 0.256C0.128 0.232 0.116 0.204 0.116 0.176C0.116 -0.02 0.696 -0.336 0.884 -0.336C0.96 -0.336 1.004 -0.3 1.032 -0.252C1.044 -0.228 1.056 -0.204 1.056 -0.176C1.056 -0.004 0.492 0.348 0.3 0.348Z", "flag16thUp": "M1.088 3.184C1.104 3.164 1.116 2.936 1.116 2.744V2.656C1.116 2.488 1.072 2.324 1 2.176C1 2.164 0.996 2.156 0.996 2.14C0.996 2.132 0.996 2.124 1 2.112C1.012 2.088 1.1 1.848 1.1 1.604C1.1 1.552 1.096 1.508 1.088 1.46C1.048 1.188 0.944 1.076 0.656 0.764C0.44 0.532 0.216 0.468 0.148 0.044C0.14 0 0.092 -0.008 0.068 -0.008C0.044 -0.008 0 0.004 0 0.032V1.584H0.02C0.268 1.592 0.552 1.6 0.828 2.16C0.92 2.352 0.956 2.548 0.956 2.756C0.956 2.872 0.944 2.992 0.924 3.112C0.92 3.128 0.92 3.136 0.92 3.148C0.92 3.2 0.952 3.252 1.008 3.252C1.036 3.252 1.064 3.236 1.088 3.184ZM0.836 1.836C0.772 1.736 0.704 1.656 0.62 1.56C0.432 1.344 0.248 1.248 0.164 0.92C0.16 0.916 0.16 0.912 0.16 0.908C0.16 0.892 0.184 0.868 0.216 0.868H0.248C0.492 0.868 0.708 1.092 0.84 1.288C0.912 1.392 0.948 1.516 0.948 1.644C0.948 1.672 0.948 1.696 0.944 1.724C0.936 1.756 0.936 1.796 0.916 1.828C0.912 1.84 0.884 1.852 0.864 1.852C0.852 1.852 0.844 1.848 0.836 1.836Z"};

  window.NOTA = N;
})();
