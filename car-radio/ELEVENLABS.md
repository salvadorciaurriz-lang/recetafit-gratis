# Radio CAR · ElevenLabs (integración segura)

Esta integración permite elegir **Gemini** o **ElevenLabs** para Julián y Nando, con los mismos guiones, caché de fragmentos, exportación WAV y velocidades de reproducción. El alojamiento de Radio CAR sigue en GitHub Pages.

**Importante:** crear una voz en ElevenLabs no evita gastar créditos en las nuevas crónicas. Las voces se reutilizan, pero la síntesis de cada texto nuevo consume créditos según tu plan y modelo.

## 1. Requisitos

- Una cuenta de [ElevenLabs](https://elevenlabs.io/) con permisos de API y acceso a las voces que quieres utilizar.
- Una clave API **con permisos limitados** (síntesis de voz y lectura de voces) y un límite de consumo/créditos configurado desde ElevenLabs.
- Una cuenta de [Cloudflare](https://dash.cloudflare.com/) con Workers Free; no es necesario activar facturación para las peticiones ordinarias dentro del límite gratuito.
- Un código privado fuerte, distinto de tus contraseñas. El Worker lo verifica antes de gastar créditos.

## 2. Crear el Worker seguro de ElevenLabs

1. Entra en Cloudflare → **Workers & Pages** → Create → Worker (las etiquetas de los menús pueden cambiar).
2. Crea un Worker llamado, por ejemplo, \`car-radio-eleven\`.
3. Abre su editor de código y sustituye el contenido por **[elevenlabs-worker.js](./elevenlabs-worker.js)**, que está en este repositorio. Publica el Worker.
4. En Worker → Settings → **Variables and Secrets**, añade estas dos variables como **secretos cifrados** (tipo Secret, no variables públicas):
   - \`ELEVENLABS_API_KEY\`: clave privada API de ElevenLabs. Nunca la pegues en GitHub ni en Radio CAR.
   - \`CAR_RADIO_ACCESS_TOKEN\`: código privado aleatorio largo, mínimo 16 caracteres, preferiblemente 48 caracteres hexadecimales. Puedes generarlo desde Radio CAR, Ajustes → ElevenLabs → **Generar código seguro**, y copiarlo aquí.
5. Guarda los secretos y vuelve a desplegar si Cloudflare lo solicita.
6. Copia la URL del Worker que te proporciona Cloudflare, por ejemplo \`https://car-radio-eleven.tucuenta.workers.dev\`.

**Seguridad:** el Worker solo autoriza peticiones desde \`https://salvadorciaurriz-lang.github.io\` y exige el código privado antes de llegar a ElevenLabs. El código de acceso puede guardarse en cada navegador, pero no se comparte a través de Firebase. La clave privada de ElevenLabs permanece en Cloudflare.

## 3. Conectar Radio CAR

1. Abre [Radio CAR](https://salvadorciaurriz-lang.github.io/recetafit-gratis/car-radio/) y actualiza la página si usas una versión anterior.
2. Abre **Ajustes → ElevenLabs · conexión segura**.
3. Pega la URL del Worker y el código privado que pusiste en Cloudflare. Pulsa **Guardar conexión** y **Comprobar conexión**.
4. Pulsa **Cargar mis voces**, selecciona una voz para **Julián** y otra para **Nando**, y pulsa **Asignar voces a los perfiles**.
   - Alternativa: si ya conoces los Voice ID, entra en **Voces → Editar** e introduce el ID directamente. Los perfiles conservan también su voz Gemini, que no se elimina.
5. En **Estudio**, selecciona **ElevenLabs** en Motor de voz.
6. Elige el modelo:
   - **Eleven v3:** diálogo multivoz expresivo (solicitudes de hasta 2.000 caracteres recomendadas).
   - **Eleven v4:** diálogo multivoz actualizado.
   - **Flash v2.5:** económico; genera cada intervención por separado y después las monta.
   - **Multilingual v2:** síntesis más estable por intervención.
7. Pulsa **Probar primer fragmento**. Radio CAR informará del número de caracteres nuevos que consumirá y te pedirá confirmación.
8. Si te gusta el resultado, pulsa **Generar completo**. Los fragmentos ya creados se reutilizan automáticamente; los cambios en el guion solo hacen generar los grupos modificados.

## 4. Uso desde PC e iPhone

- Los IDs de voz se almacenan en los perfiles. Si ya configuraste la sincronización Firebase, viajan junto al resto de los perfiles, al igual que motor/modelo y URL del Worker.
- El código privado de acceso al Worker **no se sincroniza**: deberás introducirlo una vez en cada dispositivo, por seguridad.
- Los audios y los créditos gastados no se comparten automáticamente. Cada navegador mantiene su caché local; **generar de nuevo en otro dispositivo puede volver a consumir créditos**.
- La velocidad del WAV se selecciona en **Estudio → Audio resultante**. Cambiarla no vuelve a consultar ElevenLabs.

## 5. Costes y límites

- **Cloudflare Workers Free**: cuotas gratuitas de peticiones, suficientes en principio para uso personal de CAR Radio.
- **ElevenLabs**: la generación de cada fragmento nuevo consume créditos de la cuenta. El gasto varía por modelo y plan, y se comprueba en ElevenLabs. Probar no es gratis si hay que generar audio nuevo.
- El Worker exige un código privado y valida modelo, Voice ID y tamaño de cada fragmento, pero **no implementa un contador de crédito global ni un presupuesto mensual automático**. Activa un límite de créditos/permisos de clave desde ElevenLabs para evitar gastos no deseados.
- ElevenLabs no autoriza publicar la clave API en JavaScript del navegador. Por eso Radio CAR utiliza este Worker y no pide pegarla en la web.

## 6. Resolución de problemas

- **Worker no configurado:** comprueba que exista la URL y hayas guardado ambos secretos en Cloudflare.
- **401:** el código privado del navegador no coincide con \`CAR_RADIO_ACCESS_TOKEN\`.
- **403:** el origen de la web no coincide con el dominio permitido, o hay restricciones sobre tu clave de ElevenLabs.
- **429 / quota exceeded:** no tienes cuota o créditos disponibles. Los fragmentos que ya se han guardado se conservan.
- **Error al cargar voces:** verifica que la clave permite listar voces y que estén disponibles en tu espacio de ElevenLabs.
- **Voces intercambiadas:** revisa los IDs en Voces → Editar; Gemini y ElevenLabs utilizan identificadores distintos.
- **iPhone no carga la actualización:** abre la versión web en Safari, actualiza la página y vuelve a entrar a la PWA.

## Referencias técnicas

- [API Text to Dialogue](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert)
- [API Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)
- [Autenticación de ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

---

## Alternativa Supabase (recomendada si has conectado Supabase a ChatGPT)

La aplicación admite **Supabase Edge Functions**, además del Worker de Cloudflare descrito arriba.

1. Crea o elige un proyecto Supabase en la región europea y en el plan Free. Confirma antes cualquier coste indicado.
2. Despliega **`supabase/functions/car-radio-elevenlabs/index.ts`** como Edge Function `car-radio-elevenlabs`, con verificación JWT desactivada (`verify_jwt = false`) porque el código verifica obligatoriamente el token privado de Radio CAR. El despliegue se puede hacer desde el conector Supabase, sin instalar herramientas.
3. En [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto → **Edge Functions → Secrets**, crea:
   - `ELEVENLABS_API_KEY`: tu clave privada de ElevenLabs.
   - `CAR_RADIO_ACCESS_TOKEN`: código fuerte generado con el botón **Generar código seguro** dentro de Radio CAR. El código debe tener al menos 16 caracteres; el generador crea 48 caracteres hexadecimales.
4. En Radio CAR → Ajustes → ElevenLabs, introduce la URL completa que tendrá esta forma:
   `https://<project-ref>.supabase.co/functions/v1/car-radio-elevenlabs`.
   Pega el mismo `CAR_RADIO_ACCESS_TOKEN` y guarda la conexión.
5. Pulsa **Comprobar conexión**. Después **Cargar mis voces**, asigna Julián y Nando y prueba el primer fragmento.

El servidor **no funciona sin ambos secretos**: responde HTTP 503. No publiques las claves API en GitHub, tampoco dentro de una URL ni de un mensaje de chat.

Consulta la documentación oficial sobre [secretos de Supabase Edge Functions](https://supabase.com/docs/guides/functions/secrets).

**Importante:** una clave de acceso guardada en el navegador sirve para uso personal; si la aplicación se comparte públicamente, conviene añadir autenticación real de usuarios y control de cuotas por usuario en el servidor.
