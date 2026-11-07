/* RecetaFit · Gemini FREE · personal single-user BYOK client. No backend, no paid APIs. */
(function(root){
'use strict';
const API='https://generativelanguage.googleapis.com/v1beta';
const MODELS=['gemini-3.8-flash','gemini-3.5-flash-lite','gemini-3.5-flash','gemini-3.6-flash'];
let activeModel=MODELS[0];
const MAX_INLINE=19*1024*1024;
const RECIPE_SHAPE=`Devuelve SOLO un objeto JSON válido con estas claves:
{"title":"string","description":"string","servings":2,"prep_minutes":null,"cook_minutes":null,
"ingredients":[{"name":"string","quantity":100,"unit":"g","note":""}],
"steps":["paso detallado"],"notes":[],"changes":[],
"nutrition":{"calories":null,"protein":null,"carbs":null,"fat":null}}.
Las cantidades son números o null; unidades separadas. Estima kcal, proteínas, hidratos y grasas POR RACIÓN usando ingredientes y cantidades conocidas. Si falta la cantidad de un ingrediente principal, devuelve null para los valores que no puedas estimar con fundamento; nunca inventes gramos ni declares exactitud.
Nunca inventes cantidades, ingredientes o tiempos no observables. Si no hay receta legible, responde {"error":"No se identifican ingredientes y pasos suficientes"}. Todo en español.`;
const EXTRACT_PROMPT=`Analiza el material adjunto (texto, imágenes, audio o vídeo) para extraer una receta realmente presente en el material. Prioriza los ingredientes y cantidades dichas en el audio, escritas en pantalla o en el texto. No supongas que una URL de redes sociales es una transcripción. Usa pasos reproducibles SOLO si se pueden inferir con claridad. Identifica las cantidades que no se especifican con null. ${RECIPE_SHAPE}`;
const FITNESS_PROMPTS={
 proteina:'Alta en proteína: aumenta proteínas de calidad por ración con sustituciones y cantidades coherentes.',
 ligera:'Baja en kcal: reduce la energía por ración sin eliminar proteínas esenciales ni comprometer la saciedad.',
 baja_carbos:'Baja en hidratos: reduce alimentos ricos en carbohidratos y compensa con verduras y proteínas sin alterar excesivamente el plato.',
 baja_grasas:'Baja en grasas: limita frituras y grasas añadidas y elige técnicas de cocción y alimentos apropiados.',
 fibra:'Alta en fibra: prioriza legumbres, verduras, frutas y cereales integrales compatibles con la receta.',
 equilibrada:'Equilibrada: procura combinar proteínas, grasas, hidratos y verduras de forma proporcionada.'
};
const typed=(n)=>Number.isFinite(Number(n))?Number(n):null;
function normalize(o){
 if(!o||typeof o!=='object'||o.error)throw Error(String(o?.error||'La IA no ha encontrado una receta suficientemente completa.'));
 const title=String(o.title||'').trim().slice(0,130);
 const ingredients=(Array.isArray(o.ingredients)?o.ingredients:[]).slice(0,80).map(x=>({
  name:String(x?.name||'').trim().slice(0,140),
  quantity:x?.quantity===null||x?.quantity===''||x?.quantity===undefined?null:typed(x.quantity),
  unit:String(x?.unit||'').trim().slice(0,35),note:String(x?.note||'').trim().slice(0,200)
 })).filter(x=>x.name);
 const steps=(Array.isArray(o.steps)?o.steps:[]).slice(0,40).map(x=>String(x||'').trim().slice(0,600)).filter(Boolean);
 if(!title||!ingredients.length||!steps.length)throw Error('La IA no ha identificado título, ingredientes y preparación. Adjunta el vídeo o pega la descripción.');
 let nutrition={};for(const k of ['calories','protein','carbs','fat']) nutrition[k]=o.nutrition?.[k]===null||o.nutrition?.[k]===undefined?null:typed(o.nutrition[k]);
 return {title,description:String(o.description||'').slice(0,280),servings:Math.max(1,Math.min(30,parseInt(o.servings,10)||2)),
  prep_minutes:o.prep_minutes===null||o.prep_minutes===undefined?null:typed(o.prep_minutes),
  cook_minutes:o.cook_minutes===null||o.cook_minutes===undefined?null:typed(o.cook_minutes),
  ingredients,steps,notes:(Array.isArray(o.notes)?o.notes:[]).slice(0,12).map(x=>String(x).slice(0,260)),
  changes:(Array.isArray(o.changes)?o.changes:[]).slice(0,12).map(x=>String(x).slice(0,260)),nutrition};
}
function parseResponse(body){
 const txt=(body?.candidates?.[0]?.content?.parts||[]).filter(x=>typeof x.text==='string').map(x=>x.text).join('\n').trim();
 if(!txt){if(body?.promptFeedback?.blockReason)throw Error('Google ha bloqueado esta solicitud: '+body.promptFeedback.blockReason);throw Error('La IA no ha devuelto contenido. Prueba con otra receta.');}
 const cleaned=txt.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 try{return normalize(JSON.parse(cleaned))}catch(e){if(e instanceof SyntaxError)throw Error('La IA ha devuelto un formato inesperado. Vuelve a intentarlo.');throw e}
}
function checkKey(key){if(!key||key.length<20||/\s/.test(key))throw Error('Introduce una clave de Google AI Studio válida en Ajustes.');}
async function ensureOk(response){if(response.ok)return response;let detail='Error de la API de Gemini';try{let data=await response.json();detail=data?.error?.message||detail}catch{};
 if(response.status===429)throw Error('Se alcanzó el límite GRATUITO de Gemini. Vuelve a intentarlo cuando se restablezca tu cuota.');
 if(response.status===401||response.status===403)throw Error('Google rechazó la clave o no permite este modelo en tu proyecto. Comprueba tu clave gratuita. '+detail.slice(0,160));
 throw Error(`${detail.slice(0,250)} (HTTP ${response.status})`)}
// Use only models currently listed by Google with a free tier.
// Fall back to Flash-Lite on retired/unavailable models or temporary overload.
async function requestGeneration(key,parts,maxOutputTokens=8192,update=null){
 checkKey(key);
 const candidates=[activeModel,...MODELS.filter(name=>name!==activeModel)];
 const excluded=new Set();
 let lastTransientStatus=0;
 // Two bounded rounds. Transient server overload is not an invalid API key.
 for(let round=0;round<2;round++){
  let hadTransient=false;
  for(const model of candidates){
   if(excluded.has(model))continue;
   if(round>0||model!==candidates[0])update?.('Google está saturado. Probando otro modelo gratuito…');
   let response;
   try{
    response=await fetch(`${API}/models/${model}:generateContent`,{
     method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},
     body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json',maxOutputTokens}}),cache:'no-store'
    });
   }catch(err){throw Error('No se pudo conectar con Google. Revisa la conexión a Internet y vuelve a intentarlo.');}
   if(response.ok){activeModel=model;return response.json();}
   if(response.status===404){excluded.add(model);continue;}
   if([408,500,502,503,504].includes(response.status)){lastTransientStatus=response.status;hadTransient=true;continue;}
   // Quota, invalid key and input errors need explicit handling, not retries.
   await ensureOk(response);
  }
  if(!hadTransient)break;
  if(round===0){update?.('Los modelos están ocupados. Reintentando automáticamente…');await new Promise(resolve=>setTimeout(resolve,1600));}
 }
 if(lastTransientStatus)throw Error('Google está saturado temporalmente (HTTP '+lastTransientStatus+'). RecetaFit ha probado varios modelos gratuitos y ha reintentado automáticamente. Vuelve a intentarlo en unos minutos o pega la receta en «Texto».');
 throw Error('Google no ofrece un modelo compatible para esta solicitud. Comprueba los modelos disponibles en tu proyecto de AI Studio.');
}
async function verifyKey(key){
 const body=await requestGeneration(key,[{text:'Prueba de conexión RecetaFit. Devuelve SOLO el objeto JSON {"ok":true}, sin ningún otro texto.'}],2048);
 const result=(body?.candidates?.[0]?.content?.parts||[]).filter(x=>typeof x.text==='string').map(x=>x.text).join('').trim();
 let parsed=null;try{parsed=JSON.parse(result)}catch{}
 if(parsed?.ok!==true)throw Error('Gemini respondió, pero no completó la prueba. Reintenta la conexión.');
 return true;
}
async function generate(key,parts,update=null){return parseResponse(await requestGeneration(key,parts,8192,update));}
function asDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('No puedo leer el archivo seleccionado.'));reader.readAsDataURL(file);});}
async function uploadVideo(key,file,update){
 update?.('Subiendo el vídeo a Google…');
 const start=await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files',{method:'POST',
  headers:{'x-goog-api-key':key,'X-Goog-Upload-Protocol':'resumable','X-Goog-Upload-Command':'start',
   'X-Goog-Upload-Header-Content-Length':String(file.size),
   'X-Goog-Upload-Header-Content-Type':file.type||'video/mp4','Content-Type':'application/json'},
  body:JSON.stringify({file:{display_name:file.name.slice(0,100)||'receta.mp4'}})});
 await ensureOk(start);
 const uploadUrl=start.headers.get('x-goog-upload-url');
 if(!uploadUrl||!uploadUrl.startsWith('https://generativelanguage.googleapis.com/'))throw Error('El navegador no permite recuperar el enlace de subida.');
 const data=await fetch(uploadUrl,{method:'POST',headers:{'X-Goog-Upload-Offset':'0','X-Goog-Upload-Command':'upload, finalize'},body:file});
 await ensureOk(data);const result=await data.json();const f=result.file;
 if(!f?.uri||!f?.name)throw Error('Google no ha devuelto un archivo válido.');
 for(let i=0;i<35;i++){
  const r=await fetch(`${API}/${f.name}`,{headers:{'x-goog-api-key':key}});await ensureOk(r);const j=await r.json();
  if(j.state==='ACTIVE')return {file_data:{mime_type:j.mimeType||file.type||'video/mp4',file_uri:j.uri}};
  if(j.state==='FAILED')throw Error('Google no ha podido procesar este vídeo.');
  update?.('Google está procesando el vídeo…');await new Promise(done=>setTimeout(done,2000));
 }
 throw Error('El vídeo sigue procesándose. Prueba de nuevo con un archivo más corto.');
}
const supportedYoutube=(url)=>{try{const u=new URL(url);const h=u.hostname.toLowerCase();return u.protocol==='https:'&&(h==='youtu.be'||h==='youtube.com'||h==='www.youtube.com'||h==='m.youtube.com'||h==='youtube-nocookie.com');}catch{return false}};
async function extract({key,kind,url='',text='',file=null,images=[],update=null}){
 if(kind==='text')return generate(key,[{text:EXTRACT_PROMPT+'\n\nTEXTO DE LA RECETA:\n'+text.slice(0,30000)}],update);
 if(kind==='url'){
  if(supportedYoutube(url))return generate(key,[{text:EXTRACT_PROMPT+'\nContexto adicional:\n'+text.slice(0,10000)},{file_data:{file_uri:url}}],update);
  if(!text.trim())throw Error('Instagram y TikTok no permiten analizar siempre el vídeo desde su enlace. Guárdalo y súbelo en «Archivo», o pega su descripción.');
  const r=await generate(key,[{text:EXTRACT_PROMPT+'\n\nIMPORTANTE: NO HAS VISTO EL VÍDEO DE ESTE ENLACE. Extrae SOLO del texto aportado.\nURL de referencia: '+url.slice(0,300)+'\nTEXTO:\n'+text.slice(0,30000)}]);
  r.notes.push('Extraída únicamente del texto aportado; el vídeo de la red social no se ha analizado.');return r;
 }
 if(kind==='video'){
  if(!file&&(!images||!images.length))throw Error('Selecciona un vídeo.');
  let parts=[{text:EXTRACT_PROMPT+'\n\nContexto adicional:\n'+text.slice(0,10000)}];
  if(images?.length){for(const img of images)parts.push({inline_data:{mime_type:'image/jpeg',data:String(img).split(',')[1]}});const r=await generate(key,parts);r.notes.push('Se analizaron fotogramas, no el audio del vídeo. Completa cantidades no visibles.');return r;}
  if(file.size<=MAX_INLINE){update?.('Analizando el audio y el vídeo…');const encoded=await asDataURL(file);parts.push({inline_data:{mime_type:file.type||'video/mp4',data:encoded.split(',')[1]}});return generate(key,parts);}
  parts.push(await uploadVideo(key,file,update));update?.('Extrayendo ingredientes y preparación…');return generate(key,parts);
 }
 throw Error('Origen no reconocido.');
}
async function estimateNutrition({key,recipe}){
 if(!recipe||!Array.isArray(recipe.ingredients)||!recipe.ingredients.length)throw Error('La receta no tiene ingredientes suficientes.');
 const known=recipe.ingredients.filter(i=>i.quantity!==null&&i.quantity!==undefined&&Number(i.quantity)>0).length;
 if(!known)throw Error('Faltan cantidades de ingredientes. Añade cantidades a la receta para poder estimar sus macros.');
 const input={title:recipe.title,servings:recipe.servings,ingredients:recipe.ingredients,steps:recipe.steps};
 const prompt='Estima el valor nutricional POR RACIÓN de esta receta basándote en tablas nutricionales habituales y en las cantidades disponibles. Calcula las kcal, proteínas, hidratos de carbono y grasas teniendo en cuenta grasas de cocción, pesos, pérdidas razonables y número de raciones. No inventes cantidades desconocidas. Si la ausencia de una cantidad relevante impide estimar razonablemente un nutriente, devuelve null para ese campo. Responde SOLAMENTE con un JSON de esta forma: {"calories":number|null,"protein":number|null,"carbs":number|null,"fat":number|null}. Sin texto ni otras claves. Es una estimación, no una medición nutricional. RECETA: '+JSON.stringify(input).slice(0,30000);
 const result=await requestGeneration(key,[{text:prompt}],2048);
 const body=(result?.candidates?.[0]?.content?.parts||[]).filter(x=>typeof x.text==='string').map(x=>x.text).join('').trim();
 let obj;try{obj=JSON.parse(body.replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/,''));}catch{throw Error('Gemini no ha devuelto valores nutricionales en formato válido.');}
 if(!obj||typeof obj!=='object')throw Error('Respuesta nutricional no válida.');
 const nutrition={};
 for(const key of ['calories','protein','carbs','fat']){
  const n=obj[key]===null||obj[key]===undefined||obj[key]===''?null:Number(obj[key]);
  nutrition[key]=n!==null&&Number.isFinite(n)&&n>=0&&n<=100000?n:null;
 }
 if(Object.values(nutrition).every(x=>x===null))throw Error('No hay cantidades suficientes para calcular una estimación fiable.');
 return nutrition;
}
async function fitness({key,recipe,goal}){
 if(!FITNESS_PROMPTS[goal])throw Error('Objetivo fitness no válido.');
 const prompt=`Actúa como cocinero y nutricionista culinario. Crea una versión fitness REALISTA de la receta que se adjunta. Objetivo: ${FITNESS_PROMPTS[goal]}.
 Respeta técnicas, cantidades y seguridad alimentaria. Mantén el título reconocible añadiendo el objetivo fitness. Detalla las sustituciones en changes.
 No proclames valores nutricionales exactos: proporciona sólo estimaciones por ración si existen datos suficientes; de lo contrario usa null.
 Reescribe los pasos para que sean consistentes con ingredientes y técnicas modificadas. ${RECIPE_SHAPE}\nReceta original:\n${JSON.stringify(recipe).slice(0,30000)}`;
 return generate(key,[{text:prompt}]);
}
root.RecetaFitGeminiFree={verifyKey,extract,fitness,estimateNutrition,normalize,parseResponse,supportedYoutube,activeModel:()=>activeModel};
})(typeof globalThis!=='undefined'?globalThis:this);