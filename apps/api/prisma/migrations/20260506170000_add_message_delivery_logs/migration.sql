-- CreateEnum
CREATE TYPE "public"."MessageDeliveryProvider" AS ENUM (
    'WHATSAPP_CLOUD_API'
);

-- CreateEnum
CREATE TYPE "public"."MessageDeliveryDirection" AS ENUM (
    'OUTBOUND',
    'INBOUND'
);

-- CreateEnum
CREATE TYPE "public"."MessageDeliveryStatus" AS ENUM (
    'DRY_RUN',
    'BLOCKED',
    'SENT',
    'FAILED'
);

-- CreateTable
CREATE TABLE "public"."MessageDeliveryLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "provider" "public"."MessageDeliveryProvider" NOT NULL,
    "direction" "public"."MessageDeliveryDirection" NOT NULL DEFAULT 'OUTBOUND',
    "status" "public"."MessageDeliveryStatus" NOT NULL,
    "externalMessageId" TEXT,
    "phoneNumberId" TEXT,
    "recipientHash" TEXT,
    "httpStatus" INTEGER,
    "errorCode" TEXT,
    "errorType" TEXT,
    "errorMessage" TEXT,
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "MessageDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageDeliveryLog_tenantId_createdAt_idx" ON "public"."MessageDeliveryLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageDeliveryLog_tenantId_status_idx" ON "public"."MessageDeliveryLog"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MessageDeliveryLog_tenantId_provider_idx" ON "public"."MessageDeliveryLog"("tenantId", "provider");

-- CreateIndex
CREATE INDEX "MessageDeliveryLog_tenantId_messageId_status_idx" ON "public"."MessageDeliveryLog"("tenantId", "messageId", "status");

-- CreateIndex
CREATE INDEX "MessageDeliveryLog_conversationId_idx" ON "public"."MessageDeliveryLog"("conversationId");

-- CreateIndex
CREATE INDEX "MessageDeliveryLog_messageId_idx" ON "public"."MessageDeliveryLog"("messageId");

-- CreateIndex
CREATE INDEX "MessageDeliveryLog_externalMessageId_idx" ON "public"."MessageDeliveryLog"("externalMessageId");

-- CreateIndex
CREATE INDEX "MessageDeliveryLog_expiresAt_idx" ON "public"."MessageDeliveryLog"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."MessageDeliveryLog" ADD CONSTRAINT "MessageDeliveryLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageDeliveryLog" ADD CONSTRAINT "MessageDeliveryLog_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageDeliveryLog" ADD CONSTRAINT "MessageDeliveryLog_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
