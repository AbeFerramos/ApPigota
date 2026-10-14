# Guía de Funcionamiento - La Pigota
## Para creación de diapositivas

---

## 📱 ESTRUCTURA GENERAL DE LA APLICACIÓN

### Página Principal
- **Logo**: Logo de La Pigota con subtítulo "Gestió de junta i temporada 2026"
- **Header**:
  - Contador de tareas pendientes
  - Indicador de sincronización (Local/Sincronitzat)
  - Botón de instalación PWA (icono descarga)
  - Botón de notificaciones (campana)
  - Botón de sesión (Sessio)

### Navegación Principal (Barra inferior)
La aplicación tiene 5 secciones principales accesibles desde la barra inferior:
1. **Junta** - Gestión de la junta directiva
2. **Sortides** - Calendario de actuaciones
3. **Formulari** - Formularios de inscripción
4. **Vestuari** - Gestión del vestuario
5. **Tabals** - Ensayos y ritmos de tabals

---

## 1️⃣ SECCIÓN JUNTA

### Resumen del Dashboard
- **Métricas principales**:
  - Sortides (número de actuaciones)
  - Assajos mes (ensayos del mes)
  - Articles piro (material pirotécnico)
  - Prioritats (tareas prioritarias)

### Subsecciones de Junta (Navegación lateral izquierda)

#### 1.1 Membres
- **Propósito**: Organigrama de la junta directiva
- **Funcionalidades**:
  - Ver lista de miembros de la junta
  - Añadir nuevo miembro (botón +)
  - Editar información de miembros
  - Eliminar miembros
- **Información de cada miembro**:
  - Nombre
  - Cargo/posición
  - Funciones y responsabilidades

#### 1.2 Documentació
- **Propósito**: Archivo de documentos de la colla
- **Funcionalidades**:
  - Ver lista de documentos
  - Añadir nuevo documento
  - Editar documentos
  - Eliminar documentos
  - Archivar documentos
- **Tipos de documentos**:
  - Actas de reuniones
  - Reglamentos
  - Documentos administrativos
  - Presupuestos
- **Filtros**: Por categoría

#### 1.3 Reunions
- **Propósito**: Registro de reuniones de junta
- **Funcionalidades**:
  - Ver historial de reuniones
  - Crear nueva reunión
  - Editar reuniones
  - Eliminar reuniones
- **Información de cada reunión**:
  - Fecha
  - Título/contexto
  - Acords (decisiones tomadas)
  - Acta (resumen detallado)

#### 1.4 Crear Sortida
- **Propósito**: Crear rápidamente una nueva actuación
- **Campos**:
  - Fecha
  - Ubicación
  - Tipo de actuación
  - Detalles adicionales

#### 1.5 Bestiari
- **Propósito**: Inventario de bestias de la colla
- **Funcionalidades**:
  - Ver lista de bestias
  - Añadir nueva bestia
  - Editar información
  - Eliminar bestias
- **Información de cada bestia**:
  - Nombre
  - Tipo
  - Estado (activo/inactivo)
  - Responsable
  - Mantenimiento

#### 1.6 Piro
- **Propósito**: Gestión de material pirotécnico
- **Funcionalidades**:
  - Ver inventario de pirotecnia
  - Registrar uso en salidas
  - Control de stock
- **Tipos de material**:
  - Carretilles
  - Infantils
  - Brolladors
  - Efectes (fum/torxes)

#### 1.7 R. Form
- **Propósito**: Resumen de respuestas de formularios
- **Funcionalidades**:
  - Ver estadísticas de inscripciones
  - Análisis de respuestas
  - Exportar datos

#### 1.8 Tancar Sessió
- Cerrar sesión de la sección privada de junta

---

## 2️⃣ SECCIÓN SORTIDES

### Propósito
Gestión del calendario de actuaciones de la colla

### Funcionalidades
- **Ver calendario**: Lista cronológica de todas las salidas
- **Crear salida**: Botón + para añadir nueva actuación
- **Editar salida**: Modificar detalles de una salida existente
- **Eliminar salida**: Borrar una salida
- **Ver detalles**:
  - Fecha
  - Ubicación
  - Tipo de actuación
  - Información adicional
  - Estado (planificada/completada/cancelada)

### Tipos de salidas
- Actuaciones
- Ensayos públicos
- Eventos especiales
- Festivales

---

## 3️⃣ SECCIÓN FORMULARI

### Propósito
Formularios de inscripción para miembros de la colla

