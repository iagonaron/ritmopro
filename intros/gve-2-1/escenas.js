/* =====================================================================
   ESCENAS · Ritmo 2.º GP · Carta 2.1 · 3 contra 2 (GVE en varios pulsos)
   Misma receta que las intros de Teoría PRO: todo es función del tiempo t
   del máster de audio (frases y palabras de la voz de Iago).
   Resaltado en VERDE (en ritmo; en teoría era rosa).
   Grafía PROPORCIONAL: en el modelo y en el borrador 1 pulso mide lo mismo,
   así las líneas del borrador suben al modelo en su sitio exacto.
   ===================================================================== */
(function () {
  'use strict';
  const N = window.NOTA, D = window.DIB, C = D.C;
  const { ramp, ease, eo, lerp, win, clamp, mezcla, texto, panel, chip, tick, aspa, pos, opa, color } = D;
  const SP = N.SP = 26;
  const W = 1920, H = 1080, CX = 960;
  const VERDE = '#4ade80', VERDE_OSC = '#16a34a', ROJO = '#f87171', BLANCO = C.blanco, SUAVE = C.suave;
  const DAT = window.DATOS_INTRO || { demos: [], pulso: 60 / 72 };
  const P = DAT.pulso;

  let T = null;
  const esc = [];
  const F0 = id => T.frase[id] ? T.frase[id].t0 : (T.bloque[id] ? T.bloque[id].t0 : 0);
  const F1 = id => T.frase[id] ? T.frase[id].t1 : (T.bloque[id] ? T.bloque[id].t1 : 0);
  const limpia = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:…«»"()]/g, '');
  function Wd(id, pal, n) {
    const f = T.frase[id]; if (!f) return 0;
    const p = limpia(pal); let k = 0;
    for (const [w, t] of f.palabras) { const lw = limpia(w); if (p.length <= 3 ? lw === p : lw.startsWith(p)) { k++; if (k === (n || 1)) return t; } }
    console.warn('palabra no encontrada', id, pal); return f.t0;
  }

  // (5-nov, Iago) CÓDIGO DE COLOR: el VERDE es solo del PULSO (líneas, «pulsos»); la FIGURA es BLANCA y se ilumina con brillo blanco
  function brillo(el, k) {
    el.style.filter = k > 0.02 ? `drop-shadow(0 0 ${(3 + 10 * k).toFixed(1)}px rgba(255,255,255,${(0.8 * k).toFixed(2)})) drop-shadow(0 0 ${(1.5 + 3 * k).toFixed(1)}px rgba(255,255,255,${Math.min(1, k).toFixed(2)}))` : '';
    el.style.color = k > 0.02 ? '#ffffff' : '';
  }
  const brilloNota = (n, k) => { brillo(n.cab, k); brillo(n.plica, k); };

  // (5-nov, Iago) «cambia de nombre cada X notas porque hay X pulsos»: el numerador del compás (los pulsos) se enciende en verde
  function enciendeNumerador(s, cps, t0, t1) {
    s.on(t => { const k = win(t, t0, t1, .2, .5); cps.forEach(cp => { if (!cp.num) return;
      cp.num.style.color = k > 0.02 ? mezcla(BLANCO, VERDE, k) : '';
      cp.num.style.filter = k > 0.02 ? `drop-shadow(0 0 ${(4 + 8 * k).toFixed(1)}px ${VERDE})` : ''; }); });
  }
  const demo = tipo => (DAT.demos.find(d => d.tipo === tipo) || { t0: -999 }).t0;

  function escena(nombre, a, b, build) {
    const g = N.group(document.getElementById('capaEscenas'), 'escena ' + nombre);
    const s = { nombre, a, b, g, tracks: [] };
    s.on = fn => s.tracks.push(fn);
    build(s, g);
    esc.push(s);
    return s;
  }
  function aparece(s, g, ta, tb, o) {
    o = o || {};
    const dy = o.dy != null ? o.dy : 14, fi = o.fi || .45, fo = o.fo || .45;
    s.on(t => { const v = win(t, ta, tb == null ? 1e9 : tb, fi, fo); opa(g, v); if (v > 0) pos(g, o.x || 0, (o.y || 0) + (1 - eo(ramp(t, ta, ta + fi))) * dy); });
  }
  const mostrarEn = (s, g, ta, tb, fi, fo) => s.on(t => opa(g, win(t, ta, tb == null ? 1e9 : tb, fi || .35, fo || .35)));

  // ================================================================ GRAFÍA PROPORCIONAL
  const POS = { C4: -3, D4: -2.5, E4: -2, F4: -1.5, G4: -1, A4: -0.5, B4: 0 };
  /**
   * Compás en pentagrama con tiempo proporcional. o = {x, yMid, ts:'2/4', pulsos, PW (px por pulso), ancho}
   * Devuelve un objeto con g, xt(t) (centro de cabeza en el instante t, en pulsos) y utilidades para notas.
   */
  function compasProp(parent, o) {
    const g = N.group(parent, 'compasProp');
    const yMid = o.yMid, x0 = o.x;
    const staff = N.group(g, 'pentagrama');
    const clave = N.group(g, 'clave'); N.claveSol(clave, x0 + 0.6 * SP, yMid, SP);
    const cif = N.group(g, 'cifra');
    const [nu, de] = o.ts.split('/');
    const r = N.compas(cif, { tipo: 'simple', num: nu, den: de }, x0 + 4.0 * SP, yMid, SP);
    const xs = x0 + 4.0 * SP + r.w + 3.8 * SP;          // aire tras la cifra de compás
    const PW = o.PW;
    const xt = t => xs + t * PW;
    const barra = N.group(g, 'barra');
    // (5-nov, Iago) el mismo aire antes de la primera figura que después de la última: el grupo queda centrado en su compás
    const xb = o.ultimo != null ? xt(o.ultimo) + 3.8 * SP : xt(o.pulsos) - 0.15 * PW;
    N.line(barra, xb, yMid - 2 * SP, xb, yMid + 2 * SP, N.E.thinBar * SP);
    N.line(barra, xb + 0.55 * SP, yMid - 2 * SP, xb + 0.55 * SP, yMid + 2 * SP, 0.5 * SP);
    const ancho = xb + 0.8 * SP - x0;            // el pentagrama acaba justo en la doble barra
    N.pentagrama(staff, x0, yMid, ancho, SP);
    return { g, staff, clave, cif, num: r.partes && r.partes.num, barra, yMid, xs, PW, xt, x0, ancho, xb, ult: o.ultimo != null ? o.ultimo : o.pulsos, pulsos: o.pulsos };
  }
  /** Nota en un compás proporcional (plica arriba). n: 'q' | '8' (sin corchete: va con barra). */
  function nota(parent, cp, t, p, n, o) {
    o = o || {};
    const g = N.group(parent, 'nota');
    const ps = POS[p], y = cp.yMid - ps * SP, cx = cp.xt(t), xh = cx - 0.59 * SP;
    const cab = N.group(g, 'cabeza');
    N.glyph(cab, n === 'h' ? 'noteheadHalf' : 'noteheadBlack', xh, y, SP);
    for (let lp = -3; lp >= ps - 1e-6; lp -= 1) N.line(cab, xh - 0.4 * SP, cp.yMid - lp * SP, xh + 1.58 * SP, cp.yMid - lp * SP, N.E.ledger * SP);
    const plicaX = xh + (1.18 - N.E.stem / 2) * SP;
    const plica = N.group(g, 'plica');
    const top = o.top != null ? o.top : y - 3.5 * SP;
    N.line(plica, plicaX, y - 0.168 * SP, plicaX, top, N.E.stem * SP);
    return { g, cab, plica, x: cx, y, xh, plicaX, top };
  }
  /** Barra (corchea) entre plicas. */
  function barraNotas(parent, n1, n2, yTop) {
    return N.el('rect', { x: (n1.plicaX - N.E.stem / 2 * SP).toFixed(1), y: yTop.toFixed(1), width: (n2.plicaX - n1.plicaX + N.E.stem * SP).toFixed(1),
      height: (N.E.beam * SP).toFixed(1), fill: 'currentColor' }, parent);
  }
  /** Número de grupo (3, 5, 7…) y corchete opcional. */
  function numGrupo(parent, x1, x2, y, num, corchete) {
    const g = N.group(parent, 'tuplet');
    const xm = (x1 + x2) / 2;
    const t = texto(g, String(num), xm, y + 9, { anchor: 'middle', size: 30, peso: 700, italic: true, familia: 'Georgia, "Times New Roman", serif' });
    if (corchete) {
      const hw = 16;
      N.el('path', { d: `M${x1.toFixed(1)},${(y + 10).toFixed(1)} V${(y - 2).toFixed(1)} H${(xm - hw).toFixed(1)} M${(xm + hw).toFixed(1)},${(y - 2).toFixed(1)} H${x2.toFixed(1)} V${(y + 10).toFixed(1)}`,
        fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4 }, g);
    }
    return g;
  }
  /** Ligadura bajo las cabezas (plicas arriba). */
  function ligadura(parent, a, b) {
    const x1 = a.x + 0.25 * SP, x2 = b.x - 0.25 * SP, y = a.y + 0.75 * SP, dy = Math.min(1.1, 0.35 + (x2 - x1) / (8 * SP)) * SP;
    const xm = (x1 + x2) / 2;
    return N.el('path', { d: `M${x1.toFixed(1)},${y.toFixed(1)} Q${xm.toFixed(1)},${(y + dy * 1.25).toFixed(1)} ${x2.toFixed(1)},${y.toFixed(1)} Q${xm.toFixed(1)},${(y + dy * 1.25 - 5).toFixed(1)} ${x1.toFixed(1)},${y.toFixed(1)} Z`,
      fill: 'currentColor', stroke: 'currentColor', 'stroke-width': 1.2 }, parent);
  }
  /** Línea de pulso (marca verde bajo el pentagrama, como en los apuntes). */
  function lineaPulso(parent, cp, t, o) {
    o = o || {};
    const x = cp.xt(t), y1 = cp.yMid + (o.y1 != null ? o.y1 : 4.1) * SP, y2 = cp.yMid + (o.y2 != null ? o.y2 : 5.5) * SP;
    const g = N.group(parent, 'lineaPulso');
    N.line(g, x, y1, x, y2, o.w || 7, { 'stroke-linecap': 'round' });
    g.style.color = o.color || VERDE;
    return g;
  }

  // grupos ya dibujados de un GVE «de libro» (para las miniaturas): n notas iguales en m pulsos, en B4
  function miniGVE(parent, x, yMid, ts, n, m, fig, PW) {
    const cp = compasProp(parent, { x, yMid, ts, pulsos: m, PW, ultimo: (n - 1) * m / n });
    const ancho = cp.ancho;
    const ns = [];
    for (let i = 0; i < n; i++) ns.push(nota(cp.g, cp, i * m / n, 'B4', fig));
    if (fig === '8') { const top = ns[0].top; barraNotas(cp.g, ns[0], ns[n - 1], top); numGrupo(cp.g, ns[0].plicaX, ns[n - 1].plicaX, top - 30, n, false); }
    else numGrupo(cp.g, ns[0].xh, ns[n - 1].xh + 1.18 * SP, ns[0].top - 30, n, true);
    return { cp, ns, ancho };
  }

  /**
   * Cabezal de reproducción: una línea luminosa recorre el compás de izquierda a derecha al pulso real
   * (2 pulsos por vuelta) y hace destellar cada línea de pulso y cada figura justo cuando pasa por ella.
   * eventos: [{t (en pulsos), el}]. tRef: instante en que el cabezal está en el inicio del compás.
   */
  function cabezal(s, parent, cp, tA, tB, tRef, eventos, o) {
    o = o || {};
    const g = N.group(parent, 'cabezal');
    const svg = document.getElementById('lienzo');
    if (!document.getElementById('gvvEstela')) {
      const defs = N.el('defs', null, svg); const lg = N.el('linearGradient', { id: 'gvvEstela', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
      N.el('stop', { offset: 0, 'stop-color': VERDE, 'stop-opacity': 0 }, lg); N.el('stop', { offset: 1, 'stop-color': VERDE, 'stop-opacity': 0.28 }, lg);
    }
    const y1 = cp.yMid - 3.0 * SP, y2 = cp.yMid + (o.abajo || 5.9) * SP;
    const estela = N.el('rect', { x: 0, y: y1, width: 90, height: y2 - y1, fill: 'url(#gvvEstela)' }, g);
    const linea = N.line(g, 0, y1, 0, y2, 3.2, { 'stroke-linecap': 'round' });
    linea.style.color = '#d9fbe5'; g.style.filter = `drop-shadow(0 0 8px ${VERDE})`;
    const vuelta = o.vuelta || 2;
    s.on(t => {
      const on = win(t, tA, tB, .4, .4); opa(g, on);
      const parado = o.para != null && t >= o.para;     // (5-nov, Iago) al acabar sus vueltas se queda en la doble barra: no asoma otra
      const ph = parado ? vuelta - 1e-4 : ((((t - tRef) / P) % vuelta) + vuelta) % vuelta;
      // proporcional hasta la última figura; el resto de la vuelta llega justo a la doble barra
      const x = ph <= cp.ult ? cp.xt(ph) : cp.xt(cp.ult) + (ph - cp.ult) / (vuelta - cp.ult) * (cp.xb - 8 - cp.xt(cp.ult));
      linea.setAttribute('x1', x.toFixed(1)); linea.setAttribute('x2', x.toFixed(1));
      const ex = Math.max(cp.xt(0) - 10, x - 90);
      estela.setAttribute('x', ex.toFixed(1)); estela.setAttribute('width', Math.max(0, x - ex).toFixed(1));
      for (const ev of eventos) {
        let d = ph - ev.t; if (d < 0) d += vuelta;
        const f = (!parado && t >= tA && t <= tB && d < 0.32) ? 1 - d / 0.32 : 0;
        const cc = ev.blanco ? 'rgba(255,255,255,.95)' : VERDE; ev.el.style.filter = f > 0.02 ? `drop-shadow(0 0 ${(4 + 12 * f).toFixed(1)}px ${cc}) drop-shadow(0 0 ${(2 + 6 * f).toFixed(1)}px ${cc})` : '';
      }
    });
    return g;
  }
  // indicador de pulso (siempre que algo suena): un punto que late en cada pulso
  function latidos(s, parent, x, y, t0, n, o) {
    o = o || {};
    const g = N.group(parent, 'latidos');
    const c = N.el('circle', { cx: x, cy: y, r: 13, fill: VERDE }, g);
    const tx = texto(g, 'PULSO', x + 26, y + 8, { size: 22, peso: 800, ls: '0.16em', fill: SUAVE });
    s.on(t => {
      const on = t >= t0 - 0.2 && t <= t0 + n * P + 0.2;
      opa(g, on ? 1 : 0);
      if (!on) return;
      let k = 0;
      for (let i = 0; i < n; i++) { const d = t - (t0 + i * P); if (d >= 0 && d < 0.3) k = 1 - d / 0.3; }
      c.setAttribute('r', (11 + 7 * k).toFixed(1)); c.setAttribute('fill', k > 0 ? VERDE : '#1f4d33');
    });
    return g;
  }

  // ================================================================ 0 · TÍTULO
  function tituloGrande(g) {
    texto(g, 'GRADO PROFESIONAL  ·  RITMO  ·  CARTA 2.1', CX, 392, { anchor: 'middle', size: 26, peso: 800, ls: '0.3em', fill: VERDE });
    texto(g, [['3 CONTRA ', BLANCO], ['2', VERDE]], CX, 528, { anchor: 'middle', size: 112, peso: 800, ls: '0.05em' });   // (5-nov) el pulso, en verde
    N.el('rect', { x: CX - 60, y: 566, width: 120, height: 5, rx: 2.5, fill: VERDE }, g);
    texto(g, 'Grupos de valoración especial en varios pulsos', CX, 640, { anchor: 'middle', size: 38, peso: 400, fill: '#cbd5e1' });
  }
  function escenaTitulo() {
    const b = F1('TITULO');
    escena('titulo', -1, b, (s, g) => { const gg = N.group(g); tituloGrande(gg); s.on(t => opa(gg, 1 - ease(ramp(t, b - 1.2, b)))); });
  }

  // ================================================================ A1 · grupos en varios pulsos (intro genérica)
  function escenaVarios() {
    const a = F0('A1'), b = F1('A1') + 0.2;
    escena('varios', a, b, (s, g) => {
      const fondo = N.group(g); panel(fondo, 150, 170, 1620, 740);
      mostrarEn(s, fondo, a, b, .5, .45);
      const titulo = texto(g, 'GRUPOS EN VARIOS PULSOS', CX, 250, { anchor: 'middle', size: 44, peso: 800, ls: '0.08em', fill: BLANCO });
      aparece(s, titulo, Wd('A1', 'grupos'), b);
      const ej = [
        { ts: '2/4', n: 3, m: 2, fig: 'q', x: 262, y: 420, et: '3 contra 2' },
        { ts: '2/4', n: 5, m: 2, fig: '8', x: 1048, y: 420, et: '5 contra 2' },
        { ts: '3/4', n: 4, m: 3, fig: 'q', x: 246, y: 700, et: '4 contra 3' },
        { ts: '3/4', n: 7, m: 3, fig: '8', x: 1037, y: 700, et: '7 contra 3' },
      ];
      const tg = Wd('A1', 'grupos'), tv = Wd('A1', 'varios');
      const tS = Wd('A1', 'sencillos'), tC = Wd('A1', 'complejos');
      ej.forEach((e, i) => {
        const gg = N.group(g);
        const r = miniGVE(gg, e.x, e.y, e.ts, e.n, e.m, e.fig, e.m === 2 ? 175 : 118);
        const et = texto(gg, e.et, e.x + 4, e.y + 112, { size: 26, peso: 700, ls: '0.06em', fill: SUAVE });
        const ta = lerp(tg + 0.3, tv + 0.4, i / 3);
        aparece(s, gg, ta, b, { dy: 16 });
        s.on(t => {
          const sel = i === 0 ? win(t, tS - 0.2, tC - 0.2, .3, .3) : (i === 3 ? win(t, tC - 0.1, b, .3, .3) : 0);
          const apaga = (t > tS - 0.2) ? 1 - sel : 0;
          brillo(gg, sel);
          et.setAttribute('fill', sel > .5 ? VERDE : SUAVE);
          gg.setAttribute('opacity', (win(t, ta, b, .45, .45) * (1 - 0.65 * apaga)).toFixed(3));
        });
      });
      const ch1 = chip(g, 'SENCILLOS', 440, 520, { size: 22, relleno: false, borde: VERDE, colorTexto: VERDE });
      const ch2 = chip(g, 'COMPLEJOS DE COORDINAR', 1200, 800, { size: 22, relleno: false, borde: VERDE, colorTexto: VERDE });
      mostrarEn(s, ch1, tS - 0.1, b); mostrarEn(s, ch2, tC - 0.1, b);
    });
  }

  // ================================================================ A2–A3 · a ojo vs exactamente
  function escenaAOjo() {
    const a = F0('A2') - 0.2, b = F1('A3') + 0.3;
    escena('aojo', a, b, (s, g) => {
      const fondo = N.group(g); panel(fondo, 260, 200, 1400, 680); mostrarEn(s, fondo, a, b, .45, .45);
      const gg = N.group(g);
      const r = miniGVE(gg, 519, 470, '2/4', 5, 2, '8', 330);
      mostrarEn(s, gg, a, b, .45, .45);
      // tres intentos «a ojo» (rojos) y luego el sitio exacto (verde)
      const intentos = [[0.12, -0.24], [-0.1, 0.22], [0.06, 0.34]];
      const tO = [Wd('A2', 'ojo'), Wd('A2', 'cada'), Wd('A2', 'distintos')];
      const tE = Wd('A3', 'exactamente');
      intentos.forEach((d, i) => {
        const gi = N.group(g);
        lineaPulso(gi, r.cp, 0 + d[0] * 0.3, { color: ROJO, w: 6 });
        lineaPulso(gi, r.cp, 1 + d[1], { color: ROJO, w: 6 });
        s.on(t => opa(gi, win(t, tO[i], tE, .25, .35) * (t > tO[Math.min(2, i + 1)] && i < 2 ? 0.45 : 1)));
      });
      const ojo = N.group(g); texto(ojo, 'A OJO', 1330, 300, { size: 40, peso: 800, ls: '0.1em', fill: ROJO }); aspa(ojo, 1550, 286, 18, 7); ojo.style.color = ROJO;
      mostrarEn(s, ojo, tO[0], tE, .3, .35);
      const ok = N.group(g);
      lineaPulso(ok, r.cp, 0); lineaPulso(ok, r.cp, 1);
      s.on(t => { opa(ok, win(t, tE, b, .4, .4)); });
      const ex = N.group(g); texto(ex, 'EXACTAMENTE', 1130, 300, { size: 40, peso: 800, ls: '0.1em', fill: VERDE }); tick(ex, 1590, 288, 18, 7); ex.style.color = VERDE;
      mostrarEn(s, ex, tE, b, .35, .4);
      // método · 5 pasos
      const tM = Wd('A3', 'metodo'), tP = Wd('A3', 'pasos'), tT = Wd('A3', 'todos');
      const met = N.group(g);
      chip(met, 'EL MÉTODO', CX, 690, { size: 26, anchor: 'middle', fondo: VERDE_OSC });
      mostrarEn(s, met, tM - 0.1, b);
      for (let i = 0; i < 5; i++) {
        const q = N.group(g);
        N.el('rect', { x: CX - 230 + i * 96, y: 735, width: 76, height: 76, rx: 12, fill: 'rgba(74,222,128,.12)', stroke: VERDE, 'stroke-width': 2.5 }, q);
        texto(q, String(i + 1), CX - 192 + i * 96, 786, { anchor: 'middle', size: 40, peso: 800, fill: VERDE });
        mostrarEn(s, q, tP - 0.2 + i * 0.12, b, .3, .4);
      }
      const cartas = N.group(g);
      ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8'].forEach((c, i) => chip(cartas, c, 432 + i * 136, 850, { size: 20, relleno: false, borde: 'rgba(255,255,255,.35)', colorTexto: C.texto }));
      mostrarEn(s, cartas, tT - 0.1, b, .35, .4);
    });
  }

  // ================================================================ A4 · precisión aquí, música después
  function escenaPrecision() {
    const a = F0('A4') - 0.1, b = F1('A4') + 0.3;
    escena('precision', a, b, (s, g) => {
      const L = N.group(g), R = N.group(g);
      panel(L, 230, 260, 680, 520); panel(R, 1010, 260, 680, 520);
      texto(L, 'AQUÍ', 570, 340, { anchor: 'middle', size: 26, peso: 800, ls: '0.24em', fill: SUAVE });
      texto(L, 'Lenguaje Musical · 2.º GP', 570, 384, { anchor: 'middle', size: 30, peso: 400, fill: '#cbd5e1' });
      texto(R, 'DESPUÉS', 1350, 340, { anchor: 'middle', size: 26, peso: 800, ls: '0.24em', fill: SUAVE });
      texto(R, 'con tu instrumento', 1350, 384, { anchor: 'middle', size: 30, peso: 400, fill: '#cbd5e1' });
      mostrarEn(s, L, a, b, .45, .45); mostrarEn(s, R, Wd('A4', 'pero') - 0.2, b, .45, .45);
      const k1 = texto(g, 'PRECISIÓN', 570, 520, { anchor: 'middle', size: 64, peso: 800, ls: '0.05em', fill: VERDE });
      const k2 = texto(g, 'EN LA EJECUCIÓN', 570, 590, { anchor: 'middle', size: 34, peso: 700, ls: '0.08em', fill: BLANCO });
      aparece(s, k1, Wd('A4', 'precision') - 0.1, b); aparece(s, k2, Wd('A4', 'ejecucion') - 0.1, b);
      const k3 = texto(g, 'ÉPOCA · ESTILO', 1350, 500, { anchor: 'middle', size: 40, peso: 700, ls: '0.06em', fill: BLANCO });
      const k4 = texto(g, 'MÚSICA', 1350, 590, { anchor: 'middle', size: 64, peso: 800, ls: '0.05em', fill: BLANCO });
      aparece(s, k3, Wd('A4', 'epoca') - 0.1, b); aparece(s, k4, Wd('A4', 'musica', 2) - 0.1, b);
      const dg = N.group(g); chip(dg, 'NO ES UN DOGMA', 1350, 700, { size: 24, anchor: 'middle', relleno: false, borde: 'rgba(255,255,255,.5)', colorTexto: C.texto });
      aparece(s, dg, Wd('A4', 'dogma') - 0.4, b);
    });
  }

  // ================================================================ A5–A6 · hoy, el más sencillo
  function escenaHoy() {
    const a = F0('A5') - 0.1, b = F1('A6') + 0.4;
    escena('hoy', a, b, (s, g) => {
      const t1 = texto(g, 'EL MÁS SENCILLO', CX, 360, { anchor: 'middle', size: 34, peso: 800, ls: '0.2em', fill: SUAVE });
      aparece(s, t1, Wd('A5', 'sencillo') - 0.3, b);
      const big = N.group(g);
      // (5-nov, Iago) código de color: PULSO en verde, FIGURA en blanco
      texto(big, '3', CX - 190, 560, { anchor: 'middle', size: 190, peso: 800, fill: BLANCO });
      texto(big, 'contra', CX, 535, { anchor: 'middle', size: 46, peso: 400, fill: '#cbd5e1' });
      texto(big, '2', CX + 190, 560, { anchor: 'middle', size: 190, peso: 800, fill: VERDE });
      texto(big, [['tres figuras', BLANCO], ['  ·  ', '#cbd5e1'], ['dos pulsos', VERDE]], CX, 650, { anchor: 'middle', size: 36, peso: 400 });
      aparece(s, big, Wd('A5', 'tres') - 0.2, b, { dy: 20 });
      const tut = N.group(g); chip(tut, 'TUTORIAL', CX, 760, { size: 28, anchor: 'middle', fondo: VERDE_OSC });
      aparece(s, tut, Wd('A6', 'tutorial') - 0.5, b);
    });
  }

  // ================================================================ B · EL MÉTODO (modelo arriba, borrador abajo)
  function escenaMetodo() {
    const a = F0('B1') - 0.3, b = F1('B8') + 0.8;
    escena('metodo', a, b, (s, g) => {
      const fondo = N.group(g); panel(fondo, 110, 130, 1700, 860); mostrarEn(s, fondo, a, b, .5, .5);
      // pasos (arriba a la derecha)
      const pasos = [['1 · MODELO', 'B1', 'B2'], ['2 · BORRADOR', 'B2', 'B4'], ['3 · CABEZAS', 'B4', 'B6'], ['4 · LÍNEAS', 'B6', 'B7'], ['5 · PROPORCIÓN', 'B7', null]];
      let x = 1785;
      for (let i = pasos.length - 1; i >= 0; i--) {
        const [nm, ia, ib] = pasos[i];
        const c = chip(g, nm, x, 82, { size: 17, anchor: 'end', relleno: false, borde: 'rgba(255,255,255,.28)', colorTexto: SUAVE });
        x -= c._w + 10;
        s.on(t => {
          const ta = F0(ia) + 0.2, tb = ib ? F0(ib) + 0.2 : b;
          const on = t >= ta && t < tb, hecho = t >= tb;
          c._rect.setAttribute('fill', on ? VERDE_OSC : 'none');
          c._rect.setAttribute('stroke', on ? VERDE_OSC : (hecho ? 'rgba(74,222,128,.55)' : 'rgba(255,255,255,.28)'));
          c._txt.setAttribute('fill', on ? '#fff' : (hecho ? VERDE : SUAVE));
          opa(c, win(t, a, b, .5, .5));
        });
      }
      const PW = 400;
      // ---------------- MODELO
      const yM = 360, yB = 700, X0 = 450, ANCHO = 1300;
      const gM = N.group(g, 'modelo');
      const cpM = compasProp(gM, { x: X0, yMid: yM, ts: '2/4', pulsos: 2, PW, ultimo: 5 / 3 });
      const etM = texto(g, 'MODELO', X0 - 26, yM + 10, { anchor: 'end', size: 26, peso: 800, ls: '0.16em', fill: SUAVE });
      const tB1 = F0('B1');
      mostrarEn(s, cpM.staff, tB1 + 0.2, b); mostrarEn(s, cpM.clave, tB1 + 0.3, b); mostrarEn(s, cpM.barra, tB1 + 0.3, b);
      mostrarEn(s, etM, Wd('B1', 'modelo') - 0.2, b);
      mostrarEn(s, cpM.cif, Wd('B1', '2') - 0.15, b);
      const notasM = ['C4', 'D4', 'E4'].map((p, i) => nota(gM, cpM, i * 2 / 3, p, 'q'));
      const topM = Math.min(...notasM.map(n => n.top));
      const tupM = numGrupo(gM, notasM[0].xh, notasM[2].xh + 1.18 * SP, topM - 34, 3, true);
      const tTres = Wd('B1', 'tresillo');
      const dM = demo('modelo'), dML = demo('modelo_lineas');
      const tDo = Wd('B1', 'do'), tRe = Wd('B1', 're'), tMi = Wd('B1', 'mi');
      notasM.forEach((n, i) => {
        mostrarEn(s, n.g, tTres - 0.3 + i * 0.12, b, .3, .5);
        s.on(t => {
          let k = win(t, [tDo, tRe, tMi][i] - 0.05, [tDo, tRe, tMi][i] + 0.55, .1, .3);
          for (const d0 of [dM, dML]) for (let c = 0; c < 2; c++) { const ta = d0 + c * 2 * P + i * 2 * P / 3; k = Math.max(k, win(t, ta - 0.02, ta + 2 * P / 3 * 0.85, .05, .12)); }
          brilloNota(n, k);
        });
      });
      mostrarEn(s, tupM, tTres - 0.2, b);
      const nomM = N.group(g);
      const ttM = ['Do', 'Re', 'Mi'].map((nm, i) => { const tt = texto(nomM, nm, notasM[i].x, yM + 5.4 * SP, { anchor: 'middle', size: 26, peso: 600, fill: SUAVE }); mostrarEn(s, tt, [tDo, tRe, tMi][i] - 0.1, Wd('B7', 'llevamos'), .25, .4); return tt; });
      // ---------------- BORRADOR
      const gB = N.group(g, 'borrador');
      const cpB = compasProp(gB, { x: X0, yMid: yB, ts: '2/4', pulsos: 2, PW, ultimo: 5 / 3 });
      const etB = texto(g, 'BORRADOR', X0 - 26, yB + 10, { anchor: 'end', size: 26, peso: 800, ls: '0.16em', fill: SUAVE });
      const tB2 = Wd('B2', 'borrador');
      mostrarEn(s, cpB.staff, tB2 - 0.2, b); mostrarEn(s, cpB.clave, tB2 - 0.1, b); mostrarEn(s, cpB.cif, tB2, b); mostrarEn(s, cpB.barra, tB2, b);
      mostrarEn(s, etB, tB2 - 0.2, b);
      const altos = ['C4', 'C4', 'D4', 'D4', 'E4', 'E4'];
      const nB = altos.map((p, i) => nota(gB, cpB, i / 3, p, '8', { top: yB + 3 * SP - 3.5 * SP - 6 }));
      const topB = nB[0].top;
      const grupos = [[0, 1, 2], [3, 4, 5]];
      const tCol = Wd('B3', 'colocaremos'), tDos = Wd('B3', 'dos'), tCab = Wd('B4', 'cabezas');
      const tNombres = [Wd('B4', 'do', 1), Wd('B4', 'do', 2), Wd('B4', 're', 1), Wd('B4', 're', 2), Wd('B4', 'mi', 1), Wd('B4', 'mi', 2)];
      const dR = demo('borrador_ritmo'), dC = demo('borrador_cabezas'), dL = demo('borrador_ligado');
      grupos.forEach((gr, j) => {
        const gg = N.group(gB, 'gve');
        gr.forEach(i => gg.appendChild(nB[i].plica));
        barraNotas(gg, nB[gr[0]], nB[gr[2]], topB);
        const num = numGrupo(gg, nB[gr[0]].plicaX, nB[gr[2]].plicaX, topB - 30, 3, false);
        mostrarEn(s, gg, tCol + 0.4 + j * 0.5, b, .35, .5);
        s.on(t => brillo(num, win(t, tDos - 0.1, tDos + 1.6, .2, .4)));
      });
      // cabezas: aparecen de dos en dos con los nombres; suenan en la demo
      nB.forEach((n, i) => {
        s.on(t => {
          opa(n.cab, ramp(t, tNombres[i] - 0.1, tNombres[i] + 0.15));
          let k = win(t, tNombres[i] - 0.1, tNombres[i] + 0.45, .1, .3);
          for (let c = 0; c < 2; c++) {
            const ta = dC + c * 2 * P + i * P / 3; k = Math.max(k, win(t, ta - 0.02, ta + P / 3 * 0.8, .04, .08));
            const tl = dL + c * 2 * P + Math.floor(i / 2) * 2 * P / 3; k = Math.max(k, win(t, tl - 0.02, tl + 2 * P / 3 * 0.85, .05, .1));
          }
          if (i === 3) k = Math.max(k, win(t, Wd('B6', 'segundo') - 0.1, F1('B6') + 2.6, .2, .3));
          brillo(n.cab, k);
        });
        // solo plica + barra antes de las cabezas: en la demo de ritmo se iluminan las plicas
        s.on(t => {
          let k = 0;
          for (let c = 0; c < 4; c++) { const ta = dR + c * P + (i % 3) * P / 3; if (Math.floor(c % 2) * 3 + 0 <= i && i < (c % 2) * 3 + 3) k = Math.max(k, win(t, ta - 0.02, ta + P / 3 * 0.7, .03, .06)); }
          brillo(n.plica, k);
        });
      });
      // nombres bajo el borrador
      const nomB = N.group(g);
      const ttB = ['Do', 'Do', 'Re', 'Re', 'Mi', 'Mi'].map((nm, i) => { const tt = texto(nomB, nm, nB[i].x, yB + 5.4 * SP, { anchor: 'middle', size: 24, peso: 600, fill: SUAVE }); mostrarEn(s, tt, tNombres[i] - 0.1, Wd('B6', 'cuatro') - 0.2, .25, .4); return tt; });
      // «Fíjate que coincide… el presupuesto»: se recorren los nombres de dos en dos (1, 2) junto a su figura del modelo,
      // y al «acaba las figuras» se ilumina el final de los dos compases: el último Mi cierra justo en la barra.
      {
        const tS = Wd('B4', 'fijate') - 0.05, tP = Wd('B4', 'presupuesto'), tA = Wd('B4', 'acaba'), tFin = Wd('B4', 'figuras') + 0.9;
        const d = (tP - tS) / 3, cuenta = N.group(g);
        ttB.forEach((tt, i) => {
          const j = Math.floor(i / 2), ti = tS + j * d + (i % 2) * d * 0.45;
          const cn = texto(cuenta, String(i % 2 + 1), nB[i].x, yB + 5.4 * SP + 34, { anchor: 'middle', size: 20, peso: 700, fill: '#ffffff' });
          mostrarEn(s, cn, ti - 0.05, tFin, .15, .35);
          s.on(t => tt.setAttribute('fill', mezcla(SUAVE, '#ffffff', win(t, ti - 0.05, tFin, .15, .35))));
        });
        ttM.forEach((tt, j) => s.on(t => tt.setAttribute('fill', mezcla(SUAVE, '#ffffff', win(t, tS + j * d - 0.05, tFin, .15, .35)))));
        s.on(t => { const k = win(t, tA - 0.15, tFin, .15, .35); brillo(cpB.barra, k); brillo(cpM.barra, k); });
      }
      enciendeNumerador(s, [cpM, cpB], Wd('B4', 'cada') + 0.15, Wd('B4', 'pulsos') + 1.2);      // al decir «cada dos notas… porque hay dos pulsos»
      // «coincide» ✓
      const tCo = Wd('B4', 'coincide');
      const co = N.group(g); co.style.color = VERDE;
      tick(co, cpB.xb - 250, yB - 150, 22, 7); texto(co, 'COINCIDE', cpB.xb - 210, yB - 138, { size: 26, peso: 800, ls: '0.12em', fill: VERDE });
      mostrarEn(s, co, tCo - 0.2, F1('B4') + 0.2, .3, .4);
      const tEnc = Wd('B4', 'encaja');
      const mal = N.group(g); texto(mal, 'si no encaja → revisa', cpB.xb - 40, yB + 150, { anchor: 'end', size: 24, peso: 400, italic: true, fill: SUAVE });
      mostrarEn(s, mal, tEnc - 0.4, F1('B4') + 0.4, .3, .4);
      // ligaduras (paso 3, «las del mismo nombre van ligadas»)
      const tLig = Wd('B5', 'ligadas');
      const ligs = N.group(gB, 'ligaduras');
      [[0, 1], [2, 3], [4, 5]].forEach(([x1, x2], j) => { const l = ligadura(ligs, nB[x1], nB[x2]); const gl = N.group(ligs); gl.appendChild(l); mostrarEn(s, gl, tLig - 0.2 + j * 0.25, b, .3, .5); });
      s.on(t => brillo(ligs, win(t, tLig - 0.2, Wd('B5', 'sola') + 0.6, .25, .4)));
      const tres = N.group(g); chip(tres, '3 NOTAS', cpB.xb, yB - 150, { size: 24, anchor: 'end', fondo: VERDE_OSC });
      mostrarEn(s, tres, Wd('B5', 'tres') - 0.2, F0('B6') - 0.1, .3, .4);
      // ---------------- PASO 4 · líneas en el borrador
      const tPri = Wd('B6', 'primera');
      const lb1 = lineaPulso(gB, cpB, 0), lb2 = lineaPulso(gB, cpB, 1);
      mostrarEn(s, lb1, tPri - 0.15, b, .3, .5); mostrarEn(s, lb2, tPri - 0.15, b, .3, .5);
      // ---------------- PASO 5 · las líneas suben al modelo
      const tProp = Wd('B7', 'llevamos');
      const sube = N.group(g);
      const ls1 = lineaPulso(sube, cpB, 0), ls2 = lineaPulso(sube, cpB, 1);
      s.on(t => {
        const k = ease(ramp(t, tProp - 0.2, tProp + 1.1));
        opa(sube, t >= tProp - 0.2 && t < b ? 1 : 0);
        pos(sube, 0, -(yB - yM) * k);
      });
      // cabezal: desde que las líneas llegan al modelo (y durante la estructura), alineado con la demo del modelo
      cabezal(s, g, cpM, dML - 0.25, dML + 4 * P + 0.4, dML,   // (5-nov) solo mientras suena el modelo resuelto (2 vueltas)
         [{ t: 0, el: ls1 }, { t: 1, el: ls2 }].concat(notasM.map((n, i) => ({ t: i * 2 / 3, el: n.g, blanco: true }))), { para: dML + 4 * P });
      // «en mitad del Re»: recuerda el motor de subdivisión (tresillos dentro de cada pulso)
      const sub = N.group(g);
      panel(sub, CX - 610, 850, 1220, 74, { rx: 14, fill: 'rgba(20,83,45,.55)', stroke: VERDE });
      texto(sub, [['Recuerda: ', VERDE], ['el motor de subdivisión son ', BLANCO], ['tresillos', VERDE], [' dentro de cada pulso', BLANCO]], CX, 897, { anchor: 'middle', size: 29, peso: 700 });
      aparece(s, sub, F1('B7') + 0.15, Wd('B8', 'estructura') - 0.3);     // (5-nov) primero se lee el cartel; después suena la solución
      // (5-nov, Iago) paso 5 sin rótulos: las líneas suben y se quedan
      // el borrador se aparta al subir las líneas
      const zonaB = N.group(g, 'zonaBorrador'); [gB, etB, nomB].forEach(e => zonaB.appendChild(e));
      s.on(t => { const k = ramp(t, tProp - 0.2, tProp + 0.8); zonaB.setAttribute('opacity', (1 - 0.7 * k).toFixed(3)); });
      // indicadores de pulso en cada demo
      [dM, dR, dC, dL, dML].filter(d0 => d0 > 0).forEach(d0 => latidos(s, g, 190, 940, d0, 4));
      // ---------------- ESTRUCTURA (B8)
      const tEst = Wd('B8', 'estructura'), tRec = Wd('B8', 'receta'), tCop = Wd('B8', 'copiarla');
      s.on(t => {
        const k = ease(ramp(t, tEst - 0.3, tEst + 0.6));
        notasM.forEach(n => { n.cab.setAttribute('opacity', (1 - 0.85 * k).toFixed(3)); n.plica.setAttribute('opacity', (1 - 0.85 * k).toFixed(3)); });
        zonaB.style.display = k > 0.98 ? 'none' : '';
        if (k > 0) zonaB.setAttribute('opacity', ((1 - k) * 0.3).toFixed(3));
      });
      const est = N.group(g); chip(est, 'ESTRUCTURA', CX, 700, { size: 30, anchor: 'middle', fondo: VERDE_OSC });
      aparece(s, est, tEst - 0.2, b);
      const rec = N.group(g); candado(rec, CX - 210, 800); texto(rec, 'receta desbloqueada', CX - 170, 812, { size: 32, peso: 600, fill: BLANCO });
      aparece(s, rec, tRec - 0.3, b);
      const cop = N.group(g); texto(cop, 'cada vez que veas un 3 contra 2 → cópiala', CX, 900, { anchor: 'middle', size: 26, peso: 400, italic: true, fill: SUAVE });
      aparece(s, cop, tCop - 0.4, b);
    });
  }
  function candado(g, x, y) {
    const c = N.group(g); c.style.color = VERDE;
    N.el('rect', { x: x - 16, y: y - 10, width: 32, height: 26, rx: 5, fill: 'currentColor' }, c);
    N.el('path', { d: `M${x - 10},${y - 10} v-10 a10,10 0 0 1 20,0 v-2`, fill: 'none', stroke: 'currentColor', 'stroke-width': 5, 'stroke-linecap': 'round', transform: `rotate(-24 ${x + 10} ${y - 10})` }, c);
    return c;
  }

  // ================================================================ C · MUNDOS RÍTMICOS (lámina del final de los apuntes)
  function escenaMundos() {
    const a = F0('C1') - 0.2, b = T.frase.D3 ? F0('D3') + 0.3 : F1('C1') + 1.4;      // sin hueco vacío antes de las rondas
    escena('mundos', a, b, (s, g) => {
      const IW = 2041, IH = 1473;                // lámina «2 · GVE · grupos en varios pulsos»
      const clipId = 'clipMundos';
      const defs = N.el('defs', null, g); const cpath = N.el('clipPath', { id: clipId }, defs);
      N.el('rect', { x: 110, y: 140, width: 1700, height: 900, rx: 22 }, cpath);
      const marcoClip = N.group(g); marcoClip.setAttribute('clip-path', `url(#${clipId})`);
      const caja = N.group(marcoClip);
      const k0 = 860 / IH;                        // vista completa (cabe entera)
      const x0 = CX - IW * k0 / 2, y0 = 160;
      const marco = N.el('rect', { x: -24, y: -24, width: IW + 48, height: IH + 48, rx: 26, fill: '#fbfaf6' }, caja);
      N.el('image', { href: window.IMAGENES.mundos, x: 0, y: 0, width: IW, height: IH }, caja);
      // tarjeta 2.1 (coordenadas de la lámina)
      const R21 = { x: 14, y: 152, w: 955, h: 206 };
      const marca = N.el('rect', { x: R21.x - 6, y: R21.y - 6, width: R21.w + 12, height: R21.h + 12, rx: 30, fill: 'none', stroke: VERDE, 'stroke-width': 10 }, caja);
      const velo = N.el('path', { d: `M-30,-30 H${IW + 30} V${IH + 30} H-30 Z M${R21.x},${R21.y} V${R21.y + R21.h} H${R21.x + R21.w} V${R21.y} Z`, fill: 'rgba(8,22,40,.9)', 'fill-rule': 'evenodd' }, caja);
      const titulo = texto(g, 'AL FINAL DE TUS APUNTES · MUNDOS RÍTMICOS', CX, 118, { anchor: 'middle', size: 30, peso: 800, ls: '0.14em', fill: BLANCO });
      const tMun = Wd('C1', 'mundos'), tApa = Wd('C1', 'apartado', 2), tSpo = Wd('C1', 'spoiler'), tDej = Wd('C1', 'dejo');
      // barrido por todas las «recetas»
      const cartas = [[14, 152], [988, 152], [14, 377], [988, 377], [14, 604], [988, 604], [14, 829], [988, 829]];
      const barrido = cartas.map(([x, y]) => N.el('rect', { x: x - 4, y: y - 4, width: 959, height: 214, rx: 28, fill: 'none', stroke: VERDE, 'stroke-width': 7, opacity: 0 }, caja));
      s.on(t => {
        const ap = win(t, tMun - 0.3, b, .5, .5);
        opa(marcoClip, ap); opa(titulo, win(t, tMun - 0.3, b, .5, .5));
        // zoom a la tarjeta 2.1 (especial hincapié en el 3 contra 2)
        const z = ease(ramp(t, tDej - 0.2, tDej + 1.4));
        const k1 = 1400 / R21.w, xz = CX - (R21.x + R21.w / 2) * k1, yz = 520 - (R21.y + R21.h / 2) * k1;
        const kk = lerp(k0, k1, z), xx = lerp(x0, xz, z), yy = lerp(y0, yz, z);
        caja.setAttribute('transform', `translate(${xx.toFixed(1)},${yy.toFixed(1)}) scale(${kk.toFixed(4)})`);
        velo.setAttribute('opacity', (0.95 * z).toFixed(3));
        const pul = 0.75 + 0.25 * Math.sin((t - tDej) * 4);
        marca.setAttribute('opacity', (z > 0 ? Math.min(1, z * 1.5) * pul : win(t, tApa, tSpo - 0.1, .3, .3)).toFixed(3));
        barrido.forEach((r, i) => { const ti = tSpo + i * 0.22; r.setAttribute('opacity', (win(t, ti, ti + 0.7, .15, .4) * (1 - z)).toFixed(3)); });
      });
      const hinc = N.group(g); chip(hinc, '2.1 · 3 CONTRA 2', CX, 735, { size: 28, anchor: 'middle', fondo: VERDE_OSC });
      aparece(s, hinc, tDej + 0.6, b);
      const nota2 = texto(g, 'no hace falta copiarlo: entiende el método', CX, 1010, { anchor: 'middle', size: 28, peso: 400, italic: true, fill: '#cbd5e1' });
      aparece(s, nota2, Wd('C1', 'preocupar') - 0.3, b);
    });
  }

  // ================================================================ D · LA RONDA
  function escenaRonda() {
    if (!T.frase.D1) return;      // (5-nov) el final del 2.1 ya es solo D3 (rondas con irregulares) + D2
    const a = F0('D1') - 0.2, b = T.frase.D3 ? F0('D3') + 0.2 : F0('COLA') + 1.0;
    escena('ronda', a, b, (s, g) => {
      const fondo = N.group(g); panel(fondo, 260, 230, 1400, 620); mostrarEn(s, fondo, a, b, .45, .6);
      const tR = Wd('D1', 'ronda');
      const t1 = texto(g, 'RONDA', CX, 340, { anchor: 'middle', size: 54, peso: 800, ls: '0.2em', fill: BLANCO });
      aparece(s, t1, tR - 0.3, b);
      const gM = N.group(g);
      const cp = compasProp(gM, { x: 583, yMid: 570, ts: '2/4', pulsos: 2, PW: 300, ultimo: 4 / 3 });
      const ns = ['C4', 'D4', 'E4'].map((p, i) => nota(gM, cp, i * 2 / 3, p, 'q'));
      numGrupo(gM, ns[0].xh, ns[2].xh + 1.18 * SP, Math.min(...ns.map(n => n.top)) - 34, 3, true);
      const l1 = lineaPulso(gM, cp, 0), l2 = lineaPulso(gM, cp, 1);
      aparece(s, gM, tR, b);
      const tP = Wd('D1', 'pulsos') - 0.15, tF = Wd('D1', 'grupos') - 0.15;
      // PULSO arriba a la izquierda: entra grande y las líneas crecen a la vez
      const kP = N.group(g); texto(kP, 'PULSO', 0, 0, { size: 44, peso: 800, ls: '0.14em', fill: VERDE });
      const kF = N.group(g); texto(kF, 'FIGURAS', 0, 0, { anchor: 'end', size: 44, peso: 800, ls: '0.14em', fill: BLANCO });
      s.on(t => {
        const vP = win(t, tP, b, .3, .5), zP = 1 + 0.9 * (1 - eo(ramp(t, tP, tP + 0.9)));
        opa(kP, vP); pos(kP, 330, 340, zP);
        const zl = 1 + 1.2 * (1 - eo(ramp(t, tP, tP + 0.9))) * (t >= tP ? 1 : 0);
        [l1, l2].forEach((l, i) => { const x = cp.xt(i), yc = cp.yMid + 4.8 * SP; l.setAttribute('transform', `translate(${x},${yc}) scale(${(1 + 0.4 * (zl - 1)).toFixed(3)},${zl.toFixed(3)}) translate(${-x},${-yc})`); });
        const vF = win(t, tF, b, .3, .5), zF = 1 + 0.9 * (1 - eo(ramp(t, tF, tF + 0.9)));
        opa(kF, vF); pos(kF, 1590, 340, zF);
        const kf = win(t, tF, tF + 1.6, .2, .6);
        ns.forEach(n => brilloNota(n, kf));
      });
      // cabezal que recorre el compás al pulso: destella cada línea y cada figura al pasar
      cabezal(s, g, cp, tR + 0.4, b - 0.2, tP, [{ t: 0, el: l1 }, { t: 1, el: l2 }].concat(ns.map((n, i) => ({ t: i * 2 / 3, el: n.g, blanco: true }))));
    });
  }


  // ================================================================ B9 · (5-nov, 2.ª grabación) el tresillo irregular
  function escenaIrregular21() {
    if (!T.frase.B9) return;
    const a = F0('B9') - 0.4, b = F1('B9') + 0.8 + 0.5 + 4 * P + 1.0;      // incluye el último caso sonando
    escena('irregular', a, b, (s, g) => {
      const fondo = N.group(g); panel(fondo, 110, 130, 1700, 860); mostrarEn(s, fondo, a, b, .5, .5);
      const PW = 400, yM = 360, yB = 700, X0 = 450;
      const ch = N.group(g); chip(ch, 'TRESILLO IRREGULAR', X0 - 26, 210, { size: 22, anchor: 'end', fondo: VERDE_OSC }); aparece(s, ch, a + 0.3, b);
      const gB = N.group(g, 'borrador');
      const cpB = compasProp(gB, { x: X0, yMid: yB, ts: '2/4', pulsos: 2, PW, ultimo: 5 / 3 });
      texto(g, 'BORRADOR', X0 - 26, yB + 10, { anchor: 'end', size: 26, peso: 800, ls: '0.16em', fill: SUAVE });
      const gM = N.group(g, 'modelo');
      const cpM = compasProp(gM, { x: X0, yMid: yM, ts: '2/4', pulsos: 2, PW, ultimo: 5 / 3 });
      texto(g, 'MODELO', X0 - 26, yM + 10, { anchor: 'end', size: 26, peso: 800, ls: '0.16em', fill: SUAVE });
      const lm = [lineaPulso(gM, cpM, 0, { y2: 4.9 }), lineaPulso(gM, cpM, 1, { y2: 4.9 })];
      const tF = Wd('B9', 'funden'), tRev = Wd('B9', 'reves'), tPar = Wd('B9', 'parte');
      const PIT = { Do: 'C4', Re: 'D4', Mi: 'E4' };
      // (5-nov, Iago) cada caso: su modelo, SU borrador (los nombres de las figuras que hay; ligadas solo dentro de cada figura) y se ESCUCHA
      const vars = [
        { t0: a, t1: tF - 0.1, figs: [['q', 0, 2 / 3, 'Do'], ['q', 2 / 3, 2 / 3, 'Re'], ['q', 4 / 3, 2 / 3, 'Mi']], etq: [], demo: null },
        { t0: tF - 0.1, t1: tRev - 0.1, figs: [['h', 0, 4 / 3, 'Do'], ['q', 4 / 3, 2 / 3, 'Mi']], etq: ['justo en la blanca', 'a ¾ de la blanca'], llave: [0, 3, '4 cabezas'], demo: 'irr1' },
        { t0: tRev - 0.1, t1: tPar - 0.1, figs: [['q', 0, 2 / 3, 'Do'], ['h', 2 / 3, 4 / 3, 'Re']], etq: ['justo en el Do', 'a ¼ de la blanca'], llave: [2, 5, '4 cabezas'], demo: 'irr2' },
        { t0: tPar - 0.1, t1: b, figs: [['q', 0, 2 / 3, 'Do'], ['8', 2 / 3, 1 / 3, 'Re'], ['8', 1, 1 / 3, 'Re'], ['q', 4 / 3, 2 / 3, 'Mi']], etq: ['justo en el Do', 'justo en la 2.ª corchea'], llave: [2, 3, '1 + 1'], barra: [1, 2], demo: 'irr3' },
      ];
      vars.forEach(v => {
        // ---- modelo
        const gv = N.group(gM);
        const ns = v.figs.map(([f, t, d, nm]) => nota(gv, cpM, t, PIT[nm], f));
        if (v.barra) { const [x, y] = v.barra, top = Math.min(ns[x].top, ns[y].top); [x, y].forEach(k => { ns[k].plica.firstChild.setAttribute('y2', top.toFixed(1)); }); barraNotas(gv, ns[x], ns[y], top); }
        numGrupo(gv, ns[0].xh, ns[ns.length - 1].xh + 1.18 * SP, Math.min(...ns.map(n => n.top)) - 34, 3, true);
        v.figs.forEach(([f, t, d, nm], k) => texto(gv, nm, ns[k].x, yM + 6.0 * SP, { anchor: 'middle', size: 24, peso: 600, fill: SUAVE }));
        mostrarEn(s, gv, v.t0, v.t1, .25, .25);
        if (false && v.etq.length) { const ge = N.group(g); v.etq.forEach((e, k) => texto(ge, e, cpM.xt(k), yM + 6.9 * SP + 44, { anchor: 'middle', size: 27, peso: 700, fill: VERDE })); mostrarEn(s, ge, v.t0 + 1.4, v.t1, .3, .3); }
        // ---- su borrador
        const fig = h => { const t = (h + 1e-6) / 3; let i = 0; while (i + 1 < v.figs.length && v.figs[i + 1][1] <= t) i++; return i; };
        const gb = N.group(gB);
        const nB = [0, 1, 2, 3, 4, 5].map(h => nota(gb, cpB, h / 3, PIT[v.figs[fig(h)][3]], '8', { top: yB + 3 * SP - 3.5 * SP - 6 }));
        [[0, 2], [3, 5]].forEach(([x, y]) => { barraNotas(gb, nB[x], nB[y], nB[0].top); numGrupo(gb, nB[x].plicaX, nB[y].plicaX, nB[0].top - 30, 3, false); });
        for (let h = 0; h < 5; h++) if (fig(h) === fig(h + 1)) ligadura(gb, nB[h], nB[h + 1]);
        nB.forEach((n, h) => texto(gb, v.figs[fig(h)][3], n.x, yB + 6.0 * SP, { anchor: 'middle', size: 24, peso: 600, fill: SUAVE }));
        lineaPulso(gb, cpB, 0, { y2: 4.9 }); lineaPulso(gb, cpB, 1, { y2: 4.9 });
        mostrarEn(s, gb, v.t0, v.t1, .25, .25);
        if (false && v.llave) { const [h0, h1, txt] = v.llave, gl = N.group(g), x1 = nB[h0].x - 14, x2 = nB[h1].x + 14, y = yB + 7.4 * SP;
          N.el('path', { d: `M${x1},${y - 10} V${y} H${x2} V${y - 10}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 3 }, gl);
          texto(gl, txt, (x1 + x2) / 2, y + 30, { anchor: 'middle', size: 22, peso: 800, fill: '#ffffff' }); mostrarEn(s, gl, v.t0 + 0.6, v.t1, .3, .3); }
        // ---- y suena: 2 vueltas, con el cabezal y las figuras con brillo blanco (modelo y borrador)
        if (v.demo) {
          const d0 = demo(v.demo);
          cabezal(s, g, cpM, d0 - 0.25, d0 + 4 * P + 0.4, d0, lm.map((el, k) => ({ t: k, el })).concat(ns.map((n, k) => ({ t: v.figs[k][1], el: n.g, blanco: true }))), { para: d0 + 4 * P });
          const kFig = (t, i) => { let k = 0; for (let c = 0; c < 2; c++) { const ta = d0 + c * 2 * P + v.figs[i][1] * P; k = Math.max(k, win(t, ta - 0.02, ta + v.figs[i][2] * P * 0.85, .05, .1)); } return k; };
          s.on(t => { ns.forEach((n, i) => brilloNota(n, kFig(t, i))); nB.forEach((n, h) => brillo(n.cab, kFig(t, fig(h)))); });
          latidos(s, g, 190, 940, d0, 4);
        }
      });
      mostrarEn(s, lm[0], tF + 0.9, b); mostrarEn(s, lm[1], tF + 0.9, b);
    });
  }
  // ================================================================ D3 · (5-nov) tres rondas, todos juntos
  function escenaRonda3() {
    if (!T.frase.D3) return;
    const a = F0('D3') - 0.2, b = T.acorde - 0.05;
    escena('ronda3', a, b, (s, g) => {
      const fondo = N.group(g); panel(fondo, 110, 115, 1700, 930); mostrarEn(s, fondo, a, b, .45, .6);
      const t1 = texto(g, 'RONDAS PARA TODOS', CX, 200, { anchor: 'middle', size: 44, peso: 800, ls: '0.14em', fill: BLANCO }); aparece(s, t1, a + 0.2, b);
      const filas = [
        ['REGULAR', Wd('D3', 'regular'), [['q', 0, 'C4'], ['q', 2 / 3, 'D4'], ['q', 4 / 3, 'E4']], null],
        ['IRREGULAR 1', Wd('D3', 'irregular'), [['h', 0, 'C4'], ['q', 4 / 3, 'E4']], null],
        ['IRREGULAR 2', Wd('D3', 'irregular', 2) > Wd('D3', 'irregular') ? Wd('D3', 'irregular', 2) : Wd('D3', 'blanca') + 0.8, [['q', 0, 'C4'], ['8', 2 / 3, 'D4'], ['8', 1, 'D4'], ['q', 4 / 3, 'E4']], [1, 2]],
      ];
      const ys = [395, 640, 885];
      filas.forEach(([rot, tf, figs, barra], i) => {
        const gf = N.group(g);
        const cp = compasProp(gf, { x: 560, yMid: ys[i], ts: '2/4', pulsos: 2, PW: 330, ultimo: 5 / 3 });
        const ns = figs.map(([f, t, p]) => nota(gf, cp, t, p, f));
        if (barra) { const [x, y] = barra, top = Math.min(ns[x].top, ns[y].top); [x, y].forEach(k => ns[k].plica.firstChild.setAttribute('y2', top.toFixed(1))); barraNotas(gf, ns[x], ns[y], top); }
        numGrupo(gf, ns[0].xh, ns[ns.length - 1].xh + 1.18 * SP, Math.min(...ns.map(n => n.top)) - 34, 3, true);
        const lns = [lineaPulso(gf, cp, 0), lineaPulso(gf, cp, 1)];
        const et = texto(gf, rot, 530, ys[i] + 10, { anchor: 'end', size: 24, peso: 800, ls: '0.1em', fill: SUAVE });
        aparece(s, gf, tf - 0.3, b);
        s.on(t => et.setAttribute('fill', mezcla(SUAVE, VERDE, win(t, tf - 0.2, tf + 1.6, .2, .4))));
        cabezal(s, g, cp, tf, b - 0.2, filas[0][1], lns.map((el, k) => ({ t: k, el })).concat(ns.map((n, j) => ({ t: figs[j][1], el: n.g, blanco: true }))));
      });
    });
  }

  // ================================================================ FINAL
  function escenaFinal() {
    const ta = T.acorde;
    escena('final', ta - 0.5, T.dur + 9999, (s, g) => {
      const gg = N.group(g); tituloGrande(gg);
      s.on(t => { const k = t >= ta ? eo(ramp(t, ta, ta + 0.35)) : 0; opa(gg, k); gg.setAttribute('transform', `translate(${CX},540) scale(${(0.97 + 0.03 * k).toFixed(4)}) translate(${-CX},-540)`); });
    });
  }

  function veloFondo(t) {
    const tit = 1 - ease(ramp(t, F1('TITULO') - 1.0, F1('TITULO') + 0.3));
    const fin = ease(ramp(t, T.acorde - 0.05, T.acorde + 0.4));
    return clamp(0.70 - 0.17 * Math.max(tit, fin), 0, 0.92);
  }

  function construir(tiempos) {
    T = tiempos; esc.length = 0;
    const capa = document.getElementById('capaEscenas');
    while (capa.firstChild) capa.removeChild(capa.firstChild);
    escenaTitulo(); escenaVarios(); escenaAOjo(); escenaPrecision(); escenaHoy(); escenaMetodo(); escenaIrregular21(); escenaMundos(); escenaRonda(); escenaRonda3(); escenaFinal();
  }
  function pintar(t) {
    for (const s of esc) {
      const activa = t >= s.a - 0.05 && t <= s.b + 0.05;
      if (!activa) { if (s.g.style.display !== 'none') s.g.style.display = 'none'; continue; }
      s.g.style.display = '';
      for (const f of s.tracks) f(t);
    }
    const velo = document.getElementById('velo');
    if (velo) { const v = veloFondo(t).toFixed(3); if (velo._v !== v) { velo._v = v; velo.style.opacity = v; } }
  }
  window.ESCENAS = { construir, pintar, get T() { return T; } };
})();
