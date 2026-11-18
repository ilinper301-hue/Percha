/* Percha · almacen.js — Estado, IndexedDB, imágenes y copia de seguridad. */
import {$,CATS,SEASONS,SLOTS,STYLES,addDays,cap,defaultKind,garmentSVG,pairKey,svgBlob,todayISO,uid} from './datos.js';
import {computeStats} from './motor.js';
import {applyTheme,refreshSheet,render,toast} from './vistas.js';

/* ---------- state ---------- */
export const S={
  items:[],pairs:new Set(),rules:[],wears:[],plan:{},favs:[],
  blocks:new Set(),
  settings:{season:'auto',noRepeat:3,forgotten:21,lastExport:null,theme:'auto',suggest:true,suggestLevel:'wide'},
  view:'hoy',flow:{active:false,step:0,top:null,bottom:null,shoes:null,outer:null,acc:null,target:null},
  armCat:'top',armSort:'recent',armLaundry:false,armQ:'',armColor:'',armStyle:'',armFilt:false,armSel:null,armDel:false,dataCat:'all',dataSort:'most',week:0,noStore:false
};
export const get=id=>id?S.items.find(i=>i.id===id):null;
/* ---------- storage (IndexedDB, all on this phone) ---------- */
export let db=null;
export function idbOpen(){return new Promise((res,rej)=>{try{const r=indexedDB.open('percha',1);r.onupgradeneeded=()=>{const d=r.result;for(const s of['items','wears','kv'])if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}})}
export function tx(store,mode,fn){if(!db)return Promise.resolve();return new Promise((res,rej)=>{try{const t=db.transaction(store,mode);const out=fn(t.objectStore(store));t.oncomplete=()=>res(out&&out.result);t.onerror=()=>rej(t.error)}catch(e){rej(e)}})}
export const warn=e=>{console.warn(e);if(!S._warned){S._warned=true;toast('No se pudo guardar en este navegador')}};
export const put=(s,v)=>tx(s,'readwrite',st=>st.put(v)).catch(warn);
export const del=(s,k)=>tx(s,'readwrite',st=>st.delete(k)).catch(warn);
export const getAll=s=>tx(s,'readonly',st=>st.getAll()).catch(()=>[]);
export const clearStore=s=>tx(s,'readwrite',st=>st.clear()).catch(warn);
export const saveKV=(k,v)=>put('kv',{id:k,v});
export const savePairs=()=>{saveKV('blocks',[...S.blocks]);return saveKV('pairs',[...S.pairs])};
export const saveRules=()=>saveKV('rules',S.rules);
export const savePlan=()=>saveKV('plan',S.plan);
export const saveFavs=()=>saveKV('favs',S.favs);
export const saveSettings=()=>saveKV('settings',S.settings);

/* object URLs for images */
export const URLS=new Map();
export function urlFor(it,small){if(!it)return '';const b=small&&it.thumb?it.thumb:it.img;if(!b)return '';const key=it.id+(b===it.thumb?'#t':'');const c=URLS.get(key);if(c&&c.blob===b)return c.url;if(c)URL.revokeObjectURL(c.url);const url=URL.createObjectURL(b);URLS.set(key,{blob:b,url});return url}
export function dropURLs(id){for(const k of [id,id+'#t']){const u=URLS.get(k);if(u){URL.revokeObjectURL(u.url);URLS.delete(k)}}}
export const imgTag=(it,small)=>it?`<img src="${urlFor(it,small)}" alt="" loading="lazy" class="${it.fit==='cover'?'cover':''}">`:'';
export const mini=(it,extra='')=>`<span class="mini" ${extra}>${it?imgTag(it,true):''}</span>`;

/* image sizes: full photo for detail and outfit card, thumbnail for lists and grids */
export const IMG_MAX=800,THUMB_MAX=320;
export function scaleCanvas(src,max){const s=Math.min(1,max/Math.max(src.width,src.height));if(s===1)return src;const c=document.createElement('canvas');c.width=Math.max(1,Math.round(src.width*s));c.height=Math.max(1,Math.round(src.height*s));const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(src,0,0,c.width,c.height);return c}
export const toBlob=(c,type,q)=>new Promise(r=>c.toBlob(r,type,q));
export let WEBP=null; /* null = not tested yet; Safari can't encode WebP and returns PNG instead */
export async function encodeCanvas(c,alpha){
  if(WEBP!==false){const b=await toBlob(c,'image/webp',.82);WEBP=!!b&&b.type==='image/webp';if(WEBP)return b}
  return toBlob(c,alpha?'image/png':'image/jpeg',.86);
}
export async function blobToCanvas(b){const url=URL.createObjectURL(b);try{const im=new Image();await new Promise((r,j)=>{im.onload=r;im.onerror=j;im.src=url});const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);return c}finally{URL.revokeObjectURL(url)}}
export async function makeThumb(blob,alpha){const c=await blobToCanvas(blob);return encodeCanvas(scaleCanvas(c,THUMB_MAX),alpha)}
export const needsThumb=it=>!it.illus&&it.img&&!it.thumb;
export async function ensureThumbs(){let n=0;for(const it of S.items){if(!needsThumb(it))continue;try{it.thumb=await makeThumb(it.img,it.fit!=='cover');await put('items',it);n++}catch(e){console.warn(e)}}if(n&&!$('.scrim'))render();return n}
export function blobToDataURL(b){return new Promise((r,j)=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=j;fr.readAsDataURL(b)})}
export function dataURLToBlob(u){const [h,b]=u.split(',');const mime=(h.match(/data:([^;,]+)/)||[])[1]||'application/octet-stream';if(/;base64/.test(h)){const bin=atob(b),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime})}return new Blob([decodeURIComponent(b)],{type:mime})}
/* minimal ZIP (method "store", no compression: photos are already compressed) */
export const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
export function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRC_T[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
export async function makeZip(files){ /* files: [{name, blob}] → Blob */
  const enc=new TextEncoder(),d=new Date(),dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1)),dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate());
  const parts=[],cd=[];let off=0;
  for(const f of files){
    const name=enc.encode(f.name),data=new Uint8Array(await f.blob.arrayBuffer()),crc=crc32(data),size=data.length;
    const h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,10,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,dt,true);h.setUint16(12,dd,true);h.setUint32(14,crc,true);h.setUint32(18,size,true);h.setUint32(22,size,true);h.setUint16(26,name.length,true);h.setUint16(28,0,true);
    parts.push(h,name,f.blob);
    const c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,10,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,dt,true);c.setUint16(14,dd,true);c.setUint32(16,crc,true);c.setUint32(20,size,true);c.setUint32(24,size,true);c.setUint16(28,name.length,true);c.setUint32(42,off,true);
    cd.push(c,name);off+=30+name.length+size;
  }
  const cdSize=cd.reduce((n,x)=>n+x.byteLength,0),e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cdSize,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cd,e],{type:'application/zip'});
}
export async function readZip(file){ /* → Map name → Uint8Array (store only, CRC checked) */
  const tail=new DataView(await file.slice(Math.max(0,file.size-65557)).arrayBuffer());
  let p=-1;for(let i=tail.byteLength-22;i>=0;i--)if(tail.getUint32(i,true)===0x06054b50){p=i;break}
  if(p<0)throw new Error('zip: sin directorio');
  const n=tail.getUint16(p+10,true),cdSize=tail.getUint32(p+12,true),cdOff=tail.getUint32(p+16,true);
  const cd=new DataView(await file.slice(cdOff,cdOff+cdSize).arrayBuffer()),dec=new TextDecoder(),out=new Map();
  for(let i=0,q=0;i<n;i++){
    if(cd.getUint32(q,true)!==0x02014b50)throw new Error('zip: directorio dañado');
    const method=cd.getUint16(q+10,true),crc=cd.getUint32(q+16,true),size=cd.getUint32(q+20,true),nl=cd.getUint16(q+28,true),xl=cd.getUint16(q+30,true),cl=cd.getUint16(q+32,true),lo=cd.getUint32(q+42,true);
    const name=dec.decode(new Uint8Array(cd.buffer,q+46,nl));q+=46+nl+xl+cl;
    if(name.endsWith('/'))continue;
    if(method!==0)throw new Error('zip: comprimido');
    const lh=new DataView(await file.slice(lo,lo+30).arrayBuffer());const start=lo+30+lh.getUint16(26,true)+lh.getUint16(28,true);
    const data=new Uint8Array(await file.slice(start,start+size).arrayBuffer());
    if(crc32(data)!==crc)throw new Error('zip: archivo dañado '+name);
    out.set(name,data);
  }
  return out;
}
export const CAN_SHARE=(()=>{try{return !!(navigator.share&&navigator.canShare&&navigator.canShare({files:[new File([''],'a.zip',{type:'application/zip'})]}))}catch(e){return false}})();
export const EXT={'image/webp':'webp','image/png':'png','image/jpeg':'jpg','image/svg+xml':'svg'},MIME=Object.fromEntries(Object.entries(EXT).map(([m,e])=>[e,m]));
export async function readBackup(file){ /* .zip (version 2) or old .json (version 1) → data with img as Blob or data URL */
  const sig=new Uint8Array(await file.slice(0,2).arrayBuffer());
  let data;
  if(sig[0]===0x50&&sig[1]===0x4b){
    const z=await readZip(file),j=z.get('data.json');if(!j)throw new Error('zip sin data.json');
    data=JSON.parse(new TextDecoder().decode(j));
    for(const it of (Array.isArray(data.items)?data.items:[])){if(typeof it.img==='string'&&!it.img.startsWith('data:')){const b=z.get(it.img);it.img=b?new Blob([b],{type:MIME[it.img.split('.').pop()]||''}):null}}
  }else data=JSON.parse(await file.text());
  if(!data||data.app!=='percha'||!Array.isArray(data.items))throw new Error('no es Percha');
  return data;
}
export async function exportData(share){
  const files=[],items=S.items.map(({thumb,...it})=>{if(!it.img)return {...it,img:null};const name=`fotos/${it.id}.${EXT[it.img.type]||'bin'}`;files.push({name,blob:it.img});return {...it,img:name}});
  const data={app:'percha',version:2,exported:new Date().toISOString(),items,pairs:[...S.pairs],blocks:[...S.blocks],rules:S.rules,wears:S.wears,plan:S.plan,favs:S.favs,settings:S.settings};
  files.unshift({name:'data.json',blob:new Blob([JSON.stringify(data)],{type:'application/json'})});
  const blob=await makeZip(files);
  const fname=`percha-copia-${todayISO()}.zip`;
  if(share){
    const file=new File([blob],fname,{type:'application/zip'});
    try{await navigator.share({files:[file],title:'Copia de Percha'})}
    catch(e){if(e&&e.name==='AbortError')return;console.warn(e);return toast('No se pudo compartir. Prueba con Exportar')}
    S.settings.lastExport=todayISO();saveSettings();toast('Copia compartida');refreshSheet();if(!$('.scrim'))render();return;
  }
  const dl=window.claude&&window.claude.use?await window.claude.use('downloads').catch(()=>null):null;
  if(dl){try{await dl.save({filename:fname,data:blob})}catch(e){return toast('No se guardó la copia')}S.settings.lastExport=todayISO();saveSettings();toast('Copia guardada');refreshSheet();if(!$('.scrim'))render();return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fname;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  S.settings.lastExport=todayISO();saveSettings();toast('Copia exportada a Descargas');refreshSheet();if(!$('.scrim'))render();
}
/* checks and cleans a backup in memory; throws before anything is touched */
export function cleanBackup(data){
  const isStr=v=>typeof v==='string',isObj=v=>v&&typeof v==='object'&&!Array.isArray(v),isDate=v=>isStr(v)&&/^\d{4}-\d{2}-\d{2}$/.test(v);
  if(!isObj(data)||data.app!=='percha'||!Array.isArray(data.items))throw new Error('estructura');
  const ids=new Set(),items=[];
  for(const r of data.items){
    if(!isObj(r)||!isStr(r.id)||!r.id||ids.has(r.id)||!CATS[r.cat])continue;
    ids.add(r.id);
    const {thumb,...it}=r;
    const price=Number(it.price);
    items.push({...it,name:isStr(it.name)?it.name:CATS[it.cat].label,color:isStr(it.color)?it.color:'',
      styles:Array.isArray(it.styles)?it.styles.filter(x=>STYLES[x]):['casual'],season:SEASONS[it.season]?it.season:'all',
      price:price>0?price:null,wild:!!it.wild,laundry:!!it.laundry,added:isDate(it.added)?it.added:todayISO(),fit:it.fit==='cover'?'cover':'contain',
      img:it.img instanceof Blob?it.img:isStr(it.img)&&it.img.startsWith('data:')?dataURLToBlob(it.img):null});
  }
  if(!items.length&&data.items.length)throw new Error('ninguna prenda válida');
  for(const it of items)if(!it.img){it.img=svgBlob(garmentSVG(defaultKind[it.cat],it.color));it.illus=true}
  const wears=(Array.isArray(data.wears)?data.wears:[]).filter(w=>isObj(w)&&isStr(w.id)&&isDate(w.date)).map(w=>{const o={id:w.id,date:w.date};for(const k of SLOTS)o[k]=ids.has(w[k])?w[k]:null;return o});
  const pairs=(Array.isArray(data.pairs)?data.pairs:[]).filter(k=>isStr(k)&&k.split('|').every(x=>ids.has(x)));
  const blocks=(Array.isArray(data.blocks)?data.blocks:[]).filter(k=>isStr(k)&&k.split('|').every(x=>ids.has(x)));
  const rules=(Array.isArray(data.rules)?data.rules:[]).filter(r=>Array.isArray(r)&&r.length===2&&r.every(isStr));
  const plan={};if(isObj(data.plan))for(const [d,v] of Object.entries(data.plan))if(isDate(d)&&isObj(v)){const o={style:STYLES[v.style]?v.style:undefined};for(const k of SLOTS)if(ids.has(v[k]))o[k]=v[k];plan[d]=o}
  const favs=[],seenF=new Set();for(const f of (Array.isArray(data.favs)?data.favs:[])){if(!isObj(f)||!isStr(f.id))continue;const o={id:f.id};for(const k of SLOTS)o[k]=ids.has(f[k])?f[k]:null;const key=SLOTS.map(k=>o[k]||'').join('|');if(!o.top||!o.bottom||!o.shoes||seenF.has(key))continue;seenF.add(key);favs.push(o)}
  const st=isObj(data.settings)?data.settings:{},settings={};
  for(const k of Object.keys(S.settings)){if(!(k in st))continue;if(k==='lastExport'){if(st[k]===null||isDate(st[k]))settings[k]=st[k]}else if(typeof st[k]===typeof S.settings[k])settings[k]=st[k]}
  if(!['auto','light','dark'].includes(settings.theme))delete settings.theme;
  return {items,wears,pairs,blocks,rules,plan,favs,settings};
}
export async function applyImport(raw){
  const data=cleanBackup(raw); /* if anything is wrong this throws and the current data stays */
  for(const s of['items','wears','kv'])await clearStore(s);
  for(const v of URLS.values())URL.revokeObjectURL(v.url);URLS.clear();
  S.items=data.items;S.pairs=new Set(data.pairs);S.blocks=new Set(data.blocks);S.rules=data.rules;S.wears=data.wears;S.plan=data.plan;S.favs=data.favs;S.settings={...S.settings,...data.settings};
  for(const it of S.items)await put('items',it);for(const w of S.wears)await put('wears',w);
  savePairs();saveRules();savePlan();saveFavs();saveSettings();saveKV('seeded',true);computeStats();
  applyTheme(S.settings.theme||'auto');
  ensureThumbs();
}

/* ---------- example wardrobe (first run only) ---------- */
export async function seedDemo(){
  const t=todayISO(),added=addDays(t,-45);
  const mk=(name,cat,kind,color,styles,season='all',wild=false,price=null)=>({id:uid(),name,cat,kind,color,styles,season,wild,price,laundry:false,added,demo:true,illus:true,fit:'contain',img:svgBlob(garmentSVG(kind,color))});
  const I={
    tw:mk('Camiseta blanca','top','tee','blanco',['casual','sport'],'all',true,12),
    tb:mk('Camiseta negra','top','tee','negro',['casual'],'all',false,12),
    tn:mk('Camiseta marino','top','tee','azul marino',['casual'],'warm',false,15),
    sg:mk('Jersey gris','top','sweater','gris',['casual','formal'],'cold',false,39),
    sv:mk('Sudadera verde','top','sweater','verde',['casual','sport'],'cold',false,30),
    sc:mk('Camisa celeste','top','shirt','celeste',['formal','casual'],'all',false,35),
    pj:mk('Vaqueros','bottom','pants','azul',['casual'],'all',true,50),
    pc:mk('Chinos beige','bottom','pants','beige',['casual','formal'],'all',false,40),
    pn:mk('Pantalón negro','bottom','pants','negro',['formal'],'all',false,45),
    pg:mk('Jogger gris','bottom','pants','gris',['sport','casual'],'all',false,25),
    zw:mk('Zapatillas blancas','shoes','sneaker','blanco',['casual','sport'],'all',true,80),
    zn:mk('Zapatillas negras','shoes','sneaker','negro',['casual','formal','sport'],'all',false,70),
    bm:mk('Botas marrones','shoes','boot','marrón',['casual','formal'],'cold',false,110),
    ab:mk('Abrigo marino','outer','jacket','azul marino',['casual','formal'],'cold',false,120),
    gc:mk('Gorra negra','acc','cap','negro',['casual','sport'],'all',false,18)
  };
  const P=[['tb','pc'],['tb','pn'],['tn','pc'],['sg','pc'],['sg','pn'],['sv','pg'],['sc','pc'],['sc','pn'],['pc','zn'],['pc','bm'],['pn','zn'],['pn','bm'],['pg','zn'],['sg','ab'],['sc','ab'],['tb','ab']];
  const W=[[-1,'tw','pj','zw'],[-2,'sc','pc','zn'],[-3,'sv','pg','zw'],[-5,'tb','pj','zw'],[-6,'tw','pc','zn'],[-8,'sg','pn','bm'],[-9,'tw','pj','zw'],[-11,'sc','pn','zn'],[-13,'tb','pc','bm'],[-15,'tw','pj','zw'],[-17,'sv','pj','zw'],[-20,'tw','pj','zw']];
  S.items=Object.values(I);S.pairs=new Set(P.map(([a,b])=>pairKey(I[a].id,I[b].id)));
  S.wears=W.map(([o,a,b,c])=>({id:uid(),date:addDays(t,o),top:I[a].id,bottom:I[b].id,shoes:I[c].id,outer:null,acc:null}));
  for(const it of S.items)await put('items',it);for(const w of S.wears)await put('wears',w);
  await savePairs();await saveKV('seeded',true);
}

export function setDb(v){db=v}
