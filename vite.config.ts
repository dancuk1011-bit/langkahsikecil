import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';
import path from 'node:path';
export default defineConfig({plugins:[react(),VitePWA({strategies:'injectManifest',srcDir:'src',filename:'sw.ts',registerType:'prompt',injectRegister:null,injectManifest:{globPatterns:['**/*.{js,css,html,svg,png,json}']},manifest:{name:'Langkah Si Kecil',short_name:'Langkah Si Kecil',description:'Pendamping harian aktivitas bayi 0–12 bulan',start_url:'/hari-ini',scope:'/',display:'standalone',orientation:'portrait-primary',theme_color:'#6246EA',background_color:'#FFFFFF',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]}})],resolve:{alias:{'@':path.resolve(process.cwd())}},build:{outDir:'dist',emptyOutDir:true}});
