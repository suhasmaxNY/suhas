const CACHE="suhas-pwa-v10";
const SHELL=["/","/ai/","/styles.css?v=20261127-homefix","/app.js?v=20261127-homefix","/ai/style.css?v=4","/ai/app.js?v=7","/manifest.webmanifest","/icon.svg"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)))});
self.addEventListener("message",event=>{if(event.data==="SUHAS_SKIP_WAITING")self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=="GET"||url.origin!==self.location.origin||url.pathname.startsWith("/api/"))return;
 if(req.mode==="navigate"){
  event.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res}).catch(async()=>await caches.match(req)||await caches.match(url.pathname==="/ai/"?"/ai/":"/")));
  return;
 }
 event.respondWith(caches.match(req).then(cached=>{
  const fresh=fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res});
  return cached||fresh;
 }));
});
