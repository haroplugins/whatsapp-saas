-- CreateEnum
CREATE TYPE "public"."MessageSender" AS ENUM (
    'USER',
    'CLIENT'
);

-- CreateEnum
CREATE TYPE "public"."TriggerType" AS ENUM (
    'KEYWORD',
    'STATUS_CHANGE',
    'TIME_DELAY'
);

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM (
    'SEND_MESSAGE',
    'TAG',
    'CHANGE_STATUS'
);

-- AlterTable
ALTER TABLE "public"."Message"
ALTER COLUMN "sender" TYPE "public"."MessageSender"
USING (
    CASE UPPER("sender")
        WHEN 'USER' THEN 'USER'::"public"."MessageSender"
        WHEN 'CLIENT' THEN 'CLIENT'::"public"."MessageSender"
        ELSE 'CLIENT'::"public"."MessageSender"
    END
);

-- AlterTable
ALTER TABLE "public"."Automation"
ALTER COLUMN "triggerType" TYPE "public"."TriggerType"
USING (
    CASE UPPER("triggerType")
        WHEN 'KEYWORD' THEN 'KEYWORD'::"public"."TriggerType"
        WHEN 'STATUS_CHANGE' THEN 'STATUS_CHANGE'::"public"."TriggerType"
        WHEN 'TIME_DELAY' THEN 'TIME_DELAY'::"public"."TriggerType"
        ELSE 'KEYWORD'::"public"."TriggerType"
    END
),
ALTER COLUMN "actionType" TYPE "public"."ActionType"
USING (
    CASE UPPER("actionType")
        WHEN 'SEND_MESSAGE' THEN 'SEND_MESSAGE'::"public"."ActionType"
        WHEN 'TAG' THEN 'TAG'::"public"."ActionType"
        WHEN 'CHANGE_STATUS' THEN 'CHANGE_STATUS'::"public"."ActionType"
        ELSE 'SEND_MESSAGE'::"public"."ActionType"
    END
);
