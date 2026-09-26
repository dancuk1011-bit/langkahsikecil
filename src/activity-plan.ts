import type {Activity} from '@/content/types';
import type {ActivityLog,Observation} from './db';
import {daysBetween} from './age';

export interface ActivityPlan {
  label:string;
  explanation:string;
  activity:Activity|null;
  variation:string|null;
  recentSessions:number;
  recentObservations:number;
}

/** A family planning aid based on recorded play, never a developmental assessment. */
export function buildActivityPlan({ageDays,asOf,logs,observations,available,recommended}:{ageDays:number;asOf:string;logs:ActivityLog[];observations:Observation[];available:Activity[];recommended:Activity|null}):ActivityPlan {
  const eligible=available.filter(a=>ageDays>=a.age.minDays&&ageDays<=a.age.maxDays);
  const byId=new Map(eligible.map(a=>[a.id,a]));
  const recent=logs.filter(l=>l.completedAt&&daysBetween(asOf,l.localDate)>=0&&daysBetween(asOf,l.localDate)<7);
  const recentObservations=observations.filter(o=>daysBetween(asOf,o.observedAt.slice(0,10))>=0&&daysBetween(asOf,o.observedAt.slice(0,10))<7).length;
  const base={recentSessions:recent.length,recentObservations};
  const latestBySkill=new Map<string,Observation>();
  for(const o of [...observations].sort((a,b)=>a.observedAt.localeCompare(b.observedAt)))latestBySkill.set(o.skillId,o);
  if([...latestBySkill.values()].some(o=>o.status==='lost'&&observations.some(prev=>prev.skillId===o.skillId&&prev.status==='seen'&&prev.observedAt<=o.observedAt)))return {
    ...base,label:'Bahas pengamatan dengan tenaga kesehatan',explanation:'Ada catatan kemampuan yang sebelumnya terlihat lalu dilaporkan tidak terlihat lagi. Bicarakan perubahan ini dengan tenaga kesehatan; ringkasan bermain tidak dapat menjelaskan penyebabnya.',activity:null,variation:null
  };
  const current=recommended&&byId.get(recommended.id)||eligible[0]||null;
  if(!current)return {...base,label:'Belum ada ide untuk usia ini',explanation:'Belum tersedia aktivitas yang ditinjau untuk rentang usia saat ini. Catatan bermain tetap dapat dilihat di Perjalanan.',activity:null,variation:null};
  const last=[...recent].sort((a,b)=>b.completedAt!.localeCompare(a.completedAt!))[0];
  const previous=last&&byId.get(last.activityId);
  if(!previous)return {...base,label:'Mulai dari satu ide sesuai rentang usia',explanation:'Belum ada aktivitas terkini yang masih berada dalam rentang usia sekarang. Coba satu ide yang nyaman, lalu catat respons Si Kecil.',activity:current,variation:null};
  if(last.response==='tired')return {...base,label:'Istirahat, lalu coba lagi bila nyaman',explanation:'Catatan terakhir menunjukkan Si Kecil sedang lelah. Tidak perlu menambah tantangan; hentikan ketika ia membutuhkan jeda.',activity:previous,variation:previous.variations.easier};
  if(last.response==='not_interested'){
    const twice=recent.filter(l=>l.activityId===previous.id&&l.response==='not_interested').length>=2;
    if(twice&&current.id!==previous.id)return {...base,label:'Coba ide lain sesuai usia',explanation:'Dua catatan dalam tujuh hari menunjukkan belum tertarik pada aktivitas sebelumnya. Pilih ide lain saat Si Kecil nyaman; ini bukan penilaian kemampuan.',activity:current,variation:null};
    return {...base,label:'Ulangi dengan cara lebih ringan',explanation:'Belum tertarik sekali tidak berarti belum mampu. Beri jeda dan coba lagi dengan cara yang lebih mudah bila Si Kecil siap.',activity:previous,variation:previous.variations.easier};
  }
  if(last.response==='enjoyed'&&previous.variations.alternate)return {...base,label:'Coba variasi bila Si Kecil mau',explanation:'Si Kecil menikmati aktivitas terakhir. Boleh ulangi cara sebelumnya atau mencoba variasi sederhana ini; tidak perlu mengejar tahap berikutnya.',activity:previous,variation:previous.variations.alternate};
  return {...base,label:'Lanjutkan aktivitas yang sama',explanation:'Mencoba atau menikmati suatu aktivitas belum menuntut naik tingkat. Ulangi saat Si Kecil nyaman dan perhatikan responsnya.',activity:previous,variation:previous.variations.easier};
}
