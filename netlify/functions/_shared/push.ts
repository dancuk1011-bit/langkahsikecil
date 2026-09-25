import {createHash,timingSafeEqual} from 'node:crypto';
import {getStore} from '@netlify/blobs';
export interface PushRecord {installationId:string;endpoint:string;p256dh:string;auth:string;timezone:string;preferredTime:string;days:number[];enabled:boolean;lastSentSlot?:string;snoozedUntil?:string;createdAt:string;updatedAt:string;managementSecretHash:string}
export const store=()=>getStore({name:'lsk-push-subscriptions',consistency:'strong'});
export const key=(id:string)=>`subscription:${id}`;
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export function authorized(record:PushRecord,secret:unknown){if(typeof secret!=='string'||!/^[a-f0-9]{64}$/.test(secret))return false;return timingSafeEqual(Buffer.from(record.managementSecretHash,'hex'),Buffer.from(hash(secret),'hex'))}
export function validInstallation(id:unknown):id is string{return typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id)}
export function validTime(v:unknown):v is string{return typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v)}
export function validTimezone(v:unknown):v is string{if(typeof v!=='string'||v.length>64)return false;try{new Intl.DateTimeFormat('en-US',{timeZone:v});return true}catch{return false}}
export function validDays(v:unknown):v is number[]{return Array.isArray(v)&&v.length>0&&v.length<=7&&v.every(n=>Number.isInteger(n)&&n>=0&&n<=6)&&new Set(v).size===v.length}
export function validEndpoint(v:unknown):v is string{if(typeof v!=='string'||v.length>2048)return false;try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(/(^|\.)googleapis\.com$/.test(u.hostname)||u.hostname==='updates.push.services.mozilla.com'||/(^|\.)push\.apple\.com$/.test(u.hostname)||/(^|\.)notify\.windows\.com$/.test(u.hostname))}catch{return false}}
export function guard(req:Request){const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return new Response('Forbidden',{status:403});if(req.method!=='POST')return new Response('Method not allowed',{status:405});if(!req.headers.get('content-type')?.startsWith('application/json'))return new Response('Unsupported content type',{status:415});if(Number(req.headers.get('content-length')??'0')>10000)return new Response('Too large',{status:413});return null}
export async function body(req:Request){const raw=await req.text();if(raw.length>10000)throw Error('too_large');return JSON.parse(raw) as Record<string,unknown>}
export const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
