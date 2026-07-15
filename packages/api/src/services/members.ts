import { MembershipType, Prisma, prisma, UserRole } from '@apex/database';
import type {
  GrantMembershipInput,
  MemberDetails,
  MemberListItem,
  MemberListQuery,
  MemberListResponse,
  MembershipDuration,
  MembershipStatus,
  SupportedLanguage,
  UpdateMemberInput,
  UpdateMembershipInput,
} from '@apex-card/shared';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const memberInclude = {
  memberships: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
  homeCountry: {
    select: { id: true, name: true },
  },
} satisfies Prisma.UserInclude;

type MemberRecord = Prisma.UserGetPayload<{ include: typeof memberInclude }>;
type MembershipRecord = MemberRecord['memberships'][number];

export type GrantMembershipResult = MemberDetails | 'NOT_FOUND';
export type RevokeMembershipResult = MemberDetails | 'NOT_FOUND' | 'NO_MEMBERSHIP';
export type ResetMembershipResult = MemberDetails | 'NOT_FOUND';
export type UpdateMembershipResult = MemberDetails | 'NOT_FOUND' | 'NO_MEMBERSHIP';

const toSupportedLanguage = (language: string): SupportedLanguage =>
  language === 'pt' ? 'pt' : 'en';

/**
 * Membership Status is never stored — it's derived from type/expiresAt/cancelledAt so it
 * can never drift out of sync with the data that actually determines it.
 */
const computeMembershipStatus = (membership?: MembershipRecord): MembershipStatus | null => {
  if (!membership || membership.type === MembershipType.FREE) {
    return null;
  }

  if (membership.cancelledAt) {
    return 'CANCELLED';
  }

  if (membership.expiresAt && membership.expiresAt.getTime() < Date.now()) {
    return 'EXPIRED';
  }

  return 'ACTIVE';
};

const toMemberListItem = (user: MemberRecord): MemberListItem => {
  const membership = user.memberships[0];

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    profilePhoto: user.profilePhoto,
    language: toSupportedLanguage(user.language),
    status: user.status,
    membershipType: membership?.type ?? MembershipType.FREE,
    membershipStatus: computeMembershipStatus(membership),
    membershipGrantedManually: membership?.isManuallyGranted ?? false,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
};

const toMemberDetails = (user: MemberRecord): MemberDetails => {
  const membership = user.memberships[0];

  return {
    ...toMemberListItem(user),
    phone: user.phone,
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
    homeCountryId: user.homeCountryId,
    homeCountryName: user.homeCountry?.name ?? null,
    membership: membership
      ? {
          id: membership.id,
          type: membership.type,
          status: computeMembershipStatus(membership),
          isManuallyGranted: membership.isManuallyGranted,
          currentPeriodStart: membership.currentPeriodStart?.toISOString() ?? null,
          currentPeriodEnd: membership.currentPeriodEnd?.toISOString() ?? null,
          cancelledAt: membership.cancelledAt?.toISOString() ?? null,
          expiresAt: membership.expiresAt?.toISOString() ?? null,
          createdAt: membership.createdAt.toISOString(),
          updatedAt: membership.updatedAt.toISOString(),
        }
      : null,
  };
};

const buildOrderBy = (
  sortBy: NonNullable<MemberListQuery['sortBy']>,
  sortOrder: NonNullable<MemberListQuery['sortOrder']>
): Prisma.UserOrderByWithRelationInput =>
  ({ [sortBy]: sortOrder }) as Prisma.UserOrderByWithRelationInput;

/** Expresses a computed Membership Status as a real Prisma predicate on the latest membership row. */
const membershipStatusWhere = (status: MembershipStatus): Prisma.MembershipWhereInput => {
  const now = new Date();

  switch (status) {
    case 'CANCELLED':
      return { cancelledAt: { not: null } };
    case 'EXPIRED':
      return { cancelledAt: null, expiresAt: { lt: now } };
    case 'ACTIVE':
      return {
        type: { not: MembershipType.FREE },
        cancelledAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      };
    default:
      return {};
  }
};

const durationToFields = (duration: MembershipDuration): { expiresAt: Date | null } => ({
  expiresAt: duration.kind === 'expiryDate' ? new Date(duration.expiresAt) : null,
});

