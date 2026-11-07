# RecetaFit GRATIS 3.0 — iPhone

## Coste

La aplicación y su código son gratuitos. No necesita backend ni OpenAI. **Gemini 3.8 Flash (alternativa: 3.5 Flash-Lite) ofrece cuota gratuita limitada**, sin garantía de disponibilidad perpetua. Si el proyecto de Google AI Studio tiene la facturación desactivada, al alcanzar la cuota gratuita la IA dejará de responder en lugar de pasar a una tarifa de pago. **No actives la facturación.**

## Qué hace

- Recetas y buscador, cantidades por raciones, lista de compra, exportación e importación JSON: funcionan sin IA y sin conexión tras su instalación.
- Texto: extracción con IA si hay clave gratis, o parser local si no hay clave.
- YouTube público: puede pasar URL al modelo Gemini para analizar vídeo y audio (función de URL de YouTube en vista previa, disponibilidad variable).
- Instagram/TikTok: NO se puede garantizar extracción directa del vídeo desde el enlace. Hay que guardar y subir el vídeo o pegar una descripción con ingredientes y elaboración.
- Subir MP4/MOV desde Fotos: Gemini intenta analizarlo. Los archivos hasta 19 MiB se envían como contenido en línea; los grandes intentan Files API y, si falla por limitación del navegador, utilizan imágenes extraídas en el dispositivo (sin audio) advirtiéndolo en la ficha.
- Fitness con IA si hay clave gratis; sin ella, sustituciones básicas orientativas. Calorías y macros son estimaciones, no valores validados.

## Activar IA GRATIS

1. Entra en https://aistudio.google.com/api-keys con tu cuenta de Google.
2. Crea una clave de API en un **proyecto gratuito sin facturación vinculada**. Si Google te exige activar facturación, no lo hagas; el modo gratuito puede no estar disponible en tu cuenta.
3. En RecetaFit → Ajustes pega la clave y pulsa «Comprobar y activar IA». Es para uso PERSONAL.
4. La clave solo se almacena en `sessionStorage` del navegador (no en los archivos ni en un servidor). Como cualquier clave enviada directamente desde una app web, es accesible dentro de esa sesión y no es segura para una app pública con múltiples usuarios. Google recomienda un backend para producción. No compartas el dispositivo desbloqueado ni ejecutes código de origen desconocido en el mismo dominio.

## Instalar en iPhone sin pagar

Hay que alojar esta carpeta en **HTTPS**. GitHub Pages permite alojar una web estática gratuitamente en un repositorio público (con GitHub Free). Crea un repositorio independiente «recetafit-gratis», sube SOLO los archivos de esta carpeta (sin ninguna clave) y activa Settings → Pages → Deploy from a branch → main / root. La URL será `https://TU-USUARIO.github.io/recetafit-gratis/` cuando GitHub la publique.

Abre la URL en Safari en el iPhone → Compartir → Añadir a pantalla de inicio. El Mac no tiene que permanecer encendido.

Si solo abres `index.html` desde Archivos, Safari puede restringir el almacenamiento y no se instalará como PWA: publica la web en HTTPS para un resultado fiable.

## Privacidad y límites

- Las recetas se guardan en `localStorage` solo del dispositivo. Haz copias de seguridad.
- Los vídeos y textos enviados a Gemini free pueden ser utilizados para mejorar los productos de Google conforme a las condiciones de su servicio gratuito.
- Las cuotas de peticiones y tamaño cambian y una solicitud puede fallar aunque no haya ningún coste.
- No se ha ejecutado una llamada real a Gemini desde este entorno por falta de clave de usuario. Los tests de la interfaz y cliente usan respuestas simuladas.
- Sólo procesa vídeos públicos o propios y respeta derechos y condiciones de las plataformas.

Estado: migración a GitHub Pages en curso. Nunca publiques claves de API.
