/**
 * The 5-minute demo script from the PRD, end to end through the UI.
 * (Step 3's kiosk face recognition needs a camera; it is covered by the face-svc + /attendance/sync API instead.)
 */
import path from "node:path";
import { expect, test } from "@playwright/test";
import { db, loginAs, PHONES } from "./helpers";

test.describe.configure({ mode: "serial" });

test.afterAll(async () => db.$disconnect());

test("1. nominator uploads a 10-row CSV; one row errors with a clear message", async ({ page }) => {
  await loginAs(page, PHONES.NO);
  await page.goto("/en/nominator/nominate");
  const upcoming = await db.programme.findUniqueOrThrow({ where: { code: "VAMN-ERP-DEMO" } });
  await page.getByTestId("programme-select").selectOption(upcoming.id);
  await page.getByTestId("csv-input").setInputFiles(path.join(__dirname, "../public/samples/nominations.csv"));
  await page.getByTestId("csv-upload").click();
  const report = page.getByTestId("import-report");
  await expect(report).toContainText("9 of 10 rows nominated");
  await expect(report).toContainText("phone must be a 10-digit Indian mobile number");
});

test("2. institute admin bulk-approves; capacity bar fills; rooms auto-allocate", async ({ page }) => {
  await loginAs(page, PHONES.IA);
  const upcoming = await db.programme.findUniqueOrThrow({ where: { code: "VAMN-ERP-DEMO" } });
  await page.goto(`/en/admin/programmes/${upcoming.id}`);
  const before = await page.getByTestId("capacity-count").textContent();
  await page.getByTestId("select-all").check();
  await page.getByTestId("bulk-approve").click();
  await expect(page.getByTestId("capacity-count")).not.toHaveText(before!);
  const approved = await db.nomination.count({ where: { programmeId: upcoming.id, status: "APPROVED" } });
  expect(approved).toBeLessThanOrEqual(upcoming.capacity);
  await page.goto(`/en/admin/programmes/${upcoming.id}?tab=hostel`);
  await page.getByTestId("allocate-rooms").click();
  await expect(page.getByText(/trainees allocated/)).toBeVisible();
});

test("3. faculty opens today's session; trainee scans the rotating QR; live count ticks up", async ({ browser }) => {
  const fa = await (await browser.newContext()).newPage();
  await loginAs(fa, PHONES.FA);
  await fa.goto("/en/faculty");
  await fa.getByTestId("open-live").first().click();
  await expect(fa.getByTestId("live-count")).toContainText("0");
  await fa.getByText("Show code text").click();
  const token = (await fa.getByTestId("session-token").textContent())!.trim();

  const tr = await (await browser.newContext()).newPage();
  await loginAs(tr, PHONES.TR);
  await tr.goto("/en/learn/scan");
  await tr.getByText("Enter code manually").click();
  const t0 = Date.now();
  await tr.getByTestId("manual-code").fill(token);
  await tr.getByRole("button", { name: "Submit" }).click();
  await expect(tr.getByTestId("scan-result")).toContainText("Attendance marked");
  expect(Date.now() - t0).toBeLessThan(3000);
  // Replaying the same code is idempotent
  await tr.getByRole("button", { name: "Submit" }).click();
  await expect(tr.getByTestId("scan-result")).toContainText("already marked");
  await expect(fa.getByTestId("live-count")).toContainText("1", { timeout: 8000 });
});

