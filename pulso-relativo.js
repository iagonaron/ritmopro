/* =====================================================================================
   (21-nov-2026, Iago) LA CLAQUETA SIGUE A LAS EQUIVALENCIAS · Ritmo entonado at home (2.º GP)
   «Esas equivalencias tienen que tener correspondencia también con el motor rítmico: si la subdivisión es una, luego a lo
   mejor tiene que cambiar a otra» (como ya se hizo en elemental con los compases de blanca).
   · El PULSO de cada compás es el de su equivalencia: 6/16 y 12/16 → corchea con puntillo; 2/8, 4/8 y las fusas en pulso de
     corchea → corchea; 2/2… → blanca; 2/1, 3/1 → redonda; el fraccionario (2+¼)/4 → negra.
   · La SUBDIVISIÓN elegida es relativa a ese pulso: «corcheas» = el pulso partido en 2 (binario) o en 3 (con puntillo);
     «semicorcheas» = en 4 o en 6. Ejemplos: en 6/16, «corcheas» suena en semicorcheas; en las fusas de 3/8, en semicorcheas;
     en 3/1, en blancas. Los dispares (5/8, 7/8…) siguen en corcheas; la música sin compás, como siempre.
   Va antes de estudio-comun.js (que sube «una talla» los compases de blanca; los dos cuadran). Quitar este fichero lo desactiva.
   ===================================================================================== */
(function(){
  'use strict';
  if (typeof pulseOnsetsQ !== 'function' || typeof subClicks !== 'function') return;
  var poOrig = pulseOnsetsQ;
  var cada = function(n, paso){ var a = []; for (var i = 0; i < n; i++) a.push(i * paso); return a; };
  pulseOnsetsQ = function(m){
    try {
      if (!m.fracSig && !m.e8pulse && !m.wideTernary) {
        var nd = String(m.time).split('/').map(Number), n = nd[0], d = nd[1];
        if (d === 16 && n % 3 === 0) return cada(n / 3, 0.75);      // 6/16, 9/16, 12/16: pulso = corchea con puntillo
        if (d === 8 && (n === 2 || n === 4)) return cada(n, 0.5);   // 2/8, 4/8: pulso = corchea
        if (d === 2) return cada(n, 2);                             // 2/2, 3/2, 4/2: pulso = blanca
        if (d === 1) return cada(n, 4);                             // 2/1, 3/1: pulso = redonda
      }
    } catch (e) {}
    return poOrig.apply(this, arguments);
  };

  var scOrig = subClicks;
  var conPuntillo = function(P){ return [0.75, 1.5, 3, 6].some(function(v){ return Math.abs(P - v) < 1e-6; }); };
  subClicks = function(sched){
    try {
      var step = (typeof subStepQ === 'function') ? subStepQ() : null;
      if (!step || !sched || !sched.measInfo || !sched.measInfo.length) return scOrig.apply(this, arguments);
      if (typeof currentLesson !== 'undefined' && currentLesson && currentLesson.fusaN && typeof studyMode !== 'undefined' && studyMode) return scOrig.apply(this, arguments);
      var out = [], seen = {};
      var add = function(q, o){ var k = Math.round(q * 16); if (seen[k]) return; seen[k] = 1; var x = { q: q }; for (var a in o) x[a] = o[a]; out.push(x); };
      sched.measInfo.forEach(function(mm){
        var on = mm.onsets || [0];
        on.forEach(function(o, i){ add(mm.q + o, { accent: i === 0 }); });
        var st = step;
        if (mm.noMeter) st = (step < 0.5) ? step : 0.5;
        else {
          var P = on.length > 1 ? on[1] - on[0] : mm.cap;
          var regular = true; for (var i = 2; i < on.length; i++) if (Math.abs((on[i] - on[i - 1]) - P) > 1e-6) regular = false;
          if (regular && P > 0) st = conPuntillo(P) ? (step >= 0.5 ? P / 3 : P / 6) : (step >= 0.5 ? P / 2 : P / 4);
        }
        for (var k = 0; k * st < mm.cap - 1e-6; k++) add(mm.q + k * st, { sub: true });
      });
      return out.sort(function(a, b){ return a.q - b.q; });
    } catch (e) { return scOrig.apply(this, arguments); }
  };
})();
