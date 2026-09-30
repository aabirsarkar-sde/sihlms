# Sahakar Setu: NCCT Training ERP, LMS & Employment Platform (SIH 26087)

One installable web app that runs NCCT's training lifecycle: **nominate → schedule → house → attend → learn → assess → certify → place**, in English, Hindi and Marathi, and usable offline on a phone.

## Run it

Requirements: Docker, Node 22, pnpm 9 (`corepack enable`).

```bash
docker compose up -d            # postgres (pgvector), web on :3000, face-svc on :8001, cron
pnpm install                    # once, on the host, for the seed script
cd apps/web && pnpm db:seed     # ~15 s: 18 institutions, 2,000 trainees, 1,200 certificates, 60 jobs
open http://localhost:3000
```

Local development without the web container:

```bash
docker compose up -d postgres
cd apps/web && cp .env.example .env
pnpm prisma migrate deploy && pnpm db:seed && pnpm dev
```

Optional: set `ANTHROPIC_API_KEY` for the LLM chatbot and lesson auto-translate. Without it, the chatbot answers from the FAQ in the user's language. To let a judge's phone open certificate QR codes, set `APP_URL` to your laptop's LAN address (for example `http://192.168.1.20:3000`) **before seeding**, because the URL is printed inside each PDF.

## Demo logins (OTP is always `123456` in demo mode)

The login page has one-tap buttons for each role.

| Phone | Role | Lands on |
|---|---|---|
| 9000000001 | NCCT HQ (super admin) | All-India dashboard |
| 9000000002 | VAMNICOM institute admin | Institution dashboard |
| 9000000003 | Faculty (Dr. Meera Iyer) | Today's sessions |
| 9000000004 | Trainee (Sunita Pawar) | Today |
| 9000000005 | Nominator (Pune District Coop. Union) | My nominations |
| 9000000006 | Employer (Krishna Valley Dairy Coop.) | Pipeline |
| 9000000007 | Second trainee (Ramesh Jadhav), for the face-kiosk step | Today |

Kiosk: open `/en/kiosk` and enter device key `ssd_demo_kiosk_key_vamnicom_2026` (dev only).

## The 5-minute demo

Seed shortly before presenting; "today's" session is anchored to seed time.

1. **Nominator** → Nominate → pick *PACS Computerisation and ERP — Batch 5* → upload `public/samples/nominations.csv`. 9 rows import; row 7 shows *"phone must be a 10-digit Indian mobile number"*.
2. **Institute admin** → Programmes → that batch → select all → Approve. The capacity bar fills and overflow is waitlisted. On the Hostel tab, click *Auto-allocate rooms*.
3. **Faculty** → Today → *Open live view* (the rotating QR changes every 30 s). **Trainee** on a phone → Scan; the live count ticks up. **Ramesh** enrols his face in Profile; the **kiosk** or the faculty *Face* tab marks him present.
4. **Trainee** → switch to हिन्दी → open the course → *Download for offline* → airplane mode → finish a lesson and the test → data on → the sync pill clears.
5. **Institute admin** → programme → Certificates → *Issue*. The trainee's Wallet shows it; scan its QR → **Valid**.
6. **Trainee** → career helper (orange button) → *"मेरे लिए कौन-सी नौकरियाँ सही हैं?"* → tap the job card → Apply.
7. **Employer** → the job → the applicant is ranked 100% with the verified certificate → move to *Shortlisted* (the phone number is revealed).
8. **HQ** → All-India dashboard shows the new certificate and placement.

This whole script runs automatically: `cd apps/web && pnpm build && pnpm test:e2e` (8 Playwright steps, including airplane mode).

## Architecture

```
apps/web (Next.js 14 App Router, TypeScript strict)
  src/app/[locale]/(public)   landing, catalogue, programme detail, jobs board, /verify/[certNo]
  src/app/[locale]/(auth)     phone OTP login, registration (DPDP purpose notice)
  src/app/[locale]/learn      trainee PWA: today, course player + quiz, scan, wallet, jobs, profile, downloads
  src/app/[locale]/faculty    today's sessions, live session (QR / scan / face / roster), timetable, course editor, progress
  src/app/[locale]/admin      dashboards, programme workspace, hostels, users, devices, reports, HQ-only screens
  src/app/[locale]/nominator  nominations, CSV import
  src/app/[locale]/employer   pipeline, jobs, candidate search, kanban
  src/app/[locale]/kiosk      device-authenticated attendance kiosk
  src/app/api/v1/**           REST (Zod-validated; OpenAPI at /api/v1/openapi.json)
  src/lib/services/*.ts       business rules, used by route handlers and pages
  src/lib/rbac.ts             the permissions matrix as code; authorize() is called in every handler
  public/sw.js                service worker; src/lib/offline.ts = Dexie outbox + course cache
  messages/{en,hi,mr}.json    all UI text (944 strings each)
services/face-svc (FastAPI + insightface buffalo_s): /enroll, /identify (+ liveness), /health
```

**Key rules and where they live.** Capacity-safe approvals: `services/nominations.ts` (row lock). Rotating QR (HMAC over a 30 s window; current and previous windows accepted): `lib/qr.ts`. Idempotent attendance and attempts by `clientId`: `services/attendance.ts`, `services/learning.ts`. Certificate eligibility and number format: `services/eligibility.ts`. Match score: `services/match.ts`. Timetable clashes: `services/clash.ts`. Every mutation writes an `AuditLog` row.

**Offline.** The service worker caches visited trainee and faculty pages. *Download for offline* stores the course bundle (lessons in all three languages, questions without answers, the trainee's personal QR) in IndexedDB. Offline writes (progress, attempts, attendance) go to a Dexie outbox and replay on `online` and Background Sync. Replays are safe because every record carries a device-generated UUID. Lesson progress merges with "max wins".

**Hardware contract.** Devices register in Admin → Devices (key shown once, only its hash stored) and call `POST /devices/heartbeat`, `GET /devices/sync-pull`, and `POST /attendance/sync` with `X-Device-Key`. The offline learning hub is not built yet; see DECISIONS.md.

## Quality checks

| Command | What it runs |
|---|---|
| `pnpm lint` | ESLint, including an error on hard-coded JSX text |
| `pnpm typecheck` | `tsc --noEmit` (strict) |
| `pnpm test` | 28 unit tests: eligibility, grading, QR token, match score, clashes, hostel allocation, RBAC for every role |
| `pnpm test:int` | Postgres tests: concurrent approvals never exceed capacity, waitlist promotion, 50-row CSV in under 5 s, attendance replay |
| `pnpm test:e2e` | The demo script above, in Chromium |
| `services/face-svc: pytest` | Liveness math |

CI (`.github/workflows/ci.yml`) runs all of these. Design choices and deviations from the PRD are in [DECISIONS.md](DECISIONS.md).
