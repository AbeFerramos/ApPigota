# 🚀 Desplegar La Pigota en Render (Opción Cloud Completa)

## 🎯 Objetivo
Tener La Pigota accesible desde internet con PocketBase en la nube, todo gratuito.

## ✅ Ventajas
- Todo en la nube (app + PocketBase)
- HTTPS automático
- Funciona desde cualquier lugar
- Gratis con límites generosos
- No necesitas exponer tu servidor local

## ⚠️ Limitaciones del plan gratuito
- Render: 750 horas/mes de compute (suficiente para uso normal)
- Dormirá después de 15 minutos de inactividad
- Tarda ~30 segundos en despertar

## 📋 Paso 1: Crear cuenta en Render

1. Ve a https://render.com
2. Regístrate con GitHub
3. Autoriza Render a acceder a tu repositorio

## 📋 Paso 2: Subir código a GitHub

```bash
# En tu ordenador
cd C:\Users\dailo\Desktop\ProyectosAbe\ApPigota
git init
git add .
git commit -m "Initial commit - La Pigota app"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ApPigota.git
git push -u origin main
```

## 📋 Paso 3: Crear archivo render.yaml

Crea `render.yaml` en la raíz del proyecto:

```yaml
services:
  - type: web
    name: lapigota-app
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8080
```

## 📋 Paso 4: Desplegar PocketBase en Render

1. En Render → "New" → "Web Service"
2. Selecciona tu repositorio GitHub
3. Configura:
   - **Name**: lapigota-pocketbase
   - **Environment**: Docker
   - **Dockerfile**: Crea uno en tu repo

Dockerfile para PocketBase:
```dockerfile
FROM alpine:latest
RUN apk add --no-cache ca-certificates wget
WORKDIR /app
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.23.5/pocketbase_0.23.5_linux_amd64.zip
RUN unzip pocketbase_0.23.5_linux_amd64.zip
RUN rm pocketbase_0.23.5_linux_amd64.zip
RUN chmod +x pocketbase
EXPOSE 8090
CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
```

4. **Deploy** → Render creará el servicio
5. **Anota la URL** que te da (ej: https://lapigota-pocketbase.onrender.com)

## 📋 Paso 5: Actualizar configuración de la app

En `js/script.js`:

```javascript
const PB_CONFIG = {
    enabled: true,
    baseUrl: "https://lapigota-pocketbase.onrender.com", // URL de Render
    // ...
};
```

## 📋 Paso 6: Desplegar la app en Render

1. En Render → "New" → "Web Service"
2. Selecciona tu repositorio
3. Configura:
   - **Name**: lapigota-app
   - **Environment**: Node
   - **Build Command**: npm install
   - **Start Command**: node server.js
4. **Deploy** → Render creará el servicio
5. **Anota la URL** (ej: https://lapigota-app.onrender.com)

## 📋 Paso 7: Configurar PocketBase (una vez)

1. Accede a https://lapigota-pocketbase.onrender.com/_/
2. Crea el admin (admin@lapigota.cat / lapigota2026)
3. Ejecuta el script de configuración desde tu ordenador:

```bash
node setup_pocketbase.js
```

(Ajusta la URL en setup_pocketbase.js para usar la URL de Render)

## 🎉 ¡Listo!

**URL de la app**: https://lapigota-app.onrender.com
**URL de PocketBase**: https://lapigota-pocketbase.onrender.com

## 📱 Para la colla

Comparte la URL de la app: https://lapigota-app.onrender.com

## ⚠️ Notas importantes

- **Primer arranque**: Tarda ~30 segundos en despertar
- **Límites**: 750 horas/mes gratis (suficiente para uso normal)
- **Datos**: Render ofrece almacenamiento gratis limitado
- **Backup**: Configura backups regulares en PocketBase

## 🔧 Solución de problemas

**La app no conecta a PocketBase:**
- Verifica que PocketBase esté funcionando en Render
- Revisa logs en el dashboard de Render
- Verifica CORS en configuración de PocketBase

**La app tarda en cargar:**
- Es normal el primer arranque (~30s)
- El tiempo de inactividad dormirá el servicio

---

⚠️ **Esta es la opción más completa para acceso desde internet sin exponer tu servidor local.**