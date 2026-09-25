import fs from 'node:fs';
import {createHash} from 'node:crypto';
const dataDir=new URL('../content/data/',import.meta.url);
const contentDir=new URL('../content/',import.meta.url);
const get=name=>JSON.parse(fs.readFileSync(new URL(name,dataDir),'utf8'));
const activities=get('activities.json'),skills=get('skills.json'),sources=get('sources.json'),mappings=get('activity-skill-map.json'),rules=get('risk-rules.json');
const production=process.env.VITE_CONTENT_MODE!=='development';
const errors=[];
const sourceIds=new Set(sources.map(s=>s.id));
const activityIds=new Set(activities.map(a=>a.id));
const skillIds=new Set(skills.map(s=>s.id));
for(const [name,rows] of [['activity',activities],['skill',skills],['source',sources],['rule',rules]])if(new Set(rows.map(r=>r.id)).size!==rows.length)errors.push(`ID ${name} duplikat`);
for(const a of activities){if(!a.title||!a.benefit?.short||!a.instructions?.length||!a.safety?.notes?.length||!a.safety?.stopConditions?.length)errors.push(`${a.id}: isi/safety kosong`);if(!a.sourceRefs?.length||a.sourceRefs.some(id=>!sourceIds.has(id)))errors.push(`${a.id}: sumber tidak valid`)}
for(const s of skills)if(!s.sourceRefs?.length||s.sourceRefs.some(id=>!sourceIds.has(id)))errors.push(`${s.id}: sumber tidak valid`);
for(const r of rules)if(!r.sourceRefs?.length||r.sourceRefs.some(id=>!sourceIds.has(id)))errors.push(`${r.id}: sumber tidak valid`);
for(const m of mappings)if(!activityIds.has(m.activityId)||!skillIds.has(m.skillId))errors.push('Pemetaan aktivitas-keterampilan tidak valid');
if(production){
 const release=JSON.parse(fs.readFileSync(new URL('release/attestation.json',contentDir),'utf8'));
 if(release.schemaVersion!==1||!release.basis?.includes('Pemilik produk menyatakan')||!release.recordedAt||!release.releaseVersion)errors.push('Catatan persetujuan rilis tidak lengkap.');
 const actual={activities:activities.length,skills:skills.length,sources:sources.length,activitySkillMappings:mappings.length,riskRules:rules.length};
 for(const [key,count] of Object.entries(actual))if(release.scope?.[key]!==count)errors.push(`Cakupan persetujuan ${key} tidak cocok: ${count}.`);
 for(const name of ['activities.json','skills.json','sources.json','activity-skill-map.json','risk-rules.json','content-version.json']){
  const bytes=fs.readFileSync(new URL(name,dataDir));const sha=createHash('sha256').update(bytes).digest('hex');
  if(release.dataSha256?.[name]!==sha)errors.push(`${name} berubah sejak konfirmasi rilis. Peninjauan ulang diperlukan.`);
 }
 const workbook=fs.readFileSync(new URL('master/LSK_master_dataset_0-12_bulan_v4.xlsx',contentDir));
 if(createHash('sha256').update(workbook).digest('hex')!==release.sourceWorkbookSha256)errors.push('Workbook master berubah sejak konfirmasi rilis.');
 if(!Array.isArray(release.inactiveOperationalRules)||!release.inactiveOperationalRules.includes('RISK004'))errors.push('Aturan tanpa ambang operasional RISK004 harus dinonaktifkan secara eksplisit.');
}
if(errors.length){console.error(`Validasi dataset GAGAL (${production?'production':'development'}): ${errors.slice(0,12).join('; ')}`);process.exit(1)}
console.log(`Validasi dataset LULUS (${production?'production':'development'}): ${activities.length} aktivitas, ${skills.length} skill, ${sources.length} sumber, ${mappings.length} pemetaan, ${rules.length} aturan.${production?' Rilis memakai konfirmasi pemilik produk dan checksum data yang cocok.':''}`);
