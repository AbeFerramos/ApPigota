# Guía de Sincronización Multi-Dispositivo - La Pigota

## 📱 Cómo sincronizar la app entre ordenador y teléfonos

La aplicación de La Pigota usa **Firebase** para sincronizar los datos en tiempo real entre todos los dispositivos. Esto significa que cualquier cambio que hagas en un dispositivo se reflejará automáticamente en los demás.

---

## 🔧 Configuración inicial

### 1. Repositorio GitHub
El código está en: https://github.com/abeferramos/ApPigota

GitHub Pages: https://abeferramos.github.io/ApPigota/

### 2. Firebase
- **Proyecto**: la-pigota
- **Database**: Realtime Database (Europa-West1)
- **Auth**: Firebase Authentication (Email/Password)

---

## 📲 Acceso desde los dispositivos

### Desde el ordenador (desarrollo local):
```bash
cd ApPigota-main
npm install
npm start
```
Acceso: http://localhost:8080

### Desde cualquier dispositivo (producción):
Acceso: https://abeferramos.github.io/ApPigota/

---

## 🔐 Iniciar sesión en Firebase

Para que la sincronización funcione, todos los dispositivos deben iniciar sesión con la misma cuenta de Firebase:

1. Abre la app en el dispositivo
2. Haz clic en el botón **"Sessio"** (arriba a la derecha)
3. Usa las credenciales:
   - **Email**: admin@lapigota.cat
   - **Password**: lapigota2026
4. Haz clic en **"Entrar"**

Una vez iniciada la sesión, verás el indicador de sincronización cambiar de "Local" a "Sincronitzat".

---

## 🔄 Cómo funciona la sincronización

### Guardado automático
- Los cambios se guardan automáticamente en Firebase
- Tiempo de espera: 500ms después de cada cambio
- Indicador: "Sincronitzant..." → "Sincronitzat"

### Sincronización en tiempo real
- Firebase escucha cambios en la base de datos
- Cuando otro dispositivo hace un cambio, tu dispositivo se actualiza automáticamente
- Indicador: "Sincronitzat en temps real"

### Offline
- Si pierdes conexión, la app guarda en localStorage
- Al reconectar, los cambios se sincronizan automáticamente
- Indicador: "Local" (sin conexión)

---

## 📱 Configuración en teléfonos

### Opción 1: Usar GitHub Pages (Recomendado)
1. Abre el navegador en el teléfono
2. Ve a: https://abeferramos.github.io/ApPigota/
3. Inicia sesión con Firebase
4. **Opcional**: Instalar como PWA
   - En Chrome: Menú → "Añadir a pantalla de inicio"
   - En Safari: Compartir → "Añadir a inicio"

### Opción 2: Usar red local (solo en casa)
1. Asegúrate de que el ordenador está ejecutando `npm start`
2. Conecta el teléfono a la misma WiFi
3. Ve a: http://192.168.0.68:8080
4. Inicia sesión con Firebase

---

## 🛠️ Actualizar el código en GitHub

Cuando hagas cambios en el código del ordenador:

```bash
cd ApPigota-main
git add .
git commit -m "Descripción de los cambios"
git push origin main
```

GitHub Pages se actualizará automáticamente en 1-2 minutos.

---

## ⚠️ Solución de problemas

### Problema: No se sincronizan los cambios
**Solución**:
1. Verifica que todos los dispositivos tengan sesión iniciada en Firebase
2. Revisa el indicador de sincronización (debe decir "Sincronitzat")
3. Abre la consola del navegador (F12) y busca errores de Firebase

### Problema: No puedo iniciar sesión
**Solución**:
1. Verifica que el email y password sean correctos
2. Comprueba que tengas conexión a internet
3. Revisa la consola del navegador para errores de Firebase Auth

### Problema: GitHub Pages no se actualiza
**Solución**:
1. Verifica que hiciste `git push` correctamente
2. Espera 1-2 minutos (GitHub Pages tiene un pequeño delay)
3. Revisa la pestaña "Actions" en GitHub para ver el estado del despliegue

### Problema: PWA no se instala
**Solución**:
1. Asegúrate de que el site esté servido por HTTPS (GitHub Pages lo es)
2. Verifica que el manifest.json sea accesible
3. En iOS, usa Safari para instalar (no Chrome)

---

## 🔒 Seguridad

⚠️ **Importante**:
- Las credenciales de Firebase están en el código (no es ideal)
- Para producción, considera usar variables de entorno
- Cambia el password de Firebase regularmente
- No compartas las credenciales con personas fuera de la junta

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica el estado de Firebase Console
3. Contacta a Abraham (Vocal mantenimiento y app)

---

Última actualización: 2026-10-07
