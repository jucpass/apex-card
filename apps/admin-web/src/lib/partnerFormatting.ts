import type { PartnerStatus } from '@apex-card/shared';

import type { StatusTone } from '@/components/common/StatusBadge';

export const partnerStatusTone: Record<PartnerStatus, StatusTone> = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'danger',
};

export const partnerStatusLabelKey: Record<PartnerStatus, string> = {
  DRAFT: 'partners.status.draft',
  ACTIVE: 'partners.status.active',
  INACTIVE: 'partners.status.inactive',
  SUSPENDED: 'partners.status.suspended',
};

/**
 * Locally re-declared to match @apex-card/shared's runtime arrays — importing real
 * (non-type) values fails in admin-web's production build (CJS/ESM barrel interop; see
 * categoryIcons.tsx for the same limitation). Only the three admin-facing statuses are
 * offered; SUSPENDED exists in the schema for a future moderation flow.
 */
export const partnerStatusFilterOptions: PartnerStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE'];

export function formatPartnerDate(iso: string, uiLanguage: string): string {
  const locale = uiLanguage.startsWith('pt') ? 'pt-BR' : 'en-US';

  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Locally re-declared to match @apex-card/shared's `PARTNER_MEDIA_MAX_IMAGES` and the
 * server's accepted types/size — CJS/ESM barrel interop prevents importing runtime values
 * from the shared package (see categoryIcons.tsx). Keep in sync with
 * packages/shared/src/contracts/partners.ts and packages/api/src/lib/supabaseAdmin.ts.
 */
export const PARTNER_MEDIA_MAX = 3;
export const ACCEPTED_PARTNER_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PARTNER_IMAGE_BYTES = 5 * 1024 * 1024;

export const slugifyPartnerName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
