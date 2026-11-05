/* =====================================================================
   MOTOR · reproductor de las intros (audio máster + escenas + controles)
   ===================================================================== */
(function () {
  'use strict';
  // ---- enlaces de los dos botones del final (norma 3): cada intro los pone en window.INTRO_CFG
  const CFG = window.INTRO_CFG || {};
  const ENLACE_SALIR = CFG.salir || 'https://gp.lmathome.es/';
  const ENLACE_EJERCICIOS = CFG.ejercicios || 'https://teoria.gp.lmathome.es/compases.html';

  const Q = new URLSearchParams(location.search);
  const OFFLINE = Q.has('offline');           // exportación a vídeo fotograma a fotograma
  const AUTO = Q.has('auto');                 // empieza sola (si el navegador lo permite)
  const EMBED = Q.has('embed');               // dentro de una web (tarjeta de Teoría): «Salir» cierra el visor
  if (AUTO) document.documentElement.classList.add('auto');   // sin portada mientras intenta empezar sola
  // (29-sep-2026, Iago) MODO MP4: si el vídeo ya está grabado (window.VIDEO_MP4), se reproduce ese MP4 (fluido en cualquier
  // pantalla) en vez de dibujar las escenas en directo; los carteles que se pulsan van en una capa transparente encima
  // (window.ENLACES_MP4) y los subtítulos y los botones del final siguen siendo HTML. ?svg fuerza el modo de siempre.
  const MP4 = !!window.VIDEO_MP4 && !OFFLINE && !Q.has('svg');
  const VER_FPS = Q.has('fps');                // ?fps → contador discreto de imágenes por segundo (diagnóstico)
  let ZONAS = [];
  const W = 1920, H = 1080;
  const $ = id => document.getElementById(id);

  let T = null, audio = null, reloj = { t: 0, perf: 0, audioT: -1 }, jugando = false, empezado = false;
  let subtitulos = false;

  function ajustar() {
    const r = $('marco').getBoundingClientRect();
    const s = Math.min(r.width / W, r.height / H);
    $('escenario').style.transform = `translate(-50%,-50%) scale(${s})`;
  }

  function tiempo() {
    if (!audio) return reloj.t;
    const at = audio.currentTime;
    const ahora = performance.now();
    if (at !== reloj.audioT) { reloj.audioT = at; reloj.perf = ahora; reloj.t = at; return at; }
    if (!audio.paused) return reloj.t + (ahora - reloj.perf) / 1000;
    return at;
  }

  function subtitulo(t) {
    const el = $('subtitulo');
    if (!subtitulos) { el.classList.remove('on'); return; }
    let txt = '';
    for (const id of T.orden) {
      const f = T.frase[id]; if (!f) continue;
      if (t >= f.t0 - 0.15 && t <= f.t1 + 0.35) { txt = f.txt || ''; break; }
    }
    if (el._txt !== txt) { el._txt = txt; el.querySelector('span').textContent = txt; }
    el.classList.toggle('on', !!txt);
  }

  function pintar(t) {
    if (MP4) enlacesMp4(t); else window.ESCENAS.pintar(t);
    subtitulo(t);
    $('barraTiempo').style.width = (100 * Math.min(1, t / T.dur)).toFixed(2) + '%';
    const fin = t >= T.acorde;
    $('finalUI').classList.toggle('on', fin);
    if (!fin) $('finalUI').style.opacity = '';
    else $('finalUI').style.opacity = Math.min(1, (t - T.acorde) / 0.35).toFixed(2);
  }

  let fpsEl = null, fpsN = 0, fpsT0 = 0, fpsPeor = 0, fpsUlt = 0;
  function medirFps() {
    const ahora = performance.now();
    if (!fpsEl) {
      fpsEl = document.createElement('div');
      fpsEl.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99;font:600 13px/1.3 system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.6);padding:4px 8px;border-radius:6px;pointer-events:none';
      document.body.appendChild(fpsEl); fpsT0 = ahora;
    }
    if (fpsUlt) fpsPeor = Math.max(fpsPeor, ahora - fpsUlt);
    fpsUlt = ahora; fpsN++;
    if (ahora - fpsT0 >= 1000) {
      fpsEl.textContent = `${Math.round(fpsN * 1000 / (ahora - fpsT0))} fps · peor ${Math.round(fpsPeor)} ms · ${MP4 ? 'MP4' : 'directo'} · ${innerWidth}×${innerHeight} ×${devicePixelRatio}`;
      fpsN = 0; fpsT0 = ahora; fpsPeor = 0;
    }
  }
  function montarMp4() {
    const esc = $('escenario');
    const v = document.createElement('video');
    v.id = 'vid'; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto';
    descarga(v);        // (29-sep-2026, Iago) se descarga entero antes de reproducirse: luego ya no se para a mitad
    v.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;display:block;background:#081628;object-fit:cover';
    esc.insertBefore(v, esc.firstChild);
    // (29-sep-2026, tarde) el título dibujado (= primer fotograma del MP4) se queda delante hasta que el vídeo tiene su
    // primera imagen: al abrirlo se ve ya nítido aunque el MP4 aún se esté descargando
    try { window.ESCENAS.pintar(0); } catch (e) { }
    const capas = on => ['lienzo', 'fondoCapa', 'velo'].forEach(id => { const e = $(id); if (e) e.style.visibility = on ? '' : 'hidden'; });
    const quitaCapas = () => { if (v.readyState >= 2) capas(false); };
    v.addEventListener('loadeddata', quitaCapas); v.addEventListener('seeked', quitaCapas); v.addEventListener('playing', () => capas(false));
    const st = document.createElement('style');
    st.textContent = '#enlacesMp4 div:hover{background:rgba(255,255,255,.08)}' +
      // (29-sep-2026, Iago) barra rosa: lo que lleva descargado el vídeo, bajo el título, hasta que puede empezar
      '#carga{position:absolute;left:50%;top:772px;width:460px;margin-left:-230px;z-index:5;opacity:0;visibility:hidden;transition:opacity .3s,visibility 0s .3s;pointer-events:none}' +
      '#carga.on{opacity:1;visibility:visible;transition:opacity .35s .12s,visibility 0s}' +
      '#carga.mitad{top:auto;bottom:118px}' +
      '#carga i{display:block;height:8px;border-radius:4px;background:rgba(255,255,255,.16);overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,.25)}' +
      '#carga b{display:block;height:100%;width:0;border-radius:4px;background:var(--rosa,#ec4899);box-shadow:0 0 14px rgba(236,72,153,.55);transition:width .25s linear}';
    document.head.appendChild(st);
    const cg = document.createElement('div');
    cg.id = 'carga'; cg.setAttribute('aria-hidden', 'true'); cg.innerHTML = '<i><b></b></i>';
    esc.appendChild(cg);
    const capa = document.createElement('div');
    capa.id = 'enlacesMp4';
    capa.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;pointer-events:none;z-index:2';
    esc.insertBefore(capa, $('portada'));
    const grupos = document.querySelectorAll('g.tarjetaEnlace');
    ZONAS = (window.ENLACES_MP4 || []).map(([i, t0, t1, x, y, w, h]) => {
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:18px;cursor:pointer;pointer-events:auto;display:none`;
      d.addEventListener('click', e => {      // el mismo cartel (oculto) hace lo de siempre: abrir el vídeo o los apuntes
        e.preventDefault(); e.stopPropagation();
        const g = grupos[i]; if (g) g.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      capa.appendChild(d);
      return { d, t0, t1, on: false };
    });
    return v;
  }
  function enlacesMp4(t) {
    for (const z of ZONAS) { const on = t >= z.t0 && t <= z.t1; if (z.on !== on) { z.on = on; z.d.style.display = on ? 'block' : 'none'; } }
  }

  // (29-sep-2026, Iago: «que se empiece a reproducir cuando haya garantías de que se verá entero») DESCARGA COMPLETA:
  // el MP4 se baja entero a la memoria del navegador (fetch → Blob) y solo entonces se puede reproducir; la barra rosa
  // enseña el porcentaje real. Si el navegador no deja descargarlo así, se usa la dirección de siempre (como antes).
  const DESC = { lista: false, rec: 0, tot: 0, fallo: false, alTerminar: null };
  async function descarga(v) {
    const url = window.VIDEO_MP4;
    try {
      if (!window.fetch || !window.ReadableStream || location.protocol === 'file:') throw new Error('sin descarga');
      const r = await fetch(url);
      if (!r.ok || !r.body) throw new Error('HTTP ' + r.status);
      DESC.tot = +r.headers.get('Content-Length') || +window.VIDEO_BYTES || 0;
      const rd = r.body.getReader(), trozos = [];
      for (;;) { const { done, value } = await rd.read(); if (done) break; trozos.push(value); DESC.rec += value.length; }
      v.src = URL.createObjectURL(new Blob(trozos, { type: (r.headers.get('Content-Type') || 'video/mp4').split(';')[0] }));
    } catch (e) { console.warn('MP4 sin descarga previa:', e); DESC.fallo = true; v.src = url; }
    DESC.lista = true;
    const f = DESC.alTerminar; DESC.alTerminar = null; if (f) f();
  }
  let cargaTm = null;
  function adelante() {
    const b = audio.buffered, t = audio.currentTime; let fin = t;
    for (let i = 0; i < b.length; i++) if (b.start(i) <= t + 0.3 && b.end(i) > fin) fin = b.end(i);
    return fin - t;
  }
  function carga(on, mitad) {
    const el = $('carga'); if (!el) return;
    el.classList.toggle('on', !!on); el.classList.toggle('mitad', !!mitad);
    clearInterval(cargaTm); cargaTm = null;
    if (!on) return;
    const pinta = () => {
      let k;
      if (!DESC.lista) k = DESC.tot ? DESC.rec / DESC.tot : 0;                                    // descargando
      else k = adelante() / Math.max(0.5, Math.min(4, (isFinite(audio.duration) ? audio.duration : T.dur) - audio.currentTime));   // (sin descarga previa)
      el.querySelector('b').style.width = (100 * Math.max(0.03, Math.min(1, k))).toFixed(1) + '%';
    };
    pinta(); cargaTm = setInterval(pinta, 150);
  }

  let vivo = false;                            // un solo bucle de dibujo a la vez
  function bucle() {
    const t = tiempo();
    if (VER_FPS) medirFps();
    pintar(t);
    if (jugando) requestAnimationFrame(bucle); else vivo = false;
  }
  function lanza() { if (!vivo) { vivo = true; requestAnimationFrame(bucle); } }

  function play() {
    const primera = !empezado;
    if (MP4 && !DESC.lista) {        // (29-sep-2026) aún se está descargando: la barra hasta el 100 % y entonces empieza solo
      $('portada').classList.add('fuera'); carga(true);
      try { const p = audio.play(); if (p && p.catch) p.catch(() => { }); } catch (e) { }     // este clic deja sonar después
      DESC.alTerminar = () => { carga(false); play(); };
      return Promise.resolve();
    }
    if (primera) audio.currentTime = 0;
    return audio.play().then(() => {
      if (primera) { empezado = true; $('portada').classList.add('fuera'); }
      jugando = true; document.body.classList.add('sonando'); lanza();
    }).catch(e => {   // si no deja empezar sola: portada con su botón
      console.warn(e); document.documentElement.classList.remove('auto');
      if (MP4 && primera) { carga(false); $('portada').classList.remove('fuera'); }
    });
  }
  function pausa() { audio.pause(); jugando = false; document.body.classList.remove('sonando'); pintar(tiempo()); }
  function alternar() { if (!empezado || audio.paused) play(); else pausa(); }
  function ir(t) { t = Math.max(0, Math.min(T.dur, t)); audio.currentTime = t; reloj.audioT = -1; pintar(t); }

  async function cargarFuentes() {
    const ff = new FontFace('BravuraIntro', `url(${window.BRAVURA_WOFF2})`);
    await ff.load(); document.fonts.add(ff);
    try { await document.fonts.load('32px "Helvetica Neue"'); } catch (e) { }
    await document.fonts.ready;
  }
  function cargarImagenes() {
    const IM = window.IMAGENES || {};
    return Promise.all(Object.values(IM).map(src => new Promise(res => { const i = new Image(); i.onload = i.onerror = res; i.src = src; })));
  }

  async function arrancar() {
    await cargarFuentes();
    await cargarImagenes();
    T = window.construirTiempos();
    window.ESCENAS.construir(T);
    subtitulos = Q.has('subs') ? true : (Q.has('nosubs') ? false : !T.real);
    $('botonSubs').classList.toggle('activo', subtitulos);
    ajustar(); window.addEventListener('resize', ajustar);
    window.renderAt = t => pintar(t);
    window.DUR = T.dur; window.ACORDE = T.acorde;
    pintar(0);
    document.title = document.title.replace(' · cargando', '');
    window.__listo = true;
    if (OFFLINE) { document.documentElement.classList.add('offline'); return; }

    if (MP4) audio = montarMp4();
    else { audio = $('audio'); audio.src = window.AUDIO_MASTER; }
    audio.addEventListener('ended', () => { jugando = false; document.body.classList.remove('sonando'); pintar(T.dur); });
    if (MP4) {   // teclas multimedia / controles del sistema: el vídeo manda y los carteles, subtítulos y final le siguen
      audio.addEventListener('play', () => { if (empezado && !jugando) { jugando = true; document.body.classList.add('sonando'); lanza(); } });
      audio.addEventListener('pause', () => { if (jugando && !audio.ended) { jugando = false; document.body.classList.remove('sonando'); pintar(tiempo()); } });
      audio.addEventListener('playing', () => carga(false));
      audio.addEventListener('waiting', () => { if (empezado && !audio.paused) carga(true, audio.currentTime > 5); });   // (solo sin descarga previa)
    }
    const bp = $('botonPlay');
    let yaListo = false;
    const listo = () => {
      if (yaListo) return; yaListo = true; bp.disabled = false; bp.classList.add('listo');
      if (AUTO) { play(); setTimeout(() => { if (!empezado) document.documentElement.classList.remove('auto'); }, 2500); }
    };
    if (MP4 || audio.readyState >= 3) listo(); else audio.addEventListener('canplaythrough', listo, { once: true });   // MP4: la descarga se ve al pulsar
    setTimeout(listo, 4000);
    bp.addEventListener('click', play);
    $('botonPausa').addEventListener('click', alternar);
    $('botonReinicio').addEventListener('click', () => { ir(0); if (!jugando) play(); });
    $('botonSubs').addEventListener('click', () => { subtitulos = !subtitulos; $('botonSubs').classList.toggle('activo', subtitulos); pintar(tiempo()); });
    $('barra').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); ir((e.clientX - r.left) / r.width * T.dur); });
    $('irEjercicios').href = ENLACE_EJERCICIOS;
    $('salir').href = ENLACE_SALIR;
    if (EMBED && CFG.siguiente) {   // (5-nov-2026) dentro de la intro de una carta de ritmo: «Ver el ejemplo» pasa a la parte siguiente
      $('irEjercicios').addEventListener('click', e => { e.preventDefault(); if (jugando) pausa(); try { parent.postMessage({ intro: CFG.siguiente }, '*'); } catch (x) { } });
    } else if (EMBED) $('irEjercicios').target = '_top';
    if (EMBED) {
      $('salir').addEventListener('click', e => { e.preventDefault(); if (jugando) pausa(); try { parent.postMessage({ intro: 'salir' }, '*'); } catch (x) { } });
    }
    document.addEventListener('keydown', e => {
      if (e.code === 'Space') { e.preventDefault(); alternar(); }
      else if (e.code === 'ArrowRight') ir(tiempo() + 5);
      else if (e.code === 'ArrowLeft') ir(tiempo() - 5);
      else if (EMBED && e.key === 'Escape') { if (jugando) pausa(); try { parent.postMessage({ intro: 'salir' }, '*'); } catch (x) { } }
    });
    // mostrar controles al mover el ratón
    let tm = null;
    document.addEventListener('mousemove', () => { document.body.classList.add('raton'); clearTimeout(tm); tm = setTimeout(() => document.body.classList.remove('raton'), 2200); });
    // (29-sep-2026, Iago) mientras suena, el cursor desaparece si no se mueve (vuelve al moverlo)
    const stc = document.createElement('style');
    stc.textContent = 'body.sonando:not(.raton),body.sonando:not(.raton) *{cursor:none!important}';
    document.head.appendChild(stc);
  }
  window.addEventListener('DOMContentLoaded', () => arrancar().catch(e => { console.error(e); document.title = 'ERROR ' + e.message; }));
})();
