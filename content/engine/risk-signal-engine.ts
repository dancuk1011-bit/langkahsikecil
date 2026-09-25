import type { BuildMode, RiskRule } from "../types";

export interface ConcernEntry {
  id: string;
  category: string;
  createdDate: string;
  note?: string;
}

export interface ObservationChange {
  skillId: string;
  previouslySeen: boolean;
  nowReportedLost: boolean;
  date: string;
}

export interface RiskSignalInput {
  effectiveAgeDays: number;
  concerns: ConcernEntry[];
  observationChanges: ObservationChange[];
  mode: BuildMode;
  today?: string; // YYYY-MM-DD local date for time-bound concern rules
}

export interface RiskSignal {
  ruleId: string;
  status: string;
  message: string;
  recommendedAction: string;
}

/**
 * Conservative safety-net engine.
 * It does NOT calculate disease probability, diagnose, or perform emergency triage.
 * clinical_review rules are deliberately inactive until explicitly approved.
 */
export function evaluateRiskSignals(
  rules: RiskRule[],
  input: RiskSignalInput
): RiskSignal[] {
  const allowed = (rule: RiskRule) =>
    input.mode === "production"
      ? rule.reviewStatus === "approved"
      : rule.reviewStatus === "source_checked" || rule.reviewStatus === "approved";

  const applicable = new Map(
    rules
      .filter(
        (r) =>
          allowed(r) &&
          input.effectiveAgeDays >= r.age.minDays &&
          input.effectiveAgeDays <= r.age.maxDays
      )
      .map((r) => [r.id, r])
  );

  const signals: RiskSignal[] = [];

  const lossRule = applicable.get("RISK001");
  if (
    lossRule &&
    input.observationChanges.some((x) => x.previouslySeen && x.nowReportedLost)
  ) {
    signals.push({
      ruleId: lossRule.id,
      status: lossRule.userStatus,
      message: lossRule.userMessage,
      recommendedAction: lossRule.recommendedAction,
    });
  }

  const concernRule = applicable.get("RISK002");
  if (concernRule && input.concerns.length > 0) {
    signals.push({
      ruleId: concernRule.id,
      status: concernRule.userStatus,
      message: concernRule.userMessage,
      recommendedAction: concernRule.recommendedAction,
    });
  }

  // RISK003 uses its explicitly documented operational threshold: two notes
  // in the same category within the last 14 calendar days. Development data
  // remains gated because this rule's raw status is clinical_review.
  const repeatedRule = applicable.get("RISK003");
  if (repeatedRule) {
    const reference = input.today ?? new Date().toISOString().slice(0, 10);
    const referenceDay = Date.parse(`${reference}T12:00:00Z`);
    const categoryCounts = new Map<string, number>();
    for (const concern of input.concerns) {
      const day = Date.parse(`${concern.createdDate.slice(0, 10)}T12:00:00Z`);
      const daysAgo = Math.round((referenceDay - day) / 86_400_000);
      if (daysAgo < 0 || daysAgo > 13) continue;
      const category = concern.category.trim().toLocaleLowerCase("id-ID");
      if (category) categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
    if ([...categoryCounts.values()].some((count) => count >= 2)) {
      signals.push({
        ruleId: repeatedRule.id,
        status: repeatedRule.userStatus,
        message: repeatedRule.userMessage,
        recommendedAction: repeatedRule.recommendedAction,
      });
    }
  }

  // RISK004 remains inactive: its dataset has no numeric threshold or exact
  // age checkpoint. Review status alone cannot define an executable rule.

  if (signals.length === 0) {
    const insufficient = applicable.get("RISK005");
    if (insufficient) {
      signals.push({
        ruleId: insufficient.id,
        status: insufficient.userStatus,
        message: insufficient.userMessage,
        recommendedAction: insufficient.recommendedAction,
      });
    }
  }

  return signals;
}