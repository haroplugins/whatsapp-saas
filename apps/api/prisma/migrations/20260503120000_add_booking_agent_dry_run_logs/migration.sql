-- CreateTable
CREATE TABLE "public"."BookingAgentDryRunLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "inputText" TEXT NOT NULL,
    "intent" TEXT,
    "decision" TEXT,
    "nextAction" TEXT,
    "suggestedReplyPrepared" BOOLEAN NOT NULL,
    "suggestedReplyReason" TEXT,
    "suggestedReplyText" TEXT,
    "hasAvailability" BOOLEAN,
    "availabilityChecked" BOOLEAN NOT NULL,
    "serviceName" TEXT,
    "serviceId" TEXT,
    "date" TEXT,
    "timePreference" TEXT,
    "resultJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAgentDryRunLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingAgentDryRunLog_tenantId_createdAt_idx" ON "public"."BookingAgentDryRunLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingAgentDryRunLog_tenantId_decision_idx" ON "public"."BookingAgentDryRunLog"("tenantId", "decision");

-- CreateIndex
CREATE INDEX "BookingAgentDryRunLog_tenantId_intent_idx" ON "public"."BookingAgentDryRunLog"("tenantId", "intent");

-- CreateIndex
CREATE INDEX "BookingAgentDryRunLog_userId_idx" ON "public"."BookingAgentDryRunLog"("userId");

-- AddForeignKey
ALTER TABLE "public"."BookingAgentDryRunLog" ADD CONSTRAINT "BookingAgentDryRunLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingAgentDryRunLog" ADD CONSTRAINT "BookingAgentDryRunLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
