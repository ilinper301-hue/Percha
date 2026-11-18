/* Percha · datos.js — Constantes, utilidades, iconos, ilustraciones y guía de color. */

/* ---------- constants ---------- */
export const CATS={
  top:{label:'Arriba',plural:'Partes de arriba',one:'parte de arriba'},
  bottom:{label:'Abajo',plural:'Partes de abajo',one:'parte de abajo'},
  shoes:{label:'Calzado',plural:'Calzado',one:'calzado'},
  outer:{label:'Abrigo',plural:'Abrigos',one:'abrigo'},
  acc:{label:'Accesorio',plural:'Accesorios',one:'accesorio'}
};
export const CAT_ORDER=['top','bottom','shoes','outer','acc'];
export const SLOTS=CAT_ORDER;
export const favKey=o=>SLOTS.map(k=>o&&o[k]||'').join('|');
export const RELS=[['top','bottom'],['bottom','shoes'],['top','outer']];
export const related=c=>RELS.filter(r=>r.includes(c)).map(r=>r[0]===c?r[1]:r[0]);
export const COLORS=[['negro','#1E1E1C'],['blanco','#F7F6F1'],['gris','#9C9B96'],['beige','#D9C8A7'],['marrón','#7B5338'],['azul marino','#25324F'],['azul','#4B74B2'],['celeste','#A8C6E4'],['verde','#4F7A52'],['oliva','#6F6B3A'],['rojo','#B3342C'],['granate','#6C2431'],['rosa','#E5A9B4'],['amarillo','#E2BF4D'],['naranja','#D7773B'],['morado','#6A4C88'],['estampado','conic']];
export const COLOR_HEX=Object.fromEntries(COLORS);
export const swatchBg=n=>COLOR_HEX[n]==='conic'?'conic-gradient(#B3342C,#E2BF4D,#4F7A52,#4B74B2,#6A4C88,#B3342C)':(COLOR_HEX[n]||'var(--line)');
export const STYLES={casual:'Casual',formal:'Formal',sport:'Deporte'};
export const SEASONS={all:'Todo el año',warm:'Calor',cold:'Frío'};
export const DOW=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
export const DOWS=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
export const MON=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export const MONS=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

/* ---------- helpers ---------- */
export const $=s=>document.querySelector(s);
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-5);
export const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
export const todayISO=()=>iso(new Date());
export const parseD=s=>new Date(s+'T12:00:00');
export const addDays=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return iso(d)};
export const diffDays=(a,b)=>Math.round((parseD(a)-parseD(b))/864e5);
export const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
export const fmtLong=s=>{const d=parseD(s);return cap(DOW[d.getDay()])+', '+d.getDate()+' de '+MON[d.getMonth()]};
export const fmtShort=s=>{const d=parseD(s);return DOWS[d.getDay()]+' '+d.getDate()+' '+MONS[d.getMonth()]};
export const ago=s=>{if(!s)return 'sin usar';const n=diffDays(todayISO(),s);if(n<=0)return 'hoy';if(n===1)return 'ayer';if(n<14)return 'hace '+n+' días';if(n<60)return 'hace '+Math.round(n/7)+' sem';return 'hace '+Math.round(n/30)+' meses'};
export const agoShort=s=>{if(!s)return 'nunca';const n=diffDays(todayISO(),s);return n<=0?'hoy':n+' d'};
export const euro=n=>n.toLocaleString('es-ES',{minimumFractionDigits:n<10?2:0,maximumFractionDigits:2})+' €';
export const pairKey=(a,b)=>[a,b].sort().join('|');
export const ICON={
  hanger:'<path d="M10 6.5a2 2 0 1 1 2.6 1.9c-.4.1-.6.5-.6.9V11"/><path d="M12 11 3.6 16.9a1.2 1.2 0 0 0 .7 2.1h15.4a1.2 1.2 0 0 0 .7-2.1L12 11Z"/>',
  closet:'<rect x="4.5" y="3" width="15" height="18" rx="2"/><path d="M12 3v18M9.5 11v2M14.5 11v2"/>',
  cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  bars:'<path d="M5.5 20v-7M12 20V5M18.5 20v-10"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  left:'<path d="m14.5 6-6 6 6 6"/>',right:'<path d="m9.5 6 6 6-6 6"/>',
  lock:'<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  shuffle:'<path d="M16 4h4v4M4 20 20 4M20 16v4h-4M15 15l5 5M4 4l5 5"/>',
  refresh:'<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>',
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  camera:'<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z"/><circle cx="12" cy="12.5" r="3.5"/>'
};
export const ic=(n,s=22,w=1.6)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

