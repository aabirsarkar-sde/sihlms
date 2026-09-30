import { expect, type BrowserContext, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();

export async function loginAs(page: Page, phone: string) {
  await page.request.post("/api/v1/auth/otp/request", { data: { phone } });
  const r = await page.request.post("/api/v1/auth/otp/verify", { data: { phone, code: "123456" } });
  expect(r.ok()).toBeTruthy();
}

export async function newUser(ctx: BrowserContext, phone: string) {
  const page = await ctx.newPage();
  await loginAs(page, phone);
  return page;
}

export const PHONES = { SA: "9000000001", IA: "9000000002", FA: "9000000003", TR: "9000000004", NO: "9000000005", EM: "9000000006" };
