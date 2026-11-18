/* Percha · motor.js — Estadísticas, compatibilidad, combinaciones y generación de la semana. */
import {BASE_BOTTOMS,BOLD,BS,NEUTRAL,TB,outfitIds,addDays,diffDays,inList,pairKey,parseD,todayISO} from './datos.js';
import {S,del,savePlan} from './almacen.js';

export let ST={};
/* ---------- logic ---------- */
export function computeStats(){ST={};for(const it of S.items)ST[it.id]={uses:0,last:null};for(const w of S.wears)for(const id of outfitIds(w)){if(ST[id]){ST[id].uses++;if(!ST[id].last||w.date>ST[id].last)ST[id].last=w.date}}}
export const usesOf=id=>ST[id]?ST[id].uses:0;
export const lastOf=id=>ST[id]?ST[id].last:null;
export function currentSeason(){const s=S.settings.season;if(s!=='auto')return s;const m=new Date().getMonth();if([5,6,7,8].includes(m))return 'warm';if([10,11,0,1,2].includes(m))return 'cold';return 'all'}
export const inSeason=it=>{const c=currentSeason();return c==='all'||it.season==='all'||it.season===c};
export const available=it=>!it.laundry&&inSeason(it);
export const ruleMatch=(a,b)=>S.rules.some(r=>(r[0]===a.color&&r[1]===b.color)||(r[0]===b.color&&r[1]===a.color));
export function colorScore(top,bot,cat){ // cat: relación ('tb','bs','to')
  if(cat==='tb'){const r=TB[top];if(!r)return 0;return inList(r[0],bot)?3:inList(r[1],bot)?2:0}
  if(cat==='bs'){const r=BS[top]||BS._;if(inList(r[0],bot))return 3;if(inList(r[1],bot))return 2;if(NEUTRAL.has(bot))return 0;return BASE_BOTTOMS.has(top)?2:0}
  // abrigo sobre parte de arriba
  if(top===bot)return 1;const outerN=NEUTRAL.has(bot)||bot==='oliva'||bot==='granate';
  if(outerN)return NEUTRAL.has(top)||top==='celeste'?3:2;return NEUTRAL.has(top)?2:0;
}
export const styleOK=(a,b)=>{const A=a.styles||[],B=b.styles||[];return !A.length||!B.length||A.some(s=>B.includes(s))};
export function suggestScore(a,b){
  if(S.settings.suggest===false||!a.color||!b.color||!styleOK(a,b))return 0;
  const o={};o[a.cat]=a;o[b.cat]=b;let s=0;
  if(o.top&&o.bottom)s=colorScore(o.top.color,o.bottom.color,'tb');
  else if(o.bottom&&o.shoes)s=colorScore(o.bottom.color,o.shoes.color,'bs');
  else if(o.top&&o.outer)s=colorScore(o.top.color,o.outer.color,'to');
  return s>=(S.settings.suggestLevel==='strict'?3:2)?s:0;
}
export function compatReason(a,b){if(!a||!b)return null;const k=pairKey(a.id,b.id);if(S.blocks.has(k))return null;if(S.pairs.has(k))return 'pair';if(a.wild||b.wild)return 'wild';if(a.color&&b.color&&ruleMatch(a,b))return 'rule';if(suggestScore(a,b))return 'suggest';return null}
export const compatible=(a,b)=>!!compatReason(a,b);
export const byFresh=(a,b)=>(lastOf(a.id)||'0').localeCompare(lastOf(b.id)||'0')||a.name.localeCompare(b.name,'es');
export function combos(filter){const f=filter||available;const T=S.items.filter(i=>i.cat==='top'&&f(i)),B=S.items.filter(i=>i.cat==='bottom'&&f(i)),H=S.items.filter(i=>i.cat==='shoes'&&f(i));const out=[];for(const t of T)for(const b of B){if(!compatible(t,b))continue;for(const h of H){if(!compatible(b,h))continue;if(!outfitOK(t,b,h))continue;out.push([t,b,h])}}return out}
// Reglas del outfit completo: un solo color llamativo y nada de las tres prendas del mismo color, salvo que tú lo hayas marcado.
export function outfitOK(t,b,h){const mine=S.pairs.has(pairKey(t.id,b.id))&&S.pairs.has(pairKey(b.id,h.id));if(mine)return true;const cs=[t.color,b.color,h.color];if(cs.filter(c=>BOLD.has(c)).length>1)return false;if(cs[0]&&cs[0]===cs[1]&&cs[1]===cs[2]&&cs[0]!=='negro')return false;return true}
export function forgottenList(){const N=S.settings.forgotten,t=todayISO();return S.items.map(it=>{const l=lastOf(it.id);const ref=l||it.added||t;return {it,days:diffDays(t,ref),never:!l}}).filter(x=>x.days>=N).sort((a,b)=>b.days-a.days)}
export const hasDemo=()=>S.items.some(i=>i.demo);

export function weekDates(){const t=todayISO(),dow=(parseD(t).getDay()+6)%7,mon=addDays(t,-dow+S.week*7);return [...Array(7)].map((_,i)=>addDays(mon,i))}
export function usageAround(d,N){const m={};const note=(o,dd)=>{if(dd===d)return;const dist=Math.abs(diffDays(d,dd));if(dist>N)return;for(const id of outfitIds(o)){if((m[id]===undefined||dist<m[id]))m[id]=dist}};for(const w of S.wears)note(w,w.date);for(const [dd,p] of Object.entries(S.plan))if(p.top&&!S.wears.some(w=>w.date===dd))note(p,dd);return m}
export function generate(dates){
  const N=S.settings.noRepeat,t=todayISO();let fails=0;
  const maxU=Math.max(1,...Object.values(ST).map(s=>s.uses));
  for(const d of dates){
    const cur=S.plan[d]||{};if(cur.locked||d<t)continue;
    const style=cur.style||'';
    const cs=combos(it=>available(it)&&(!style||(it.styles||[]).includes(style)));
    if(!cs.length){S.plan[d]={style};fails++;continue}
    const used=usageAround(d,N);let best=null,bs=Infinity;
    for(const [tp,bt,sh] of cs){
      let sc=Math.random()*6;
      for(const [it,wt] of [[tp,100],[bt,40],[sh,8]]){const dist=used[it.id];if(dist!==undefined)sc+=wt*(N+1-dist);sc+=usesOf(it.id)/maxU*12}
      if(sc<bs){bs=sc;best=[tp,bt,sh]}
    }
    S.plan[d]={top:best[0].id,bottom:best[1].id,shoes:best[2].id,style};
  }
  savePlan();return fails;
}

