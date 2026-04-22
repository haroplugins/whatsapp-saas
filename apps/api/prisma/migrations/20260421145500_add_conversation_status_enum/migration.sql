-- CreateEnum
CREATE TYPE "public"."ConversationStatus" AS ENUM (
    'NEW',
    'INTERESTED',
    'QUOTE_SENT',
    'PENDING',
    'CLOSED',
    'LOST'
);

-- AlterTable
ALTER TABLE "public"."Conversation"
ALTER COLUMN "status" TYPE "public"."ConversationStatus"
USING (
    CASE UPPER("status")
        WHEN 'NEW' THEN 'NEW'::"public"."ConversationStatus"
        WHEN 'INTERESTED' THEN 'INTERESTED'::"public"."ConversationStatus"
        WHEN 'QUOTE_SENT' THEN 'QUOTE_SENT'::"public"."ConversationStatus"
        WHEN 'PENDING' THEN 'PENDING'::"public"."ConversationStatus"
        WHEN 'CLOSED' THEN 'CLOSED'::"public"."ConversationStatus"
        WHEN 'LOST' THEN 'LOST'::"public"."ConversationStatus"
        ELSE 'NEW'::"public"."ConversationStatus"
    END
);
