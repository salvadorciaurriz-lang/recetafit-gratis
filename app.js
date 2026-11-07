/* RecetaFit 3.0 GRATIS - local recipes + Gemini BYOK free tier. */
(() => {
'use strict';
const STORAGE='recetafit_recipes_v1', SHOP='recetafit_shop_v1', CHECKS='recetafit_shopping_checked_v1', API_KEY_STORAGE='recetafit_gemini_key_device_v1';
const readSavedKey=()=>{try{return localStorage.getItem(API_KEY_STORAGE)||sessionStorage.getItem('recetafit_gemini_free_key')||''}catch{return ''}};
const GOALS={proteina:'Alta en proteína',ligera:'Baja en kcal',baja_carbos:'Baja en hidratos',baja_grasas:'Baja en grasas',fibra:'Alta en fibra',equilibrada:'Equilibrada'};
const ICONS={
'layout-grid':'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
'plus-circle':'<circle cx="12" cy="12" r="9"/><path d="M12 8v8m-4-4h8"/>','plus':'<path d="M12 5v14M5 12h14"/>','minus':'<path d="M5 12h14"/>',
'shopping-bag':'<path d="M4 8h16l-1.4 13H5.4L4 8z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
'settings':'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l-2 2a1.8 1.8 0 0 0-2-.4l-.7 2.3H9l-.7-2.3a1.8 1.8 0 0 0-2 .4l-2-2a1.8 1.8 0 0 0 .4-2L2.5 14v-4l2.2-.9a1.8 1.8 0 0 0-.4-2l2-2a1.8 1.8 0 0 0 2 .4L9 3h6l.7 2.5a1.8 1.8 0 0 0 2-.4l2 2a1.8 1.8 0 0 0-.4 2l2.2.9v4z"/>',
'search':'<circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 5 5"/>','arrow-up-right':'<path d="M6 18 18 6M8 6h10v10"/>',
'link':'<path d="M10 13.5a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.4 1.4"/><path d="M14 10.5a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.4-1.4"/>',
'video':'<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3"/>','align-left':'<path d="M4 6h16M4 11h10M4 16h16M4 21h10"/>',
'upload-cloud':'<path d="M20 17a4 4 0 0 0-.8-7.9A7 7 0 0 0 6 10a4 4 0 0 0-1 7.8"/><path d="M12 22V11m-4 4 4-4 4 4"/>',
'lock-keyhole':'<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 5v3"/>',
'sparkles':'<path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3zM20 18l.7 1.3L22 20l-1.3.7L20 22l-.7-1.3L18 20l1.3-.7L20 18z"/>',
'lightbulb':'<path d="M9 18h6m-5 3h4M12 2a7 7 0 0 0-4 13 5 5 0 0 1 1 3h6a5 5 0 0 1 1-3 7 7 0 0 0-4-13z"/>',
'copy':'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
'shield-check':'<path d="m12 2 8 4v5c0 5-3 9-8 11-5-2-8-6-8-11V6l8-4z"/><path d="m9 12 2 2 4-4"/>',
'brain-circuit':'<path d="M12 5a4 4 0 0 0-7 1 4 4 0 0 0-1 7 4 4 0 0 0 4 6h4V5zm0 0a4 4 0 0 1 7 1 4 4 0 0 1 1 7 4 4 0 0 1-4 6h-4"/><path d="M6 9h3m5 4h4M8 16h3"/>',
'hard-drive-download':'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 15h18m-9-12v9m-3-3 3 3 3-3"/>',
'download':'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>','upload':'<path d="M12 16V4m-4 4 4-4 4 4M4 17v4h16v-4"/>',
'smartphone':'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>','clock':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
'users':'<path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m15-13a4 4 0 0 1 0 8m5 5v-2a4 4 0 0 0-3-3.9"/><circle cx="9.5" cy="7" r="4"/>',
'check':'<path d="m5 12 4 4L19 6"/>','x':'<path d="M18 6 6 18M6 6l12 12"/>','trash':'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6m5 4v7m4-7v7"/>',
'chef-hat':'<path d="M6 14a5 5 0 0 1-1-10 5.5 5.5 0 0 1 9-1 5 5 0 1 1 5 9v9H5v-7m0 3h14"/>',
'arrow-left':'<path d="M19 12H5m7 7-7-7 7-7"/>'};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]||ICONS['check']}</svg>`;
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const read=(key,fallback)=>{try{const val=JSON.parse(localStorage.getItem(key));return val??fallback}catch{return fallback}};
const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'r-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const demoRecipe=()=>({id:'demo-pasta-v1',title:'Pasta cremosa con pollo',description:'Un clásico reconfortante, con salsa suave y un toque de parmesano.',servings:2,prep_minutes:10,cook_minutes:20,ingredients:[{name:'pasta',quantity:200,unit:'g',note:''},{name:'pechuga de pollo',quantity:250,unit:'g',note:''},{name:'nata para cocinar',quantity:150,unit:'ml',note:''},{name:'queso parmesano',quantity:35,unit:'g',note:''},{name:'aceite de oliva',quantity:1,unit:'cucharada',note:''},{name:'ajo',quantity:2,unit:'dientes',note:''},{name:'pimienta y sal',quantity:null,unit:'',note:'al gusto'}],steps:['Cuece la pasta en agua con sal siguiendo el tiempo indicado por el fabricante. Reserva un poco del agua de cocción.','Corta el pollo en trozos, salpimienta y dóralo en una sartén con el aceite.','Incorpora el ajo picado, cocina un minuto y añade la nata. Cocina a fuego suave.','Agrega la pasta y el parmesano. Mezcla, añadiendo agua de cocción si necesitas aligerar la salsa.'],notes:['Receta de ejemplo incluida para explorar la aplicación.'],changes:[],nutrition:{calories:null,protein:null,carbs:null,fat:null},fitness_variants:{},created_at:new Date().toISOString(),demo:true,emoji:'🍝'});
const state={recipes:read(STORAGE,null),shop:read(SHOP,{}),checks:read(CHECKS,{}),view:'home',modalId:null,variant:'original',goal:'proteina',servings:2,source:'url',search:'',ai:false,lan:false,pin:readSavedKey(),working:false};
if(!Array.isArray(state.recipes))state.recipes=[demoRecipe()];
const save=()=>{localStorage.setItem(STORAGE,JSON.stringify(state.recipes));localStorage.setItem(SHOP,JSON.stringify(state.shop));localStorage.setItem(CHECKS,JSON.stringify(state.checks));};
const getRecipe=id=>state.recipes.find(r=>r.id===id);
const totals=()=>{document.getElementById('sideCount').textContent=state.recipes.length;document.getElementById('recipeCount').textContent=state.recipes.length;document.getElementById('sideShopCount').textContent=Object.keys(state.shop).length};
function toast(message,error=false){const el=document.getElementById('toast');el.textContent=message;el.className='toast show'+(error?' error':'');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='toast',4000)}
const duration=r=>[r.prep_minutes,r.cook_minutes].some(n=>n!==null&&n!==undefined)?(Number(r.prep_minutes)||0)+(Number(r.cook_minutes)||0):null;
function nav(view){state.view=view;document.querySelectorAll('.page').forEach(x=>x.hidden=x.id!==view+'View');document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===view));document.getElementById('topTitle').textContent=({home:'Mi cocina',add:'Añadir receta',shop:'Lista de la compra',settings:'Ajustes'})[view];closeModal();if(view==='home')renderHome();if(view==='shop')renderShopping();window.scrollTo({top:0,behavior:'instant'});}
function renderHome(){totals();const query=state.search.trim().toLocaleLowerCase('es');const results=state.recipes.filter(r=>`${r.title} ${r.description} ${(r.ingredients||[]).map(i=>i.name).join(' ')}`.toLocaleLowerCase('es').includes(query));const cards=results.map((r,index)=>{const palettes=['mint','peach','berry'];const art=r.demo?'mint':palettes[index%3];const time=duration(r);return `<button class="recipe-card" data-open="${esc(r.id)}" aria-label="Ver receta ${esc(r.title)}"><div class="recipe-art ${art}">${r.demo?'<span class="recipe-badge">RECETA DE EJEMPLO</span>':(Object.keys(r.fitness_variants||{}).length?'<span class="recipe-badge">CON VERSIÓN FITNESS</span>':'')}<span class="dish">${esc(r.emoji||['🥗','🍲','🥘','🥑','🍝'][index%5])}</span></div><div class="recipe-body"><div class="recipe-tag">${Object.keys(r.fitness_variants||{}).length?'CON ADAPTACIÓN':'RECETA GUARDADA'}</div><h3>${esc(r.title)}</h3><p>${esc(r.description||'Tus ingredientes y preparación, siempre a mano.')}</p></div><div class="recipe-meta"><span>${icon('clock')} ${time===null?'—':time+' min'}</span><span>${icon('users')} ${esc(r.servings)} rac.</span></div></button>`}).join('');
const empty=results.length?'':`<div class="empty-state" style="grid-column:1/-1">${icon('search')}<h3>No hay coincidencias</h3><p>Prueba con otro ingrediente o añade una nueva receta.</p></div>`;
document.getElementById('recipeGrid').innerHTML=cards+empty+`<button class="new-card" data-nav="add"><span class="new-icon">${icon('plus')}</span><strong>Añadir una receta</strong><span>Tu próximo plato favorito está a un clic.</span></button>`;
}
function setSource(mode){state.source=mode;document.querySelectorAll('.source-tab').forEach(b=>b.classList.toggle('active',b.dataset.source===mode));document.querySelectorAll('.source-panel').forEach(p=>p.hidden=p.dataset.panel!==mode)}
const formatQty=n=>{if(n===null||n===undefined||n==='')return '';const value=Number(n);if(!Number.isFinite(value))return '';return Number(value.toFixed(2)).toLocaleString('es-ES',{maximumFractionDigits:2})};
function ingredientText(item,multiplier=1){const val=item.quantity==null?'':formatQty(Number(item.quantity)*multiplier);return `${val}${val?' ':''}${item.unit?item.unit+' ':''}${item.name}`.trim()}
function selectedVariant(r){return state.variant==='original'?r:r.fitness_variants?.[state.variant]?.recipe||r}
function setVariant(key){state.variant=key;const r=getRecipe(state.modalId);if(!r)return;state.servings=selectedVariant(r).servings||2;renderModal()}
function openModal(id){if(!getRecipe(id))return;state.modalId=id;state.variant='original';state.servings=getRecipe(id).servings||2;state.goal='proteina';document.getElementById('modalLayer').hidden=false;document.body.style.overflow='hidden';renderModal()}
function closeModal(){state.modalId=null;document.getElementById('modalLayer').hidden=true;document.body.style.overflow=''}
function renderNutrition(recipe,portions,working){
 const data=RecetaFitNutrition.summarize(recipe.nutrition||{},portions);
 const labels=[['calories','kcal'],['protein','proteínas · g'],['carbs','hidratos · g'],['fat','grasas · g']];
 const grid=values=>`<div class="macro-row">${labels.map(([key,label])=>`<div class="macro"><strong>${values[key]===null?'—':'~'+esc(RecetaFitNutrition.pretty(values[key],key))}</strong><small>${label}</small></div>`).join('')}</div>`;
 return `<section class="nutrition-panel" aria-label="Información nutricional de esta receta"><div class="nutrition-head"><div><h3>Calorías y macronutrientes</h3><p>Estimaciones de la receta, no un registro diario.</p></div><button class="btn outline small" data-action="estimate-nutrition" ${working?'disabled':''}>${working?'<span class="loader"></span> Calculando…':icon('sparkles')+' '+(data.available?'Recalcular con IA':'Estimar con IA')}</button></div><div class="nutrition-section-label">Por ración</div>${grid(data.perServing)}<div class="nutrition-section-label">Receta completa · ${data.servings} raciones</div>${grid(data.whole)}<p class="nutrition-disclaimer">Valores orientativos calculados mediante IA; no sustituyen datos del fabricante ni análisis nutricionales. Las cantidades no conocidas se indican con «—». Al ajustar raciones se mantiene la composición de cada ración.</p></section>`;
}
function renderModal(){const r=getRecipe(state.modalId);if(!r)return;const v=selectedVariant(r);const isFitness=state.variant!=='original';const variants=r.fitness_variants||{};const nutritionHtml=renderNutrition(v,state.servings,state.working);
const sourceLink=(()=>{try{const u=new URL(r.source_url||'');const host=u.hostname.toLowerCase();if(u.protocol==='https:' && /(^|\.)(youtube\.com|youtu\.be|instagram\.com|tiktok\.com)$/.test(host))return `<a href="${esc(u.href)}" target="_blank" rel="noopener noreferrer" class="source-video-link">Ver vídeo original ↗</a>`;}catch{}return '';})();
const versionButtons=`<button data-variant="original" class="variant-btn ${!isFitness?'active':''}">${icon('chef-hat')} Original</button>`+Object.keys(variants).map(goal=>`<button data-variant="${esc(goal)}" class="variant-btn ${state.variant===goal?'active':''}">${icon('sparkles')} ${esc(GOALS[goal]||goal)}</button>`).join('');
const control=`<div class="fitness-panel"><div><label for="fitnessGoal">Tu objetivo fitness</label><select id="fitnessGoal">${Object.entries(GOALS).map(([key,label])=>`<option value="${key}" ${state.goal===key?'selected':''}>${label}</option>`).join('')}</select></div><button class="btn primary" data-action="generate-fitness" ${state.working?'disabled':''}>${state.working?'<span class="loader"></span> Preparando…':icon('sparkles')+' '+(variants[state.goal]?'Regenerar fitness':'Crear versión fitness')}</button></div>`;
const items=v.ingredients.map((item,i)=>`<li><input type="checkbox" id="ing-${i}"><label for="ing-${i}">${esc(ingredientText(item,state.servings/(Number(v.servings)||1)))}${item.note?`<span class="ing-note">${esc(item.note)}</span>`:''}</label></li>`).join('');
const notes=[...(v.notes||[])];const warn=isFitness&&variants[state.variant]?.method==='basic'?'Versión básica sin IA: verifica la coherencia de las sustituciones y de los pasos.':'';

document.getElementById('modalContent').innerHTML=`<div class="modal-header"><button class="close-button" data-close="modal" aria-label="Cerrar">${icon('x')}</button><div class="modal-eyebrow">${isFitness?'VERSIÓN FITNESS · '+esc(GOALS[state.variant]||'PERSONALIZADA'):'MI RECETARIO · VERSIÓN ORIGINAL'}</div><h2 id="detailTitle">${esc(v.title)}</h2><p>${esc(v.description||'Receta guardada en tu colección.')}</p><div class="modal-stat-row"><span class="modal-stat">${icon('clock')} ${duration(v)==null?'Tiempo por confirmar':duration(v)+' minutos'}</span><span class="modal-stat">${icon('users')} ${esc(state.servings)} raciones</span></div></div>
${sourceLink}<div class="variant-box"><div class="variant-buttons">${versionButtons}</div>${control}${isFitness?`<div class="variant-note">${variants[state.variant]?.method==='basic'?'Adaptación básica sin IA':'Adaptación creada con IA'}. Las modificaciones pueden alterar el sabor o la textura.</div>`:''}</div>
${nutritionHtml}
<div class="recipe-cols"><div><h3>Ingredientes</h3><div class="servings-edit"><span>Raciones:</span><button data-servings="-1" aria-label="Reducir raciones">${icon('minus')}</button><strong>${state.servings}</strong><button data-servings="1" aria-label="Aumentar raciones">${icon('plus')}</button></div><ul class="ingredients-list">${items}</ul></div><div><h3>Elaboración paso a paso</h3><ol class="steps-list">${v.steps.map((s,i)=>`<li><span class="step-bullet">${i+1}</span><span>${esc(s)}</span></li>`).join('')}</ol></div></div>
${(v.changes||[]).length?`<div class="change-list"><h3>¿Qué hemos cambiado?</h3><ul>${v.changes.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></div>`:''}
${notes.length||warn?`<div class="note-list">${notes.map(n=>`<div>• ${esc(n)}</div>`).join('')}${warn?`<div>• ${esc(warn)}</div>`:''}</div>`:''}
<div class="modal-actions"><button data-action="add-shopping" class="btn primary">${icon('shopping-bag')} Añadir a la compra</button><button data-action="copy-recipe" class="btn outline">${icon('copy')} Copiar receta</button><button data-action="delete-recipe" class="text-danger">Eliminar receta</button></div>`;
}
function recipeAsText(r){const mult=state.servings/(r.servings||1);return `${r.title}\n${state.servings} raciones\n\nINGREDIENTES\n${r.ingredients.map(i=>'• '+ingredientText(i,mult)).join('\n')}\n\nPREPARACIÓN\n${r.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\n${(r.changes||[]).length?'CAMBIOS FITNESS\n'+r.changes.join('\n'):''}`}
async function copyText(text){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text)}else{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();if(!document.execCommand('copy'))throw Error('no copy');ta.remove()}toast('Copiado al portapapeles.')}catch{toast('No se ha podido copiar. Prueba a exportar tu recetario.',true)}}
async function api(path,options={}){
 if(path==='/api/health')return {ai_enabled:!!state.pin};
 if(path==='/api/fitness'){
  const {recipe,goal}=JSON.parse(options.body);
  if(!state.pin)return {recipe:RecetaFitOffline.fitness(recipe,goal),method:'basic'};
  return {recipe:await RecetaFitGeminiFree.fitness({key:state.pin,recipe,goal}),method:'gemini_free'};
 }
 if(path==='/api/extract'){
  const f=options.body,kind=f.get('kind');
  if(!state.pin){
   if(kind==='text')return {recipe:RecetaFitOffline.parse(f.get('text')),method:'basic_text'};
   throw Error('Para analizar vídeos con IA, activa tu clave gratuita de Google en Ajustes.');
  }
  const value=await RecetaFitGeminiFree.extract({key:state.pin,kind,
   url:f.get('url')||'',text:f.get('text')||'',file:f.get('video') instanceof File ? f.get('video'):null,
   update:s=>{const btn=document.getElementById('extractButton');if(btn)btn.innerHTML='<span class="loader"></span> '+esc(s)}});
  return {recipe:value,method:'gemini_free',source_url:f.get('url')||''};
 }
 if(path==='/api/extract-frames'){
  if(!state.pin)throw Error('La IA gratuita no está configurada.');
  const body=JSON.parse(options.body);
  return {recipe:await RecetaFitGeminiFree.extract({key:state.pin,kind:'video',images:body.images||[],text:body.text||''}),method:'gemini_free'};
 }
 throw Error('Operación desconocida.');
}
function checkHealth(){
 state.ai=!!state.pin;
 document.getElementById('aiDot').classList.toggle('on',state.ai);
 document.getElementById('aiStatus').textContent=state.ai?'Gemini configurado':'IA sin activar';
 document.getElementById('formHint').textContent=state.ai?'Gemini gratuito activado. Las recetas se guardan en este iPhone.':'Para analizar vídeos con IA, configura tu clave GRATIS de Google AI Studio en Ajustes. Sin clave, funciona el modo texto básico.';
 const pinLabel=document.getElementById('pinStatus');if(pinLabel){let persisted=false;try{persisted=!!state.pin&&localStorage.getItem(API_KEY_STORAGE)===state.pin}catch{}pinLabel.textContent=state.pin?(persisted?'Clave guardada en este iPhone. No tendrás que introducirla de nuevo.':'Clave activada, pero aún no guardada permanentemente.'):'Introduce una clave de Google AI Studio gratis, sin facturación';}
}
function videoFrames(file){
 return new Promise(async(resolve,reject)=>{
  const video=document.createElement('video'),blob=URL.createObjectURL(file);
  video.muted=true;video.playsInline=true;video.preload='auto';video.src=blob;
  let disposed=false;
  const cleanup=()=>{if(disposed)return;disposed=true;video.pause();video.removeAttribute('src');video.load();URL.revokeObjectURL(blob)};
  const fail=e=>{cleanup();reject(e instanceof Error?e:new Error('No se pudieron extraer imágenes del vídeo. Utiliza MP4 o MOV.'))};
  const waitFor=(name,ms=16000)=>new Promise((yes,no)=>{const t=setTimeout(()=>{video.removeEventListener(name,done);no(new Error('Tiempo excedido leyendo el vídeo.'))},ms);function done(){clearTimeout(t);yes()};video.addEventListener(name,done,{once:true})});
  try{
   if(video.readyState<1)await waitFor('loadedmetadata');
   if(!Number.isFinite(video.duration)||video.duration<=0||video.duration>600)throw Error('El vídeo debe durar entre 1 segundo y 10 minutos.');
   const canvas=document.createElement('canvas');const maxWidth=560;
   const ratio=Math.min(1,maxWidth/(video.videoWidth||560));canvas.width=Math.max(2,Math.round(video.videoWidth*ratio));canvas.height=Math.max(2,Math.round(video.videoHeight*ratio));
   const context=canvas.getContext('2d',{alpha:false});if(!context)throw Error('No se puede analizar el vídeo en este navegador.');
   const points=[.05,.16,.30,.44,.58,.72,.86,.96];const frames=[];
   for(const fraction of points){
     const target=Math.max(.01,Math.min(video.duration-.01,video.duration*fraction));
     if(Math.abs(video.currentTime-target)>.045){const promise=waitFor('seeked');video.currentTime=target;await promise;}
     context.drawImage(video,0,0,canvas.width,canvas.height);
     const jpeg=canvas.toDataURL('image/jpeg',.60);
     if(jpeg.startsWith('data:image/jpeg;base64,')&&jpeg.length<680000)frames.push(jpeg);
   }
   if(!frames.length)throw Error('No se pudieron obtener fotogramas del vídeo.');
   while(frames.length>1 && frames.reduce((sum,x)=>sum+x.length,0)>3_300_000)frames.pop();
   cleanup();resolve(frames);
  }catch(error){fail(error)}
 });
}
function addRecipe(value,method,source_url=''){if(!value||!value.title||!Array.isArray(value.ingredients)||!Array.isArray(value.steps))throw new Error('La receta extraída está incompleta.');const recipe={...value,id:uid(),created_at:new Date().toISOString(),fitness_variants:{},source_url,extraction_method:method,emoji:'🥗'};state.recipes.unshift(recipe);save();renderHome();nav('home');openModal(recipe.id);toast(method==='basic_text'?'Receta guardada sin IA. Revisa las cantidades.':'Receta analizada y guardada en tu iPhone.');}
async function submitRecipe(event){
 event.preventDefault();if(state.working)return;
 const kind=state.source;
 const form=new FormData();form.append('kind',kind);
 if(kind==='url'){
   form.append('url',document.getElementById('urlInput').value.trim());
   form.append('text',document.getElementById('urlRecipeText').value.trim());
 }else if(kind==='video'){
   const file=document.getElementById('videoInput').files[0];
   if(!file){toast('Selecciona un vídeo o utiliza la pestaña Texto.',true);return}
   form.append('video',file,file.name);
   form.append('text',document.getElementById('videoRecipeText').value.trim());
 }else form.append('text',document.getElementById('textInput').value.trim());
 state.working=true;const btn=document.getElementById('extractButton');btn.disabled=true;btn.innerHTML='<span class="loader"></span> Analizando…';
 try{
   let data;
   const selectedFile=kind==='video'?document.getElementById('videoInput').files[0]:null;
   if(selectedFile&&selectedFile.size>19*1024*1024){
     if(!state.ai)throw Error('Activa tu clave gratuita de Gemini en Ajustes.');
     try{data=await api('/api/extract',{method:'POST',body:form})}
     catch(error){
       if(/429|límite GRATUITO|clave|HTTP 403/i.test(error.message))throw error;
       btn.innerHTML='<span class="loader"></span> Subida no disponible. Leyendo fotogramas…';
       const images=await videoFrames(selectedFile);
       btn.innerHTML='<span class="loader"></span> Analizando imágenes…';
       data=await api('/api/extract-frames',{method:'POST',body:JSON.stringify({images,text:form.get('text')||''})});
     }
   }else data=await api('/api/extract',{method:'POST',body:form});
   addRecipe(data.recipe,data.method,data.source_url||'');
   document.getElementById('addForm').reset();document.getElementById('fileName').textContent='Ningún archivo seleccionado';
 }catch(error){toast(error.message,true)}
 finally{state.working=false;btn.disabled=false;btn.innerHTML=icon('sparkles')+' Analizar y guardar';if(state.modalId)renderModal()}
}
async function estimateNutrition(){
 const root=getRecipe(state.modalId);if(!root||state.working)return;
 if(!state.pin){toast('Activa primero Gemini en Ajustes para estimar las calorías y los macros.',true);return;}
 const id=root.id,variant=state.variant,recipe=selectedVariant(root);
 state.working=true;renderModal();
 try{
  const result=await RecetaFitGeminiFree.estimateNutrition({key:state.pin,recipe});
  const current=getRecipe(id);if(!current)return;
  const target=variant==='original'?current:current.fitness_variants?.[variant]?.recipe;
  if(!target)return;
  target.nutrition=RecetaFitNutrition.normalize(result);
  save();toast('Calorías y macronutrientes estimados y guardados para esta receta.');
 }catch(error){toast(error.message,true)}
 finally{state.working=false;if(state.modalId===id)renderModal();renderHome()}
}
async function generateFitness(){const original=getRecipe(state.modalId);if(!original||state.working)return;const id=original.id,goal=state.goal;state.working=true;renderModal();try{const data=await api('/api/fitness',{method:'POST',body:JSON.stringify({recipe:original,goal})});const same=getRecipe(id);if(!same)return;const variants=same.fitness_variants||{};variants[goal]={recipe:data.recipe,method:data.method};same.fitness_variants=variants;save();state.variant=goal;state.servings=data.recipe.servings||2;toast(data.method==='basic'?'Versión orientativa creada sin IA. Revisa los pasos.':'Versión fitness creada con IA.');}catch(error){toast(error.message,true)}finally{state.working=false;if(state.modalId===id)renderModal();renderHome()}}
function addShopping(){const recipe=getRecipe(state.modalId);if(!recipe)return;const variant=state.variant;state.shop[recipe.id]={variant,servings:state.servings};save();renderShopping();toast('Receta añadida a la lista de compra.');}
function shoppingItems(){const mapped=new Map();for(const [id,info] of Object.entries(state.shop)){const root=getRecipe(id);if(!root)continue;const version=info.variant==='original'?root:root.fitness_variants?.[info.variant]?.recipe;if(!version)continue;const scale=(info.servings||version.servings||2)/(version.servings||2);for(const item of version.ingredients||[]){const key=(item.name||'').trim().toLocaleLowerCase('es')+'|'+(item.unit||'').trim().toLocaleLowerCase('es');if(!key||key==='|')continue;const existing=mapped.get(key);if(existing){if(existing.quantity==null||item.quantity==null)existing.quantity=null;else existing.quantity+=Number(item.quantity)*scale;existing.recipes.add(root.title)}else{mapped.set(key,{name:item.name,unit:item.unit||'',quantity:item.quantity==null?null:Number(item.quantity)*scale,key,recipes:new Set([root.title])})}}}return [...mapped.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'))}
function renderShopping(){totals();const items=shoppingItems();document.getElementById('shoppingCount').textContent=items.length;document.getElementById('shoppingList').innerHTML=items.length?items.map((x,i)=>`<div class="shop-row ${state.checks[x.key]?'checked':''}"><label><input type="checkbox" data-check="${esc(x.key)}" ${state.checks[x.key]?'checked':''}><span class="shop-name">${esc(x.name)}</span><span class="shop-qty">${x.quantity==null?'Al gusto':esc(formatQty(x.quantity)+' '+x.unit)}</span></label></div>`).join(''):`<div class="empty-state">${icon('shopping-bag')}<h3>Tu lista está vacía</h3><p>Añade los ingredientes desde cualquier receta guardada.</p><button class="btn primary" data-nav="home">Ver recetas</button></div>`;
document.getElementById('shoppingRecipes').innerHTML=Object.entries(state.shop).map(([id,info])=>{const r=getRecipe(id);return r?`<div class="included-row"><span>${esc(r.title)}<small style="display:block;color:#a3ac9f;margin-top:3px">${esc(info.variant==='original'?'Original':GOALS[info.variant]||'Fitness')} · ${esc(info.servings)} rac.</small></span><button data-remove-shopping="${esc(id)}" aria-label="Quitar receta">${icon('x')}</button></div>`:''}).join('')||'<p>Sin recetas añadidas.</p>'}
function exportBackup(){const data={app:'RecetaFit',version:1,exported_at:new Date().toISOString(),recipes:state.recipes,shop:state.shop,checks:state.checks};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='RecetaFit-copia-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('Copia descargada correctamente.');}
async function importBackup(file){if(!file)return;try{if(file.size>10*1024*1024)throw Error('La copia supera los 10 MB.');const obj=JSON.parse(await file.text());if(obj.app!=='RecetaFit'||!Array.isArray(obj.recipes))throw Error('Este archivo no es una copia válida de RecetaFit.');if(obj.recipes.length>1000)throw Error('La copia contiene demasiadas recetas.');for(const r of obj.recipes){if(typeof r.id!=='string'||typeof r.title!=='string'||!Array.isArray(r.ingredients)||!Array.isArray(r.steps))throw Error('Hay recetas con formato incorrecto.')}if(!confirm(`Importar ${obj.recipes.length} recetas? Se fusionarán con las existentes sin borrar tus datos.`))return;const ids=new Set(state.recipes.map(r=>r.id));for(const r of obj.recipes){if(!ids.has(r.id)){state.recipes.push(r);ids.add(r.id)}}save();renderHome();toast('Recetas importadas.');nav('home')}catch(error){toast(error.message,true)}}
function init(){document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));if(state.pin){try{localStorage.setItem(API_KEY_STORAGE,state.pin);sessionStorage.removeItem('recetafit_gemini_free_key')}catch{}}save();checkHealth();renderHome();renderShopping();
document.getElementById('recipeSearch').addEventListener('input',e=>{state.search=e.target.value;renderHome()});
document.getElementById('addForm').addEventListener('submit',submitRecipe);
document.getElementById('videoInput').addEventListener('change',e=>{document.getElementById('fileName').textContent=e.target.files[0]?.name||'Ningún archivo seleccionado'});
document.getElementById('exportRecipes').addEventListener('click',exportBackup);
document.getElementById('importFile').addEventListener('change',e=>importBackup(e.target.files?.[0]));
document.getElementById('copyShopping').addEventListener('click',()=>{const items=shoppingItems();if(!items.length){toast('Tu lista está vacía.',true);return}copyText('LISTA DE COMPRA · RECETAFIT\n\n'+items.map(x=>`${state.checks[x.key]?'☑':'☐'} ${x.quantity==null?'':formatQty(x.quantity)+' '+x.unit+' '}${x.name}`).join('\n'))});
document.getElementById('clearShopping').addEventListener('click',()=>{if(!Object.keys(state.shop).length)return;if(confirm('¿Vaciar la lista de la compra?')){state.shop={};state.checks={};save();renderShopping();toast('Lista vaciada.')}});
document.getElementById('howItWorks').addEventListener('click',()=>{nav('add');toast('YouTube público, archivo de vídeo o texto. Configura Gemini gratis en Ajustes.')});
const pinInput=document.getElementById('aiPin');if(pinInput)pinInput.value=state.pin;
const savePinBtn=document.getElementById('savePin');if(savePinBtn)savePinBtn.addEventListener('click',async()=>{
 const key=document.getElementById('aiPin').value.trim();
 savePinBtn.disabled=true;savePinBtn.textContent='Comprobando con Google…';
 try{await RecetaFitGeminiFree.verifyKey(key);
  state.pin=key;let stored=false;try{localStorage.setItem(API_KEY_STORAGE,key);sessionStorage.removeItem('recetafit_gemini_free_key');stored=true}catch{try{sessionStorage.setItem('recetafit_gemini_free_key',key)}catch{}}checkHealth();toast(stored?'Gemini activado. Clave guardada en este iPhone.':'Gemini activado, pero Safari no permite recordar la clave. Comprueba el modo privado.',!stored);
 }catch(error){toast(error.message,true)}
 finally{savePinBtn.disabled=false;savePinBtn.textContent='Comprobar y activar IA'}
});
const forgetPin=document.getElementById('forgetPin');if(forgetPin)forgetPin.addEventListener('click',()=>{
 state.pin='';try{localStorage.removeItem(API_KEY_STORAGE);sessionStorage.removeItem('recetafit_gemini_free_key')}catch{}document.getElementById('aiPin').value='';checkHealth();toast('Clave eliminada de este dispositivo.');
});
document.addEventListener('change',e=>{if(e.target.id==='fitnessGoal')state.goal=e.target.value;if(e.target.hasAttribute('data-check')){state.checks[e.target.dataset.check]=e.target.checked;save();renderShopping()}});
document.addEventListener('click',async e=>{const navTarget=e.target.closest('[data-nav]');if(navTarget){e.preventDefault();nav(navTarget.dataset.nav);return}
const source=e.target.closest('[data-source]');if(source){setSource(source.dataset.source);return}
const open=e.target.closest('[data-open]');if(open){openModal(open.dataset.open);return}
const close=e.target.closest('[data-close]');if(close){closeModal();return}
const variant=e.target.closest('[data-variant]');if(variant){setVariant(variant.dataset.variant);return}
const serve=e.target.closest('[data-servings]');if(serve){state.servings=Math.max(1,Math.min(30,state.servings+Number(serve.dataset.servings)));renderModal();return}
const action=e.target.closest('[data-action]');if(action){if(action.dataset.action==='generate-fitness')await generateFitness();if(action.dataset.action==='estimate-nutrition')await estimateNutrition();if(action.dataset.action==='add-shopping')addShopping();if(action.dataset.action==='copy-recipe'){const r=getRecipe(state.modalId);if(r)copyText(recipeAsText(selectedVariant(r)))}if(action.dataset.action==='delete-recipe'){const r=getRecipe(state.modalId);if(r&&confirm(`¿Eliminar «${r.title}»?`)){state.recipes=state.recipes.filter(x=>x.id!==r.id);delete state.shop[r.id];save();closeModal();renderHome();renderShopping();toast('Receta eliminada.')}}return}
const remove=e.target.closest('[data-remove-shopping]');if(remove){delete state.shop[remove.dataset.removeShopping];save();renderShopping();return}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.modalId)closeModal()});
if('serviceWorker' in navigator&&window.isSecureContext){
 let reloadedAfterUpdate=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloadedAfterUpdate&&navigator.onLine){reloadedAfterUpdate=true;window.location.reload();}});
 window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js?v=3.4.0',{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{}));
}}
init();
})();