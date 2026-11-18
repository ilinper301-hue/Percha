# Plan de mejoras de Percha

Análisis hecho el 13-11-2026 sobre el commit `6d46a73`. Cada tarea tiene una casilla: márcala `[x]` al terminarla y añade una línea en el **Registro** del final.

Orden recomendado: fase 1 → 2 → 3 → 4. Dentro de cada fase, de arriba abajo.

## Modelo y esfuerzo recomendados

| Tareas | Modelo | Esfuerzo |
|---|---|---|
| 1.4 Compartir la copia | Sonnet | Bajo |
| 1.5 Importación robusta | Sonnet | Medio |
| 2.1 a 2.3 Añadir prendas | Sonnet | Medio |
| 3.1 Separar el código en archivos | Opus | Alto |
| 3.2 a 3.4 Service worker, fuentes, fallos | Sonnet | Medio |
| 4.1 a 4.4 y 4.6 Táctil, contraste, botones, cerrar hojas, outfit desde prenda | Sonnet | Bajo |
| 4.5, 4.7 y 4.8 Buscar y filtrar, tarjeta de outfit, gráficas | Sonnet | Medio |

---

## Fase 1 · Fotos y copia de seguridad (lo más urgente)

- [x] **1.1 Miniaturas aparte.** Hoy cada prenda guarda una sola imagen de hasta 1000 px (`loadPhoto`, `processPhoto`) y se usa también en miniaturas de 28-52 px. Guardar `img` (≈800 px) + `thumb` (≈200 px) y usar `thumb` en `mini()`, rejillas y semana. Migrar las prendas existentes al arrancar (generar `thumb` si falta).
- [x] **1.2 WebP.** Codificar en `image/webp` (con transparencia si se quitó el fondo) y caer a PNG/JPEG si el navegador no lo admite (`canvas.toBlob` devuelve otro tipo).
- [x] **1.3 Copia en ZIP.** `exportData` mete todas las fotos en base64 dentro de un único JSON: con 100+ prendas puede agotar la memoria del móvil. Pasar a ZIP (`data.json` + carpeta `fotos/`) con un compresor mínimo propio (formato ZIP "store", sin dependencias). Mantener la importación del JSON antiguo.
- [x] **1.4 Compartir la copia.** Usar `navigator.share({files:[...]})` cuando exista (para mandarla a Drive, WhatsApp, etc.) y la descarga como alternativa.
- [x] **1.5 Importación robusta.** Validar estructura y tipos en `applyImport`, no borrar nada hasta que la copia se haya leído entera, y aplicar el tema importado (`applyTheme`).

## Fase 2 · Añadir prendas más rápido

- [x] **2.1 Alta múltiple.** Permitir elegir varias fotos a la vez (`multiple` en `#f-photo`) y crear una cola: se revisa cada prenda en una hoja corta (nombre, categoría, color) con "Siguiente".
- [x] **2.2 Color automático.** Detectar el color dominante de la foto (ignorando el fondo quitado) y proponer el más cercano de `COLORS`. El usuario puede corregirlo.
- [x] **2.3 Formulario más corto.** En `drawEdit`, dejar visibles foto, nombre, categoría y color; plegar estilo, temporada, precio y comodín en "Más detalles".

## Fase 3 · Estructura del código

- [x] **3.1 Separar `index.html` (97 KB) en archivos.** Propuesta: `styles.css`, `js/datos.js` (constantes, guía de color), `js/almacen.js` (IndexedDB, copia), `js/motor.js` (compatibilidad, combos, generar semana), `js/vistas.js` (Hoy, Armario, Semana, Datos, hojas), `js/app.js` (acciones y arranque). Módulos ES (`type="module"`), sin herramientas de compilación. Actualizar la lista `CORE` de `sw.js`.
- [x] **3.2 Service worker.** Para la navegación, red con límite de 3 s y si no, caché (hoy espera indefinidamente con mala cobertura). Subir versión de caché y avisar con un toast "Hay una versión nueva · Recargar".
- [x] **3.3 Fuentes locales.** Servir Geist y Source Serif 4 desde el repo (woff2, solo los pesos usados) en vez de Google Fonts.
- [x] **3.4 Fallos menores.**
  - Al borrar una prenda, limpiar también sus entradas de `S.blocks` (`deleteItem`, `clearDemo`).
  - Si la app queda abierta y cambia el día, recalcular "Hoy" (`visibilitychange` → `render()`).
  - `wipeDo` debería borrar también el tema guardado en `localStorage` o mantenerlo de forma explícita.

