/* CAR Radio Sync: Firebase Authentication + Cloud Firestore, optional and free-tier compatible. */
(()=>{
"use strict";
const KEYS=new Set(["script","profiles","selection","model"]);
const CK=PREFIX+"firebase_cfg_v1",AK=PREFIX+"firebase_auth_v1";
const RULES=["rules_version = '2';","service cloud.firestore {"," match /databases/{database}/documents {","  match /users/{uid}/apps/{appId} {","   allow read, write: if request.auth != null && request.auth.uid == uid && appId == 'car-radio';","  }"," }","}"].join("\n");
const get=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
let cfg=get(CK,{projectId:"",apiKey:""}),auth=get(AK,null);
/* Enlace público de configuración: permite pasar solo la configuración Web de Firebase al móvil. */
try{
 const url=new URL(location.href),projectId=url.searchParams.get("carProject"),apiKey=url.searchParams.get("carApiKey");
 if(projectId&&apiKey&&/^[a-z0-9][a-z0-9-]{3,}$/.test(projectId)&&apiKey.length>=12){
  if(projectId!==cfg.projectId||apiKey!==cfg.apiKey){localStorage.removeItem(AK);auth=null}
  cfg={projectId,apiKey};localStorage.setItem(CK,JSON.stringify(cfg));
  url.searchParams.delete("carProject");url.searchParams.delete("carApiKey");
  history.replaceState(null,"",url.pathname+url.search+url.hash);
 }
}catch(e){/* La configuración manual sigue disponible. */}

let remoteTime=null,ready=false,busy=false,applying=false,dirty=false,conflict=null;
let saveTimer=null,retryTimer=null;
const byId=id=>document.getElementById(id);
let statusEl,smallEl,conflictEl;
const lastKey=()=>PREFIX+"firebase_last_"+(auth?.uid||"none");
const snapshot=()=>({script:scriptText,profiles:JSON.parse(JSON.stringify(profiles)),selection:[...selection],model});
const serialized=()=>JSON.stringify(snapshot());
function status(s){if(statusEl)statusEl.textContent=s;if(smallEl)smallEl.textContent="Nube: "+s}
function valid(v){return v&&typeof v.script==="string"&&v.script.length<350000&&
 Array.isArray(v.profiles)&&v.profiles.every(p=>p&&typeof p.id==="string"&&typeof p.name==="string"&&typeof p.style==="string"&&VOICES.includes(p.voice))&&
 Array.isArray(v.selection)&&v.selection.length===2&&v.selection.every(id=>v.profiles.some(p=>p.id===id))&&typeof v.model==="string"&&v.model.length<150&&JSON.stringify(v).length<800000}
function apply(v){
 if(!valid(v))throw Error("El documento remoto no es compatible.");
 localStorage.setItem(PREFIX+"cloud_backup_before_restore",serialized());
 applying=true;
 try{
  scriptText=v.script;profiles=v.profiles;selection=v.selection;model=v.model;
  save("script",scriptText);save("profiles",profiles);save("selection",selection);save("model",model);
  $("script").value=scriptText;$("model").value=model;renderProfiles();recalc();refreshLibrary();
 }finally{applying=false}
}
function changed(k){if(!KEYS.has(k)||applying||!auth)return;dirty=true;if(ready)schedule();else if(conflict)status("Conflicto: escoge qué configuración conservar.")}
window.CARRadioSync={changed};
function schedule(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>upload().catch(error),1500);status("Guardando cambios…")}
function error(e){status("Error de sincronización: "+String(e.message||e).slice(0,190))}
const endpoint=()=>"https://firestore.googleapis.com/v1/projects/"+encodeURIComponent(cfg.projectId)+"/databases/(default)/documents/users/"+encodeURIComponent(auth.uid)+"/apps/car-radio";
async function token(){
 if(!auth?.refreshToken)throw Error("Inicia sesión.");
 if(auth.idToken&&auth.expiresAt>Date.now()+60000)return auth.idToken;
 let r=await fetch("https://securetoken.googleapis.com/v1/token?key="+encodeURIComponent(cfg.apiKey),{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"refresh_token",refresh_token:auth.refreshToken})});
 let d=await r.json();if(!r.ok){auth=null;ready=false;localStorage.removeItem(AK);throw Error("Sesión caducada. Vuelve a entrar.")}
 auth.idToken=d.id_token;auth.refreshToken=d.refresh_token;auth.uid=d.user_id;auth.expiresAt=Date.now()+Number(d.expires_in)*1000;
 localStorage.setItem(AK,JSON.stringify(auth));return auth.idToken;
}
async function request(method,url,body){
 let r=await fetch(url,{method,headers:{"Authorization":"Bearer "+await token(),...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 let d=await r.json().catch(()=>({}));if(!r.ok){let e=Error(d.error?.message||"Firestore HTTP "+r.status);e.status=r.status;e.code=d.error?.status||"";throw e}return d;
}
async function readRemote(){
 try{let d=await request("GET",endpoint()),value=JSON.parse(d.fields?.payload?.stringValue||"null");if(!valid(value))throw Error("Los datos remotos no son válidos.");return {exists:true,value,time:d.updateTime}}
 catch(e){if(e.status===404)return {exists:false,value:null,time:null};throw e}
}
function conflictWith(remote){conflict=remote;ready=false;dirty=false;conflictEl.hidden=false;status("Hay dos versiones distintas. Elige cuál conservar.")}
function finish(remote,txt){remoteTime=remote.time;localStorage.setItem(lastKey(),txt);ready=true;dirty=false;conflict=null;conflictEl.hidden=true;status("Sincronizado · "+(auth.email||"cuenta conectada"))}
async function initialize(){
 if(!auth||!cfg.projectId||!cfg.apiKey)return;
 ready=false;busy=true;status("Conectando…");
 try{
  const remote=await readRemote(),local=serialized(),last=localStorage.getItem(lastKey());
  remoteTime=remote.time;
  if(!remote.exists){ready=true;dirty=true}
  else{
   const incoming=JSON.stringify(remote.value);
   const defaultLocal=scriptText===DEFAULT_SCRIPT&&JSON.stringify(profiles)===JSON.stringify(DEFAULT_PROFILES)&&JSON.stringify(selection)===JSON.stringify(["julian","nando"])&&model==="gemini-3.8-flash-tts";
   if(incoming===local||(!last&&defaultLocal)||(last&&local===last)){
    if(incoming!==local)apply(remote.value);
    finish(remote,incoming);
   }else if(last&&incoming===last){ready=true;dirty=true}
   else{conflictWith(remote);return}
  }
 }catch(e){error(e);return}finally{busy=false}
 if(dirty&&ready)schedule();
}
async function upload(){
 if(!auth||!ready||!dirty||busy)return;
 busy=true;const data=serialized();
 try{
  const condition=remoteTime?"?currentDocument.updateTime="+encodeURIComponent(remoteTime):"?currentDocument.exists=false";
  const d=await request("PATCH",endpoint()+condition,{fields:{payload:{stringValue:data},schema:{integerValue:"1"}}});
  remoteTime=d.updateTime;localStorage.setItem(lastKey(),data);
  dirty=data!==serialized();
  status(dirty?"Más cambios pendientes…":"Sincronizado · "+(auth.email||""));
 }catch(e){
  if([400,409,412].includes(e.status)&&/precondition|updateTime|currentDocument|FAILED_PRECONDITION/i.test(e.message+e.code)){
   try{conflictWith(await readRemote())}catch(ex){error(ex)}
  }else{dirty=true;error(e)}
 }finally{
  busy=false;
  if(dirty&&ready){clearTimeout(retryTimer);retryTimer=setTimeout(()=>upload().catch(error),20000)}
 }
}
async function poll(){
 if(!auth||!ready||dirty||busy||document.visibilityState==="hidden")return;
 busy=true;
 try{
  const remote=await readRemote();
  if(!remote.exists){conflictWith(remote);return}
  if(remote.time===remoteTime)return;
  const local=serialized(),last=localStorage.getItem(lastKey()),incoming=JSON.stringify(remote.value);
  if(local!==last&&local!==incoming)conflictWith(remote);
  else{if(local!==incoming)apply(remote.value);finish(remote,incoming)}
 }catch(e){error(e)}finally{busy=false}
}
async function login(register){
 if(!cfg.projectId||!cfg.apiKey)return status("Guarda primero el proyecto Firebase.");
 const email=byId("cloudEmail").value.trim(),password=byId("cloudPassword").value;
 if(!email||password.length<6)return status("Introduce correo y contraseña de al menos 6 caracteres.");
 status(register?"Creando cuenta…":"Entrando…");
 try{
  const action=register?"signUp":"signInWithPassword";
  const r=await fetch("https://identitytoolkit.googleapis.com/v1/accounts:"+action+"?key="+encodeURIComponent(cfg.apiKey),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,returnSecureToken:true})});
  const d=await r.json();if(!r.ok)throw Error(d.error?.message||"Error de autenticación");
  auth={uid:d.localId,email:d.email,idToken:d.idToken,refreshToken:d.refreshToken,expiresAt:Date.now()+Number(d.expiresIn)*1000};
  localStorage.setItem(AK,JSON.stringify(auth));byId("cloudPassword").value="";await initialize();
 }catch(e){error(e)}
}
function configSave(){
 const projectId=byId("cloudProject").value.trim(),apiKey=byId("cloudApiKey").value.trim();
 if(!/^[a-z0-9][a-z0-9-]{3,}$/.test(projectId)||apiKey.length<12)return status("Revisa el ID del proyecto y la clave web de Firebase.");
 if(projectId!==cfg.projectId||apiKey!==cfg.apiKey){auth=null;ready=false;localStorage.removeItem(AK)}
 cfg={projectId,apiKey};localStorage.setItem(CK,JSON.stringify(cfg));status("Proyecto guardado. Ahora inicia sesión.");
}
function chooseRemote(){
 if(!conflict?.exists)return status("No hay una versión en la nube.");
 apply(conflict.value);finish(conflict,JSON.stringify(conflict.value));
}
async function chooseLocal(){
 if(!conflict)return;remoteTime=conflict.time;conflict=null;ready=true;dirty=true;conflictEl.hidden=true;await upload()
}
function initUI(){
 const box=document.createElement("div");box.className="panel";
 box.innerHTML=[
 '<h2>Sincronización entre PC e iPhone</h2>',
 '<p class="muted">Sincroniza automáticamente guion, perfiles, voces elegidas y modelo. Los audios y la clave de Gemini permanecen solo en cada dispositivo.</p>',
 '<label>ID del proyecto Firebase</label><input id="cloudProject" placeholder="mi-proyecto" autocomplete="off">',
 '<label>Clave web API de Firebase (NO Gemini)</label><input id="cloudApiKey" placeholder="AIza…" autocomplete="off">',
 '<button class="secondary" style="margin-top:12px" id="cloudSaveConfig">Guardar proyecto</button>',
 '<button class="secondary" style="margin:12px 0 0 8px" id="cloudLink">Copiar enlace para el iPhone</button>',
 '<label>Correo</label><input id="cloudEmail" type="email" autocomplete="email" placeholder="correo@ejemplo.com">',
 '<label>Contraseña</label><input id="cloudPassword" type="password" autocomplete="current-password">',
 '<div class="actions"><button id="cloudLogin">Entrar</button><button class="secondary" id="cloudSignup">Crear cuenta</button></div>',
 '<div class="actions"><button class="secondary" id="cloudRefresh">Sincronizar ahora</button><button class="secondary" id="cloudLogout">Cerrar sesión</button></div>',
 '<p id="cloudSyncStatus" class="status" aria-live="polite">Sin configurar</p>',
 '<div id="cloudConflict" hidden><p class="note">Hay dos versiones distintas. El contenido local se respalda antes de importar el de la nube.</p>',
 '<div class="actions"><button id="cloudUseRemote">Usar nube</button><button class="secondary" id="cloudUseLocal">Usar este dispositivo</button></div></div>',
 '<details style="margin-top:12px"><summary>Cómo activar Firebase gratis</summary>',
 '<p>En <a href="https://console.firebase.google.com/" target="_blank" rel="noopener">Firebase Console</a>, crea proyecto Spark sin facturación.</p>',
 '<p>Activa Authentication → Sign-in method → Email/Password. Crea Cloud Firestore en modo producción y publica estas reglas en Firestore → Rules:</p>',
 '<pre id="cloudRules" style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px;background:#10222d;padding:12px;border-radius:9px"></pre>',
 '<p>En Ajustes del proyecto → General → Tus apps, registra una app web y copia su Project ID y Web API Key. No necesitas Firebase Hosting.</p>',
 '<p>En PC e iPhone, utiliza el mismo proyecto y entra con la misma cuenta de correo y contraseña.</p></details>'
 ].join("");
 $("tab-settings").append(box);
 statusEl=byId("cloudSyncStatus");conflictEl=byId("cloudConflict");
 byId("cloudRules").textContent=RULES;
 byId("cloudProject").value=cfg.projectId||"";byId("cloudApiKey").value=cfg.apiKey||"";byId("cloudEmail").value=auth?.email||"";
 byId("cloudSaveConfig").onclick=configSave;
 byId("cloudLink").onclick=async()=>{
  if(!cfg.projectId||!cfg.apiKey)return status("Primero guarda la configuración de Firebase.");
  const url=new URL(location.href);url.searchParams.set("carProject",cfg.projectId);url.searchParams.set("carApiKey",cfg.apiKey);
  try{await navigator.clipboard.writeText(url.toString());status("Enlace copiado. Envíatelo al iPhone y ábrelo allí.")}
  catch{window.prompt("Copia este enlace y ábrelo en el iPhone:",url.toString())}
 };

 byId("cloudLogin").onclick=()=>login(false);
 byId("cloudSignup").onclick=()=>login(true);
 byId("cloudLogout").onclick=()=>{auth=null;ready=false;dirty=false;conflict=null;clearTimeout(saveTimer);clearTimeout(retryTimer);localStorage.removeItem(AK);conflictEl.hidden=true;status("Sesión cerrada. Datos locales conservados.")};
 byId("cloudRefresh").onclick=()=>{if(!auth)return status("Inicia sesión primero.");if(conflict)return status("Resuelve el conflicto antes de sincronizar.");if(!ready)return initialize();return dirty?upload():poll()};
 byId("cloudUseRemote").onclick=()=>{try{chooseRemote()}catch(e){error(e)}};
 byId("cloudUseLocal").onclick=()=>chooseLocal().catch(error);
 smallEl=document.createElement("p");smallEl.className="muted";smallEl.style.fontSize="12px";$("status").after(smallEl);
 status(!cfg.projectId?"Configura Firebase en Ajustes.":auth?"Conectando…":"Inicia sesión en Ajustes.");
}
initUI();
if(auth&&cfg.projectId&&cfg.apiKey)initialize().catch(error);
setInterval(()=>poll().catch(error),30000);
window.addEventListener("focus",()=>poll().catch(error));
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")poll().catch(error)});
})();