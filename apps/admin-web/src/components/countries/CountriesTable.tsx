import { ArrowDown, ArrowUp, ArrowUpDown, Globe, Handshake, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CountryListItem, CountrySortField, SortOrder } from '@apex-card/shared';

import StatusBadge from '@/components/common/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  countryActiveLabelKey,
  countryActiveTone,
  formatCountryDate,
} from '@/lib/countryFormatting';
import CountryRowActions from '@/components/countries/CountryRowActions';

type CountriesTableProps = {
  countries: CountryListItem[];
  sortBy: CountrySortField;
  sortOrder: SortOrder;
  onSortChange: (field: CountrySortField) => void;
  hasActiveFilters: boolean;
  pendingCountryId: string | null;
  onEdit: (country: CountryListItem) => void;
  onActivate: (country: CountryListItem) => void;
  onRequestDeactivate: (country: CountryListItem) => void;
};

function SortableHeader({
  field,
  label,
  sortBy,
  sortOrder,
  onSortChange,
  className,
}: {
  field: CountrySortField;
  label: string;
  sortBy: CountrySortField;
  sortOrder: SortOrder;
  onSortChange: (field: CountrySortField) => void;
  className?: string;
}) {
  const isActive = sortBy === field;
  const Icon = isActive ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSortChange(field)}
        className="inline-flex items-center gap-1 rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {label}
        <Icon className={`size-3.5 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
      </button>
    </TableHead>
  );
}

function AvailabilityIndicator({
  icon: Icon,
  active,
  label,
}: {
  icon: typeof Handshake;
  active: boolean;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={`flex size-6 items-center justify-center rounded-md ${
              active
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground/50'
            }`}
          />
        }
      >
        <Icon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function CountriesTable({
  countries,
  sortBy,
  sortOrder,
  onSortChange,
  hasActiveFilters,
  pendingCountryId,
  onEdit,
  onActivate,
  onRequestDeactivate,
}: CountriesTableProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <span className="sr-only">{t('countries.table.image')}</span>
            </TableHead>
            <SortableHeader
              field="name"
              label={t('countries.table.country')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
            />
            <TableHead className="hidden lg:table-cell">
              {t('countries.table.phoneCurrency')}
            </TableHead>
            <TableHead>{t('countries.table.status')}</TableHead>
            <TableHead className="hidden sm:table-cell">
              {t('countries.table.availability')}
            </TableHead>
            <SortableHeader
              field="createdAt"
              label={t('countries.table.created')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
              className="hidden md:table-cell"
            />
            <TableHead className="w-10 text-right">
              <span className="sr-only">{t('countries.table.actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {countries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center whitespace-normal">
                <p className="text-sm font-medium text-foreground">
                  {hasActiveFilters
                    ? t('countries.empty.noResults')
                    : t('countries.empty.noCountries')}
                </p>
                {hasActiveFilters ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('countries.empty.noResultsHint')}
                  </p>
                ) : null}
              </TableCell>
            </TableRow>
          ) : (
            countries.map((country) => (
              <TableRow key={country.id}>
                <TableCell>
                  <span
                    className="flex size-8 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground"
                    aria-hidden="true"
                  >
                    {country.imageUrl ? (
                      <img src={country.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <Globe className="size-4" />
                    )}
                  </span>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <p className="text-sm font-medium text-foreground">{country.name}</p>
                  <p className="text-xs text-muted-foreground">{country.code}</p>
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                  {[country.phoneCode, country.currency].filter(Boolean).join(' · ') || '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    tone={countryActiveTone[country.active ? 'active' : 'inactive']}
                    label={t(countryActiveLabelKey[country.active ? 'active' : 'inactive'])}
                  />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-1">
                    <AvailabilityIndicator
                      icon={Handshake}
                      active={country.availableForPartners}
                      label={t('countries.table.availableForPartners')}
                    />
                    <AvailabilityIndicator
                      icon={Globe}
                      active={country.visibleInExplore}
                      label={t('countries.table.visibleInExplore')}
                    />
                    <AvailabilityIndicator
                      icon={Star}
                      active={country.featured}
                      label={t('countries.table.featured')}
                    />
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatCountryDate(country.createdAt, i18n.language)}
                </TableCell>
                <TableCell className="text-right">
                  <CountryRowActions
                    country={country}
                    disabled={pendingCountryId === country.id}
                    onEdit={onEdit}
                    onActivate={onActivate}
                    onRequestDeactivate={onRequestDeactivate}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default CountriesTable;
