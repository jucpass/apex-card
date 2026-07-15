import type { StatusTone } from '@/components/common/StatusBadge';

/**
 * Locally re-declared to match @apex-card/shared's `slugify` — importing the real
 * function fails in admin-web's production build (CJS/ESM barrel interop; see
 * categoryIconOptions in categoryIcons.tsx for the same limitation).
 */
export const slugifyCategoryName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const categoryActiveTone: Record<'active' | 'inactive', StatusTone> = {
  active: 'success',
  inactive: 'neutral',
};

export const categoryActiveLabelKey: Record<'active' | 'inactive', string> = {
  active: 'categories.status.active',
  inactive: 'categories.status.inactive',
};

export function formatCategoryDate(iso: string, uiLanguage: string): string {
  const locale = uiLanguage.startsWith('pt') ? 'pt-BR' : 'en-US';

  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}
