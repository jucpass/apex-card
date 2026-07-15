-- AlterEnum: FREE must be added in its own transaction before it can be
-- referenced by data-migration statements in a later migration.
ALTER TYPE "MembershipType" ADD VALUE 'FREE';
