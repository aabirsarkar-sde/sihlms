import { describe, expect, it } from "vitest";
import { authorize, can, type Actor } from "./rbac";

const A = (role: Actor["role"], extra: Partial<Actor> = {}): Actor => ({ id: `${role}-1`, role, institutionId: "i1", status: "ACTIVE", ...extra });

describe("RBAC per role", () => {
  it("SUPER_ADMIN: all institutions, can revoke certificates, cannot issue", () => {
    const a = A("SUPER_ADMIN", { institutionId: null });
    expect(can(a, "create", "institution")).toBe(true);
    expect(can(a, "update", "certificate")).toBe(true);
    expect(can(a, "create", "certificate", { institutionId: "i1" })).toBe(false);
    expect(can(a, "read", "audit")).toBe(true);
  });
  it("INSTITUTE_ADMIN: own institution only, cannot create SUPER_ADMIN users", () => {
    const a = A("INSTITUTE_ADMIN");
    expect(can(a, "update", "nomination", { institutionId: "i1" })).toBe(true);
    expect(can(a, "update", "nomination", { institutionId: "i2" })).toBe(false);
    expect(can(a, "create", "certificate", { institutionId: "i1" })).toBe(true);
    expect(can(a, "create", "user", { institutionId: "i1", targetRole: "FACULTY" })).toBe(true);
    expect(can(a, "create", "user", { institutionId: "i1", targetRole: "SUPER_ADMIN" })).toBe(false);
    expect(can(a, "create", "institution")).toBe(false);
  });
  it("FACULTY: sessions only when assigned, no nominations decisions", () => {
    const a = A("FACULTY");
    expect(can(a, "create", "session", { institutionId: "i1", assigned: true })).toBe(true);
    expect(can(a, "create", "session", { institutionId: "i1", assigned: false })).toBe(false);
    expect(can(a, "update", "nomination", { institutionId: "i1" })).toBe(false);
    expect(can(a, "create", "attendance", { institutionId: "i1" })).toBe(true);
  });
  it("TRAINEE: own data, published programmes, attendance only when enrolled", () => {
    const a = A("TRAINEE", { institutionId: null });
    expect(can(a, "read", "programme", { published: true })).toBe(true);
    expect(can(a, "read", "programme", { published: false })).toBe(false);
    expect(can(a, "create", "nomination", { ownerId: a.id })).toBe(true);
    expect(can(a, "create", "nomination", { ownerId: "someone-else" })).toBe(false);
    expect(can(a, "create", "attendance", { ownerId: a.id, enrolled: false })).toBe(false);
    expect(can(a, "read", "certificate", { ownerId: "x" })).toBe(false);
    expect(can(a, "create", "job")).toBe(false);
  });
  it("NOMINATOR: nominate, read own nominations", () => {
    const a = A("NOMINATOR", { institutionId: null });
    expect(can(a, "create", "nomination")).toBe(true);
    expect(can(a, "read", "nomination", { ownerId: a.id })).toBe(true);
    expect(can(a, "update", "nomination", { institutionId: "i1" })).toBe(false);
  });
  it("EMPLOYER: own jobs; pending employers cannot see certificates", () => {
    const a = A("EMPLOYER", { institutionId: null });
    expect(can(a, "update", "job", { ownerId: a.id })).toBe(true);
    expect(can(a, "update", "job", { ownerId: "other" })).toBe(false);
    expect(can(a, "read", "certificate")).toBe(true);
    expect(can({ ...a, status: "PENDING" }, "read", "certificate")).toBe(false);
    expect(() => authorize(a, "read", "attendance")).toThrow();
  });
});
