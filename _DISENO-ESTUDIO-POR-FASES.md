# Diseño del estudio por fases · Ritmo entonado at home (GP) · 20-nov-2026

Iago lo aprobó el 20-nov-2026 (09:35–09:51). Es la **referencia** para cualquier otra pantalla en la que el alumno estudie
una lección de ritmo entonado, por ejemplo el visor de lecciones de las tareas de la semana del portal GP (lmpro).
El código de referencia está en `index.html` de este repo (iagonaron/ritmopro). Para localizar cada parte, busca los
nombres de función o el comentario «(20-nov-2026».

## 1. Las 4 fases

> **Diferencia con el visor de lecciones del portal (Iago, 20-nov 09:56):** aquí, en Ritmo entonado at home, cada fase tiene su
> tiempo (3′ · 2′ · 3′) con reloj y paso automático. En el visor del portal NO hay tiempos: el alumno está en cada fase lo que
> quiera, sin reloj, y pasa de fase solo con «Pasar a la siguiente fase».

| Fase | Nombre | Tiempo | Qué hace |
|---|---|---|---|
| 1 | Percusión | 3 min | Percute con la barra espaciadora (cabezas en X) y anota |
| 2 | Ritmo con la mano | 2 min | Cabezas normales. Pone nombre a las notas midiendo el pulso con la mano |
| 3 | Entonación | 3 min | Pide el micrófono. Tónica · Escala · Arpegio y Pistas (hasta 3 notas) |
| 4 | Realización final | — | Acompañamiento con piano y puntuación. «Es una estimación: no cuenta para tus notas de clase» |

**Cartel de fase** (`rpCartel`):
- Al entrar en cada fase sale un cartel que tapa toda la pantalla: opaco, con desenfoque y el botón «Entendido».
- En la fase 3, el botón es «Activar el micrófono y empezar».
- El tiempo empieza a contar al pulsar el botón.

**Paso de fase:**
- Cuando se acaba el tiempo, sale directamente el cartel de la fase siguiente. No hay tiempo de cortesía.
- El alumno puede avanzar antes con «Pasar a la siguiente fase» (en la fase 3: «Pasar a la realización final»).

**Anotaciones:** lo anotado en una fase sigue en las siguientes.

## 2. Pantalla: todo a la vista, sin scroll y al máximo tamaño

Lo que tiene que caber sin bajar: la fila de fases, la lección entera (los 5 pentagramas) y las dos columnas laterales.
La barra de abajo (micrófono, velocidad, subdivisión) puede quedar debajo y verse bajando. Todo esto lo hace `rpEncaja()`.

**Arriba, una sola fila:**
- A la izquierda, las fases (`renderPhaseSteps`). La actual lleva su nombre («3. Entonación»); las demás, solo el número
  en un cuadrado de 40 px.
- A la derecha: ▶ · [Tónica | Escala | Arpegio] · Pistas N · reloj ⏱ · «Pasar a la siguiente fase» · ✕.
- Se quitan «Grado profesional» y la raya.
- «← RITMO ENTONADO at home» pasa al margen izquierdo, arriba y en tres líneas, solo si cabe. Si no cabe, se oculta
  mientras se estudia; con ✕ se vuelve a la lección.

**Partitura:**
- Se dibuja siempre con el mismo ancho de referencia (`RP_REFW = 1058`, viewBox de 1110), así la lección se ve igual en
  todas las fases y las anotaciones no se mueven.
- Se recorta el blanco sobrante del dibujo (viewBox ajustado al getBBox, una sola vez por lección: `L.__rpVB`).
- Después se escala lo máximo posible para que quepa de alto y de ancho (sin tope de tamaño natural), centrada.
- Al cerrar el estudio se deshace todo antes de volver a dibujar la vista normal.

**Pruebas:** se miró en 1366×800, 1366×680, 1024×768 (iPad apaisado) y 1920×950.

## 3. Las dos columnas de anotar (pegadas a la lección, a 10 px)

Las dos columnas comparten este estilo:
- 54 px de ancho, `position: sticky; top: 10px`.
- Cristal oscuro: fondo `rgba(11,19,32,.9)`, borde `1px rgba(255,255,255,.12)`, radio 12, padding 6, separación 5.
- Botones de 40×40, radio 10, fondo `--lm-neutro #243044`.
- El botón activo va en el color de acento: verde `#16a34a` en las fases 1–2 y azul `#2563eb` en la 3 y en la final.

**Izquierda**, de arriba abajo (las rayitas son separadores):
1. Punta fina negra `#000`
2. Punta fina verde `#16a34a` (ritmo)
3. Punta fina azul `#0ea5e9` (entonación)
4. ——
5. Subrayar en verde `#50e68c` (ritmos nuevos)
6. Subrayar en gris `#a3a3a3` (ritmos ya vistos)
7. Patrones △/U
8. Alerta amarilla
9. Alerta roja
10. ——
11. Goma
12. Deshacer
13. Papelera

**Derecha:** los 12 intervalos, con los colores de Intervalia (`RPV_INT`). Son botones de 40×38 con la etiqueta dentro;
«4A/5D» va en dos líneas. Al trazar un intervalo, la línea lleva su etiqueta debajo.

| Intervalo | Color |
|---|---|
| 2m | `#a62c17` |
| 2M | `#ed732e` |
| 3m | `#2f6b1e` |
| 3M | `#9ed649` |
| 4J | `#2355ce` |
| 4A/5D | `#f3ec4e` |
| 5J | `#5ac4f7` |
| 6m | `#8c33b6` |
| 6M | `#d796f8` |
| 7m | `#5a2d05` |
| 7M | `#c98a1e` |
| 8J | `#000000` |

**Montaje:** `#rpAnotBar.rpv-cols` va dentro de `#scoreWrap` (absolute, inset 0). `#scoreWrap.rp-anot` lleva padding de
0 64px y las columnas van en left:0 y right:0. El motor de anotar es `rpAnotarMontar` (una adaptación de tsAnotar del
portal) y devuelve `refit()`.

**Sin tonalidad:** no se pone la rueda de tonalidad (Iago: «lo quitamos, para ganar altura»).

## 4. Colores por fase

- **Fases 1 y 2, en verde** (los de la piel): fase actual, ▶, reloj y «Pasar…».
- **Fase 3 y realización final, en azul** (`body.rp-ent`):
  - fase actual, ▶, reloj y «Pasar…» con contorno azul
  - botón del cartel
  - herramienta activa
- **Tónica · Escala · Arpegio:** contorno azul `#3b82f6` y fondo azul suave.
- **Pistas:** la nota elegida en azul `#2563eb`, parpadeando en azul. El botón «Pistas» lleva contorno azul.
- **Notas al final:** verde = afinada, ámbar = cerca, rojo = desafinada.
- **Estética:** la de la piel actual (LMEAVathome/piel/apps/ritmo.css): colores lisos, sin degradados, cuadrados de 40 px
  y rectángulos con esquinas suaves.

## 5. Mejoras del 20-nov (10:06–10:12, Iago)

Todas siguen siendo la referencia para otras pantallas de estudio.

**Pantalla:**
- La barra de abajo (velocidad, subdivisión y, en la fase 3, el piano) se ve siempre sin bajar. La partitura se ajusta al alto
  que quede, aunque salga algo más pequeña (`rpEncaja` cuenta con `#phaseControls`).

**Velocidad:**
- La que elige el alumno se mantiene en todas las fases, salvo que la cambie. Solo se pone en estándar al empezar el estudio.
- Cada cartel lo avisa con la barra dibujada: 🐢 ● ● ● ● ● 🐇 + «Abajo, en la barra de Velocidad…» (`rpVelAviso`).

**Subdivisión por defecto** (`rpSubDefecto`):
- Fase 1, en corcheas.
- Ritmo con la mano, entonación y realización final: solo el pulso.
- Excepción: en el pentagrama sin compás suenan siempre corcheas, y en los siguientes vuelve el pulso.
- Los carteles lo dicen.

**Claqueta por compás** (`subClicks` + `sched.measInfo`):
- La rejilla de subdivisión empieza en cada parte fuerte.
- En el compás fraccionario (2+¼)/4 suena el golpe de la semicorchea de más, también con solo pulso.

**Cuenta atrás 3-2-1:**
- Va en el centro de la pantalla: un cuadro de 150 px de cristal oscuro, borde del color de la fase y número blanco de 96 px.
- Cada número dura un pulso. Si se para, la cuenta pendiente se cancela.

**Silencios:** también se iluminan al sonar, igual que las notas.

**Fase 2 · «Revelar patrón»** (solo si hay compases dispares):
- Dibuja un △ sobre cada pulso de 3 corcheas y una U sobre los de 2, en verde `#16a34a`, por encima de las notas y de las
  barras de corchete.
- Con el mismo botón se oculta.

**Fase 3 · ayuda del piano:**
- Abajo hay un selector: «Piano: Todas · Pulso · Compás · Pentagrama» (la primera nota de cada pulso, de cada compás o de cada
  pentagrama). Por defecto, Pentagrama.
- El cartel lo anuncia.
- Las pistas siguen iluminadas en azul.

**Fase 4 · realización final:**
- Al empezar solo suena la tónica. Luego, la ayuda se adapta por pentagramas.
- Las notas que va a tocar el piano se marcan antes en azul `#2563eb` (`rpMarcaAyuda`).

**Botones de arriba:**
- «Pasar a la siguiente fase / a la realización final» va relleno del color de la fase, con letra blanca.
- El reloj es más grande (20 px, negrita, blanco con borde del color de la fase). En el visor del portal no hay reloj.

**Generar examen / Editar:** solo los ve el profesor (cuentas Tester/Protester o el navegador con la marca del Diario), y nunca
dentro del estudio ni de la prueba directa.

## 6. Recapitulación de Iago del 20-nov 10:31 (manda sobre lo anterior)

Fuente común: `iagonaron/lmpro/_ESTUDIO-POR-FASES-UNIFICADO.md`. Aplicado aquí lo que toca a Ritmo entonado (§4 y §6 de ese fichero):

**Estudio de entonación (fase 3):**
- No suena el acompañamiento: ni acordes ni melodía entera. El acompañamiento es de la realización final.
- ▶ da el pulso, la tónica en la cuenta atrás y la ayuda del piano que se elija.

**Ayuda del piano:** solo tres opciones, «Sin ayuda · Cada pentagrama · Cada compás» (la 1.ª nota de cada pentagrama o de cada
compás). Desaparecen «Todas» y «Pulso».

**Pistas:**
- Se pulsa «Pistas» y se queda activo, con las notas parpadeando.
- Se eligen las 3 notas con 3 clics seguidos, sin volver al botón.
- Otra pulsación en «Pistas» sirve para salir antes.

**Solo Tester / Protester · botón «Dificultad»:**
- Va arriba, junto al ✕, en todas las fases. En pantallas estrechas sale solo el icono.
- Abre una escala de 0 a 10 (5 = intermedio).
- Si no se ha pulsado, sale sola al final de la realización final.
- Solo se ve en pantalla: no se guarda en ningún sitio.

**Cartel de la fase 3:** texto más sencillo, con las palabras clave en negrita.

## 7. Precisiones de Iago del 20-nov (10:47–10:51)

**Fase 3 · Entonación:** se estudia libremente.
- Sin micrófono: el cartel solo tiene «Entendido» y en la barra de abajo ya no aparece el chip del micrófono.
- Tienes Pistas y la ayuda del piano.
- Las notas que tocará el piano según la ayuda elegida se ven en azul: la 1.ª de cada pentagrama o la de cada compás; con
  «Sin ayuda», ninguna.
- Las notas en azul, sean pistas o ayuda del piano, suenan al pulsarlas siempre que quieras, sin gastar pistas.
- El cartel lo explica todo.
- Al pulsar «Pistas», todas las notas parpadean (en azul claro) hasta que eliges 3 o vuelves a pulsar «Pistas». Las elegidas
  se quedan en azul fuerte.

**Fase 4 · Realización final:**
- El micrófono se activa aquí: el botón del cartel es «Activar el micrófono y empezar».
- No hay pistas ni ninguna nota premarcada en azul; solo se ilumina la figura que toca cantar.
- El piano ayuda según cómo va saliendo, y al final da el porcentaje de acierto.
