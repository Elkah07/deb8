const CACHE_NAME='deb8-v35-clean';
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE_NAME)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||e.request.headers.has('range'))return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin)return;
  e.respondWith(fetch(e.request).then(async r=>{
    if(r.ok&&r.status!==206){
      try{const c=await caches.open(CACHE_NAME);await c.put(e.request,r.clone())}catch(_){}
    }
    return r
  }).catch(()=>caches.match(e.request)))
});
