import type { Activity, BuildMode } from "../types";
import { effectiveAgeDays, type PrematurityInput } from "./corrected-age";

export type ActivityResponse = "enjoyed" | "tried" | "not_interested" | "tired";

export interface ActivityHistoryItem {
  activityId: string;
  completedDate: string; // YYYY-MM-DD local date
  response?: ActivityResponse;
}

export interface RecommendationInput {
  childId: string;
  today: string; // YYYY-MM-DD local date
  age: PrematurityInput;
  parentFocusDomains?: string[];
  availableMinutes?: number | null;
  history: ActivityHistoryItem[];
  mode: BuildMode;
}

export interface RecommendationResult {
  effectiveAgeDays: number;
  primary: Activity | null;
  alternatives: Activity[];
  reason: string;
}

const DEVELOPMENT_ALLOWED = new Set(["source_checked", "approved"]);

function isContentAllowed(activity: Activity, mode: BuildMode): boolean {
  if (mode === "production") return activity.review.status === "approved";
  return DEVELOPMENT_ALLOWED.has(activity.review.status);
}

function daysBetween(a: string, b: string): number {
  const day = 86_400_000;
  return Math.round(
    (new Date(`${a}T00:00:00`).getTime() - new Date(`${b}T00:00:00`).getTime()) / day
  );
}

function stableHash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function recentHistoryFor(
  activityId: string,
  history: ActivityHistoryItem[],
  today: string
): ActivityHistoryItem[] {
  return history
    .filter((h) => h.activityId === activityId)
    .sort((a, b) => b.completedDate.localeCompare(a.completedDate))
    .filter((h) => daysBetween(today, h.completedDate) >= 0);
}

function domainCountsLast7Days(
  activitiesById: Map<string, Activity>,
  history: ActivityHistoryItem[],
  today: string
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const h of history) {
    const age = daysBetween(today, h.completedDate);
    if (age < 0 || age > 6) continue;
    const a = activitiesById.get(h.activityId);
    if (!a) continue;
    counts.set(a.domains.primary, (counts.get(a.domains.primary) ?? 0) + 1);
  }
  return counts;
}

function scoreActivity(
  activity: Activity,
  input: RecommendationInput,
  domainCounts: Map<string, number>
): number {
  const age = effectiveAgeDays(input.age);
  const mid = (activity.age.minDays + activity.age.maxDays) / 2;
  const halfSpan = Math.max(1, (activity.age.maxDays - activity.age.minDays) / 2);
  const ageDistance = Math.min(1, Math.abs(age - mid) / halfSpan);
  let score = 30 * (1 - ageDistance);

  const ownHistory = recentHistoryFor(activity.id, input.history, input.today);
  const last = ownHistory[0];
  const daysSince = last ? daysBetween(input.today, last.completedDate) : null;

  // Recent-activity diversity: avoid immediate repeats.
  if (daysSince == null) score += 20;
  else if (daysSince >= 7) score += 18;
  else if (daysSince >= 3) score += 10;
  else score -= 20;

  // Parent focus is preference, not a developmental judgment.
  if (input.parentFocusDomains?.includes(activity.domains.primary)) score += 15;

  // Domain balance: fewer recently used domains get a boost.
  const domainCount = domainCounts.get(activity.domains.primary) ?? 0;
  score += Math.max(0, 15 - domainCount * 4);

  // Previous enjoyment can support sensible repetition.
  if (ownHistory.some((h) => h.response === "enjoyed")) score += 10;

  // Novelty.
  if (ownHistory.length === 0) score += 10;

  // Two "not interested" responses -> 7-day cooldown.
  const notInterestedRecent = ownHistory.filter(
    (h) =>
      h.response === "not_interested" &&
      daysBetween(input.today, h.completedDate) <= 6
  ).length;
  if (notInterestedRecent >= 2) score -= 100;

  // "tired" must never be interpreted as lack of ability.
  return score;
}

/**
 * Deterministic recommendation:
 * - same child + same date -> stable tie-breaking
 * - only age-eligible content
 * - development build can use source_checked
 * - production build uses approved records only
 */
export function recommendActivities(
  allActivities: Activity[],
  input: RecommendationInput
): RecommendationResult {
  const age = effectiveAgeDays(input.age);
  const byId = new Map(allActivities.map((a) => [a.id, a]));
  const domainCounts = domainCountsLast7Days(byId, input.history, input.today);

  let candidates = allActivities.filter(
    (a) =>
      isContentAllowed(a, input.mode) &&
      age >= a.age.minDays &&
      age <= a.age.maxDays
  );

  if (input.availableMinutes != null) {
    const fit = candidates.filter(
      (a) => a.durationMinutes == null || a.durationMinutes <= input.availableMinutes!
    );
    if (fit.length > 0) candidates = fit;
  }

  const ranked = candidates
    .map((activity) => ({
      activity,
      score: scoreActivity(activity, input, domainCounts),
      tie: stableHash(`${input.childId}|${input.today}|${activity.id}`),
    }))
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .map((x) => x.activity);

  if (ranked.length === 0) {
    return {
      effectiveAgeDays: age,
      primary: null,
      alternatives: [],
      reason:
        input.mode === "production"
          ? "Tidak ada konten berstatus approved yang cocok dengan usia ini."
          : "Tidak ada aktivitas development yang cocok dengan usia/filter ini.",
    };
  }

  return {
    effectiveAgeDays: age,
    primary: ranked[0],
    alternatives: ranked.slice(1, 3),
    reason:
      "Dipilih dari aktivitas yang sesuai usia, histori terbaru, keseimbangan domain, preferensi orang tua, dan respons sebelumnya. Skor ini hanya untuk kecocokan aktivitas—bukan skor perkembangan anak.",
  };
}