# Cuenta de Cobro — PWA Offline (Mobile-First)

Aplicación web progresiva (**PWA**) optimizada para celular que funciona **100% sin conexión a internet** para generar, previsualizar y exportar/compartir Cuentas de Cobro en PDF vectorial (Carta o A4).

## Características

- **Encabezado editable**: Selector de fecha sincronizado con formato `DD - Mes - AAAA` y consecutivo editable (`Cuenta de cobro 001`) con incremento rápido `+1`.
- **Datos del Cliente flexibles**: Nombre o razón social, documento libre (NIT, C.C., C.E., etc.) y dirección listos para editar.
- **Datos del Acreedor locales**: Nombre completo, documento y teléfono se guardan únicamente en el navegador del dispositivo (`localStorage`), sin incluir datos personales en el código fuente.
- **Conceptos dinámicos**: Múltiples ítems numerados (`1.`, `2.`, `3.`...) con descripción, cantidad y valor unitario/subtotal.
- **Cálculo automático**: Suma total en pesos colombianos (ej. `$380.000`) y conversión automática a letras en español con *"pesos"* (ej. `Trescientos ochenta mil pesos`).
- **Vista previa fiel Carta / A4**: Réplica de la estructura y jerarquía tipográfica antes de exportar.
- **Exportar y Compartir**: Generación de PDF vectorial con `jsPDF`, listo para descargar o compartir directamente por WhatsApp o correo desde el móvil.
- **Instalable y Offline**: Service Worker con precaché total mediante `vite-plugin-pwa`.

## Comandos

```bash
npm install
npm run dev      # Servidor de desarrollo local
npm test         # Pruebas unitarias (Vitest)
npm run build    # Compilación de producción + Service Worker PWA
npm run preview  # Previsualizar build de producción
```

## Publicar gratis en GitHub Pages (HTTPS para celular)

Este repositorio ya incluye el flujo automático en `.github/workflows/deploy.yml` y rutas relativas (`base: './'`) compatibles con GitHub Pages:

1. Crea un repositorio nuevo en GitHub (por ejemplo `cuenta-de-cobro-pwa`).
2. Sube el proyecto desde esta carpeta:
   ```bash
   git init -b main
   git add .
   git commit -m "Versión inicial PWA Cuenta de Cobro"
   git remote add origin https://github.com/TU_USUARIO/cuenta-de-cobro-pwa.git
   git push -u origin main
   ```
3. En GitHub, abre **Settings → Pages → Build and deployment → Source** y selecciona **GitHub Actions**.
4. En ~1 minuto tu PWA estará publicada en `https://TU_USUARIO.github.io/cuenta-de-cobro-pwa/`.
5. Abre ese enlace desde tu celular (Chrome en Android o Safari en iPhone) y toca **Instalar** o **Agregar a pantalla de inicio**.
