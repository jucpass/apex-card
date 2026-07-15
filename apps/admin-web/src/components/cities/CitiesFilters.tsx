import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CityStatusFilter, CountryDto } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { countryActiveLabelKey } from '@/lib/countryFormatting';

export const ALL_VALUE = 'all';

type CitiesFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  countryId: string | typeof ALL_VALUE;
  onCountryIdChange: (value: string | typeof ALL_VALUE) => void;
  countries: CountryDto[];
  status: CityStatusFilter | typeof ALL_VALUE;
  onStatusChange: (value: CityStatusFilter | typeof ALL_VALUE) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
};

const statusOptions: CityStatusFilter[] = ['ACTIVE', 'INACTIVE'];

function CitiesFilters({
  search,
  onSearchChange,
  countryId,
  onCountryIdChange,
  countries,
  status,
  onStatusChange,
  hasActiveFilters,
  onClear,
}: CitiesFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('cities.filters.searchPlaceholder')}
          aria-label={t('cities.filters.searchPlaceholder')}
          className="pl-8"
        />
      </div>

      <Select value={countryId} onValueChange={(value) => onCountryIdChange(value ?? ALL_VALUE)}>
        <SelectTrigger aria-label={t('cities.filters.country')} className="w-full sm:w-auto">
          <SelectValue placeholder={t('cities.filters.countryAll')}>
            {(value: string) =>
              value === ALL_VALUE
                ? t('cities.filters.countryAll')
                : (countries.find((country) => country.id === value)?.name ?? value)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('cities.filters.countryAll')}</SelectItem>
          {countries.map((country) => (
            <SelectItem key={country.id} value={country.id}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as CityStatusFilter | typeof ALL_VALUE)}
      >
        <SelectTrigger aria-label={t('cities.filters.status')} className="w-full sm:w-auto">
          <SelectValue placeholder={t('cities.filters.statusAll')}>
            {(value: CityStatusFilter | typeof ALL_VALUE) =>
              value === ALL_VALUE
                ? t('cities.filters.statusAll')
                : t(countryActiveLabelKey[value === 'ACTIVE' ? 'active' : 'inactive'])
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('cities.filters.statusAll')}</SelectItem>
          {statusOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(countryActiveLabelKey[option === 'ACTIVE' ? 'active' : 'inactive'])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="w-full sm:w-auto">
          <X />
          {t('cities.filters.clear')}
        </Button>
      ) : null}
    </div>
  );
}

export default CitiesFilters;
