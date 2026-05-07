-- CreateEnum
CREATE TYPE "public"."MessageExternalProvider" AS ENUM (
    'WHATSAPP_CLOUD_API'
);

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN "externalProvider" "public"."MessageExternalProvider",
ADD COLUMN "externalMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Message_externalProvider_externalMessageId_key" ON "public"."Message"("externalProvider", "externalMessageId");

-- CreateIndex
CREATE INDEX "Message_externalProvider_externalMessageId_idx" ON "public"."Message"("externalProvider", "externalMessageId");
