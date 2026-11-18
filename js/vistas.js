/* Percha · vistas.js — Tema, toast, hojas y pantallas (Hoy, Armario, Semana, Datos, fichas, ajustes). */
import {$,BS,CATS,addDays,favKey,layersOf,outfitIds,CAT_ORDER,COLORS,DOW,DOWS,MON,MONS,SEASONS,STYLES,TB,ago,agoShort,cap,defaultKind,diffDays,esc,euro,fmtLong,fmtShort,garmentSVG,ic,pairKey,parseD,related,svgBlob,svgDataURL,swatchBg,todayISO,uid} from './datos.js';
import {CAN_SHARE,IMG_MAX,S,THUMB_MAX,blobToCanvas,del,dropURLs,encodeCanvas,get,imgTag,mini,put,savePairs,saveWishes,scaleCanvas,urlFor} from './almacen.js';
import {available,byFresh,combos,compatReason,compatible,computeStats,currentSeason,forgottenList,hasDemo,lastOf,outfitOK,suggestScore,usesOf,weekDates,wishFit} from './motor.js';
import {confirmWipe,deferredInstall,pendingImport} from './app.js';

/* ---------- theme ---------- */
export const ROOT_THEME0=document.documentElement.getAttribute('data-theme');
export const META_THEME=[...document.querySelectorAll('meta[name="theme-color"]')].map(m=>[m,m.getAttribute('content')]);
export function applyTheme(t){
  const r=document.documentElement;
  if(t==='light'||t==='dark'){r.setAttribute('data-theme',t);META_THEME.forEach(([m])=>m.setAttribute('content',t==='dark'?'#262624':'#FAF9F5'))}
  else{if(ROOT_THEME0)r.setAttribute('data-theme',ROOT_THEME0);else r.removeAttribute('data-theme');META_THEME.forEach(([m,c])=>m.setAttribute('content',c))}
  try{localStorage.setItem('percha-theme',t)}catch(e){}
}
try{const t0=localStorage.getItem('percha-theme');if(t0)applyTheme(t0)}catch(e){}

/* ---------- toast ---------- */
export let toastT;
export function toast(msg,action){const el=$('#toast');el.innerHTML=`<span>${esc(msg)}</span>${action?`<button type="button" id="toast-act">${esc(action.label)}</button>`:''}`;el.classList.add('show');if(action)$('#toast-act').onclick=()=>{action.fn();el.classList.remove('show')};clearTimeout(toastT);if(!(action&&action.sticky))toastT=setTimeout(()=>el.classList.remove('show'),action?5200:2600)}

