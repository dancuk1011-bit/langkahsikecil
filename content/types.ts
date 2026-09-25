export type ReviewStatus = "draft" | "source_checked" | "clinical_review" | "approved";
export type BuildMode = "development" | "production";

export interface AgeRange {
  minDays: number;
  maxDays: number;
  minMonth?: number;
  maxMonth?: number;
  label?: string;
}

export interface Activity {
  id: string;
  title: string;
  age: Required<Pick<AgeRange, "minDays" | "maxDays">> & Partial<AgeRange>;
  domains: { primary: string; secondary: string[] };
  type: string;
  durationMinutes: number | null;
  materials: string[];
  benefit: { short: string; detail: string };
  instructions: string[];
  observe: string[];
  variations: { easier: string | null; alternate: string | null };
  safety: {
    notes: string[];
    stopConditions: string[];
    prematurityNote: string | null;
  };
  sourceRefs: string[];
  evidenceNote: string | null;
  review: {
    status: ReviewStatus;
    reviewer: string | null;
    lastReviewedAt: string | null;
  };
  contentVersion: string;
}

export interface Skill {
  id: string;
  label: string;
  domain: string;
  age: { minDays: number; maxDays: number };
  observationType: string;
  description: string;
  sourceRefs: string[];
  guardrailNote: string | null;
  reviewStatus: ReviewStatus;
}

export interface ActivitySkillMap {
  activityId: string;
  skillId: string;
  relation: "primary" | "secondary" | string;
}

export interface Source {
  id: string;
  organization: string;
  title: string;
  year: string | number;
  type: string;
  url: string;
  evidenceNote: string;
  tier: string;
}

export interface RiskRule {
  id: string;
  name: string;
  age: { minDays: number; maxDays: number };
  triggerDescription: string;
  userStatus: string;
  userMessage: string;
  recommendedAction: string;
  sourceRefs: string[];
  guardrail: string;
  reviewStatus: ReviewStatus;
}