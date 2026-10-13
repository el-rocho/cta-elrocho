<p align="center">
  <img src="public/logo-day.png" alt="Control Tensión Arterial" width="160" height="160" />
</p>

# Control Tensión Arterial — Edición individual offline

![Android](https://img.shields.io/badge/Android-APK-3DDC84?style=flat-square&logo=android&logoColor=white)
![PWA](https://img.shields.io/badge/Web-PWA-0284c7?style=flat-square&logo=pwa&logoColor=white)
![Privacidad](https://img.shields.io/badge/Datos-100%25%20locales-10b981?style=flat-square)
![Idiomas](https://img.shields.io/badge/Idiomas-ES%20%7C%20EN-6366f1?style=flat-square)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue?style=flat-square)

Aplicación Android y PWA para registrar, consultar y analizar la tensión arterial de una sola persona, sin cuentas ni servidor.

Los datos permanecen en el almacenamiento privado del dispositivo: la aplicación funciona sin conexión y no se comunica con servicios externos. Es compatible con dispositivos sin servicios de Google, incluido GrapheneOS.

> [!NOTE]
> Esta edición es independiente del servidor autoalojado. No utiliza `CORS_ORIGINS` ni sesiones mediante `X-Session-Token`.

---

## Ecosistema: elige la edición adecuada

| Edición | Cuándo elegirla | Repositorio |
| :--- | :--- | :--- |
| **Individual offline** *(esta edición)* | Una persona, un dispositivo y funcionamiento sin servidor ni conexión. | [cta-elrocho](https://github.com/el-rocho/cta-elrocho) |
| **Servidor autoalojado** | Varios usuarios, datos centralizados y administración familiar en un servidor o NAS. | [cta-elrocho-selfhosted](https://github.com/el-rocho/cta-elrocho-selfhosted) |
| **Cliente para servidor** | Acceso desde Android o PWA a una instalación autoalojada existente. | [cta-elrocho-client-app](https://github.com/el-rocho/cta-elrocho-client-app) |

---

## Funciones principales

- Registro de presión sistólica, presión diastólica, pulso, brazo y notas.
- Entrada mediante teclado numérico o ruletas táctiles.
- Referencias configurables: `ESC 2024`, `AHA/ACC 2025` e `ISH 2020`.
- Objetivos terapéuticos orientativos y editables según la indicación profesional.
- Historial, estadísticas y gráficas de evolución de hasta un año.
- Presión de pulso, presión arterial media estimada, carga de presión y medias diarias.
- Filtro opcional de acomodación para agrupar tomas consecutivas y obtener un resultado efectivo por sesión.
- Informes PDF y CSV, copias completas en JSON e importación de datos de MyTherapy.
- Interfaz en español e inglés, con temas claro y oscuro.

Las reglas clínicas y el funcionamiento del filtro se describen en la [matriz clínica](docs/reglas-clinicas-v1.6.0.md).

> [!IMPORTANT]
> Las clasificaciones y objetivos son informativos. La aplicación no sustituye el diagnóstico ni las indicaciones de un profesional sanitario.

---

## Instalación y actualizaciones

Las compilaciones oficiales se generan mediante GitHub Actions.

### Obtainium — recomendado en Android

Añade en [Obtainium](https://github.com/ImranR98/Obtainium) la dirección del repositorio:

```text
https://github.com/el-rocho/cta-elrocho
```

<p align="center">
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://github.com/el-rocho/cta-elrocho" alt="Código QR de cta-elrocho para Obtainium" width="160" height="160" />
</p>

### APK

1. Abre [GitHub Releases](https://github.com/el-rocho/cta-elrocho/releases).
2. Descarga `control-tension-arterial.apk`.
3. Instala el archivo en el dispositivo Android.

Antes de actualizar, consulta [UPGRADING.md](UPGRADING.md) y las notas de la versión.

### PWA

Abre la [PWA de Control Tensión Arterial](https://el-rocho.github.io/cta-elrocho/) y utiliza la opción del navegador para añadirla a la pantalla de inicio.

Los datos quedan asociados a ese navegador y dispositivo. El borrado de los datos del sitio puede eliminarlos, por lo que conviene crear copias periódicas.

---

## Datos, copias y migración

- **Copia completa:** usa el formato `.cta-backup.json` para restaurar mediciones y preferencias.
- **Informes:** exporta PDF o CSV para consulta y tratamiento externo.
- **Migración al servidor:** importa preferentemente una copia completa `.cta-backup.json` en la cuenta correspondiente de la edición autoalojada.

Si no dispones de una copia completa, puedes utilizar un CSV. El CSV traslada los resultados efectivos, pero puede no incluir las tomas originales de cada sesión ni todas las preferencias.

---

## Desarrollo local

```bash
npm install
npm run dev
npm run build
npm run cap:sync
npm run cap:open
```

- `main`: versión estable.
- `dev`: desarrollo activo.

---

## Licencia

Distribuido bajo la Licencia MIT.