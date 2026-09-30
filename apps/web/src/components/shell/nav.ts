import type { Role } from "@prisma/client";

export type NavItem = { href: string; key: string; icon: string; mobile?: boolean };

export const NAV: Record<Role, NavItem[]> = {
  TRAINEE: [
    { href: "/learn", key: "today", icon: "home", mobile: true },
    { href: "/learn/programmes", key: "myProgrammes", icon: "calendar", mobile: true },
    { href: "/learn/scan", key: "scan", icon: "scan", mobile: true },
    { href: "/learn/wallet", key: "wallet", icon: "award", mobile: true },
    { href: "/learn/jobs", key: "jobs", icon: "briefcase", mobile: true },
    { href: "/learn/downloads", key: "downloads", icon: "download" },
    { href: "/learn/profile", key: "profile", icon: "user" },
  ],
  FACULTY: [
    { href: "/faculty", key: "todaySessions", icon: "home", mobile: true },
    { href: "/faculty/timetable", key: "timetable", icon: "calendar", mobile: true },
    { href: "/faculty/courses", key: "courses", icon: "book", mobile: true },
    { href: "/faculty/progress", key: "progress", icon: "chart", mobile: true },
  ],
  INSTITUTE_ADMIN: [
    { href: "/admin", key: "dashboard", icon: "chart", mobile: true },
    { href: "/admin/programmes", key: "programmes", icon: "layers", mobile: true },
    { href: "/admin/hostels", key: "hostels", icon: "bed", mobile: true },
    { href: "/faculty", key: "sessions", icon: "calendar" },
    { href: "/faculty/courses", key: "courses", icon: "book" },
    { href: "/admin/users", key: "users", icon: "users", mobile: true },
    { href: "/admin/devices", key: "devices", icon: "cpu" },
    { href: "/admin/reports", key: "reports", icon: "file" },
  ],
  SUPER_ADMIN: [
    { href: "/admin", key: "allIndia", icon: "chart", mobile: true },
    { href: "/admin/institutions", key: "institutions", icon: "building", mobile: true },
    { href: "/admin/programmes", key: "programmes", icon: "layers", mobile: true },
    { href: "/admin/employers", key: "employerQueue", icon: "badge" },
    { href: "/admin/certificates", key: "certificates", icon: "award" },
    { href: "/admin/jobs", key: "jobModeration", icon: "briefcase" },
    { href: "/admin/users", key: "users", icon: "users" },
    { href: "/admin/devices", key: "devices", icon: "cpu" },
    { href: "/admin/audit", key: "audit", icon: "shield", mobile: true },
    { href: "/admin/reports", key: "reports", icon: "file" },
  ],
  NOMINATOR: [
    { href: "/nominator", key: "myNominations", icon: "list", mobile: true },
    { href: "/nominator/nominate", key: "nominate", icon: "userPlus", mobile: true },
    { href: "/programmes", key: "catalogue", icon: "layers", mobile: true },
  ],
  EMPLOYER: [
    { href: "/employer", key: "pipeline", icon: "kanban", mobile: true },
    { href: "/employer/jobs", key: "myJobs", icon: "briefcase", mobile: true },
    { href: "/employer/jobs/new", key: "postJob", icon: "plus", mobile: true },
    { href: "/employer/profile", key: "company", icon: "building", mobile: true },
  ],
};
