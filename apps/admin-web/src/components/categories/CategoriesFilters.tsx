import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CategoryStatusFilter } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categoryActiveLabelKey } from '@/lib/categoryFormatting';

export const ALL_VALUE = 'all';

type CategoriesFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: CategoryStatusFilter | typeof ALL_VALUE;
  onStatusChange: (value: CategoryStatusFilter | typeof ALL_VALUE) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
};

const statusOptions: CategoryStatusFilter[] = ['ACTIVE', 'INACTIVE'];

const statusLabelKey: Record<CategoryStatusFilter, string> = {
  ACTIVE: categoryActiveLabelKey.active,
  INACTIVE: categoryActiveLabelKey.inactive,
};

function CategoriesFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  hasActiveFilters,
  onClear,
}: CategoriesFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('categories.filters.searchPlaceholder')}
          aria-label={t('categories.filters.searchPlaceholder')}
          className="pl-8"
        />
      </div>

      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as CategoryStatusFilter | typeof ALL_VALUE)}
      >
        <SelectTrigger aria-label={t('categories.filters.status')} className="w-full sm:w-auto">
          <SelectValue placeholder={t('categories.filters.statusAll')}>
            {(value: CategoryStatusFilter | typeof ALL_VALUE) =>
              value === ALL_VALUE ? t('categories.filters.statusAll') : t(statusLabelKey[value])
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('categories.filters.statusAll')}</SelectItem>
          {statusOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(statusLabelKey[option])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="w-full sm:w-auto">
          <X />
          {t('categories.filters.clear')}
        </Button>
      ) : null}
    </div>
  );
}

export default CategoriesFilters;
