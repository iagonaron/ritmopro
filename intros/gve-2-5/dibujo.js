/* =====================================================================
   DIBUJO · piezas visuales comunes de las intros (estética del Diario)
   Colores lisos, contornos finos, esquinas suaves, rosa = teoría.
   Todo en un SVG de 1920×1080 que se escala a la pantalla.
   ===================================================================== */
(function () {
  'use strict';
  const N = window.NOTA;
  const el = N.el;

  const C = {
    blanco: '#f8fafc', texto: '#e8eef5', suave: '#94a3b8', tenue: '#64748b',
    rosa: '#ec4899', rosaClaro: '#f9a8d4', rojo: '#ff6b6b', verde: '#4ade80',
    oro: '#d4af37', panel: 'rgba(11,19,32,0.88)', borde: 'rgba(255,255,255,0.14)',
    agua: '#4a9eff', aceite: '#fbbf24',
  };
  const FT = '"Helvetica Neue", Helvetica, "TeX Gyre Heros", Arial, sans-serif';

  // ------------------------------------------------------------ utilidades de tiempo
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ramp = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a));
  const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const eo = x => 1 - Math.pow(1 - x, 3);
  const lerp = (a, b, k) => a + (b - a) * k;
  /** Ventana de visibilidad: entra en [a, a+fi], sale en [b-fo, b]. */
  const win = (t, a, b, fi = .5, fo = .5) => Math.min(ease(ramp(t, a, a + fi)), 1 - ease(ramp(t, b - fo, b)));

  function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mezcla(c1, c2, k) {
    const a = hex2rgb(c1), b = hex2rgb(c2);
    return `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`;
  }

  // ------------------------------------------------------------ piezas
  function texto(parent, str, x, y, o) {
    o = o || {};
    const t = el('text', {
      x, y, 'text-anchor': o.anchor || 'start', fill: o.fill || 'currentColor',
      'font-size': o.size || 32, 'font-weight': o.peso || 400,
      'letter-spacing': o.ls != null ? o.ls : null, 'font-style': o.italic ? 'italic' : null,
      'dominant-baseline': o.baseline || null, opacity: o.opacity != null ? o.opacity : null,
    }, parent);
    t.style.fontFamily = o.familia || FT;
    if (o.color) t.style.color = o.color;
    if (Array.isArray(str)) {           // trozos con color propio: [['texto', '#color'], …]
      for (const [s, c, extra] of str) {
        const sp = el('tspan', { fill: c || 'currentColor' }, t);
        if (extra) for (const k in extra) sp.setAttribute(k, extra[k]);
        sp.textContent = s;
      }
    } else t.textContent = str;
    return t;
  }

  function panel(parent, x, y, w, h, o) {
    o = o || {};
    return el('rect', { x, y, width: w, height: h, rx: o.rx || 18, fill: o.fill || C.panel,
      stroke: o.stroke || C.borde, 'stroke-width': o.sw || 1.5 }, parent);
  }

  /** Etiqueta rectangular (chip). relleno: true = rosa lleno; false = contorno. */
  function chip(parent, str, x, y, o) {
    o = o || {};
    const g = N.group(parent, 'chip');
    const size = o.size || 22, padX = o.padX || 18, h = o.h || size * 1.9;
    const t = texto(g, str, 0, 0, { size, peso: o.peso || 800, ls: o.ls != null ? o.ls : '0.14em', anchor: 'start' });
    const wt = medir(t), w = wt + padX * 2 + (o.extraW || 0);
    // (29-sep-2026) el texto ocupa exactamente lo medido: nunca se sale de su cartel, sea cual sea el ordenador
    if (wt > 0) { t.setAttribute('textLength', wt.toFixed(1)); t.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
    const r = el('rect', { x: 0, y: -h / 2, width: w, height: h, rx: o.rx || 8,
      fill: o.relleno === false ? 'none' : (o.fondo || C.rosa), stroke: o.borde || (o.relleno === false ? C.rosa : 'none'),
      'stroke-width': o.relleno === false ? 2 : 0 }, g);
    g.insertBefore(r, t);
    t.setAttribute('x', padX); t.setAttribute('y', size * 0.36);
    t.setAttribute('fill', o.colorTexto || (o.relleno === false ? C.rosa : '#ffffff'));
    const ax = o.anchor === 'middle' ? x - w / 2 : (o.anchor === 'end' ? x - w : x);
    g.setAttribute('transform', `translate(${ax},${y})`);
    g._w = w; g._h = h; g._x = ax; g._y = y; g._rect = r; g._txt = t;
    return g;
  }

  // medición de texto (con el SVG ya en el documento)
  // (29-sep-2026) Hay Chrome (p. ej. el de la pantalla del aula) cuyo getComputedTextLength NO cuenta el espaciado entre
  // letras (letter-spacing) aunque sí lo pinta: los carteles con espaciado se quedaban cortos. Se comprueba una vez y,
  // si pasa, se suma a mano (espaciado × nº de letras).
  let LS_FUERA = null;
  function lsFuera(svg) {
    if (LS_FUERA !== null || !svg) return !!LS_FUERA;
    try {
      const p = el('text', { x: -9999, y: -9999, 'font-size': 40, 'font-weight': 800 }, svg);
      p.style.fontFamily = FT; p.textContent = 'MMMMMMMMMM';
      const a = p.getComputedTextLength(); p.setAttribute('letter-spacing', '0.5em');
      const b = p.getComputedTextLength(); p.remove();
      LS_FUERA = a > 0 && (b - a) < 100;        // con el espaciado deberían ser 200 px más
    } catch (e) { LS_FUERA = false; }
    return LS_FUERA;
  }
  function espaciado(t) {
    const v = t.getAttribute('letter-spacing') || getComputedStyle(t).letterSpacing || '';
    if (!v || v === 'normal') return 0;
    const n = parseFloat(v); if (!isFinite(n)) return 0;
    if (/em$/.test(v)) return n * (parseFloat(t.getAttribute('font-size')) || parseFloat(getComputedStyle(t).fontSize) || 32);
    return n;
  }
  function medir(t) {
    let w;
    try { w = t.getComputedTextLength(); } catch (e) { return (t.textContent || '').length * 14; }
    if (lsFuera(t.ownerSVGElement)) { const ls = espaciado(t); if (ls) w += ls * Array.from(t.textContent || '').length; }
    return w;
  }

  function flecha(parent, x1, y1, x2, y2, o) {
    o = o || {};
    const g = N.group(parent, 'flecha');
    const w = o.w || 3, cab = o.cab || 14;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const xb = x2 - Math.cos(ang) * cab * 0.8, yb = y2 - Math.sin(ang) * cab * 0.8;
    N.line(g, x1, y1, xb, yb, w, { 'stroke-linecap': 'round' });
    const p = (a, r) => `${(x2 - Math.cos(ang + a) * r).toFixed(1)},${(y2 - Math.sin(ang + a) * r).toFixed(1)}`;
    el('polygon', { points: `${x2},${y2} ${p(0.42, cab)} ${p(-0.42, cab)}`, fill: 'currentColor' }, g);
    return g;
  }

  /** Marca ✗ dibujada (dos trazos). */
  function aspa(parent, x, y, r, w) {
    const g = N.group(parent, 'aspa');
    N.line(g, x - r, y - r, x + r, y + r, w || 6, { 'stroke-linecap': 'round' });
    N.line(g, x - r, y + r, x + r, y - r, w || 6, { 'stroke-linecap': 'round' });
    return g;
  }
  /** Marca ✓ dibujada. */
  function tick(parent, x, y, r, w) {
    const g = N.group(parent, 'tick');
    el('polyline', { points: `${x - r},${y} ${x - r * 0.3},${y + r * 0.7} ${x + r},${y - r * 0.8}`, fill: 'none',
      stroke: 'currentColor', 'stroke-width': w || 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    return g;
  }

  function foto(parent, href, x, y, w, h, o) {
    o = o || {};
    const g = N.group(parent, 'foto');
    const clipId = 'clip' + Math.random().toString(36).slice(2, 8);
    const defs = el('defs', null, g);
    const cp = el('clipPath', { id: clipId }, defs);
    el('rect', { x, y, width: w, height: h, rx: o.rx || 14 }, cp);
    const img = el('image', { href, x, y, width: w, height: h, preserveAspectRatio: o.par || 'xMidYMid slice', 'clip-path': `url(#${clipId})` }, g);
    if (o.filtro) img.style.filter = o.filtro;
    el('rect', { x, y, width: w, height: h, rx: o.rx || 14, fill: 'none', stroke: o.borde || 'rgba(255,255,255,0.28)', 'stroke-width': 2 }, g);
    g._img = img;
    return g;
  }

  /** Posiciona un grupo con traslación + escala (desde su origen). */
  function pos(g, x, y, s) { g.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)})${s != null && s !== 1 ? ` scale(${s.toFixed(4)})` : ''}`); }
  function opa(g, v) { g.setAttribute('opacity', clamp(v).toFixed(3)); g.style.display = v <= 0.001 ? 'none' : ''; }
  function color(g, c) { g.style.color = c; }

  window.DIB = { C, FT, clamp, ramp, ease, eo, lerp, win, mezcla, texto, panel, chip, medir, flecha, aspa, tick, foto, pos, opa, color };
})();
