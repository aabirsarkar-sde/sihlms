import type { Role } from "@prisma/client";
import { ApiError } from "./errors";

export type Action = "create" | "read" | "update" | "delete";
export type Resource =
  | "institution"
  | "programme"
  | "nomination"
  | "session"
  | "hostel"
  | "attendance"
  | "course"
  | "assessment"
  | "attempt"
  | "certificate"
  | "job"
  | "application"
  | "analytics"
  | "user"
  | "device"
  | "audit";

export type Actor = { id: string; role: Role; institutionId?: string | null; status?: string };

/**
 * Context describing the specific record being acted on.
 * - institutionId: institution the record belongs to
 * - ownerId: user who owns the record (trainee, nominator, employer, author)
 * - assigned: the faculty is assigned (session faculty / programme coordinator / course owner)
 * - enrolled: the trainee is enrolled in the related programme / course
 * - published: the programme or course is published
 */
export type Ctx = {
  institutionId?: string | null;
  ownerId?: string | null;
  assigned?: boolean;
  enrolled?: boolean;
  published?: boolean;
  targetRole?: Role;
};

type Rule = (a: Actor, c: Ctx) => boolean;
const any: Rule = () => true;
const none: Rule = () => false;
const ownInst: Rule = (a, c) => !!a.institutionId && a.institutionId === c.institutionId;
const own: Rule = (a, c) => !!c.ownerId && a.id === c.ownerId;
const assigned: Rule = (a, c) => ownInst(a, c) && !!c.assigned;

type Matrix = Record<Resource, Partial<Record<Role, Partial<Record<Action, Rule>>>>>;

/** The permissions matrix from the PRD, as code. Anything not listed is denied. */
export const MATRIX: Matrix = {
  institution: {
    SUPER_ADMIN: { create: any, read: any, update: any, delete: any },
    INSTITUTE_ADMIN: { read: any, update: ownInst },
    FACULTY: { read: any },
    TRAINEE: { read: any },
    NOMINATOR: { read: any },
    EMPLOYER: { read: any },
  },
  programme: {
    SUPER_ADMIN: { create: any, read: any, update: any, delete: any },
    INSTITUTE_ADMIN: { create: ownInst, read: any, update: ownInst, delete: ownInst },
    FACULTY: { read: any, update: assigned },
    TRAINEE: { read: (_a, c) => !!c.published },
    NOMINATOR: { read: (_a, c) => !!c.published },
  },
  nomination: {
    SUPER_ADMIN: { read: any },
    INSTITUTE_ADMIN: { read: ownInst, update: ownInst },
    FACULTY: { read: ownInst },
    TRAINEE: { create: own, read: own, update: own },
    NOMINATOR: { create: any, read: own },
  },
  session: {
    SUPER_ADMIN: { read: any },
    INSTITUTE_ADMIN: { create: ownInst, read: ownInst, update: ownInst, delete: ownInst },
    FACULTY: { create: assigned, read: ownInst, update: assigned, delete: assigned },
    TRAINEE: { read: (_a, c) => !!c.enrolled },
  },
  hostel: {
    SUPER_ADMIN: { read: any },
    INSTITUTE_ADMIN: { create: ownInst, read: ownInst, update: ownInst, delete: ownInst },
    FACULTY: { read: ownInst },
    TRAINEE: { read: own },
  },
  attendance: {
    SUPER_ADMIN: { read: any },
    INSTITUTE_ADMIN: { read: ownInst, update: ownInst },
    FACULTY: { create: ownInst, read: ownInst, update: assigned },
    TRAINEE: { create: (a, c) => own(a, c) && !!c.enrolled, read: own },
  },
  course: {
    SUPER_ADMIN: { create: any, read: any, update: any, delete: any },
    INSTITUTE_ADMIN: { create: any, read: any, update: (a, c) => own(a, c) || ownInst(a, c), delete: (a, c) => own(a, c) || ownInst(a, c) },
    FACULTY: { create: any, read: any, update: (a, c) => own(a, c) || !!c.assigned, delete: own },
    TRAINEE: { read: (_a, c) => !!c.enrolled || !!c.published },
  },
  assessment: {
    SUPER_ADMIN: { read: any },
    INSTITUTE_ADMIN: { read: any },
    FACULTY: { create: any, read: any, update: (a, c) => own(a, c) || !!c.assigned, delete: (a, c) => own(a, c) || !!c.assigned },
    TRAINEE: { read: (_a, c) => !!c.enrolled || !!c.published },
  },
  attempt: {
    SUPER_ADMIN: { read: any },
    INSTITUTE_ADMIN: { read: any },
    FACULTY: { read: any },
    TRAINEE: { create: (_a, c) => !!c.enrolled || !!c.published, read: own },
  },
  certificate: {
    SUPER_ADMIN: { read: any, update: any },
    INSTITUTE_ADMIN: { create: ownInst, read: ownInst },
    FACULTY: { read: ownInst },
    TRAINEE: { read: own },
    NOMINATOR: { read: own },
    EMPLOYER: { read: (a) => a.status === "ACTIVE" },
  },
  job: {
    SUPER_ADMIN: { read: any, update: any },
    INSTITUTE_ADMIN: { read: any },
    TRAINEE: { read: any },
    EMPLOYER: { create: any, read: any, update: own, delete: own },
  },
  application: {
    SUPER_ADMIN: { read: any },
    INSTITUTE_ADMIN: { read: any },
    TRAINEE: { create: any, read: own, update: own },
    EMPLOYER: { read: own, update: own },
  },
  analytics: {
    SUPER_ADMIN: { read: any },
    INSTITUTE_ADMIN: { read: ownInst },
    FACULTY: { read: ownInst },
    TRAINEE: { read: own },
    NOMINATOR: { read: own },
    EMPLOYER: { read: own },
  },
  user: {
    SUPER_ADMIN: { create: any, read: any, update: any, delete: any },
    INSTITUTE_ADMIN: {
      create: (a, c) => ownInst(a, c) && c.targetRole !== "SUPER_ADMIN",
      read: ownInst,
      update: (a, c) => (ownInst(a, c) && c.targetRole !== "SUPER_ADMIN") || own(a, c),
      delete: (a, c) => ownInst(a, c) && c.targetRole !== "SUPER_ADMIN",
    },
    FACULTY: { read: own, update: own },
    TRAINEE: { read: own, update: own },
    NOMINATOR: { read: own, update: own },
    EMPLOYER: { read: own, update: own },
  },
  device: {
    SUPER_ADMIN: { create: any, read: any, update: any, delete: any },
    INSTITUTE_ADMIN: { create: ownInst, read: ownInst, update: ownInst, delete: ownInst },
  },
  audit: { SUPER_ADMIN: { read: any } },
};

export function can(actor: Actor, action: Action, resource: Resource, ctx: Ctx = {}): boolean {
  const rule = MATRIX[resource]?.[actor.role]?.[action] ?? none;
  return rule(actor, ctx);
}

/** Throws FORBIDDEN unless the actor may perform action on resource. Call in every handler. */
export function authorize(actor: Actor, action: Action, resource: Resource, ctx: Ctx = {}): void {
  if (!can(actor, action, resource, ctx)) {
    throw new ApiError("FORBIDDEN", `${actor.role} cannot ${action} ${resource}`);
  }
}

/** Prisma `where` fragment that scopes institution-owned rows to what the actor can see. */
export function institutionScope(actor: Actor): { institutionId?: string } {
  if (actor.role === "SUPER_ADMIN") return {};
  if (actor.institutionId) return { institutionId: actor.institutionId };
  return {};
}
