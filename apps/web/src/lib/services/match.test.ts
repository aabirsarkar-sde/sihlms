import { describe, expect, it } from "vitest";
import { matchScore } from "./match";

const job = { requiredSkills: ["Dairy management", "Accounting"], requiredProgrammeCodes: ["DAIRY-101"], state: "Gujarat", district: "Anand" };

describe("match score", () => {
  it("perfect candidate scores 100", () => {
    const r = matchScore({ skills: ["dairy management", "accounting"], programmeCodes: ["DAIRY-101"], state: "Gujarat", district: "Anand" }, job);
    expect(r.score).toBe(100);
  });
  it("weights: skills 50, cert 30, distance 20", () => {
    const halfSkillNoCertFar = matchScore({ skills: ["Accounting"], programmeCodes: [], state: "Assam", district: "Dibrugarh" }, job);
    expect(halfSkillNoCertFar.parts.skill).toBe(0.5);
    expect(halfSkillNoCertFar.parts.cert).toBe(0);
    expect(halfSkillNoCertFar.parts.dist).toBe(0);
    expect(halfSkillNoCertFar.score).toBe(25);
  });
  it("closer candidates rank higher", () => {
    const near = matchScore({ skills: [], programmeCodes: [], state: "Gujarat", district: "Ahmedabad" }, job);
    const far = matchScore({ skills: [], programmeCodes: [], state: "Maharashtra", district: "Nagpur" }, job);
    expect(near.score).toBeGreaterThan(far.score);
  });
});
