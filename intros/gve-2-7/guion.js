/* Línea de tiempo: la manda la grabación real (tiempos.js, generado por pipeline/montaje.py). */
(function () {
  'use strict';
  window.construirTiempos = function () {
    const R = window.TIEMPOS;
    return { frase: R.frase, bloque: R.bloque, orden: R.orden || [], real: true, dur: R.dur, acorde: R.acorde };
  };
})();
