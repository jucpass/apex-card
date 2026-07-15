import type { StatusTone } from '@/components/common/StatusBadge';

export const countryActiveTone: Record<'active' | 'inactive', StatusTone> = {
  active: 'success',
  inactive: 'neutral',
};

export const countryActiveLabelKey: Record<'active' | 'inactive', string> = {
  active: 'countries.status.active',
  inactive: 'countries.status.inactive',
};

export function formatCountryDate(iso: string, uiLanguage: string): string {
  const locale = uiLanguage.startsWith('pt') ? 'pt-BR' : 'en-US';

  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const ACCEPTED_COUNTRY_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_COUNTRY_IMAGE_BYTES = 5 * 1024 * 1024;
