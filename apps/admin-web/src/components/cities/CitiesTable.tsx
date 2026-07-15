import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CityListItem, CitySortField, SortOrder } from '@apex-card/shared';

import StatusBadge from '@/components/common/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  countryActiveLabelKey,
  countryActiveTone,
  formatCountryDate,
} from '@/lib/countryFormatting';
import CityRowActions from '@/components/cities/CityRowActions';

type CitiesTableProps = {
  cities: CityListItem[];
  sortBy: CitySortField;
  sortOrder: SortOrder;
  onSortChange: (field: CitySortField) => void;
  hasActiveFilters: boolean;
  pendingCityId: string | null;
  onEdit: (city: CityListItem) => void;
  onActivate: (city: CityListItem) => void;
  onRequestDeactivate: (city: CityListItem) => void;
};

function SortableHeader({
  field,
  label,
  sortBy,
  sortOrder,
  onSortChange,
  className,
}: {
  field: CitySortField;
  label: string;
  sortBy: CitySortField;
  sortOrder: SortOrder;
  onSortChange: (field: CitySortField) => void;
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

function CitiesTable({
  cities,
  sortBy,
  sortOrder,
  onSortChange,
  hasActiveFilters,
  pendingCityId,
  onEdit,
  onActivate,
  onRequestDeactivate,
}: CitiesTableProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader
              field="name"
              label={t('cities.table.name')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
            />
            <TableHead className="hidden sm:table-cell">{t('cities.table.slug')}</TableHead>
            <TableHead>{t('cities.table.country')}</TableHead>
            <TableHead>{t('cities.table.status')}</TableHead>
            <SortableHeader
              field="createdAt"
              label={t('cities.table.created')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
              className="hidden md:table-cell"
            />
            <TableHead className="w-10 text-right">
              <span className="sr-only">{t('cities.table.actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center whitespace-normal">
                <p className="text-sm font-medium text-foreground">
                  {hasActiveFilters ? t('cities.empty.noResults') : t('cities.empty.noCities')}
                </p>
                {hasActiveFilters ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('cities.empty.noResultsHint')}
                  </p>
                ) : null}
              </TableCell>
            </TableRow>
          ) : (
            cities.map((city) => (
              <TableRow key={city.id}>
                <TableCell className="whitespace-normal">
                  <p className="text-sm font-medium text-foreground">{city.name}</p>
                  <p className="text-xs text-muted-foreground sm:hidden">{city.slug}</p>
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                  {city.slug}
                </TableCell>
                <TableCell className="text-sm text-foreground">{city.countryName}</TableCell>
                <TableCell>
                  <StatusBadge
                    tone={countryActiveTone[city.active ? 'active' : 'inactive']}
                    label={t(countryActiveLabelKey[city.active ? 'active' : 'inactive'])}
                  />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatCountryDate(city.createdAt, i18n.language)}
                </TableCell>
                <TableCell className="text-right">
                  <CityRowActions
                    city={city}
                    disabled={pendingCityId === city.id}
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

export default CitiesTable;
