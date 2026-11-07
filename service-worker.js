// Offline shell for HTTPS installable PWA. No user recipes are cached in the service worker.
const CACHE='recetafit-iphone-v3.3.0-free';
const ASSETS=['./?v=3.3.0','./index.html?v=3.3.0','./app.js?v=3.3.0','./gemini-free.js?v=3.3.0','./offline-core.js?v=3.3.0','./styles.css?v=3.3.0','./manifest.webmanifest?v=3.3.0','./icon.svg'];
self.addEventListener('install', e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate', e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin||new URL(e.request.url).pathname.startsWith('/api/'))return;
 e.respondWith(fetch(new Request(e.request,{cache:'no-store'})).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));}return response;}).catch(()=>caches.match(e.request)));
});