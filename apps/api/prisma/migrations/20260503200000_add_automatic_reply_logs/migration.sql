-- CreateEnum
CREATE TYPE "public"."AutomaticReplySource" AS ENUM (
    'BOOKING_ADVISOR',
    'CLASSIC_AUTOMATION',
    'OFF_HOURS'
);

-- CreateEnum
CREATE TYPE "public"."AutomaticReplyStatus" AS ENUM (
    'DRY_RUN',
    'SENT',
    'BLOCKED',
    'FAILED'
);

-- CreateTable
CREATE TABLE "public"."AutomaticReplyLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "triggeringMessageId" TEXT NOT NULL,
    "sentMessageId" TEXT,
    "source" "public"."AutomaticReplySource",
    "routerDecision" TEXT NOT NULL,
    "selectedSource" TEXT,
    "status" "public"."AutomaticReplyStatus" NOT NULL DEFAULT 'DRY_RUN',
    "reason" TEXT,
    "replyTextPreview" TEXT,
    "replyTextHash" TEXT,
    "resultJson" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomaticReplyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutomaticReplyLog_tenantId_createdAt_idx" ON "public"."AutomaticReplyLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AutomaticReplyLog_tenantId_status_idx" ON "public"."AutomaticReplyLog"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AutomaticReplyLog_tenantId_source_idx" ON "public"."AutomaticReplyLog"("tenantId", "source");

-- CreateIndex
CREATE INDEX "AutomaticReplyLog_conversationId_idx" ON "public"."AutomaticReplyLog"("conversationId");

-- CreateIndex
CREATE INDEX "AutomaticReplyLog_triggeringMessageId_idx" ON "public"."AutomaticReplyLog"("triggeringMessageId");

-- AddForeignKey
ALTER TABLE "public"."AutomaticReplyLog" ADD CONSTRAINT "AutomaticReplyLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutomaticReplyLog" ADD CONSTRAINT "AutomaticReplyLog_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutomaticReplyLog" ADD CONSTRAINT "AutomaticReplyLog_triggeringMessageId_fkey" FOREIGN KEY ("triggeringMessageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutomaticReplyLog" ADD CONSTRAINT "AutomaticReplyLog_sentMessageId_fkey" FOREIGN KEY ("sentMessageId") REFERENCES "public"."Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
