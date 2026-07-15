-- AlterTable: add the manually-granted flag
ALTER TABLE "Membership" ADD COLUMN "isManuallyGranted" BOOLEAN NOT NULL DEFAULT false;

-- Backfill from the previous "status" column before dropping it.
-- FREE meant "no plan" — discard whatever type was previously recorded alongside it,
-- since Membership Type now includes FREE as its own value.
UPDATE "Membership"
SET "type" = 'FREE', "isManuallyGranted" = false, "expiresAt" = NULL, "cancelledAt" = NULL
WHERE "status" = 'FREE';

-- GRANTED rows were always admin-granted; keep the existing type.
UPDATE "Membership"
SET "isManuallyGranted" = true
WHERE "status" = 'GRANTED';

-- EXPIRED rows must have a past expiresAt so the new computed status still reads EXPIRED.
UPDATE "Membership"
SET "isManuallyGranted" = true, "expiresAt" = COALESCE("expiresAt", NOW() - INTERVAL '1 day')
WHERE "status" = 'EXPIRED';

-- CANCELLED rows must have a cancelledAt so the new computed status still reads CANCELLED.
UPDATE "Membership"
SET "isManuallyGranted" = true, "cancelledAt" = COALESCE("cancelledAt", NOW())
WHERE "status" = 'CANCELLED';

-- ACTIVE/LIFETIME are reserved for future RevenueCat-driven rows (none exist yet in this
-- admin-only MVP); they were never admin-granted.
UPDATE "Membership"
SET "isManuallyGranted" = false
WHERE "status" IN ('ACTIVE', 'LIFETIME');

-- DropIndex
DROP INDEX IF EXISTS "Membership_status_idx";

-- AlterTable: drop the now-redundant status column — Membership Status is computed at
-- read time from type/expiresAt/cancelledAt (see docs/database-schema.md).
ALTER TABLE "Membership" DROP COLUMN "status";

-- DropEnum
DROP TYPE "MembershipStatus";