/* ---------- sheets ---------- */
export let sheetPushed=false,ignorePop=false,sheetRefresh=null;
export function openSheet(html,{tall=false,refresh=null}={}){
  sheetRefresh=refresh;
  let scrim=$('.scrim');
  if(scrim){const sh=scrim.querySelector('.sheet');sh.className='sheet'+(tall?' tall':'');sh.innerHTML='<div class="grab"></div>'+html;return sh}
  scrim=document.createElement('div');scrim.className='scrim';
  scrim.innerHTML=`<div class="sheet${tall?' tall':''}" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  scrim.addEventListener('click',e=>{if(e.target===scrim)closeSheet()});
  let drag=null;
  scrim.addEventListener('pointerdown',e=>{const sh=scrim.querySelector('.sheet');if(!e.target.closest('.grab,.sh-head')||e.target.closest('button,a,input,select'))return;drag={y:e.clientY,dy:0,t:e.timeStamp,id:e.pointerId};sh.style.transition='none';try{sh.setPointerCapture(e.pointerId)}catch(_){}});
  scrim.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;drag.dy=Math.max(0,e.clientY-drag.y);scrim.querySelector('.sheet').style.transform=`translateY(${drag.dy}px)`});
  const endDrag=e=>{if(!drag||e.pointerId!==drag.id)return;const sh=scrim.querySelector('.sheet'),{dy,t}=drag;drag=null;sh.style.transition='';const fast=dy>40&&dy/Math.max(1,e.timeStamp-t)>0.5;if(e.type!=='pointercancel'&&(dy>110||fast)){sh.style.transform='translateY(100%)';closeSheet()}else sh.style.transform=''};
  scrim.addEventListener('pointerup',endDrag);scrim.addEventListener('pointercancel',endDrag);
  document.body.appendChild(scrim);requestAnimationFrame(()=>scrim.classList.add('open'));
  if(!sheetPushed){try{history.pushState({sheet:1},'');sheetPushed=true}catch(e){}}
  return scrim.querySelector('.sheet');
}
export function closeSheet(fromPop){const scrim=$('.scrim');sheetRefresh=null;D=null;W=null;if(scrim){scrim.classList.remove('open');setTimeout(()=>scrim.remove(),200)}if(sheetPushed&&!fromPop){sheetPushed=false;ignorePop=true;try{history.back()}catch(e){ignorePop=false}}else sheetPushed=false;render()}
window.addEventListener('popstate',()=>{if(ignorePop){ignorePop=false;return}if($('.scrim')){sheetPushed=false;closeSheet(true)}});
export const sheetHead=(title,left,right)=>`<div class="sh-head gut">${left||'<button class="link" data-act="closeSheet">Cerrar</button>'}<h2>${esc(title)}</h2>${right||'<span></span>'}</div>`;
export function refreshSheet(){if(sheetRefresh){const sh=$('.sheet');const body=sh&&sh.querySelector('.sh-body');const top=body?body.scrollTop:0;sheetRefresh();const nb=$('.sheet .sh-body');if(nb)nb.scrollTop=top}}

/* ---------- render ---------- */
export const TABS=[['hoy','Hoy','hanger'],['armario','Armario','closet'],['semana','Semana','cal'],['datos','Datos','bars']];
export function render(){
  $('#tabs').innerHTML=TABS.map(([k,l,i])=>`<button class="tab${S.view===k?' on':''}" data-act="tab" data-v="${k}" aria-current="${S.view===k?'page':'false'}">${ic(i,24,S.view===k?1.9:1.6)}<span>${l}</span></button>`).join('');
  const v=$('#view');
  v.innerHTML=({hoy:viewHoy,armario:viewArmario,semana:viewSemana,datos:viewDatos})[S.view]();
  const fab=$('#fab');fab.hidden=S.view!=='armario';fab.innerHTML=ic('plus',26,1.8);
}
export function demoBanner(){if(!hasDemo())return '';return `<div class="banner"><p>Estás viendo un armario de ejemplo.</p><button class="btn small primary" data-act="clearDemo">Empezar con el mío</button></div>`}

/* ----- HOY ----- */
export function viewHoy(){
  const f=S.flow,t=todayISO(),target=f.target||t;
  const worn=S.wears.find(w=>w.date===t),plan=S.plan[t];
  let h=demoBanner()+(S.favs.length?`<div class="row" style="justify-content:flex-end;margin-top:6px"><button class="link" data-act="favSheet">${ic('heart',16,1.8)} Favoritos (${S.favs.length})</button></div>`:'');
  if(!f.active&&!f.target){
    if(worn){
      return h+`<p class="eyebrow">${fmtLong(t)}</p><h1 class="h1">Hoy llevas</h1>${outfitCard(worn)}
      <div class="actions"><button class="btn block" data-act="flowStart">Cambiar el outfit de hoy</button><button class="btn ghost block" data-act="undoToday">Borrar el registro de hoy</button></div>`;
    }
    if(plan&&plan.top&&get(plan.top)){
      return h+`<p class="eyebrow">${fmtLong(t)}</p><h1 class="h1">Tu plan para hoy</h1>${outfitCard(plan)}
      <div class="actions"><button class="btn primary block" data-act="wearPlan" data-date="${t}">Me lo pongo hoy</button><button class="btn block" data-act="flowStart">Elegir otra cosa</button></div>`;
    }
  }
  return h+flowHTML(target);
}
export function flowHTML(target){
  const f=S.flow,step=f.step,t=todayISO(),isToday=target===t;
  const d=parseD(target);
  let h=`<p class="eyebrow">${fmtLong(target)}${f.target?` · <button class="link" style="font-size:13px;padding:0 6px;margin:-14px 0" data-act="cancelTarget">Cancelar</button>`:''}</p>`;
  h+=`<h1 class="h1">${isToday?'¿Qué te pones hoy?':'Outfit para el '+DOW[d.getDay()]+' '+d.getDate()}</h1>`;
  h+=`<div class="prog" aria-label="Paso ${Math.min(step+1,3)} de 3">${[0,1,2].map(i=>`<i class="${i<step?'done':i===step?'cur':''}"></i>`).join('')}</div>`;
  const ks=['top','bottom','shoes'];
  const chips=ks.map((k,i)=>{const it=get(f[k]);if(!it||i>=step)return '';return `<button class="chip-it" data-act="goStep" data-step="${i}">${mini(it)}<span>${esc(it.name)}</span></button>`}).join('');
  if(chips)h+=`<div class="chosen">${chips}</div>`;
  if(step>=3)return h+summaryHTML(target,isToday);
  const cat=ks[step],base=step?get(f[ks[step-1]]):get(f.seed);
  const all=S.items.filter(i=>i.cat===cat),pool=all.filter(available),hidden=all.length-pool.length;
  const fits=i=>{if(!base)return true;const r=compatReason(i,base);if(!r)return false;if(r==='suggest'&&cat==='shoes'){const tp=get(f.top);if(tp&&!outfitOK(tp,base,i))return false}return true};
  const rank=i=>{const r=base?compatReason(i,base):null;return r==='pair'?0:r==='suggest'&&suggestScore(i,base)===3?1:2};
  const good=pool.filter(fits).sort((a,b)=>rank(a)-rank(b)||byFresh(a,b));
  const other=base?pool.filter(i=>!fits(i)).sort(byFresh):[];
  const titles=['Parte de arriba','Parte de abajo','Calzado'];
  h+=`<div class="stephead"><div><h2 class="h2">${titles[step]}</h2><p class="sub">${base?'Combinan con '+esc(base.name):'Primero lo que hace más que no te pones'}</p></div>${step===0&&combos().length?`<button class="btn small" data-act="surprise">${ic('shuffle',16,1.8)}Sorpréndeme</button>`:''}</div>`;
  if(!all.length){
    h+=`<div class="empty"><h2 class="h2">Aún no hay ${CATS[cat].plural.toLowerCase()}</h2><p>Añade fotos de tu ropa desde el armario.</p><button class="btn primary" data-act="addItem" data-cat="${cat}">Añadir ${CATS[cat].one}</button></div>`;
  }else if(!good.length){
    h+=`<div class="empty"><h2 class="h2">${base?'Nada combina con esto':'Nada disponible'}</h2><p>${base?(S.settings.suggest===false?'Indica qué '+(cat==='shoes'?'calzado':'prendas')+' combinan con '+esc(base.name)+'.':'No hay sugerencias para '+esc(base.name)+(base.color?'':' porque no tiene color asignado')+'. Puedes marcar tú las combinaciones o mirar en otras opciones.'):'Todo está en el cesto o fuera de temporada.'}</p>${base?`<button class="btn primary" data-act="compat" data-id="${base.id}">Configurar combinaciones</button>`:''}</div>`;
  }else{
    h+=`<div class="grid">${good.map(i=>tile(i,{act:'pick',sug:base&&compatReason(i,base)==='suggest'})).join('')}</div>`;
  }
  if(other.length)h+=`<details class="others"${good.length?'':' open'}><summary>Otras opciones (${other.length}) ${ic('right',16)}</summary><p class="hint">No combinan según tus marcas ni según la guía de color. Si eliges una, se guarda como combinación tuya.</p><div class="grid">${other.map(i=>tile(i,{act:'pickNew',dim:true})).join('')}</div></details>`;
  if(hidden)h+=`<p class="hint" style="margin-top:18px">${hidden} ${hidden===1?'prenda oculta':'prendas ocultas'} por estar en el cesto o fuera de temporada.</p>`;
  return h;
}
export function summaryHTML(target,isToday){
  const f=S.flow;let h=outfitCard(f);
  const L=layersOf(f).map(get).filter(Boolean),canLayer=layerPool().length>0;
  const extras=['acc'].filter(k=>S.items.some(i=>i.cat===k&&available(i)));
  if(L.length||canLayer||extras.length){h+=`<div class="stack" style="margin-top:12px">`+L.map((it,i)=>`<div class="extra">${mini(it)}<span style="flex:1"><b>${esc(it.name)}</b><br>Capa ${i+1}${L.length>1?(i===0?' · la de dentro':i===L.length-1?' · la de fuera':''):''}</span><button class="iconbtn" data-act="delLayer" data-id="${it.id}" aria-label="Quitar ${esc(it.name)}">${ic('x',18)}</button></div>`).join('')+(canLayer?`<button class="extra" data-act="pickerExtra" data-cat="layer">${ic('plus',20)}<span>${L.length?'Añadir otra capa':'Añadir capa'} <span style="color:var(--muted)">(jersey, abrigo… opcional)</span></span></button>`:'')+extras.map(k=>{const it=get(f[k]);return `<button class="extra" data-act="pickerExtra" data-cat="${k}">${it?mini(it)+`<span><b>${esc(it.name)}</b><br>${CATS[k].label} · cambiar</span>`:`${ic('plus',20)}<span>Añadir ${CATS[k].one} <span style="color:var(--muted)">(opcional)</span></span>`}</button>`}).join('')+`</div>`}
  h+=`<div class="actions"><button class="btn primary block" data-act="confirmOutfit">${isToday?'Me lo pongo hoy':'Guardar en el plan'}</button><button class="btn ghost block" data-act="flowReset">Empezar de nuevo</button></div>`;
  return h;
}
export function outfitCard(o){
  const main=['top','bottom','shoes'].map(k=>get(o[k])).filter(Boolean),lay=layersOf(o).map(get).filter(Boolean),ex=[...lay,get(o.acc)].filter(Boolean);
  if(!main.length&&!ex.length)return `<div class="empty"><p>Las prendas de este outfit ya no están en tu armario.</p></div>`;
  const full=o.top&&o.bottom&&o.shoes&&get(o.top)&&get(o.bottom)&&get(o.shoes),fav=full&&S.favs.some(f=>favKey(f)===favKey(o));
  const heart=full?`<button class="lay-fav${fav?' on':''}" data-act="favToggle" data-k="${favKey(o)}" aria-pressed="${fav}" aria-label="${fav?'Quitar de favoritos':'Guardar en favoritos'}">${ic('heart',22,1.8)}</button>`:'';
  return `<div class="lay">${heart}<div class="lay-main"><div class="lay-stack">${main.map(it=>`<button class="lay-i${it.cat==='shoes'?' k2':''}" data-act="detail" data-id="${it.id}" aria-label="${esc(it.name)}">${imgTag(it)}</button>`).join('')}</div>${ex.length?`<div class="lay-ex">${ex.map(it=>`<button class="lay-x" data-act="detail" data-id="${it.id}" aria-label="${esc(it.name)}">${imgTag(it)}</button>`).join('')}</div>`:''}</div>
  <ul class="lay-names">${[...main,...ex].map(it=>`<li><span>${lay.includes(it)?(lay.length>1?'Capa '+(lay.indexOf(it)+1):it.cat==='outer'?'Abrigo':'Capa'):CATS[it.cat].label}</span><b>${esc(it.name)}</b></li>`).join('')}</ul></div>`;
}
export function tile(it,{act='detail',sel=false,dim=false,meta=true,extra='',check='',sug=false,sub=null,base=null}={}){
  const u=usesOf(it.id);
  const corner=sug?'<span class="badge r sug">Sugerida</span>':it.wild&&meta?'<span class="badge r">Comodín</span>':'';
  const line=sub!==null?`<span class="tm">${sub||'&nbsp;'}</span>`:meta?`<span class="tm">${u} ${u===1?'uso':'usos'} · ${ago(lastOf(it.id))}</span>`:'';
  return `<button class="tile${sel?' sel':''}${dim?' dim':''}${extra}" data-act="${act}" data-id="${it.id}"${base?` data-base="${base}"`:''}><span class="ph">${imgTag(it,true)}${it.laundry?'<span class="badge">En el cesto</span>':''}${corner}${check}</span><span class="tn">${esc(it.name)}</span>${line}</button>`;
}

/* ----- ARMARIO ----- */
const norm=t=>(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
export const armFilters=()=>(S.armColor?1:0)+(S.armStyle?1:0);
export function armList(){
  const sorts={recent:(a,b)=>(b.added||'').localeCompare(a.added||''),most:(a,b)=>usesOf(b.id)-usesOf(a.id),least:(a,b)=>usesOf(a.id)-usesOf(b.id),last:byFresh,name:(a,b)=>a.name.localeCompare(b.name,'es'),color:(a,b)=>COLORS.findIndex(c=>c[0]===a.color)-COLORS.findIndex(c=>c[0]===b.color)};
  const q=norm(S.armQ).trim();
  let list=S.items.filter(i=>i.cat===S.armCat);
  if(S.armLaundry)list=list.filter(i=>i.laundry);
  if(q)list=list.filter(i=>norm(i.name).includes(q));
  if(S.armColor)list=list.filter(i=>i.color===S.armColor);
  if(S.armStyle)list=list.filter(i=>(i.styles||[]).includes(S.armStyle));
  return list.sort(sorts[S.armSort]);
}
export function armBody(){
  const list=armList(),sel=S.armSel;
  if(!list.length){
    const filtered=S.armQ.trim()||armFilters();
    if(filtered)return `<div class="empty"><h2 class="h2">Nada coincide</h2><p>Prueba con otra búsqueda o quita algún filtro.</p><button class="btn" data-act="armClear">Quitar búsqueda y filtros</button></div>`;
    return `<div class="empty"><h2 class="h2">${S.armLaundry?'Nada en el cesto':'Sin '+CATS[S.armCat].plural.toLowerCase()}</h2><p>${S.armLaundry?'Toda la ropa de esta categoría está limpia.':'Haz una foto a la prenda sobre un fondo liso y añádela.'}</p>${S.armLaundry?'':`<button class="btn primary" data-act="addItem" data-cat="${S.armCat}">Añadir ${CATS[S.armCat].one}</button>`}</div>`;
  }
  let h=`<div class="grid">${list.map(i=>sel?tile(i,{act:'armPick',sel:sel.has(i.id),check:sel.has(i.id)?`<span class="check">${ic('check',14,2.4)}</span>`:''}):tile(i)).join('')}</div>`;
  if(S.armLaundry&&!sel&&!S.armQ.trim()&&!armFilters())h+=`<button class="btn block" style="margin-top:20px" data-act="allClean">Marcar todo como limpio</button>`;
  return h;
}
export function armBar(){
  const sel=S.armSel;if(!sel)return '';
  const items=[...sel].map(get).filter(Boolean),n=items.length,allIn=n>0&&items.every(i=>i.laundry);
  if(S.armDel)return `<div class="confirm"><p>¿Borrar ${n} ${n===1?'prenda':'prendas'}? No se puede deshacer.</p><div class="row"><button class="btn small danger" data-act="armDelDo">Sí, borrar</button><button class="btn small ghost" data-act="armDelNo">No</button></div></div>`;
  return `<div class="selbar"><span class="num">${n} ${n===1?'seleccionada':'seleccionadas'}</span><span class="row" style="gap:6px"><button class="btn small" data-act="armAllVisible">Todas</button><button class="btn small" data-act="armLaundrySel"${n?'':' disabled'}>${allIn?'Marcar limpias':'Al cesto'}</button><button class="btn small danger" data-act="armDelAsk"${n?'':' disabled'}>Borrar</button><button class="btn small ghost" data-act="armSelEnd">Listo</button></span></div>`;
}
export function viewArmario(){
  const cnt=c=>S.items.filter(i=>i.cat===c).length;
  const laundryN=S.items.filter(i=>i.laundry).length,nf=armFilters();
  let h=demoBanner()+`<div class="row between" style="margin-top:10px"><h1 class="h1" style="margin:0">Armario</h1><span class="sub num">${S.items.length} prendas</span></div><div class="row" style="justify-content:flex-end;margin-top:2px"><button class="link" data-act="wishSheet">${ic('heart',16,1.8)} Deseos${S.wishes.length?` (${S.wishes.length})`:''}</button></div>`;
  h+=`<div class="chips" style="margin-top:14px">${CAT_ORDER.map(c=>`<button class="pill${S.armCat===c?' on':''}" data-act="armCat" data-v="${c}">${CATS[c].plural}<span class="c num">${cnt(c)}</span></button>`).join('')}</div>`;
  h+=`<div class="row" style="margin-top:12px;flex-wrap:nowrap"><input class="input" id="arm-q" type="search" data-input="armQ" placeholder="Buscar por nombre" aria-label="Buscar por nombre" value="${esc(S.armQ)}" autocomplete="off" style="flex:1;min-width:0"><button class="pill${nf||S.armFilt?' on':''}" data-act="armFilt">Filtros${nf?`<span class="c num">${nf}</span>`:''}</button></div>`;
  if(S.armFilt){
    h+=`<div class="filt"><div class="sw">${COLORS.map(([n])=>`<button type="button" class="swc${S.armColor===n?' on':''}" data-act="armColor" data-v="${n}" style="background:${swatchBg(n)}" aria-label="${n}" aria-pressed="${S.armColor===n}"></button>`).join('')}</div><div class="seg" style="margin-top:12px">${Object.entries(STYLES).map(([k,l])=>`<button class="pill${S.armStyle===k?' on':''}" data-act="armStyle" data-v="${k}">${l}</button>`).join('')}</div></div>`;
  }
  h+=`<div class="row between" style="margin:12px 0 16px"><select class="sel" id="arm-sort" data-change="armSort" aria-label="Ordenar">${[['recent','Añadidas recientemente'],['most','Más usadas'],['least','Menos usadas'],['last','Más tiempo sin usar'],['name','Nombre'],['color','Color']].map(([k,l])=>`<option value="${k}"${S.armSort===k?' selected':''}>${l}</option>`).join('')}</select><span class="row" style="gap:6px">${laundryN?`<button class="pill${S.armLaundry?' on':''}" data-act="armLaundry">En el cesto<span class="c num">${laundryN}</span></button>`:''}${S.armSel?'':`<button class="pill" data-act="armSelStart">Seleccionar</button>`}</span></div>`;
  h+=`<div id="arm-bar">${armBar()}</div><div id="arm-body">${armBody()}</div>`;
  return h;
}

/* ----- SEMANA ----- */
export function viewSemana(){
  const ds=weekDates(),t=todayISO(),a=parseD(ds[0]),b=parseD(ds[6]);
  const range=a.getMonth()===b.getMonth()?`${a.getDate()} – ${b.getDate()} ${MONS[b.getMonth()]}`:`${a.getDate()} ${MONS[a.getMonth()]} – ${b.getDate()} ${MONS[b.getMonth()]}`;
  const canGen=ds.some(d=>d>=t);
  let h=`<div class="row between" style="margin-top:10px"><h1 class="h1" style="margin:0">Semana</h1><div class="weeknav"><button class="iconbtn" data-act="week" data-d="-1" aria-label="Semana anterior">${ic('left',20)}</button><span>${range}</span><button class="iconbtn" data-act="week" data-d="1" aria-label="Semana siguiente">${ic('right',20)}</button></div></div>`;
  h+=`<p class="sub" style="margin-top:6px">Combinaciones válidas, sin repetir prenda en ${S.settings.noRepeat} ${S.settings.noRepeat===1?'día':'días'} y dando prioridad a lo que menos usas. Toca un día para ajustarlo.</p>`;
  if(canGen)h+=`<button class="btn primary block" style="margin-top:16px" data-act="genWeek">${ic('refresh',18,1.8)}${ds.some(d=>d>=t&&S.plan[d]&&S.plan[d].top)?'Regenerar semana':'Generar semana'}</button>`;
  h+=`<ul class="days">`+ds.map(d=>{
    const dd=parseD(d),past=d<t,p=S.plan[d]||{},w=S.wears.find(x=>x.date===d);
    const o=w||(p.top?p:null);
    const fits=o?outfitIds(o).map(get).filter(Boolean).map(it=>mini(it)).join(''):`<span class="none">${past?'Sin registro':'Sin plan'}</span>`;
    const meta=[w?'<span class="tag acc">Llevado</span>':'',p.style&&!w?`<span class="tag">${STYLES[p.style]}</span>`:'',p.locked&&!w?ic('lock',16):''].join('');
    return `<li><button class="day${d===t?' today':''}${past&&!w?' past':''}" data-act="daySheet" data-date="${d}"><span class="dname">${DOWS[dd.getDay()]}<b>${dd.getDate()}</b></span><span class="dfits">${fits}</span><span class="dmeta">${meta}</span></button></li>`;
  }).join('')+`</ul>`;
  return h;
}
/* ----- DATOS ----- */
/* ----- favoritos ----- */
export function favSheet(){
  const list=S.favs.map(f=>({f,its:outfitIds(f).map(get).filter(Boolean)})).filter(x=>x.its.length>=3);
  let h=sheetHead('Favoritos')+`<div class="sh-body gut">`;
  const t=todayISO(),days=[...Array(7)].map((_,i)=>addDays(t,i));
  h+=list.length?`<div class="stack">`+list.map(({f,its})=>{const bad=its.filter(it=>!available(it));return `<div class="favbox"><div class="favrow"><button class="favfits" tabindex="-1" aria-hidden="true">${its.map(it=>mini(it)).join('')}</button><span class="favn">${its.map(it=>esc(it.name)).join(' · ')}</span><button class="iconbtn" data-act="favToggle" data-k="${favKey(f)}" aria-label="Quitar de favoritos">${ic('x',18)}</button></div>
    ${bad.length?`<p class="hint warn">${bad.map(it=>esc(it.name)).join(', ')} ${bad.length===1?'está':'están'} en el cesto o fuera de temporada.</p>`:''}
    <div class="favact"><button class="btn small primary" data-act="favWear" data-id="${f.id}">Me lo pongo hoy</button><select class="sel" data-change="favPlan" data-id="${f.id}" aria-label="Guardar en el plan"><option value="">Guardar en el plan…</option>${days.map(d=>{const dd=parseD(d);return `<option value="${d}">${d===t?'Hoy':DOW[dd.getDay()]+' '+dd.getDate()}</option>`}).join('')}</select></div></div>`}).join('')+`</div>`:`<p class="hint">Aún no hay favoritos. Toca el corazón de un outfit para guardarlo.</p>`;
  openSheet(h+`</div>`,{tall:true,refresh:favSheet});
}

/* ----- gráficas de Datos ----- */
export function chartsHTML(){
  if(!S.items.length)return '';
  const t=todayISO(),dow=(parseD(t).getDay()+6)%7,mon=addDays(t,-dow);
  const wk=[...Array(8)].map((_,i)=>{const a=addDays(mon,(i-7)*7),b=addDays(a,6);return {a,n:S.wears.filter(w=>w.date>=a&&w.date<=b).length}});
  const maxW=Math.max(1,...wk.map(x=>x.n));
  let h=`<section class="sec"><h2 class="h2">Usos por semana</h2><div class="wkchart" role="img" aria-label="Outfits registrados en las últimas 8 semanas">${wk.map((x,i)=>{const d=parseD(x.a);return `<div class="wkc"><span class="wkn num">${x.n||''}</span><span class="wkb"><i style="height:${Math.round(x.n/maxW*100)}%"${i===7?' class="cur"':''}></i></span><span class="wkl">${d.getDate()} ${MONS[d.getMonth()]}</span></div>`}).join('')}</div>${wk.every(x=>!x.n)?'<p class="hint">Aparecerá cuando registres outfits.</p>':''}</section>`;
  const bars=(rows,total,sw)=>rows.map(([l,n,c])=>`<div class="drow"><span class="dl">${sw?`<span class="dot" style="background:${swatchBg(c)}"></span>`:''}${esc(l)}</span><span class="ubar"><i style="width:${Math.round(n/Math.max(1,rows[0][1])*100)}%"></i></span><span class="dn num">${n}<small>${Math.round(n/total*100)}%</small></span></div>`).join('');
  const cc={};for(const i of S.items)cc[i.cat]=(cc[i.cat]||0)+1;
  const catRows=CAT_ORDER.filter(c=>cc[c]).map(c=>[CATS[c].plural,cc[c],c]).sort((a,b)=>b[1]-a[1]);
  h+=`<section class="sec"><h2 class="h2">Reparto por categoría</h2><div class="dchart">${bars(catRows,S.items.length,false)}</div></section>`;
  const co={};let sin=0;for(const i of S.items){if(i.color)co[i.color]=(co[i.color]||0)+1;else sin++}
  const colRows=Object.entries(co).map(([c,n])=>[cap(c),n,c]).sort((a,b)=>b[1]-a[1]);
  if(colRows.length)h+=`<section class="sec"><h2 class="h2">Reparto por color</h2><div class="dchart">${bars(colRows,S.items.length,true)}</div>${sin?`<p class="hint">${sin} sin color asignado.</p>`:''}</section>`;
  return h;
}

export function viewDatos(){
  const t=todayISO(),fl=forgottenList();
  const active30=S.items.filter(i=>{const l=lastOf(i.id);return l&&diffDays(t,l)<=30}).length;
  let h=`<h1 class="h1" style="margin-top:10px">Datos</h1>`;
  h+=`<div class="stats3"><div class="stat"><b>${S.wears.length}</b><span>Outfits registrados</span></div><div class="stat"><b>${active30}<small style="font-size:15px;color:var(--muted)">/${S.items.length}</small></b><span>Prendas usadas en 30 días</span></div><div class="stat"><b>${fl.length}</b><span>Olvidadas</span></div></div>`;
  const real=S.items.some(i=>!i.demo);const le=S.settings.lastExport;
  if(real&&(!le||diffDays(t,le)>30))h+=`<div class="banner" style="margin-top:16px"><p>${le?'Tu última copia es de hace '+diffDays(t,le)+' días.':'Aún no has hecho ninguna copia de seguridad.'}</p><button class="btn small primary" data-act="export">Hacer copia</button></div>`;
  h+=`<section class="sec"><div class="sec-h"><h2 class="h2">Olvidadas</h2><span class="hint">${S.settings.forgotten} días o más sin usar</span></div>`;
  h+=fl.length?`<div class="hscroll">${fl.map(x=>`<button class="tile" data-act="detail" data-id="${x.it.id}"><span class="ph">${imgTag(x.it,true)}</span><span class="tn">${esc(x.it.name)}</span><span class="tm">${x.never?'Nunca usada':x.days+' días'}</span></button>`).join('')}</div>`:`<p class="hint">Ninguna. Estás rotando bien tu ropa.</p>`;
  h+=`</section>`;
  h+=chartsHTML();
  // usage
  let list=S.items.filter(i=>S.dataCat==='all'||i.cat===S.dataCat);
  const cpu=i=>i.price>0?i.price/Math.max(usesOf(i.id),1):-1;
  const sorts={most:(a,b)=>usesOf(b.id)-usesOf(a.id),least:(a,b)=>usesOf(a.id)-usesOf(b.id),old:byFresh,cpu:(a,b)=>cpu(b)-cpu(a)};
  list.sort(sorts[S.dataSort]);
  const maxU=Math.max(1,...list.map(i=>usesOf(i.id)));
  h+=`<section class="sec"><div class="sec-h"><h2 class="h2">Uso por prenda</h2><select class="sel" id="data-sort" data-change="dataSort" aria-label="Ordenar">${[['most','Más usadas'],['least','Menos usadas'],['old','Más tiempo sin usar'],['cpu','Coste por uso']].map(([k,l])=>`<option value="${k}"${S.dataSort===k?' selected':''}>${l}</option>`).join('')}</select></div>`;
  h+=`<div class="chips">${[['all','Todas'],...CAT_ORDER.map(c=>[c,CATS[c].plural])].map(([k,l])=>`<button class="pill${S.dataCat===k?' on':''}" data-act="dataCat" data-v="${k}">${l}</button>`).join('')}</div>`;
  if(S.dataSort==='cpu'&&!list.some(i=>i.price>0))h+=`<p class="hint">Añade el precio al editar una prenda para ver su coste por uso.</p>`;
  h+=`<div class="urows">${list.map(i=>{const u=usesOf(i.id);const right=S.dataSort==='cpu'?(i.price>0?`${euro(cpu(i))}<small>por uso</small>`:`—<small>sin precio</small>`):`${u}<small>${ago(lastOf(i.id))}</small>`;return `<button class="urow" data-act="detail" data-id="${i.id}">${mini(i)}<span style="min-width:0"><span class="un">${esc(i.name)}</span><span class="ubar"><i style="width:${Math.round(u/maxU*100)}%"></i></span></span><span class="unum">${right}</span></button>`}).join('')||'<p class="hint">Sin prendas en esta categoría.</p>'}</div></section>`;
  // combos
  const cm={};for(const w of S.wears){if(!w.top||!w.bottom||!w.shoes)continue;const k=[w.top,w.bottom,w.shoes].join('|');cm[k]=(cm[k]||0)+1}
  const top=Object.entries(cm).filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]).slice(0,5);
  h+=`<section class="sec"><h2 class="h2">Combinaciones más repetidas</h2>`;
  h+=top.length?top.map(([k,n])=>{const ids=k.split('|');return `<div class="combo">${ids.map(id=>mini(get(id))).join('')}<span class="hint" style="margin-left:4px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ids.map(id=>esc(get(id)?.name||'—')).join(' · ')}</span><span class="cnt">×${n}</span></div>`}).join(''):`<p class="hint">Aparecerán cuando repitas un mismo outfit.</p>`;
  h+=`</section>`;
  // history
  const hist=[...S.wears].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20);
  h+=`<section class="sec"><h2 class="h2">Historial</h2>${hist.length?hist.map(w=>`<div class="hist"><span class="d">${fmtShort(w.date)}</span><span class="dfits">${outfitIds(w).map(get).filter(Boolean).map(it=>mini(it)).join('')}</span><button class="iconbtn" data-act="delWear" data-id="${w.id}" aria-label="Borrar registro">${ic('x',18)}</button></div>`).join(''):'<p class="hint">Todavía no has registrado ningún outfit.</p>'}</section>`;
  return h;
}

