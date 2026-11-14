const CACHE_NAME='car-performance-published-v1.2.0';
const APP=['./','./index.html','./manifest.webmanifest','./car-escudo-oficial.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith('car-performance-published-')&&n!==CACHE_NAME).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 if(e.request.mode==='navigate'){
  e.respondWith(fetch(e.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put('./index.html',copy));}return res;}).catch(()=>caches.match('./index.html')));
 }else{
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));}return res;})));
 }
});