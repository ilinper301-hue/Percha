/* Percha · app.js — Acciones, eventos y arranque. */
import {$,SLOTS,diffDays,favKey,keyOutfit,outfitIds,pairKey,pickOutfit,todayISO,uid} from './datos.js';
import {S,applyImport,cleanBackup,clearStore,db,del,dropURLs,ensureThumbs,exportData,get,getAll,idbOpen,migrateOutfits,put,readBackup,saveFavs,saveKV,savePairs,savePlan,saveRules,saveSettings,seedDemo,setDb} from './almacen.js';
import {combos,compatible,computeStats,generate,lastOf,weekDates} from './motor.js';
import {D,applyTheme,armBar,armBody,armList,closeSheet,compatSheet,daySheet,detailSheet,drawEdit,editSheet,favSheet,guideSheet,layerSheet,loadPhoto,pickerSheet,processPhoto,refreshSheet,render,saveItem,setD,settingsSheet,syncColor,toast,updatePreview} from './vistas.js';

export let pendingImport=null,deferredInstall=null,confirmWipe=false;
window.addEventListener('beforeinstallprompt',e=>{deferredInstall=e});window.addEventListener('appinstalled',()=>{deferredInstall=null;toast('Percha instalada')});
/* ---------- actions ---------- */
const armListNow=()=>armList();
export function resetFlow(keepTarget){const t=keepTarget?S.flow.target:null;S.flow={active:false,step:0,top:null,bottom:null,shoes:null,layers:[],acc:null,target:t}}
const layersOfFlow=()=>Array.isArray(S.flow.layers)?S.flow.layers:[];
export function scrollTop(){const v=$('#view');if(v)v.scrollTop=0}
export async function addPair(a,b){S.pairs.add(pairKey(a,b));await savePairs()}
export async function recordWear(o,date){
  const prev=S.wears.find(w=>w.date===date);
  const w={id:prev?prev.id:uid(),date,...pickOutfit(o)};
  if(prev)S.wears[S.wears.indexOf(prev)]=w;else S.wears.push(w);
  await put('wears',w);computeStats();return !!prev;
}
/* quita de los favoritos las prendas borradas; si falta una principal, el favorito se elimina */
function dropFavs(ids){
  S.favs=S.favs.map(f=>({id:f.id,...pickOutfit(f,id=>!ids.has(id))})).filter(f=>f.top&&f.bottom&&f.shoes);saveFavs();
}
export async function deleteItem(id){
  S.items=S.items.filter(i=>i.id!==id);await del('items',id);
  for(const k of [...S.pairs]){const [a,b]=k.split('|');if(a===id||b===id)S.pairs.delete(k)}
  for(const k of [...S.blocks]){const [a,b]=k.split('|');if(a===id||b===id)S.blocks.delete(k)}savePairs();
  for(const [d,p] of Object.entries(S.plan))if(outfitIds(p).includes(id))S.plan[d]={style:p.style};savePlan();dropFavs(new Set([id]));
  dropURLs(id);
  S.flow.layers=layersOfFlow().filter(x=>x!==id);
  for(const k of SLOTS)if(S.flow[k]===id)resetFlow(true);
  computeStats();
}
export const A={
  tab:d=>{S.view=d.v;if($('.scrim'))closeSheet();render();scrollTop()},
  closeSheet:()=>closeSheet(),
  settings:()=>{pendingImport=null;confirmWipe=false;settingsSheet()},
  clearDemo:async()=>{
    const ids=new Set(S.items.filter(i=>i.demo).map(i=>i.id));
    for(const id of ids)await del('items',id);
    S.items=S.items.filter(i=>!ids.has(i.id));
    for(const k of [...S.pairs]){const [a,b]=k.split('|');if(ids.has(a)||ids.has(b))S.pairs.delete(k)}
    for(const k of [...S.blocks]){const [a,b]=k.split('|');if(ids.has(a)||ids.has(b))S.blocks.delete(k)}savePairs();
    for(const w of S.wears.filter(w=>outfitIds(w).some(id=>ids.has(id))))await del('wears',w.id);
    S.wears=S.wears.filter(w=>!outfitIds(w).some(id=>ids.has(id)));
    S.plan={};savePlan();dropFavs(ids);resetFlow();computeStats();
    if($('.scrim'))closeSheet();S.view='armario';S.armCat='top';render();toast('Listo. Añade tu primera prenda con el botón +');
  },
  favToggle:d=>{
    const o=keyOutfit(d.k);const key=favKey(o);
    const ex=S.favs.find(f=>favKey(f)===key);
    if(ex){S.favs=S.favs.filter(f=>f!==ex);toast('Quitado de favoritos',{label:'Deshacer',fn:()=>{S.favs.push(ex);saveFavs();render();if($('.scrim'))refreshSheet()}})}
    else{S.favs.push({id:uid(),...o});toast('Guardado en favoritos')}
    saveFavs();render();if($('.scrim'))refreshSheet();
  },
  favSheet:()=>favSheet(),
  favWear:async d=>{const f=S.favs.find(x=>x.id===d.id);if(!f)return;const o=pickOutfit(f,id=>!!get(id));const t=todayISO();const was=await recordWear(o,t);if(S.plan[t])S.plan[t]={...S.plan[t],...o};savePlan();resetFlow();closeSheet();S.view='hoy';render();scrollTop();toast(was?'Outfit de hoy actualizado':'Registrado. Buen día.')},
  favPlan:d=>{const f=S.favs.find(x=>x.id===d.id);if(!f||!d.date)return;const o=pickOutfit(f,id=>!!get(id));const t=todayISO();
    if(d.date===t){return A.favWear(d)}
    S.plan[d.date]={...o,style:(S.plan[d.date]||{}).style||'',locked:true};savePlan();closeSheet();S.view='semana';render();toast('Guardado y bloqueado en el plan')},
  // flow
  flowStart:()=>{resetFlow();S.flow.active=true;render();scrollTop()},
  flowReset:()=>{resetFlow(true);S.flow.active=true;render();scrollTop()},
  cancelTarget:()=>{resetFlow();S.view='semana';render()},
  goStep:d=>{const n=+d.step,ks=['top','bottom','shoes'];S.flow.seed=null;for(let i=n;i<3;i++)S.flow[ks[i]]=null;if(n===0)S.flow.layers=[];S.flow.step=n;S.flow.active=true;render()},
  outfitWith:d=>{const it=get(d.id);if(!it)return;const order=['top','bottom','shoes'];resetFlow();const f=S.flow;f.active=true;f[it.cat]=it.id;f.seed=it.id;let n=0;while(n<3&&f[order[n]])n++;f.step=n;if($('.scrim'))closeSheet();S.view='hoy';render();scrollTop()},
  pick:d=>{const it=get(d.id),f=S.flow;f.active=true;f[it.cat]=it.id;const order=['top','bottom','shoes'];const i=order.indexOf(it.cat);const sd=get(f.seed);for(let j=i+1;j<3;j++)f[order[j]]=sd&&sd.cat===order[j]?sd.id:null;if(it.cat==='top')f.layers=layersOfFlow().filter(id=>{const l=get(id);return l&&l.id!==it.id&&(l.cat!=='outer'||compatible(l,it))});let n=i+1;while(n<3&&f[order[n]])n++;f.step=n;render();scrollTop()},
  pickNew:async d=>{const it=get(d.id),order=['top','bottom','shoes'],i=order.indexOf(it.cat),base=get(S.flow[order[i-1]]);if(base){S.blocks.delete(pairKey(it.id,base.id));await addPair(it.id,base.id);const k=pairKey(it.id,base.id);toast('Guardado: combina con '+base.name,{label:'Deshacer',fn:()=>{S.pairs.delete(k);savePairs();render()}})}A.pick(d)},
  surprise:()=>{
    const cs=combos();if(!cs.length)return toast('Aún no hay combinaciones completas');
    const fresh=it=>{const l=lastOf(it.id);return l?Math.min(diffDays(todayISO(),l),60):60};
    let best=null,bs=-1;for(const c of cs){const sc=c.reduce((s,it)=>s+fresh(it),0)+Math.random()*40;if(sc>bs){bs=sc;best=c}}
    Object.assign(S.flow,{active:true,top:best[0].id,bottom:best[1].id,shoes:best[2].id,step:3,layers:[],acc:null});render();scrollTop();
  },
  pickerExtra:d=>d.cat==='layer'?layerSheet():pickerSheet(d.cat),
  /* capas: de dentro a fuera; una parte de arriba nueva entra por debajo de los abrigos */
  addLayer:d=>{const it=get(d.id);if(!it)return;const L=layersOfFlow().filter(x=>x!==it.id);let i=L.length;if(it.cat!=='outer'){const j=L.findIndex(x=>get(x)?.cat==='outer');if(j>=0)i=j}L.splice(i,0,it.id);S.flow.layers=L;closeSheet()},
  delLayer:d=>{S.flow.layers=layersOfFlow().filter(x=>x!==d.id);render()},
  pickExtra:d=>{const it=get(d.id);const cat=it?it.cat:d.cat;S.flow[cat]=it?it.id:null;closeSheet()},
  confirmOutfit:async()=>{
    const f=S.flow,t=todayISO(),target=f.target||t,o=pickOutfit(f);
    if(target===t){const was=await recordWear(o,t);if(S.plan[t])S.plan[t]={...S.plan[t],...o};savePlan();resetFlow();S.view='hoy';render();scrollTop();toast(was?'Outfit de hoy actualizado':'Registrado. Buen día.')}
    else{S.plan[target]={...o,style:(S.plan[target]||{}).style||'',locked:true};savePlan();resetFlow();S.view='semana';render();toast('Guardado y bloqueado en el plan')}
  },
  undoToday:async()=>{const w=S.wears.find(x=>x.date===todayISO());if(!w)return;S.wears=S.wears.filter(x=>x!==w);await del('wears',w.id);computeStats();render();toast('Registro de hoy borrado',{label:'Deshacer',fn:async()=>{S.wears.push(w);await put('wears',w);computeStats();render()}})},
  wearPlan:async d=>{const p=S.plan[d.date];if(!p)return;await recordWear(p,d.date);if($('.scrim'))closeSheet();S.view='hoy';resetFlow();render();toast('Registrado. Buen día.')},
  // armario
  addItem:d=>editSheet(null,d.cat),
  armCat:d=>{S.armCat=d.v;S.armSel=S.armSel?new Set():null;S.armDel=false;render()},
  armFilt:()=>{S.armFilt=!S.armFilt;render()},
  armColor:d=>{S.armColor=S.armColor===d.v?'':d.v;render()},
  armStyle:d=>{S.armStyle=S.armStyle===d.v?'':d.v;render()},
  armClear:()=>{S.armQ='';S.armColor='';S.armStyle='';render()},
  armSelStart:()=>{S.armSel=new Set();S.armDel=false;render()},
  armSelEnd:()=>{S.armSel=null;S.armDel=false;render()},
  armPick:d=>{if(!S.armSel)return;S.armSel.has(d.id)?S.armSel.delete(d.id):S.armSel.add(d.id);render()},
  armAllVisible:()=>{for(const i of armListNow())S.armSel.add(i.id);render()},
  armLaundrySel:async()=>{const its=[...S.armSel].map(get).filter(Boolean);const to=!its.every(i=>i.laundry);for(const it of its){it.laundry=to;await put('items',it)}S.armSel=null;render();toast(to?'Al cesto':'Marcadas como limpias')},
  armDelAsk:()=>{S.armDel=true;render()},
  armDelNo:()=>{S.armDel=false;render()},
  armDelDo:async()=>{const ids=[...S.armSel];for(const id of ids)await deleteItem(id);S.armSel=null;S.armDel=false;render();toast(ids.length===1?'Prenda eliminada':ids.length+' prendas eliminadas')},
  armLaundry:()=>{S.armLaundry=!S.armLaundry;render()},
  allClean:async()=>{for(const it of S.items.filter(i=>i.laundry)){it.laundry=false;await put('items',it)}S.armLaundry=false;render();toast('Todo limpio')},
  detail:d=>detailSheet(d.id),
  editItem:d=>editSheet(d.id),
  cancelEdit:()=>{const id=D&&!D.isNew?D.id:null;setD(null);id?detailSheet(id):closeSheet()},
  saveItem:()=>saveItem(),
  seg:(d,el)=>{const g=el.closest('[data-field]'),field=g.dataset.field,multi=g.dataset.multi==='1';if(multi){const arr=D[field],i=arr.indexOf(d.v);if(i>=0)arr.splice(i,1);else arr.push(d.v);el.classList.toggle('on')}else{D[field]=d.v;g.querySelectorAll('.pill').forEach(p=>p.classList.toggle('on',p===el))}if(field==='cat')updatePreview()},
  color:(d,el)=>{D.color=D.color===d.v?'':d.v;D.colorAuto=false;syncColor();updatePreview()},
  wildToggle:(d,el)=>{D.wild=!D.wild;el.setAttribute('aria-checked',D.wild)},
  bgToggle:async()=>{D.removeBg=!D.removeBg;const b=$('#photo-box');b.classList.add('busy');await new Promise(r=>setTimeout(r,30));await processPhoto();drawEdit()},
  toggleLaundry:async d=>{const it=get(d.id);it.laundry=!it.laundry;await put('items',it);detailSheet(d.id);toast(it.laundry?'Al cesto. No aparecerá al elegir outfit.':'Lista para ponérsela')},
  askDelete:d=>{$('#del-zone').innerHTML=`<div class="confirm"><p>Se borra la prenda y sus combinaciones. Los outfits del historial se conservan.</p><div class="row"><button class="btn small danger" style="background:var(--surface)" data-act="doDelete" data-id="${d.id}">Eliminar</button><button class="btn small ghost" data-act="detail" data-id="${d.id}">Cancelar</button></div></div>`},
  doDelete:async d=>{await deleteItem(d.id);closeSheet();toast('Prenda eliminada')},
  compat:d=>compatSheet(d.id),
  // ciclo: sugerida/nada → confirmada → descartada → sugerida/nada
  pairToggle:async d=>{const k=pairKey(d.base,d.id);if(S.pairs.has(k)){S.pairs.delete(k);S.blocks.add(k)}else if(S.blocks.has(k))S.blocks.delete(k);else S.pairs.add(k);await savePairs();refreshSheet()},
  pairAll:async d=>{const a=get(d.id);for(const o of S.items.filter(i=>i.cat===d.cat)){const k=pairKey(a.id,o.id);if(d.on==='1'){S.pairs.add(k);S.blocks.delete(k)}else{S.pairs.delete(k);S.blocks.add(k)}}await savePairs();refreshSheet()},
  // semana
  week:d=>{S.week+=+d.d;render()},
  genWeek:()=>{const ds=weekDates(),t=todayISO();for(const d of ds){const p=S.plan[d];if(d>=t&&p&&!p.locked)S.plan[d]={style:p.style||''}}const fails=generate(ds);render();toast(fails?`${fails} ${fails===1?'día':'días'} sin combinaciones posibles. Marca más combinaciones o cambia el estilo.`:'Semana generada')},
  daySheet:d=>daySheet(d.date),
  dayStyle:d=>{S.plan[d.date]={...(S.plan[d.date]||{}),style:d.v};const p=S.plan[d.date];if(p.top&&!p.locked&&d.v){const ok=['top','bottom','shoes'].every(k=>(get(p[k])?.styles||[]).includes(d.v));if(!ok)generate([d.date])}savePlan();refreshSheet()},
  dayLock:d=>{const p=S.plan[d.date];if(!p)return;p.locked=!p.locked;savePlan();refreshSheet()},
  dayRegen:d=>{const p=S.plan[d.date]||{};const was=p.locked;S.plan[d.date]={style:p.style||''};const f=generate([d.date]);if(was&&S.plan[d.date].top)S.plan[d.date].locked=true;savePlan();refreshSheet();if(f)toast('No hay combinaciones para este estilo')},
  dayManual:d=>{resetFlow();S.flow.target=d.date;S.flow.active=true;S.view='hoy';closeSheet();scrollTop()},
  dayClear:d=>{const p=S.plan[d.date];S.plan[d.date]={style:p?.style||''};savePlan();closeSheet()},
  // datos
  dataCat:d=>{S.dataCat=d.v;render()},
  delWear:async d=>{const w=S.wears.find(x=>x.id===d.id);if(!w)return;S.wears=S.wears.filter(x=>x!==w);await del('wears',w.id);computeStats();render();toast('Registro borrado',{label:'Deshacer',fn:async()=>{S.wears.push(w);await put('wears',w);computeStats();render()}})},
  // settings
  install:async()=>{if(!deferredInstall)return;deferredInstall.prompt();try{await deferredInstall.userChoice}catch(e){}deferredInstall=null;refreshSheet()},
  setSeason:d=>{S.settings.season=d.v;saveSettings();refreshSheet()},
  suggestToggle:()=>{S.settings.suggest=S.settings.suggest===false;saveSettings();refreshSheet()},
  setSuggestLevel:d=>{S.settings.suggestLevel=d.v;saveSettings();refreshSheet()},
  colorGuide:()=>guideSheet(),
  setTheme:d=>{S.settings.theme=d.v;applyTheme(d.v);saveSettings();refreshSheet()},
  stepSet:d=>{const k=d.k,lim=k==='noRepeat'?[1,7]:[7,120];S.settings[k]=Math.max(lim[0],Math.min(lim[1],S.settings[k]+ +d.d));saveSettings();refreshSheet()},
  addRule:()=>{const a=$('#rule-a').value,b=$('#rule-b').value;if(a===b)return toast('Elige dos colores distintos');if(S.rules.some(r=>(r[0]===a&&r[1]===b)||(r[0]===b&&r[1]===a)))return toast('Esa regla ya existe');S.rules.push([a,b]);saveRules();refreshSheet();toast('Regla añadida')},
  delRule:d=>{S.rules.splice(+d.i,1);saveRules();refreshSheet()},
  shareBackup:()=>exportData(true).catch(e=>{console.warn(e);toast('No se pudo compartir la copia')}),
  export:()=>exportData().catch(e=>{console.warn(e);toast('No se pudo exportar la copia')}),
  importPick:()=>$('#imp-file').click(),
  importDo:async()=>{const data=pendingImport;pendingImport=null;try{await applyImport(data);closeSheet();toast('Copia restaurada')}catch(e){console.warn(e);toast('No se pudo restaurar la copia')}},
  importCancel:()=>{pendingImport=null;refreshSheet()},
  wipeAsk:()=>{confirmWipe=true;refreshSheet()},
  wipeCancel:()=>{confirmWipe=false;refreshSheet()},
  wipeDo:async()=>{for(const s of['items','wears'])await clearStore(s);await clearStore('kv');await saveKV('seeded',true);Object.assign(S.settings,{season:'auto',noRepeat:3,forgotten:21,lastExport:null,suggest:true,suggestLevel:'wide'});saveSettings();/* el tema se conserva a propósito */S.items=[];S.pairs=new Set();S.blocks=new Set();S.rules=[];S.wears=[];S.plan={};S.favs=[];resetFlow();computeStats();confirmWipe=false;closeSheet();toast('Datos borrados')}
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;const f=A[el.dataset.act];if(f)f(el.dataset,el,e)});
document.addEventListener('toggle',e=>{if(e.target.id==='f-more'&&D)D.more=e.target.open},true);
document.addEventListener('input',e=>{const k=e.target.dataset&&e.target.dataset.input;if(k==='armQ'){S.armQ=e.target.value;const b=$('#arm-body');if(b)b.innerHTML=armBody();return}if(!k||!D)return;if(k==='tol'){D.tol=+e.target.value;clearTimeout(D._t);D._t=setTimeout(processPhoto,140)}else D[k]=e.target.value});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='f-photo'){const fs=[...(t.files||[])];t.value='';if(!fs.length||!D)return;if(D.isNew&&fs.length>1&&!D.qTotal){D.queue=fs.slice(1);D.qTotal=fs.length;D.qIndex=1;D.qDone=0}loadPhoto(fs[0]);return}
  if(t.id==='imp-file'){const f=t.files&&t.files[0];t.value='';if(!f)return;try{const d=await readBackup(f);cleanBackup(d);pendingImport=d;refreshSheet()}catch(err){console.warn(err);toast('Ese archivo no es una copia de Percha')}return}
  if(t.dataset.change==='armSort'){S.armSort=t.value;render()}
  if(t.dataset.change==='favPlan'){A.favPlan({id:t.dataset.id,date:t.value});return}
  if(t.dataset.change==='dataSort'){S.dataSort=t.value;render()}
});

