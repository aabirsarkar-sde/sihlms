export type EligibilityInput = {
  attendedSessions: number;
  totalSessions: number;
  bestScorePct: number | null;
  minAttendancePct: number;
  passMarkPct: number;
  requiresAssessment: boolean;
};

export type EligibilityResult = {
  eligible: boolean;
  attendancePct: number;
  bestScorePct: number | null;
  reasons: ("LOW_ATTENDANCE" | "NO_ATTEMPT" | "LOW_SCORE")[];
};

/** A certificate can be issued only if attendance ≥ minAttendancePct and best score ≥ passMarkPct. */
export function evaluateEligibility(i: EligibilityInput): EligibilityResult {
  const attendancePct = i.totalSessions === 0 ? 100 : Math.round((i.attendedSessions / i.totalSessions) * 1000) / 10;
  const reasons: EligibilityResult["reasons"] = [];
  if (attendancePct < i.minAttendancePct) reasons.push("LOW_ATTENDANCE");
  if (i.requiresAssessment) {
    if (i.bestScorePct == null) reasons.push("NO_ATTEMPT");
    else if (i.bestScorePct < i.passMarkPct) reasons.push("LOW_SCORE");
  }
  return { eligible: reasons.length === 0, attendancePct, bestScorePct: i.bestScorePct, reasons };
}

/** `NCCT-<institution code>-<YYYY>-<6-digit sequence>` */
export function formatCertNo(institutionCode: string, year: number, seq: number) {
  return `NCCT-${institutionCode}-${year}-${String(seq).padStart(6, "0")}`;
}

export const CERT_NO_RE = /^NCCT-[A-Z0-9]+-\d{4}-\d{6}$/;
