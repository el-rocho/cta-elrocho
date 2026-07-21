# Control Tensión Arterial & Pulsaciones 🩺

![Built with Vibe Coding](https://img.shields.io/badge/Built%20with-Vibe%20Coding%20%26%20AI-7c3aed?style=for-the-badge&logo=sparkles)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue?style=for-the-badge)

Aplicación Web Progresiva (PWA) moderna para el registro, seguimiento y análisis de la tensión arterial (sistólica y diastólica) y ritmo cardíaco (pulsaciones). Diseñada para ofrecer máxima privacidad en el dispositivo y generar informes listos para revisión médica.

> ✨ **Metodología de Desarrollo**: Este proyecto ha sido conceptualizado, diseñado y guiado mediante **Vibe Coding**, utilizando asistencia avanzada de Inteligencia Artificial para la generación de código y arquitectura.

---

## 🚀 Características Principales

- **Sistema Dual de Entrada**: Elige entre teclado numérico tradicional o **Ruleta Táctil de Selección Rápida** centrada en la última medición realizada.
- **Filtro de Síndrome de Bata Blanca**: Algoritmo inteligente que descarta tomas iniciales elevadas producidas por la ansiedad del momento (intervalos de 5, 10 o 15 minutos).
- **Informes PDF Médicos**: Gráfico temporal con doble eje Y (tensión arterial + línea de pulsaciones en el eje derecho) y tabla detallada de registros.
- **Exportación e Importación CSV**: Copias de seguridad automáticas con nombre unificado (`tension_arterial_daily_AAAA-MM-DD_HH-MM-SS.csv`).
- **Garantía de Privacidad (RGPD)**: 100% Offline / Standalone. Tus datos no salen de tu dispositivo.

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
