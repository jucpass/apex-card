import type { UserStatus } from '../auth/types';
import type { SupportedLanguage } from '../constants/languages';
import type {
  GrantableMembershipType,
  MembershipStatus,
  MembershipType,
} from '../constants/membership';

import type { PaginationMeta, SortOrder } from './common';

export type MemberMembershipSummary = {
  id: string;
  type: MembershipType;
  /** Computed — null when `type` is `FREE` (a Free member has no status). */
  status: MembershipStatus | null;
  isManuallyGranted: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  /** Plan expiry. `null` means unlimited (only meaningful when `type` isn't `FREE`). */
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MemberListItem = {
  id: string;
  fullName: string;
  email: string;
  profilePhoto: string | null;
  language: SupportedLanguage;
  status: UserStatus;
  membershipType: MembershipType;
  /** Computed — null when `membershipType` is `FREE`. */
  membershipStatus: MembershipStatus | null;
  membershipGrantedManually: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MemberDetails = MemberListItem & {
  phone: string | null;
  dateOfBirth: string | null;
  homeCountryId: string | null;
  homeCountryName: string | null;
  membership: MemberMembershipSummary | null;
};

export type MemberSortField = 'fullName' | 'email' | 'createdAt' | 'status';

export type MemberListQuery = {
  search?: string;
  status?: UserStatus;
  /** Filters on the computed status; members whose plan is Free never match. */
  membershipStatus?: MembershipStatus;
  language?: SupportedLanguage;
  sortBy?: MemberSortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
};

export type MemberListResponse = {
  members: MemberListItem[];
  pagination: PaginationMeta;
};

export type MemberDetailsResponse = {
  member: MemberDetails;
};

export type UpdateMemberInput = {
  fullName?: string;
  phone?: string | null;
  language?: SupportedLanguage;
  homeCountryId?: string | null;
};

export type EditableMemberStatus = Extract<UserStatus, 'ACTIVE' | 'SUSPENDED'>;

export type UpdateMemberStatusInput = {
  status: EditableMemberStatus;
};

/** Unlimited access, or access until a specific date — stored as `Membership.expiresAt`. */
export type MembershipDuration = { kind: 'unlimited' } | { kind: 'expiryDate'; expiresAt: string };

/**
 * Shared shape for the two actions that set a paid plan + duration together. `FREE` is
 * excluded — Grant is the only way to leave Free, and Edit only ever adjusts an existing
 * paid plan's type/duration, never introduces one.
 */
export type MembershipPlanInput = {
  membershipType: GrantableMembershipType;
  duration: MembershipDuration;
};

export type GrantMembershipInput = MembershipPlanInput;

export type UpdateMembershipInput = MembershipPlanInput;