/* ---------- item detail ---------- */
export function detailSheet(id){
  const it=get(id);if(!it)return closeSheet();
  const u=usesOf(id),l=lastOf(id);
  const rel=related(it.cat);
  let h=sheetHead(it.name,null,`<button class="link strong" data-act="editItem" data-id="${id}">Editar</button>`)+`<div class="sh-body gut">`;
  h+=`<div class="detail-img">${imgTag(it)}</div>`;
  h+=`<div class="metarow"><span class="tag">${CATS[it.cat].label}</span>${it.color?`<span class="tag"><span class="dot" style="background:${swatchBg(it.color)}"></span> ${cap(it.color)}</span>`:''}${(it.styles||[]).map(s=>`<span class="tag">${STYLES[s]}</span>`).join('')}<span class="tag">${SEASONS[it.season||'all']}</span>${it.wild?'<span class="tag acc">Comodín</span>':''}${it.laundry?'<span class="tag acc">En el cesto</span>':''}</div>`;
  h+=`<div class="facts"><div><b>${u}</b><span>${u===1?'Uso':'Usos'}</span></div><div><b>${l?agoShort(l):'—'}</b><span>Último uso</span></div><div><b>${it.price>0?euro(it.price/Math.max(u,1)):'—'}</b><span>Coste por uso</span></div></div>`;
  for(const rc of rel){
    const list=S.items.filter(i=>i.cat===rc&&compatible(i,it));
    h+=`<div class="field"><div class="row between"><span class="label">Combina con · ${CATS[rc].plural.toLowerCase()}</span><span class="hint num">${list.length}</span></div>${list.length?`<div class="thumbrow">${list.map(i=>mini(i)).join('')}</div>`:'<p class="hint">Nada marcado todavía.</p>'}</div>`;
  }
  if(['top','bottom','shoes'].includes(it.cat)&&available(it))h+=`<button class="btn primary block" data-act="outfitWith" data-id="${id}">Crear outfit con esta prenda</button>`;
  if(rel.length)h+=`<button class="btn block" data-act="compat" data-id="${id}">Editar combinaciones</button>`;
  h+=`<div class="stack"><button class="btn block" data-act="toggleLaundry" data-id="${id}">${it.laundry?'Ya está limpia':'Al cesto de la ropa sucia'}</button>`;
  h+=`<div id="del-zone"><button class="btn ghost danger block" data-act="askDelete" data-id="${id}">Eliminar prenda</button></div></div>`;
  h+=`<p class="hint" style="text-align:center">Añadida el ${it.added?fmtShort(it.added):'—'}</p></div>`;
  openSheet(h,{tall:true,refresh:()=>detailSheet(id)});
}

