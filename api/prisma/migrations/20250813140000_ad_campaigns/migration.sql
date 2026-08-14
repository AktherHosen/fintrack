-- CreateEnum
CREATE TYPE "AdCampaignStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ad_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "duration_days" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_campaigns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ad_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "target_url" TEXT NOT NULL,
    "image_url" TEXT,
    "accent_color" TEXT,
    "status" "AdCampaignStatus" NOT NULL DEFAULT 'PENDING',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "ad_campaign_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ad_plans_slug_key" ON "ad_plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "payments_ad_campaign_id_key" ON "payments"("ad_campaign_id");

-- CreateIndex
CREATE INDEX "ad_campaigns_user_id_status_idx" ON "ad_campaigns"("user_id", "status");

-- CreateIndex
CREATE INDEX "ad_campaigns_status_starts_at_ends_at_idx" ON "ad_campaigns"("status", "starts_at", "ends_at");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_ad_campaign_id_fkey" FOREIGN KEY ("ad_campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_ad_plan_id_fkey" FOREIGN KEY ("ad_plan_id") REFERENCES "ad_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
