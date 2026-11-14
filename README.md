# SimbioMakers: Red de Innovación y Fabricación Digital Escolar
### Capítulo Perú • 24 Regiones, 24 Fab Labs Públicos, 1 Sola Red

> **Impulsores:** **Fab Lab Perú** & **Metodología SimbioCreación**  
> **Propósito:** Activar la capacidad instalada de los **24 Fab Labs en Institutos de Educación Superior Tecnológica (IEST) públicos** equipados por Minedu/PMESUT en todo el Perú, conectándolos con estudiantes de **4.° y 5.° de secundaria** para resolver retos comunitarios mediante **fabricación distribuida** y **convergencia sinérgica (MPI)**.

---

## 🌟 Características Principales del Portal

1. **Arquitectura Global Replicable:**  
   Diseñado como una plataforma escalable (**SimbioMakers** como marca marco internacional, con el **Capítulo Perú** como piloto pionero listo para ser exportado a Colombia, México, Chile, etc.).
2. **Tablero y Mapa Interactivo de las 24 Regiones del Perú:**  
   - Mapa vectorial SVG responsivo y geográficamente proporcional de los 24 departamentos del Perú + Callao (25 sedes).
   - Datos en vivo de postulantes, paridad de género (meta 50/50 mujeres STEAM) y estado de patrocinio (*Adopta una Región*).
   - Drawer lateral interactivo con ficha técnica de cada laboratorio IEST, reto regional y su **Región Espejo 3D**.
3. **Las 3 Puertas de Entrada (Audience Hubs):**
   - 🎓 **Estudiantes (4.° y 5.° Sec.):** Postulación sin filtros de notas, con 3 preguntas de acción y video vertical de 60 segundos (TikTok/Reels/Shorts).
   - 🏛️ **IEST & Colegios:** Registro de laboratorio sede o colegio aliado difusor.
   - 🤝 **Sponsors & Cooperación:** *"Adopta una Región"* desde S/ 2,007 o kits de insumos a S/ 42 por escolar, con reporte auditado de **MPI (Máximo Impacto Posible)**.
4. **Calculadora Interactiva de Inversión y Fletes:**  
   Simulador de presupuesto transparente para calcular costos, cantidad de estudiantes formados y ahorro logístico por fabricación local.
5. **Autoguardado en Navegador:**  
   Los estudiantes no pierden sus respuestas si se corta su conexión (persistencia en `localStorage`).
6. **Diseño Editorial Luminoso (Light Mode por Defecto):**  
   Optimizado para legibilidad bajo luz solar en dispositivos móviles y presentaciones ante directores de instituciones y cooperantes, con toggle para modo oscuro.

---

## 🚀 Despliegue en GitHub Pages

Este proyecto utiliza **HTML5, Tailwind CSS (CDN) y JavaScript vanilla modular**, sin requerir compilación pesada ni pasos de build complejos.

Para publicarlo en GitHub Pages:
1. Ve a tu repositorio: `https://github.com/tiogeny/simbiomakers`
2. Ingresa a **Settings** > **Pages**.
3. En **Build and deployment** > **Source**, selecciona `Deploy from a branch`.
4. Elige la rama `main` y la carpeta `/ (root)`, luego presiona **Save**.
5. ¡Listo! En menos de un minuto tu portal estará en vivo en:  
   `https://tiogeny.github.io/simbiomakers/`

---

## ⚙️ Conexión de Formularios (Google Sheets / Formspree)

En `app.js`, busca la constante `CONFIG`:

```javascript
const CONFIG = {
  GOOGLE_SHEET_WEBHOOK: 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI',
  FORMSPREE_ENDPOINT: 'TU_ENDPOINT_DE_FORMSPREE_AQUI'
};
```

Todos los envíos de los tres modales (Estudiantes, Sponsors, IEST) se formatean en JSON con timestamp y tipo de solicitud (`postulacion_estudiante`, `interes_sponsor`, `registro_iest_colegio`).

---

## 📂 Estructura de Archivos

```
simbiomakers/
├── index.html        # Aplicación web completa y responsiva
├── data.js           # Fuente única de verdad (24 regiones, sedes IEST, retos, costos)
├── app.js            # Lógica interactiva (mapa SVG, filtros, modales, calculadora)
├── logos/
│   ├── logo_fablab_blanco.png
│   ├── logo_fablab_negro.png
│   └── logo_simbiocreacion.png
└── README.md         # Documentación maestra del proyecto
```

---

## 🇵🇪 Con el respaldo de:
- **Fab Lab Perú**
- **Metodología SimbioCreación** (Benito Juárez Vélez)
- **Red de Fab Labs Públicos PMESUT / Minedu**
