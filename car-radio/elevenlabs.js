/* CAR Radio · motor ElevenLabs. Los secretos API nunca se incluyen en esta web. */
(()=>{
"use strict";
const PREFIX_KEY=PREFIX+"eleven_worker_token";
const MODELS=new Set(["eleven_v3","eleven_v4","eleven_flash_v2_5","eleven_multilingual_v2"]);
const DIALOGUE=new Set(["eleven_v3","eleven_v4"]);
const MAX_CHARS=1800;
const el=id=>document.getElementById(id);
let engine=load("engine","gemini")==="elevenlabs"?"elevenlabs":"gemini";
let elevenModel=MODELS.has(load("elevenModel","eleven_v3"))?load("elevenModel","eleven_v3"):"eleven_v3";
let workerUrl=load("elevenWorkerUrl","https://wcffjsbboazdhupobscu.supabase.co/functions/v1/car-radio-elevenlabs");
let token="";
try{token=sessionStorage.getItem(PREFIX_KEY)||localStorage.getItem(PREFIX_KEY)||""}catch{}
const label=(message)=>{el("elevenStatus").textContent=message};
function goodUrl(input){
 try{
  const url=new URL(String(input||"").trim());
  if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash||!url.hostname) return "";
  // Conservar la ruta completa para admitir Supabase Edge Functions y Cloudflare Workers.
  return url.origin + url.pathname.replace(/\/+$/, "");
 }catch{return ""}
}
function fillProvider(){
 el("engine").value=engine;
 el("elevenModel").value=elevenModel;
 el("elevenStudio").hidden=engine!=="elevenlabs";
 el("geminiModelWrap").hidden=engine!=="gemini";
 el("elevenWorker").value=workerUrl;
 el("elevenToken").value=token;
 el("elevenRemember").checked=!!localStorage.getItem(PREFIX_KEY);
 updateEstimate();
}
function clearAudio(){
 current=null;
 el("audio").pause();
 el("audio").removeAttribute("src");
 el("audio").load();
 el("download").disabled=true;
 el("share").disabled=true;
 el("progress").value=0;
}
function changeEngine(value,persist=true){
 engine=value==="elevenlabs"?"elevenlabs":"gemini";
 if(persist)save("engine",engine);
 el("engine").value=engine;
 el("elevenStudio").hidden=engine!=="elevenlabs";
 el("geminiModelWrap").hidden=engine!=="gemini";
 renderProfiles();clearAudio();
 recalc();
 refreshLibrary().catch(e=>label("No se pudo actualizar la lista: "+e.message));
 updateEstimate();
}
function setModel(value,persist=true){
 if(!MODELS.has(value))return;
 elevenModel=value;
 el("elevenModel").value=value;
 if(persist)save("elevenModel",value);
 clearAudio();recalc();refreshLibrary().catch(()=>{});
 updateEstimate();
}
function splitLongText(text,size=MAX_CHARS){
 if(text.length<=size)return [text];
 const chunks=[];
 let remaining=text;
 while(remaining.length>size){
  let pos=remaining.lastIndexOf(". ",size);
  if(pos<size*0.45)pos=remaining.lastIndexOf(", ",size);
  if(pos<size*0.45)pos=remaining.lastIndexOf(" ",size);
  if(pos<size*0.45)pos=size;
  else pos+=1;
  chunks.push(remaining.slice(0,pos).trim());
  remaining=remaining.slice(pos).trim();
 }
 if(remaining)chunks.push(remaining);
 return chunks;
}
function makeInputs(){
 const people=selected();
 const ids=people.map(p=>(p.elevenVoiceId||"").trim());
 const all=parse(scriptText).flatMap(t=>
  splitLongText(t.text).map(part=>({
   text:part,
   voice_id:ids[t.speaker==="Julian"?0:1],
   speaker:t.speaker
  }))
 );
 return all;
}
function partsFor(model,inputs){
 if(!DIALOGUE.has(model)) return inputs.map(t=>[t]);
 const out=[];let block=[],count=0;
 for(const t of inputs){
  const limit=out.length===0?450:MAX_CHARS;
  const reachFirstTwo=out.length===0&&new Set(block.map(x=>x.speaker)).size<2;
  if(block.length&&(count+t.text.length>MAX_CHARS||(count+t.text.length>limit&&!reachFirstTwo))){
   out.push(block);block=[];count=0;
  }
  if(t.text.length>MAX_CHARS)throw Error("La intervención supera el límite seguro de ElevenLabs.");
  block.push(t);count+=t.text.length;
 }
 if(block.length)out.push(block);
 return out;
}
function getParts(){
 const inputs=makeInputs();
 return partsFor(elevenModel,inputs);
}
async function planEleven(){
 const groups=getParts();
 const jobs=await Promise.all(groups.map(async group=>{
  const inputs=group.map(({text,voice_id})=>({text,voice_id}));
  const config={engine:"elevenlabs",model:elevenModel,inputs};
  return {...config,turns:group.map(t=>({speaker:t.speaker,text:t.text})),id:await digest(config)};
 }));
 return jobs;
}
function estimate(){
 try{
  const groups=getParts(),chars=groups.reduce((n,g)=>n+g.reduce((sum,v)=>sum+v.text.length,0),0);
  return {chars,groups:groups.length};
 }catch{return {chars:0,groups:0}}
}
function updateEstimate(){
 const e=estimate();
 el("elevenEstimate").textContent=
  "Guion: "+e.chars.toLocaleString("es-ES")+" caracteres hablados · "+e.groups+" solicitudes estimadas. "+
  "ElevenLabs cobra por los caracteres de las solicitudes nuevas; el audio ya guardado no vuelve a consumir créditos.";
}
async function request(path,body){
 const endpoint=goodUrl(workerUrl);
 if(!endpoint)throw Error("Configura la URL del Worker de ElevenLabs en Ajustes.");
 if(!token||token.length<16)throw Error("Configura el código de acceso del Worker en Ajustes.");
 let res;
 try{
  res=await fetch(endpoint+path,{
   method:body?"POST":"GET",
   headers:{"X-Car-Radio-Token":token,...(body?{"Content-Type":"application/json"}:{})},
   ...(body?{body:JSON.stringify(body)}:{})
  });
 }catch(e){throw Error("No se pudo contactar con el Worker. Comprueba su URL, conexión y configuración CORS. "+e.message)}
 if(!res.ok){
  let error;
  try{const data=await res.json();error=data.error}catch{}
  throw Error(error||"Error HTTP "+res.status+" del Worker.");
 }
 return res;
}
async function decodeMp3ToWav(binary){
 const AudioContextCtor=window.AudioContext||window.webkitAudioContext;
 if(!AudioContextCtor)throw Error("Este navegador no permite decodificar audio.");
 let ctx;
 try{
  ctx=new AudioContextCtor();
  const buffer=await ctx.decodeAudioData(binary.slice(0));
  const length=Math.ceil(buffer.duration*24000);
  if(!length||length>24000*60*7)throw Error("Audio demasiado largo para convertirlo en este dispositivo.");
  const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
  const byte=new Uint8Array(length*2),view=new DataView(byte.buffer);
  for(let i=0;i<length;i++){
   const pos=i*buffer.sampleRate/24000,index=Math.min(buffer.length-1,Math.floor(pos));
   const next=Math.min(buffer.length-1,index+1),fract=pos-index;
   let value=0;
   for(const ch of channels)value+=(ch[index]*(1-fract)+ch[next]*fract)/channels.length;
   const sample=Math.round(Math.max(-1,Math.min(1,value))*32767);
   view.setInt16(i*2,sample,true);
  }
  return wav(byte);
 }finally{try{await ctx?.close()}catch{}}
}
async function synthEleven(job){
 const inputs=job.inputs.map(x=>({voice_id:x.voice_id,text:x.text}));
 if(inputs.some(x=>!x.voice_id))throw Error("Falta asignar la voz de Julián o Nando en la pestaña Voces (ElevenLabs Voice ID).");
 const body=DIALOGUE.has(job.model)
  ? {model:job.model,inputs}
  : {model:job.model,input:inputs[0],settings:{stability:0.5,similarity_boost:0.8,style:0.1}};
 const res=await request("/speak",body);
 const binary=await res.arrayBuffer();
 if(binary.byteLength<1000)throw Error("ElevenLabs ha devuelto un audio vacío o demasiado corto.");
 return decodeMp3ToWav(binary);
}
async function check(){
 try{
  label("Comprobando conexión…");
  const res=await request("/health");
  const v=await res.json();
  label(v.ok?"Worker conectado. La clave API permanece protegida en el Worker.":"Respuesta inesperada del Worker.");
 }catch(e){label(e.message)}
}
function savedConnection(){
 const url=goodUrl(el("elevenWorker").value);
 const value=el("elevenToken").value.trim();
 if(!url||value.length<16){label("Introduce una URL HTTPS de Worker válida y un código de acceso de 16 caracteres como mínimo.");return}
 workerUrl=url;token=value;
 save("elevenWorkerUrl",workerUrl);
 try{
  sessionStorage.setItem(PREFIX_KEY,token);
  if(el("elevenRemember").checked)localStorage.setItem(PREFIX_KEY,token);
  else localStorage.removeItem(PREFIX_KEY);
 }catch{}
 label("Conexión guardada solo en este dispositivo. Puedes pulsar Comprobar conexión.");
}
async function loadVoices(){
 const list=el("elevenLibrary");
 try{
  label("Consultando voces de ElevenLabs…");
  const res=await request("/voices");
  const data=await res.json();
  if(!Array.isArray(data.voices)||!data.voices.length)throw Error("La cuenta no tiene voces disponibles para esta API.");
  for(const id of ["elevenJulian","elevenNando"]){
   const sel=el(id);
   sel.replaceChildren();
   for(const voice of data.voices){
    const option=new Option(voice.name+" · "+voice.id,voice.id);sel.add(option);
   }
  }
  const ps=selected();
  el("elevenJulian").value=ps[0].elevenVoiceId||data.voices[0].id;
  el("elevenNando").value=ps[1].elevenVoiceId||data.voices[Math.min(1,data.voices.length-1)].id;
  list.hidden=false;
  label("Voces obtenidas ("+data.voices.length+"). Selecciona Julián y Nando y pulsa Asignar.");
 }catch(e){label(e.message)}
}
function assign(){
 const ids=[el("elevenJulian").value,el("elevenNando").value];
 if(!ids.every(Boolean))return label("Selecciona ambas voces.");
 if(ids[0]===ids[1])return label("Asigna voces distintas a Julián y Nando.");
 const chosen=selected();
 for(let i=0;i<2;i++)chosen[i].elevenVoiceId=ids[i];
 save("profiles",profiles);renderProfiles();refreshLibrary().catch(()=>{});
 label("Voces asignadas a Julián y Nando. Ya puedes probar el primer fragmento.");
 updateEstimate();
}
function applyRemote(opts){
 if(opts.engine==="elevenlabs"||opts.engine==="gemini"){
  engine=opts.engine;el("engine").value=engine;
 }
 if(MODELS.has(opts.elevenModel)){elevenModel=opts.elevenModel;el("elevenModel").value=elevenModel}
 if(typeof opts.elevenWorkerUrl==="string"){workerUrl=goodUrl(opts.elevenWorkerUrl);el("elevenWorker").value=workerUrl}
 el("elevenStudio").hidden=engine!=="elevenlabs";
 el("geminiModelWrap").hidden=engine!=="gemini";
 renderProfiles();updateEstimate();
 recalc();refreshLibrary().catch(()=>{});
}
function testCount(){return engine==="elevenlabs"&&!DIALOGUE.has(elevenModel)?2:1}
el("engine").onchange=()=>changeEngine(el("engine").value);
el("elevenModel").onchange=()=>setModel(el("elevenModel").value);
el("elevenGenerateToken").onclick=async()=>{
 const bytes=crypto.getRandomValues(new Uint8Array(24));
 const newToken=Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");
 el("elevenToken").value=newToken;
 label("Código generado. Cópialo y añádelo como secreto CAR_RADIO_ACCESS_TOKEN en Cloudflare; después pulsa Guardar conexión.");
 try{await navigator.clipboard.writeText(newToken);label("Código copiado. Añádelo como secreto CAR_RADIO_ACCESS_TOKEN en Cloudflare y pulsa Guardar conexión.")}catch{}
};
el("elevenSave").onclick=savedConnection;
el("elevenTest").onclick=()=>check();
el("elevenVoices").onclick=()=>loadVoices();
el("elevenAssign").onclick=assign;
el("script").addEventListener("input",updateEstimate);
fillProvider();
window.CARRadioEleven={
 enabled:()=>engine==="elevenlabs",
 plan:planEleven,
 synth:synthEleven,
 testCount,
 updateEstimate,
 applyRemote,
 estimate,
 _test:{splitLongText,partsFor}
};
if(engine==="elevenlabs"){recalc();refreshLibrary().catch(()=>{})}
})();
