import {describe,expect,it} from 'vitest';
import {buildActivityPlan} from '../src/activity-plan';
import activities from '../content/data/activities.json';
import type {Activity} from '../content/types';
import type {ActivityLog,Observation} from '../src/db';

const first=(activities as Activity[])[0];
const second=(activities as Activity[]).find(a=>a.id!==first.id&&a.age.minDays<=10&&a.age.maxDays>=10)!;
const log=(response:ActivityLog['response'],activityId=first.id,date='2026-09-25'):ActivityLog=>({id:`${activityId}-${date}`,childId:'anak-1',activityId,contentVersion:'test',startedAt:`${date}T10:00:00Z`,completedAt:`${date}T10:05:00Z`,localDate:date,response,snapshot:{title:first.title,primaryDomain:first.domains.primary,benefitShort:first.benefit.short}});
const base={ageDays:10,asOf:'2026-09-26',logs:[] as ActivityLog[],observations:[] as Observation[],available:[first,second],recommended:second};

describe('rencana bermain dari catatan keluarga',()=>{
  it('tidak menafsirkan kelelahan sebagai alasan untuk naik aktivitas',()=>{
    const plan=buildActivityPlan({...base,logs:[log('tired')]});
    expect(plan.label).toMatch(/Istirahat/);
    expect(plan.activity?.id).toBe(first.id);
  });
  it('memilih ide lain setelah dua respons belum tertarik, selama masih sesuai rentang usia',()=>{
    const plan=buildActivityPlan({...base,logs:[log('not_interested'),log('not_interested',first.id,'2026-09-24')]});
    expect(plan.activity?.id).toBe(second.id);
    expect(plan.explanation).toMatch(/bukan penilaian kemampuan/);
  });
  it('mengutamakan pembahasan kehilangan kemampuan yang terakhir tercatat',()=>{
    const obs=(status:Observation['status'],date:string):Observation=>({id:date,childId:'anak-1',skillId:'SK001',status,observedAt:`${date}T12:00:00Z`});
    const plan=buildActivityPlan({...base,logs:[log('enjoyed')],observations:[obs('seen','2026-09-23'),obs('lost','2026-09-25')]});
    expect(plan.activity).toBeNull();
    expect(plan.label).toMatch(/tenaga kesehatan/);
  });
  it('tidak meneruskan aktivitas yang sudah di luar rentang usia',()=>{
    const plan=buildActivityPlan({...base,ageDays:61,available:[first,second].filter(a=>a.age.minDays<=61&&a.age.maxDays>=61),logs:[log('enjoyed')]});
    expect(plan.activity?.age.minDays).toBeLessThanOrEqual(61);
    expect(plan.activity?.age.maxDays).toBeGreaterThanOrEqual(61);
  });
});
