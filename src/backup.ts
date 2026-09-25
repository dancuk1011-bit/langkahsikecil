import {all,getSettings,replaceAll,saveSettings,type Child,type ActivityLog,type Observation,type Concern,type Favorite,type Settings} from './db';
import {contentVersion} from './content';
export interface Backup {fileType:'langkah-si-kecil-backup';schemaVersion:1;appVersion:string;contentVersion:string;exportedAt:string;children:Child[];activityLogs:ActivityLog[];observations:Observation[];concerns:Concern[];favorites:Favorite[];settings:Settings}
const validDate=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}/.test(v)&&!Number.isNaN(Date.parse(v));
const obj=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const id=(v:unknown):v is string=>typeof v==='string'&&v.length>0&&v.length<=120;
const str=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max;
export async function createBackup():Promise<Backup>{const [children,activityLogs,observations,concerns,favorites,settings]=await Promise.all([all<Child>('children'),all<ActivityLog>('activityLogs'),all<Observation>('observations'),all<Concern>('concerns'),all<Favorite>('favorites'),getSettings()]);const safeSettings={...settings,notificationEnabled:false};delete safeSettings.installationId;delete safeSettings.pushManageSecret;return{fileType:'langkah-si-kecil-backup',schemaVersion:1,appVersion:'1.0.0',contentVersion,exportedAt:new Date().toISOString(),children,activityLogs,observations,concerns,favorites,settings:safeSettings}}
export function downloadBackup(data:Backup){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`LangkahSiKecil-backup-${new Date().toISOString().slice(0,10)}.lskbackup`;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}
export function parseBackup(raw:string):Backup{
 if(raw.length>10_000_000)throw Error('Berkas backup terlalu besar (maksimal 10 MB).');
 let value:unknown;try{value=JSON.parse(raw)}catch{throw Error('Berkas tidak berisi JSON yang valid.')}
 if(!obj(value)||value.fileType!=='langkah-si-kecil-backup'||value.schemaVersion!==1||!validDate(value.exportedAt)||!str(value.contentVersion,100)||!str(value.appVersion,50))throw Error('Format atau versi backup tidak dikenali.');
 for(const k of ['children','activityLogs','observations','concerns','favorites']){const records=value[k];if(!Array.isArray(records)||records.length>50000)throw Error(`Data ${k} tidak valid.`);const ids=records.map(row=>obj(row)?row.id:null);if(new Set(ids).size!==ids.length)throw Error(`ID ${k} duplikat.`)}
 if((value.children as unknown[]).length>4)throw Error('Backup berisi lebih dari 4 profil anak.');
 if(!obj(value.settings)||value.settings.id!=='settings')throw Error('Pengaturan backup tidak valid.');
 const children=value.children as unknown[];
 for(const c of children)if(!obj(c)||!id(c.id)||!str(c.nickname,60)||!c.nickname||!validDate(c.dateOfBirth)||!['yes','no','unsure'].includes(String(c.prematurityStatus))||typeof c.useCorrectedAge!=='boolean'||!Array.isArray(c.focusDomains)||c.focusDomains.some(x=>!str(x,80)))throw Error('Profil anak dalam backup tidak valid.');
 const childIds=new Set(children.map(c=>(c as Child).id));
 for(const key of ['activityLogs','observations','concerns','favorites'])for(const row of value[key] as unknown[]){
  if(!obj(row)||!id(row.id)||!childIds.has(row.childId as string))throw Error(`Relasi ${key} pada backup tidak valid.`);
  if(key==='activityLogs'&&(!id(row.activityId)||!validDate(row.localDate)||!validDate(row.startedAt)||row.completedAt!==undefined&&!validDate(row.completedAt)||!obj(row.snapshot)||!str(row.snapshot.title,300)||!str(row.snapshot.primaryDomain,100)||!str(row.snapshot.benefitShort,1000)||row.note!==undefined&&!str(row.note,2000)))throw Error('Aktivitas pada backup tidak valid.');
  if(key==='observations'&&(!id(row.skillId)||!validDate(row.observedAt)||!['seen','not_seen','unsure','lost'].includes(String(row.status))))throw Error('Pengamatan pada backup tidak valid.');
  if(key==='concerns'&&(!str(row.category,100)||!str(row.note,2000)||!validDate(row.createdAt)))throw Error('Catatan pada backup tidak valid.');
  if(key==='favorites'&&!id(row.activityId))throw Error('Favorit pada backup tidak valid.');
 }
 const v=value as unknown as Backup;
 const safeSettings:Settings={id:'settings',schemaVersion:2,notificationEnabled:false,activeChildId:childIds.has(v.settings.activeChildId??'')?v.settings.activeChildId:children[0]?(children[0] as Child).id:undefined,lastBackupAt:validDate(v.settings.lastBackupAt)?v.settings.lastBackupAt:undefined};
 return {...v,settings:safeSettings};
}
export async function restoreBackup(data:Backup,merge=true){await replaceAll(data,merge);await saveSettings({notificationEnabled:false,lastBackupAt:new Date().toISOString()})}
