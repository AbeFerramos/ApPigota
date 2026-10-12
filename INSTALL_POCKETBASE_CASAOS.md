# Instalación de PocketBase en CasaOS para La Pigota

Este documento explica cómo instalar y configurar PocketBase en tu servidor CasaOS (192.168.0.29) para la aplicación La Pigota.

## Requisitos previos

- CasaOS instalado y funcionando en 192.168.0.29
- Acceso al panel de administración de CasaOS
- Node.js instalado en tu máquina local para ejecutar el script de setup

## Paso 1: Instalar PocketBase en CasaOS

### Opción A: Usar Docker (Recomendado)

1. **Accede al panel de CasaOS** (http://192.168.0.29)
2. **Ve a la sección de Apps** y busca "PocketBase"
3. **Instala PocketBase** con la siguiente configuración:
   - **Container Name**: pocketbase-lapigota
   - **Port**: 8090
   - **Volume**: Crea un volumen para persistir los datos
   - **Environment Variables**:
     - No necesarias para configuración básica

4. **Inicia el contenedor** y verifica que esté funcionando

### Opción B: Instalación Manual

1. **SSH a tu servidor CasaOS**:
   ```bash
   ssh tu-usuario@192.168.0.29
   ```

2. **Descarga PocketBase**:
   ```bash
   cd /opt
   wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.20/pocketbase_0.22.20_linux_amd64.zip
   unzip pocketbase_0.22.20_linux_amd64.zip
   rm pocketbase_0.22.20_linux_amd64.zip
   ```

3. **Crea directorio para datos**:
   ```bash
   mkdir -p /opt/pocketbase/data
   ```

4. **Ejecuta PocketBase**:
   ```bash
   cd /opt/pocketbase
   ./pocketbase serve --http=0.0.0.0:8090
   ```

5. **Configura PocketBase como servicio** (opcional, para que arranque automáticamente):
   ```bash
   sudo nano /etc/systemd/system/pocketbase.service
   ```
   
   Añade el siguiente contenido:
   ```ini
   [Unit]
   Description=PocketBase
   After=network.target
   
   [Service]
   Type=simple
   User=usuario
   WorkingDirectory=/opt/pocketbase
   ExecStart=/opt/pocketbase/pocketbase serve --http=0.0.0.0:8090
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   Inicia el servicio:
   ```bash
   sudo systemctl enable pocketbase
   sudo systemctl start pocketbase
   ```

## Paso 2: Configurar Firewall

Asegúrate de que el puerto 8090 esté abierto en tu firewall:

```bash
sudo ufw allow 8090/tcp
```

## Paso 3: Ejecutar Script de Inicialización

1. **En tu máquina local**, ve al directorio del proyecto:
   ```bash
   cd C:\Users\dailo\Desktop\ProyectosAbe\ApPigota
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Edita el archivo setup_pocketbase.js** si necesitas cambiar:
   - La URL del servidor (línea 6)
   - El email/password del admin (líneas 7-8)

4. **Ejecuta el script**:
   ```bash
   npm run setup
   ```

5. **Verifica que el script haya completado exitosamente**:
   - Deberías ver mensajes de carga para cada colección
   - Al final verás "✓✓✓ Setup de PocketBase completado exitosamente ✓✓✓"

## Paso 4: Verificar Instalación

1. **Accede al panel de administración de PocketBase**:
   ```
   http://192.168.0.29:8090/_/
   ```

2. **Login con las credenciales**:
   - Email: admin@lapigota.cat
   - Password: admin123

3. **Verifica que las colecciones estén creadas**:
   - junta
   - membres_colla
   - sortides
   - bestiari
   - reunions
   - documents
   - tasques
   - piro_stock
   - vestuari_stock
   - vestuari_assignacions
   - formulari_preguntes
   - respostes_form
   - configuracio
   - recorridos_mapa
   - reserves_roba

4. **Verifica que los datos iniciales estén cargados**:
   - Revisa que haya 7 miembros de junta
   - Revisa que haya 65 miembros de colla
   - Revisa que haya 4 sortidas
   - etc.

## Paso 5: Configurar la Aplicación

Edita el archivo `js/script.js` y actualiza la configuración de PocketBase:

```javascript
const PB_CONFIG = {
    enabled: true,
    baseUrl: "http://192.168.0.29:8090", // Tu servidor CasaOS
    collection: "app_state",
    keyField: "storageKey",
    dataField: "payload",
    authCollection: "users"
};
```

## Paso 6: Probar la Conexión

1. **Abre la aplicación en tu navegador**
2. **Verifica que se conecte a PocketBase**:
   - Mira en la consola del navegador (F12)
   - Deberías ver mensajes de conexión exitosa
   - El indicador de sincronización debería cambiar de "Local" a "Online"

## Troubleshooting

### No puedo acceder a PocketBase desde mi máquina local

- Verifica que PocketBase esté funcionando: `curl http://192.168.0.29:8090/api/health`
- Verifica el firewall en el servidor CasaOS
- Asegúrate de que PocketBase esté escuchando en 0.0.0.0:8090 (no solo localhost)

### El script de setup falla

- Verifica que PocketBase esté accesible: `curl http://192.168.0.29:8090/api/health`
- Revisa las credenciales en setup_pocketbase.js
- Verifica que no haya otro usuario admin creado

### Los datos no se sincronizan

- Revisa la configuración en js/script.js
- Verifica que baseUrl sea correcto
- Mira la consola del navegador para errores de red

## Consideraciones de Seguridad

Para producción:

1. **Cambia el password del admin** inmediatamente después del primer login
2. **Configura HTTPS** usando un proxy inverso (nginx/caddy)
3. **Usa variables de entorno** para credenciales sensibles
4. **Configura backups regulares** de la base de datos
5. **Limita el acceso** al puerto 8090 a tu red local

## Resumen de URLs

- **Aplicación**: http://localhost:8080 (o donde la sirvas)
- **PocketBase API**: http://192.168.0.29:8090/api/
- **Panel Admin PocketBase**: http://192.168.0.29:8090/_/
- **CasaOS Panel**: http://192.168.0.29

## Soporte

Si encuentras problemas:
1. Revisa los logs de PocketBase
2. Revisa la consola del navegador
3. Consulta la documentación de PocketBase: https://pocketbase.io/docs/