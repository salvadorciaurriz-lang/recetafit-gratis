/* RecetaFit - pure nutrition helpers. Values supplied by Gemini are estimates per serving. */
(function(root){
'use strict';
const KEYS=['calories','protein','carbs','fat'];
function valid(v){
 if(v===null||v===undefined||v==='')return null;
 const n=Number(v);
 return Number.isFinite(n)&&n>=0&&n<=100000?n:null;
}
function normalize(nutrition){
 const obj=nutrition&&typeof nutrition==='object'?nutrition:{};
 return Object.fromEntries(KEYS.map(k=>[k,valid(obj[k])]));
}
function summarize(nutrition,servings){
 const base=normalize(nutrition);
 const portions=Number.isFinite(Number(servings))?Math.max(1,Math.min(30,Math.trunc(Number(servings)))):1;
 return {perServing:base,whole:Object.fromEntries(KEYS.map(k=>[k,base[k]===null?null:base[k]*portions])),servings:portions,available:KEYS.some(k=>base[k]!==null),complete:KEYS.every(k=>base[k]!==null)};
}
function pretty(value,key){
 const n=valid(value);
 if(n===null)return '—';
 const digits=key==='calories'?0:1;
 return n.toLocaleString('es-ES',{maximumFractionDigits:digits});
}
root.RecetaFitNutrition={normalize,summarize,pretty,KEYS};
})(typeof globalThis!=='undefined'?globalThis:this);
