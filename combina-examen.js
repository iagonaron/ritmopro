/* =====================================================================================
   (21-nov-2026, Iago) COMBINA MUNDOS «con forma de examen» · Ritmo entonado at home (2.º GP)
   Lo pidió así, después de validar el examen de ampliación de Alejandro:
   · 1 o 2 mundos → 5 pentagramas · 3 mundos → 6 · 4 mundos → 7.
   · Cada mundo marcado tiene presencia, con cartas distintas de una lección a otra (no siempre lo mismo).
   · Mundo 2 (GVE): grupos de varios pulsos irregulares y regulares (distintos entre sí, nada de dos tresillos),
     nunca seguidos, más grupos EN UN PULSO (5, 6 o 7 por pulso). Cuántos, según los mundos marcados (Iago 14:34):
     3-4 mundos → 2 pentagramas (1 irr + 2 reg + 1-2 de un pulso) · 2 mundos → 3 pentagramas (2 irr + 3 reg + 2-3)
     · solo el mundo 2 → 5 pentagramas (3 irr + 4 reg + 4-5). Más o menos, cada dos compases pasa algo.
   · Mundo 4 (claves… o no): un pentagrama con una de sus cartas al azar (clave de do en 3.ª/4.ª, otra clave o sin
     clave), claramente MÁS FÁCIL: figuras de pulso y poco más, por grados; y el pentagrama anterior acaba en silencio.
   · Mundo 3: siempre las fusas en pulso de corchea; el resto, otra de sus cartas.
   · Un pentagrama por carta (cartas distintas), salvo el mundo 2, que ocupa 2, 3 o 5 pentagramas (ver arriba).
   Si algo falla, sigue el generador de siempre (genLessonComb). Quitar este fichero lo desactiva todo.
   ===================================================================================== */
