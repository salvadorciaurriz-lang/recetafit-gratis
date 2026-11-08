/* RecetaFit: public publication metadata, with explicit source and graceful fallback. */
(function(root){
'use strict';
function sourceFor(input){
 try{
  const u=new URL(String(input||'').trim());
  if(!['https:','http:'].includes(u.protocol))return {platform:'other'};
  const h=u.hostname.toLowerCase();
  if(['youtu.be','www.youtu.be','youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com'].includes(h)){
   const short=h==='youtu.be'||h==='www.youtu.be';
   const candidate=short?u.pathname.split('/')[1]:(u.searchParams.get('v')||u.pathname.match(/\/(?:shorts|embed|live)\/([^/?#]+)/)?.[1]||'');
   return {platform:'youtube',id:/^[A-Za-z0-9_-]{11}$/.test(candidate)?candidate:null,url:u.href};
  }
  if(['www.tiktok.com','tiktok.com','m.tiktok.com','vm.tiktok.com','vt.tiktok.com'].includes(h))return {platform:'tiktok',url:u.href};
  if(['instagram.com','www.instagram.com','m.instagram.com'].includes(h))return {platform:'instagram',url:u.href};
  return {platform:'other'};
 }catch{return {platform:'other'}}
}
function text(v,n=12000){return String(v||'').replace(/\r\n?/g,'\n').replace(/\0/g,'').trim().slice(0,n)}
async function json(url){const r=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
// Gemini URL context can read publicly accessible HTML, not protected videos.
async function tryPublicCaptionWithGemini(url,key){
 if(!key||String(key).trim().length<20)return null;
 const candidates=['gemini-3.8-flash','gemini-3.5-flash-lite'];
 for(const model of candidates){
  try{
   const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{
    method:'POST',cache:'no-store',
    headers:{'x-goog-api-key':key,'Content-Type':'application/json'},
    body:JSON.stringify({
     contents:[{role:'user',parts:[{text:'Lee solamente el texto público de esta publicación, sin descargar el vídeo. Devuelve exclusivamente su descripción/caption literal completa si aparece en la página HTML. No inventes ingredientes, medidas ni descripciones. Si no está disponible, devuelve exactamente NO_DISPONIBLE. URL: '+url}]}],
     tools:[{url_context:{}}]
    })
   });
   if(!response.ok){
    // 401/403/429 indicate account or quota issues, avoid further calls.
    if([401,403,429].includes(response.status))break;
    continue;
   }
   const data=await response.json();
   const candidate=data?.candidates?.[0];
   // Require explicit success from Google's URL Context, not model-generated claims.
   const results=candidate?.urlContextMetadata?.urlMetadata||candidate?.url_context_metadata?.url_metadata||[];
   const accessed=results.some(row=>String(row.urlRetrievalStatus||row.url_retrieval_status||'').includes('SUCCESS'));
   if(!accessed)continue;
   const textParts=(candidate?.content?.parts||[]).filter(p=>typeof p.text==='string').map(p=>p.text).join('\n').trim();
   const caption=textParts.replace(/^["']|["']$/g,'').slice(0,9000);
   if(!caption||/^NO_DISPONIBLE\b/i.test(caption)||caption.length<12)continue;
   return {source:'public_page',status:'partial',description:caption,title:'',message:'Gemini ha recuperado texto público de la página. Puede no contener la descripción completa.'};
  }catch{}
 }
 return null;
}
async function retrieve(url,key=''){
 const s=sourceFor(url),base={source:s.platform,status:'unavailable',description:'',title:'',message:''};
 if(s.platform==='youtube'){
  if(!s.id)return {...base,message:'No se reconoce el identificador del vídeo de YouTube.'};
  if(key){
   try{
    const endpoint='https://www.googleapis.com/youtube/v3/videos?part=snippet&id='+encodeURIComponent(s.id)+'&key='+encodeURIComponent(key);
    const obj=await json(endpoint),meta=obj?.items?.[0]?.snippet;
    if(meta){
     const description=text(meta.description);
     if(description)return {...base,status:'full',description,title:text(meta.title,180),message:'Descripción completa de YouTube obtenida.'};
     return {...base,title:text(meta.title,180),message:'YouTube no ofrece descripción pública para este vídeo.'};
    }
   }catch{} // Key without YouTube Data API, CORS restriction or transient failure
  }
  try{const o=await json('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(s.url));return {...base,title:text(o.title,180),message:'YouTube no ha permitido leer la descripción. Si incluye ingredientes, cópiala en el campo de texto.'}}catch{}
  return {...base,message:'No se pudo leer la descripción de YouTube. Si contiene ingredientes, cópiala en el campo de texto.'};
 }
 if(s.platform==='tiktok'){
  try{
   const o=await json('https://www.tiktok.com/oembed?url='+encodeURIComponent(s.url));
   const full=text(o.description||o.video_description);
   if(full)return {...base,status:'full',description:full,title:text(o.title,180),message:'Texto público recuperado de TikTok.'};
   const title=text(o.title,800);
   if(title)return {...base,status:'partial',description:title,title,message:'Se obtuvo el título o un extracto de TikTok; puede faltar parte de la descripción.'};
  }catch{}
  const online=await tryPublicCaptionWithGemini(s.url,key);
  return online||{...base,message:'TikTok no ha permitido recuperar la descripción automáticamente. Pega el texto o adjunta el vídeo desde aquí.'};
 }
 if(s.platform==='instagram'){
  const online=await tryPublicCaptionWithGemini(s.url,key);
  return online||{...base,message:'Instagram no ha facilitado el texto público. Pega la descripción o adjunta el vídeo desde esta pantalla.'};
 }
 return {...base,message:'Este enlace no ofrece una descripción compatible. Introduce el texto manualmente.'};
}
root.RecetaFitDescription={sourceFor,retrieve};
})(typeof globalThis!=='undefined'?globalThis:this);