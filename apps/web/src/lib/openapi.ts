import { z, type ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { BulkDecisionInput, DecisionInput, InstitutionInput, JobInput, ProgrammeInput } from "./schemas";
import { AttemptInput, ProgressInput } from "./services/learning";
import { SyncRecord } from "./services/attendance";
import { SessionInput } from "./services/programmes";
import { MePatch } from "./services/profile";
import { RegisterInput } from "./services/auth";
import { QuestionSchema } from "./services/grading";

type Op = { method: string; path: string; roles: string; summary: string; body?: ZodTypeAny };

const OPS: Op[] = [
  { method: "post", path: "/auth/otp/request", roles: "public", summary: "Request OTP (5/hour/phone)", body: z.object({ phone: z.string() }) },
  { method: "post", path: "/auth/otp/verify", roles: "public", summary: "Verify OTP; returns session or registration token", body: z.object({ phone: z.string(), code: z.string() }) },
  { method: "post", path: "/auth/register", roles: "public", summary: "Create account after OTP", body: RegisterInput },
  { method: "get", path: "/me", roles: "any", summary: "Current user and profile" },
  { method: "patch", path: "/me", roles: "any", summary: "Update profile", body: MePatch },
  { method: "get", path: "/institutions", roles: "any", summary: "List institutions" },
  { method: "post", path: "/institutions", roles: "SA", summary: "Create institution", body: InstitutionInput },
  { method: "get", path: "/programmes", roles: "any", summary: "List programmes (catalogue for TR/NO)" },
  { method: "post", path: "/programmes", roles: "SA, IA", summary: "Create programme (draft)", body: ProgrammeInput },
  { method: "post", path: "/programmes/{id}/publish", roles: "SA, IA", summary: "Publish" },
  { method: "post", path: "/programmes/{id}/nominations", roles: "TR, NO", summary: "Nominate (self or by phone)", body: z.object({ phone: z.string().optional(), remarks: z.string().optional() }) },
  { method: "get", path: "/programmes/{id}/nominations", roles: "IA, NO", summary: "Nomination queue" },
  { method: "post", path: "/nominations/import", roles: "NO, IA", summary: "CSV import (multipart file + programmeId)" },
  { method: "post", path: "/nominations/{id}/decision", roles: "IA", summary: "Approve / reject / waitlist", body: DecisionInput },
  { method: "post", path: "/nominations/bulk-decision", roles: "IA", summary: "Bulk decision (capacity-safe)", body: BulkDecisionInput },
  { method: "post", path: "/nominations/{id}/withdraw", roles: "TR, IA", summary: "Withdraw; oldest waitlisted auto-promotes" },
  { method: "get", path: "/programmes/{id}/sessions", roles: "IA, FA, TR", summary: "Timetable" },
  { method: "post", path: "/programmes/{id}/sessions", roles: "IA, FA", summary: "Create session (clash-checked)", body: SessionInput },
  { method: "patch", path: "/sessions/{id}", roles: "IA, FA", summary: "Update session (clash-checked)", body: SessionInput.partial() },
  { method: "get", path: "/sessions/{id}/qr", roles: "FA", summary: "Current rotating QR token (30 s window)" },
  { method: "post", path: "/attendance/scan", roles: "TR, FA", summary: "Submit QR token", body: z.object({ token: z.string().optional(), sessionId: z.string().optional(), payload: z.string().optional(), clientId: z.string().uuid() }) },
  { method: "post", path: "/attendance/face", roles: "FA, device", summary: "Image(s) → identify → mark (multipart)" },
  { method: "post", path: "/attendance/sync", roles: "TR, FA, device", summary: "Batch of offline records", body: z.object({ records: z.array(SyncRecord) }) },
  { method: "patch", path: "/attendance/{id}", roles: "FA, IA", summary: "Manual override with reason", body: z.object({ present: z.boolean(), reason: z.string() }) },
  { method: "post", path: "/programmes/{id}/allocate-rooms", roles: "IA", summary: "Auto-allocate hostel rooms" },
  { method: "patch", path: "/allocations/{id}", roles: "IA", summary: "Move allocation", body: z.object({ roomId: z.string() }) },
  { method: "get", path: "/programmes/{id}/logistics", roles: "IA", summary: "Logistics checklist + meal counts" },
  { method: "post", path: "/lessons/{id}/translate", roles: "FA, IA", summary: "LLM draft translation", body: z.object({ target: z.enum(["hi", "mr"]) }) },
  { method: "post", path: "/learn/progress", roles: "TR", summary: "Save lesson progress (max wins)", body: ProgressInput },
  { method: "get", path: "/learn/courses/{id}/offline-bundle", roles: "TR", summary: "Offline manifest" },
  { method: "patch", path: "/assessments/{id}", roles: "FA", summary: "Edit questions", body: z.object({ questions: z.array(QuestionSchema) }) },
  { method: "post", path: "/assessments/{id}/attempts", roles: "TR", summary: "Submit attempt (auto-graded, idempotent)", body: AttemptInput },
  { method: "post", path: "/programmes/{id}/certificates/issue", roles: "IA", summary: "Eligibility + bulk issue" },
  { method: "get", path: "/certificates/mine", roles: "TR", summary: "Wallet" },
  { method: "post", path: "/certificates/{id}/revoke", roles: "SA", summary: "Revoke", body: z.object({ reason: z.string() }) },
  { method: "get", path: "/verify/{certNo}", roles: "public", summary: "Verify certificate" },
  { method: "post", path: "/verify/upload", roles: "public", summary: "Verify a PDF by SHA-256 (multipart)" },
  { method: "post", path: "/chat", roles: "TR", summary: "Counselling bot (SSE)", body: z.object({ message: z.string(), locale: z.enum(["en", "hi", "mr"]) }) },
  { method: "get", path: "/jobs", roles: "EM, TR", summary: "Jobs" },
  { method: "post", path: "/jobs", roles: "EM", summary: "Post job", body: JobInput },
  { method: "get", path: "/jobs/{id}/candidates", roles: "EM (verified)", summary: "Ranked candidates" },
  { method: "post", path: "/jobs/{id}/apply", roles: "TR", summary: "Apply" },
  { method: "patch", path: "/applications/{id}", roles: "EM", summary: "Move in pipeline", body: z.object({ status: z.string() }) },
  { method: "get", path: "/analytics/{kind}", roles: "scoped", summary: "overview | trainees | attendance | assessments | placements" },
  { method: "get", path: "/exports/alumni.csv", roles: "SA, IA", summary: "Outreach export" },
  { method: "post", path: "/devices/heartbeat", roles: "device", summary: "Heartbeat (X-Device-Key)" },
  { method: "get", path: "/devices/sync-pull", roles: "device", summary: "Sessions, trainees, embeddings for offline kiosk" },
];

export function openApiSpec() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const op of OPS) {
    const params = [...op.path.matchAll(/\{(\w+)\}/g)].map((m) => ({ name: m[1], in: "path", required: true, schema: { type: "string" } }));
    (paths[op.path] ??= {})[op.method] = {
      summary: op.summary,
      description: `Roles: ${op.roles}`,
      parameters: params.length ? params : undefined,
      requestBody: op.body ? { required: true, content: { "application/json": { schema: zodToJsonSchema(op.body, { target: "openApi3", $refStrategy: "none" }) } } } : undefined,
      responses: { "200": { description: "OK" }, default: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } } },
    };
  }
  return {
    openapi: "3.0.3",
    info: { title: "Sahakar Setu API", version: "1.0.0", description: "REST API for the NCCT training ERP, LMS and employment platform. Session cookie auth; devices use X-Device-Key." },
    servers: [{ url: "/api/v1" }],
    components: {
      securitySchemes: { cookie: { type: "apiKey", in: "cookie", name: "ss_session" }, device: { type: "apiKey", in: "header", name: "X-Device-Key" } },
      schemas: {
        Error: { type: "object", properties: { error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" }, fields: { type: "object", additionalProperties: { type: "string" } } } } } },
      },
    },
    security: [{ cookie: [] }],
    paths,
  };
}
