# 📱 Guía para compartir La Pigota con la colla

## 🎯 Objetivo
Que todos los miembros de la colla puedan usar la aplicación desde sus móviles con sincronización automática.

## ⚠️ Importante

**PocketBase ya está en tu servidor CasaOS (192.168.0.29)**, así que NO hace falta moverlo a la nube.

## 🎱 Opciones disponibles (usando tu servidor actual)

### Opción 1: Cloudflare Tunnel (⭐ RECOMENDADA)
**Pros:**
- Gratis
- HTTPS automático
- No tocas el router
- Muy seguro
- PocketBase sigue en tu NAS

**Contras:**
- Requiere dominio (puedes usar uno que ya tengas)

**Cómo funciona:**
1. Instalas cloudflared en tu servidor
2. Creas un tunnel seguro
3. PocketBase accesible desde internet con HTTPS

**Instrucciones:** Ver `GUIA_CLOUDFLARE_TUNNEL.md`

---

### Opción 2: Port forwarding en router
**Pros:**
- Más rápido de configurar
- Gratis
- PocketBase sigue en tu NAS

**Contras:**
- Menos seguro (expone tu IP)
- Requiere acceso al router
- Necesitas HTTPS manual

**Cómo funciona:**
1. Configuras puerto forwarding en router (8090 → 192.168.0.29:8090)
2. PocketBase accesible desde internet
3. Recomendado usar HTTPS

**Instrucciones:** Ver `GUIA_ROUTER.md`

---

### Opción 3: Solo red local (Para reuniones/ensayos)
**Pros:**
- Más seguro (no expone a internet)
- Gratis
- Funciona perfectamente en el mismo lugar

**Contras:**
- Solo funciona en la misma WiFi
- Tu ordenador debe estar encendido

**Cómo funciona:**
1. Ejecutas: `npm start`
2. Todos acceden a: `http://192.168.0.68:8080`
3. Cambios se sincronizan automáticamente

**Instrucciones:** Ver `INSTRUCCIONES_COLLA.md`

---

### Opción 4: VPN (Más seguro para producción)
**Pros:**
- Muy seguro
- PocketBase sigue local
- Acceso desde internet

**Contras:**
- Requiere configuración VPN
- Más complejo para usuarios no técnicos

**Opciones VPN:**
- **Tailscale** (Gratis y fácil)
- **WireGuard** (Más técnico)
- **OpenVPN** (Clásico)

---

## 🚀 Mi recomendación

**Para empezar**: Opción 3 (Red local)
- Gratis, seguro, funciona bien para reuniones

**Para uso desde cualquier lugar**: Opción 1 (Cloudflare Tunnel)
- Gratis, seguro, PocketBase sigue en tu NAS

**Si prefieres no crear túnel**: Opción 2 (Port forwarding)
- Más rápido, pero menos seguro

---

## 📱 Instrucciones para la colla

Independientemente de la opción que elijas, comparte estas instrucciones:
- `INSTRUCCIONES_COLLA.md` - Guía para usuarios

---

⚠️ **Seguridad**: No expongas PocketBase directamente sin HTTPS o protección adicional.<tool_call><arg_key>content</arg_key><arg_value># 🚀 Opción recomendada para empezar: Red local

### 1. Crear script de inicio fácil
Voy a crear un script que haga fácil iniciar el servidor para que la colla pueda conectarse.