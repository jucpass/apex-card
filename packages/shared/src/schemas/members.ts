import { z } from 'zod';

import { userStatuses } from '../auth/types';
import { supportedLanguages } from '../constants/languages';
import { grantableMembershipTypes, membershipStatuses } from '../constants/membership';
import type {
  GrantMembershipInput,
  MemberListQuery,
  UpdateMemberInput,
  UpdateMembershipInput,
  UpdateMemberStatusInput,
} from '../contracts/members';

type ValidationResult<T> = { success: true; data: T } | { success: false; message: string };

const editableMemberStatuses = ['ACTIVE', 'SUSPENDED'] as const;
const memberSortFields = ['fullName', 'email', 'createdAt', 'status'] as const;

const memberListQuerySchema = z.object({
  search: z.string().trim().min(1).max(150).optional(),
  status: z.enum(userStatuses).optional(),
  membershipStatus: z.enum(membershipStatuses).optional(),
  language: z.enum(supportedLanguages).optional(),
  sortBy: z.enum(memberSortFields).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const parseMemberListQuery = (query: unknown): ValidationResult<MemberListQuery> => {
  const result = memberListQuerySchema.safeParse(query);

  if (!result.success) {
    return { success: false, message: 'Invalid search or filter parameters.' };
  }

  return { success: true, data: result.data };
};

const updateMemberSchema = z
  .object({
    fullName: z.string().trim().min(2).max(150).optional(),
    phone: z.string().trim().min(3).max(30).nullable().optional(),
    language: z.enum(supportedLanguages).optional(),
    homeCountryId: z.string().trim().min(1).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export const parseUpdateMemberInput = (body: unknown): ValidationResult<UpdateMemberInput> => {
  const result = updateMemberSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? 'Invalid member details.',
    };
  }

  return { success: true, data: result.data };
};

const updateMemberStatusSchema = z.object({
  status: z.enum(editableMemberStatuses),
});

export const parseUpdateMemberStatusInput = (
  body: unknown
): ValidationResult<UpdateMemberStatusInput> => {
  const result = updateMemberStatusSchema.safeParse(body);

  if (!result.success) {
    return { success: false, message: 'A valid member status is required.' };
  }

  return { success: true, data: result.data };
};

const membershipDurationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('unlimited') }),
  z.object({
    kind: z.literal('expiryDate'),
    expiresAt: z
      .string()
      .min(1)
      .refine((value) => !Number.isNaN(new Date(value).getTime()), {
        message: 'A valid expiry date is required.',
      }),
  }),
]);

const membershipPlanSchema = z.object({
  membershipType: z.enum(grantableMembershipTypes),
  duration: membershipDurationSchema,
});

export const parseGrantMembershipInput = (
  body: unknown
): ValidationResult<GrantMembershipInput> => {
  const result = membershipPlanSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? 'A valid membership plan is required.',
    };
  }

  return { success: true, data: result.data };
};

export const parseUpdateMembershipInput = (
  body: unknown
): ValidationResult<UpdateMembershipInput> => {
  const result = membershipPlanSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? 'A valid membership plan is required.',
    };
  }

  return { success: true, data: result.data };
};
