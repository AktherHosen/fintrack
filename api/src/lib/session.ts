import { nanoid } from "nanoid";
import { prisma } from "./prisma.js";

const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const token = nanoid(48);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  const session = await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  return session;
}

export async function getSessionByToken(token: string) {
  return prisma.session.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function deleteUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}
