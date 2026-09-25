/// <reference lib="webworker" />
import {precacheAndRoute,cleanupOutdatedCaches,matchPrecache} from 'workbox-precaching';
declare let self:ServiceWorkerGlobalScope & {__WB_MANIFEST:Array<string|{url:string;revision:string|null}>};
precacheAndRoute(self.__WB_MANIFEST);cleanupOutdatedCaches();
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{if(event.request.mode!=='navigate')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin||url.pathname.startsWith('/.netlify/'))return;event.respondWith(fetch(event.request).catch(async()=>await matchPrecache('/index.html')??Response.error()))});
self.addEventListener('push',event=>{let data:{title?:string;body?:string;url?:string};try{data=event.data?.json()??{}}catch{data={}}event.waitUntil(self.registration.showNotification(data.title??'Langkah Si Kecil',{body:data.body??'Ada ide aktivitas hari ini.',icon:'/icon-192.png',data:{url:data.url??'/hari-ini'}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();const target=new URL(String(event.notification.data?.url??'/hari-ini'),self.location.origin);if(target.origin!==self.location.origin)return;event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{const tab=clients.find(c=>new URL(c.url).origin===target.origin);if(tab){await tab.navigate(target.href);return tab.focus()}return self.clients.openWindow(target.href)}))});