## Fase 4 · Diseño e interfaz

- [x] **4.1 Tamaños táctiles.** Mínimo 44×44 px en enlaces (`.link`), muestras de color (`.swc`, hoy 32 px) y botones del `stepper`.
- [x] **4.2 Contraste.** Pestañas inactivas (`--faint` sobre `--bg`, ≈2,3:1) → usar `--muted` (≥4,5:1). Revisar también `.pill .c` y textos `--faint`.
- [x] **4.3 Acción principal coherente.** Hoy alterna verde (`.btn.primary`) y negro (`.btn.dark`). Regla: verde = acción principal de la pantalla; negro solo para el FAB.
- [x] **4.4 Cerrar hojas deslizando.** El tirador (`.grab`) no hace nada: arrastrar hacia abajo la cabecera de la hoja para cerrarla.
- [x] **4.5 Armario: buscar y filtrar.** Buscador por nombre, filtros por color y estilo, y selección múltiple (mandar al cesto, borrar).
- [x] **4.6 Outfit desde una prenda.** En la ficha (`detailSheet`), botón "Crear outfit con esta prenda" que arranque el flujo con esa prenda ya elegida en su paso.
- [ ] **4.7 Tarjeta de outfit.** Con fotos recortadas en cuadrado (`fit:'cover'`) el flat lay parece una pila de cuadrados: usar formas redondeadas con fondo `--tile` y mejor proporción entre arriba, abajo y calzado.
- [ ] **4.8 Datos con gráficas.** Reparto por color y por categoría, y usos por semana en las últimas 8 semanas.

## Ideas para más adelante (no prioritarias)

- Varios outfits por día o registrar días pasados desde Semana.
- Capas (camisa + jersey) y outfits favoritos guardados.
- Lista de deseos / prendas que faltan para completar combinaciones.

---

## Registro