/* ---------- add / edit item ---------- */
export let D=null;
export function editSheet(id,cat){
  const it=get(id);
  D=it?{...it,styles:[...(it.styles||[])],hasPhoto:!it.illus,src:null,removeBg:false,tol:34,isNew:false}:{id:uid(),name:'',cat:cat||S.armCat||'top',color:'',styles:['casual'],season:'all',price:'',wild:false,laundry:false,hasPhoto:false,src:null,removeBg:false,tol:34,isNew:true,fit:'contain'};
  drawEdit();
}
export function drawEdit(){
  const segs=(field,opts,multi)=>`<div class="seg" data-field="${field}" data-multi="${multi?1:0}">${opts.map(([k,l])=>`<button type="button" class="pill${(multi?D[field].includes(k):D[field]===k)?' on':''}" data-act="seg" data-v="${k}">${l}</button>`).join('')}</div>`;
  const q=D.qTotal>1,more=q&&D.qIndex<D.qTotal;
  let h=sheetHead(q?`Prenda ${D.qIndex} de ${D.qTotal}`:D.isNew?'Nueva prenda':'Editar prenda','<button class="link" data-act="cancelEdit">'+(q?'Terminar':'Cancelar')+'</button>',`<button class="link strong" data-act="saveItem">${more?'Siguiente':'Guardar'}</button>`)+`<div class="sh-body gut">`;
  h+=`<label class="photo${D.hasPhoto?' has':''}" for="f-photo" id="photo-box"><img id="f-prev" alt="" src="${previewSrc()}" class="${D.hasPhoto&&D.fit==='cover'?'cover':''}"><span class="ov">${ic('camera',16,1.8)}${D.hasPhoto?'Cambiar foto':'Añadir foto'}</span></label>`;
  if(D.src)h+=`<div class="field"><div class="toggle"><div><b style="font-weight:500">Quitar fondo</b><p>Funciona mejor con la prenda sobre un fondo liso.</p></div><button type="button" class="switch" role="switch" aria-checked="${D.removeBg}" data-act="bgToggle" aria-label="Quitar fondo"></button></div>${D.removeBg?`<label class="hint" for="f-tol">Sensibilidad</label><input type="range" id="f-tol" min="8" max="90" value="${D.tol}" data-input="tol">`:''}</div>`;
  else if(!D.hasPhoto)h+=`<p class="hint" style="margin-top:-12px;text-align:center">Sin foto se usa una ilustración del color que elijas.</p>`;
  h+=`<div class="field"><label class="label" for="f-name">Nombre</label><input class="input" id="f-name" data-input="name" value="${esc(D.name)}" placeholder="Camiseta blanca de algodón" autocomplete="off"></div>`;
  h+=`<div class="field"><span class="label">Categoría</span>${segs('cat',CAT_ORDER.map(c=>[c,CATS[c].label]))}</div>`;
  h+=`<div class="field"><span class="label">Color <span id="color-name" style="text-transform:none;letter-spacing:0;color:var(--fg)">${D.color?'· '+cap(D.color)+(D.colorAuto?' (sugerido)':''):''}</span></span><div class="sw">${COLORS.map(([n])=>`<button type="button" class="swc${D.color===n?' on':''}" data-act="color" data-v="${n}" style="background:${swatchBg(n)}" aria-label="${n}"></button>`).join('')}</div><p class="hint">Con el color, Percha te sugiere con qué combina. Se propone según la foto; corrígelo si no acierta.</p></div>`;
  h+=`<details class="more" id="f-more"${D.more||!D.isNew?' open':''}><summary>Más detalles <span>estilo, temporada, precio, comodín</span></summary>`;
  h+=`<div class="field"><span class="label">Estilo</span>${segs('styles',Object.entries(STYLES),true)}</div>`;
  h+=`<div class="field"><span class="label">Temporada</span>${segs('season',Object.entries(SEASONS))}</div>`;
  h+=`<div class="field"><label class="label" for="f-price">Precio <span style="text-transform:none;letter-spacing:0">(opcional, para el coste por uso)</span></label><input class="input" id="f-price" data-input="price" inputmode="decimal" value="${D.price??''}" placeholder="25"></div>`;
  h+=`<div class="toggle"><div><b style="font-weight:500">Comodín</b><p>Combina con todo, sin tener que marcarlo una a una.</p></div><button type="button" class="switch" role="switch" aria-checked="${!!D.wild}" data-act="wildToggle" aria-label="Comodín"></button></div></details>`;
  h+=`</div>`;
  openSheet(h,{tall:true});
}
export function previewSrc(){if(D.hasPhoto){if(D.blob){if(D._pu&&D._pb===D.blob)return D._pu;if(D._pu)URL.revokeObjectURL(D._pu);D._pb=D.blob;D._pu=URL.createObjectURL(D.blob);return D._pu}return urlFor(D)}return svgDataURL(garmentSVG(defaultKind[D.cat],D.color))}
export function updatePreview(){const im=$('#f-prev');if(!im)return;im.src=previewSrc();im.className=D.hasPhoto&&D.fit==='cover'?'cover':'';$('#photo-box').classList.toggle('has',D.hasPhoto)}
export async function loadPhoto(file){
  const box=$('#photo-box');box&&box.classList.add('busy');
  try{
    const url=URL.createObjectURL(file);const im=new Image();
    await new Promise((r,j)=>{im.onload=r;im.onerror=j;im.src=url});
    const max=IMG_MAX,s=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight));
    const c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*s);c.height=Math.round(im.naturalHeight*s);
    c.getContext('2d',{willReadFrequently:true}).drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);
    D.src=c;D.hasPhoto=true;await processPhoto();drawEdit();
  }catch(e){console.warn(e);toast('No se pudo abrir esa imagen. Prueba con otra foto.');box&&box.classList.remove('busy')}
}
export function rgb2lab(r,g,b){const f=v=>{v/=255;return v>.04045?Math.pow((v+.055)/1.055,2.4):v/12.92},R=f(r),G=f(g),B=f(b);
  const g2=t=>t>.008856?Math.cbrt(t):7.787*t+16/116,X=g2((R*.4124+G*.3576+B*.1805)/.95047),Y=g2(R*.2126+G*.7152+B*.0722),Z=g2((R*.0193+G*.1192+B*.9505)/1.08883);
  return [116*Y-16,500*(X-Y),200*(Y-Z)]}
