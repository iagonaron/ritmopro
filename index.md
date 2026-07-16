# RITMO at home PRO — Traspaso (estado actual)

App de una sola página (HTML + JS vanilla + **VexFlow 4.2.2** por CDN, sin build, sin frameworks).
Generador procedimental de lecciones de **lectura rítmico-melódica tonal** para 2º de Grado Profesional,
con sistema de estudio por fases y motor de audio Web Audio. GitHub Pages, usuario `iagonaron`.
Archivo: `ritmo-at-home-pro.html`. Hook de depuración: `window.RITMO`.

---

## Estructura de la lección
- 4 frases: 2 en clave de sol + 2 en clave de fa (agrupadas). **Un solo cambio de compás**, en el cambio de clave.
- 3-4 compases por frase. Cada frase cierra con **respiro** (silencio en el último pulso); el último compás de la lección es un **reposo** (figura larga sobre la tónica).
- Cada lección lleva **≥1 alteración accidental** garantizada (color tonal), también en tonalidades mayores.

## Trimestres (`TRIMS`) y tonalidades
- **t1 — Compases irregulares**: `5/8, 7/8, 6/8, 3/4, 2/4`. Garantía: **al menos uno de los dos compases es irregular (5/8 ó 7/8)**. Tonalidades base (≤1 alteración).
- **t2 — Grupos de valoración especial** (en varios pulsos): `2/4, 3/4, 4/4`. Base (≤1 alteración).
- **t3 — Subdivisión binaria con fusas**: `2/4, 3/4, 4/4`. Dificultad plena en **ambas claves** (fusas también en clave de fa). Tonalidades **hasta 4 alteraciones** (18 tonalidades, `KEY_POOL_WIDE`). Densidad alta (`DENSE=46`).
- **rep — Repaso de los tres trimestres**: una clave = compás **irregular** (1er trim.); la otra clave = compás **regular** con una frase de **grupos** (2º) y otra de **fusas** (3º). **Nunca** mezcla grupos con compases irregulares.