| Fecha | Tarea | Notas |
|---|---|---|
| 13-11-2026 | Análisis | Plan creado. Nada implementado todavía. |
| 18-11-2026 | 1.1 Miniaturas | Foto a 800 px + `thumb` a 320 px (no 200: las rejillas de 2 columnas se ven borrosas en pantallas 3x). `thumb` en `mini()`, rejillas y "Hace tiempo"; foto grande en ficha y tarjeta de outfit. Migración al arrancar e importar (`ensureThumbs`). La copia no exporta miniaturas. Helpers `scaleCanvas`/`encodeCanvas` listos para 1.2. Caché `percha-v4`. |
| 18-11-2026 | 1.2 WebP | `encodeCanvas` prueba `image/webp` (calidad 0,82) y, si el navegador no lo codifica (Safari), cae a PNG/JPEG y no lo vuelve a intentar. Mantiene la transparencia. En prueba: ≈8× menos que PNG sin fondo y ≈2× menos que JPEG. Las fotos ya guardadas no se recodifican. Caché `percha-v5`. |
| 18-11-2026 | 1.3 Copia en ZIP | `percha-copia-AAAA-MM-DD.zip` con `data.json` (`version:2`, `img` = ruta) + `fotos/<id>.<ext>`. ZIP "store" propio (`makeZip`/`readZip`, con CRC comprobado). `readBackup` detecta ZIP o JSON antiguo (v1). Probado con `unzip -t` y restaurando ambos formatos. Caché `percha-v6`. |
| 18-11-2026 | Modelo y esfuerzo | Añadida la tabla de modelo y esfuerzo recomendados por tarea. |
| 18-11-2026 | 1.4 Compartir | Botón "Compartir copia" en Ajustes, solo si el navegador admite `navigator.share` con archivos; "Exportar copia" sigue descargando. Si se cancela el menú no se marca la copia como hecha. Caché `percha-v7`. |
| 18-11-2026 | 1.5 Importación robusta | `cleanBackup` valida y limpia la copia en memoria (prendas sin id/categoría válida, fechas, referencias a prendas inexistentes, ajustes con tipo erróneo) antes de elegir el archivo y otra vez antes de borrar nada. Si falla, no se toca nada. Aplica el tema importado. Probado con archivos basura, copia con datos sucios y copia con tema oscuro. Caché `percha-v8`. **Fase 1 completa.** |
| 18-11-2026 | 2.1 Alta múltiple | `#f-photo` admite varias fotos al crear una prenda. Cola en `D` (`queue`, `qIndex`, `qTotal`): hoja "Prenda 2 de 5" con "Siguiente" ("Guardar" en la última) y "Terminar" para cortar (las ya guardadas se conservan). Cada prenda hereda categoría, estilo y temporada de la anterior; el color y el nombre se piden de nuevo. Al acabar, toast "N prendas añadidas" sin pasar por Combinaciones (se pueden marcar luego desde la ficha). Probado con 3 fotos. Caché `percha-v9`. |
| 18-11-2026 | 2.2 Color automático | `detectColor`: reduce la foto a 48 px, cada píxel vota por el color de `COLORS` más cercano (distancia en Lab) y gana el más votado. Ignora transparentes; sin quitar fondo solo mira la zona central. Se propone al cargar la foto y al cambiar fondo/sensibilidad, con "(sugerido)" junto al nombre; si el usuario elige color a mano ya no se toca. "Estampado" no se detecta. Probado con azul marino y rojo sobre fondos claros. Caché `percha-v10`. |
| 18-11-2026 | 2.3 Formulario más corto | En `drawEdit`, estilo, temporada, precio y comodín van dentro de un `<details id="f-more">` "Más detalles" (cerrado al crear, abierto al editar; recuerda su estado en `D.more` aunque se redibuje la hoja). Foto, nombre, categoría y color siguen visibles. Probado al crear, guardar y editar. **Fase 2 completa.** Caché `percha-v11`. |
| 18-11-2026 | 3.1 Separar en archivos | `index.html` queda en 2,4 KB + `styles.css` + 5 módulos ES en `js/` (`datos`, `almacen`, `motor`, `vistas`, `app`); `index.html` carga solo `js/app.js`. Código movido tal cual, con `export`/`import` explícitos; `setD` y `setDb` para las dos variables que se reasignaban desde otro módulo. `sw.js`: nuevos archivos en `CORE` y descarga sin caché HTTP al instalar. Probado: misma captura píxel a píxel que antes, alta de 2 fotos, edición, borrado, semana, ajustes, exportar ZIP e importarlo, borrar todo y 720 clics aleatorios sin errores. Caché `percha-v12`. |
| 18-11-2026 | 3.2 Service worker | Navegación: red con límite de 3 s (`AbortController`); si no llega, caché. Ya no hay `skipWaiting` automático: al instalarse una versión nueva el service worker espera y la app muestra el aviso fijo "Hay una versión nueva · Recargar" (`toast` admite `sticky`); al pulsar, `SKIP_WAITING` y recarga en `controllerchange`. No se avisa en la primera instalación. Probado con Chrome: aviso, recarga, y navegación con servidor lento (3,3 s). Caché `percha-v13`. |
| 18-11-2026 | 3.3 Fuentes locales | `fonts/Geist.woff` (30 KB, variable 100-900) y `fonts/SourceSerif4.woff` (36 KB, variable 400-600, tamaño óptico fijo en 20), recortadas a latín/español con `pyftsubset`; incluyen `…`, `→`, `−`, `›`, `€`. Formato WOFF y no WOFF2 porque aquí no hay compresor brotli (todos los móviles lo admiten). `@font-face` en `styles.css`, quitadas las etiquetas de Google Fonts y su excepción en `sw.js`; fuentes añadidas a `CORE`. Licencias OFL en `fonts/`. Probado en Chrome: cargan, cero peticiones externas y funcionan sin conexión. Caché `percha-v14`. |
| 18-11-2026 | 3.4 Fallos menores | `deleteItem` y `clearDemo` limpian también `S.blocks`. `visibilitychange` recalcula estadísticas y redibuja si cambió el día (no toca si hay una hoja abierta). `wipeDo` conserva el tema a propósito, lo guarda en `settings` y devuelve el resto de ajustes a sus valores por defecto (antes, tras recargar, el tema guardado se perdía y se desincronizaba con `localStorage`). Probado en Chrome con reloj simulado: bloqueo borrado, cambio de día sin errores, borrado total y recarga con tema oscuro. Caché `percha-v15`. **Fase 3 completa.** |
| 18-11-2026 | 4.1 Tamaños táctiles | `.link` mide mín. 44×44 (el "Cancelar" en línea de Hoy usa margen negativo para no estirar la línea); botones del `stepper` de 32 a 44 px; las muestras `.swc` se ven igual (32 px) pero su zona táctil es de 44 px con `::before` (separación 12 px). Medido en Chrome móvil 390 px: enlaces 53×44, stepper 44×44, sin errores en consola. Caché `percha-v16`. |
| 18-11-2026 | 4.2 Contraste | `--muted` claro oscurecido a `#6A6861` (≥4,7:1 incluso sobre `--sunk`/`--tile`). Pestañas inactivas, `.gk`, `.pill .c`, "Ninguna" (`.dfits .none`) y "(opcional)" pasan de `--faint` (2,3:1) a `--muted` (5,3:1 sobre `--bg`). En píldora activa el contador usa `--bg` con opacidad .75. Tema oscuro ya cumplía (`--muted` 6:1). Caché `percha-v17`. |
| 18-11-2026 | 4.3 Acción principal | Los 6 botones `.btn.dark` ("Empezar con el mío", "Añadir…", "Generar semana", "Hacer copia", "Sustituir"…) pasan a `.btn.primary` (verde); quitada la regla `.btn.dark`. Negro (`--fg`) queda solo para el FAB. Probado en Chrome: botón verde, sin errores en consola. Caché `percha-v18`. |
| 18-11-2026 | 4.4 Cerrar hojas deslizando | Arrastrar hacia abajo el tirador o la cabecera de la hoja la mueve con el dedo; al soltar, si pasó de 110 px o fue un gesto rápido se cierra, si no vuelve a su sitio. Eventos `pointer*` delegados en el `scrim` (sobreviven al redibujado de la hoja); los botones de la cabecera siguen funcionando. `.grab` ahora tiene 20 px de alto (la barrita se dibuja con `::after`) y `touch-action:none` en tirador y cabecera. Probado en Chrome con táctil simulado: arrastre corto vuelve, largo cierra (tirador y cabecera), sin errores. Caché `percha-v19`. |
| 18-11-2026 | 4.5 Buscar y filtrar | Armario: buscador por nombre (sin tildes ni mayúsculas, actualiza solo la rejilla `#arm-body` para no perder el foco), botón "Filtros" con panel de color (muestras) y estilo (un valor de cada, con contador), y "Seleccionar" con barra (`armBar`): Todas, Al cesto / Marcar limpias, Borrar (con confirmación en línea) y Listo. Estado nuevo en `S` (`armQ`, `armColor`, `armStyle`, `armFilt`, `armSel`, `armDel`); `armList`/`armBody`/`armBar` exportados de `vistas.js`. Sin resultados: "Nada coincide" + "Quitar búsqueda y filtros". Probado en Chrome móvil con el armario de ejemplo: búsqueda, filtros, cesto y borrado, sin errores. Caché `percha-v20`. |
| 18-11-2026 | 4.6 Outfit desde una prenda | Botón verde "Crear outfit con esta prenda" en la ficha (camisetas, pantalones y calzado disponibles). Acción `outfitWith`: reinicia el flujo, fija la prenda (`S.flow.seed`) y salta el paso que ya está elegido; el primer paso propone prendas que combinan con ella. `goStep` suelta la prenda fija. Probado en Chrome móvil con las tres categorías hasta "Me lo pongo hoy", sin errores. Caché `percha-v21`. |
