import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import release from '../content/release/attestation.json';
import {activities,skills,riskRules,mode,productionReady,contentVersion} from '../src/content';
import {recommendActivities} from '../content/engine/recommendation-engine';
import {evaluateRiskSignals} from '../content/engine/risk-signal-engine';
const sha=(path:string)=>createHash('sha256').update(readFileSync(new URL(path,import.meta.url))).digest('hex');
describe('rilis publik',()=>{
 it('menjaga workbook dan data master sesuai snapshot yang dikonfirmasi',()=>{
  expect(sha('../content/master/LSK_master_dataset_0-12_bulan_v4.xlsx')).toBe(release.sourceWorkbookSha256);
  for(const [name,digest] of Object.entries(release.dataSha256))expect(sha(`../content/data/${name}`)).toBe(digest);
 });
 it('memuat konten rilis dan menampilkan rekomendasi tanpa mode pratinjau',()=>{
  expect(mode).toBe('production');expect(productionReady).toBe(true);
  expect(contentVersion).toBe(release.releaseVersion);
  expect(activities).toHaveLength(122);expect(skills).toHaveLength(90);
  expect(activities.every(a=>a.review.status==='approved')).toBe(true);
  expect(recommendActivities(activities,{childId:'uji',today:'2026-09-25',age:{chronologicalAgeDays:100},history:[],mode:'production'}).primary).not.toBeNull();
 });
 it('mengaktifkan kekhawatiran berulang, menahan rule tanpa ambang',()=>{
  const signals=evaluateRiskSignals(riskRules,{effectiveAgeDays:100,today:'2026-09-25',mode:'production',concerns:[{id:'one',category:'Bahasa & Komunikasi',createdDate:'2026-09-24'},{id:'two',category:'Bahasa & Komunikasi',createdDate:'2026-09-25'}],observationChanges:[]});
  expect(signals.map(s=>s.ruleId)).toContain('RISK003');
  expect(signals.map(s=>s.ruleId)).not.toContain('RISK004');
 });
});
