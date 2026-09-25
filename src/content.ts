import {activities as rawActivities,skills as rawSkills,sources as rawSources,mappings as rawMappings,riskRules as rawRules} from '@/content';
import type {Activity,Skill,Source,ActivitySkillMap,RiskRule,BuildMode} from '@/content/types';
import sourceVersion from '@/content/data/content-version.json';
import release from '@/content/release/attestation.json';

// The workbook-derived JSON remains unchanged. An exact-digest release attestation
// authorizes this snapshot at build time; the validator rejects altered source bytes.
export const mode:BuildMode=import.meta.env.VITE_CONTENT_MODE==='development'?'development':'production';
export const contentVersion=mode==='production'?release.releaseVersion:sourceVersion.contentVersion;
export const activities:Activity[]=mode==='production'?(rawActivities as Activity[]).map(a=>({...a,contentVersion,review:{...a.review,status:'approved'}})):rawActivities as Activity[];
export const skills:Skill[]=mode==='production'?(rawSkills as Skill[]).map(s=>({...s,reviewStatus:'approved'})):rawSkills as Skill[];
export const riskRules:RiskRule[]=mode==='production'?(rawRules as RiskRule[]).map(r=>({...r,reviewStatus:'approved'})):rawRules as RiskRule[];
export const sources=rawSources as Source[];
export const mappings=rawMappings as ActivitySkillMap[];
export const productionReady=activities.length===release.scope.activities&&activities.every(a=>a.review.status==='approved')&&skills.length===release.scope.skills;
export const sourceMap=new Map(sources.map(s=>[s.id,s]));
export const skillMap=new Map(skills.map(s=>[s.id,s]));
export const eligibleActivities=()=>activities.filter(a=>mode==='production'?a.review.status==='approved':a.review.status==='source_checked'||a.review.status==='approved');
