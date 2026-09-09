# 🤖 Configuración Automatizada de Cloudflare Tunnel

## 🎯 Objetivo
Configurar Cloudflare Tunnel automáticamente usando un script.

## ⚠️ Requisitos previos

1. **Cuenta Cloudflare** gratuita (registrarse en https://dash.cloudflare.com)
2. **Un dominio** (puedes usar uno que ya tengas)
3. **Acceso SSH** a tu servidor CasaOS
4. **PocketBase funcionando** en tu servidor

## 📋 Paso 1: Subir el script al servidor

### Opción A: Usar SCP (desde tu PC)

```powershell
scp C:\Users\dailo\Desktop\ProyectosAbe\ApPigota\setup_cloudflare_tunnel.sh abriserver@192.168.0.29:~/
```

### Opción B: Crear directamente en el servidor

```bash
ssh abriserver@192.168.0.29
nano ~/setup_cloudflare_tunnel.sh
# Pega el contenido del script
# Ctrl+O para guardar, Ctrl+X para salir
chmod +x ~/setup_cloudflare_tunnel.sh
```

## 📋 Paso 2: Obtener Tunnel ID y credenciales

1. **Entra en Cloudflare**: https://dash.cloudflare.com
2. **Ve a**: Zero Trust → Networks → Tunnels
3. **Crea tunnel**: "Create a tunnel"
4. **Nombre**: `lapigota-tunnel`
5. **Copia el Tunnel ID** (lo necesitarás después)
6. **Descarga credenciales**: Download the cert file (archivo .json)
7. **Sube el archivo .json** al servidor:

```bash
scp C:\ruta\a\TUNNEL_ID.json abriserver@192.168.0.29:~/.cloudflared/
```

## 📋 Paso 3: Ejecutar el script

```bash
ssh abriserver@192.168.0.29
cd ~
./setup_cloudflare_tunnel.sh
```

## 📋 Paso 4: Seguir las instrucciones del script

El script te pedirá:
1. **Tunnel ID** (que copiaste en el paso 2)
2. **Dominio completo** (ej: lapigota.tu-dominio.com)

## 📋 Paso 5: Configurar DNS en Cloudflare

Cuando el script termine, te dará instrucciones para configurar el DNS:

1. **Ve a**: Cloudflare → DNS → Records
2. **Añade CNAME**:
   - Name: `lapigota` (o el subdominio que elegiste)
   - Target: `TUNNEL_ID.cfargotunnel.com`
   - Proxy: **Enabled** (naranja)

## 📋 Paso 6: Probar la conexión

```bash
curl https://lapigota.tu-dominio.com/api/health
```

Deberías ver una respuesta de PocketBase.

## 📋 Paso 7: Configurar CORS en PocketBase

1. **Accede al panel**: https://lapigota.tu-dominio.com/_/
2. **Configura admin** (si no lo has hecho)
3. **Ve a**: Settings → API Rules
4. **Configura CORS**:
   - Orígenes permitidos: `https://lapigota-app.vercel.app` (cuando despliegues la app)
   - Métodos: `GET, POST, PUT, DELETE, PATCH`
   - Headers: `Content-Type, Authorization`

## 🎉 ¡Listo!

**PocketBase accesible**: https://lapigota.tu-dominio.com

## ⚠️ Solución de problemas

**Script falla al descargar cloudflared:**
- Verifica conexión a internet
- Intenta descargar manualmente

**Error de permisos:**
- Asegúrate de ejecutar como usuario `abriserver`, no como root

**DNS no propaga:**
- Los cambios DNS pueden tardar hasta 24 horas
- Verifica que el registro CNAME esté correcto

**Tunnel no conecta:**
- Verifica el servicio: `sudo systemctl status cloudflared`
- Revisa logs: `sudo journalctl -u cloudflared -f`

---

⚠️ **Este script automatiza todo el proceso de configuración de Cloudflare Tunnel.**