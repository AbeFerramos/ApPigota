# 🌐 Cloudflare Tunnel - Guía para La Pigota

## 🎯 Objetivo
Acceso seguro desde internet a PocketBase en tu servidor CasaOS sin tocar el router.

## ✅ Ventajas
- Gratis
- HTTPS automático
- No expone tu IP pública
- No configuración de router
- Muy seguro
- PocketBase sigue en tu NAS

## 📋 Paso 1: Crear cuenta Cloudflare

1. Ve a https://dash.cloudflare.com/sign-up
2. Regístrate gratis
3. Añade un dominio (puedes usar uno que ya tengas)

## 📋 Paso 2: Instalar cloudflared en tu servidor

```bash
ssh abriserver@192.168.0.29

# Descargar cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Verificar instalación
cloudflared --version
```

## 📋 Paso 3: Autenticar cloudflared

```bash
cloudflared tunnel login
```

Esto abrirá un navegador donde autorizas cloudflared.

## 📋 Paso 4: Crear el tunnel

```bash
# Crear tunnel (cámbialo el nombre si quieres)
cloudflared tunnel create lapigota-tunnel

# Anota el Tunnel ID que te muestra
```

## 📋 Paso 5: Configurar el tunnel

```bash
# Crear archivo de configuración
nano ~/.cloudflared/config.yml
```

Pega esto:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/abriserver/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: lapigota.tu-dominio.com
    service: http://192.168.0.29:8090
  - service: http_status:404
```

Cambia:
- `YOUR_TUNNEL_ID` → ID del tunnel (del paso 4)
- `lapigota.tu-dominio.com` → Tu subdominio
- `192.168.0.29:8090` → Tu servidor y puerto

## 📋 Paso 6: Configurar DNS en Cloudflare

1. Ve al panel de Cloudflare
2. DNS → Records
3. Añade registro CNAME:
   - Name: lapigota
   - Target: YOUR_TUNNEL_ID.cfargotunnel.com
   - Proxy: Enabled (naranja)

## 📋 Paso 7: Instalar como servicio

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/cloudflared.service
```

Pega esto:

```ini
[Unit]
Description=cloudflared
After=network.target

[Service]
Type=simple
User=abriserver
ExecStart=/usr/bin/cloudflared tunnel --config /home/abriserver/.cloudflared/config.yml run lapigota-tunnel
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar e iniciar
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

## 📋 Paso 8: Actualizar configuración de la app

En `js/script.js`:

```javascript
const PB_CONFIG = {
    enabled: true,
    baseUrl: "https://lapigota.tu-dominio.com", // Tu dominio con Cloudflare
    // ...
};
```

## 🎉 ¡Listo!

Ahora PocketBase es accesible desde internet con HTTPS en:
```
https://lapigota.tu-dominio.com
```

## 📱 Para la colla

Comparte la URL `https://lapigota.tu-dominio.com` con la colla.

## 🔒 Seguridad adicional

En el panel de Cloudflare, puedes:
- Bloquear países específicos
- Añadir reglas de firewall
- Activar autenticación adicional

---

⚠️ **Importante**: Esta es la opción más segura y recomendada.