(function(){
  'use strict';
  if (typeof genLessonComb !== 'function' || typeof genLessonGP1 !== 'function') return;
  var ORIG = genLessonComb;
  var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
  var IRR = /irregular|subdivid|fusionad/i;

  function cardsOf(wid){ var W = gp1World(wid); return W ? W.cards.filter(function(c){ return !c.pending; }).map(function(c){ return c.id; }) : []; }
  function gen(wid, cards, sd){ try { var L = genLessonGP1(wid, cards, sd, null); return (L && L.phrases && L.phrases.length) ? L : null; } catch(e){ return null; } }
  function shuffle(a, rand){ a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function stripPitch(m){ m = clone(m); (m.notes || []).forEach(function(n){ if (!n.rest) { delete n.midi; delete n.key; delete n.fixed; } }); return m; }
  function rico(m){ if (m.groupInfo) return false; var d = m.notes.map(function(n){ return n.dur; }); return m.notes.filter(function(n){ return !n.rest; }).length >= 3 && d.some(function(x){ return x === '16' || x === '8d' || x === 'qd'; }) && !d.some(function(x){ return x === '32'; }) && !m.notes.some(function(n){ return n.tieFrom != null || n.barline; }); }
  function cierre(time){ var m = makeCadenceMeasure(time, false); return m; }

  /* dos compases regulares seguidos con distinto pulso (p. ej. 2/4 → 3/8) dentro de un pentagrama: sin cartel de
     equivalencia no se sabe cómo leerlo → esas frases no se usan */
  function kindM(m){ if (m.fracSig) return { r: true, p: 1 }; if (m.e8pulse) return { r: true, p: 0.5 }; var a = m.time.split('/').map(Number), n = a[0], d = a[1];
    if (d === 2) return { r: true, p: 2 }; if (d === 4 || d === 1) return { r: true, p: 1 }; if (d === 8 && n % 3 === 0) return { r: true, p: 1.5 }; if (d === 16 && n % 3 === 0) return { r: true, p: 0.75 }; if (d === 8 && (n === 2 || n === 4)) return { r: true, p: 0.5 }; return { r: false, p: null }; }
  function sinChoque(ms){ for (var i = 1; i < ms.length; i++) { var x = kindM(ms[i - 1]), y = kindM(ms[i]); if (x.r && y.r && x.p !== y.p) return false; } return true; }
  /* ---------- MUNDO 1 ---------- */
  function masRica(ps, rand){ var pool = ps.slice().sort(function(x, y){ var c = function(p){ return [].concat.apply([], p.measures.map(function(m){ return m.notes; })).length; }; return c(y) - c(x); }); return pool[rand() < 0.7 ? 0 : Math.min(1, pool.length - 1)]; }
  function staffsM1(k, rand, sd){
    var cartas = shuffle(cardsOf('m1'), rand);
    var out = [];
    cartas.forEach(function(c, i){
      if (out.length >= k) return;
      var L = null; var resta = function(X){ return X.phrases.some(function(p){ return p.measures.some(function(m){ return m.fracSig && String(m.fracSig[1]).indexOf('+') !== 0; }); }); };
      var aceptaResta = rand() < 0.25; for (var t = 0; t < 14; t++) { var X = gen('m1', [c], sd + i * 7919 + t * 613); if (!X) continue; L = X; if (c !== 'c1_9' || aceptaResta || !resta(X)) break; }
      if (!L) return;
      var cand = L.phrases.filter(function(p, j){ return (j % 2 === 1 || j === L.phrases.length - 1 || p.noMeter) && sinChoque(p.measures); });
      if (!cand.length) cand = L.phrases.filter(function(p){ return sinChoque(p.measures); });
      if (c === 'c1_9' && !aceptaResta) { var deSuma = cand.filter(function(p){ return p.measures.some(function(m){ return m.fracSig; }) && !p.measures.some(function(m){ return m.fracSig && String(m.fracSig[1]).indexOf('+') !== 0; }); }); if (deSuma.length) cand = deSuma; }
      if (!cand.length) return;   // ninguna frase de esta carta se lee sin cartel de equivalencia: otra carta
      var p = clone(masRica(cand, rand)); p.measures = p.measures.map(stripPitch); p.__w = 'm1'; p.__card = c;
      if (L.noMeter) p.noMeter = true;
      out.push(p);
    });
    out.sort(function(a, b){ return (b.noMeter ? 1 : 0) - (a.noMeter ? 1 : 0); });   // el «sin compás», al principio
    return out;
  }

  /* ---------- MUNDO 2 ---------- */
  function poolM2(sd){
    var G = [], libres = {}, uno = [];
    ['c2_1','c2_2','c2_3','c2_4','c2_5','c2_6','c2_7','c2_8'].forEach(function(c, ci){
      for (var s = 0; s < 3; s++) {
        var L = gen('m2', [c], sd + ci * 104729 + s * 7907); if (!L) continue;
        L.phrases.forEach(function(p){ p.measures.forEach(function(m){
          var g = m.groupInfo;
          if (g && g.occ >= 2) G.push({ m: m, num: g.ratioNum, irr: IRR.test(g.label || ''), time: m.time });
          else if (!g && rico(m)) { (libres[m.time] = libres[m.time] || []).push(m); }
        }); });
      }
    });
    for (var s = 0; s < 6; s++) {
      var L9 = gen('m2', ['c2_9'], sd + 555 + s * 131); if (!L9) continue;
      L9.phrases.forEach(function(p){ p.measures.forEach(function(m){ var g = m.groupInfo;
        if (g && g.occ === 1 && g.ratioNum >= 5 && g.ratioNum <= 7 && (g.written || []).every(function(w){ return w === '16'; })) uno.push(m);
        else if (!g && rico(m)) { (libres[m.time] = libres[m.time] || []).push(m); }
      }); });
    }
    return { G: G, libres: libres, uno: uno };
  }
  /* 5, 6 o 7 semicorcheas en un pulso (el generador solo da 7): se rehace el grupo con el número pedido */
  function unoCon(m, num){
    m = clone(m); var g = m.groupInfo; var ix = g.idx.slice().sort(function(a, b){ return a - b; }); var a0 = ix[0], n0 = ix.length;
    if (num === n0) return m;
    var nuevas = []; for (var i = 0; i < num; i++) nuevas.push({ dur: '16' });
    var d = num - n0; m.notes = m.notes.slice(0, a0).concat(nuevas).concat(m.notes.slice(a0 + n0));
    var mov = function(k){ return k >= a0 + n0 ? k + d : k; };
    var gr = []; for (var j = 0; j < num; j++) gr.push(a0 + j);
    m.beams = (m.beams || []).map(function(b){ return (b.indexOf(a0) >= 0) ? gr.slice() : b.map(mov); });
    m.tuplets = [{ idx: gr.slice(), group: { ratioNum: num, ratioDen: 4 } }];
    m.groupInfo = { idx: gr.slice(), written: nuevas.map(function(){ return '16'; }), occ: 1, ratioNum: num, ratioDen: 4, label: num + ' por pulso' };
    return m;
  }
  /* compás con UN grupo de 5, 6 o 7 semicorcheas en un pulso de negra; los demás pulsos, sencillos */
  function unoLimpio(num, rand, time){
    time = time || (rand() < 0.5 ? '2/4' : '3/4'); var nP = +time.split('/')[0];
    var donde = Math.floor(rand() * nP); var notes = [], beams = [], gr = [];
    for (var p = 0; p < nP; p++) {
      if (p === donde) { for (var i = 0; i < num; i++) { gr.push(notes.length); notes.push({ dur: '16' }); } beams.push(gr.slice()); continue; }
      var pat = pickF(rand)([['q'], ['8','8'], ['8d','16'], ['q']]); var ini = notes.length;
      pat.forEach(function(d){ notes.push({ dur: d }); }); if (pat.length > 1) { var b = []; for (var j = ini; j < notes.length; j++) b.push(j); beams.push(b); }
    }
    return { time: time, notes: notes, beams: beams, tuplets: [{ idx: gr.slice(), group: { ratioNum: num, ratioDen: 4 } }],
      groupInfo: { idx: gr.slice(), written: gr.map(function(){ return '16'; }), occ: 1, ratioNum: num, ratioDen: 4, label: num + ' por pulso' }, cap: meterCapQ(time) };
  }
  /* (21-nov-2026, Iago 14:34) cuántos grupos según los mundos marcados (cada ~2 compases pasa algo):
       · 3 o 4 mundos → 2 pentagramas: 1 irregular + 2 regulares en varios pulsos + 1-2 en un pulso.
       · 2 mundos     → 3 pentagramas: 2 irregulares distintos + 3 regulares distintos + 2-3 en un pulso.
       · solo mundo 2 → 5 pentagramas: 3 irregulares distintos + 4 regulares distintos + 4-5 en un pulso.
     Los grupos de varios pulsos nunca van seguidos (siempre hay un compás entre ellos) y cada pentagrama acaba en un
     compás de descanso. 3 de cada 10 lecciones, un pentagrama entero va en compás de negra con puntillo. */
  function staffsM2(k, rand, sd, spec){
    spec = spec || { nI: 1, nR: 2, nU: [1, 2] };
    var P = poolM2(sd); var pick = pickF(rand);
    var den = function(g){ return g.time.split('/')[1]; };
    var Gc = P.G.filter(function(g){ return den(g) === '8' && g.m.groupInfo.occ >= 3; });
    var Gs = P.G.filter(function(g){ return den(g) === '4'; });
    var base = Gs.length ? Gs : P.G;
    var N = spec.nI + spec.nR;
    var nc = (k >= 2 && Gc.length && rand() < 0.3) ? (N >= 5 ? 2 : 1) : 0;
    var usI = [], usR = [], comp = [], simp = [];
    var cabe = function(g){ return g.irr ? (usI.length < spec.nI && usI.indexOf(g.num) < 0) : (usR.length < spec.nR && usR.indexOf(g.num) < 0); };
    var toma = function(g, dest){ (g.irr ? usI : usR).push(g.num); dest.push(g); };
    shuffle(Gc, rand).forEach(function(g){ if (comp.length < nc && cabe(g)) toma(g, comp); });
    /* irregulares distintos entre sí, regulares distintos entre sí; mejor si además no repiten cifra con el otro tipo */
    var llena = function(esIrr, n){ var us = esIrr ? usI : usR, otro = esIrr ? usR : usI;
      var c = shuffle(base.filter(function(g){ return !!g.irr === esIrr; }), rand).sort(function(x, y){ return (otro.indexOf(x.num) >= 0) - (otro.indexOf(y.num) >= 0); });
      for (var i = 0; i < c.length && us.length < n; i++) if (us.indexOf(c[i].num) < 0) toma(c[i], simp);
      return us.length >= n; };
    if (!llena(true, spec.nI) || !llena(false, spec.nR)) return [];
    var nS = k - (comp.length ? 1 : 0);
    if (nS < 1 || simp.length > nS * 2) return [];
    simp = shuffle(simp, rand);
    /* reparto: como mucho 2 grupos de varios pulsos por pentagrama */
    var nm = []; for (var s0 = 0; s0 < nS; s0++) nm.push(Math.floor(simp.length / nS));
    shuffle(nm.map(function(_, i){ return i; }), rand).slice(0, simp.length % nS).forEach(function(i){ nm[i]++; });
    /* grupos en un pulso: al pentagrama que menos tenga (2 si tiene un solo grupo, 1 si tiene dos) */
    var nU = spec.nU[0] + Math.floor(rand() * (spec.nU[1] - spec.nU[0] + 1));
    var nu = nm.map(function(){ return 0; }), ev = nm.slice();
    for (var u = 0; u < nU; u++) {
      var cs = nm.map(function(_, i){ return i; }).filter(function(i){ return nu[i] < (nm[i] >= 2 ? 1 : 2); });
      if (!cs.length) break;
      cs = shuffle(cs, rand).sort(function(x, y){ return ev[x] - ev[y]; }); nu[cs[0]]++; ev[cs[0]]++;
    }
    var todos = usI.concat(usR);
    var cifras = shuffle([5, 6, 7], rand).sort(function(x, y){ return (todos.indexOf(x) >= 0) - (todos.indexOf(y) >= 0); });
    var iu = 0; var sigUno = function(){ return cifras[(iu++) % 3]; };   // nunca dos iguales seguidos
    var usadasL = [];
    var libreT = function(t){ var a = (P.libres[t] || []).filter(function(m){ return usadasL.indexOf(m) < 0; }); if (!a.length) a = P.libres[t] || [];
      if (!a.length) return safeMeasure(t); var m = pick(a); usadasL.push(m); return m; };
    var libreC = function(time){ var all = []; Object.keys(P.libres).forEach(function(t){ var nd = t.split('/'); if (nd[1] === '8' && +nd[0] % 3 === 0) all = all.concat(P.libres[t]); }); var a = P.libres[time] && P.libres[time].length ? P.libres[time] : all; return a.length ? pick(a) : safeMeasure(time); };
    var principalDe = function(ts){ var c = {}; ts.forEach(function(t){ c[t] = (c[t] || 0) + 1; }); return Object.keys(c).sort(function(x, y){ return c[y] - c[x]; })[0]; };
    /* orden de los pentagramas: el compuesto (si lo hay) en cualquier sitio */
    var orden = shuffle(nm.map(function(_, i){ return i; }), rand);
    if (comp.length) orden.splice(Math.floor(rand() * (orden.length + 1)), 0, 'C');
    var S = [], prin = [], cur = 0;
    orden.forEach(function(o){
      if (o === 'C') {
        var c0 = comp[0], c1 = comp[1];
        var ms = c1 ? [c0.m, libreC(c0.time), c1.m, libreC(c1.time)] : [libreC(c0.time), c0.m, libreC(c0.time), libreC(c0.time)];
        S.push(ms); prin.push(principalDe(ms.map(function(m){ return m.time; }))); return;
      }
      var M = simp.slice(cur, cur + nm[o]); cur += nm[o]; var U = nu[o];
      var tok;
      if (M.length >= 2) tok = U ? ['M0','U','M1','L'] : ['M0','L','M1','L'];
      else if (M.length === 1) tok = U >= 2 ? ['U','M0','U','L'] : (U === 1 ? (rand() < 0.5 ? ['U','L','M0','L'] : ['M0','L','U','L']) : ['L','M0','L','L']);
      else tok = U >= 2 ? ['U','L','U','L'] : (U === 1 ? ['L','U','L','L'] : ['L','L','L','L']);
      /* compás de los compases libres: que el compás principal no se repita tres pentagramas seguidos (y mejor, ni dos) */
      var p1 = prin[prin.length - 1], p2 = prin[prin.length - 2]; var opc = shuffle(['2/4','3/4','4/4'], rand); var T = null, Tok = null;
      opc.forEach(function(t){ var pr = principalDe(tok.map(function(x){ return x.charAt(0) === 'M' ? M[+x.charAt(1)].time : t; }));
        if (!(p1 && p1 === p2 && pr === p1)) { if (!Tok) Tok = t; if (!T && pr !== p1) T = t; } });
      T = T || Tok || opc[0];
      var ms = tok.map(function(x){ return x.charAt(0) === 'M' ? M[+x.charAt(1)].m : (x === 'U' ? unoLimpio(sigUno(), rand, T) : libreT(T)); });
      S.push(ms); prin.push(principalDe(ms.map(function(m){ return m.time; })));
    });
    return S.slice(0, k).map(function(ms){ return { clef: 'treble', measures: ms.map(stripPitch), nMeasures: ms.length, valid: true, __w: 'm2' }; });
  }

  /* ---------- MUNDO 3 ---------- */
  function staffsM3(k, rand, sd){
    var cards = shuffle(['c3_1','c3_2','c3_4'], rand); while (cards.length < k) cards.push(pickF(rand)(['c3_1','c3_2','c3_4']));
    var out = [];
    cards.slice(0, k).forEach(function(c, i){
      var cand = []; for (var t = 0; t < 3; t++) { var L = gen('m3', [c], sd + i * 3571 + t * 977); if (!L) continue; cand = cand.concat(L.phrases.filter(function(p){ return sinChoque(p.measures); })); }
      if (!cand.length) return;
      var porCompas = {}; cand.forEach(function(p){ var t = p.measures[0].time; (porCompas[t] = porCompas[t] || []).push(p); });
      var tks = Object.keys(porCompas); if (tks.length) cand = porCompas[pickF(rand)(tks)];
      if (!cand.length) return; var p = clone(masRica(cand, rand)); p.measures = p.measures.map(stripPitch); p.__w = 'm3'; p.__card = c; out.push(p);
    });
    return shuffle(out, rand).sort(function(a, b){ return (a.__card === 'c3_2') - (b.__card === 'c3_2'); });   // las fusas, al final
  }

  /* ---------- MUNDO 4: pentagrama fácil (figuras de pulso y poco más) ---------- */
  var FACIL = {
    '2/4': [['q','q'],['h'],['qd','8'],['q','8','8']],
    '3/4': [['q','q','q'],['h','q'],['q','h'],['qd','8','q'],['hd']],
    '4/4': [['h','h'],['q','q','h'],['qd','8','h'],['h','q','q']],
    '6/8': [['qd','qd'],['q','8','qd'],['qd','q','8'],['8','8','8','qd']]
  };
  function staffM4(rand, sd, prohibidos, card){
    card = card || pickF(rand)(['c4_1','c4_2','c4_3']);
    var L = gen('m4', [card], sd + 99); var clef = 'alto';
    if (L) clef = pickF(rand)(L.phrases.map(function(p){ return p.clef; }));
    var libresT = ['2/4','3/4','4/4','6/8'].filter(function(t){ return (prohibidos || []).indexOf(t) < 0; }); var time = pickF(rand)(libresT.length ? libresT : ['2/4','3/4','4/4','6/8']); var pats = FACIL[time];
    var ms = [], corcheas = 0;
    for (var i = 0; i < 3; i++) {
      var pat; var g = 0; do { pat = pickF(rand)(pats); g++; } while (g < 30 && ((pat.filter(function(d){ return d === '8'; }).length >= 2 && corcheas >= 1) || (ms.length && ms[ms.length - 1].notes.map(function(n){ return n.dur; }).join() === pat.join())));
      if (pat.filter(function(d){ return d === '8'; }).length >= 2) corcheas++;
      var notes = pat.map(function(d){ return { dur: d }; });
      var beams = []; var run = []; notes.forEach(function(n, j){ if (n.dur === '8') run.push(j); else { if (run.length >= 2) beams.push(run); run = []; } }); if (run.length >= 2) beams.push(run);
      ms.push({ time: time, notes: notes, beams: beams, tuplets: [], groupInfo: null, cap: meterCapQ(time) });
    }
    ms.push(cierre(time));
    return { clef: clef, measures: ms, nMeasures: ms.length, valid: true, __w: 'm4', __card: card, __facil: true };
  }

  /* (21-nov-2026, Iago: «abusas de cromatismos») como mucho dos pentagramas con notas cromáticas; en el resto vuelven a su
     nota de la escala, salvo la sensible (menor) que resuelve a la tónica. Si al quitarla la melodía deja de valer, se queda. */
  function menosCromatismo(L, seq, tonic, modoNat, rand){
    var conCrom = []; seq.forEach(function(p, i){ if (p.measures.some(function(m){ return m.notes.some(function(n){ return n._chrom; }); })) conCrom.push(i); });
    var quedan = shuffle(conCrom, rand).slice(0, 2);
    seq.forEach(function(p, i){
      if (quedan.indexOf(i) >= 0 || conCrom.indexOf(i) < 0) return;
      var esc = buildScale(tonic, modoNat, p.clef, p.keysig); var tpc = TONIC_PC[tonic];
      var notas = []; p.measures.forEach(function(m){ m.notes.forEach(function(n){ if (!n.rest && !n.barline) notas.push(n); }); });
      var copia = notas.map(function(n){ return { midi: n.midi, key: n.key, c: n._chrom }; });
      notas.forEach(function(n, k){
        if (!n._chrom) return;
        var sig = notas[k + 1];
        if (modoNat !== 'mayor' && sig && ((sig.midi % 12) === tpc) && (sig.midi - n.midi === 1)) return;   // sensible → tónica
        var letra = String(n.key || '').charAt(0); var mejor = null;
        esc.forEach(function(e){ if (String(e.key).charAt(0) === letra && Math.abs(e.midi - n.midi) <= 1 && (!mejor || Math.abs(e.midi - n.midi) < Math.abs(mejor.midi - n.midi))) mejor = e; });
        if (mejor) { n.midi = mejor.midi; n.key = mejor.key; delete n._chrom; delete n._sec; }
      });
      if (!validateMelody(p.measures)) notas.forEach(function(n, k){ n.midi = copia[k].midi; n.key = copia[k].key; if (copia[k].c) n._chrom = true; });
    });
  }
  /* ---------- el generador ---------- */
  function genExamen(worldIds, seed){
    var rand = makeRand(seed), pick = pickF(rand);
    var ws = ['m1','m2','m3','m4'].filter(function(w){ return worldIds.indexOf(w) >= 0; });
    var nSt = ws.length >= 4 ? 7 : (ws.length === 3 ? 6 : 5);
    /* (21-nov-2026, Iago 13:51) un pentagrama por carta: el mundo 2 ocupa siempre 2 (1 irregular + 2 regulares en
       varios pulsos y 1-2 grupos de un pulso); el resto se reparte entre los demás mundos, cada pentagrama con una
       carta distinta. */
    var TOPE = { m1: 9, m3: 3, m4: 3 };
    var cuota = {}; var resto = nSt;
    var soloM2 = ws.length === 1 && ws[0] === 'm2';
    var SPEC2 = soloM2 ? { k: 5, nI: 3, nR: 4, nU: [4, 5] } : (ws.length === 2 ? { k: 3, nI: 2, nR: 3, nU: [2, 3] } : { k: 2, nI: 1, nR: 2, nU: [1, 2] });   // (Iago 14:34)
    if (ws.indexOf('m2') >= 0) { cuota.m2 = SPEC2.k; resto -= SPEC2.k; }
    var otros = ws.filter(function(w){ return w !== 'm2'; });
    otros.forEach(function(w){ cuota[w] = 1; resto--; });
    var g0 = 0; while (resto > 0 && g0++ < 50) { var cand = shuffle(otros, rand).filter(function(w){ return cuota[w] < TOPE[w]; }); if (!cand.length) break;
      cand.sort(function(a, b){ return (cuota[a] + (a === 'm4' ? 1.5 : 0)) - (cuota[b] + (b === 'm4' ? 1.5 : 0)); }); cuota[cand[0]]++; resto--; }   // el mundo 4 (fácil) recibe los pentagramas de sobra el último
    if (resto > 0) return null;
    var st = {};
    if (cuota.m1) st.m1 = staffsM1(cuota.m1, rand, seed * 3 + 11);
    if (cuota.m2) st.m2 = staffsM2(cuota.m2, rand, seed * 5 + 13, SPEC2);
    if (cuota.m3) st.m3 = staffsM3(cuota.m3, rand, seed * 7 + 17);
    if (cuota.m4) { st.m4 = shuffle(['c4_1','c4_2','c4_3'], rand).slice(0, cuota.m4).map(function(c){ return { __w: 'm4', __facil: true, measures: [], __pend: true, __card: c }; }); }
    for (var w in cuota) if (!st[w] || st[w].length < cuota[w]) return null;
    // orden: mundo 1 · mundo 2 · mundo 3, con los fáciles del mundo 4 repartidos por en medio (nunca el primero ni dos seguidos)
    var m2 = st.m2 || [];
    var seq = [].concat(st.m1 || []).concat(m2).concat(st.m3 || []);
    var K4 = (st.m4 || []).length;
    if (K4) {
      // huecos entre pentagramas: primero los de en medio (repartidos), luego el final y, si no queda otra, el principio
      var base = seq.slice(), L0 = base.length;
      var internos = []; for (var h = 1; h < L0; h++) internos.push(h);
      var elegidos = [];
      if (K4 === 1 && m2.length === 2 && L0 > 2) elegidos = [base.indexOf(m2[0]) + 1];
      else { var paso = (internos.length + 1) / (K4 + 1); for (var q = 1; q <= K4 && internos.length; q++) { var ix = Math.min(internos.length - 1, Math.max(0, Math.round(paso * q) - 1)); var hh = internos[ix]; if (elegidos.indexOf(hh) < 0) elegidos.push(hh); }
        internos.forEach(function(hh){ if (elegidos.length < K4 && elegidos.indexOf(hh) < 0) elegidos.push(hh); });
        if (elegidos.length < K4) elegidos.push(L0);
        if (elegidos.length < K4) elegidos.push(0); }
      if (elegidos.length < K4) return null;
      elegidos.sort(function(a, b){ return a - b; });
      seq = []; var q4 = 0;
      for (var z0 = 0; z0 <= L0; z0++) { if (elegidos.indexOf(z0) >= 0) seq.push(st.m4[q4++]); if (z0 < L0) seq.push(base[z0]); }
    }
    if (seq.length !== nSt) return null;
    var principal = function(p){ if (!p || p.noMeter) return 'sin'; if (p.__pend) return 'pend'; var c = {}; p.measures.forEach(function(m){ var t = m.fracSig ? m.fracSig.join('') : m.time; c[t] = (c[t] || 0) + 1; }); return Object.keys(c).sort(function(a, b){ return c[b] - c[a]; })[0]; };
    seq.forEach(function(p, i4){ if (!p.__pend) return; var veci = [principal(seq[i4 - 1]), principal(seq[i4 + 1])]; seq[i4] = staffM4(rand, seed * 11 + 19 + i4, veci, p.__card); });
    for (var z = 2; z < seq.length; z++) { var a1 = principal(seq[z - 2]), a2 = principal(seq[z - 1]), a3 = principal(seq[z]); if (a1 !== 'sin' && a1 === a2 && a2 === a3) return null; }
    // claves: el del mundo 4 lleva la suya; de los demás, los dos últimos en fa (uno si hay pocos)
    var noM4 = seq.filter(function(p){ return p.__w !== 'm4'; }); var nFa = noM4.length >= 4 ? 2 : 1;
    noM4.forEach(function(p, i){ p.clef = (i >= noM4.length - nFa) ? 'bass' : 'treble'; });
    // el pentagrama de antes del fácil y el último acaban con silencio
    seq.forEach(function(p, i){
      var finTras = (seq[i + 1] && seq[i + 1].__w === 'm4') || i === seq.length - 1;
      var uF = p.measures[p.measures.length - 1];
      if (uF && uF.fracSig && uF.notes.some(function(n){ return n.rest; })) {   // (Iago, examen de Alejandro) el fraccionario acaba en negra + silencios, no en corcheas con puntillo
        var cf = { time: uF.time, fracSig: uF.fracSig.slice(), notes: [{ dur: 'q', cad: true }], beams: [], tuplets: [], groupInfo: null, cap: uF.cap || meterCapQ(uF.time) };
        var rf = cf.cap - 1; [['q',1],['8',0.5],['16',0.25]].forEach(function(f){ while (rf >= f[1] - 1e-6) { cf.notes.push({ dur: f[0], rest: true }); rf -= f[1]; } });
        p.measures[p.measures.length - 1] = cf; }
      if (finTras && !p.noMeter) { var u = p.measures[p.measures.length - 1]; if (!u.notes.some(function(n){ return n.rest; })) { var cz = cierre(u.time); if (u.e8pulse) { cz.e8pulse = true; cz.notes = [{ dur: '8', cad: true }]; var rr = meterCapQ(u.time) - 0.5; while (rr >= 0.499) { cz.notes.push({ dur: '8', rest: true }); rr -= 0.5; } cz.beams = []; } if (u.wideTernary) cz.wideTernary = true;
        if (u.fracSig) { cz = { time: u.time, fracSig: u.fracSig.slice(), notes: [{ dur: 'q', cad: true }], beams: [], tuplets: [], groupInfo: null, cap: u.cap || meterCapQ(u.time) };   // fraccionario: negra + silencios, sin perder la cifra
          var rq = cz.cap - 1; [['q',1],['8',0.5],['16',0.25]].forEach(function(f){ while (rq >= f[1] - 1e-6) { cz.notes.push({ dur: f[0], rest: true }); rq -= f[1]; } }); }
        if (u.groupInfo) p.measures.push(cz); else p.measures[p.measures.length - 1] = cz; } }   // si el último compás lleva un grupo, el cierre va detrás (no se pierde el grupo)
    });
    var kp = pick(KEY_POOL_WIDE); var keysig = kp[0], tonic = kp[1], modo = kp[2];
    var modoNat = modo === 'mayor' ? 'mayor' : 'menor_natural';
    seq.forEach(function(p){ p.keysig = keysig; p.time = p.measures[0].time; p.nMeasures = p.measures.length; p.valid = p.measures.every(validateMeasure); p.semiStop = null; });
    var L = { trimKey: 'gp1', gp1: true, comb: true, examen: true,
      worldId: ws[0], cards: [], combWorlds: ws.slice(), combSel: (typeof gp1CombCardSel === 'function' ? gp1CombCardSel(ws) : null),
      blockTimes: [], blockSplit: [], keysig: keysig, tonic: tonic, modo: modo, phrases: seq,
      timeA: seq[0].time, timeB: seq[seq.length - 1].time, switchIdx: 1,
      fusaN: false, conjunctM4: false, noMeter: false,
      roles: seq.map(function(p){ return p.__rol || null; }) };
    var ok = false;
    for (var a = 0; a < 40 && !ok; a++) {
      assignMelodyLesson(L, tonic, modoNat, makeRand(seed * 7 + a * 131 + 9), 'medio');
      ok = seq.every(function(p){ return validateMelody(p.measures); });
    }
    // el pentagrama fácil, por grados (mismo motor, en modo «conjunto»)
    var iF = seq.findIndex(function(p){ return p.__facil; });
    if (iF >= 0) {
      var sub = { trimKey: 'gp1', gp1: true, phrases: [seq[iF]], keysig: keysig, tonic: tonic, modo: modo, conjunctM4: true, cards: [], worldId: 'm4' };
      for (var b = 0; b < 30; b++) { assignMelodyLesson(sub, tonic, modoNat, makeRand(seed * 13 + b * 71 + 3), 'medio'); if (validateMelody(seq[iF].measures)) break; }
    }
    menosCromatismo(L, seq, tonic, modoNat, rand);
    applyTiesPitch(L);
    L.valid = seq.every(function(p){ return p.valid; }) && ok;
    return L;
  }

  genLessonComb = function(worldIds, seed){
    var ws = (worldIds || []).slice();
    var usa = ws.length >= 2 || (ws.length === 1 && ws[0] === 'm2');   // (Iago 14:34) el mundo 2 solo, también «lleno de grupos»
    if (usa) {
      window.__rpSinMat = true;
      try {
      for (var t = 0; t < 12; t++) {
        try { var L = genExamen(ws, (seed + t * 2654435761) >>> 0 || 1); if (L && L.valid) return L; } catch (e) { if (t === 11 && window.console) console.warn('[combina-examen]', e); }
      }
      } finally { window.__rpSinMat = false; }
    }
    return ORIG.apply(this, arguments);
  };
  window.RP_COMBINA_EXAMEN = { gen: genExamen, pool: poolM2 };
})();
