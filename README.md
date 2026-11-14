# SimbioMakers PE: Red Nacional de Innovación y Fabricación Digital Escolar
### 24 Regiones, 24 Fab Labs Públicos, 1 Sola Red

> **Impulsores:** **Fab Lab Perú** & **Metodología SimbioCreación**  
> **Propósito:** Activar la capacidad instalada de los **24 Fab Labs en Institutos de Educación Superior Tecnológica (IEST) públicos** equipados por Minedu/PMESUT en todo el país, conectándolos con estudiantes de **4.° y 5.° de secundaria** para resolver desafíos comunitarios mediante **fabricación distribuida** y la métrica de **Máximo Impacto Posible (MIP)**.

---

## 🌟 Principales Características

1. **Identidad Global Replicable (`SimbioMakers PE`):**  
   Marco metodológico de franquicia internacional (**SimbioMakers**) desplegando su edición pionera en el Perú, lista para ser replicada en otros países de la región.
2. **Mapa y Tablero Interactivo de las 24 Regiones del Perú:**  
   - Mapa vectorial SVG georreferenciado (24 regiones + Callao).
   - Datos de laboratorios IEST públicos, postulaciones e iniciativas por departamento.
   - Ficha técnica interactiva con retos locales y **Región Aliada** para codiseño 3D sin costos de flete interprovincial.
3. **Las 3 Puertas de Acción:**
   - 🎓 **Estudiantes (4.° y 5.° Secundaria):** Sin barreras de notas escolares, con diagnóstico de desafío local, video de 60s y **Diploma Oficial de Innovación y Fabricación Digital**.
   - 🏛️ **IEST & Colegios:** Activación de capacidad instalada de laboratorios y registro de colegios difusores.
   - 🤝 **Sponsors & Aliados:** Modalidad *"Adopta una Región"* e inversión en kits con entrega de reporte de impacto auditado **MIP (Máximo Impacto Posible)**.
4. **Calculadora Interactiva de Impacto:**  
   Simulador ágil de 1 a 24 regiones que proyecta estudiantes beneficiados, equipos conformados, prototipos físicos generados y ahorro en fletes.
5. **Autoguardado en Navegador:**  
   Persistencia en `localStorage` para que ningún escolar pierda sus respuestas por cortes de conexión.
6. **Diseño Editorial Luminoso (Light Mode por Defecto):**  
   Máxima legibilidad bajo luz natural en celulares, con soporte de modo oscuro conmutador.

---

## 🚀 Despliegue en GitHub Pages

1. Abre tu repositorio: `https://github.com/tiogeny/simbiomakers`
2. Ve a **Settings** > **Pages**.
3. En **Build and deployment** > **Source**, selecciona `Deploy from a branch`.
4. Elige la rama `main` y la carpeta `/ (root)`, luego pulsa **Save**.
5. Tu portal quedará publicado en:  
   👉 **`https://tiogeny.github.io/simbiomakers/`**

---

## ⚙️ Conexión de Datos en Vivo y Formularios

En `app.js` puedes configurar:

```javascript
const CONFIG = {
  // Para alimentar el mapa en vivo: URL de tu Google Sheet publicado como CSV o Web App JSON
  LIVE_SHEET_CSV_URL: 'TU_URL_DE_SHEET_AQUI',
  // Webhook para recibir formularios (Google Apps Script o Formspree)
  FORM_WEBHOOK_URL: 'TU_WEBHOOK_URL_AQUI'
};
```

---

## 🇵🇪 Con el respaldo de:
- **Fab Lab Perú**
- **Metodología SimbioCreación** (Benito Juárez Vélez)
- **Red de Fab Labs Públicos PMESUT / Minedu**
