-- CreateEnum
CREATE TYPE "public"."TenantPlan" AS ENUM (
    'BASIC',
    'PRO',
    'PREMIUM'
);

-- AlterTable
ALTER TABLE "public"."Tenant"
ADD COLUMN "plan" "public"."TenantPlan" NOT NULL DEFAULT 'BASIC';