export async function listMembers(query: MemberListQuery): Promise<MemberListResponse> {
  const page = query.page ?? DEFAULT_PAGE;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = query.sortOrder ?? 'desc';

  const where: Prisma.UserWhereInput = {
    role: UserRole.USER,
    ...(query.status ? { status: query.status } : {}),
    ...(query.language ? { language: query.language } : {}),
    ...(query.membershipStatus
      ? { memberships: { some: membershipStatusWhere(query.membershipStatus) } }
      : {}),
    ...(query.search
      ? {
          OR: [
            { fullName: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: memberInclude,
      orderBy: buildOrderBy(sortBy, sortOrder),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    members: users.map(toMemberListItem),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getMemberById(id: string): Promise<MemberDetails | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: memberInclude,
  });

  if (!user || user.role !== UserRole.USER) {
    return null;
  }

  return toMemberDetails(user);
}

export async function updateMemberProfile(
  id: string,
  input: UpdateMemberInput
): Promise<MemberDetails | null> {
  const existing = await prisma.user.findUnique({ where: { id }, select: { role: true } });

  if (!existing || existing.role !== UserRole.USER) {
    return null;
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.homeCountryId !== undefined ? { homeCountryId: input.homeCountryId } : {}),
    },
    include: memberInclude,
  });

  return toMemberDetails(user);
}

export async function updateMemberStatus(
  id: string,
  status: 'ACTIVE' | 'SUSPENDED'
): Promise<MemberDetails | null> {
  const existing = await prisma.user.findUnique({ where: { id }, select: { role: true } });

  if (!existing || existing.role !== UserRole.USER) {
    return null;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status },
    include: memberInclude,
  });

  return toMemberDetails(user);
}

async function findCurrentMembership(id: string) {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: {
      role: true,
      memberships: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, type: true },
      },
    },
  });

  if (!existing || existing.role !== UserRole.USER) {
    return 'NOT_FOUND' as const;
  }

  return existing.memberships[0] ?? null;
}

/**
 * Adjusts an existing paid plan's type and/or duration. Only meaningful when the member
 * already has a non-FREE type — Grant is the only way to leave FREE, and this never
 * touches `cancelledAt` (that's Revoke's/Reset's job), so editing a cancelled plan's type
 * doesn't silently reactivate it.
 */
export async function updateMembership(
  id: string,
  input: UpdateMembershipInput
): Promise<UpdateMembershipResult> {
  const current = await findCurrentMembership(id);

  if (current === 'NOT_FOUND') {
    return 'NOT_FOUND';
  }

  if (!current || current.type === MembershipType.FREE) {
    return 'NO_MEMBERSHIP';
  }

  await prisma.membership.update({
    where: { id: current.id },
    data: { type: input.membershipType, ...durationToFields(input.duration) },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id }, include: memberInclude });
  return toMemberDetails(user);
}

export async function grantMembership(
  id: string,
  input: GrantMembershipInput
): Promise<GrantMembershipResult> {
  const current = await findCurrentMembership(id);

  if (current === 'NOT_FOUND') {
    return 'NOT_FOUND';
  }

  const data = {
    type: input.membershipType,
    isManuallyGranted: true,
    cancelledAt: null,
    ...durationToFields(input.duration),
  };

  if (current) {
    await prisma.membership.update({ where: { id: current.id }, data });
  } else {
    await prisma.membership.create({ data: { userId: id, ...data } });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id }, include: memberInclude });
  return toMemberDetails(user);
}

export async function revokeMembership(id: string): Promise<RevokeMembershipResult> {
  const current = await findCurrentMembership(id);

  if (current === 'NOT_FOUND') {
    return 'NOT_FOUND';
  }

  if (!current || current.type === MembershipType.FREE) {
    return 'NO_MEMBERSHIP';
  }

  await prisma.membership.update({
    where: { id: current.id },
    data: { cancelledAt: new Date() },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id }, include: memberInclude });
  return toMemberDetails(user);
}

/** Returns a member to Free — the only way back to Free once a plan has been granted. */
export async function resetMembershipToFree(id: string): Promise<ResetMembershipResult> {
  const current = await findCurrentMembership(id);

  if (current === 'NOT_FOUND') {
    return 'NOT_FOUND';
  }

  if (current) {
    await prisma.membership.update({
      where: { id: current.id },
      data: {
        type: MembershipType.FREE,
        isManuallyGranted: false,
        expiresAt: null,
        cancelledAt: null,
      },
    });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id }, include: memberInclude });
  return toMemberDetails(user);
}
