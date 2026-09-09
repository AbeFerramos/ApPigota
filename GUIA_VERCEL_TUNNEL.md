# 🚀 Solución: Vercel + Cloudflare Tunnel (Sin PC encendido)

## 🎯 Objetivo
App web siempre online en Vercel + PocketBase en tu servidor vía Cloudflare Tunnel

## ✅ Ventajas
- **Gratis**: Ambos servicios gratuitos
- **Siempre online**: Vercel está siempre disponible
- **Sin PC**: Tu PC no hace falta que esté encendido
- **HTTPS automático**: Ambos servicios con HTTPS
- **PocketBase local**: Sigue en tu servidor CasaOS

## 📋 Arquitectura

```
Usuario → Vercel (App web) → Cloudflare Tunnel → Tu servidor (PocketBase)
```

## 📋 Paso 1: Desplegar PocketBase con Cloudflare Tunnel

Sigue las instrucciones en `GUIA_CLOUDFLARE_TUNNEL.md`

Supongamos que al final tienes:
- **URL PocketBase**: https://lapigota-pocketbase.tu-dominio.com

## 📋 Paso 2: Configurar CORS en PocketBase

1. Accede al panel de PocketBase: https://lapigota-pocketbase.tu-dominio.com/_/
2. Ve a Settings → API Rules
3. Configura CORS para permitir tu dominio de Vercel:

```
Orígenes permitidos: https://lapigota-app.vercel.app (o tu dominio)
Métodos: GET, POST, PUT, DELETE, PATCH
Headers: Content-Type, Authorization
```

## 📋 Paso 3: Preparar proyecto para Vercel

### 3.1 Eliminar server.js (Vercel no lo necesita)
```bash
# Mover server.js a old/ para backup
mv server.js old/
```

### 3.2 Actualizar vercel.json
```json
{
  "version": 2,
  "builds": [],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 3.3 Actualizar js/script.js con URL de Cloudflare Tunnel
```javascript
const PB_CONFIG = {
    enabled: true,
    baseUrl: "https://lapigota-pocketbase.tu-dominio.com", // Tu Cloudflare Tunnel
    collection: "app_state",
    keyField: "storageKey",
    dataField: "payload",
    authCollection: "users"
};
```

## 📋 Paso 4: Subir a GitHub

```bash
cd C:\Users\dailo\Desktop\ProyectosAbe\ApPigota
git init
git add .
git commit -m "Ready for Vercel deployment"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ApPigota.git
git push -u origin main
```

## 📋 Paso 5: Desplegar en Vercel

### 5.1 Crear cuenta Vercel
1. Ve a https://vercel.com
2. Regístrate con GitHub
3. Autoriza Vercel a acceder a tu repositorio

### 5.2 Importar proyecto
1. En Vercel → "Add New Project"
2. Selecciona tu repositorio GitHub
3. Configura:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (dejar vacío)
   - **Output Directory**: ./
4. Click en "Deploy"

### 5.3 Obtener URL
Vercel te dará una URL como:
- https://lapigota-app.vercel.app
- O tu dominio si configuraste uno

## 📋 Paso 6: Configurar dominio personal (opcional)

Si tienes dominio:

1. En Vercel → Settings → Domains
2. Añade tu dominio: lapigota.tu-dominio.com
3. Configura DNS en tu proveedor de dominio:
   - CNAME: lapigota → cname.vercel-dns.com

## 📋 Paso 7: Actualizar CORS en PocketBase con la URL final

1. En PocketBase Settings → API Rules
2. Actualiza orígenes permitidos con la URL final de Vercel
3. Guarda cambios

## 🎉 ¡Listo!

**URL de la app**: https://lapigota-app.vercel.app (o tu dominio)
**PocketBase**: https://lapigota-pocketbase.tu-dominio.com (Cloudflare Tunnel)

## 📱 Para la colla

Comparte la URL de Vercel con la colla:
- https://lapigota-app.vercel.app
- O tu dominio personal

## ⚠️ Requisitos

- **Servidor CasaOS**: Debe estar encendido (PocketBase)
- **Tu PC**: NO hace falta que esté encendido
- **Internet**: Requerido para sincronización

## 🔧 Solución de problemas

**Error de conexión a PocketBase:**
- Verifica que Cloudflare Tunnel esté funcionando
- Revisa configuración CORS en PocketBase
- Revisa logs de cloudflared en tu servidor

**App no carga:**
- Verifica que el deploy en Vercel esté activo
- Revisa logs en Vercel dashboard
- Verifica que los archivos estén subidos correctamente

**Sincronización falla:**
- Asegúrate de que PocketBase esté accesible vía Cloudflare Tunnel
- Verifica que CORS permita el dominio de Vercel
- Revisa consola del navegador para errores específicos

---

⚠️ **Esta es la solución ideal: gratis, siempre online, y PocketBase sigue en tu servidor.**