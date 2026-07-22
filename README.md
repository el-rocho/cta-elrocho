# Control Tensión Arterial & Pulsaciones 🩺

![Built with Vibe Coding](https://img.shields.io/badge/Built%20with-Vibe%20Coding%20%26%20AI-7c3aed?style=for-the-badge&logo=sparkles)
![Android APK](https://img.shields.io/badge/Android-APK%20Nativa-3DDC84?style=for-the-badge&logo=android)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue?style=for-the-badge)

Aplicación Nativa **Android (APK)** y web offline para el registro, seguimiento y análisis de la tensión arterial (sistólica y diastólica) y ritmo cardíaco (pulsaciones). Diseñada para ofrecer máxima privacidad en el dispositivo (compatible con **GrapheneOS** y Android estándar), **sin barra de navegador** y con funcionalidad 100% local sin envío de datos a servidores externos.

> ✨ **Metodología de Desarrollo**: Este proyecto ha sido conceptualizado, diseñado y guiado mediante **Vibe Coding**, utilizando asistencia avanzada de Inteligencia Artificial para la generación de código y arquitectura.

---

## 📱 Instalación del APK en Android

Durante la fase de desarrollo y verificación, la APK de prueba (**APK Debug**) se compila automáticamente en cada commit a través de **GitHub Actions**.

### 📥 Cómo descargar la APK de prueba:
1. Ve a la pestaña **Actions** del repositorio de GitHub.
2. Selecciona la última ejecución del flujo de trabajo **Compilar APK Debug de Android**.
3. En la sección **Artifacts** al final de la página, descarga el archivo `control-tension-arterial-debug-apk.zip`.
4. Descomprime el archivo `.zip` en tu dispositivo Android e instala el paquete `.apk` (asegúrate de permitir la instalación desde fuentes desconocidas si tu sistema lo solicita).

---

## 🚀 Características Principales

- **Experiencia Nativa Android**: Funciona como una App independiente a pantalla completa sin la barra de direcciones del navegador.
- **100% Offline y Privada (RGPD / GrapheneOS)**: Todos los datos residen exclusivamente en el almacenamiento interno de tu teléfono (`localStorage` / `IndexedDB`).
- **Sistema Dual de Entrada**: Elige entre teclado numérico tradicional o **Ruleta Táctil de Selección Rápida** centrada en la última medición realizada.
- **Filtro de Síndrome de Bata Blanca**: Algoritmo inteligente que descarta tomas iniciales elevadas producidas por la ansiedad del momento (intervalos de 3, 5 o 10 minutos entre tomas consecutivas).
- **Informes PDF Médicos**: Gráfico temporal con doble eje Y (tensión arterial + línea de pulsaciones en el eje derecho) y tabla detallada de registros.
- **Exportación e Importación CSV**: Copias de seguridad automáticas en la carpeta del dispositivo (`tension_arterial_daily_AAAA-MM-DD_HH-MM-SS.csv`).

---

## 🛡️ Filtro de Síndrome de Bata Blanca (Algoritmo Médico)

El **Filtro de Síndrome de Bata Blanca** mitiga la distorsión generada por el sesgo de alerta o ansiedad inicial del paciente al colocarse el manguito de tensión.

### 🔬 Cómo funciona el algoritmo:
1. **Agrupación Consecutiva**: Se agrupan dentro de una misma sesión las tomas donde el intervalo entre una toma y la anterior sea menor al margen configurado (**3, 5 o 10 minutos**).
2. **Sesiones de 2 tomas**: Si la 1ª toma es significativamente superior a la 2ª ($\ge 8$ mmHg sistólica / $\ge 4$ mmHg diastólica), se descarta la 1ª toma reteniendo la 2ª. En caso contrario, se promedian ambas.
3. **Sesiones de 3 tomas**: Se descarta siempre la 1ª toma (por su bajo valor diagnóstico de aclimatación al manguito) y se calcula la media con las 2 tomas restantes.
4. **Sesiones de 4 o más tomas**: Se descarta la 1ª toma y se continúan descartando las siguientes tomas iniciales elevadas ($\ge 8$ mmHg sistólica / $\ge 4$ mmHg diastólica) respecto a la media de las restantes, siempre y cuando queden al menos 3 tomas válidas para calcular la media definitiva.

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