test("4. trainee in Hindi finishes a lesson and the quiz offline; sync pill clears on reconnect", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await loginAs(page, PHONES.TR);
  const course = await db.course.findFirstOrThrow({ where: { title: { startsWith: "Dairy" } }, include: { assessments: true } });
  const url = `/hi/learn/courses/${course.id}`;
  await page.goto(url);
  // Wait for the service worker to take control, then load once more so the page is cached.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.getByTestId("download-offline").click();
  await expect(page.getByTestId("download-offline")).toContainText("ऑफ़लाइन उपलब्ध");

  await ctx.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("lesson-title")).toBeVisible();
  await page.getByTestId("complete-lesson").click();
  await expect(page.getByTestId("sync-pill")).toContainText("बाकी");

  // Quiz offline: answer every question correctly using the Hindi option text
  type Q = { id: string; type: string; answer: number | number[] | boolean; translations: { hi: { prompt: string; options?: string[] } } };
  const qs = course.assessments[0].questions as unknown as Q[];
  await page.getByTestId("open-quiz").click();
  await page.getByTestId("start-quiz").click();
  const cards = page.getByTestId("question");
  const n = await cards.count();
  for (let i = 0; i < n; i++) {
    const card = cards.nth(i);
    const text = (await card.textContent()) ?? "";
    const q = qs.find((x) => text.includes(x.translations.hi.prompt))!;
    if (q.type === "TF") await card.getByLabel(q.answer ? "सही" : "गलत", { exact: true }).check();
    else for (const idx of Array.isArray(q.answer) ? q.answer : [q.answer as number]) await card.getByLabel(q.translations.hi.options![idx], { exact: true }).check();
  }
  await page.getByTestId("submit-quiz").click();
  await expect(page.getByTestId("quiz-queued")).toBeVisible();

  await ctx.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByTestId("sync-pill")).not.toContainText("बाकी", { timeout: 15_000 });
  const trainee = await db.user.findUniqueOrThrow({ where: { phone: PHONES.TR } });
  const attempt = await db.attempt.findFirst({ where: { traineeId: trainee.id, assessmentId: course.assessments[0].id } });
  expect(attempt?.scorePct).toBe(100);
  await ctx.close();
});

test("5. admin issues certificates; wallet shows it; public verify says Valid", async ({ browser }) => {
  const ia = await (await browser.newContext()).newPage();
  await loginAs(ia, PHONES.IA);
  const p = await db.programme.findUniqueOrThrow({ where: { code: "VAMN-DCM-DEMO" } });
  await ia.goto(`/en/admin/programmes/${p.id}?tab=certificates`);
  await ia.getByTestId("issue-certificates").click();
  await expect(ia.getByTestId("issue-result")).toContainText("certificates issued");

  const tr = await (await browser.newContext()).newPage();
  await loginAs(tr, PHONES.TR);
  await tr.goto("/en/learn/wallet");
  await expect(tr.getByTestId("wallet")).toContainText("Dairy Cooperative Management — Batch 12");
  const cert = await db.certificate.findFirstOrThrow({ where: { trainee: { phone: PHONES.TR }, programmeId: p.id } });

  const judge = await (await browser.newContext()).newPage();
  const t0 = Date.now();
  await judge.goto(`/en/verify/${cert.certNo}`);
  await expect(judge.getByTestId("verify-status")).toHaveAttribute("data-status", "VALID");
  expect(Date.now() - t0).toBeLessThan(2000);
});

test("6. trainee asks the chatbot in Hindi which jobs suit them, taps the job card, applies", async ({ page }) => {
  await loginAs(page, PHONES.TR);
  await page.goto("/hi/learn");
  await page.getByTestId("chat-open").click();
  await page.getByRole("button", { name: "मेरे लिए कौन-सी नौकरियाँ सही हैं?" }).click();
  const card = page.getByTestId("chat-card-job").first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(card).toContainText("Milk Quality Supervisor");
  await card.click();
  await page.getByTestId("apply").first().click();
  await expect(page.getByTestId("applied").first()).toBeVisible();
});

test("7. employer sees the applicant ranked with the verified certificate and shortlists them", async ({ page }) => {
  await loginAs(page, PHONES.EM);
  const job = await db.job.findFirstOrThrow({ where: { title: "Milk Quality Supervisor", employer: { phone: PHONES.EM } } });
  await page.goto(`/en/employer/jobs/${job.id}`);
  const card = page.getByTestId("col-APPLIED").getByTestId("applicant-card").filter({ hasText: "Sunita Pawar" });
  await expect(card).toContainText("100%");
  await expect(card).toContainText("Dairy Cooperative Management — Batch 12");
  await card.getByTestId("move-select").selectOption("SHORTLISTED");
  await expect(page.getByTestId("col-SHORTLISTED")).toContainText("Sunita Pawar");
  await page.reload();
  await expect(page.getByTestId("col-SHORTLISTED")).toContainText("90000000"); // phone revealed after shortlisting
});

test("8. HQ dashboard reflects the new certificate", async ({ page }) => {
  await loginAs(page, PHONES.SA);
  const t0 = Date.now();
  await page.goto("/en/admin");
  await expect(page.getByTestId("kpis")).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(4000);
  const certs = await db.certificate.count({ where: { revokedAt: null } });
  await expect(page.getByTestId("kpis")).toContainText(certs.toLocaleString("en-IN"));
});
