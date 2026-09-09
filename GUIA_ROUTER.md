# 🔧 Guía para exponer PocketBase a internet

## 🎯 Objetivo
Que PocketBase en tu servidor CasaOS (192.168.0.29) sea accesible desde internet.

## ⚠️ Seguridad importante
Exponer directamente PocketBase a internet tiene riesgos. Considera estas opciones de seguridad:

1. **Usar HTTPS obligatorio**
2. **Cambiar password admin** (si no lo has hecho)
3. **Considerar firewall adicional**

## 📋 Paso 1: Configurar puerto forwarding en tu router

### 1.1 Encontrar la IP de tu router
- Windows: `ipconfig` → Puerta de enlace predeterminada
- Normalmente: 192.168.0.1

### 1.2 Acceder al panel del router
- En navegador: http://192.168.0.1
- Usuario/contraseña (puede estar en el router)

### 1.3 Configurar puerto forwarding
Busca:
- "Port Forwarding" / "Virtual Server" / "NAT"

Configura:
- **Puerto externo**: 8090
- **Puerto interno**: 8090
- **IP interna**: 192.168.0.29
- **Protocolo**: TCP

### 1.4 Probar desde fuera
- Pide a alguien fuera de tu red que pruebe: `http://TU_IP_PUBLICA:8090`
- Para saber tu IP pública: https://whatismyipaddress.com/

## 📋 Paso 2: Configurar firewall en el servidor (si es necesario)

```bash
ssh abriserver@192.168.0.29
sudo ufw allow 8090/tcp
sudo ufw reload
```

## 📋 Paso 3: Actualizar configuración de la app

Cambia en `js/script.js`:

```javascript
const PB_CONFIG = {
    enabled: true,
    baseUrl: "http://TU_IP_PUBLICA:8090", // O dominio si tienes
    // ...
};
```

## 📋 Paso 4: Desplegar la app en Vercel (opcional)

```bash
npm install -g vercel
vercel
```

## 🔒 Paso 5: Configurar HTTPS (MUY RECOMENDADO)

Exponer sin HTTPS es inseguro. Opciones:

### Opción A: Usar Cloudflare (Gratis)
1. Crear cuenta en Cloudflare
2. Añadir tu dominio (o usar subdominio gratuito)
3. Configurar Cloudflare como proxy
4. PocketBase solo acepta conexiones desde Cloudflare

### Opción B: Certbot (Si tienes dominio)
```bash
ssh abriserver@192.168.0.29
sudo apt install certbot
sudo certbot certonly --standalone -d tu-dominio.com
```

## 🎱 Alternativa más segura: VPN

Si prefieres no exponer directamente:

1. **Tailscale** (Gratis y fácil)
2. **WireGuard** (Más técnico)
3. **OpenVPN** (Clásico)

Con VPN, PocketBase sigue local pero accesible de forma segura desde internet.

---

⚠️ **Recomendación**: Usa Cloudflare o VPN en lugar de exponer directamente.