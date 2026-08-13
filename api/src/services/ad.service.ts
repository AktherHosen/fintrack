import { AdCampaignStatus } from "@prisma/client";
import type { CreateAdCampaignInput } from "@fintrack/shared";
import { prisma } from "../lib/prisma.js";
import { notFound, badRequest } from "../lib/errors.js";
import { isAllowedAssetPath } from "../lib/assets.js";

function mapActiveAd(campaign: {
  id: string;
  title: string;
  subtitle: string | null;
  targetUrl: string;
  imageUrl: string | null;
  accentColor: string | null;
}) {
  return {
    id: campaign.id,
    title: campaign.title,
    subtitle: campaign.subtitle,
    targetUrl: campaign.targetUrl,
    imageUrl: campaign.imageUrl,
    accentColor: campaign.accentColor,
  };
}

function mapAdCampaign(campaign: {
  id: string;
  title: string;
  subtitle: string | null;
  targetUrl: string;
  imageUrl: string | null;
  accentColor: string | null;
  status: AdCampaignStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  adminNote: string | null;
  createdAt: Date;
  adPlan: { name: string; slug: string; durationDays: number };
  payment: { id: string; status: string; amount: { toString(): string } } | null;
}) {
  return {
    id: campaign.id,
    title: campaign.title,
    subtitle: campaign.subtitle,
    targetUrl: campaign.targetUrl,
    imageUrl: campaign.imageUrl,
    accentColor: campaign.accentColor,
    status: campaign.status,
    startsAt: campaign.startsAt?.toISOString() ?? null,
    endsAt: campaign.endsAt?.toISOString() ?? null,
    adminNote: campaign.adminNote,
    createdAt: campaign.createdAt.toISOString(),
    adPlan: campaign.adPlan,
    payment: campaign.payment
      ? {
          id: campaign.payment.id,
          status: campaign.payment.status,
          amount: campaign.payment.amount.toString(),
        }
      : undefined,
  };
}

export async function expireAdCampaigns(now = new Date()): Promise<void> {
  await prisma.adCampaign.updateMany({
    where: { status: AdCampaignStatus.ACTIVE, endsAt: { lt: now } },
    data: { status: AdCampaignStatus.EXPIRED },
  });
}

export async function listActiveAds(): Promise<ReturnType<typeof mapActiveAd>[]> {
  const now = new Date();
  await expireAdCampaigns(now);

  const campaigns = await prisma.adCampaign.findMany({
    where: {
      status: AdCampaignStatus.ACTIVE,
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
      targetUrl: true,
      imageUrl: true,
      accentColor: true,
    },
  });

  return campaigns.map(mapActiveAd);
}

export async function listAdPlans() {
  await ensureDefaultAdPlans();

  const plans = await prisma.adPlan.findMany({
    where: { isActive: true },
    orderBy: { durationDays: "asc" },
  });

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    price: plan.price.toString(),
    currency: plan.currency,
    durationDays: plan.durationDays,
  }));
}

async function ensureDefaultAdPlans(): Promise<void> {
  const count = await prisma.adPlan.count();
  if (count > 0) return;

  await prisma.adPlan.createMany({
    data: [
      {
        name: "Banner · 7 days",
        slug: "ad-7d",
        price: 299,
        currency: "BDT",
        durationDays: 7,
      },
      {
        name: "Banner · 30 days",
        slug: "ad-30d",
        price: 999,
        currency: "BDT",
        durationDays: 30,
      },
    ],
    skipDuplicates: true,
  });
}

export async function listUserAdCampaigns(userId: string) {
  await expireAdCampaigns();

  const campaigns = await prisma.adCampaign.findMany({
    where: { userId },
    include: {
      adPlan: { select: { name: true, slug: true, durationDays: true } },
      payment: { select: { id: true, status: true, amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return campaigns.map(mapAdCampaign);
}

export async function createAdCampaign(userId: string, input: CreateAdCampaignInput) {
  const plan = await prisma.adPlan.findFirst({
    where: { slug: input.adPlanSlug, isActive: true },
  });
  if (!plan) throw notFound("Ad plan not found");

  if (input.imageUrl && !isAllowedAssetPath(input.imageUrl, userId)) {
    throw badRequest("Banner image must be uploaded from your account");
  }

  const campaign = await prisma.adCampaign.create({
    data: {
      userId,
      adPlanId: plan.id,
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      targetUrl: input.targetUrl.trim(),
      imageUrl: input.imageUrl?.trim() || null,
      accentColor: input.accentColor ?? null,
      status: AdCampaignStatus.PENDING,
      payment: {
        create: {
          userId,
          provider: "BKASH",
          method: "MANUAL_SEND_MONEY",
          amount: plan.price,
          currency: plan.currency,
          transactionId: input.transactionId,
          senderNumber: input.senderNumber,
          status: "PENDING",
        },
      },
    },
    include: {
      adPlan: { select: { name: true, slug: true, durationDays: true } },
      payment: { select: { id: true, status: true, amount: true } },
    },
  });

  return mapAdCampaign(campaign);
}

export async function activateAdCampaign(adCampaignId: string, verifiedAt: Date): Promise<void> {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: adCampaignId },
    include: { adPlan: true },
  });
  if (!campaign) throw notFound("Ad campaign not found");

  const endsAt = new Date(verifiedAt);
  endsAt.setDate(endsAt.getDate() + campaign.adPlan.durationDays);

  await prisma.adCampaign.update({
    where: { id: adCampaignId },
    data: {
      status: AdCampaignStatus.ACTIVE,
      startsAt: verifiedAt,
      endsAt,
      adminNote: null,
    },
  });
}

export async function rejectAdCampaign(adCampaignId: string, adminNote: string): Promise<void> {
  await prisma.adCampaign.update({
    where: { id: adCampaignId },
    data: {
      status: AdCampaignStatus.REJECTED,
      adminNote,
    },
  });
}
