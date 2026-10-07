# La Pigota - Aplicación Web

Aplicación web para gestión de La Pigota con sincronización multi-dispositivo usando Firebase.

## 🚀 Inicio rápido

### Desarrollo local
```powershell
# Instalar dependencias
npm install

# Iniciar servidor local
npm start
```

Acceso:
- **Local**: http://localhost:8080
- **Red**: http://192.168.0.68:8080

### Producción (GitHub Pages)
- **URL**: https://abeferramos.github.io/ApPigota/
- **Repositorio**: https://github.com/abeferramos/ApPigota

## 📱 Acceso multi-dispositivo

### Opción 1: GitHub Pages (Recomendado)
1. Desde cualquier dispositivo: https://abeferramos.github.io/ApPigota/
2. Inicia sesión con Firebase (ver abajo)
3. Los cambios se sincronizan automáticamente

### Opción 2: Red local (solo en casa)
1. Asegúrate de que ambos dispositivos estén en la misma WiFi
2. Desde móvil/dispositivo: http://192.168.0.68:8080
3. Inicia sesión con Firebase
4. Los cambios se sincronizan automáticamente

## 🔧 Configuración Firebase

La aplicación usa Firebase para sincronización en tiempo real.

### Credenciales
- **Email**: admin@lapigota.cat
- **Password**: lapigota2026

### Proyecto Firebase
- **Proyecto**: la-pigota
- **Database**: Realtime Database (Europa-West1)
- **Auth**: Firebase Authentication (Email/Password)

### Para iniciar sesión
1. Haz clic en el botón **"Sessio"** (arriba a la derecha)
2. Introduce email y password
3. Haz clic en **"Entrar"**
4. El indicador cambiará de "Local" a "Sincronitzat"

## 🔄 Sincronización

- **Guardado automático**: Cambios guardados en 500ms
- **Sincronización en tiempo real**: Firebase listener
- **Multi-dispositivo**: Detección de cambios remotos automática
- **Offline**: Guardado local, sincronización al reconectar

## 📖 Guía completa

Para instrucciones detalladas de sincronización multi-dispositivo, consulta:
[GUIA_SINCRONIZACION.md](GUIA_SINCRONIZACION.md)

## 📁 Estructura del proyecto

```
ApPigota/
├── index.html              # Aplicación principal
├── js/
│   └── script.js          # Lógica principal
├── css/
│   └── style.css          # Estilos
├── server.js              # Servidor HTTP local
├── package.json           # Dependencias
├── setup_pocketbase.js    # Script de inicialización
└── old/                   # Archivos de instalación (backup)
```

## 🔐 Seguridad

⚠️ **Importante**: Cambia las credenciales de PocketBase después de la instalación.

## 🐛 Problemas comunes

### Acceso desde móvil no funciona
- Verifica que ambos dispositivos estén en la misma red
- Configura firewall Windows para permitir puerto 8080

### Sincronización falla
- Verifica que PocketBase esté funcionando en el servidor
- Revisa consola del navegador (F12) para errores

---

Para La Pigota - Gestión de Colla de Diables