`KEY_POOL_BASE` = C, G, F, Am, Em, Dm. `KEY_POOL_WIDE` añade hasta 4 alteraciones (D, A, E, Bb, Eb, Ab, Bm, F#m, C#m, Gm, Cm, Fm). `TONIC_PC` y `KEY_ACCIDENTALS` cubren todas; `accidentalFor` no dibuja alteraciones de más a las notas diatónicas de la armadura.

## Motor melódico TONAL (clasicismo) — lo más importante
Reescrito por completo (sustituye al antiguo `walkPhrase`, que era un paseo aleatorio sin armonía):
- **Progresión funcional por compás** (`PROGS`, `ROMAN`, `chordDegsOf`, `pickProg`): I, ii, IV, V (con V7 cadencial), vi. Frases finales terminan en cadencia auténtica (…V–I); frases intermedias pueden cerrar en V (semicadencia) o I.
- **Peso métrico**: en **partes fuertes** (pulsos reales del compás, vía `pulseOnsetsQ(m)`) se eligen **notas del acorde**; en **partes débiles**, grados conjuntos (notas de paso / floreos) que conectan notas del acorde. Las figuras internas de un grupo de valoración especial cuentan como débiles.
- **Conducción de voces**: resolución de tendencias (7→1, 4→3, 2→1), saltos solo entre notas del acorde y compensados por paso contrario, **máximo 2 saltos seguidos**, grado conjunto mayoritario, arco con un único clímax, sin tritono/7ª/+8ª.
- **Cadencias**: 1ª nota de la frase 0 = tónica; 1ª de cada frase = nota del acorde inicial; última nota = fundamental del acorde final (tónica en la frase final, acercando la penúltima a la supertónica para 2→1).
- `composePhrase` devuelve índices de escala; `assignMelodyLesson` arma slots (acorde + fuerte/débil) y mapea a midi/key. La sensible elevada (7→1 en menor) y el reposo se aplican después.

**Métricas headless (típicas)**: parte fuerte→acorde **97-99%**, no-acorde resuelto por grado conjunto **82-88%**, saltos **13-26%**, final de frase correcto **~99%**, 0 lecciones inválidas, render 1:1.

> Pendiente subjetivo: la musicalidad es opinable. Iago debe escuchar y decir qué sigue chirriando (¿demasiados arpegios? ¿poca variedad rítmica del contorno? ¿quiere secuencias/motivos repetidos estilo barroco?).

## Alteración accidental garantizada (`injectAccidental`)
Inyecta UNA nota cromática musical por lección (sensible aplicada / nota de paso que resuelve por semitono), conservando letra y octava, con validación interna (`validateMelody`) para no romper la conducción. Sin dobles alteraciones.

## Audio (Web Audio)
- **Piano (`synth`)** tanto en la melodía de la lección como en "Escuchar escala y acordes" (mismo timbre).
- **Escala y acordes**: menor melódica al subir / natural al bajar; cadencia I–IV–V–I con **tiple en la tónica** (en V baja a la sensible). Ej. Mi menor: tiple Mi, Mi, Re♯, Mi.
- **Claqueta (`click`)**: UNA sola altura; el acento del pulso es solo de volumen.
- **Percusión (`knock`)**: tick corto, seco y neutro (sin resonancia ni cuerpo grave). *Pendiente de validación de oído.*
- **Tempos** (`TEMPOS`, negras/min, fáciles de ajustar): extrema **30** · lenta **51** · estándar **61** (por defecto) · rápida **71**.
- **Subdivisión** (`subClicks`): por defecto **Pulso** (la claqueta marca el pulso real: negra c/puntillo en 6/8, agrupación en 5/8…). El alumno puede añadir **Corchea** o **Semicorchea** (deseleccionables; ninguna por defecto).
- **Cuenta atrás de las fases 5 y 6**: suena con la **nota de comienzo** (referencia para cantar).

## Fases de estudio (`PHASE_DEFS`)
1 Análisis · 2 Percusión · 3 Claqueta · 4 Solfeo · 5 Entonación · 6 Cantas solo (+ "Preparar grupos" en t2).
- **Tarjeta superior** de cada fase: se auto-cierra a los **7 s** con cuenta atrás sutil **5-4-3-2-1** (análisis se queda).
- **Fase 5**: un **único** cartel que explica la fase Y pregunta "¿cómo lo quieres escuchar?" (tesitura real / agudo / grave). Dura **12 s**, cuenta atrás desde **10**; se esfuma al elegir (con refuerzo visual) o al pulsar Reproducir.
- Botón **Reproducir = Parar** (mismo botón, toggle). Velocidad: 🐢 Extremadamente lenta (a la izquierda, con explicación) · Lenta · Estándar · Rápida.

## Render
- Una línea por frase, **salvo frases con fusas → 2 compases por línea** (notas tamaño parecido a t1/t2). Anchos justificados a un ancho común.
- SVG **responsivo y centrado** (`viewBox` + `width:100%` + `max-width` natural + `margin:0 auto`): cabe siempre y queda encuadrado igual en vista normal y en fases. `.phase-sheet` max-width 1084px (= área principal) para que no se descoloque.
- **Resaltado dorado** sincronizado: `collectNoteEls` reconstruye la máscara de silencios desde el modelo (VexFlow no marca los silencios con clase) → ya no se descuadra tras el silencio de fin de frase.

## Bugs corregidos en esta etapa
- Resaltado dorado desincronizado tras los silencios (causa raíz: detección de silencios por clase inexistente).
- En mayor, el motor subía el 7º grado y lo convertía en tónica (sensible solo en menor ahora).
- Lecciones que no cabían (SVG responsivo) y descuadre al entrar en fases (ancho de `.phase-sheet`).

## Pendiente / decisiones abiertas
- **Oído**: validar percusión seca y claqueta; afinar números de tempo si hace falta.
- **t3**: densidad de fusas (~36 figuras de 32 por lección, ~1 de cada 3 pulsos) a calibrar con capturas reales de Iago; adaptar la **guía de estudio** a la nueva dificultad.
- **Melodía**: feedback de escucha de Iago para seguir afinando el estilo (¿secuencias/motivos?, variedad, etc.).
- ¿Subir t1/t2 a 2-3 alteraciones, o dejarlas en ≤1? (Ahora solo t3 amplía a 4.)
- "Fusas (32)" confirmado; semifusas (64) descartadas por extremas en 2º GP (reabrir si Iago insiste).

## Verificación headless
`harness.js` carga el HTML inyectando VexFlow local (npm `vexflow@4.2.2` + `jsdom`) y expone `window.RITMO`.
`window.RITMO` incluye: `genLesson, renderLesson, buildSchedule, renderGroupMini, chordDegsOf, pulseOnsetsQ, measureNoteBeats, degreeOf, ROMAN, TONIC_PC, buildScale` (+ getters `lesson`, `active`).
Comprobado: 0 inválidas, 0 excepciones de render, `g.vf-stavenote` == nº de notas del modelo (mapeo dorado 1:1), garantía de cromatismo, garantía de irregular en t1, fusas+wrapping en t3, estructura del repaso.
