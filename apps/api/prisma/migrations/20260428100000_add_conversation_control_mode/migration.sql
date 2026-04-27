-- CreateEnum
CREATE TYPE "public"."ConversationControlMode" AS ENUM (
    'NONE',
    'AI',
    'HUMAN'
);

-- AlterTable
ALTER TABLE "public"."Conversation"
ADD COLUMN "controlMode" "public"."ConversationControlMode" NOT NULL DEFAULT 'NONE';
