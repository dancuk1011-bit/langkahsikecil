import {describe,expect,it} from 'vitest';
import {getFollowingStep,getPlayGuidance} from '../src/play-guidance';
import activities from '../content/data/activities.json';
import skills from '../content/data/skills.json';
import mappings from '../content/data/activity-skill-map.json';
import type {Activity,ActivitySkillMap,Skill} from '../content/types';
import type {ActivityLog,Observation} from '../src/db';

const available=activities as Activity[];
const namedSkills=skills as Skill[];
const links=mappings as ActivitySkillMap[];
const activity=available.find(a=>a.id==='ACT069')!;
const date='2026-09-26';
const observation=(status:Observation['status'],skillId='SK045'):Observation=>({id:`${skillId}-${status}`,childId:'shanum',skillId,status,observedAt:`${date}T10:00:00Z`});
const log=(response:ActivityLog['response'],at=date):ActivityLog=>({id:`log-${at}`,childId:'shanum',activityId:activity.id,contentVersion:'test',startedAt:`${at}T11:00:00Z`,completedAt:`${at}T11:05:00Z`,localDate:at,response,snapshot:{title:activity.title,primaryDomain:activity.domains.primary,benefitShort:activity.benefit.short}});
const input={activity,ageDays:270,asOf:date,logs:[] as ActivityLog[],observations:[] as Observation[],available,skills:namedSkills,mappings:links};

describe('saran bermain yang mengikuti catatan keluarga',()=>{
  it('membedakan belum dicatat dari belum terlihat tanpa mengklaim kemampuan bayi',()=>{
    const guide=getPlayGuidance(input);
    expect(guide.skill?.id).toBe('SK045');
    expect(guide.statusText).toMatch(/tidak berarti belum bisa/);
    const next=getFollowingStep(input);
    expect(next.activity?.id).toBe('ACT070');
    expect(next.description).toMatch(/Jika nyaman/);
    expect(next.description).toMatch(/catat responsnya/);
  });

  it('memberi cara yang lebih mudah bila kemampuan belum terlihat meski permainan dinikmati',()=>{
    const next=getFollowingStep({...input,observations:[observation('not_seen')],logs:[log('enjoyed')]});
    expect(next.activity?.id).toBe('ACT069');
    expect(next.description).toContain(activity.variations.easier);
    expect(next.description).toMatch(/tenaga kesehatan/);
  });

  it('baru menawarkan aktivitas lanjutan setelah pengamatan dan respons mendukung',()=>{
    const next=getFollowingStep({...input,observations:[observation('seen')],logs:[log('enjoyed')]});
    expect(next.activity?.id).toBe('ACT070');
    expect(next.description).toMatch(/bukan tahap yang wajib/);
    expect(next.activity!.age.minDays).toBeLessThanOrEqual(input.ageDays);
    expect(next.activity!.age.maxDays).toBeGreaterThanOrEqual(input.ageDays);
  });

  it('mengutamakan jeda saat lelah dan tidak menganggap catatan lama sebagai respons terkini',()=>{
    const tired=getFollowingStep({...input,observations:[observation('seen')],logs:[log('tired')]});
    expect(tired.activity).toBeNull();
    expect(tired.title).toMatch(/Istirahat/);
    const old=getFollowingStep({...input,observations:[observation('seen')],logs:[log('enjoyed','2026-09-01')]});
    expect(old.title).toMatch(/ikuti respons/);
  });

  it('tidak menawarkan aktivitas di luar usia efektif atau saat ada kehilangan kemampuan',()=>{
    const atEarlyAge=getFollowingStep({...input,ageDays:210,available:[activity,...available.filter(a=>a.id==='ACT070')]});
    expect(atEarlyAge.activity).toBeNull();
    const lost=getFollowingStep({...input,observations:[observation('lost')],logs:[log('enjoyed')]});
    expect(lost.activity).toBeNull();
    expect(lost.description).toMatch(/tenaga kesehatan/);
  });
});
