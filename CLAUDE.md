# Percha · instrucciones para Claude

Percha es una PWA de organización de armario (HTML/CSS/JS sin dependencias, datos en IndexedDB del móvil). Se publica con GitHub Pages desde `main`.

## Si el usuario dice "continúa"

1. Lee `MEJORAS.md`.
2. Toma la primera tarea sin marcar (`- [ ]`) en el orden de las fases.
3. Impleméntala, pruébala (al menos que la página cargue sin errores en consola y que la parte tocada funcione) y marca la casilla.
4. Añade una línea al **Registro** de `MEJORAS.md`.
5. Haz commit y push a `main` con un mensaje en español.
6. Responde en pocas líneas: qué se hizo y cuál es la siguiente tarea, con el modelo y esfuerzo recomendados (tabla de `MEJORAS.md`).

Si una tarea es grande, divídela y completa solo una parte por sesión, dejándolo anotado en el Registro.

## Preferencias del usuario

- Responder en español, breve y por partes.
- No pedir confirmación para cambios pequeños: implementar y probar.
- Delegar tareas mecánicas en modelos más baratos (Sonnet o Haiku) cuando sea posible.
- Trabaja solo desde el móvil: nada que requiera un ordenador para probar o desplegar.
- Avisar cuando el chat se alargue demasiado y convenga abrir uno nuevo, indicando el nivel de esfuerzo recomendado.

## Notas técnicas

- Estructura (módulos ES, sin compilación): `index.html` (marcado) · `styles.css` · `js/datos.js` (constantes, utilidades, iconos, ilustraciones, guía de color) · `js/almacen.js` (estado `S`, IndexedDB, imágenes, copia ZIP/JSON, armario de ejemplo) · `js/motor.js` (estadísticas, compatibilidad, combinaciones, generar semana) · `js/vistas.js` (tema, toast, hojas, pantallas, alta/edición de prendas, ajustes) · `js/app.js` (acciones `A`, eventos y arranque).
- Los `let` exportados no se pueden reasignar desde otro módulo: usa un setter (`setD`, `setDb`) o declara la variable donde se asigna. Al usar una función de otro módulo, añádela a su `import`.
- Si añades un archivo, inclúyelo en `CORE` de `sw.js`.
- Al cambiar archivos que cachea el service worker, sube la versión `CACHE` en `sw.js`.
- No romper la compatibilidad con copias de seguridad: JSON antiguo (`app:'percha', version:1`, fotos en data URL) y ZIP actual (`version:2`, `data.json` + `fotos/`).
