import activities from "../data/activities.json";
import skills from "../data/skills.json";
import sources from "../data/sources.json";
import mappings from "../data/activity-skill-map.json";
import riskRules from "../data/risk-rules.json";

type Mode = "development" | "production";
const mode = (process.argv[2] as Mode) || "development";

const errors: string[] = [];
const sourceIds = new Set(sources.map((s) => s.id));
const activityIds = new Set<string>();
const skillIds = new Set<string>();

for (const a of activities) {
  if (activityIds.has(a.id)) errors.push(`Duplicate activity ${a.id}`);
  activityIds.add(a.id);

  if (!a.title || !a.benefit?.short || !a.benefit?.detail)
    errors.push(`${a.id}: missing title/benefit`);
  if (!a.instructions?.length || !a.observe?.length)
    errors.push(`${a.id}: missing instructions/observe`);
  if (!a.safety?.notes?.length || !a.safety?.stopConditions?.length)
    errors.push(`${a.id}: missing safety`);
  if (!a.sourceRefs?.length) errors.push(`${a.id}: missing sources`);
  for (const ref of a.sourceRefs ?? [])
    if (!sourceIds.has(ref)) errors.push(`${a.id}: unknown source ${ref}`);

  if (mode === "production" && a.review.status !== "approved")
    errors.push(`${a.id}: production requires approved, found ${a.review.status}`);
}

for (const s of skills) {
  if (skillIds.has(s.id)) errors.push(`Duplicate skill ${s.id}`);
  skillIds.add(s.id);
  for (const ref of s.sourceRefs ?? [])
    if (!sourceIds.has(ref)) errors.push(`${s.id}: unknown source ${ref}`);
  if (mode === "production" && s.reviewStatus !== "approved")
    errors.push(`${s.id}: production requires approved, found ${s.reviewStatus}`);
}

for (const m of mappings) {
  if (!activityIds.has(m.activityId)) errors.push(`Unknown activity ${m.activityId}`);
  if (!skillIds.has(m.skillId)) errors.push(`Unknown skill ${m.skillId}`);
}

for (const r of riskRules) {
  for (const ref of r.sourceRefs ?? [])
    if (!sourceIds.has(ref)) errors.push(`${r.id}: unknown source ${ref}`);
  if (mode === "production" && r.reviewStatus !== "approved")
    errors.push(`${r.id}: production requires approved, found ${r.reviewStatus}`);
}

if (errors.length) {
  console.error(`LSK dataset validation FAILED (${mode})`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log(`LSK dataset validation PASS (${mode})`);
