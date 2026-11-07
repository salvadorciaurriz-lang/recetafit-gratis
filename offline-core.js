/* Offline parser and conservative fitness substitutions — no network, no inferred nutrition. */
(function (root) {
  'use strict';
  const GOALS = {proteina:'Alta en proteína', ligera:'Menos calorías', equilibrada:'Equilibrada'};
  const EMPTY_NUTRITION = {calories:null,protein:null,carbs:null,fat:null};
  function parse(text) {
    text=String(text||'').trim();
    if(!text||text.length>16000)throw Error('Introduce una receta de hasta 16.000 caracteres.');
    const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const title=(lines[0]||'').replace(/^#+\s*/, '').slice(0,130);
    let mode='', ingredients=[],steps=[];
    for (const line of lines.slice(1)) {
      const label=line.toLocaleLowerCase('es').replace(/^#+\s*/,'').replace(/:\s*$/,'');
      if(/^(ingredientes|ingredients)(\s*\(.*\))?$/.test(label)){mode='ingredients';continue}
      if(/^(preparaci[oó]n|elaboraci[oó]n|pasos|instrucciones|preparation)(\s*\(.*\))?$/.test(label)){mode='steps';continue}
      const content=line.replace(/^(?:[-*•]\s*|\d+[.)]\s*)/,'').trim();
      if(mode==='ingredients') {
        const m=content.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|cucharadas?|cucharaditas?|tazas?|uds?\.?|unidades?|dientes?|rebanadas?)?\s*(?:de\s+)?(.+)$/i);
        if(m)ingredients.push({name:m[3].trim(),quantity:Number(m[1].replace(',','.')),unit:m[2]||'',note:''});
        else ingredients.push({name:content,quantity:null,unit:'',note:''});
      } else if(mode==='steps')steps.push(content);
    }
    if(!title||!ingredients.length||!steps.length)throw Error('Escribe título, «Ingredientes» y «Preparación», con al menos un ingrediente y un paso.');
    if(ingredients.length>80||steps.length>40)throw Error('La receta supera el número máximo de ingredientes o pasos.');
    return {title,description:'Receta guardada a partir de texto.',servings:2,prep_minutes:null,cook_minutes:null,
      ingredients,steps,notes:['Verifica las cantidades y los pasos introducidos.'],changes:[],nutrition:{...EMPTY_NUTRITION}};
  }
  const SWAPS = [
    {re:/\bnata(?:\s+(?:para cocinar|líquida))?\b/gi, to:'queso fresco batido 0 %', why:'Sustituye la nata por queso fresco batido 0 % y añádelo a fuego bajo para que no se corte.'},
    {re:/\bmantequilla\b/gi, to:'aceite de oliva virgen extra', why:'Reduce la cantidad de grasa añadida; aceite y mantequilla no tienen equivalencia directa de cantidad.'},
    {re:/\bmayonesa\b/gi, to:'yogur natural alto en proteína', why:'En salsas frías, utiliza yogur natural alto en proteína en lugar de mayonesa.'},
    {re:/\b(?:azúcar|azucar)(?:\s+blanc[oa])?\b/gi, to:'eritritol apto para cocinar',why:'Ajusta el endulzante y comprueba su comportamiento al horno.'},
    {re:/\b(?:bacon|beicon|panceta)\b/gi,to:'pavo en tiras',why:'El pavo cambia el sabor y el dorado respecto al beicon.'},
    {re:/\bqueso crema\b/gi,to:'queso crema ligero',why:'Utiliza queso crema ligero y ajusta la textura.'},
    {re:/\barroz blanco\b/gi,to:'arroz integral',why:'El arroz integral necesita otros tiempos de cocción.'},
    {re:/\bpasta blanca\b|\bpasta normal\b/gi,to:'pasta integral',why:'Respeta los tiempos de cocción de la pasta integral.'}
  ];
  function fitness(recipe, goal) {
    if(!GOALS[goal])throw Error('Elige un objetivo fitness válido.');
    if(!recipe||!Array.isArray(recipe.ingredients)||!Array.isArray(recipe.steps))throw Error('Receta no válida.');
    const version=JSON.parse(JSON.stringify(recipe));
    version.title=recipe.title+' · '+GOALS[goal];
    version.description='Adaptación orientativa sin IA: comprueba ingredientes, pasos y cantidades.';
    version.changes=[];
    const applied=[];
    for(const ing of version.ingredients){
      for(const swap of SWAPS){
        swap.re.lastIndex=0;
        if(swap.re.test(ing.name)){
          swap.re.lastIndex=0;
          ing.name=ing.name.replace(swap.re,swap.to);
          ing.quantity=null;ing.unit='';ing.note='Cantidad a ajustar al preparar la receta';
          version.changes.push(swap.why);applied.push(swap);break;
        }
      }
    }
    version.steps=version.steps.map(step=>{
      for(const swap of applied){swap.re.lastIndex=0;step=step.replace(swap.re,swap.to)}
      return step;
    });
    const extra={
      proteina:'Valora añadir o aumentar una fuente de proteína magra (pollo, pescado, huevos, tofu o legumbres) según la receta.',
      ligera:'Controla las grasas añadidas y prioriza plancha, horno o freidora de aire cuando se adapte a la preparación.',
      equilibrada:'Acompaña el plato con verduras y ajusta las raciones a tu actividad y apetito.'
    };
    version.changes.push(extra[goal]);
    version.notes=['Versión orientativa sin IA ni cálculo de macronutrientes.', 'Las sustituciones pueden requerir cambios de textura, tiempo y cantidad.'];
    version.nutrition={...EMPTY_NUTRITION};
    return version;
  }
  root.RecetaFitOffline={parse,fitness};
})(typeof globalThis!=='undefined'?globalThis:this);