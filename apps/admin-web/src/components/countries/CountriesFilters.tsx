import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  CountryAvailabilityFilter,
  CountryExploreFilter,
  CountryFeaturedFilter,
  CountryRegion,
  CountryStatusFilter,
} from '@apex-card/shared';

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
import { countryRegionLabelKey, countryRegionOptions } from '@/lib/countryRegions';

export const ALL_VALUE = 'all';

type CountriesFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: CountryStatusFilter | typeof ALL_VALUE;
  onStatusChange: (value: CountryStatusFilter | typeof ALL_VALUE) => void;
  availableForPartners: CountryAvailabilityFilter | typeof ALL_VALUE;
  onAvailableForPartnersChange: (value: CountryAvailabilityFilter | typeof ALL_VALUE) => void;
  visibleInExplore: CountryExploreFilter | typeof ALL_VALUE;
  onVisibleInExploreChange: (value: CountryExploreFilter | typeof ALL_VALUE) => void;
  featured: CountryFeaturedFilter | typeof ALL_VALUE;
  onFeaturedChange: (value: CountryFeaturedFilter | typeof ALL_VALUE) => void;
  region: CountryRegion | typeof ALL_VALUE;
  onRegionChange: (value: CountryRegion | typeof ALL_VALUE) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
};

const statusOptions: CountryStatusFilter[] = ['ACTIVE', 'INACTIVE'];
const availabilityOptions: CountryAvailabilityFilter[] = ['AVAILABLE', 'UNAVAILABLE'];
const exploreOptions: CountryExploreFilter[] = ['VISIBLE', 'HIDDEN'];
const featuredOptions: CountryFeaturedFilter[] = ['FEATURED', 'NOT_FEATURED'];

function CountriesFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  availableForPartners,
  onAvailableForPartnersChange,
  visibleInExplore,
  onVisibleInExploreChange,
  featured,
  onFeaturedChange,
  region,
  onRegionChange,
  hasActiveFilters,
  onClear,
}: CountriesFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('countries.filters.searchPlaceholder')}
          aria-label={t('countries.filters.searchPlaceholder')}
          className="pl-8"
        />
      </div>

      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as CountryStatusFilter | typeof ALL_VALUE)}
      >
        <SelectTrigger aria-label={t('countries.filters.status')} className="w-full sm:w-auto">
          <SelectValue placeholder={t('countries.filters.statusAll')}>
            {(value: CountryStatusFilter | typeof ALL_VALUE) =>
              value === ALL_VALUE
                ? t('countries.filters.statusAll')
                : t(countryActiveLabelKey[value === 'ACTIVE' ? 'active' : 'inactive'])
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('countries.filters.statusAll')}</SelectItem>
          {statusOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(countryActiveLabelKey[option === 'ACTIVE' ? 'active' : 'inactive'])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={availableForPartners}
        onValueChange={(value) =>
          onAvailableForPartnersChange(value as CountryAvailabilityFilter | typeof ALL_VALUE)
        }
      >
        <SelectTrigger
          aria-label={t('countries.filters.availableForPartners')}
          className="w-full sm:w-auto"
        >
          <SelectValue placeholder={t('countries.filters.availableForPartnersAll')}>
            {(value: CountryAvailabilityFilter | typeof ALL_VALUE) =>
              value === ALL_VALUE
                ? t('countries.filters.availableForPartnersAll')
                : t(
                    value === 'AVAILABLE'
                      ? 'countries.filters.available'
                      : 'countries.filters.unavailable'
                  )
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>
            {t('countries.filters.availableForPartnersAll')}
          </SelectItem>
          {availabilityOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(
                option === 'AVAILABLE'
                  ? 'countries.filters.available'
                  : 'countries.filters.unavailable'
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={visibleInExplore}
        onValueChange={(value) =>
          onVisibleInExploreChange(value as CountryExploreFilter | typeof ALL_VALUE)
        }
      >
        <SelectTrigger
          aria-label={t('countries.filters.visibleInExplore')}
          className="w-full sm:w-auto"
        >
          <SelectValue placeholder={t('countries.filters.visibleInExploreAll')}>
            {(value: CountryExploreFilter | typeof ALL_VALUE) =>
              value === ALL_VALUE
                ? t('countries.filters.visibleInExploreAll')
                : t(value === 'VISIBLE' ? 'countries.filters.visible' : 'countries.filters.hidden')
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('countries.filters.visibleInExploreAll')}</SelectItem>
          {exploreOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(option === 'VISIBLE' ? 'countries.filters.visible' : 'countries.filters.hidden')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={featured}
        onValueChange={(value) =>
          onFeaturedChange(value as CountryFeaturedFilter | typeof ALL_VALUE)
        }
      >
        <SelectTrigger aria-label={t('countries.filters.featured')} className="w-full sm:w-auto">
          <SelectValue placeholder={t('countries.filters.featuredAll')}>
            {(value: CountryFeaturedFilter | typeof ALL_VALUE) =>
              value === ALL_VALUE
                ? t('countries.filters.featuredAll')
                : t(
                    value === 'FEATURED'
                      ? 'countries.filters.featuredYes'
                      : 'countries.filters.featuredNo'
                  )
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('countries.filters.featuredAll')}</SelectItem>
          {featuredOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(
                option === 'FEATURED'
                  ? 'countries.filters.featuredYes'
                  : 'countries.filters.featuredNo'
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={region}
        onValueChange={(value) => onRegionChange(value as CountryRegion | typeof ALL_VALUE)}
      >
        <SelectTrigger aria-label={t('countries.filters.region')} className="w-full sm:w-auto">
          <SelectValue placeholder={t('countries.filters.regionAll')}>
            {(value: CountryRegion | typeof ALL_VALUE) =>
              value === ALL_VALUE
                ? t('countries.filters.regionAll')
                : t(countryRegionLabelKey[value])
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('countries.filters.regionAll')}</SelectItem>
          {countryRegionOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(countryRegionLabelKey[option])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="w-full sm:w-auto">
          <X />
          {t('countries.filters.clear')}
        </Button>
      ) : null}
    </div>
  );
}

export default CountriesFilters;
