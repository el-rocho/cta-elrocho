# Control Tensión Arterial & Pulsaciones 🩺

![Built with Vibe Coding](https://img.shields.io/badge/Built%20with-Vibe%20Coding%20%26%20AI-7c3aed?style=for-the-badge&logo=sparkles)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue?style=for-the-badge)

Aplicación Web Progresiva (PWA) moderna **100% Multiplataforma** para el registro, seguimiento y análisis de la tensión arterial (sistólica y diastólica) y ritmo cardíaco (pulsaciones). Funciona sin necesidad de instalación en cualquier navegador web en **Windows, Linux, macOS, Android e iOS**. Diseñada para ofrecer máxima privacidad en el dispositivo y generar informes listos para revisión médica.

> ✨ **Metodología de Desarrollo**: Este proyecto ha sido conceptualizado, diseñado y guiado mediante **Vibe Coding**, utilizando asistencia avanzada de Inteligencia Artificial para la generación de código y arquitectura.

---

## 🚀 Características Principales

- **Compatibilidad Multiplataforma (Windows, Linux, macOS, Android, iOS)**: Funciona en cualquier PC, portátil, smartphone o tablet directamente desde el navegador web o instalable como App nativa PWA.
- **Sistema Dual de Entrada**: Elige entre teclado numérico tradicional o **Ruleta Táctil de Selección Rápida** centrada en la última medición realizada.
- **Filtro de Síndrome de Bata Blanca**: Algoritmo inteligente que descarta tomas iniciales elevadas producidas por la ansiedad del momento (intervalos de 3, 5 o 10 minutos entre tomas consecutivas).
- **Informes PDF Médicos**: Gráfico temporal con doble eje Y (tensión arterial + línea de pulsaciones en el eje derecho) y tabla detallada de registros.
- **Exportación e Importación CSV**: Copias de seguridad automáticas con descarga directa en la carpeta predeterminada del dispositivo (`tension_arterial_daily_AAAA-MM-DD_HH-MM-SS.csv`).
- **Garantía de Privacidad (RGPD)**: 100% Offline / Standalone. Tus datos no salen de tu dispositivo y se guardan localmente.

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
npm install
npm run dev
```
