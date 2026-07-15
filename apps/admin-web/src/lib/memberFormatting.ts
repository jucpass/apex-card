import type {
  MembershipStatus,
  MembershipType,
  SupportedLanguage,
  UserStatus,
} from '@apex-card/shared';

import type { StatusTone } from '@/components/common/StatusBadge';

export const memberStatusTone: Record<UserStatus, StatusTone> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  DELETED: 'danger',
};

export const memberStatusLabelKey: Record<UserStatus, string> = {
  ACTIVE: 'members.status.active',
  SUSPENDED: 'members.status.suspended',
  DELETED: 'members.status.deleted',
};

/**
 * Membership Type answers "which plan does this member have?" — the only stored
 * membership concept. Colours: Free = neutral, Premium = blue, Student = green,
 * Worker = purple.
 */
export const membershipTypeTone: Record<MembershipType, StatusTone> = {
  FREE: 'neutral',
  PREMIUM: 'info',
  STUDENT: 'success',
  WORKER: 'purple',
};

export const membershipTypeLabelKey: Record<MembershipType, string> = {
  FREE: 'members.membershipType.free',
  PREMIUM: 'members.membershipType.premium',
  STUDENT: 'members.membershipType.student',
  WORKER: 'members.membershipType.worker',
};

/**
 * Membership Status answers "is the current plan currently active?" It's computed
 * server-side (never stored) and only meaningful when the type isn't Free. Rendered as
 * small, unobtrusive coloured text next to the Type badge — never a second full badge —
 * to keep the table clean. Colours: Active = green, Expired = red, Cancelled = grey.
 */
export const membershipStatusTextClass: Record<MembershipStatus, string> = {
  ACTIVE: 'text-emerald-600 dark:text-emerald-400',
  EXPIRED: 'text-destructive',
  CANCELLED: 'text-muted-foreground',
};

export const membershipStatusLabelKey: Record<MembershipStatus, string> = {
  ACTIVE: 'members.membershipStatus.active',
  EXPIRED: 'members.membershipStatus.expired',
  CANCELLED: 'members.membershipStatus.cancelled',
};

export const memberLanguageLabelKey: Record<SupportedLanguage, string> = {
  en: 'settings.languageEnglish',
  pt: 'settings.languagePortuguese',
};

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  const first = parts[0] ?? '';

  if (parts.length === 1) {
    return first.slice(0, 2).toUpperCase();
  }

  const last = parts[parts.length - 1] ?? '';

  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

export function formatMemberDate(iso: string, uiLanguage: string): string {
  const locale = uiLanguage.startsWith('pt') ? 'pt-BR' : 'en-US';

  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Grant is available whenever there's no currently-active paid plan to interrupt. */
export function canGrantMembership(type: MembershipType, status: MembershipStatus | null): boolean {
  return type === 'FREE' || status === 'EXPIRED' || status === 'CANCELLED';
}

/** Revoke only makes sense while a plan is actually active. */
export function canRevokeMembership(
  type: MembershipType,
  status: MembershipStatus | null
): boolean {
  return type !== 'FREE' && status === 'ACTIVE';
}

/** Resetting to Free only makes sense once a plan has been granted. */
export function canResetMembership(type: MembershipType): boolean {
  return type !== 'FREE';
}
