<p align="center">
  <img src="public/logo-day.png" alt="Logo Control Tensión Arterial Offline" width="160" height="160" />
</p>

# Control Tensión Arterial 🩺

![Built with Vibe Coding](https://img.shields.io/badge/Built%20with-Vibe%20Coding%20%26%20AI-7c3aed?style=for-the-badge&logo=sparkles)
![Android APK](https://img.shields.io/badge/Android-APK%20Nativa%20v1.6.0-3DDC84?style=for-the-badge&logo=android)
![Obtainium Compatible](https://img.shields.io/badge/Obtainium-Releases%20v1.6.0-2563eb?style=for-the-badge&logo=github)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue?style=for-the-badge)

Aplicación nativa Android (PWA y APK) para el registro, seguimiento y análisis de la tensión arterial. Diseñada para ofrecer máxima privacidad en dispositivos Android (sin servicios de Google, compatible con GrapheneOS). 

100% control de tus datos: privados, offline y sin comunicación con servidores externos.

> ✨ **Metodología de Desarrollo**: Este proyecto ha sido conceptualizado, diseñado y guiado mediante **Vibe Coding**, utilizando asistencia avanzada de Inteligencia Artificial para la generación de código y arquitectura.

---

## 💡 Ecosistema de Aplicaciones: ¿Qué versión elegir?

Este repositorio corresponde a la **Versión Individual / Móvil Android (APK y PWA offline)**. El proyecto cuenta con tres aplicaciones según tus necesidades:

| Aplicación | Repositorio GitHub | Descripción y Uso |
| :--- | :--- | :--- |
| 📱 **Versión Individual Móvil (PWA y APK)** | **[cta-elrocho](https://github.com/el-rocho/cta-elrocho)** *(Este repo)* | Ideal para uso personal en un único teléfono. Funciona **100% offline**, sin cuentas, sin servidor y guardando todos los datos en el almacenamiento interno privado del dispositivo. |
| 🐳 **Servidor Autoalojado (Docker)** | [**cta-elrocho-selfhosted**](https://github.com/el-rocho/cta-elrocho-selfhosted) | Ideal si deseas desplegar la app en tu servidor privado o NAS para gestionar **varios perfiles familiares (~10 usuarios)** con base de datos SQLite y **2FA TOTP**. |
| 🚀 **Cliente Servidor (PWA y APK)** | [**cta-elrocho-client-app**](https://github.com/el-rocho/cta-elrocho-client-app) | App cliente para conectar al servidor autoalojado, con las mismas funcionalidades que la versión individual. |

### 🔄 Migración de Datos a la Versión Autoalojada:
Si en algún momento decides pasar de esta app móvil individual al servidor familiar:
1. Abre **Datos e informes** &rarr; **Informes**, selecciona **Todo** y descarga el informe `.csv`.
2. Entra en tu cuenta de la [Versión Autoalojada (cta-elrocho-selfhosted)](https://github.com/el-rocho/cta-elrocho-selfhosted).
3. Ve a **Datos e informes** &rarr; pestaña **Importar / Restaurar** y sube el archivo `.csv`. Se migrarán los resultados efectivos incluidos en el informe, no las tomas originales que pudieran componer cada sesión.

El CSV sirve para esta migración entre aplicaciones, pero no es una copia de seguridad. Para restaurar esta aplicación conserva además una copia completa `.cta-backup.json`.

---

## 📲 Instalación y Actualizaciones (Obtainium, APK y PWA)

Las compilaciones oficiales del APK y el despliegue de la PWA se generan automáticamente mediante **GitHub Actions**.

### 1. 📱 Instalación con Obtainium (recomendada en Android)

La aplicación es totalmente compatible con **[Obtainium](https://github.com/ImranR98/Obtainium)**. Escanea este código QR desde Obtainium en tu teléfono Android o añade manualmente la URL del repositorio (`https://github.com/el-rocho/cta-elrocho`):

<p align="center">
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://github.com/el-rocho/cta-elrocho" alt="Código QR para Obtainium - cta-elrocho" width="160" height="160" />
  <br />
  <sub><b>Escanea desde Obtainium para instalar y recibir actualizaciones</b></sub>
</p>

### 2. 📥 Descarga manual del APK (GitHub Releases)

1. Accede a la sección **[Releases del Repositorio](https://github.com/el-rocho/cta-elrocho/releases)**.
2. Descarga la última versión del archivo `control-tension-arterial.apk`.
3. Instala el paquete `.apk` en tu dispositivo Android.

Antes de instalar una nueva versión, consulta la **[guía de actualización](UPGRADING.md)** y las notas de la versión correspondiente.

### 3. 🌐 Uso como PWA (navegador web / pantalla de inicio)

- Accede a la **[PWA de Control Tensión Arterial](https://el-rocho.github.io/cta-elrocho/)** desde el navegador de tu dispositivo.
- Puedes instalarla en la pantalla de inicio desde las opciones del navegador para utilizarla como una aplicación.
- Los datos se almacenan exclusivamente en el propio dispositivo y navegador; no se envían a ningún servidor.

---

## 🚀 Características Principales

- **Soporte Bilingüe Completo (Español / Inglés)**: Selección de idioma desde la pantalla de **Configuración** (🇪🇸 Español / 🇬🇧 English). Interfaz, ruletas, gráficos, notificaciones e informes se adaptan al instante.
- **Experiencia Nativa Android**: Funciona como una App independiente a pantalla completa.
- **100% Offline y Privada**: Todos los datos residen exclusivamente en el almacenamiento interno de tu teléfono (`localStorage`). Las fuentes tipográficas están incluidas en la aplicación y no se descargan desde servicios externos.
- **Sistema Dual de Entrada**: Elige entre teclado numérico tradicional o **Ruleta Táctil de Selección Rápida**.
- **Referencias clínicas**: Etiquetas y avisos configurables según las recomendaciones de las guías `ESC 2024`, `AHA/ACC 2025` o `ISH 2020`, sin modificar las mediciones.
- **Objetivos terapéuticos**: Para usuarios medicados, valores recomendados según guía y edad, editables para poder ajustarlos a las indicaciones de nuestro facultativo.
- **Evolución y tendencias**: Gráficas de `1 mes`, `3 meses`, `6 meses` o `1 año`, estadísticas del periodo, presión de pulso, presión arterial media estimada, carga de presión y tendencias de las medias diarias de las últimas cuatro semanas.
- **Filtro de bata blanca**: Agrupa tomas consecutivas y calcula un único resultado efectivo tras descartar, cuando corresponde, las tomas iniciales elevadas.
- **Informes PDF**: Valores estadísticos, métricas cardiovasculares, gráficos temporales, diagrama de dispersión PAS/PAD y tabla detallada de las medidas realizadas.
- **Datos, copias e informes**: copias JSON completas y versionadas, informes CSV/PDF, recuperación parcial compatible con los CSV históricos e importación de MyTherapy.

---

## 🛡️ Filtro de Síndrome de Bata Blanca

El **Filtro de Síndrome de Bata Blanca** mitiga la distorsión generada por el sesgo de alerta o ansiedad inicial del paciente al utilizar el medidor de tensión.

### 🔬 Cómo funciona el algoritmo:
1. **Agrupación Consecutiva**: Se agrupan dentro de una misma sesión todas las mediciones donde el intervalo entre las tomas sea menor o igual a **5 minutos**.
2. **Sesiones de 2 tomas**: Si la 1ª toma es significativamente superior a la 2ª ($\ge 8$ mmHg sistólica / $\ge 4$ mmHg diastólica), se descarta la 1ª toma reteniendo la 2ª. En caso contrario, se promedian ambas.
3. **Sesiones de 3 tomas**: Se descarta siempre la 1ª toma y se calcula la media con las 2 tomas restantes.
4. **Sesiones de 4 o más tomas**: Se compara cada toma inicial con la media de todas las posteriores y se descarta mientras sea superior en al menos $8$ mmHg de sistólica o $4$ mmHg de diastólica. El proceso se detiene en la primera toma estable.

La aplicación siempre registra y conserva todas las tomas realizadas, con el filtro activado los datos son agrupados en sesiones. Si se desactiva el filtro la aplicación recalcula la información y muestra todos los registros individualmente.

Con el filtro activado los gráficos, el semáforo de etiquetas de colores, los objetivos, los avisos, las tendencias y las exportaciones utilizan la media de las tomas efectivas. Las medidas descartadas siguen visibles en el desglose de la sesión, pero no determinan esos resultados. Consulta la [matriz clínica de la versión 1.6.0](docs/reglas-clinicas-v1.6.0.md) para conocer las reglas completas y sus fuentes.

---

## 🌐 Estructura de Ramas

- **`main`**: Versión estable de producción.
- **`dev`**: Rama de desarrollo activo para pruebas de características.

---

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo web
npm run dev

# Compilar proyecto web y sincronizar con Android nativo (Capacitor)
npm run build
npm run cap:sync

# Abrir el proyecto en Android Studio
npm run cap:open
```
