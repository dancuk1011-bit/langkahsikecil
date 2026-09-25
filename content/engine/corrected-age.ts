const DAY_MS = 86_400_000;
const TERM_GESTATION_DAYS = 40 * 7;
const PRETERM_THRESHOLD_DAYS = 37 * 7;

export interface PrematurityInput {
  chronologicalAgeDays: number;
  gestationalAgeWeeks?: number | null;
  gestationalAgeDays?: number | null;
  useCorrectedAge?: boolean;
}

/**
 * Corrected age = chronological age - number of days born before 40 weeks.
 * This utility does not decide whether a child is healthy or delayed.
 */
export function calculateCorrectedAgeDays(input: PrematurityInput): number | null {
  const { chronologicalAgeDays, gestationalAgeWeeks, gestationalAgeDays = 0 } = input;

  if (gestationalAgeWeeks == null) return null;

  const gestationAtBirthDays = gestationalAgeWeeks * 7 + (gestationalAgeDays ?? 0);
  if (gestationAtBirthDays >= PRETERM_THRESHOLD_DAYS) return chronologicalAgeDays;

  const bornEarlyDays = Math.max(0, TERM_GESTATION_DAYS - gestationAtBirthDays);
  return Math.max(0, chronologicalAgeDays - bornEarlyDays);
}

export function effectiveAgeDays(input: PrematurityInput): number {
  if (!input.useCorrectedAge) return input.chronologicalAgeDays;
  return calculateCorrectedAgeDays(input) ?? input.chronologicalAgeDays;
}

export function ageDaysFromDates(dateOfBirthISO: string, todayISO: string): number {
  const dob = new Date(`${dateOfBirthISO}T00:00:00`);
  const today = new Date(`${todayISO}T00:00:00`);
  return Math.max(0, Math.floor((today.getTime() - dob.getTime()) / DAY_MS));
}
