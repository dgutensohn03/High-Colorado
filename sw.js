const VERSION='high-colorado-v1.7-living-data';
const STATIC_CACHE=`${VERSION}-static`;
const RUNTIME_CACHE=`${VERSION}-runtime`;
const APP_SHELL=['./','./index.html','./offline.html','./manifest.webmanifest','./icons/icon-192.svg','./icons/icon-512.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(STATIC_CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>!k.startsWith(VERSION)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(r=>{const copy=r.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(event.request,copy));return r}).catch(async()=>await caches.match(event.request)||await caches.match('./index.html')||await caches.match('./offline.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(r=>{if(r && (r.ok || r.type==='opaque')){const copy=r.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(event.request,copy))}return r}).catch(()=>cached)));
});
self.addEventListener('push',event=>{
  let data={title:'High Colorado',body:'Your mountain plan has an update.',url:'./'};
  try{data={...data,...event.data.json()}}catch{}
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'./icons/icon-192.svg',badge:'./icons/icon-192.svg',data:{url:data.url||'./'},tag:data.tag||'high-colorado-update'}));
});
self.addEventListener('notificationclick',event=>{event.notification.close();const target=event.notification.data?.url||'./';event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus'in c){c.navigate(target);return c.focus()}}return clients.openWindow(target)}))});