### Funcionalidades
- **Google Forms integrado**: Formularios en línea
- **Registro de inscripciones**:
  - Noves inscripcions (nuevos miembros)
  - Inscripcions sortides (participación en salidas)
  - Actualització de dades (actualización de datos personales)

### Proceso de inscripción
1. El usuario rellena el formulario
2. Los datos se guardan automáticamente
3. Se puede ver el resumen en la sección R. Form de Junta

---

## 4️⃣ SECCIÓN VESTUARI

### Propósito
Gestión del vestuario de la colla

### Dos bloques principales:

#### 4.1 Stock del Guardarropa
- **Part de dalt** (parte superior):
  - Tallas disponibles (S, M, L, XL, XXL)
  - Cantidad en stock
  - Total (guardarropa + personas)

- **Pantalon** (pantalones):
  - Tallas disponibles
  - Cantidad en stock
  - Total

#### 4.2 Asignaciones a Personas
- **Lista de asignaciones**:
  - Nombre de la persona
  - Talla de parte de dalt
  - Estado (al guardarropa / amb la persona)
  - Talla de pantalón
  - Estado (al guardarropa / amb la persona)

- **Indicador visual**:
  - 🔵 Punto azul: La persona tiene la ropa consigo
  - ⚪ Sin punto: La ropa está en el guardarropa

- **Orden automático**:
  - Primero aparecen las personas con el punto azul (ropa en posesión)
  - Luego las que tienen la ropa en el guardarropa

### Funcionalidades
- **Añadir asignación**: Asignar ropa a una persona (botón +)
- **Editar asignación**: Modificar talla o estado
- **Eliminar asignación**: Quitar asignación
- **Control de stock**: Actualización automática al asignar/desasignar

---

## 5️⃣ SECCIÓN TABALS

### Propósito
Gestión de ensayos y ritmos de tabals

### Subsecciones (Navegación superior)

#### 5.1 Calendari
- **Propósito**: Calendario de ensayos de tabals
- **Funcionalidades**:
  - Ver calendario mensual
  - Navegar entre meses (flechas izquierda/derecha)
  - Ver ensayos programados en cada día
  - Crear nuevo ensayo
  - Editar ensayos
  - Eliminar ensayos

- **Banner de cambios**:
  - Aviso cuando hay cambios en el próximo ensayo
  - Indicador visual de modificaciones

- **Configuración de recordatorios**:
  - Toggle para activar/desactivar recordatorios
  - Notificaciones de ensayos próximos

- **Información de cada ensayo**:
  - Fecha y hora
  - Ubicación
  - Tipo de ensayo
  - Asistencia
  - Notas

#### 5.2 Ritmes
- **Propósito**: Reproductor de ritmos y esquemas
- **Funcionalidades**:
  - Ver lista de ritmos
  - Reproducir ritmos
  - Ver esquemas visuales
  - Añadir nuevos ritmos
  - Editar ritmos
  - Eliminar ritmos

- **Reproductor**:
  - Controles de reproducción
  - Visualización del ritmo
  - Información del ritmo (nombre, BPM, tipo)

---

## 🔧 FUNCIONALIDADES ESPECIALES

### Sincronización Multi-dispositivo
- **Indicador de estado**:
  - 🟢 Local: Trabajando sin conexión
  - 🔵 Sincronitzat: Conectado a Firebase

- **Botón Sessio**:
  - Iniciar sesión con credenciales Firebase
  - Cerrar sesión
  - Sincronización automática de datos

- **Sincronización en tiempo real**:
  - Cambios guardados automáticamente
  - Actualización simultánea en todos los dispositivos
  - Funciona offline (guardado local)

### Notificaciones
- **Botón de campana**:
  - Solicitar permiso de notificaciones
  - Activar/desactivar notificaciones

- **Tipos de notificaciones**:
  - Recordatorios de ensayos
  - Avisos de cambios en salidas
  - Recordatorios de reuniones

### Instalación como App (PWA)
- **Botón de descarga**:
  - Aparece cuando la app se puede instalar
  - Crea acceso directo en el escritorio

- **En móvil**:
  - Android: Chrome → Menú → "Añadir a pantalla de inicio"
  - iOS: Safari → Compartir → "Añadir a inicio"

- **Ventajas**:
  - Funciona offline
  - Icono en pantalla de inicio
  - Sin barra de navegador
  - Actualización automática

---

## 📊 ACCESO A LA APLICACIÓN

### Opciones de acceso
1. **GitHub Pages** (recomendado):
   - URL: https://abeferramos.github.io/ApPigota/
   - HTTPS seguro
   - Acceso desde cualquier lugar
   - PWA funcional

