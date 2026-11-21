/* =====================================================================================
   (21-nov-2026, Iago) MATICES Y ARTICULACIÓN en las lecciones generadas · Ritmo entonado at home (2.º GP)
   «Siempre, pocos y sonando»: en cada lección que sale del generador, 2-3 matices (p. ej. mp al principio y f al
   final), un crescendo, un diminuendo y 2-4 acentos o picados. Se dibujan encima de la partitura (tipografía musical
   de la propia partitura) y el audio los respeta (volumen, acento, picado).
   Solo en lecciones GENERADAS (genLessonGP1 / genLessonComb): las del libro no llevan, porque el libro no los tiene.
   Quitar este fichero lo desactiva todo (la línea de pianoHit de index.html sigue funcionando sin él).
   ===================================================================================== */
(function(){
  'use strict';
  if (typeof renderLesson !== 'function' || typeof buildSchedule !== 'function') return;
  var NIV = { pp: 0.4, p: 0.55, mp: 0.7, mf: 0.82, f: 1, ff: 1.12 };
  var DYN = { p: ['dynamicPiano'], f: ['dynamicForte'], mp: ['dynamicMezzo','dynamicPiano'], mf: ['dynamicMezzo','dynamicForte'], pp: ['dynamicPiano','dynamicPiano'], ff: ['dynamicForte','dynamicForte'] };

  function hashL(L){ var s = (L.tonic || '') + (L.modo || '') + L.phrases.length; L.phrases.forEach(function(p){ p.measures.forEach(function(m){ s += m.time; m.notes.forEach(function(n){ s += n.dur + (n.midi || 0); }); }); }); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; }
  function rnd(seed){ var x = seed >>> 0 || 1; return function(){ x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; }

  /* notas que suenan de cada pentagrama: [{pi, mi, k, n, m}] */
  function sonantes(L, pi){ var out = []; L.phrases[pi].measures.forEach(function(m, mi){ m.notes.forEach(function(n, k){ if (!n.rest && !n.barline && n.tieFrom == null) out.push({ pi: pi, mi: mi, k: k, n: n, m: m }); }); }); return out; }
  function enGrupo(x){ return !!(x.m.groupInfo && x.m.groupInfo.idx.indexOf(x.k) >= 0); }

  function asignar(L){
    if (!L || !L.phrases || !L.phrases.length || L.matices) return L;
    try {
      var r = rnd(hashL(L)); var pick = function(a){ return a[Math.floor(r() * a.length)]; };
      var n = L.phrases.length; var M = { dyn: [], cresc: [], dim: [], acc: [], stac: [] };
      var primero = function(pi){ var s = sonantes(L, pi); return s.length ? s[0] : null; };
      // matices: al principio, a mitad y (si hay 6-7 pentagramas) al final, contrastando
      var plan = pick([['mp','f'],['f','p'],['mf','p'],['p','mf'],['mp','mf'],['f','mp']]);
      var d0 = primero(0); if (d0) M.dyn.push([0, d0.mi, d0.k, plan[0]]);
      var piMid = Math.max(1, Math.floor(n / 2) + (r() < 0.5 ? 0 : -1)); var d1 = primero(piMid); if (d1) M.dyn.push([piMid, d1.mi, d1.k, plan[1]]);
      var piFin = n - 1;
      if (n >= 6 && piFin !== piMid) { var fin = sonantes(L, piFin); var dl = fin.length ? fin[fin.length - 1] : null; var vF = plan[1] === 'f' ? 'p' : 'f'; if (dl) M.dyn.push([piFin, dl.mi, dl.k, vF]); }
      // crescendo y diminuendo: 3-5 notas seguidas dentro de un pentagrama (el cresc. antes de subir, el dim. antes de bajar)
      var tramo = function(pi, alFinal){ var s = sonantes(L, pi).filter(function(x){ return !x.n.cad; }); if (s.length < 4) return null; var len = Math.min(s.length - 1, 3 + Math.floor(r() * 3)); var a = alFinal ? s.length - 1 - len : Math.floor(r() * (s.length - len)); a = Math.max(0, a); var b = Math.min(s.length - 1, a + len); return [[s[a].pi, s[a].mi, s[a].k], [s[b].pi, s[b].mi, s[b].k]]; };
      var usados = {};
      var sube = NIV[plan[1]] > NIV[plan[0]];
      var piC = sube ? Math.max(0, piMid - 1) : Math.min(n - 1, piMid + 1);
      var tC = tramo(piC, sube); if (!tC) { for (var z = 0; z < n && !tC; z++) { if (z === piC) continue; tC = tramo(z, sube); if (tC) piC = z; } } if (tC) { M.cresc.push(tC); usados[piC] = 1; }
      var cands = []; for (var i = 0; i < n; i++) if (!usados[i] && i !== 0) cands.push(i);
      var piD = sube ? (cands.filter(function(i){ return i > piMid; })[0] != null ? cands.filter(function(i){ return i > piMid; })[0] : pick(cands)) : Math.max(0, piMid - 1);
      if (usados[piD]) piD = pick(cands.length ? cands : [n - 1]);
      var tD = tramo(piD, !sube); if (!tD) { for (var z2 = n - 1; z2 >= 0 && !tD; z2--) { if (usados[z2]) continue; tD = tramo(z2, !sube); if (tD) piD = z2; } } if (tD) { M.dim.push(tD); usados[piD] = 1; }
      // articulación: 1-2 acentos (en parte fuerte, figura de negra o más) y 1-2 parejas de picados (corcheas o negras)
      var nAcc = 1 + Math.floor(r() * 2), nSt = 1 + Math.floor(r() * 2);
      var ordenPi = []; for (var q = 0; q < n; q++) ordenPi.push(q); ordenPi.sort(function(){ return r() - 0.5; });
      ordenPi.forEach(function(pi){
        var s = sonantes(L, pi);
        if (M.acc.length < nAcc) { var c = s.filter(function(x){ return x.k === 0 && !x.n.cad && ['q','qd','h','hd','8d'].indexOf(x.n.dur) >= 0 || (x.k === 0 && enGrupo(x)); }); if (c.length) { var x = pick(c); M.acc.push([x.pi, x.mi, x.k]); return; } }
        if (M.stac.length < nSt * 2) { var par = []; for (var j = 0; j + 1 < s.length; j++) { var a = s[j], b = s[j + 1]; if (a.mi === b.mi && !enGrupo(a) && !enGrupo(b) && !a.n.cad && !b.n.cad && ['8','q'].indexOf(a.n.dur) >= 0 && a.n.dur === b.n.dur) par.push([a, b]); } if (par.length) { var pp = pick(par); M.stac.push([pp[0].pi, pp[0].mi, pp[0].k], [pp[1].pi, pp[1].mi, pp[1].k]); } }
      });
      L.matices = M;
    } catch (e) { if (window.console) console.warn('[matices]', e); }
    return L;
  }

  /* ---------- dibujo ---------- */
  var VFx = (window.Vex && Vex.Flow) || window.VF;
  function glyphPath(code, x, y, pt){
    var d = ''; var f = function(v){ return (+v).toFixed(2); };
    var ctx = new Proxy({}, { get: function(t, k){
      if (k === 'moveTo') return function(a, b){ d += 'M' + f(a) + ' ' + f(b); };
      if (k === 'lineTo') return function(a, b){ d += 'L' + f(a) + ' ' + f(b); };
      if (k === 'bezierCurveTo') return function(a, b, c, e, g, h){ d += 'C' + [a, b, c, e, g, h].map(f).join(' '); };
      if (k === 'quadraticCurveTo') return function(a, b, c, e){ d += 'Q' + [a, b, c, e].map(f).join(' '); };
      if (k === 'closePath') return function(){ d += 'Z'; };
      return function(){ return ctx; }; } });
    VFx.Glyph.renderGlyph(ctx, x, y, pt, code); return d;
  }
  function glyphW(code, pt){ try { return new VFx.Glyph(code, pt).getMetrics().width; } catch (e) { return pt * 0.4; } }

  function dibujar(container, L){
    var M = L && L.matices; if (!M) return;
    var svg = container && container.querySelector('svg'); if (!svg) return;
    try {
      svg.querySelectorAll('.rp-mat').forEach(function(e){ e.remove(); });
      var NS = 'http://www.w3.org/2000/svg';
      var idx = {}, g = 0;
      L.phrases.forEach(function(p, pi){ p.measures.forEach(function(m, mi){ m.notes.forEach(function(n, k){ if (n.barline) return; idx[pi + '.' + mi + '.' + k] = g++; }); }); });
      var els = Array.prototype.slice.call(svg.querySelectorAll('g.vf-stavenote'));
      if (els.length !== g) return;   // si no cuadra, no se dibuja nada (antes que pintar en mal sitio)
      var staves = Array.prototype.map.call(svg.querySelectorAll('g.vf-stave'), function(s){ return s.getBBox(); });
      var beams = Array.prototype.map.call(svg.querySelectorAll('g.vf-beam'), function(b){ return b.getBBox(); });
      var add = function(tag, at){ var e = document.createElementNS(NS, tag); e.setAttribute('class', 'rp-mat'); for (var a in at) e.setAttribute(a, at[a]); svg.appendChild(e); return e; };
      var info = function(t){ var el = els[idx[t.join('.')]]; if (!el) return null; var h = el.querySelector('.vf-notehead') || el; var b = h.getBBox(); var x = b.x + b.width / 2, y = b.y + b.height / 2;
        var best = null, bd = 1e9; staves.forEach(function(s){ if (x < s.x - 2 || x > s.x + s.width + 2) return; var d = Math.abs(s.y + s.height / 2 - y); if (d < bd) { bd = d; best = s; } });
        return best ? { x: x, y: y, b: b, st: best, eb: el.getBBox(), el: el } : null; };
      var bajoDe = function(st, x0, x1, base){ var low = base; beams.forEach(function(bb){ if (bb.x + bb.width < x0 || bb.x > x1) return; if (bb.y > st.y + st.height + 60 || bb.y + bb.height < st.y - 20) return; low = Math.max(low, bb.y + bb.height); }); return low; };
      var col = '#111';
      M.dyn.forEach(function(d){ var i = info(d.slice(0, 3)); if (!i) return;
        var y = Math.max(i.st.y + i.st.height + 24, i.eb.y + i.eb.height + 17); y = Math.max(y, bajoDe(i.st, i.x - 12, i.x + 20, 0) + 17);
        var xx = i.x - 6; (DYN[d[3]] || []).forEach(function(c){ add('path', { d: glyphPath(c, xx, y + 6, 34), fill: col }); xx += glyphW(c, 34) - 1; }); });
      var horquilla = function(t, abre){ var a = info(t[0]), b = info(t[1]); if (!a || !b || Math.abs(a.st.y - b.st.y) > 4) return;
        var i0 = idx[t[0].join('.')], i1 = idx[t[1].join('.')]; var low = a.st.y + a.st.height + 14;
        for (var k = i0; k <= i1; k++) { var bb = els[k].getBBox(); low = Math.max(low, bb.y + bb.height + 10); }
        low = Math.max(low, bajoDe(a.st, els[i0].getBBox().x, els[i1].getBBox().x + els[i1].getBBox().width, 0) + 10);
        var y = low + 4, x1 = a.x, x2 = b.x + 8;
        var dd = abre ? ('M' + x2 + ' ' + (y - 5) + ' L' + x1 + ' ' + y + ' L' + x2 + ' ' + (y + 5)) : ('M' + x1 + ' ' + (y - 5) + ' L' + x2 + ' ' + y + ' L' + x1 + ' ' + (y + 5));
        add('path', { d: dd, fill: 'none', stroke: col, 'stroke-width': '1.2' }); };
      M.cresc.forEach(function(t){ horquilla(t, true); });
      M.dim.forEach(function(t){ horquilla(t, false); });
      M.acc.forEach(function(t){ var i = info(t); if (!i) return; var mid = i.st.y + i.st.height / 2; var y = (i.y > mid) ? (i.b.y + i.b.height + 9) : (i.b.y - 9);
        add('path', { d: 'M' + (i.x - 5) + ' ' + (y - 4) + ' L' + (i.x + 5) + ' ' + y + ' L' + (i.x - 5) + ' ' + (y + 4), fill: 'none', stroke: col, 'stroke-width': '1.4' }); });
      M.stac.forEach(function(t){ var i = info(t); if (!i) return; var mid = i.st.y + i.st.height / 2; var dy = (i.y > mid) ? 11 : -11; add('circle', { cx: i.x, cy: i.y + dy, r: '1.9', fill: col }); });
      // que nada se salga del dibujo
      try { var vb = (svg.getAttribute('viewBox') || '').split(/[ ,]+/).map(Number); var bb = svg.getBBox(); if (vb.length === 4 && bb.y + bb.height + 6 > vb[1] + vb[3]) svg.setAttribute('viewBox', vb[0] + ' ' + vb[1] + ' ' + vb[2] + ' ' + (bb.y + bb.height + 6 - vb[1])); } catch (e) {}
    } catch (e) { if (window.console) console.warn('[matices] dibujo', e); }
  }

  /* ---------- volumen por nota ---------- */
  function niveles(L){
    var M = L.matices; var lista = []; var pos = {};
    L.phrases.forEach(function(p, pi){ p.measures.forEach(function(m, mi){ m.notes.forEach(function(n, k){ if (!n.rest && !n.barline) { pos[pi + '.' + mi + '.' + k] = lista.length; lista.push(null); } }); }); });
    M.dyn.forEach(function(d){ var i = pos[d.slice(0, 3).join('.')]; if (i != null) lista[i] = NIV[d[3]] || 0.82; });
    var cur = 0.82; for (var i = 0; i < lista.length; i++) { if (lista[i] == null) lista[i] = cur; else cur = lista[i]; }
    var rampa = function(t, sube){ var i0 = pos[t[0].join('.')], i1 = pos[t[1].join('.')]; if (i0 == null || i1 == null) return; var a = lista[i0]; var b = sube ? Math.min(1.12, a + 0.25) : Math.max(0.4, a - 0.25);
      var sig = null; for (var k = i1 + 1; k < lista.length; k++) if (lista[k] !== lista[i1]) { sig = lista[k]; break; }
      if (sig != null && ((sube && sig > a) || (!sube && sig < a))) b = sig;
      for (var k2 = i0; k2 <= i1; k2++) lista[k2] = a + (b - a) * (k2 - i0) / Math.max(1, i1 - i0);
      for (var k3 = i1 + 1; k3 < lista.length && (sig == null || lista[k3] !== sig); k3++) lista[k3] = b; };
    M.cresc.forEach(function(t){ rampa(t, true); }); M.dim.forEach(function(t){ rampa(t, false); });
    var acc = {}, st = {}; M.acc.forEach(function(t){ acc[t.join('.')] = 1; }); M.stac.forEach(function(t){ st[t.join('.')] = 1; });
    return { lista: lista, pos: pos, acc: acc, st: st };
  }

  /* ---------- enganches ---------- */
  var gp1 = genLessonGP1; genLessonGP1 = function(){ var L = gp1.apply(this, arguments); return window.__rpSinMat ? L : asignar(L); };
  var comb = genLessonComb; genLessonComb = function(){ return asignar(comb.apply(this, arguments)); };
  var rl = renderLesson; renderLesson = function(container, L){ var r = rl.apply(this, arguments); try { dibujar(container, L); } catch (e) {} return r; };
  var bs = buildSchedule; buildSchedule = function(L){ var S = bs.apply(this, arguments);
    try { if (L && L.matices && S && S.notes) { var N = niveles(L); S.notes.forEach(function(o){ var key = o.pi + '.' + o.mi + '.' + o.k; var i = N.pos[key]; var v = (i != null) ? N.lista[i] : 1; if (N.acc[key]) v *= 1.3; o.vel = v / 0.82; if (N.st[key]) o.stac = true; }); } } catch (e) {}
    return S; };
  window.RP_MATICES = { asignar: asignar, dibujar: dibujar };
})();
