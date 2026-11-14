# Coordinación entre conversaciones de Claude · ritmopro

Antes de subir nada: mira el último commit y añade aquí tu huella (quién eres, qué vas a tocar). Una subida cada vez; marca EN CURSO / HECHO.

## Huellas
- 2026-11-05 08:50 · Conversación «VÍDEOS DIDÁCTICOS DE RITMO · GVE en varios pulsos» · HECHO (sustituido por la huella de las 17:20)
  - Va a tocar en index.html SOLO el bloque de las intros de las cartas 2.1–2.8 (CSS .gvx-* y <script id="introGVE">, GDEFS): vídeo ▶ + ejemplo + «Practicar en bucle».
  - Último commit visto: e571a5f (27-oct, INTRO 1.6).
  - Estado del proyecto: Dropbox /APPs/VIDEOS RITMO GVE 2GP/ESTADO.md
- 2026-11-05 17:20 · Conversación «VÍDEOS DIDÁCTICOS DE RITMO · GVE en varios pulsos» · HECHO (17:25, commit bf476a9)
  - Sube intros/gve-2-1 … gve-2-8 (carpeta nueva, vídeo MP4 ligero) y en index.html SOLO el bloque de intros 2.1–2.8 (<script> de VIDEOS_GVE/VARIANTES_GVE y el registro de CARD_INTROS): vídeo → rondas → «Generar lectura» / «Salir». Abierto a todos (permiso de Iago 5-nov 16:52).
  - Último commit visto: 7aa80ad.
- 7-nov 08:15 · Mantenimiento · HECHO · index.html: en el compás de cortesía fraccionario (fin de pentagrama) el «−¼» se dibujaba encima del «2» y no se veía el menos; ahora va 13 px más a la derecha y se reserva más hueco (31 en vez de 20).
- 7-nov 09:55 · Mantenimiento · HECHO · index.html: (1) alteraciones con memoria dentro del compás (el ♮ que anula un ♯/♭ anterior ya sale; antes solo se comparaba con la armadura) y n.cortesia = alteración de precaución entre paréntesis; (2) el pentagrama sin compás ya no lleva barras de compás dentro (todo él cuenta como un compás para las alteraciones).
- 7-nov 15:30 · Exámenes 1T (Claude, conversación de mantenimiento) · HECHO · index.html: el mundo 1 solo genera con la forma del examen de 2.º GP — 3 pentagramas en sol (sin compás · cambios constantes · fraccionario) y 2 en fa; el fraccionario sale de suma (2+¼)/4 tres de cada cuatro veces. Último commit visto: 1e31db8.
- 10-nov 10:15 · Mantenimiento (Claude, conversación de mantenimiento) · HECHO · index.html: la lección generada SOLO con la 1.8 (p. ej. al acabar su intro) salía con barras de compás — ahora sin barras (como el pentagrama sin compás de la forma del examen); la partitura dibujada con el recuadro oculto se vuelve a dibujar al hacerse visible, para ocupar todo el ancho de la tarjeta; y en esa lección cada pentagrama lleva más música (3 «compases» de relleno en vez de 2). Último commit visto: 71a3207.
- 10-nov 18:40 · Mantenimiento (mundo entero) · HECHO · index.html: en «Un mundo», con el mundo elegido y ninguna carta marcada, «Generar lectura» usa todas las cartas del mundo (para el 1T de 2.º GP: elegir el mundo 1 y generar). Último commit visto: deb3ebc.
- 13-nov 09:30 · C3 · «Qué suma v2» (enjambre, Claude) · HECHO (13-nov 10:05, commit 83d12db en ritmopro y 3cdacc2 en ritmoathome; cómo deshacer: en GitHub, abrir cada commit → «Revert») · index.html de RITMO entonado: botón «Entendido» en los cartelitos, sonido de ritmos como el quiz (percusión + grave sostenido), mantener pulsado en la fase 2, ▶ verde y «Siguiente» solo contorno, «beta» fuera de «Combina mundos», un solo mundo → lectura con todas sus cartas, y registro del tiempo válido (RPC suite_actividad_terminada). Último commit visto: a718a73 (10-nov). Después subo lo mismo en ritmoathome (index.html).
- 2026-11-14 11:40 · Conversación «VÍDEOS DIDÁCTICOS DE RITMO · GVE en varios pulsos» · EN CURSO
  - Calidad Teoría PRO en las intros 2.1–2.8: en intros/gve-2-X/ sustituye gve-2-X.mp4 (720p30) por gve-2-X_1440.mp4 (1440p60) y
    gve-2-X_60.mp4 (1080p60 de respaldo) y cambia SOLO la línea de window.VIDEO_MP4 de su index.html (elige 1080p60 en equipos
    justos como el del aula; forzar con ?hd=1440 / ?hd=1080). Mismo contenido. No toca el index.html de la raíz.
  - Último commit visto: 903b2c3. Sube por tandas (2.1–2.2 ya; el resto al terminar de renderizar).
