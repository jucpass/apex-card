/**
 * MVP membership plans. `FREE` means the member is not subscribed and has not been
 * granted access. Add a new paid plan (e.g. Family, Business, VIP) by extending this
 * single list and the matching Prisma `MembershipType` enum — nothing else should need
 * to hardcode plan names.
 */
export const membershipTypes = ['FREE', 'PREMIUM', 'STUDENT', 'WORKER'] as const;

export type MembershipType = (typeof membershipTypes)[number];

/** Membership types that can actually be granted — `FREE` is a member's default state, never something granted. */
export const grantableMembershipTypes = ['PREMIUM', 'STUDENT', 'WORKER'] as const;

export type GrantableMembershipType = (typeof grantableMembershipTypes)[number];

/**
 * Membership Status is never stored — it's computed from a membership's type, expiry,
 * and cancellation date (see docs/database-schema.md). This list exists only to describe
 * the possible computed values and to validate the `membershipStatus` list filter.
 */
export const membershipStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED'] as const;

export type MembershipStatus = (typeof membershipStatuses)[number];
