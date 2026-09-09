# Configuración de PocketBase para La Pigota

He creado la estructura necesaria para migrar tu aplicación "La Pigota" a una base de datos PocketBase en tu servidor CasaOS (192.168.0.29).

## Archivos Creados

### 1. `pocketbase_collections.json`
Estructura de las colecciones de PocketBase basada en los datos de tu aplicación. Incluye 14 colecciones:
- `junta` - Miembros de la junta directiva
- `membres_colla` - Todos los miembros de la colla
- `sortides` - Salidas y eventos
- `bestiari` - Contactos de bestiarios
- `reunions` - Reuniones y actas
- `documents` - Documentación
- `tasques` - Tareas pendientes
- `piro_stock` - Control de pirotecnia
- `vestuari_stock` - Stock de vestuario
- `vestuari_assignacions` - Asignaciones de vestuario
- `formulari_preguntes` - Preguntas del formulario
- `respostes_form` - Respuestas del formulario
- `configuracio` - Configuración general
- `recorridos_mapa` - Recorridos en el mapa
- `reserves_roba` - Reservas de ropa

### 2. `setup_pocketbase.js`
Script de Node.js para inicializar PocketBase con todos los datos de tu aplicación. Este script:
- Crea el usuario admin si no existe
- Carga todos los datos iniciales de la aplicación
- Verifica que no se dupliquen datos

### 3. `package.json`
Archivo de configuración de Node.js con las dependencias necesarias.

### 4. `INSTALL_POCKETBASE_CASAOS.md`
Guía completa de instalación paso a paso para CasaOS.

### 5. `js/script.js` (modificado)
He actualizado la configuración de PocketBase para usar tu servidor CasaOS:
- `baseUrl: "http://192.168.0.29:8090"`

## Pasos para Completar la Instalación

### 1. Instalar PocketBase en CasaOS

Sigue las instrucciones en `INSTALL_POCKETBASE_CASAOS.md`. Recomiendo usar Docker desde el panel de CasaOS.

### 2. Ejecutar el Script de Inicialización

En tu máquina local:

```bash
cd C:\Users\dailo\Desktop\ProyectosAbe\ApPigota
npm install
npm run setup
```

### 3. Verificar la Instalación

Accede al panel de administración de PocketBase:
```
http://192.168.0.29:8090/_/
```
- Email: admin@lapigota.cat
- Password: admin123

### 4. Probar la Aplicación

Abre tu aplicación y verifica que se conecte correctamente a PocketBase.

## Configuración de Seguridad Importante

⚠️ **IMPORTANTE**: Cambia inmediatamente el password del admin después del primer login en el panel de PocketBase.

## Estructura de Datos Migrada

He migrado toda la estructura de datos de tu aplicación, incluyendo:

- **7 miembros de junta** con sus cargos y funciones
- **65 miembros de colla** 
- **4 salidas** programadas
- **22 contactos de bestiarios**
- **2 reuniones** con actas
- **13 tareas** pendientes
- **Stock de pirotecnia** inicial
- **Stock de vestuario** inicial
- **5 preguntas del formulario**
- **Configuración general** (contraseñas, agenda base, etc.)

## Próximos Pasos

1. **Instala PocketBase** en CasaOS siguiendo la guía
2. **Ejecuta el script** de inicialización
3. **Verifica** que todo funcione correctamente
4. **Cambia las credenciales** por seguridad
5. **Configura HTTPS** para producción (opcional pero recomendado)

## Soporte

Si encuentras algún problema:
1. Revisa el archivo `INSTALL_POCKETBASE_CASAOS.md` para troubleshooting
2. Verifica los logs de PocketBase
3. Revisa la consola del navegador para errores de conexión

## Archivos Modificados

- `js/script.js` - Actualizada la configuración de PocketBase para usar 192.168.0.29:8090

## Archivos Nuevos

- `pocketbase_collections.json` - Estructura de colecciones
- `setup_pocketbase.js` - Script de inicialización
- `package.json` - Dependencias de Node.js
- `INSTALL_POCKETBASE_CASAOS.md` - Guía de instalación
- `README_POCKETBASE_SETUP.md` - Este archivo