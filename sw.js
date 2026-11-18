const CACHE='percha-v22';
const CORE=['./','./index.html','./styles.css','./js/app.js','./js/datos.js','./js/almacen.js','./js/motor.js','./js/vistas.js','./fonts/Geist.woff','./fonts/SourceSerif4.woff','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))))});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const url=new URL(r.url);
  if(r.mode==='navigate'){ // red primero para recibir actualizaciones, caché si no hay conexión
    e.respondWith((async()=>{ // red con límite de 3 s; si no llega, caché
      const ac=new AbortController(),t=setTimeout(()=>ac.abort(),3000);
      try{const res=await fetch(r,{signal:ac.signal});clearTimeout(t);if(res.ok){const c=res.clone();caches.open(CACHE).then(k=>k.put('./index.html',c))}return res}
      catch(_){clearTimeout(t);return (await caches.match('./index.html'))||Response.error()}
    })());return;
  }
  if(url.origin===location.origin){
    e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const c=res.clone();caches.open(CACHE).then(k=>k.put(r,c))}return res})));
  }
});