/* ---------- boot ---------- */
export async function boot(){
  try{setDb(await idbOpen())}catch(e){setDb(null);S.noStore=true}
  let seeded=false;
  if(db){
    S.items=(await getAll('items'))||[];S.wears=(await getAll('wears'))||[];
    const kv=Object.fromEntries(((await getAll('kv'))||[]).map(r=>[r.id,r.v]));
    S.pairs=new Set(kv.pairs||[]);S.blocks=new Set(kv.blocks||[]);S.rules=kv.rules||[];S.plan=kv.plan||{};S.favs=kv.favs||[];Object.assign(S.settings,kv.settings||{});seeded=!!kv.seeded;
    await migrateOutfits();
  }
  if(!seeded)await seedDemo();
  applyTheme(S.settings.theme||'auto');
  computeStats();render();
  ensureThumbs();
  if(S.noStore)toast('Este navegador no permite guardar datos. Lo que hagas se perderá al cerrar.');
}
boot();
let lastDay=todayISO();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible')return;const t=todayISO();if(t===lastDay)return;lastDay=t;computeStats();if(!$('.scrim'))render()});
if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('sw.js').then(reg=>{
  const ask=w=>{if(w&&navigator.serviceWorker.controller)toast('Hay una versión nueva',{label:'Recargar',sticky:true,fn:()=>w.postMessage('SKIP_WAITING')})};
  ask(reg.waiting);
  reg.addEventListener('updatefound',()=>{const w=reg.installing;if(w)w.addEventListener('statechange',()=>{if(w.state==='installed')ask(w)})});
  let rel=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(rel)return;rel=true;location.reload()});
}).catch(()=>{})}
