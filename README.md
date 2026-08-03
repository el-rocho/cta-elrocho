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
3. Ve a **Exportar / Imprimir** &rarr; pestaña **Importar** y sube el archivo `.csv`. Todas tus mediciones se asociarán a tu usuario.

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

- **Soporte Bilingüe Completo (Español / Inglés)**: Selección de idioma desde la pantalla de **Configuración** (🇪🇸 Español / 🇬🇧 English). Interfaz, ruletas, gráficos, notificaciones e informes exportados se adaptan al instante.
- **Experiencia Nativa Android**: Funciona como una App independiente a pantalla completa.
- **100% Offline y Privada (RGPD / GrapheneOS)**: Todos los datos residen exclusivamente en el almacenamiento interno de tu teléfono (`localStorage`). Las fuentes tipográficas están incluidas en la aplicación y no se descargan desde servicios externos.
- **Sistema Dual de Entrada**: Elige entre teclado numérico tradicional o **Ruleta Táctil de Selección Rápida** centrada en la última medición realizada.
- **Tres referencias clínicas**: Etiquetas y avisos configurables según `ESC 2024`, `AHA/ACC 2025` o `ISH 2020`, sin modificar las mediciones.
- **Objetivos terapéuticos**: Valores recomendados por guía y edad para usuarios medicados, siempre visibles y editables según la indicación del facultativo.
- **Evolución y tendencias**: Comparación de medias diarias en cuatro semanas y gráficas de `1 mes`, `3 meses`, `6 meses` o `1 año`.
- **Filtro opcional de acomodación**: Agrupa tomas consecutivas y calcula un único resultado efectivo tras descartar, cuando corresponde, las tomas iniciales elevadas.
- **Informes PDF**: Gráfico temporal, tabla detallada, guía seleccionada y desglose de tomas efectivas y descartadas.
- **Datos, copias e informes**: copias completas versionadas, informes CSV/PDF e importación compatible con los CSV históricos de la aplicación y con MyTherapy.

---

## 🛡️ Filtro de Síndrome de Bata Blanca

El **Filtro de Síndrome de Bata Blanca** mitiga la distorsión generada por el sesgo de alerta o ansiedad inicial del paciente al colocarse el manguito de tensión.

### 🔬 Cómo funciona el algoritmo:
1. **Agrupación Consecutiva**: Se agrupan dentro de una misma sesión las tomas donde el intervalo entre una toma y la anterior sea menor o igual a **5 minutos**. Este margen es fijo y no requiere configuración.
2. **Sesiones de 2 tomas**: Si la 1ª toma es significativamente superior a la 2ª ($\ge 8$ mmHg sistólica / $\ge 4$ mmHg diastólica), se descarta la 1ª toma reteniendo la 2ª. En caso contrario, se promedian ambas.
3. **Sesiones de 3 tomas**: Se descarta siempre la 1ª toma y se calcula la media con las 2 tomas restantes.
4. **Sesiones de 4 o más tomas**: Se compara cada toma inicial con la media de todas las posteriores y se descarta mientras sea superior en al menos $8$ mmHg de sistólica o $4$ mmHg de diastólica. El proceso se detiene en la primera toma estable; puede conservar todas las tomas o una única toma final.

El semáforo, los objetivos, los avisos, las tendencias y las exportaciones utilizan la media de las tomas efectivas. Las descartadas siguen visibles en el desglose de la sesión, pero no determinan esos resultados. Consulta la [matriz clínica de la versión 1.6.0](docs/reglas-clinicas-v1.6.0.md) para conocer las reglas completas y sus fuentes.

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
