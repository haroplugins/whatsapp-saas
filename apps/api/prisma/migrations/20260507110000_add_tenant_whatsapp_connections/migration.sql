-- CreateEnum
CREATE TYPE "public"."WhatsappConnectionProvider" AS ENUM (
    'WHATSAPP_CLOUD_API'
);

-- CreateEnum
CREATE TYPE "public"."WhatsappConnectionStatus" AS ENUM (
    'ACTIVE',
    'DISABLED'
);

-- CreateTable
CREATE TABLE "public"."TenantWhatsappConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "public"."WhatsappConnectionProvider" NOT NULL DEFAULT 'WHATSAPP_CLOUD_API',
    "phoneNumberId" TEXT NOT NULL,
    "displayPhoneNumber" TEXT,
    "businessAccountId" TEXT,
    "status" "public"."WhatsappConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantWhatsappConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantWhatsappConnection_provider_phoneNumberId_key" ON "public"."TenantWhatsappConnection"("provider", "phoneNumberId");

-- CreateIndex
CREATE INDEX "TenantWhatsappConnection_tenantId_idx" ON "public"."TenantWhatsappConnection"("tenantId");

-- CreateIndex
CREATE INDEX "TenantWhatsappConnection_tenantId_status_idx" ON "public"."TenantWhatsappConnection"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "public"."TenantWhatsappConnection" ADD CONSTRAINT "TenantWhatsappConnection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
