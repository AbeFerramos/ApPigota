# La Pigota - Aplicación Web

Aplicación web para gestión de La Pigota con sincronización multi-dispositivo.

## 🚀 Inicio rápido

```powershell
# Instalar dependencias
npm install

# Iniciar servidor local
npm start
```

Acceso:
- **Local**: http://localhost:8080
- **Red**: http://192.168.0.68:8080

## 📱 Acceso multi-dispositivo

Para acceder desde otros dispositivos en la misma red:

1. **Asegúrate de que ambos dispositivos estén en la misma WiFi**
2. **Desde móvil/dispositivo**: http://192.168.0.68:8080
3. **Los cambios se sincronizan automáticamente**

## 🔧 Configuración PocketBase

La aplicación usa PocketBase en el servidor CasaOS (192.168.0.29:8090).

### Panel Admin
- **URL**: http://192.168.0.29:8090/_/
- **Email**: admin@lapigota.cat
- **Password**: lapigota2026

### Colecciones
- `app_state` - Estado completo de la aplicación
- `junta` - Miembros de la junta
- `membres_colla` - Miembros de la colla
- `sortides` - Sortidas programadas
- `bestiari` - Contactos del bestiari
- `reunions` - Reuniones
- `tasques` - Tareas
- `piro_stock` - Stock de pirotecnia
- `vestuari_stock` - Stock de vestuario
- `formulari_preguntes` - Preguntas del formulario
- `configuracio` - Configuración general
- `active_devices` - Dispositivos activos

## 🔄 Sincronización

- **Guardado automático**: Cambios guardados en 500ms
- **Sincronización**: Polling cada 2 segundos
- **Multi-dispositivo**: Detección de cambios remotos

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