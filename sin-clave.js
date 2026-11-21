/* =====================================================================================
   (21-nov-2026, Iago 17:09) LECTURA SIN CLAVE con referencia
   «Cuando haya una parte sin clave, que aparezca al final del pentagrama de antes la clave tachada y la primera nota
   de la parte sin clave con su nombre debajo. Que no coincida con su nombre si fuese clave de sol o fa en cuarta.»
   · En cada lección se elige una referencia oculta (como una clave de do): el nombre real de cada nota está 1, 2 o 3
     posiciones por encima o por debajo de lo que leería un alumno en clave de sol, y nunca coincide con sol ni con fa
     en 4.ª. La melodía SUENA igual que antes (misma tonalidad): solo cambia dónde se dibuja.
   · Sin armadura: si una nota va alterada, lleva su alteración delante.
   · El aviso (clave tachada + nota + nombre) lo dibuja renderLesson en index.html; si la lección EMPIEZA sin clave,
     el nombre va encima de la primera nota (debajo va el matiz).
   Quitar este fichero lo deja como antes (posiciones de clave de sol, sin referencia).
   ===================================================================================== */
(function(){
  'use strict';
  if (typeof genLessonGP1 !== 'function' || typeof genLessonComb !== 'function') return;
  var LET = 'cdefgab', NOM = ['Do','Re','Mi','Fa','Sol','La','Si'];
  // d = cuántas notas por encima está el nombre real respecto a la lectura en sol (0 = sol, 2 = fa en 4.ª: prohibidos)
  // s = cuánto se desplaza el dibujo (lo más corto posible, para no salirse del pentagrama)
  var OPC = [{ d: 1, s: -1 }, { d: 6, s: 1 }, { d: 5, s: 2 }, { d: 3, s: -3 }, { d: 4, s: 3 }];
  function hash(L){ var t = ''; L.phrases.forEach(function(p){ p.measures.forEach(function(m){ m.notes.forEach(function(n){ t += (n.key || '') + n.dur; }); }); }); var h = 2166136261; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function partes(k){ var m = /^([a-g])(#|b|n)?\/(\d)$/.exec(k || ''); return m ? { l: LET.indexOf(m[1]), a: m[2] && m[2] !== 'n' ? m[2] : '', o: +m[3] } : null; }
  window.rpNombreNota = function(k){ var p = partes(k); return p ? NOM[p.l] + (p.a === '#' ? '♯' : p.a === 'b' ? '♭' : '') : ''; };
  function transformar(L){
    try {
      if (!L || !L.phrases || L.__sinClave) return L;
      var sin = L.phrases.filter(function(p){ return p.clef === 'none'; }); if (!sin.length) return L;
      var o0 = OPC[hash(L) % OPC.length];
      // la octava del dibujo que deje las notas más centradas en el pentagrama (si 4 = línea central)
      var Ds = []; sin.forEach(function(p){ p.measures.forEach(function(m){ m.notes.forEach(function(n){ var q = (!n.rest && !n.barline) ? partes(n.key) : null; if (q) Ds.push(q.o * 7 + q.l); }); }); });
      var med = Ds.length ? Ds.reduce(function(a, b){ return a + b; }, 0) / Ds.length : 34;
      var mejor = o0.s; [o0.s - 7, o0.s, o0.s + 7].forEach(function(c){ if (Math.abs(med + c - 34) < Math.abs(med + mejor - 34)) mejor = c; });
      var o = { d: o0.d, s: mejor };
      sin.forEach(function(p){
        p.keysig = 'C';
        p.measures.forEach(function(m){ m.notes.forEach(function(n){
          if (n.rest || n.barline || !n.key) return; var q = partes(n.key); if (!q) return;
          var D = q.o * 7 + q.l + o.s; n._keyReal = n.key; n.key = LET[((D % 7) + 7) % 7] + q.a + '/' + Math.floor(D / 7); }); });
      });
      L.__sinClave = { d: o.d, s: o.s };
    } catch (e) { if (window.console) console.warn('[sin-clave]', e); }
    return L;
  }
  var g1 = genLessonGP1; genLessonGP1 = function(){ return transformar(g1.apply(this, arguments)); };
  var gc = genLessonComb; genLessonComb = function(){ return transformar(gc.apply(this, arguments)); };
  // la lección EMPIEZA sin clave: el nombre de la primera nota, debajo de ella
  var rl = renderLesson; renderLesson = function(container, L){ var r = rl.apply(this, arguments);
    try { var ruleta = (L && (L.cards || []).indexOf('c4_3') >= 0 && !L.comb);   // la carta 4.3 sola ya tiene su ruleta, que da el nombre
      if (L && L.__sinClave && !ruleta && L.phrases[0] && L.phrases[0].clef === 'none') {
      var svg = container.querySelector('svg'); var n0 = null, k0 = 0, idx = 0;
      L.phrases[0].measures.some(function(m){ return m.notes.some(function(n){ if (n.barline) return false; if (!n.rest && n._keyReal) { n0 = n; k0 = idx; return true; } idx++; return false; }); });
      var el = n0 && svg && svg.querySelectorAll('g.vf-stavenote')[k0];
      if (el) { var b = el.getBBox(); var st = svg.querySelector('g.vf-stave'); var sb = st ? st.getBBox() : b;
        var t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); t.setAttribute('x', b.x + b.width / 2); t.setAttribute('y', Math.min(sb.y, b.y) - 9);   // encima (debajo va el matiz)
        t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-family', 'Arial'); t.setAttribute('font-weight', 'bold'); t.setAttribute('font-size', '12'); t.setAttribute('fill', '#1a2233'); t.setAttribute('class', 'rp-sc');
        t.textContent = window.rpNombreNota(n0._keyReal); svg.appendChild(t); } } } catch (e) {}
    return r; };
  window.RP_SIN_CLAVE = { transformar: transformar };
})();
