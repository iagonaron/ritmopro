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

  const POS = { C4: -3, D4: -2.5, E4: -2, F4: -1.5, G4: -1, A4: -0.5, B4: 0 };
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
  // =====================================================================
  //  ESCENAS GENÉRICAS · cartas 2.2–2.8 (GVE en varios pulsos) · window.CARTA manda
  // =====================================================================
  const K = window.CARTA;
  const PIT = { Do: 'C4', Re: 'D4', Mi: 'E4', Fa: 'F4', Sol: 'G4', La: 'A4', Si: 'B4' };
  const pitchDe = nom => PIT[String(nom).split(' ')[0]] || 'B4';
  const Wa = (id, alts, n) => { for (const a of alts) { const t = WdQ(id, a, n); if (t != null) return t; } return null; };
  function WdQ(id, pal, n) {           // como Wd, pero devuelve null si no está (sin avisos)
    const f = T.frase[id]; if (!f) return null;
    const p = limpia(pal); let k = 0;
    for (const [w, t] of f.palabras) { const lw = limpia(w); if (p.length <= 3 ? lw === p : lw.startsWith(p)) { k++; if (k === (n || 1)) return t; } }
    return null;
  }
  const hay = id => !!T.frase[id];
  // (5-nov, Iago) «cambia de nombre cada X notas porque hay X pulsos»: el numerador del compás (los pulsos) se enciende en verde
  function enciendeNumerador(s, cps, t0, t1) {
    s.on(t => { const k = win(t, t0, t1, .2, .5); cps.forEach(cp => { if (!cp.num) return;
      cp.num.style.color = k > 0.02 ? mezcla(BLANCO, VERDE, k) : '';
      cp.num.style.filter = k > 0.02 ? `drop-shadow(0 0 ${(4 + 8 * k).toFixed(1)}px ${VERDE})` : ''; }); });
  }

  // (5-nov, Iago) CÓDIGO DE COLOR: el VERDE es solo del PULSO (líneas, «pulsos»); la FIGURA es BLANCA y se ilumina con brillo blanco
  function brillo(el, k) {
    el.style.filter = k > 0.02 ? `drop-shadow(0 0 ${(3 + 10 * k).toFixed(1)}px rgba(255,255,255,${(0.8 * k).toFixed(2)})) drop-shadow(0 0 ${(1.5 + 3 * k).toFixed(1)}px rgba(255,255,255,${Math.min(1, k).toFixed(2)}))` : '';
    el.style.color = k > 0.02 ? '#ffffff' : '';
  }
  const brilloNota = (n, k) => { brillo(n.cab, k); brillo(n.plica, k); };


  // ------------------------------------------------ compás proporcional (igual que el 2.1)
  function compasProp(parent, o) {
    const g = N.group(parent, 'compasProp');
    const yMid = o.yMid, x0 = o.x;
    const staff = N.group(g, 'pentagrama');
    const clave = N.group(g, 'clave'); N.claveSol(clave, x0 + 0.6 * SP, yMid, SP);
    const cif = N.group(g, 'cifra');
    const [nu, de] = o.ts.split('/');
    const r = N.compas(cif, { tipo: 'simple', num: nu, den: de }, x0 + 4.0 * SP, yMid, SP);
    const xs = o.xs != null ? o.xs : x0 + 4.0 * SP + r.w + 3.8 * SP;
    const PW = o.PW;
    const xt = t => xs + t * PW;
    const barra = N.group(g, 'barra');
    const xb = xt(o.ultimo) + 3.8 * SP;
    N.line(barra, xb, yMid - 2 * SP, xb, yMid + 2 * SP, N.E.thinBar * SP);
    N.line(barra, xb + 0.55 * SP, yMid - 2 * SP, xb + 0.55 * SP, yMid + 2 * SP, 0.5 * SP);
    const ancho = xb + 0.8 * SP - x0;
    N.pentagrama(staff, x0, yMid, ancho, SP);
    return { g, staff, clave, cif, num: r.partes && r.partes.num, barra, yMid, xs, PW, xt, x0, ancho, xb, ult: o.ultimo, pulsos: o.pulsos };
  }
  // ------------------------------------------------ figura: w h q 8 16 32 hd qd (plica arriba; las corcheas van con barra)
  function nota(parent, cp, t, p, f, o) {
    o = o || {};
    const g = N.group(parent, 'nota');
    const ps = POS[p], y = cp.yMid - ps * SP, cx = cp.xt(t);
    const cabeza = f === 'w' ? 'noteheadWhole' : (f === 'h' || f === 'hd' ? 'noteheadHalf' : 'noteheadBlack');
    const wCab = f === 'w' ? 1.69 : 1.18;
    const xh = cx - wCab / 2 * SP;
    const cab = N.group(g, 'cabeza');
    N.glyph(cab, cabeza, xh, y, SP);
    for (let lp = -3; lp >= ps - 1e-6; lp -= 1) N.line(cab, xh - 0.4 * SP, cp.yMid - lp * SP, xh + (wCab + 0.4) * SP, cp.yMid - lp * SP, N.E.ledger * SP);
    if (f === 'hd' || f === 'qd') N.glyph(cab, 'augmentationDot', xh + (wCab + 0.35) * SP, y - (Math.abs(ps % 1) < 0.01 ? 0.5 * SP : 0), SP);
    const plicaX = xh + (1.18 - N.E.stem / 2) * SP;
    const plica = N.group(g, 'plica');
    const top = o.top != null ? o.top : y - 3.5 * SP;
    if (f !== 'w') N.line(plica, plicaX, y - 0.168 * SP, plicaX, top, N.E.stem * SP);
    return { g, cab, plica, x: cx, y, xh, plicaX, top, f };
  }
  function barraNotas(parent, n1, n2, yTop) {
    return N.el('rect', { x: (n1.plicaX - N.E.stem / 2 * SP).toFixed(1), y: yTop.toFixed(1), width: (n2.plicaX - n1.plicaX + N.E.stem * SP).toFixed(1),
      height: (N.E.beam * SP).toFixed(1), fill: 'currentColor' }, parent);
  }
  function numGrupo(parent, x1, x2, y, num, corchete) {
    const g = N.group(parent, 'tuplet');
    const xm = (x1 + x2) / 2;
    texto(g, String(num), xm, y + 9, { anchor: 'middle', size: 30, peso: 700, italic: true, familia: 'Georgia, "Times New Roman", serif' });
    if (corchete) {
      const hw = 16;
      N.el('path', { d: `M${x1.toFixed(1)},${(y + 10).toFixed(1)} V${(y - 2).toFixed(1)} H${(xm - hw).toFixed(1)} M${(xm + hw).toFixed(1)},${(y - 2).toFixed(1)} H${x2.toFixed(1)} V${(y + 10).toFixed(1)}`,
        fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4 }, g);
    }
    return g;
  }
  /** Inicios y duraciones (en pulsos) de una variante: las figuras se reparten en m pulsos según su peso. */
  function tiempos(v) {
    const W = v.figs.reduce((a, f) => a + f[1], 0); let s = 0; const on = [], du = [];
    for (const f of v.figs) { on.push(s * K.m / W); du.push(f[1] * K.m / W); s += f[1]; }
    return { on, du };
  }
  /** Dibuja una variante en un compás proporcional. Devuelve {ns, on, du, num, cp}. */
  function dibujaVariante(parent, cp, v) {
    const { on, du } = tiempos(v);
    const beams = v.beams || [];
    const enBarra = new Set(); beams.forEach(([a, b]) => { for (let i = a; i <= b; i++) enBarra.add(i); });
    const ns = v.figs.map((f, i) => nota(parent, cp, on[i], pitchDe(v.nom[i]), f[0]));
    // barras: plicas a la misma altura dentro de cada grupo
    const grupos = beams.filter(b => b[2] === 1);
    grupos.forEach(([a, b]) => { const top = Math.min(...ns.slice(a, b + 1).map(n => n.top)) - 4; for (let i = a; i <= b; i++) { ns[i].top = top; const l = ns[i].plica.firstChild; if (l) l.setAttribute('y2', top.toFixed(1)); } });
    beams.forEach(([a, b, lv]) => { const top = ns[a].top + (lv - 1) * 0.75 * SP; barraNotas(parent, ns[a], ns[b], top); });
    let num = null;
    if (v.num) {
      const topAll = Math.min(...ns.map(n => n.top));
      const unaBarra = beams.length && beams[0][0] === 0 && beams[0][1] === ns.length - 1 && beams[0][2] === 1;
      num = unaBarra ? numGrupo(parent, ns[0].plicaX, ns[ns.length - 1].plicaX, topAll - 30, v.num, false)
                     : numGrupo(parent, ns[0].xh, ns[ns.length - 1].xh + 1.18 * SP, topAll - 34, v.num, true);
    }
    return { ns, on, du, num, cp };
  }
  /** Borrador: H = n·m·fino cabezas; cada pulso es un grupo de n·fino (con su número si es grupo especial). */
  function dibujaBorrador(parent, cp, fino, v) {
    const g = K.n * fino, H = K.n * K.m * fino, fig = fino > 1 ? (K.bor.fig === '8' ? '16' : '32') : K.bor.fig;
    const lv = { '8': 1, '16': 2, '32': 3 }[fig];
    let figH = h => Math.floor(h / (K.m * fino)), nomH = h => K.reg.nom[figH(h)];
    if (v) {   // (5-nov, Iago) el borrador se adecúa al caso: cada cabeza lleva el nombre de la figura que la contiene
      const { on } = tiempos(v);
      figH = h => { const t = (h + 1e-6) / g; let i = 0; while (i + 1 < on.length && on[i + 1] <= t) i++; return i; };
      nomH = h => String(v.nom[figH(h)]).split(' ')[0];
    }
    // (5-nov, Iago) plicas más largas si hay cabezas altas: que ni las barras ni el corchete del grupo pisen las cabezas
    let psMax = -3; for (let h = 0; h < H; h++) psMax = Math.max(psMax, POS[pitchDe(nomH(h))]);
    const top0 = Math.min(cp.yMid - 0.5 * SP - 6, cp.yMid - psMax * SP - (2.6 + 0.75 * (lv - 1)) * SP);
    const ns = []; for (let h = 0; h < H; h++) ns.push(nota(parent, cp, h / g, pitchDe(nomH(h)), '8', { top: top0 }));
    const grupos = [];
    for (let j = 0; j < K.m; j++) {
      const gg = N.group(parent, 'gve'); const a = j * g, b = a + g - 1;
      for (let i = a; i <= b; i++) gg.appendChild(ns[i].plica);
      for (let l = 1; l <= lv; l++) barraNotas(gg, ns[a], ns[b], top0 + (l - 1) * 0.75 * SP);
      const num = (K.bor.num && fino === 1) ? numGrupo(gg, ns[a].plicaX, ns[b].plicaX, top0 - 30, K.bor.num, false) : null;
      grupos.push({ g: gg, num });
    }
    const lig = []; for (let h = 0; h < H - 1; h++) if (figH(h) === figH(h + 1)) lig.push([h, h + 1]);
    return { ns, grupos, H, g, nomH, figH, lig, fino };
  }
  function geometria() {               // PW común a modelo, borrador y variantes: las líneas suben en vertical
    const fmax = Math.max(1, ...['C1', 'C2'].map(k => (K[k] && K[k].fino) || 1));
    const ult = (K.n * K.m * fmax - 1) / (K.n * fmax);
    const ultR = (K.n * K.m - 1) / K.n;
    const PW = Math.min(400, 900 / ult);
    return { PW, ult: Math.max(ult, ultR) };
  }

  // ================================================================ 0 · TÍTULO
  function tituloGrande(g) {
    texto(g, 'GRADO PROFESIONAL  ·  RITMO  ·  CARTA ' + K.id, CX, 392, { anchor: 'middle', size: 26, peso: 800, ls: '0.3em', fill: VERDE });
    const pz = K.titulo.split(' '), ult = pz.pop();      // (5-nov, Iago) el número de PULSOS en verde: «3 CONTRA 4»
    texto(g, [[pz.join(' ') + ' ', BLANCO], [ult, VERDE]], CX, 528, { anchor: 'middle', size: 112, peso: 800, ls: '0.05em' });
    N.el('rect', { x: CX - 60, y: 566, width: 120, height: 5, rx: 2.5, fill: VERDE }, g);
    texto(g, 'Grupos de valoración especial en varios pulsos', CX, 640, { anchor: 'middle', size: 38, peso: 400, fill: '#cbd5e1' });
  }
  function escenaTitulo() {
    const b = F1('TITULO');
    escena('titulo', -1, b, (s, g) => { const gg = N.group(g); tituloGrande(gg); s.on(t => opa(gg, 1 - ease(ramp(t, b - 1.2, b)))); });
  }

  // ================================================================ A · presentación (el grupo de la carta, sin resolver)
  function escenaA() {
    const a = F0('A1') - 0.3, b = F0('B1') - 0.1;
    escena('A', a, b, (s, g) => {
      const fondo = N.group(g); panel(fondo, 260, 200, 1400, 660); mostrarEn(s, fondo, a, b, .45, .4);
      const { PW, ult } = geometria();
      const gm = N.group(g);
      const tmp = compasProp(gm, { x: 0, yMid: 0, ts: K.reg.ts, pulsos: K.m, PW: PW * 0.85, ultimo: ult });
      const xIni = CX - tmp.ancho / 2; gm.removeChild(tmp.g);
      const cp = compasProp(gm, { x: xIni, yMid: 560, ts: K.reg.ts, pulsos: K.m, PW: PW * 0.85, ultimo: ult });
      const V = dibujaVariante(cp.g, cp, K.reg);
      aparece(s, gm, a + 0.5, b);
      const t1 = texto(g, [[`${K.n} figuras`, BLANCO], ['  ·  ', SUAVE], [`${K.m} pulsos`, VERDE]], CX, 330, { anchor: 'middle', size: 54, peso: 800, ls: '0.06em' });   // pulso verde, figura blanca
      aparece(s, t1, Wa('A1', ['figuras']) != null ? Wa('A1', ['figuras']) - 0.4 : a + 0.6, b);
      const tg = Wa('A1', K.grupo);
      const ch = N.group(g); chip(ch, K.nombre.toUpperCase(), CX, 760, { size: 30, anchor: 'middle', fondo: VERDE_OSC });
      aparece(s, ch, tg != null ? tg - 0.2 : a + 1.2, b);
      s.on(t => { const k = tg != null ? win(t, tg - 0.1, tg + 1.4, .2, .5) : 0; V.ns.forEach(n => brilloNota(n, k)); if (V.num) brillo(V.num, k); });
      const ojo = Wa('A1', ['ojo']);
      if (ojo != null) { const o = texto(g, 'a ojo, no · con método, sí', CX, 840, { anchor: 'middle', size: 30, peso: 400, italic: true, fill: '#cbd5e1' }); aparece(s, o, ojo - 0.2, b); }
    });
  }

  // ================================================================ B–C · el método y los casos
  function escenaMetodo() {
    const a = F0('B1') - 0.3, b = F0('D1') + 0.45;     // se solapa con la ronda: sin parpadeo del panel
    const finB = ['C0', 'C1', 'C2', 'X5'].filter(hay).map(F0); const tFinMetodo = finB.length ? Math.min(...finB) : b;
    escena('metodo', a, b, (s, g) => {
      const fondo = N.group(g); panel(fondo, 110, 130, 1700, 860); mostrarEn(s, fondo, a, b, .5, .5);
      // ---- pasos
      const pasos = [['1 · MODELO', 'B1', 'B2'], ['2 · BORRADOR', 'B2', 'B3'], ['3 · CABEZAS', 'B3', 'B4'], ['4 · LÍNEAS', 'B4', 'B5'], ['5 · PROPORCIÓN', 'B5', null]];
      let x = 1785;
      for (let i = pasos.length - 1; i >= 0; i--) {
        const [nm, ia, ib] = pasos[i];
        const c = chip(g, nm, x, 82, { size: 17, anchor: 'end', relleno: false, borde: 'rgba(255,255,255,.28)', colorTexto: SUAVE });
        x -= c._w + 10;
        s.on(t => {
          const ta = F0(ia) + 0.2, tb = ib ? F0(ib) + 0.2 : tFinMetodo;
          const on = t >= ta && t < tb, hecho = t >= tb;
          c._rect.setAttribute('fill', on ? VERDE_OSC : 'none');
          c._rect.setAttribute('stroke', on ? VERDE_OSC : (hecho ? 'rgba(74,222,128,.55)' : 'rgba(255,255,255,.28)'));
          c._txt.setAttribute('fill', on ? '#fff' : (hecho ? VERDE : SUAVE));
          opa(c, win(t, a, b, .5, .5));
        });
      }
      const { PW, ult } = geometria();
      const yM = 360, yB = 700, X0 = 450;
      const P5 = Wa('B5', ['llevamos']) || F0('B5') + 1;
      // ---------------- MODELO (regular)
      const gM = N.group(g, 'modelo');
      const cpM = compasProp(gM, { x: X0, yMid: yM, ts: K.reg.ts, pulsos: K.m, PW, ultimo: ult });
      const etM = texto(g, 'MODELO', X0 - 26, yM + 10, { anchor: 'end', size: 26, peso: 800, ls: '0.16em', fill: SUAVE });
      const tB1 = F0('B1'), tMod = Wa('B1', ['modelo']) || tB1 + 1;
      [cpM.staff, cpM.clave, cpM.barra].forEach(e => mostrarEn(s, e, tB1 + 0.2, b));
      mostrarEn(s, etM, tMod - 0.2, b); mostrarEn(s, cpM.cif, tMod + 0.8, b);
      const gReg = N.group(gM, 'regular');
      const VM = dibujaVariante(gReg, cpM, K.reg);
      const tGr = Wa('B1', K.grupo) || tMod + 3;
      // nombres dichos en B1 (Do, Re, Mi…) en orden
      const nomsB1 = []; { const f = T.frase.B1, want = K.reg.nom.map(x => limpia(x)); let j = 0; for (const [w, t] of f.palabras) { if (t < tGr) continue; if (j < want.length && limpia(w) === want[j]) { nomsB1.push(t); j++; } } }
      while (nomsB1.length < K.n) nomsB1.push((nomsB1.length ? nomsB1[nomsB1.length - 1] : tGr + 0.6) + 0.35);
      mostrarEn(s, gReg, tGr - 0.3, b);
      const dML = demo('modelo_lineas'), VML = 2;      // (5-nov) el grupo resuelto suena siempre 2 veces
      VM.ns.forEach((n, i) => s.on(t => {
        let k = win(t, nomsB1[i] - 0.05, nomsB1[i] + 0.55, .1, .3);
        for (let c = 0; c < VML; c++) { const ta = dML + c * K.m * P + VM.on[i] * P; k = Math.max(k, win(t, ta - 0.02, ta + VM.du[i] * P * 0.85, .05, .12)); }
        brilloNota(n, k);
      }));
      const nomM = N.group(g);
      VM.ns.forEach((n, i) => { const tt = texto(nomM, K.reg.nom[i], n.x, yM + 5.4 * SP, { anchor: 'middle', size: K.n > 5 ? 22 : 26, peso: 600, fill: SUAVE }); mostrarEn(s, tt, nomsB1[i] - 0.1, P5, .25, .4); });
      // ---------------- BORRADOR (regular y, si hace falta, el doble de fino)
      const gB = N.group(g, 'borrador');
      const cpB = compasProp(gB, { x: X0, yMid: yB, ts: K.reg.ts, pulsos: K.m, PW, ultimo: ult });
      const etB = texto(g, 'BORRADOR', X0 - 26, yB + 10, { anchor: 'end', size: 26, peso: 800, ls: '0.16em', fill: SUAVE });
      const tB2 = Wa('B2', ['borrador']) || F0('B2') + 1;
      [cpB.staff, cpB.clave, cpB.cif, cpB.barra, etB].forEach(e => mostrarEn(s, e, tB2 - 0.2, b));
      const gB1 = N.group(gB, 'borrador1');
      const B = dibujaBorrador(gB1, cpB, 1);
      const tGrupos = tB2 + 0.9;
      B.grupos.forEach((gr, j) => mostrarEn(s, gr.g, tGrupos + j * 0.4, b, .35, .5));
      const dR = demo('borrador_ritmo'), dC = demo('borrador_cabezas'), dL = demo('borrador_ligado');
      // cuándo aparece cada cabeza: con su nombre dicho en B3 (los no transcritos se reparten entre los dichos)
      const tCabH = (() => {
        const f = T.frase.B3, nomsL = K.reg.nom.map(x => limpia(x)), tLig = Wa('B3', ['ligadas', 'ahora']) || F1('B3');
        const tCab = Wa('B3', ['cabezas']) || F0('B3') + 1, tIni = (Wa('B3', ['notas', 'pulsos']) || tCab + 1.2) + 0.5;
        const porNombre = nomsL.map(() => []);
        for (const [w, t] of (f.nombres || f.palabras)) { const j = nomsL.indexOf(limpia(w)); if (j >= 0 && (f.nombres || (t > tCab && t < tLig))) porNombre[j].push(t); }
        const total = porNombre.reduce((a, l) => a + l.length, 0);
        const out = new Array(B.H);
        if (total < 0.5 * B.H) { for (let h = 0; h < B.H; h++) out[h] = tIni + (tLig - 0.5 - tIni) * h / B.H; return out; }
        const ancla = porNombre.map(l => l.length ? l[0] : null);
        for (let j = 0; j < K.n; j++) if (ancla[j] == null) {       // nombre no dicho («y así hasta…»): interpolar
          let p = j - 1; while (p >= 0 && ancla[p] == null) p--; let q = j + 1; while (q < K.n && ancla[q] == null) q++;
          const tp = p >= 0 ? ancla[p] : tIni, tq = q < K.n ? ancla[q] : tLig - 0.4; ancla[j] = tp + (tq - tp) * (j - p) / (q - p);
        }
        const paso = Math.max(0.12, Math.min(0.30, (tLig - tIni) / B.H));
        for (let h = 0; h < B.H; h++) { const j = Math.floor(h / K.m), k = h % K.m, l = porNombre[j]; out[h] = k < l.length ? l[k] : (l.length ? l[l.length - 1] : ancla[j]) + (k - Math.max(0, l.length - 1)) * paso; }
        return out;
      })();
      B.ns.forEach((n, h) => {
        s.on(t => {
          opa(n.cab, ramp(t, tCabH[h] - 0.1, tCabH[h] + 0.15));
          let k = win(t, tCabH[h] - 0.1, tCabH[h] + 0.45, .1, .3);
          for (let c = 0; c < K.vueltas; c++) {
            const ta = dC + c * K.m * P + h / B.g * P; k = Math.max(k, win(t, ta - 0.02, ta + P / B.g * 0.8, .04, .08));
            const j = Math.floor(h / K.m), tl = dL + c * K.m * P + j * K.m / K.n * P; k = Math.max(k, win(t, tl - 0.02, tl + K.m / K.n * P * 0.85, .05, .1));
          }
          brillo(n.cab, k);
        });
        s.on(t => {         // demo de ritmo (antes de las cabezas): se iluminan plicas
          let k = 0;
          for (let c = 0; c < K.vueltas; c++) { const ta = dR + c * K.m * P + h / B.g * P; k = Math.max(k, win(t, ta - 0.02, ta + P / B.g * 0.7, .03, .06)); }
          brillo(n.plica, k);
        });
      });
      const nomB = N.group(g);
      B.ns.forEach((n, h) => { const tt = texto(nomB, B.nomH(h), n.x, yB + 5.4 * SP, { anchor: 'middle', size: B.H > 14 ? 17 : (B.H > 10 ? 20 : 24), peso: 600, fill: SUAVE }); mostrarEn(s, tt, tCabH[h] - 0.1, F0('B4') + 0.2, .25, .4); });
      { // «cambia de nombre cada X notas (porque hay X pulsos)»: el numerador se enciende al decir X (y sigue si dice «pulsos»)
        const ws = T.frase.B3.palabras; const ic = ws.findIndex(([w]) => limpia(w) === 'cada');
        const tx = ic >= 0 && ws[ic + 1] ? ws[ic + 1][1] : (Wa('B3', ['notas']) || null), tpu = Wa('B3', ['pulsos']);
        if (tx != null) enciendeNumerador(s, [cpM, cpB], tx - 0.15, Math.max(tx + 1.4, tpu != null && tpu - tx < 3 ? tpu + 1.2 : 0)); }
      // ligaduras
      const tLig = Wa('B3', ['ligadas']) || F1('B3') - 0.6;
      const ligs = N.group(gB1, 'ligaduras');
      for (let j = 0; j < K.n; j++) for (let k = 0; k < K.m - 1; k++) { const h = j * K.m + k; const gl = N.group(ligs); gl.appendChild(ligadura(gl, B.ns[h], B.ns[h + 1])); mostrarEn(s, gl, tLig - 0.2 + j * 0.18, b, .3, .5); }
      s.on(t => brillo(ligs, win(t, tLig - 0.2, tLig + 1.8, .25, .4)));
      // ---------------- PASO 4 · líneas en el borrador (al principio de cada pulso)
      const tCom = Wa('B4', ['comienzo', 'pulso']) || F0('B4') + 1.5;
      const lineasB = []; for (let k = 0; k < K.m; k++) { const l = lineaPulso(gB1, cpB, k); lineasB.push(l); mostrarEn(s, l, tCom - 0.1 + k * 0.25, b, .3, .5); }
      // la parte propia de la carta: «en el primer do, en el cuarto do…» → destella la cabeza de cada pulso
      { const f = T.frase.B4, nomsL = K.reg.nom.map(x => limpia(x)); const ts = []; for (const [w, t] of f.palabras) if (t > tCom + 0.8 && nomsL.indexOf(limpia(w)) >= 0) ts.push(t);
        for (let k = 0; k < K.m; k++) { const tk = ts[k] != null ? ts[k] : tCom + 1.5 + k * 0.6, n = B.ns[k * B.g];
          s.on(t => { const v = win(t, tk - 0.15, tk + 0.9, .15, .4); if (v > 0.02) brillo(n.cab, v); }); } }
      // ---------------- PASO 5 · suben al modelo; los rótulos (proporción) los cuenta la animación en silencio
      const sube = N.group(g);
      const ls = []; for (let k = 0; k < K.m; k++) ls.push(lineaPulso(sube, cpB, k));
      s.on(t => { const k = ease(ramp(t, P5 - 0.1, P5 + 1.1)); opa(sube, (t >= P5 - 0.1 && t < tFinMetodo + 0.2) || altVent.some(([x0, x1]) => t >= x0 && t < x1) ? 1 : 0); pos(sube, 0, -(yB - yM) * k); });
      const etqM = N.group(g);
      const tEtq = P5 + 1.3;
      K.reg.etq.forEach((e, k) => { const tx = texto(etqM, e, cpM.xt(k), yM + 6.9 * SP, { anchor: 'middle', size: K.m > 3 ? 24 : 27, peso: 700, fill: VERDE });
        if (k % 2 === 1 && K.m > 3) tx.setAttribute('y', (yM + 6.9 * SP + 30).toFixed(1));
        if (false) mostrarEn(s, tx, tEtq + k * 0.7, tFinMetodo - 0.1, .3, .4); opa(tx, 0); });   // (5-nov, Iago) en el paso 5 nada de ⅔ ni rótulos: solo suben las líneas y se quedan
      cabezal(s, g, cpM, dML - 0.25, dML + VML * K.m * P + 0.4, dML,
        ls.map((el, k) => ({ t: k, el })).concat(VM.ns.map((n, i) => ({ t: VM.on[i], el: n.g, blanco: true }))), { vuelta: K.m, para: dML + VML * K.m * P });
      const zonaB = N.group(g, 'zonaBorrador'); [gB, etB, nomB].forEach(e => zonaB.appendChild(e));
      // recuerda el motor de subdivisión
      const sub = N.group(g);
      panel(sub, CX - 610, 850, 1220, 74, { rx: 14, fill: 'rgba(20,83,45,.55)', stroke: VERDE });
      texto(sub, [['Recuerda: ', VERDE], ['el motor de subdivisión son ', BLANCO], [K.motor, VERDE], [' dentro de cada pulso', BLANCO]], CX, 897, { anchor: 'middle', size: 29, peso: 700 });
      aparece(s, sub, F1('B5') + 0.15, tFinMetodo - 0.1);     // (5-nov, Iago) primero se lee el cartel; después suena la solución
      // (2.5) «la segunda línea cae en mitad de la nota central»
      if (hay('X5') && K.X5) {
        const tC = Wa('X5', ['central']) || F0('X5') + 2, n = VM.ns[K.X5.central];
        s.on(t => { const v = win(t, F0('X5') + 0.3, F1('X5') + 0.3, .3, .4); if (v > 0.01) brilloNota(n, v); });
        const ch = N.group(g); chip(ch, 'NOTA CENTRAL', n.x, yM - 150, { size: 22, anchor: 'middle', fondo: VERDE_OSC }); aparece(s, ch, tC - 0.6, F1('X5') + 0.3);
      }
      // ---------------- C · compases equivalentes, irregulares
      let cur = { grupoM: gReg, VM, etq: etqM };      // lo que hay ahora en el modelo
      const borradores = { 1: { g: gB1, B, lineas: lineasB } };
      let zonaOn = [[a, P5 + 0.6, 1], [P5 + 0.6, 1e9, 0.3]]; const altVent = [], ocultaB1 = [], VV = 2;      // VV: vueltas de cada caso irregular (para escucharlo bien)   // opacidad de la zona del borrador por tramos
      ['C0', 'C1', 'C2'].forEach(cid => {
        if (!hay(cid) || !K[cid]) return;
        const cfg = K[cid], ta = F0(cid), tb = F1(cid);
        let tSig = (['C1', 'C2', 'D1'].filter(id => hay(id) && F0(id) > ta).map(F0)[0]) || b;
        if (tSig >= F0('D1') - 0.3) tSig = b;      // (5-nov, Iago) lo último se va TODO a la vez con el panel, nada se apaga antes
        if (cfg.tipo === 'alt') {
          // el mismo dibujo en otro compás: debajo del modelo, con sus líneas en el mismo sitio
          zonaOn.push([ta - 0.1, tSig, 0]);
          const yy = cfg.alts.length === 1 ? [690] : [600, 835];
          cfg.alts.forEach((v, i) => {
            const ga = N.group(g, 'alt');
            const cpA = compasProp(ga, { x: X0, yMid: yy[i], ts: v.ts, pulsos: K.m, PW, ultimo: ult });
            const VA = dibujaVariante(ga, cpA, v);
            const lA = []; for (let k = 0; k < K.m; k++) lA.push(lineaPulso(ga, cpA, k, cfg.alts.length > 1 ? { y2: 4.9 } : null));
            if (cfg.sobre && i === 0) { const dA = demo(cid);
              cabezal(s, g, cpA, dA - 0.25, dA + VV * K.m * P + 0.4, dA, lA.map((el, k) => ({ t: k, el })).concat(VA.ns.map((n, j) => ({ t: VA.on[j], el: n.g, blanco: true }))), { vuelta: K.m, para: dA + VV * K.m * P });
              VA.ns.forEach((n, j) => s.on(t => { let k = 0; for (let c = 0; c < VV; c++) { const t2 = dA + c * K.m * P + VA.on[j] * P; k = Math.max(k, win(t, t2 - 0.02, t2 + VA.du[j] * P * 0.85, .05, .1)); } brilloNota(n, k); })); }
            const tIn = (i === 0 ? ta + 0.4 : Wa(cid, ['9x8', '9']) || ta + 3);
            aparece(s, ga, tIn, tSig - 0.15);
          });
          const ch = N.group(g); chip(ch, cfg.chip, 1700, yy[0] - 150, { size: 22, anchor: 'end', fondo: VERDE_OSC }); aparece(s, ch, ta + 1.0, tSig - 0.15);
          // las líneas del modelo siguen arriba (el mismo dibujo)
          altVent.push([ta - 0.1, tSig]);
          return;
        }
        // ---- irregular: el modelo cambia; el borrador (quizá más fino) vuelve con sus líneas; suben otra vez
        const tCambio = Wa(cid, ['funden', 'parte', 'parten']) || ta + 1.5;
        const tLin = Wa(cid, ['linea', 'lineas']) || F1(cid) + 0.15;      // (5-nov) sin decir proporciones: las líneas suben al acabar la frase
        const prev = cur;
        s.on(t => { const k = ramp(t, tCambio - 0.3, tCambio + 0.2); if (t >= ta - 0.2) opa(prev.grupoM, t < tCambio + 0.2 ? 1 - k : 0); });
        mostrarEn(s, prev.etq, 0, ta - 0.1);
        const gI = N.group(gM, 'irr');
        const VI = dibujaVariante(gI, cpM, cfg.v);
        mostrarEn(s, gI, tCambio - 0.1, cid === 'C2' && !(K.C2 && K.C2.tipo === 'alt') ? tSig : b);
        const rot = N.group(g); chip(rot, cfg.rot, X0 - 26, yM - 150, { size: 20, anchor: 'end', fondo: VERDE_OSC });
        aparece(s, rot, tCambio - 0.1, cid === 'C1' && K.C2 && K.C2.tipo === 'alt' ? b : tSig);
        const nomI = N.group(g);
        VI.ns.forEach((n, i) => texto(nomI, cfg.v.nom[i], n.x, yM + 5.4 * SP, { anchor: 'middle', size: 24, peso: 600, fill: SUAVE }));
        mostrarEn(s, nomI, tCambio + 0.2, tLin + 0.8);
        // borrador de ESTE caso (el doble de fino si hace falta): nombres de las figuras que hay y ligaduras solo dentro de cada figura
        const fino = cfg.fino || 1;
        const gV = N.group(gB, 'borrador-' + cid);
        const BV = dibujaBorrador(gV, cpB, fino, cfg.v);
        for (let k = 0; k < K.m; k++) lineaPulso(gV, cpB, k, { y2: 4.9 });      // líneas cortas: no tapan los nombres
        const nomV = N.group(gV); BV.ns.forEach((n, h) => texto(nomV, BV.nomH(h), n.x, yB + 6.0 * SP, { anchor: 'middle', size: BV.H > 14 ? 17 : (BV.H > 10 ? 20 : 24), peso: 600, fill: SUAVE }));
        const ligV = N.group(gV); BV.lig.forEach(([h0, h1]) => ligadura(ligV, BV.ns[h0], BV.ns[h1]));
        const tVin = fino > 1 ? (Wa(cid, ['solucion', 'doble']) || ta + 3) : tCambio;
        mostrarEn(s, gV, tVin - 0.1, tSig);
        ocultaB1.push([tVin, tSig]);
        const Bx = { B: BV };
        if (fino > 1) { const chF = N.group(g); chip(chF, 'BORRADOR × 2 · MÁS FINO', 1700, yB - 150, { size: 20, anchor: 'end', fondo: VERDE_OSC }); aparece(s, chF, tVin + 0.2, (Wa(cid, ['linea', 'lineas']) || tSig) - 0.1); }
        // mientras suena este caso, sus cabezas se iluminan (blanco) en el borrador
        const dI0 = demo(cid);
        BV.ns.forEach((n, h) => s.on(t => { let k = 0; for (let c = 0; c < VV; c++) { const f = BV.figH(h), on0 = tiempos(cfg.v).on[f], du0 = tiempos(cfg.v).du[f], ta2 = dI0 + c * K.m * P + on0 * P; k = Math.max(k, win(t, ta2 - 0.02, ta2 + du0 * P * 0.85, .05, .1)); } brillo(n.cab, k); }));
        zonaOn.push([ta - 0.1, tSig, 1]);       // (5-nov) el borrador del caso se ve entero mientras se explica y suena
        // llaves: cabezas que se funden / que se reparten
        const llaves = N.group(g);
        const H1 = K.m * fino;
        const marca = (h0, h1, txt) => { const x1 = Bx.B.ns[h0].x - 14, x2 = Bx.B.ns[h1].x + 14, y = yB + 7.4 * SP;
          N.el('path', { d: `M${x1},${y - 10} V${y} H${x2} V${y - 10}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 3 }, llaves);
          texto(llaves, txt, (x1 + x2) / 2, y + 30, { anchor: 'middle', size: 22, peso: 800, fill: '#ffffff' }); };
        (cfg.funde || []).forEach(([j0, j1]) => marca(j0 * H1, (j1 + 1) * H1 - 1, ((j1 - j0 + 1) * H1) + ' cabezas'));
        (cfg.parte || []).forEach(j => { const mitad = H1 / 2; marca(j * H1, j * H1 + mitad - 1, mitad + ''); marca(j * H1 + mitad, (j + 1) * H1 - 1, mitad + ''); });
        const tLl = Wa(cid, ['cabezas'], fino > 1 ? 2 : 1) || tCambio + 0.8;
        if (fino > 1) {        // «el re tiene tres cabezas y tres no se reparten en dos» → en el borrador normal
          const tTres = Wa(cid, ['cabezas']) || ta + 2, tF2 = Wa(cid, ['solucion', 'doble']) || ta + 4, nx = N.group(g);
          (cfg.parte || []).forEach(j => { const x1 = B.ns[j * K.m].x - 14, x2 = B.ns[(j + 1) * K.m - 1].x + 14, y = yB + 7.4 * SP;
            N.el('path', { d: `M${x1},${y - 10} V${y} H${x2} V${y - 10}`, fill: 'none', stroke: ROJO, 'stroke-width': 3 }, nx);
            texto(nx, K.m + ' ÷ 2  ✗', (x1 + x2) / 2, y + 30, { anchor: 'middle', size: 24, peso: 800, fill: ROJO }); });
          mostrarEn(s, nx, tTres - 0.2, tF2 + 0.2);
        }
        mostrarEn(s, llaves, tLl - 0.2, tLin + 1.2);
        // las líneas vuelven a subir y aparecen los rótulos de esta variante
        const sube2 = N.group(g); const ls2 = []; for (let k = 0; k < K.m; k++) ls2.push(lineaPulso(sube2, cpB, k));
        s.on(t => { const k = ease(ramp(t, tLin - 0.1, tLin + 1.0)); opa(sube2, t >= tLin - 0.1 && t < tSig ? 1 : 0); pos(sube2, 0, -(yB - yM) * k); });
        s.on(t => opa(sube, t >= tLin - 0.1 && t < tSig ? 0 : ((t >= P5 - 0.1 && t < tFinMetodo + 0.2) || altVent.some(([x0, x1]) => t >= x0 && t < x1) ? 1 : (t >= tSig && t < b ? 1 : 0))));
        const etqI = N.group(g);
        cfg.v.etq.forEach((e, k) => { const tx = texto(etqI, e, cpM.xt(k), yM + 6.9 * SP, { anchor: 'middle', size: K.m > 3 ? 23 : 26, peso: 700, fill: VERDE });
          if (k % 2 === 1 && K.m > 3) tx.setAttribute('y', (yM + 6.9 * SP + 30).toFixed(1));
          opa(tx, 0); });      // (5-nov, Iago) sin rótulos de proporción también en los irregulares
        const dI = demo(cid);
        cabezal(s, g, cpM, dI - 0.25, dI + VV * K.m * P + 0.4, dI, ls2.map((el, k) => ({ t: k, el })).concat(VI.ns.map((n, i) => ({ t: VI.on[i], el: n.g, blanco: true }))), { vuelta: K.m, para: dI + VV * K.m * P });
        VI.ns.forEach((n, i) => s.on(t => { let k = 0; for (let c = 0; c < VV; c++) { const ta2 = dI + c * K.m * P + VI.on[i] * P; k = Math.max(k, win(t, ta2 - 0.02, ta2 + VI.du[i] * P * 0.85, .05, .12)); } brilloNota(n, k); }));
        cur = { grupoM: gI, VM: VI, etq: etqI };
      });
      s.on(t => { let v = 1; for (const [x0, x1] of ocultaB1) if (t >= x0 - 0.2 && t < x1) v = Math.min(v, 1 - ramp(t, x0 - 0.2, x0 + 0.2)); opa(gB1, v); });
      // zona del borrador: opacidad por tramos (el último tramo que contiene t manda)
      s.on(t => { let v = 1; for (const [x0, x1, o] of zonaOn) if (t >= x0 && t < x1) v = o; const sm = v; zonaB.setAttribute('opacity', sm.toFixed(3)); zonaB.style.display = sm < 0.01 ? 'none' : ''; });
      // indicador de pulso durante cada demo
      DAT.demos.forEach(d => { if (d.t0 > 0) latidos(s, g, 190, 940, d.t0, K.vueltas * K.m); });
    });
  }

  // ================================================================ D · estructura + rondas para todos
  function escenaRonda() {
    const a = F0('D1') - 0.2, b = T.acorde - 0.05;      // hasta el acorde final: sin pantalla vacía antes del título
    escena('ronda', a, b, (s, g) => {
      const fondo = N.group(g); panel(fondo, 110, 115, 1700, 930); mostrarEn(s, fondo, a, b, .45, .6);
      const tEst = Wa('D1', ['estructura']) || a + 0.5, tR = Wa('D1', ['rondas', 'ronda']) || tEst + 2;
      const t1 = texto(g, 'ESTRUCTURA · ' + K.titulo, CX, 200, { anchor: 'middle', size: 44, peso: 800, ls: '0.12em', fill: BLANCO });
      aparece(s, t1, tEst - 0.3, tR - 0.1);
      const rc = N.group(g); candado(rc, CX - 190, 268); texto(rc, 'receta desbloqueada', CX - 150, 280, { size: 30, peso: 600, fill: VERDE });
      aparece(s, rc, tEst + 0.4, tR - 0.1);
      {   // la receta: el modelo regular con sus líneas y rótulos
        const { PW, ult } = geometria(); const ge = N.group(g);
        const tmp = compasProp(ge, { x: 0, yMid: 0, ts: K.reg.ts, pulsos: K.m, PW, ultimo: ult }); const xI = CX - tmp.ancho / 2 + 40; ge.removeChild(tmp.g);
        const cp = compasProp(ge, { x: xI, yMid: 560, ts: K.reg.ts, pulsos: K.m, PW, ultimo: ult });
        dibujaVariante(ge, cp, K.reg);
        K.reg.etq.forEach((e, k) => { lineaPulso(ge, cp, k); if (true) return; const tx = texto(ge, e, cp.xt(k), 560 + 6.9 * SP + (k % 2 === 1 && K.m > 3 ? 30 : 0), { anchor: 'middle', size: K.m > 3 ? 24 : 27, peso: 700, fill: VERDE }); });
        aparece(s, ge, tEst - 0.2, tR - 0.1);
      }
      const t2 = texto(g, 'RONDAS PARA TODOS', CX, 200, { anchor: 'middle', size: 44, peso: 800, ls: '0.14em', fill: BLANCO });
      aparece(s, t2, tR - 0.1, b);
      const { PW, ult } = geometria();
      const filas = K.ronda.length, ys = filas === 3 ? [395, 640, 885] : [460, 760];
      const vars = K.ronda.map(([rot, ref]) => { const [k, i] = ref.split('.'); const e = k === 'reg' ? K.reg : (K[k].tipo === 'irr' ? K[k].v : K[k].alts[+(i || 0)]); return [rot, e]; });
      const tFinVoz = F1('D1');
      const paso = Math.max(0.9, (tFinVoz - 0.6 - tR) / filas);
      // momento de cada fila: con las palabras «regular / irregular …» si están; si no, repartidas
      const tFila = vars.map((_, i) => tR + 0.6 + i * paso);
      vars.forEach(([rot, v], i) => {
        const gf = N.group(g, 'fila');
        const cp = compasProp(gf, { x: 560, yMid: ys[i], ts: v.ts, pulsos: K.m, PW: PW * 0.82, ultimo: ult });
        const V = dibujaVariante(gf, cp, v);
        const lns = []; for (let k = 0; k < K.m; k++) lns.push(lineaPulso(gf, cp, k));
        const et = texto(gf, rot, 530, ys[i] + 10, { anchor: 'end', size: 24, peso: 800, ls: '0.1em', fill: SUAVE });
        aparece(s, gf, tFila[i], b);
        s.on(t => { const v2 = win(t, tFila[i], tFila[i] + paso, .2, .4); et.setAttribute('fill', mezcla(SUAVE, VERDE, v2)); });
        cabezal(s, g, cp, tFila[i] + 0.2, b - 0.2, tFila[0] + 0.2, lns.map((el, k) => ({ t: k, el })).concat(V.ns.map((n, j) => ({ t: V.on[j], el: n.g, blanco: true }))), { vuelta: K.m });
      });
    });
  }
  function candado(g, x, y) {
    const c = N.group(g); c.style.color = VERDE;
    N.el('rect', { x: x - 16, y: y - 10, width: 32, height: 26, rx: 5, fill: 'currentColor' }, c);
    N.el('path', { d: `M${x - 10},${y - 10} v-10 a10,10 0 0 1 20,0 v-2`, fill: 'none', stroke: 'currentColor', 'stroke-width': 5, 'stroke-linecap': 'round', transform: `rotate(-24 ${x + 10} ${y - 10})` }, c);
    return c;
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
    escenaTitulo(); escenaA(); escenaMetodo(); escenaRonda(); escenaFinal();
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
