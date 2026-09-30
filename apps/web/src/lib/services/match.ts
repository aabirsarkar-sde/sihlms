import { districtCoords, haversineKm } from "../geo";

export type CandidateInput = {
  skills: string[];
  programmeCodes: string[]; // codes of programmes the trainee holds a valid certificate for
  state: string;
  district: string;
};
export type JobInput = {
  requiredSkills: string[];
  requiredProgrammeCodes: string[];
  state: string;
  district: string;
};

const norm = (s: string) => s.trim().toLowerCase();
export const MAX_DISTANCE_KM = 500;

/** Match score 0–100: skill overlap 50%, required certificate 30%, distance 20%. */
export function matchScore(c: CandidateInput, j: JobInput) {
  const have = new Set(c.skills.map(norm));
  const need = j.requiredSkills.map(norm);
  const skill = need.length === 0 ? 1 : need.filter((s) => have.has(s)).length / need.length;

  let cert: number;
  if (j.requiredProgrammeCodes.length === 0) cert = c.programmeCodes.length > 0 ? 1 : 0.5;
  else cert = j.requiredProgrammeCodes.some((code) => c.programmeCodes.includes(code)) ? 1 : 0;

  const a = districtCoords(c.state, c.district);
  const b = districtCoords(j.state, j.district);
  let distanceKm: number | null = null;
  let dist = 0.5;
  if (a && b) {
    distanceKm = Math.round(haversineKm(a, b));
    dist = Math.max(0, 1 - distanceKm / MAX_DISTANCE_KM);
  } else if (c.state === j.state) dist = 0.7;

  const score = Math.round(skill * 50 + cert * 30 + dist * 20);
  return { score, parts: { skill, cert, dist }, distanceKm };
}
