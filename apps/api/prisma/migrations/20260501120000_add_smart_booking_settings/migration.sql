-- CreateEnum
CREATE TYPE "public"."SmartBookingMode" AS ENUM ('SUGGEST_SLOTS', 'REQUEST_CONFIRMATION', 'AUTO_CONFIRM');

-- CreateEnum
CREATE TYPE "public"."SmartBookingMissingInfoBehavior" AS ENUM ('ASK_CLIENT', 'HANDOFF_TO_HUMAN');

-- CreateTable
CREATE TABLE "public"."SmartBookingSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "mode" "public"."SmartBookingMode" NOT NULL DEFAULT 'SUGGEST_SLOTS',
    "maxSuggestions" INTEGER NOT NULL DEFAULT 3,
    "missingInfoBehavior" "public"."SmartBookingMissingInfoBehavior" NOT NULL DEFAULT 'ASK_CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartBookingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmartBookingSettings_tenantId_key" ON "public"."SmartBookingSettings"("tenantId");

-- AddForeignKey
ALTER TABLE "public"."SmartBookingSettings" ADD CONSTRAINT "SmartBookingSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
