import type {Activity,ActivitySkillMap,Skill} from '@/content/types';
import type {ActivityLog,Observation} from './db';
import {daysBetween} from './age';

export interface PlayGuidance {
  skill: Skill|null;
  status: 'unrecorded'|Observation['status'];
  statusText: string;
  easier: string|null;
}

export interface FollowingStep {
  title: string;
  description: string;
  activity: Activity|null;
  action: string|null;
}

function latestObservation(skillId:string,observations:Observation[]):Observation|undefined {
  return observations.filter(o=>o.skillId===skillId).sort((a,b)=>b.observedAt.localeCompare(a.observedAt))[0];
}

/** Describe the family's latest explicit observation, not an inferred developmental result. */
export function getPlayGuidance({activity,ageDays,observations,skills,mappings}:{activity:Activity;ageDays:number;observations:Observation[];skills:Skill[];mappings:ActivitySkillMap[]}):PlayGuidance {
  const skillIds=mappings.filter(m=>m.activityId===activity.id).sort((a,b)=>Number(b.relation==='primary')-Number(a.relation==='primary')).map(m=>m.skillId);
  const skill=skillIds.map(id=>skills.find(s=>s.id===id)).find(s=>s&&ageDays>=s.age.minDays&&ageDays<=s.age.maxDays)??null;
  const record=skill?latestObservation(skill.id,observations):undefined;
  const status=record?.status??'unrecorded';
  const statusText=({unrecorded:'Belum dicatat; ini tidak berarti belum bisa.',seen:'Pernah terlihat menurut catatan keluarga.',not_seen:'Belum terlihat saat pengamatan terakhir.',unsure:'Keluarga belum yakin dari pengamatan terakhir.',lost:'Dulu terlihat, kini dilaporkan tidak terlihat lagi.'} as const)[status];
  return {skill,status,statusText,easier:activity.variations.easier};
}

function nextCandidate(activity:Activity,ageDays:number,available:Activity[],observations:Observation[],mappings:ActivitySkillMap[],asOf:string,logs:ActivityLog[]):Activity|null {
  const latest=new Map<string,Observation>();
  for(const o of [...observations].sort((a,b)=>a.observedAt.localeCompare(b.observedAt)))latest.set(o.skillId,o);
  const candidates=available.filter(a=>a.id!==activity.id&&ageDays>=a.age.minDays&&ageDays<=a.age.maxDays)
    .filter(a=>!logs.some(l=>l.activityId===a.id&&l.completedAt&&daysBetween(asOf,l.localDate)>=0&&daysBetween(asOf,l.localDate)<7&&(l.response==='tired'||l.response==='not_interested')))
    .filter(a=>!mappings.some(m=>m.activityId===a.id&&m.relation==='primary'&&['not_seen','lost'].includes(latest.get(m.skillId)?.status??'')));
  const sameDomain=candidates.filter(a=>a.domains.primary===activity.domains.primary);
  return sameDomain.sort((a,b)=>Math.abs(a.age.minDays-activity.age.minDays)-Math.abs(b.age.minDays-activity.age.minDays)||a.id.localeCompare(b.id))[0]??null;
}

/** A possible next play idea; never a diagnosis or a mandatory advancement. */
export function getFollowingStep({activity,ageDays,asOf,logs,observations,available,skills,mappings}:{activity:Activity;ageDays:number;asOf:string;logs:ActivityLog[];observations:Observation[];available:Activity[];skills:Skill[];mappings:ActivitySkillMap[]}):FollowingStep {
  if(ageDays<activity.age.minDays||ageDays>activity.age.maxDays)return {title:'Periksa usia acuan',description:'Aktivitas ini berada di luar rentang usia acuan anak. Pilih aktivitas lain yang sesuai usia.',activity:null,action:null};
  const guide=getPlayGuidance({activity,ageDays,observations,skills,mappings});
  const recent=logs.filter(l=>l.activityId===activity.id&&l.completedAt&&daysBetween(asOf,l.localDate)>=0&&daysBetween(asOf,l.localDate)<7)
    .sort((a,b)=>b.completedAt!.localeCompare(a.completedAt!));
  const response=recent[0]?.response;
  const next=nextCandidate(activity,ageDays,available,observations,mappings,asOf,logs);
  const repeat=guide.easier?`Coba cara yang lebih ringan: ${guide.easier}`:'Ulangi bila Si Kecil nyaman, tanpa memaksa.';
  if(guide.status==='lost')return {title:'Bicarakan perubahan yang dicatat',description:'Kemampuan yang dulu terlihat kini dilaporkan tidak terlihat lagi. Diskusikan dengan tenaga kesehatan; permainan tidak menjelaskan penyebabnya.',activity:null,action:null};
  if(response==='tired')return {title:'Istirahat dulu',description:'Catatan terakhir menunjukkan Si Kecil sedang lelah. Beri jeda dan kembali bermain bila ia nyaman.',activity:null,action:null};
  if(guide.status==='not_seen'||guide.status==='unsure')return {title:'Mulai dari cara yang lebih mudah',description:`${repeat} Jika ada kekhawatiran tentang kemampuan yang belum terlihat, bicarakan dengan tenaga kesehatan.`,activity,action:'Lihat cara bermain'};
  if(response==='not_interested'){
    if(recent.filter(l=>l.response==='not_interested').length>=2&&next)return {title:'Coba ide lain saat siap',description:`Belum tertarik pada permainan ini bukan berarti belum mampu. ${next.title} adalah pilihan lain dalam rentang usia Si Kecil.`,activity:next,action:'Lihat aktivitas lain'};
    return {title:'Coba lagi dengan lebih ringan',description:`Belum tertarik sekali bukan penilaian kemampuan. ${repeat}`,activity,action:'Lihat cara bermain'};
  }
  if(response==='tried')return {title:'Ulangi saat nyaman',description:`Tidak perlu langsung berpindah aktivitas. ${repeat}`,activity,action:'Lihat cara bermain'};
  if(response==='enjoyed'&&guide.status==='seen'&&next)return {title:'Pilihan bermain berikutnya',description:`Jika Si Kecil masih ingin bermain pada kesempatan lain, ${next.title} bisa dicoba. Ini pilihan, bukan tahap yang wajib dikuasai.`,activity:next,action:'Lihat aktivitas berikutnya'};
  if(response==='enjoyed'&&activity.variations.alternate)return {title:'Coba variasi jika nyaman',description:`Si Kecil menikmati permainan ini. ${activity.variations.alternate} Pengamatan kemampuan tetap perlu dicatat tersendiri.`,activity,action:'Lihat variasi'};
  return {title:'Setelah ini, ikuti respons Si Kecil',description:next?`Setelah bermain, catat responsnya. Jika nyaman, ${next.title} bisa menjadi pilihan lain yang sesuai rentang usia. Jika masih sulit, ${repeat.toLowerCase()}`:`Setelah bermain, catat responsnya. ${repeat}`,activity:next??activity,action:next?'Lihat pilihan lain':'Lihat cara bermain'};
}