export let _palLab=null;
export function detectColor(src,cropped){
  if(!_palLab)_palLab=COLORS.filter(c=>c[1][0]==='#').map(([n,h])=>[n,rgb2lab(parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16))]);
  const w=48,h=Math.max(8,Math.round(48*src.height/src.width)),t=document.createElement('canvas');t.width=w;t.height=h;
  const cx=t.getContext('2d',{willReadFrequently:true});cx.drawImage(src,0,0,w,h);const d=cx.getImageData(0,0,w,h).data,votes={};let n=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(!cropped&&(x<w*.25||x>w*.75||y<h*.2||y>h*.8))continue;
    const i=(y*w+x)*4;if(d[i+3]<200)continue;
    const l=rgb2lab(d[i],d[i+1],d[i+2]);let best=null,bd=1e9;
    for(const [nm,pl] of _palLab){const e=(l[0]-pl[0])**2*.6+(l[1]-pl[1])**2+(l[2]-pl[2])**2;if(e<bd){bd=e;best=nm}}
    votes[best]=(votes[best]||0)+1;n++}
  if(n<20)return '';
  return Object.entries(votes).sort((a,b)=>b[1]-a[1])[0][0];
}
export function syncColor(){document.querySelectorAll('.swc').forEach(s=>s.classList.toggle('on',s.dataset.v===D.color));const cn=$('#color-name');if(cn)cn.textContent=D.color?'· '+cap(D.color)+(D.colorAuto?' (sugerido)':''):''}
export async function processPhoto(){
  if(!D||!D.src)return;
  const c=D.removeBg?removeBg(D.src,D.tol):D.src;
  D.blob=await encodeCanvas(c,D.removeBg);D.thumb=await encodeCanvas(scaleCanvas(c,THUMB_MAX),D.removeBg);
  D.fit=D.removeBg?'contain':'cover';D.newImg=true;
  if(!D.color||D.colorAuto){const k=detectColor(c,D.removeBg);if(k){D.color=k;D.colorAuto=true}}
  updatePreview();syncColor();
}
export function removeBg(src,tol){
  const w=src.width,h=src.height,ctx=src.getContext('2d',{willReadFrequently:true}),id=ctx.getImageData(0,0,w,h),d=id.data;
  const sm=[];for(let x=0;x<w;x+=3){sm.push(x*4,((h-1)*w+x)*4)}for(let y=0;y<h;y+=3){sm.push(y*w*4,(y*w+w-1)*4)}
  const med=k=>{const a=sm.map(i=>d[i+k]).sort((p,q)=>p-q);return a[a.length>>1]};
  const sr=med(0),sg=med(1),sb=med(2),t2=tol*tol*3;
  const close=p=>{const i=p*4,a=d[i]-sr,b=d[i+1]-sg,c=d[i+2]-sb;return a*a+b*b+c*c<=t2};
  const mask=new Uint8Array(w*h),q=new Int32Array(w*h);let qh=0,qt=0;
  const seed=p=>{if(!mask[p]&&close(p)){mask[p]=1;q[qt++]=p}};
  for(let x=0;x<w;x++){seed(x);seed((h-1)*w+x)}for(let y=0;y<h;y++){seed(y*w);seed(y*w+w-1)}
  while(qh<qt){const p=q[qh++],x=p%w;if(x>0)seed(p-1);if(x<w-1)seed(p+1);if(p>=w)seed(p-w);if(p<w*(h-1))seed(p+w)}
  const out=new Uint8ClampedArray(d);let x0=w,y0=h,x1=-1,y1=-1;
  for(let p=0;p<w*h;p++){if(mask[p]){out[p*4+3]=0;continue}const x=p%w,y=(p/w)|0;if((x>0&&mask[p-1])||(x<w-1&&mask[p+1])||(y>0&&mask[p-w])||(y<h-1&&mask[p+w]))out[p*4+3]=140;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;tmp.getContext('2d').putImageData(new ImageData(out,w,h),0,0);
  if(x1<0)return tmp;
  const bw=x1-x0+1,bh=y1-y0+1,pad=Math.round(Math.max(bw,bh)*.04),o=document.createElement('canvas');o.width=bw+pad*2;o.height=bh+pad*2;o.getContext('2d').drawImage(tmp,x0,y0,bw,bh,pad,pad,bw,bh);return o;
}
export async function saveItem(){
  const old=get(D.id);const name=(D.name||'').trim()||(CATS[D.cat].label+(D.color?' '+D.color:''));
  const price=parseFloat(String(D.price||'').replace(',','.'));
  const it={id:D.id,name,cat:D.cat,color:D.color,styles:D.styles.length?D.styles:['casual'],season:D.season,price:price>0?price:null,wild:!!D.wild,laundry:!!D.laundry,added:old?.added||todayISO(),demo:old?.demo&&!D.newImg?old.demo:false};
  if(D.hasPhoto){it.img=D.newImg?D.blob:old.img;it.thumb=D.newImg?D.thumb:old.thumb;it.fit=D.newImg?D.fit:old.fit;it.illus=false}
  else{it.img=svgBlob(garmentSVG(old&&old.illus&&old.kind&&old.cat===D.cat?old.kind:defaultKind[D.cat],D.color));it.kind=old&&old.cat===D.cat?old.kind:undefined;it.fit='contain';it.illus=true}
  if(old&&old.cat!==it.cat){for(const k of [...S.pairs]){const [a,b]=k.split('|');if(a===it.id||b===it.id)S.pairs.delete(k)}savePairs()}
  const i=S.items.findIndex(x=>x.id===it.id);if(i>=0)S.items[i]=it;else S.items.push(it);
  await put('items',it);
  if(D.fromWish){S.wishes=S.wishes.filter(x=>x.id!==D.fromWish);dropURLs(D.fromWish);await saveWishes()}
  if(!old){try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}
  computeStats();
  const isNew=D.isNew;
  if(D.qTotal>1){
    const n=(D.qDone||0)+1,files=D.queue||[];
    if(files.length){
      const prev=D;
      D={id:uid(),name:'',cat:prev.cat,color:'',styles:[...prev.styles],season:prev.season,price:'',wild:false,laundry:false,hasPhoto:false,src:null,removeBg:false,tol:34,isNew:true,fit:'contain',queue:files.slice(1),qTotal:prev.qTotal,qIndex:prev.qIndex+1,qDone:n};
      drawEdit();loadPhoto(files[0]);return;
    }
    S.armCat=it.cat;D=null;closeSheet();toast(n+' prendas añadidas');return;
  }
  D=null;
  if(isNew&&related(it.cat).some(c=>S.items.some(x=>x.cat===c))){S.armCat=it.cat;compatSheet(it.id,true)}
  else{toast(isNew?'Prenda añadida':'Cambios guardados');detailSheet(it.id)}
}

/* ---------- compatibility editor ---------- */
export function compatSheet(id,fresh){
  const it=get(id);if(!it)return closeSheet();
  let h=sheetHead('Combinaciones',fresh?'<span></span>':`<button class="link" data-act="detail" data-id="${id}">Atrás</button>`,`<button class="link strong" data-act="${fresh?'closeSheet':'detail'}" data-id="${id}">Listo</button>`)+`<div class="sh-body gut">`;
  h+=`<div class="row" style="gap:14px">${mini(it,'style="width:56px;height:56px"')}<div style="min-width:0"><h2 class="h2">¿Con qué combina ${esc(it.name)}?</h2><p class="sub">${S.settings.suggest===false?'Toca para marcar o desmarcar.':'Ya vienen sugerencias según el color. Toca para confirmar o descartar.'}</p></div></div>`;
  for(const rc of related(it.cat)){
    const list=S.items.filter(i=>i.cat===rc).sort((a,b)=>a.name.localeCompare(b.name,'es'));
    h+=`<div class="field"><div class="row between"><span class="label">${CATS[rc].plural}</span>${list.length?`<span class="row" style="gap:4px"><button class="link" style="font-size:13.5px" data-act="pairAll" data-id="${id}" data-cat="${rc}" data-on="1">Todas</button><button class="link" style="font-size:13.5px" data-act="pairAll" data-id="${id}" data-cat="${rc}" data-on="0">Ninguna</button></span>`:''}</div>`;
    h+=list.length?`<div class="grid small">${list.map(o=>{const k=pairKey(it.id,o.id),r=compatReason(it,o),explicit=r==='pair',blocked=S.blocks.has(k),auto=!explicit&&r;
      const sub=explicit?'Tú':blocked?'Descartada':r==='suggest'?(suggestScore(it,o)===3?'Sugerida · clásica':'Sugerida'):r==='wild'?'Comodín':r==='rule'?'Tu regla':'';
      return tile(o,{act:'pairToggle',base:id,meta:false,sub,extra:explicit?' on':auto?' auto':blocked?' no':'',check:explicit?`<span class="check">${ic('check',14,2.4)}</span>`:auto?`<span class="check auto">${ic('check',14,2.2)}</span>`:blocked?`<span class="check no">${ic('x',13,2.4)}</span>`:''})}).join('')}</div>`:`<p class="hint">Aún no tienes ${CATS[rc].plural.toLowerCase()}.</p>`;
    h+=`</div>`;
  }
  h+=`<div class="legend"><span><span class="check auto">${ic('check',12,2.2)}</span>Sugerida por color, comodín o regla. Un toque la confirma.</span><span><span class="check">${ic('check',12,2.4)}</span>Confirmada por ti. Otro toque la descarta.</span><span><span class="check no">${ic('x',11,2.4)}</span>Descartada: nunca se propone. Otro toque la devuelve a como estaba.</span></div>${it.color?'':`<p class="hint">Esta prenda no tiene color, así que no recibe sugerencias. Añádelo desde Editar.</p>`}</div>`;
  openSheet(h,{tall:true,refresh:()=>compatSheet(id,fresh)});
}

/* ---------- week day sheet ---------- */
export function daySheet(d){
  const p=S.plan[d]||{},t=todayISO(),dd=parseD(d),w=S.wears.find(x=>x.date===d),past=d<t;
  let h=sheetHead(cap(DOW[dd.getDay()])+' '+dd.getDate()+' de '+MON[dd.getMonth()])+`<div class="sh-body gut">`;
  if(w){h+=`<div><span class="label">Llevado</span>${outfitCard(w)}</div>`}
  else if(p.top){h+=outfitCard(p)}
  else h+=`<div class="empty"><p>${past?'No registraste nada este día.':'Este día aún no tiene outfit.'}</p></div>`;
  if(!past&&!w){
    h+=`<div class="field"><span class="label">Estilo del día</span><div class="seg">${[['','Cualquiera'],...Object.entries(STYLES)].map(([k,l])=>`<button class="pill${(p.style||'')===k?' on':''}" data-act="dayStyle" data-date="${d}" data-v="${k}">${l}</button>`).join('')}</div></div>`;
    if(p.top)h+=`<div class="toggle"><div><b style="font-weight:500">Bloquear</b><p>Al regenerar la semana, este día no cambia.</p></div><button class="switch" role="switch" aria-checked="${!!p.locked}" data-act="dayLock" data-date="${d}" aria-label="Bloquear"></button></div>`;
    h+=`<div class="stack">`;
    if(d===t&&p.top)h+=`<button class="btn primary block" data-act="wearPlan" data-date="${d}">Me lo pongo hoy</button>`;
    h+=`<button class="btn block" data-act="dayRegen" data-date="${d}">${ic('refresh',18,1.8)}${p.top?'Otra combinación':'Generar este día'}</button><button class="btn block" data-act="dayManual" data-date="${d}">Elegir yo</button>`;
    if(p.top)h+=`<button class="btn ghost block" data-act="dayClear" data-date="${d}">Quitar del plan</button>`;
    h+=`</div>`;
  }else if(d===t&&w){h+=`<button class="btn block" data-act="tab" data-v="hoy">Ver en Hoy</button>`}
  h+=`</div>`;
  openSheet(h,{refresh:()=>daySheet(d)});
}

/* ---------- capas (otra parte de arriba o abrigo, de dentro a fuera) ---------- */
export function layerPool(){const f=S.flow,L=layersOf(f);return S.items.filter(i=>(i.cat==='outer'||i.cat==='top')&&i.id!==f.top&&!L.includes(i.id)&&available(i))}
export function layerSheet(){
  const f=S.flow,base=get(f.top),pool=layerPool(),outs=pool.filter(i=>i.cat==='outer'),tops=pool.filter(i=>i.cat==='top');
  const good=base?outs.filter(i=>compatible(i,base)):outs,other=outs.filter(i=>!good.includes(i));
  let h=sheetHead('Añadir capa')+`<div class="sh-body gut"><p class="sub" style="margin:0">Va encima de lo que ya llevas${layersOf(f).length?'; una parte de arriba entra por debajo de los abrigos':''}.</p>`;
  if(outs.length)h+=`<p class="label" style="margin:8px 0 0">${CATS.outer.plural}${base&&good.length?` · primero los que combinan con ${esc(base.name)}`:''}</p><div class="grid">${[...good,...other].map(i=>tile(i,{act:'addLayer',dim:other.includes(i)})).join('')}</div>`;
  if(tops.length)h+=`<p class="label" style="margin:8px 0 0">Otra parte de arriba (jersey, camisa abierta…)</p><div class="grid">${tops.map(i=>tile(i,{act:'addLayer'})).join('')}</div>`;
  h+=`</div>`;
  openSheet(h,{tall:true});
}

/* ---------- extras picker (accesorio) ---------- */
export function pickerSheet(cat){
  const f=S.flow,base=cat==='outer'?get(f.top):null;
  const pool=S.items.filter(i=>i.cat===cat&&available(i));
  const good=base?pool.filter(i=>compatible(i,base)):pool,other=base?pool.filter(i=>!compatible(i,base)):[];
  let h=sheetHead(CATS[cat].plural)+`<div class="sh-body gut">`;
  if(base)h+=`<p class="sub" style="margin:0">Primero los que combinan con ${esc(base.name)}</p>`;
  h+=`<div class="grid">${[...good,...other].map(i=>tile(i,{act:'pickExtra',sel:f[cat]===i.id,dim:other.includes(i)})).join('')}</div>`;
  if(f[cat])h+=`<button class="btn block" data-act="pickExtra" data-id="" data-cat="${cat}">Sin ${CATS[cat].one}</button>`;
  h+=`</div>`;
  openSheet(h,{tall:true});
}

/* ---------- settings ---------- */
export function settingsSheet(){
  const s=S.settings,cs=currentSeason();
  let h=sheetHead('Ajustes')+`<div class="sh-body gut">`;
  if(deferredInstall)h+=`<button class="btn primary block" data-act="install">Instalar Percha en el móvil</button>`;
  h+=`<div class="field"><span class="label">Apariencia</span><div class="seg">${[['auto','Sistema'],['light','Claro'],['dark','Oscuro']].map(([k,l])=>`<button class="pill${(s.theme||'auto')===k?' on':''}" data-act="setTheme" data-v="${k}">${l}</button>`).join('')}</div><p class="hint">${(s.theme||'auto')==='auto'?'Sigue el modo claro u oscuro de tu móvil.':'Siempre en modo '+(s.theme==='dark'?'oscuro':'claro')+'.'}</p></div>`;
  const sOn=s.suggest!==false;
  h+=`<div class="field"><span class="label">Sugerencias</span><div class="toggle"><div><b style="font-weight:500">Sugerir combinaciones por color</b><p>Percha propone qué combina según una guía de color y el estilo de cada prenda. Tus marcas manuales siempre mandan.</p></div><button class="switch" role="switch" aria-checked="${sOn}" data-act="suggestToggle" aria-label="Sugerir combinaciones por color"></button></div>`;
  if(sOn)h+=`<div class="seg">${[['wide','Más variedad'],['strict','Solo clásicas']].map(([k,l])=>`<button class="pill${(s.suggestLevel||'wide')===k?' on':''}" data-act="setSuggestLevel" data-v="${k}">${l}</button>`).join('')}</div><p class="hint">${(s.suggestLevel||'wide')==='strict'?'Solo las combinaciones más seguras: neutros entre sí y pares de manual, como camiseta blanca con vaqueros o pantalón beige con calzado marrón.':'Incluye también combinaciones buenas con algo más de color, como granate con gris o verde con beige.'}</p><button class="btn block" data-act="colorGuide">Ver la guía de color</button>`;
  h+=`</div>`;
  h+=`<div class="field"><span class="label">Temporada</span><div class="seg">${[['auto','Automática'],['warm','Calor'],['cold','Frío'],['all','Todo']].map(([k,l])=>`<button class="pill${s.season===k?' on':''}" data-act="setSeason" data-v="${k}">${l}</button>`).join('')}</div><p class="hint">${s.season==='auto'?'Según el mes: calor de junio a septiembre, frío de noviembre a marzo. Ahora: '+(cs==='all'?'entretiempo, se muestra todo':SEASONS[cs].toLowerCase())+'.':'Se ocultan las prendas de la otra temporada.'}</p></div>`;
  h+=`<div class="card"><div class="setrow"><p>No repetir prenda<small>En el plan semanal</small></p><div class="stepper"><button data-act="stepSet" data-k="noRepeat" data-d="-1" aria-label="Menos">−</button><span>${s.noRepeat}</span><button data-act="stepSet" data-k="noRepeat" data-d="1" aria-label="Más">+</button></div></div>
  <div class="setrow"><p>Prenda olvidada<small>Días sin usar</small></p><div class="stepper"><button data-act="stepSet" data-k="forgotten" data-d="-7" aria-label="Menos">−</button><span>${s.forgotten}</span><button data-act="stepSet" data-k="forgotten" data-d="7" aria-label="Más">+</button></div></div></div>`;
  h+=`<div class="field"><span class="label">Tus reglas de color · opcional</span><p class="hint">Solo si quieres forzar que dos colores combinen aunque la guía no los proponga. Se aplica a todas las prendas con esos colores.</p>`;
  h+=S.rules.map((r,i)=>`<div class="row between" style="padding:6px 0"><span><span class="dot" style="background:${swatchBg(r[0])}"></span> ${cap(r[0])} &nbsp;+&nbsp; <span class="dot" style="background:${swatchBg(r[1])}"></span> ${cap(r[1])}</span><button class="iconbtn" data-act="delRule" data-i="${i}" aria-label="Quitar regla">${ic('x',18)}</button></div>`).join('');
  const opts=COLORS.map(([n])=>`<option value="${n}">${cap(n)}</option>`).join('');
  h+=`<div class="rulerow"><select class="sel" id="rule-a" aria-label="Primer color">${opts}</select><select class="sel" id="rule-b" aria-label="Segundo color">${opts.replace('value="beige"','value="beige" selected')}</select><button class="btn small" data-act="addRule">Añadir</button></div></div>`;
  h+=`<div class="field"><span class="label">Copia de seguridad</span><p class="hint">Todo se guarda solo en este móvil. Si borras los datos del navegador se pierde, así que guarda una copia de vez en cuando. ${s.lastExport?'Última copia: '+fmtShort(s.lastExport)+'.':'Aún no has hecho ninguna.'}</p><div class="row"><button class="btn" data-act="export">Exportar copia</button><button class="btn" data-act="importPick">Importar copia</button></div>${CAN_SHARE?`<button class="btn block" data-act="shareBackup" style="margin-top:8px">Compartir copia (Drive, WhatsApp…)</button>`:''}`;
  if(pendingImport)h+=`<div class="confirm"><p>La copia tiene ${pendingImport.items.length} prendas y ${(pendingImport.wears||[]).length} outfits. Sustituirá todo lo que hay ahora en la app.</p><div class="row"><button class="btn small primary" data-act="importDo">Sustituir</button><button class="btn small ghost" data-act="importCancel">Cancelar</button></div></div>`;
  h+=`</div>`;
  h+=`<div class="field"><span class="label">Datos</span>`;
  if(hasDemo())h+=`<button class="btn block" data-act="clearDemo">Borrar el armario de ejemplo</button>`;
  h+=confirmWipe?`<div class="confirm"><p>Se borrarán todas las prendas, fotos, combinaciones e historial. No se puede deshacer.</p><div class="row"><button class="btn small danger" style="background:var(--surface)" data-act="wipeDo">Borrar todo</button><button class="btn small ghost" data-act="wipeCancel">Cancelar</button></div></div>`:`<button class="btn ghost danger block" data-act="wipeAsk">Borrar todos los datos</button>`;
  h+=`</div><p class="hint" style="text-align:center">Percha · tus datos no salen de este dispositivo</p></div>`;
  openSheet(h,{tall:true,refresh:settingsSheet});
}
export function guideSheet(){
  const sw=list=>list.split(',').map(c=>`<span class="gsw" title="${cap(c)}"><span class="dot" style="background:${swatchBg(c)}"></span>${cap(c)}</span>`).join('');
  const block=(title,table,rows,label)=>`<div class="field"><span class="label">${title}</span>${rows.map(k=>{const r=table[k];return `<div class="grow"><b><span class="dot" style="background:${swatchBg(k)}"></span>${label(k)}</b><div class="gl"><span class="gk">Muy bien</span>${sw(r[0])}</div><div class="gl"><span class="gk">Bien</span>${sw(r[1])}</div></div>`}).join('')}</div>`;
  let h=sheetHead('Guía de color','<button class="link" data-act="settings">Atrás</button>')+`<div class="sh-body gut">`;
  h+=`<div class="stack"><p class="hint" style="font-size:14px;color:var(--fg)">Las sugerencias siguen cuatro reglas de las guías de estilo:</p><ol class="rules"><li><b>Neutros como base.</b> Blanco, negro, gris, beige, marrón y azul marino combinan con casi todo. Vaqueros, chinos beige y pantalón gris son los fondos más seguros.</li><li><b>Contraste.</b> Mejor claro con oscuro. Dos prendas del mismo tono, como dos azules casi iguales, parecen un error.</li><li><b>Un solo color llamativo.</b> Rojo, rosa, amarillo, naranja, morado, verde o estampado: uno por outfit, el resto neutro.</li><li><b>Calzado según el pantalón.</b> Marrón con azul, beige y oliva. Negro con negro y gris. Nunca negro con beige, oliva o marrón. Las zapatillas blancas valen casi siempre.</li></ol><p class="hint">Además, las prendas tienen que compartir estilo: no se sugiere una camisa solo formal con un jogger solo de deporte.</p></div>`;
  h+=block('Parte de arriba → pantalón',TB,Object.keys(TB),k=>'Arriba '+k);
  h+=block('Pantalón → calzado',BS,Object.keys(BS),k=>k==='_'?'Pantalón de otro color':'Pantalón '+k);
  h+=`</div>`;
  openSheet(h,{tall:true});
}
export function setD(v){D=v}

/* ----- lista de deseos ----- */
export let W=null;
const wishImg=w=>w.img?urlFor(w):svgDataURL(garmentSVG(defaultKind[w.cat],w.color));
export function wishSheet(){
  W=null;
  let h=sheetHead('Deseos','<button class="link" data-act="closeSheet">Cerrar</button>','<button class="link strong" data-act="wishNew">Añadir</button>')+`<div class="sh-body gut">`;
  h+=S.wishes.length?`<p class="sub" style="margin:0 0 12px">Lo que te gustaría tener. Toca uno para editarlo.</p><div class="stack">`+S.wishes.map(w=>`<button class="favrow wish" data-act="wishOpen" data-id="${w.id}"><span class="mini"><img src="${wishImg(w)}" alt="" class="${w.img?'cover':''}"></span><span class="favn"><b>${esc(w.name)}</b><br><span style="color:var(--muted)">${CATS[w.cat].label}${w.color?' · '+cap(w.color):''}${w.price?' · '+euro(w.price):''}</span>${w.note?`<br><span style="color:var(--muted)">${esc(w.note)}</span>`:''}${(()=>{const f=wishFit(w);return f.nocolor||w.cat==='acc'?'':`<br><span style="color:var(--accent)">Combina con ${f.items.length} · ${f.n} ${f.n===1?'outfit nuevo':'outfits nuevos'}</span>`})()}</span></button>`).join('')+`</div>`:`<p class="hint">Aún no tienes deseos. Pulsa «Añadir» para apuntar una prenda que te gustaría comprar.</p>`;
  openSheet(h+`</div>`,{tall:true,refresh:wishSheet});
}
export function wishFitHTML(w){
  const f=wishFit(w);
  if(f.nocolor)return `<p class="hint" style="margin:0">Elige un color para ver con qué prendas de tu armario combinaría.</p>`;
  if(w.cat==='acc')return `<p class="hint" style="margin:0">Los accesorios no entran en las combinaciones.</p>`;
  let h=`<p style="margin:0 0 8px;font-size:14px"><b>${f.items.length}</b> ${f.items.length===1?'prenda de tu armario combina':'prendas de tu armario combinan'} con él`+(w.cat!=='outer'||f.n?` · <b>${f.n}</b> ${f.n===1?'outfit nuevo':'outfits nuevos'}`:'')+`</p>`;
  if(f.items.length)h+=`<div class="thumbrow">${f.items.slice(0,8).map(i=>mini(i)).join('')}${f.items.length>8?`<span class="sub num">+${f.items.length-8}</span>`:''}</div>`;
  if(f.ex.length)h+=`<p class="hint" style="margin:10px 0 6px">Por ejemplo</p>`+f.ex.map(o=>`<div class="thumbrow" style="margin-bottom:6px">${o.map(i=>mini(i)).join('')}</div>`).join('');
  if(w.cat!=='outer'&&!f.n)h+=`<p class="hint" style="margin:8px 0 0">Todavía no completaría ningún outfit con tus prendas actuales.</p>`;
  return h;
}
export function wishFitRefresh(){const e=$('#w-fit');if(e&&W)e.innerHTML=wishFitHTML(W)}
export function wishOwn(){
  if(!W)return;const w=W;if(w._pu)URL.revokeObjectURL(w._pu);
  D={id:uid(),name:w.name,cat:w.cat,color:w.color,styles:w.styles.length?[...w.styles]:['casual'],season:'all',price:w.price??'',wild:false,laundry:false,hasPhoto:!!w.img,src:null,removeBg:false,tol:34,isNew:true,fit:'cover',fromWish:w.id};
  if(w.img){D.blob=w.img;D.thumb=w.img;D.newImg=true}
  W=null;drawEdit();
}
export function wishEdit(id){
  const w=S.wishes.find(x=>x.id===id);
  W=w?{...w,styles:[...(w.styles||[])],price:w.price??'',isNew:false,changed:false}:{id:uid(),name:'',cat:'top',color:'',styles:[],price:'',note:'',img:null,isNew:true,changed:false};
  drawWish();
}
export function drawWish(){
  const segs=(field,opts,multi)=>`<div class="seg">${opts.map(([k,l])=>`<button type="button" class="pill${(multi?W[field].includes(k):W[field]===k)?' on':''}" data-act="wseg" data-f="${field}" data-v="${k}">${l}</button>`).join('')}</div>`;
  let h=sheetHead(W.isNew?'Nuevo deseo':'Editar deseo','<button class="link" data-act="wishCancel">Cancelar</button>','<button class="link strong" data-act="wishSave">Guardar</button>')+`<div class="sh-body gut">`;
  h+=`<label class="photo${W.img?' has':''}" for="w-photo" id="w-box"><img id="w-prev" alt="" src="${wishPrev()}" class="${W.img?'cover':''}"><span class="ov">${ic('camera',16,1.8)}${W.img?'Cambiar foto':'Añadir foto (opcional)'}</span></label><input type="file" id="w-photo" accept="image/*" hidden>`;
  h+=`<div class="field"><label class="label" for="w-name">Nombre</label><input class="input" id="w-name" data-winput="name" value="${esc(W.name)}" placeholder="Jersey de lana gris" autocomplete="off"></div>`;
  h+=`<div class="field"><span class="label">Categoría</span>${segs('cat',CAT_ORDER.map(c=>[c,CATS[c].label]))}</div>`;
  h+=`<div class="field"><span class="label">Color <span id="w-color-name" style="text-transform:none;letter-spacing:0;color:var(--fg)">${W.color?'· '+cap(W.color):''}</span></span><div class="sw">${COLORS.map(([n])=>`<button type="button" class="swc${W.color===n?' on':''}" data-act="wcolor" data-v="${n}" style="background:${swatchBg(n)}" aria-label="${n}"></button>`).join('')}</div></div>`;
  h+=`<div class="field"><span class="label">Estilo</span>${segs('styles',Object.entries(STYLES),true)}</div>`;
  h+=`<div class="field"><span class="label">Con tu armario</span><div id="w-fit">${wishFitHTML(W)}</div></div>`;
  h+=`<div class="field"><label class="label" for="w-price">Precio estimado <span style="text-transform:none;letter-spacing:0">(opcional)</span></label><input class="input" id="w-price" data-winput="price" inputmode="decimal" value="${W.price??''}" placeholder="40"></div>`;
  h+=`<div class="field"><label class="label" for="w-note">Nota <span style="text-transform:none;letter-spacing:0">(opcional)</span></label><input class="input" id="w-note" data-winput="note" value="${esc(W.note||'')}" placeholder="Tienda, enlace, talla…" autocomplete="off"></div>`;
  if(!W.isNew)h+=`<button class="btn primary block" data-act="wishOwn" style="margin-top:8px">Ya lo tengo</button>`;
  if(!W.isNew)h+=`<button class="btn ghost block" data-act="wishDel" style="margin-top:8px">Quitar de deseos</button>`;
  openSheet(h+`</div>`,{tall:true});
}
function wishPrev(){
  if(W.img){if(W._pu&&W._pb===W.img)return W._pu;if(W._pu)URL.revokeObjectURL(W._pu);W._pb=W.img;W._pu=URL.createObjectURL(W.img);return W._pu}
  return svgDataURL(garmentSVG(defaultKind[W.cat],W.color));
}
export function wishSet(f,v,el){
  if(!W)return;
  if(f==='styles'){const i=W.styles.indexOf(v);if(i>=0)W.styles.splice(i,1);else W.styles.push(v);el&&el.classList.toggle('on')}
  else if(f==='cat'){W.cat=v;drawWish()}
  else W[f]=v;
  W.changed=true;
  if(f==='cat'||f==='color'){const im=$('#w-prev');if(im&&!W.img)im.src=wishPrev()}
  wishFitRefresh();
}
export function wishColorSync(c){
  if(!W)return;W.color=W.color===c?'':c;W.changed=true;
  document.querySelectorAll('.sheet .swc').forEach(b=>b.classList.toggle('on',b.dataset.v===W.color));
  const n=$('#w-color-name');if(n)n.textContent=W.color?'· '+cap(W.color):'';
  const im=$('#w-prev');if(im&&!W.img)im.src=wishPrev();
  wishFitRefresh();
}
export async function wishPhoto(file){
  if(!W)return;const box=$('#w-box');box&&box.classList.add('busy');
  try{
    const c=await blobToCanvas(file);W.img=await encodeCanvas(scaleCanvas(c,480),true);W.changed=true;
    const im=$('#w-prev');if(im){im.src=wishPrev();im.className='cover'}
    if(box)box.classList.add('has');const ov=box&&box.querySelector('.ov');if(ov)ov.lastChild.textContent='Cambiar foto';
  }catch(e){console.warn(e);toast('No se pudo leer esa foto')}
  box&&box.classList.remove('busy');
}
export function wishCancel(){if(W&&W._pu)URL.revokeObjectURL(W._pu);wishSheet()}
export async function wishSave(){
  if(!W)return;
  const name=(W.name||'').trim();if(!name){toast('Ponle un nombre');const i=$('#w-name');i&&i.focus();return}
  const price=Number(String(W.price).replace(',','.'));
  const w={id:W.id,name,cat:W.cat,color:W.color||'',styles:[...W.styles],price:price>0?price:null,note:(W.note||'').trim(),img:W.img||null,added:W.added||todayISO()};
  const i=S.wishes.findIndex(x=>x.id===w.id);if(i>=0)S.wishes[i]=w;else S.wishes.push(w);
  dropURLs(w.id);if(W._pu)URL.revokeObjectURL(W._pu);
  await saveWishes();toast('Deseo guardado');wishSheet();
}
export async function wishDelete(){
  if(!W)return;const old=S.wishes.find(x=>x.id===W.id);if(!old)return;
  S.wishes=S.wishes.filter(x=>x!==old);await saveWishes();wishSheet();
  toast('Deseo quitado',{label:'Deshacer',fn:async()=>{S.wishes.push(old);await saveWishes();if($('.scrim'))refreshSheet();else render()}});
}
