/**
 * Regenerate the JSON bundle from the editorial Excel master.
 * Dependency: npm i -D xlsx
 *
 * Usage:
 *   node scripts/convert-dataset.mjs /path/to/LSK_master_dataset_0-12_bulan.xlsx
 */
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

const input = process.argv[2];
if (!input) throw new Error("Pass the .xlsx path as the first argument.");

const wb = XLSX.readFile(input);
const outDir = path.resolve("content/data");
fs.mkdirSync(outDir, { recursive: true });

const rows = (sheet) =>
  XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: null });

const split = (v) =>
  v == null ? [] : String(v).split(";").map((x) => x.trim()).filter(Boolean);

const numbered = (v) => {
  if (!v) return [];
  return String(v)
    .split(/(?=\d+\)\s*)/)
    .map((x) => x.replace(/^\d+\)\s*/, "").trim())
    .filter(Boolean);
};

const activitySheets = [
  "Activities_0_3","Activities_4_6","Activities_7_9","Activities_10_12"
];
const skillSheets = [
  "Skills_0_3","Skills_4_6","Skills_7_9","Skills_10_12"
];

const activities = activitySheets.flatMap((s) => rows(s)).map((r) => ({
  id: r.activity_id,
  title: r.title,
  age: {
    label: r.age_label,
    minDays: Number(r.min_age_days),
    maxDays: Number(r.max_age_days),
    minMonth: Number(r.min_age_month),
    maxMonth: Number(r.max_age_month),
  },
  domains: { primary: r.primary_domain, secondary: split(r.secondary_domains) },
  type: r.activity_type,
  durationMinutes: r.duration_minutes == null ? null : Number(r.duration_minutes),
  materials: split(r.materials),
  benefit: { short: r.benefit_short, detail: r.benefit_detail },
  instructions: numbered(r.instructions),
  observe: split(r.observe_items),
  variations: { easier: r.easy_variation, alternate: r.alternate_variation },
  safety: {
    notes: split(r.safety_notes),
    stopConditions: split(r.stop_conditions),
    prematurityNote: r.prematurity_notes,
  },
  sourceRefs: split(r.source_refs),
  evidenceNote: r.evidence_note,
  review: {
    status: r.review_status,
    reviewer: r.reviewer,
    lastReviewedAt: r.last_reviewed_at,
  },
  contentVersion: r.content_version,
}));

const skills = skillSheets.flatMap((s) => rows(s)).map((r) => ({
  id: r.skill_id,
  label: r.label,
  domain: r.domain,
  age: { minDays: Number(r.min_age_days), maxDays: Number(r.max_age_days) },
  observationType: r.observation_type,
  description: r.description,
  sourceRefs: split(r.source_refs),
  guardrailNote: r.guardrail_note,
  reviewStatus: r.review_status,
}));

const sources = rows("Source_Registry")
  .filter((r) => r.source_id)
  .map((r) => ({
    id: r.source_id,
    organization: r.organization,
    title: r.title,
    year: r.year,
    type: r.source_type,
    url: r.url,
    evidenceNote: r.evidence_note,
    tier: r.tier,
  }));

const mappings = rows("Activity_Skill_Map")
  .filter((r) => r.activity_id && r.skill_id)
  .map((r) => ({
    activityId: r.activity_id,
    skillId: r.skill_id,
    relation: r.relation,
  }));

const riskRules = rows("Risk_Rules_0_12")
  .filter((r) => r.rule_id)
  .map((r) => ({
    id: r.rule_id,
    name: r.rule_name,
    age: { minDays: Number(r.min_age_days), maxDays: Number(r.max_age_days) },
    triggerDescription: r.trigger,
    userStatus: r.user_status,
    userMessage: r.user_message,
    recommendedAction: r.recommended_action,
    sourceRefs: split(r.source_refs),
    guardrail: r.guardrail,
    reviewStatus: r.review_status,
  }));

for (const [file, data] of Object.entries({
  "activities.json": activities,
  "skills.json": skills,
  "sources.json": sources,
  "activity-skill-map.json": mappings,
  "risk-rules.json": riskRules,
})) {
  fs.writeFileSync(path.join(outDir, file), JSON.stringify(data, null, 2));
}

console.log(`Converted: ${activities.length} activities, ${skills.length} skills, ${sources.length} sources.`);
