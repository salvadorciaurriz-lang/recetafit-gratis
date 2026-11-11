# Sincronización de CAR Radio (PC + iPhone)

La app de GitHub Pages incorpora sincronización opcional mediante Firebase Authentication (correo y contraseña) + Cloud Firestore.

## Configuración inicial (una vez)

1. Abre https://console.firebase.google.com/ y crea un proyecto con el plan **Spark**. No vincules facturación.
2. En **Authentication → Sign-in method**, habilita **Email/Password**.
3. En **Firestore Database**, crea la base de datos en modo producción.
4. En **Firestore → Rules**, publica exactamente estas reglas (no uses reglas abiertas):

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/apps/{appId} {
      allow read, write: if request.auth != null
        && request.auth.uid == uid
        && appId == 'car-radio';
    }
  }
}
```

5. En **Configuración del proyecto → General → Tus aplicaciones**, registra una aplicación **Web**.
6. Copia del bloque `firebaseConfig` los valores `apiKey` y `projectId`. Son la **clave web de Firebase**, no tu clave de Gemini.

## Primer dispositivo (PC)

1. Abre https://salvadorciaurriz-lang.github.io/recetafit-gratis/car-radio/
2. Recarga la app con Ctrl+F5 si todavía muestra una versión antigua.
3. En **Ajustes → Sincronización entre PC e iPhone**, pega el `projectId` y `apiKey` de Firebase y pulsa **Guardar proyecto**.
4. Elige un correo y contraseña y pulsa **Crear cuenta**.
5. Espera el estado **Sincronizado**.
6. Pulsa **Copiar enlace para el iPhone** y envíatelo mediante un mensaje.

## Segundo dispositivo (iPhone)

1. Abre el enlace enviado desde Safari.
2. En **Ajustes**, introduce el mismo correo y contraseña y pulsa **Entrar** (no crear otra cuenta).
3. La nube cargará los perfiles, el guion y las opciones. Las diferencias se resuelven sin sobrescribir silenciosamente.
4. Espera hasta 30 segundos o pulsa **Sincronizar ahora** si el otro dispositivo sigue abierto.

## Qué se sincroniza

- Guion, perfiles de locutores (incluidas instrucciones), voces seleccionadas modelo TTS y velocidad de exportación.
- Cada edición se sube automáticamente con un retardo corto para evitar una petición por tecla.
- Las actualizaciones se comprueban al recuperar el foco y cada 30 segundos con la app abierta.
- Antes de sustituir el contenido local, se deja una copia en `localStorage` con clave `car_radio_gh_v1_cloud_backup_before_restore`.

## Qué NO se sincroniza

- Clave personal de Gemini: permanece en el navegador, por seguridad.
- Fragmentos de audio WAV y archivos de respaldo: siguen siendo locales y se pueden exportar manualmente.
- No se crea una cuenta ni se sincroniza nada mientras el usuario no configure Firebase y se autentique.

## Coste

Firebase Spark tiene cuotas gratuitas para Firestore y Authentication por correo/contraseña; un uso personal ordinario de Radio CAR previsiblemente queda dentro de esas cuotas. La facturación no es necesaria para estas funciones.

## Si aparece un conflicto de versiones

- **Usar nube**: recuperar la configuración remota y guardar antes la local como respaldo.
- **Usar este dispositivo**: sobrescribir el documento remoto con la configuración local, comprobando el control de versión del documento.

No introduzcas credenciales de Gemini ni contraseñas de Firebase en el repositorio GitHub. Firebase `apiKey` es una configuración pública de la aplicación web y no sustituye la autenticación ni las reglas de seguridad.

## Descarga a varias velocidades

En **Estudio → Audio resultante**, elige 0,85x, 1x, 1,10x, 1,20x, 1,25x, 1,35x, 1,50x, 1,75x o 2x. La escucha previa adapta la velocidad del reproductor y el botón **Descargar WAV** produce un archivo nuevo con la velocidad seleccionada. La conversión se realiza en el dispositivo mediante WSOLA para conservar aproximadamente el tono original de las voces, sin llamar de nuevo a Gemini.

En Safari, si la descarga automática se bloquea, utiliza **Guardar el WAV preparado (iPhone / Safari)**. La velocidad seleccionada también se guarda en este navegador y se sincroniza entre dispositivos si Firebase está configurado.
