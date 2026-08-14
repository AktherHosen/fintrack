import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";

export const PLATFORM_SETTING_KEYS = {
  BKASH_PAYMENT_NUMBER: "bkash_payment_number",
} as const;

export async function getBkashPaymentNumber(): Promise<string | null> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: PLATFORM_SETTING_KEYS.BKASH_PAYMENT_NUMBER },
  });
  const fromDb = row?.value?.trim();
  if (fromDb) return fromDb;

  const fromEnv = env.BKASH_PAYMENT_NUMBER?.trim();
  return fromEnv || null;
}

export async function getPaymentConfig() {
  return { bkashNumber: await getBkashPaymentNumber() };
}

export async function updatePaymentSettings(input: { bkashNumber: string }) {
  const bkashNumber = input.bkashNumber.trim();
  await prisma.platformSetting.upsert({
    where: { key: PLATFORM_SETTING_KEYS.BKASH_PAYMENT_NUMBER },
    create: { key: PLATFORM_SETTING_KEYS.BKASH_PAYMENT_NUMBER, value: bkashNumber },
    update: { value: bkashNumber },
  });
  return getPaymentConfig();
}
