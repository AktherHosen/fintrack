import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import type { Response } from "express";
import type { RegisterInput, LoginInput } from "@fintrack/shared";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../lib/env.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../../lib/email.js";
import { conflict, unauthorized, badRequest } from "../../lib/errors.js";
import { createSession, deleteSession } from "../../lib/session.js";
import { seedUserDefaults } from "../../lib/seed-user.js";
import { COOKIE_NAME } from "../../middleware/auth.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const RESET_TOKEN_HOURS = 1;
const VERIFICATION_TOKEN_HOURS = 24;

function mapUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  currency: string;
  timezone: string;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  locale: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    currency: user.currency,
    timezone: user.timezone,
    locale: user.locale,
    avatarUrl: user.avatarUrl,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
  };
}

async function createVerificationToken(userId: string) {
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  const token = nanoid(48);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TOKEN_HOURS);
  await prisma.emailVerificationToken.create({ data: { userId, token, expiresAt } });
  return token;
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict("Email already registered");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: UserRole.USER,
    },
  });

  await seedUserDefaults(user.id);

  const token = await createVerificationToken(user.id);
  const verifyUrl = `${env.APP_URL}/verify-email?token=${token}`;
  await sendVerificationEmail(user.email, verifyUrl);

  return user;
}

export async function login(input: LoginInput, res: Response) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw unauthorized("Invalid email or password");

  const session = await createSession(user.id);
  res.cookie(COOKIE_NAME, session.token, COOKIE_OPTIONS);
  return mapUser(user);
}

export async function logout(token: string | undefined, res: Response) {
  if (token) await deleteSession(token);
  res.clearCookie(COOKIE_NAME);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized();
  return mapUser(user);
}

export async function setSession(userId: string, res: Response) {
  const session = await createSession(userId);
  res.cookie(COOKIE_NAME, session.token, COOKIE_OPTIONS);
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true };

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = nanoid(48);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_HOURS);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(user.email, resetUrl);

  return { ok: true, ...(env.NODE_ENV === "development" ? { devResetUrl: resetUrl } : {}) };
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordResetToken.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
  });
  if (!record) throw badRequest("Invalid or expired reset token");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { ok: true };
}

export async function verifyEmail(token: string) {
  const record = await prisma.emailVerificationToken.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
  });
  if (!record) throw badRequest("Invalid or expired verification token");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { ok: true };
}

export async function resendVerificationEmail(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized();
  if (user.emailVerifiedAt) throw badRequest("Email already verified");

  const token = await createVerificationToken(userId);
  const verifyUrl = `${env.APP_URL}/verify-email?token=${token}`;
  await sendVerificationEmail(user.email, verifyUrl);

  return {
    ok: true,
    ...(env.NODE_ENV === "development" ? { devVerifyUrl: verifyUrl } : {}),
  };
}
