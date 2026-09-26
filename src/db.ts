import {openDB, type IDBPDatabase} from 'idb';
export type ResponseKind='enjoyed'|'tried'|'not_interested'|'tired';
export interface Child {id:string; nickname:string; dateOfBirth:string; prematurityStatus:'yes'|'no'|'unsure'; gestationalAgeWeeks?:number; gestationalAgeDays?:number; estimatedDueDate?:string; useCorrectedAge:boolean; focusDomains:string[]; createdAt:string; updatedAt:string}
export interface ActivityLog {id:string; childId:string; activityId:string; contentVersion:string; startedAt:string; completedAt?:string; localDate:string; response?:ResponseKind; note?:string; snapshot:{title:string;primaryDomain:string;benefitShort:string}}
export interface Observation {id:string;childId:string;skillId:string;status:'seen'|'not_seen'|'unsure'|'lost';observedAt:string;activityLogId?:string;note?:string}
export interface Concern {id:string;childId:string;category:string;note:string;createdAt:string}
export interface Favorite {id:string;childId:string;activityId:string;createdAt:string}
export interface Settings {id:'settings';schemaVersion:number;activeChildId?:string;notificationEnabled:boolean;reminderTime?:string;reminderDays?:number[];reminderSnoozedUntil?:string;lastBackupAt?:string;analyticsConsent?:boolean;installationId?:string;pushManageSecret?:string}
export type Store='children'|'activityLogs'|'observations'|'concerns'|'favorites'|'settings'|'meta';
const NAME='langkah-si-kecil-local-v1';
let dbPromise:Promise<IDBPDatabase>|undefined;
export const newId=()=>globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const db=()=>dbPromise??=openDB(NAME,2,{upgrade(database){for(const name of ['children','activityLogs','observations','favorites','settings','meta'])if(!database.objectStoreNames.contains(name))database.createObjectStore(name,{keyPath:'id'}); if(!database.objectStoreNames.contains('concerns'))database.createObjectStore('concerns',{keyPath:'id'});}});
export async function all<T>(store:Store):Promise<T[]>{return (await db()).getAll(store)}
export async function save<T extends {id:string}>(store:Store,value:T){await (await db()).put(store,value)}
export async function remove(store:Store,id:string){await (await db()).delete(store,id)}
/** Keep activity and observations recorded with it consistent after a correction. */
export async function deleteEntryForChild(childId:string,store:'activityLogs'|'observations'|'concerns',id:string){
 const database=await db();const tx=database.transaction(['activityLogs','observations','concerns'],'readwrite');
 const existing=await tx.objectStore(store).get(id) as {childId?:string}|undefined;
 if(!existing||existing.childId!==childId){await tx.done;return false}
 if(store==='activityLogs'){
  const observations=await tx.objectStore('observations').getAll() as Observation[];
  for(const observation of observations)if(observation.childId===childId&&observation.activityLogId===id)await tx.objectStore('observations').delete(observation.id);
 }
 await tx.objectStore(store).delete(id);await tx.done;return true;
}
export async function getSettings():Promise<Settings>{const current=await (await db()).get('settings','settings');return current??{id:'settings',schemaVersion:2,notificationEnabled:false}}
export async function saveSettings(patch:Partial<Settings>){const next={...await getSettings(),...patch,schemaVersion:2} as Settings;await save('settings',next);return next}
export async function clearUserData(){const database=await db();const tx=database.transaction(['children','activityLogs','observations','concerns','favorites','settings','meta'],'readwrite');for(const name of ['children','activityLogs','observations','concerns','favorites','settings','meta'] as Store[])await tx.objectStore(name).clear();await tx.done;await database.put('meta',{id:'legacy-migrated',at:new Date().toISOString()})}
export async function initialize():Promise<void>{const database=await db();const migrated=await database.get('meta','legacy-migrated');if(migrated)return; if(database.objectStoreNames.contains('profile')){
 const olds=await database.getAll('profile') as Array<{id:string;name:string;birthDate:string;gestationalWeeks?:number;useCorrectedAge?:boolean}>;
 for(const old of olds){const child:Child={id:old.id||newId(),nickname:old.name,dateOfBirth:old.birthDate,prematurityStatus:old.gestationalWeeks!=null&&old.gestationalWeeks<37?'yes':'unsure',gestationalAgeWeeks:old.gestationalWeeks,useCorrectedAge:!!old.useCorrectedAge,focusDomains:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};await database.put('children',child)}
 if(database.objectStoreNames.contains('activity_logs'))for(const item of await database.getAll('activity_logs') as Array<{id:string;activityId:string;completedDate:string;response:ResponseKind}>){await database.put('activityLogs',{id:item.id,childId:olds[0]?.id??'',activityId:item.activityId,contentVersion:'0.12.0-source-checked',startedAt:`${item.completedDate}T12:00:00`,completedAt:`${item.completedDate}T12:00:00`,localDate:item.completedDate,response:item.response,snapshot:{title:item.activityId,primaryDomain:'',benefitShort:''}})}
 if(database.objectStoreNames.contains('skill_logs'))for(const item of await database.getAll('skill_logs') as Array<{id:string;skillId:string;date:string;status:'seen'|'lost'}>){await database.put('observations',{id:item.id,childId:olds[0]?.id??'',skillId:item.skillId,status:item.status,observedAt:`${item.date}T12:00:00`})}
 const legacyConcerns=await database.getAll('concerns') as Array<{id:string;category:string;createdDate?:string;createdAt?:string;note:string;childId?:string}>;for(const item of legacyConcerns)if(!item.childId)await database.put('concerns',{id:item.id,childId:olds[0]?.id??'',category:item.category,note:item.note,createdAt:`${item.createdDate??item.createdAt??new Date().toISOString().slice(0,10)}T12:00:00`});
 }
 await database.put('meta',{id:'legacy-migrated',at:new Date().toISOString()});}
export async function replaceAll(data:{children:Child[];activityLogs:ActivityLog[];observations:Observation[];concerns:Concern[];favorites:Favorite[];settings:Settings},merge:boolean){const database=await db();const names:Exclude<Store,'meta'>[]=['children','activityLogs','observations','concerns','favorites','settings'];const tx=database.transaction(names,'readwrite');if(!merge)for(const name of names)await tx.objectStore(name).clear();for(const name of names){const records=name==='settings'?[data.settings]:data[name] as Array<{id:string}>;for(const record of records){if(merge&&await tx.objectStore(name).get(record.id))continue;await tx.objectStore(name).put(record)}}await tx.done}
