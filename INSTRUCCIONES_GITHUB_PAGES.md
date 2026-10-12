# Desplegar La Pigota en GitHub Pages

## ¿Qué he configurado?

He preparado la aplicación para que funcione como PWA en GitHub Pages con las siguientes configuraciones:

### 1. **Manifest.json**
- `start_url`: `/ApPigota/` - Ruta base correcta para GitHub Pages
- `scope`: `/ApPigota/` - Limita el scope a la ruta del proyecto
- Todas las rutas de iconos configuradas correctamente

### 2. **Service Worker (sw.js)**
- Versión actualizada a `v8` para forzar nueva caché
- Rutas configuradas con `/ApPigota/` prefix
- Cache de todos los recursos necesarios

### 3. **HTML**
- Manifest link: `/ApPigota/manifest.json`
- Service Worker: `/ApPigota/sw.js`
- Todas las rutas relativas funcionarán correctamente

### 4. **GitHub Actions Workflow**
- Archivo: `.github/workflows/deploy.yml`
- Se activa al hacer push a la rama `main`
- Despliega automáticamente a GitHub Pages

## Pasos para desplegar

### Opción 1: Usar GitHub Actions (Recomendado)

1. **Iniciar git en el proyecto** (si no está inicializado):
   ```bash
   git init
   git add .
   git commit -m "Configuración PWA para GitHub Pages"
   ```

2. **Crear repositorio en GitHub**:
   - Ve a https://github.com/new
   - Crea un repositorio llamado `ApPigota`
   - NO inicialices con README, .gitignore o license

3. **Conectar y subir**:
   ```bash
   git remote add origin https://github.com/abeferramos/ApPigota.git
   git branch -M main
   git push -u origin main
   ```

4. **Activar GitHub Pages**:
   - Ve al repositorio en GitHub
   - Settings → Pages
   - Source: GitHub Actions
   - El workflow se ejecutará automáticamente

5. **Esperar despliegue**:
   - Ve a la pestaña "Actions"
   - Espera a que el workflow termine (verde)
   - La URL será: https://abeferramos.github.io/ApPigota/

### Opción 2: Manual con gh-pages

Si prefieres hacerlo manualmente:

1. Instalar gh-pages:
   ```bash
   npm install -g gh-pages
   ```

2. Subir a GitHub Pages:
   ```bash
   git init
   git add .
   git commit -m "Configuración PWA"
   git remote add origin https://github.com/abeferramos/ApPigota.git
   git branch -M main
   git push -u origin main
   gh-pages -d . -b gh-pages
   ```

## Verificar PWA

Una vez desplegado:

1. **Abre la URL**: https://abeferramos.github.io/ApPigota/
2. **En Chrome Desktop**:
   - Verás el botón de instalación (icono de descarga) en el header
   - Haz clic para instalar la app
   - Se creará un acceso directo en el escritorio
3. **En Android**:
   - Chrome → Menú (3 puntos) → "Añadir a pantalla de inicio"
4. **En iOS**:
   - Safari → Compartir → "Añadir a inicio"

## Ventajas del despliegue en GitHub Pages

✅ **HTTPS obligatorio** - Necesario para PWA
✅ **Service Worker funcional** - Solo funciona en HTTPS
✅ **Acceso desde cualquier lugar** - No depende de tu red local
✅ **Automático** - GitHub Actions despliega con cada push
✅ **Gratis** - Sin coste
✅ **CDN global** - Rápido desde cualquier lugar

## Solución de problemas

### Los iconos no aparecen
- Borra el caché del navegador
- Desinstala la PWA y reinstala
- Verifica que las rutas en manifest.json sean correctas

### Service Worker no se registra
- Abre DevTools → Console
- Busca errores de registro
- Verifica que sea HTTPS

### El despliegue falla
- Ve a la pestaña Actions en GitHub
- Revisa los logs del workflow
- Verifica que los permisos del repositorio estén correctos

## Acceso multi-dispositivo

Una vez desplegado:
- Cualquier persona puede acceder desde: https://abeferramos.github.io/ApPigota/
- Puede instalar como PWA en su dispositivo
- Los cambios se sincronizan vía Firebase
- Funciona offline (con caché)
