# Decisions

Where the PRD was silent, or a named package was a poor fit, I chose the simplest option that still meets the acceptance criteria. Each entry says what changed and why.

## Stack substitutions

| PRD said | Built with | Why |
|---|---|---|
| Auth.js (NextAuth v5) | Custom phone-OTP flow + HS256 JWT session cookie (`jose`), `src/lib/session.ts`, `src/lib/auth.ts` | v5 is still beta and its credentials provider adds little for OTP-only login. Our version is about 150 lines, works on the edge (middleware), and keeps the OTP rate limit and registration token in our own code. Optional password login uses argon2 (`/auth/login`). |
| Serwist (Workbox) | Hand-written `public/sw.js` | Serwist's Next 14 plugin requires webpack config changes and gives little extra for our 4 routes. The SW precaches the shell, caches visited trainee/faculty pages network-first (HTML and RSC payloads), caches lesson media, falls back to `/offline.html`, and hands Background Sync to the page's Dexie outbox. |
| @react-pdf/renderer | `pdf-lib` + `qrcode` | react-pdf does not run well in Next server routes (ESM/React-renderer conflicts). pdf-lib generates about 90 PDFs/s, so 100 certificates take about 1–2 s, well under the 30 s AC. |
| shadcn/ui | shadcn-style primitives written by hand (`src/components/ui/*`) | Same Tailwind + cva approach without the interactive CLI. Only what we use. |
| pgvector embeddings for chatbot retrieval | Postgres full-text search (`to_tsvector('simple')`) over `ContentChunk`, plus the trainee's ranked jobs and open programmes | Anthropic has no embeddings endpoint, and a second provider only for embeddings was not worth it. The `embedding vector(1024)` column exists (pgvector image) so a Voyage/other embedder can be dropped in `src/lib/ai.ts#retrieve` later. |
| MinIO | `src/lib/storage.ts`: **Vercel Blob (private)** when `BLOB_READ_WRITE_TOKEN` is set, local disk (`./uploads`) otherwise. MinIO stays in compose under the `minio` profile. | One put/get interface, two backends. Storage keys double as Blob pathnames, so DB values are the same on both. Nothing is linked directly: downloads go through signed, expiring `/api/v1/files` URLs (the "signed, short-lived URLs" rule). |
| Chatbot model | `claude-haiku-4-5` (override with `CHAT_MODEL`) | The under-5 s response AC favours the fastest model. Without `ANTHROPIC_API_KEY`, or on timeout, the bot falls back to keyword FAQ matching in the user's language (the PRD AC). |

## Data model additions (beyond the 26 PRD models)

- `OtpRequest`: OTP codes with expiry; also provides the 5-per-hour-per-phone rate limit.
- `Notification`: in-app notice feed (the bell). SMS/email are logged to the console in dev.
- `JobQueue`: the "DB-backed job table polled by a cron route" (`/api/v1/cron`, polled by the `cron` compose service).
- `Counter`: atomic per-institution, per-year certificate sequence (`INSERT … ON CONFLICT … RETURNING`).
- Columns: `TraineeProfile.diet` (drives veg/non-veg meal counts), `lat/lng` on profiles and jobs (distance score), `Attendance.present` + `reason` (manual overrides can mark absent, with a reason), `Lesson.captionsUrl` (WCAG captions field), `Job.hidden` (HQ moderation), unique `(programmeId, traineeId)` on `Certificate` and `RoomAllocation`.

## Behaviour choices

- **Capacity.** Approvals lock the programme row (`SELECT … FOR UPDATE`) inside the transaction that counts approved nominations, so concurrent approvals can never exceed capacity. Overflow becomes `WAITLISTED`. Tested with 10 concurrent approvals on a 5-seat programme (`src/test/capacity.int.test.ts`).
- **Certificate PDFs are reproducible.** pdf-lib output is byte-deterministic, so each certificate stores `renderInput`, a snapshot of the exact values it was rendered from (name, programme, dates, verify URL). If the stored file is missing, `certificatePdfBytes` rebuilds it and serves it **only if** the SHA-256 equals the hash recorded at issue. A tampered snapshot is refused. The snapshot also keeps the certificate immutable when a trainee later renames themselves or a programme is edited. The seed relies on this under Blob to avoid 1,200 uploads; certificates issued from the app are always uploaded. Caveat: changing the PDF template would stop *regeneration* matching old hashes, so bump the template carefully (stored files are unaffected).
- **Demo OTP rate limit.** The 5-per-hour OTP limit does not apply to the seven fixed demo numbers when demo mode is on, so repeated logins during a presentation can't lock anyone out. All other numbers are still limited.
- **Offline QR scans** carry `scannedAt`; the server checks the rotating token against that time, not the replay time. This lets a scan made in a dead zone sync later, at the cost of trusting the device clock (future timestamps are clamped to now).
- **Eligibility** counts sessions that have *started*, so a programme can issue certificates on its last day. A programme without an assessment needs attendance only.
- **Match score** (0–100) = skill overlap 50 + certificate 30 + distance 20. If a job requires no programme codes, any valid certificate earns the full 30 and none earns 15. Distance uses district-HQ coordinates (`src/lib/geo.ts`) and reaches 0 at 500 km.
- **Phone privacy.** Employers see a masked number until the candidate is `SHORTLISTED` or later. Employers stay `PENDING` (no candidate search) until HQ verifies them.
- **Account deletion (DPDP)** anonymises the person (phone, email, face, village, skills, chats). Certificates are kept because revocation, not deletion, is the rule for issued certificates.
- **Face data.** Only a 512-d embedding is stored, and only after explicit consent. Photos are never persisted. Liveness requires a head turn across 3 frames (yaw proxy from 5-point landmarks), so a still printed photo fails.
- **Kiosk offline.** The kiosk page (`/[locale]/kiosk`) authenticates with `X-Device-Key` only. It caches `sync-pull` and its mark queue in IndexedDB and calls the *local* face-svc directly, so identification works with no internet.
- **Offline learning hub: not built yet.** Hubs can be registered as `HUB` devices and authenticate with the same device-key contract, and every write endpoint they would replay is idempotent by `clientId`. The `HUB_MODE=true` replica itself (serving cached courses on its hotspot and syncing up and down) is not implemented. It is the main remaining item from the hardware section.
- **Timetable clash detection** is institution-wide: the same faculty or the same room (case-insensitive) at overlapping times is refused, and the error names the clashing session.
- **Hostel allocation** fills partly used rooms first and matches hostel gender. Trainees whose profile has no gender yet (CSV stubs) are reported separately, not silently dropped.
- **i18n.** `react/jsx-no-literals` is an **error** in ESLint (punctuation and a few proper nouns allowed). Locale files are layered over English at runtime, so a missing translation shows English, never a raw key. `scripts/check-messages.py` lists unused or missing keys.
- **Dates and time zone.** All rendering uses `Asia/Kolkata` and `en-IN` / `hi-IN` / `mr-IN` formats.
- **All pages render dynamically** (`force-dynamic`), because every page depends on the session or live data, and so the Docker image builds without a database.
- **Demo data is time-relative**: the seed anchors "today's" session and the ongoing batch to the time you run it. Run `pnpm db:seed` (or `pnpm demo:reset`) shortly before a demo.
