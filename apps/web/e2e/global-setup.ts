import { execSync } from "node:child_process";

/** Fresh deterministic data for every run. */
export default function globalSetup() {
  if (process.env.E2E_SKIP_SEED) return;
  execSync("pnpm tsx prisma/seed.ts", { stdio: "inherit" });
}