2. **Red local**:
   - http://192.168.0.68:8080
   - Solo en la misma red WiFi
   - Servidor local

3. **Instalación como app**:
   - Acceso directo desde escritorio
   - Sin navegador
   - Offline

---

## 👥 USUARIOS Y PERMISOS

### Público general
- Ver información pública
- Rellenar formularios
- Ver calendario de salidas

### Miembros de la colla
- Acceso a información de miembros
- Inscripciones a salidas
- Ver vestuario (lectura)

### Junta directiva
- Acceso completo a todas las secciones
- Gestión de miembros
- Gestión de documentos
- Gestión de salidas
- Gestión de vestuario
- Gestión de bestiario
- Gestión de pirotecnia
- Configuración de ensayos

---

## 🎨 DISEÑO Y USABILIDAD

### Características de diseño
- **Responsive**: Funciona en móvil, tablet y escritorio
- **Navegación intuitiva**: Barra inferior siempre visible
- **Iconos descriptivos**: FontAwesome para claridad visual
- **Colores temáticos**: Rojo (#e63946) como color principal
- **Tipografía clásica**: Georgia para aspecto tradicional

### Experiencia de usuario
- **Accesos rápidos**: Botones de acción principales
- **Feedback visual**: Indicadores de estado
- **Gestión de modales**: Formularios en ventanas emergentes
- **Notificaciones**: Mensajes toast para confirmaciones
- **Carga rápida**: Optimizada para rendimiento

---

## 🔄 FLUJOS DE TRABAJO TÍPICOS

### Organizar una salida
1. Ir a sección Sortides
2. Pulsar botón +
3. Rellenar fecha, ubicación y detalles
4. Guardar
5. (Opcional) Desde Junta → Crear Sortida (acceso rápido)

### Asignar vestuario
1. Ir a sección Vestuari
2. Ver stock disponible
3. Pulsar botón +
4. Rellenar nombre y tallas
5. Seleccionar estado (guardarropa/persona)
6. Guardar
7. Stock actualizado automáticamente

### Programar ensayo de tabals
1. Ir a sección Tabals → Calendari
2. Navegar al mes deseado
3. Pulsar en el día o botón +
4. Rellenar detalles del ensayo
5. Guardar
6. (Opcional) Activar recordatorios

### Registrar reunión de junta
1. Ir a sección Junta → Reunions
2. Pulsar botón +
3. Rellenar fecha, título y acords
4. (Opcional) Añadir acta detallada
5. Guardar
6. Documento archivado automáticamente

---

## 📞 SOPORTE Y MANTENIMIENTO

### Problemas comunes
- **No se sincroniza**: Verificar conexión y estado de Firebase
- **Iconos no cargan**: Limpiar caché del navegador
- **PWA no instala**: Usar HTTPS (GitHub Pages)
- **Acceso denegado**: Verificar credenciales de sesión

### Contacto
- Administrador: [Contacto de la colla]
- Repositorio: https://github.com/AbeFerramos/ApPigota
- Documentación: README.md y guías en el repositorio

---

## 📝 NOTAS PARA LAS DIAPOSITIVAS

### Sugerencias de estructura
1. **Diapositiva 1**: Título y logo de La Pigota
2. **Diapositiva 2**: Pantalla principal y navegación
3. **Diapositiva 3**: Sección Junta - Dashboard
4. **Diapositiva 4**: Junta - Membres y Documentació
5. **Diapositiva 5**: Junta - Reunions y Bestiari
6. **Diapositiva 6**: Sección Sortides
7. **Diapositiva 7**: Sección Formulari
8. **Diapositiva 8**: Sección Vestuari (Stock y asignaciones)
9. **Diapositiva 9**: Sección Tabals - Calendari
10. **Diapositiva 10**: Tabals - Ritmes
11. **Diapositiva 11**: Sincronización y PWA
12. **Diapositiva 12**: Acceso multi-dispositivo
13. **Diapositiva 13**: Flujos de trabajo típicos
14. **Diapositiva 14**: Conclusiones y preguntas

### Elementos visuales a incluir
- Capturas de pantalla de cada sección
- Diagramas de navegación
- Iconos de funcionalidades
- Ejemplos de formularios
- Indicadores de estado (sync, notificaciones)

### Colores de marca
- Principal: #e63946 (rojo)
- Fondo: #fff9f2 (crema)
- Texto: #1f2430 (oscuro)
- Acentos: #c24b2b (naranja rojizo)

---

*Documento preparado para la creación de material de presentación de La Pigota - Gestión de Colla de Diables*
