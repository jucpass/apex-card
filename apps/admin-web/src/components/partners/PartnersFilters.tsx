import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CountryDto, PartnerStatus } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { partnerStatusFilterOptions, partnerStatusLabelKey } from '@/lib/partnerFormatting';

export const ALL_VALUE = 'all';

type CityOption = { id: string; name: string };

type PartnersFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: PartnerStatus | typeof ALL_VALUE;
  onStatusChange: (value: PartnerStatus | typeof ALL_VALUE) => void;
  countryId: string | typeof ALL_VALUE;
  onCountryIdChange: (value: string | typeof ALL_VALUE) => void;
  countries: CountryDto[];
  cityId: string | typeof ALL_VALUE;
  onCityIdChange: (value: string | typeof ALL_VALUE) => void;
  cities: CityOption[];
  hasActiveFilters: boolean;
  onClear: () => void;
};

function PartnersFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  countryId,
  onCountryIdChange,
  countries,
  cityId,
  onCityIdChange,
  cities,
  hasActiveFilters,
  onClear,
}: PartnersFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('partners.filters.searchPlaceholder')}
          aria-label={t('partners.filters.searchPlaceholder')}
          className="pl-8"
        />
      </div>

      <Select
        value={status}
        onValueChange={(value) =>
          onStatusChange((value ?? ALL_VALUE) as PartnerStatus | typeof ALL_VALUE)
        }
      >
        <SelectTrigger aria-label={t('partners.filters.status')} className="w-full sm:w-auto">
          <SelectValue placeholder={t('partners.filters.statusAll')}>
            {(value: PartnerStatus | typeof ALL_VALUE) =>
              value === ALL_VALUE
                ? t('partners.filters.statusAll')
                : t(partnerStatusLabelKey[value])
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('partners.filters.statusAll')}</SelectItem>
          {partnerStatusFilterOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(partnerStatusLabelKey[option])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={countryId} onValueChange={(value) => onCountryIdChange(value ?? ALL_VALUE)}>
        <SelectTrigger aria-label={t('partners.filters.country')} className="w-full sm:w-auto">
          <SelectValue placeholder={t('partners.filters.countryAll')}>
            {(value: string) =>
              value === ALL_VALUE
                ? t('partners.filters.countryAll')
                : (countries.find((country) => country.id === value)?.name ?? value)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('partners.filters.countryAll')}</SelectItem>
          {countries.map((country) => (
            <SelectItem key={country.id} value={country.id}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={cityId}
        onValueChange={(value) => onCityIdChange(value ?? ALL_VALUE)}
        disabled={countryId === ALL_VALUE}
      >
        <SelectTrigger aria-label={t('partners.filters.city')} className="w-full sm:w-auto">
          <SelectValue placeholder={t('partners.filters.cityAll')}>
            {(value: string) =>
              value === ALL_VALUE
                ? t('partners.filters.cityAll')
                : (cities.find((city) => city.id === value)?.name ?? value)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('partners.filters.cityAll')}</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="w-full sm:w-auto">
          <X />
          {t('partners.filters.clear')}
        </Button>
      ) : null}
    </div>
  );
}

export default PartnersFilters;
