/* =====================================================================================
   (21-nov-2026, Iago) MATICES Y ARTICULACIÓN en las lecciones generadas · Ritmo entonado at home (2.º GP)
   «Siempre, pocos y sonando»: en cada lección que sale del generador, 2-3 matices (p. ej. mp al principio y f al
   final), un crescendo, un diminuendo y (16:53) mucha articulación: picados en casi cada pentagrama, ligaduras de
   expresión (~una por pentagrama), 2-3 acentos y 1-2 tenutos. Se dibujan encima de la partitura (tipografía musical
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
      // (21-nov-2026, Iago 16:52-16:53: «echo de menos algún picado más… y alguna ligadura de expresión»; «mucha articulación»)
      // ligaduras de expresión (una por pentagrama más o menos, de 3-5 notas por grados o terceras: con 2 parecían ligaduras de unión), picados en casi todos los pentagramas (grupos de 2-3),
      // 2-3 acentos y 1-2 tenutos. Una sola articulación por nota.
      M.ten = []; M.slur = [];
      var usada = {}; var u = function(x){ return x.pi + '.' + x.mi + '.' + x.k; };
      var ligada = function(x){ return x.n.tieFrom != null || !!x.n.tieTo || !!x.n.tieNext || (x.m.ties || []).some(function(p){ return p[0] === x.k || p[1] === x.k; }); };   // ligaduras de unión (GE: m.ties)
      var libre = function(x){ return !usada[u(x)] && !x.n.cad && !enGrupo(x) && !ligada(x); };
      var marca = function(x){ usada[u(x)] = 1; };
      M.dyn.forEach(function(d){ usada[d[0] + '.' + d[1] + '.' + d[2]] = 1; });   // con matiz debajo, sin articulación (no se pisan)
      var orden = function(){ var o = []; for (var q = 0; q < n; q++) o.push(q); for (var q2 = o.length - 1; q2 > 0; q2--) { var j2 = Math.floor(r() * (q2 + 1)); var t2 = o[q2]; o[q2] = o[j2]; o[j2] = t2; } return o; };
      var contiguas = function(xs){ for (var c = 1; c < xs.length; c++) { if (xs[c].mi !== xs[0].mi || xs[c].k !== xs[c - 1].k + 1) return false; } return true; };
      var nSl = Math.max(3, n - (r() < 0.5 ? 0 : 1)), stSl = {};   // (17:10, Iago: «lo habitual es que haya más») ~una por pentagrama
      orden().forEach(function(pi){
        if (M.slur.length >= nSl) return; var s = sonantes(L, pi); var cand = [];
        for (var j = 0; j < s.length; j++) for (var len = 3; len <= 5; len++) { var xs = s.slice(j, j + len); if (xs.length < len || !contiguas(xs) || !xs.every(libre)) continue;
          if (!xs.every(function(x){ return ['8','16','8d','q'].indexOf(x.n.dur) >= 0 && x.n.midi; })) continue;
          var ok = true, mueve = false; for (var c = 1; c < xs.length; c++) { var dm = Math.abs(xs[c].n.midi - xs[c - 1].n.midi); if (dm > 4) ok = false; if (dm > 0 && dm <= 2) mueve = true; }   // grados o terceras, con algún paso por grado
          if (ok && mueve) cand.push(xs); }
        if (!cand.length) return; var xs2 = pick(cand); xs2.forEach(marca); stSl[pi] = 1;
        M.slur.push([[xs2[0].pi, xs2[0].mi, xs2[0].k], [xs2[xs2.length - 1].pi, xs2[xs2.length - 1].mi, xs2[xs2.length - 1].k]]); });
      // picados: un grupo de 2-3 notas iguales (corcheas, negras o semicorcheas sueltas) en casi cada pentagrama
      var nStG = Math.max(3, n - 1), grupos = 0;
      orden().forEach(function(pi){
        if (grupos >= nStG) return; var s = sonantes(L, pi); var cand = [];
        var busca = function(figs){ var cc = []; for (var j = 0; j + 1 < s.length; j++) { var len = (r() < 0.5) ? 3 : 2; var xs = s.slice(j, j + len); if (xs.length < 2) continue; if (!contiguas(xs) || !xs.every(libre)) continue;
          if (!xs.every(function(x){ return figs.indexOf(x.n.dur) >= 0 && x.n.dur === xs[0].n.dur; })) continue; cc.push(xs); } return cc; };
        cand = busca(['8','q']); if (!cand.length) cand = busca(['16']);
        if (!cand.length) return; var xs3 = pick(cand); xs3.forEach(function(x){ marca(x); M.stac.push([x.pi, x.mi, x.k]); }); grupos++; });
      // acentos: 2-3, en la primera nota de un compás (figura larga)
      var nAcc = 2 + (r() < 0.5 ? 1 : 0);
      orden().forEach(function(pi){
        if (M.acc.length >= nAcc) return; var s = sonantes(L, pi);
        var c = s.filter(function(x){ return x.k === 0 && !usada[u(x)] && !x.n.cad && !enGrupo(x) && !ligada(x) && ['q','qd','h','hd','8d'].indexOf(x.n.dur) >= 0; });   // (no en grupos: chocaba con el corchete)
        if (c.length) { var x = pick(c); marca(x); M.acc.push([x.pi, x.mi, x.k]); } });
      // tenutos: 1-2, en notas largas
      var nTen = 1 + (r() < 0.5 ? 1 : 0);
      orden().forEach(function(pi){
        if (M.ten.length >= nTen) return; var s = sonantes(L, pi);
        var c = s.filter(function(x){ return libre(x) && ['q','qd','h','hd'].indexOf(x.n.dur) >= 0; });
        if (c.length) { var x = pick(c); marca(x); M.ten.push([x.pi, x.mi, x.k]); } });
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
      var cabeza = function(el){ var g = el.querySelector('.vf-notehead'); if (!g) return el.getBBox(); var ps = Array.prototype.map.call(g.querySelectorAll('path'), function(p){ return p.getBBox(); }).filter(function(b){ return b.height > 3; });
        if (!ps.length) return g.getBBox(); ps.sort(function(a, b){ return Math.abs(a.height - 10) - Math.abs(b.height - 10); }); return ps[0]; };   // (la alteración va en el mismo grupo que la cabeza)
      var info = function(t){ var el = els[idx[t.join('.')]]; if (!el) return null; var b = cabeza(el); var x = b.x + b.width / 2, y = b.y + b.height / 2;
        var best = null, bd = 1e9; staves.forEach(function(s){ if (x < s.x - 2 || x > s.x + s.width + 2) return; var d = Math.abs(s.y + s.height / 2 - y); if (d < bd) { bd = d; best = s; } });
        return best ? { x: x, y: y, b: b, st: best, eb: el.getBBox(), el: el } : null; };
      var bajoDe = function(st, x0, x1, base){ var low = base; beams.forEach(function(bb){ if (bb.x + bb.width < x0 || bb.x > x1) return; if (bb.y > st.y + st.height + 60 || bb.y + bb.height < st.y - 20) return; low = Math.max(low, bb.y + bb.height); }); return low; };
      var col = '#111';
      var plicaArriba = function(i){ var st = i.el.querySelector('.vf-stem'); if (st) { var sb = st.getBBox(); if (sb.height > 2) return (sb.y + sb.height / 2) < i.y; } return i.y > i.st.y + i.st.height / 2; };
      var lado = function(i, dist){ return plicaArriba(i) ? (i.b.y + i.b.height + dist) : (i.b.y - dist); };
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
      M.acc.forEach(function(t){ var i = info(t); if (!i) return; var y = lado(i, 8);
        add('path', { d: 'M' + (i.x - 5) + ' ' + (y - 4) + ' L' + (i.x + 5) + ' ' + y + ' L' + (i.x - 5) + ' ' + (y + 4), fill: 'none', stroke: col, 'stroke-width': '1.4' }); });
      M.stac.forEach(function(t){ var i = info(t); if (!i) return; add('circle', { cx: i.x, cy: lado(i, 5), r: '1.9', fill: col }); });
      (M.ten || []).forEach(function(t){ var i = info(t); if (!i) return; var y = lado(i, 5.5); add('rect', { x: i.x - 5, y: y - 0.8, width: 10, height: 1.6, fill: col }); });
      (M.slur || []).forEach(function(t){ var a = info(t[0]), b = info(t[1]); if (!a || !b || Math.abs(a.st.y - b.st.y) > 4) return;
        var i0 = idx[t[0].join('.')], i1 = idx[t[1].join('.')];
        var abajo = plicaArriba(a) && plicaArriba(b), arriba = !plicaArriba(a) && !plicaArriba(b);
        var cab = function(k){ return cabeza(els[k]); };
        var y1, y2, ext, dy;
        if (abajo) { dy = 1; y1 = a.b.y + a.b.height + 3; y2 = b.b.y + b.b.height + 3; ext = Math.max(y1, y2); for (var k = i0 + 1; k < i1; k++) { var hb = cab(k); ext = Math.max(ext, hb.y + hb.height + 3); } }
        else if (arriba) { dy = -1; y1 = a.b.y - 3; y2 = b.b.y - 3; ext = Math.min(y1, y2); for (var k2 = i0 + 1; k2 < i1; k2++) { var hb2 = cab(k2); ext = Math.min(ext, hb2.y - 3); } }
        else { dy = -1; ext = 1e9; for (var k3 = i0; k3 <= i1; k3++) ext = Math.min(ext, els[k3].getBBox().y - 4); y1 = ext + 4; y2 = ext + 4; }   // plicas mezcladas: por encima de todo
        var x1 = a.x + 1, x2 = b.x - 1; var h = Math.max(6, Math.abs(ext - (y1 + y2) / 2) + 5) * dy; var c1 = x1 + (x2 - x1) * 0.25, c2 = x1 + (x2 - x1) * 0.75, gr = 1.6 * dy;
        add('path', { d: 'M' + x1 + ' ' + y1 + ' C' + c1 + ' ' + (y1 + h) + ' ' + c2 + ' ' + (y2 + h) + ' ' + x2 + ' ' + y2 + ' C' + c2 + ' ' + (y2 + h + gr) + ' ' + c1 + ' ' + (y1 + h + gr) + ' ' + x1 + ' ' + y1 + ' Z', fill: col }); });
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
    var acc = {}, st = {}; M.acc.forEach(function(t){ acc[t.join('.')] = 1; }); M.stac.forEach(function(t){ st[t.join('.')] = 1; }); (M.ten || []).forEach(function(t){ acc[t.join('.')] = 0.5; });
    return { lista: lista, pos: pos, acc: acc, st: st };
  }

  /* ---------- enganches ---------- */
  var gp1 = genLessonGP1; genLessonGP1 = function(){ var L = gp1.apply(this, arguments); return window.__rpSinMat ? L : asignar(L); };
  var comb = genLessonComb; genLessonComb = function(){ return asignar(comb.apply(this, arguments)); };
  var rl = renderLesson; renderLesson = function(container, L){ var r = rl.apply(this, arguments); try { dibujar(container, L); } catch (e) {} return r; };
  var bs = buildSchedule; buildSchedule = function(L){ var S = bs.apply(this, arguments);
    try { if (L && L.matices && S && S.notes) { var N = niveles(L); S.notes.forEach(function(o){ var key = o.pi + '.' + o.mi + '.' + o.k; var i = N.pos[key]; var v = (i != null) ? N.lista[i] : 1; if (N.acc[key]) v *= (N.acc[key] === 0.5 ? 1.1 : 1.3); o.vel = v / 0.82; if (N.st[key]) o.stac = true; }); } } catch (e) {}
    return S; };
  window.RP_MATICES = { asignar: asignar, dibujar: dibujar };
})();
