-- AlterTable
ALTER TABLE "Job" ADD COLUMN "publicStatusToken" TEXT;
ALTER TABLE "Job" ADD COLUMN "smsConsentAt" TIMESTAMP(3);

UPDATE "Job"
SET "publicStatusToken" = md5(random()::text || id) || substr(md5(clock_timestamp()::text || random()::text), 1, 12)
WHERE "publicStatusToken" IS NULL;

ALTER TABLE "Job" ALTER COLUMN "publicStatusToken" SET NOT NULL;

CREATE UNIQUE INDEX "Job_publicStatusToken_key" ON "Job"("publicStatusToken");

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "SmsMessage" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'intake_confirm',
    "status" "SmsStatus" NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "SmsMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SmsMessage_jobId_idx" ON "SmsMessage"("jobId");
CREATE INDEX "SmsMessage_createdAt_idx" ON "SmsMessage"("createdAt");

ALTER TABLE "SmsMessage" ADD CONSTRAINT "SmsMessage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
