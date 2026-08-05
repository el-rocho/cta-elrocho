# Guía de actualización

Esta guía describe el procedimiento general para actualizar la aplicación individual Android o PWA. Los cambios y migraciones propios de cada versión se documentan por separado en sus notas de actualización.

## Antes de actualizar

1. Si tu versión muestra **Datos e informes**, abre **Copias y restauración** y selecciona **Crear y descargar copia**. Si todavía muestra la pantalla antigua **Exportar**, crea un CSV reciente y consérvalo: la versión nueva podrá recuperar sus resultados, aunque no reconstruir todas las tomas originales de cada sesión.
2. Conserva el archivo fuera del almacenamiento privado de la aplicación.
3. Lee las notas de la versión que vas a instalar:
   - [Actualización a 1.6.1-beta.1](docs/actualizaciones/v1.6.1-beta.1.md)
   - [Actualización a 1.6.0](docs/actualizaciones/v1.6.0.md)
   - [Versiones publicadas en GitHub](https://github.com/el-rocho/cta-elrocho/releases)

## Actualizar el APK Android

- Con Obtainium, acepta la actualización ofrecida desde la publicación estable.
- En una actualización manual, descarga el APK desde GitHub Releases e instálalo encima de la aplicación existente.
- No desinstales previamente la aplicación. Android elimina su almacenamiento privado al desinstalar y con él las mediciones que no estén respaldadas.
- Tras abrir la nueva versión, comprueba el historial y la configuración antes de registrar nuevas tomas.

La aplicación mantiene el mismo identificador y firma entre publicaciones oficiales, por lo que una actualización normal conserva el almacenamiento interno.

## Actualizar la PWA

La PWA actualiza su código desde el mismo dominio, pero el historial pertenece al almacenamiento del navegador:

- No borres los datos del sitio antes o después de actualizar.
- Cambiar de navegador, perfil o dominio no traslada el historial.
- Conserva una copia JSON completa e independiente antes de limpiar la caché o restablecer el navegador. Los CSV creados por versiones anteriores continúan siendo importables únicamente como recuperación parcial de los resultados que contienen.

## Volver a una versión anterior

Android normalmente impide instalar un APK con un código de versión inferior encima de uno más reciente. Desinstalar para poder instalarlo borraría los datos internos.

Una versión anterior puede no comprender campos o migraciones incorporados posteriormente. La recuperación recomendada consiste en conservar la versión actual o restaurar una copia compatible siguiendo las indicaciones específicas de la versión, no forzar un downgrade.
