-- CreateEnum
CREATE TYPE "public"."ConversationDraftSource" AS ENUM ('MANUAL', 'BOOKING_ADVISOR');

-- CreateEnum
CREATE TYPE "public"."ConversationDraftStatus" AS ENUM ('ACTIVE', 'APPLIED', 'DISCARDED');

-- CreateTable
CREATE TABLE "public"."ConversationDraft" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "source" "public"."ConversationDraftSource" NOT NULL DEFAULT 'MANUAL',
    "status" "public"."ConversationDraftStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationDraft_conversationId_key" ON "public"."ConversationDraft"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationDraft_tenantId_updatedAt_idx" ON "public"."ConversationDraft"("tenantId", "updatedAt");

-- CreateIndex
CREATE INDEX "ConversationDraft_tenantId_source_idx" ON "public"."ConversationDraft"("tenantId", "source");

-- CreateIndex
CREATE INDEX "ConversationDraft_tenantId_status_idx" ON "public"."ConversationDraft"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ConversationDraft_userId_idx" ON "public"."ConversationDraft"("userId");

-- AddForeignKey
ALTER TABLE "public"."ConversationDraft" ADD CONSTRAINT "ConversationDraft_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationDraft" ADD CONSTRAINT "ConversationDraft_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationDraft" ADD CONSTRAINT "ConversationDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
