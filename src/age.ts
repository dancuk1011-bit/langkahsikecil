import {ageDaysFromDates,calculateCorrectedAgeDays} from '@/content/engine/corrected-age';
import type {Child} from './db';
export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export const daysBetween=(a:string,b:string)=>Math.round((Date.parse(`${a.slice(0,10)}T12:00:00Z`)-Date.parse(`${b.slice(0,10)}T12:00:00Z`))/86400000);
export function gestation(child:Child){if(child.gestationalAgeWeeks!==undefined)return{weeks:child.gestationalAgeWeeks,days:child.gestationalAgeDays??0};if(child.estimatedDueDate){const remaining=daysBetween(child.estimatedDueDate,child.dateOfBirth);const total=280-remaining;if(total>=154&&total<=294)return{weeks:Math.floor(total/7),days:total%7}}return null}
export function childAge(child:Child,at=today()){const chronological=ageDaysFromDates(child.dateOfBirth,at);const g=gestation(child);const corrected=child.prematurityStatus==='yes'&&child.useCorrectedAge&&g?calculateCorrectedAgeDays({chronologicalAgeDays:chronological,gestationalAgeWeeks:g.weeks,gestationalAgeDays:g.days}):null;return{chronological,effective:corrected??chronological,corrected,gestation:g}}
export function ageLabel(days:number){const months=Math.floor(days/30.4375),rem=Math.max(0,Math.round(days-months*30.4375));return months?`${months} bulan${rem?` ${rem} hari`:''}`:`${days} hari`}
