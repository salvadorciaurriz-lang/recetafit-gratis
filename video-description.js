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
  return {...base,message:'TikTok no ha permitido recuperar la descripción automáticamente. Pega el texto si lo necesitas.'};
 }
 if(s.platform==='instagram')return {...base,message:'Instagram no facilita su descripción completa desde esta aplicación. Copia el texto o sube el vídeo.'};
 return {...base,message:'Este enlace no ofrece una descripción compatible. Introduce el texto manualmente.'};
}
root.RecetaFitDescription={sourceFor,retrieve};
})(typeof globalThis!=='undefined'?globalThis:this);