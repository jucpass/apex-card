-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('PREMIUM', 'STUDENT', 'WORKER');

-- AlterTable: add the new column with a temporary default so existing rows are valid immediately
ALTER TABLE "Membership" ADD COLUMN "type" "MembershipType" NOT NULL DEFAULT 'PREMIUM';

-- Backfill "type" from the previous boolean flags before dropping them, preserving existing data
UPDATE "Membership" SET "type" = 'WORKER' WHERE "isWorker" = true;
UPDATE "Membership" SET "type" = 'STUDENT' WHERE "isStudent" = true AND "isWorker" = false;

-- AlterTable: drop the boolean flags now superseded by the single "type" column
ALTER TABLE "Membership" DROP COLUMN "isStudent";
ALTER TABLE "Membership" DROP COLUMN "isWorker";

-- CreateIndex
CREATE INDEX "Membership_type_idx" ON "Membership"("type");