/* ---------- garment illustrations (used when there is no photo) ---------- */
export function garmentSVG(kind,colorName){
  let c=COLOR_HEX[colorName]||'#B9B6AC'; if(c==='conic')c='#8C7FA0';
  const s='rgba(0,0,0,.2)',a=`fill="${c}" stroke="${s}" stroke-width="2.5" stroke-linejoin="round"`,l=`fill="none" stroke="${s}" stroke-width="2.5" stroke-linecap="round"`;
  const P={
    tee:`<path d="M72 34 50 42 24 64l14 26 18-11v91h88V79l18 11 14-26-26-22-22-8c-6 11-16 16-28 16s-22-5-28-16Z" ${a}/><path d="M72 34c6 11 16 16 28 16s22-5 28-16" ${l}/>`,
    sweater:`<path d="M72 32 50 40c-12 6-18 18-20 32l-8 80 22 3 12-70v83h88V87l12 70 22-3-8-80c-2-14-8-26-20-32l-22-8c-6 10-16 14-28 14s-22-4-28-14Z" ${a}/><path d="M72 32c6 10 16 14 28 14s22-4 28-14M56 160h88" ${l}/>`,
    shirt:`<path d="M74 30 50 40c-12 6-18 18-20 32l-8 80 22 3 12-70v83h88V87l12 70 22-3-8-80c-2-14-8-26-20-32l-24-10-26 18Z" ${a}/><path d="M74 30l26 18 26-18M100 48v122M86 34l14 26 14-26" ${l}/><circle cx="100" cy="80" r="2.5" fill="${s}"/><circle cx="100" cy="104" r="2.5" fill="${s}"/><circle cx="100" cy="128" r="2.5" fill="${s}"/>`,
    pants:`<path d="M60 26h80l10 150h-42L100 82l-8 94H50Z" ${a}/><path d="M60 40h80M100 40v40" ${l}/>`,
    sneaker:`<path d="M30 124c0-22 10-34 30-36l34-2c8-12 22-16 34-6l18 18c18 4 30 12 30 26Z" ${a}/><path d="M26 124h154c2 12-4 20-14 20H38c-10 0-14-8-12-20Z" fill="#F4F2EC" stroke="${s}" stroke-width="2.5"/><path d="M98 92l10 10M110 86l10 10M122 84l10 10" ${l}/>`,
    boot:`<path d="M58 36h50v76l44 14c16 4 26 12 26 24H50l6-108Z" ${a}/><path d="M48 150h132c1 10-4 16-12 16H58c-8 0-11-6-10-16Z" fill="#3A2E25" stroke="${s}" stroke-width="2.5"/><path d="M58 52h50" ${l}/>`,
    jacket:`<path d="M70 28 48 38c-12 6-18 18-20 32l-8 84 24 3 12-72v87h88V85l12 72 24-3-8-84c-2-14-8-26-20-32l-22-10-30 22Z" ${a}/><path d="M70 28l30 22 30-22M100 50v122M70 28l16 40M130 28l-16 40M66 120h18M116 120h18" ${l}/>`,
    cap:`<path d="M40 124c0-40 26-62 60-62s60 22 60 62Z" ${a}/><path d="M40 124c40 6 100 4 146-6-4 14-18 20-36 21-40 3-76 0-110-5Z" ${a}/><path d="M100 62v62" ${l}/>`
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${P[kind]||P.tee}</svg>`;
}
export const defaultKind={top:'tee',bottom:'pants',shoes:'sneaker',outer:'jacket',acc:'cap'};
export const svgBlob=svg=>new Blob([svg],{type:'image/svg+xml'});
export const svgDataURL=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
/* Guía de color: [combinan muy bien, combinan bien]. Basada en guías de estilo masculino:
   neutros como base, contraste entre prendas, un solo color llamativo, calzado según el pantalón. */
export const TB={
  'blanco':['azul,azul marino,negro,gris,beige,oliva','marrón,verde,granate,celeste,rojo,rosa,amarillo,naranja,morado,estampado'],
  'negro':['gris,beige,azul,blanco','negro,oliva,granate,verde,rojo,celeste,estampado'],
  'gris':['azul,azul marino,negro,blanco','beige,granate,oliva,celeste,rosa,morado'],
  'beige':['azul,azul marino,marrón,oliva,blanco','negro,gris,verde,granate'],
  'marrón':['beige,azul,blanco','oliva,azul marino,gris,celeste,verde'],
  'azul marino':['beige,gris,blanco,oliva','azul,granate,marrón,celeste,rosa,verde,rojo'],
  'azul':['blanco,beige,gris','azul marino,negro,marrón,oliva'],
  'celeste':['azul marino,beige,gris,blanco','azul,negro,marrón'],
  'verde':['beige,blanco,azul','negro,gris,marrón,azul marino'],
  'oliva':['beige,blanco,azul,azul marino','negro,marrón,gris,granate'],
  'rojo':['azul,negro,gris,blanco','beige,azul marino'],
  'granate':['gris,beige,azul,blanco','negro,azul marino,oliva'],
  'rosa':['azul,azul marino,gris,blanco,beige','negro'],
  'amarillo':['blanco,azul,azul marino','oliva,gris,beige'],
  'naranja':['azul,azul marino,blanco,beige','marrón,gris'],
  'morado':['azul marino,gris,negro,blanco','beige,azul'],
  'estampado':['azul,negro,beige,gris,blanco,azul marino','oliva,marrón']
};
export const BS={
  'negro':['negro,blanco','gris,granate'],
  'gris':['negro,blanco','marrón,granate,azul marino'],
  'azul marino':['marrón,blanco,beige','granate,gris'],
  'azul':['blanco,marrón','beige,negro,gris,granate,azul marino'],
  'beige':['marrón,blanco','azul marino,granate,beige,gris,verde'],
  'oliva':['marrón,blanco','beige,granate,azul marino'],
  'verde':['marrón,blanco','beige'],
  'marrón':['blanco','marrón,beige,granate'],
  'blanco':['marrón,beige,azul marino','blanco,negro,gris'],
  'granate':['marrón,blanco','negro,beige'],
  'rojo':['blanco','negro,marrón,beige'],
  'estampado':['blanco','negro,marrón'],
  '_':['blanco','marrón,beige,negro,gris']
};
export const NEUTRAL=new Set(['negro','blanco','gris','beige','marrón','azul marino']);
export const BOLD=new Set(['rojo','rosa','amarillo','naranja','morado','verde','estampado']);
export const BASE_BOTTOMS=new Set(['negro','gris','azul','azul marino','beige','blanco']);
export const inList=(s,c)=>s.split(',').includes(c);
