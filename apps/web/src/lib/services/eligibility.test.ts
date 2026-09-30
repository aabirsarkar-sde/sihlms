import { describe, expect, it } from "vitest";
import { CERT_NO_RE, evaluateEligibility, formatCertNo } from "./eligibility";

const base = { minAttendancePct: 75, passMarkPct: 60, requiresAssessment: true };

describe("eligibility", () => {
  it("eligible when attendance and score meet thresholds", () => {
    const r = evaluateEligibility({ ...base, attendedSessions: 3, totalSessions: 4, bestScorePct: 60 });
    expect(r.eligible).toBe(true);
    expect(r.attendancePct).toBe(75);
  });
  it("flags low attendance", () => {
    const r = evaluateEligibility({ ...base, attendedSessions: 2, totalSessions: 4, bestScorePct: 90 });
    expect(r.reasons).toEqual(["LOW_ATTENDANCE"]);
  });
  it("flags missing attempt and low score", () => {
    expect(evaluateEligibility({ ...base, attendedSessions: 4, totalSessions: 4, bestScorePct: null }).reasons).toEqual(["NO_ATTEMPT"]);
    expect(evaluateEligibility({ ...base, attendedSessions: 4, totalSessions: 4, bestScorePct: 59.9 }).reasons).toEqual(["LOW_SCORE"]);
  });
  it("no assessment required → attendance only", () => {
    expect(evaluateEligibility({ ...base, requiresAssessment: false, attendedSessions: 4, totalSessions: 4, bestScorePct: null }).eligible).toBe(true);
  });
  it("formats certificate numbers", () => {
    const n = formatCertNo("VAMN", 2026, 123);
    expect(n).toBe("NCCT-VAMN-2026-000123");
    expect(CERT_NO_RE.test(n)).toBe(true);
  });
});
