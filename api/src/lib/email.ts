import nodemailer from "nodemailer";
import { env } from "./env.js";

function getTransporter() {
  if (!env.EMAIL_HOST) return null;
  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT ?? 587,
    secure: (env.EMAIL_PORT ?? 587) === 465,
    auth:
      env.EMAIL_USER && env.EMAIL_PASSWORD
        ? { user: env.EMAIL_USER, pass: env.EMAIL_PASSWORD }
        : undefined,
  });
}

async function sendMail(to: string, subject: string, html: string, devFallback: string): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[dev] ${devFallback}`);
    return;
  }
  await transport.sendMail({
    from: env.EMAIL_FROM ?? env.EMAIL_USER ?? "noreply@fintrack.local",
    to,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  await sendMail(
    email,
    "Reset your FinTrack password",
    `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    `Password reset link for ${email}: ${resetUrl}`,
  );
}

export async function sendVerificationEmail(email: string, verifyUrl: string): Promise<void> {
  await sendMail(
    email,
    "Verify your FinTrack email",
    `<p>Welcome to FinTrack! Click the link below to verify your email address.</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    `Email verification link for ${email}: ${verifyUrl}`,
  );
}
