import { nanoid } from "nanoid";
import request, { type Agent, type Response } from "supertest";
import type { Express } from "express";
import { createApp } from "../app.js";
import { COOKIE_NAME } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

let app: Express | undefined;

export function getTestApp(): Express {
  app ??= createApp();
  return app;
}

export function createAgent(): Agent {
  return request.agent(getTestApp());
}

export function uniqueEmail(prefix = "user"): string {
  return `${prefix}-${nanoid(8)}@test.local`;
}

export async function registerUser(
  agent: Agent,
  overrides: { name?: string; email?: string; password?: string } = {},
): Promise<{ res: Response; email: string; password: string }> {
  const email = overrides.email ?? uniqueEmail();
  const password = overrides.password ?? "TestPass123!";
  const res = await agent.post("/api/v1/auth/register").send({
    name: overrides.name ?? "Test User",
    email,
    password,
  });
  return { res, email, password };
}

export async function loginUser(agent: Agent, email: string, password: string): Promise<Response> {
  return agent.post("/api/v1/auth/login").send({ email, password });
}

export async function loginAdmin(agent: Agent): Promise<Response> {
  const email = process.env.ADMIN_EMAIL ?? "admin@fintrack.local";
  const password = process.env.ADMIN_PASSWORD ?? "Admin123!";
  return loginUser(agent, email, password);
}

export function sessionCookie(res: request.Response): string | undefined {
  const cookies = res.headers["set-cookie"];
  if (!cookies) return undefined;
  const list = Array.isArray(cookies) ? cookies : [cookies];
  const match = list.find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return match?.split(";")[0];
}

export async function createAccount(
  agent: Agent,
  data: { name: string; type?: string; openingBalance?: string } = { name: "Cash" },
): Promise<Response> {
  return agent.post("/api/v1/accounts").send({
    name: data.name,
    type: data.type ?? "CASH",
    currency: "BDT",
    openingBalance: data.openingBalance ?? "1000",
  });
}

export async function deleteUserByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  await prisma.user.delete({ where: { id: user.id } });
}

export async function disconnectTestDb() {
  await prisma.$disconnect();
}
