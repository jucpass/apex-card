import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CategoryListItem, CategorySortField } from '@apex-card/shared';
import type { SortOrder } from '@apex-card/shared';

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
  categoryActiveLabelKey,
  categoryActiveTone,
  formatCategoryDate,
} from '@/lib/categoryFormatting';
import { resolveCategoryIcon } from '@/lib/categoryIcons';
import CategoryRowActions from '@/components/categories/CategoryRowActions';

type CategoriesTableProps = {
  categories: CategoryListItem[];
  sortBy: CategorySortField;
  sortOrder: SortOrder;
  onSortChange: (field: CategorySortField) => void;
  hasActiveFilters: boolean;
  pendingCategoryId: string | null;
  onEdit: (category: CategoryListItem) => void;
  onActivate: (category: CategoryListItem) => void;
  onRequestDeactivate: (category: CategoryListItem) => void;
};

function SortableHeader({
  field,
  label,
  sortBy,
  sortOrder,
  onSortChange,
  className,
}: {
  field: CategorySortField;
  label: string;
  sortBy: CategorySortField;
  sortOrder: SortOrder;
  onSortChange: (field: CategorySortField) => void;
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

function CategoriesTable({
  categories,
  sortBy,
  sortOrder,
  onSortChange,
  hasActiveFilters,
  pendingCategoryId,
  onEdit,
  onActivate,
  onRequestDeactivate,
}: CategoriesTableProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <span className="sr-only">{t('categories.table.icon')}</span>
            </TableHead>
            <SortableHeader
              field="name"
              label={t('categories.table.name')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
            />
            <TableHead className="hidden sm:table-cell">{t('categories.table.slug')}</TableHead>
            <TableHead>{t('categories.table.status')}</TableHead>
            <SortableHeader
              field="createdAt"
              label={t('categories.table.created')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
              className="hidden md:table-cell"
            />
            <TableHead className="w-10 text-right">
              <span className="sr-only">{t('categories.table.actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center whitespace-normal">
                <p className="text-sm font-medium text-foreground">
                  {hasActiveFilters
                    ? t('categories.empty.noResults')
                    : t('categories.empty.noCategories')}
                </p>
                {hasActiveFilters ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('categories.empty.noResultsHint')}
                  </p>
                ) : null}
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => {
              const Icon = resolveCategoryIcon(category.icon);

              return (
                <TableRow key={category.id}>
                  <TableCell>
                    <span
                      className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground"
                      aria-hidden="true"
                    >
                      <Icon className="size-4" />
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <p className="text-sm font-medium text-foreground">{category.name}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{category.slug}</p>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                    {category.slug}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={categoryActiveTone[category.active ? 'active' : 'inactive']}
                      label={t(categoryActiveLabelKey[category.active ? 'active' : 'inactive'])}
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatCategoryDate(category.createdAt, i18n.language)}
                  </TableCell>
                  <TableCell className="text-right">
                    <CategoryRowActions
                      category={category}
                      disabled={pendingCategoryId === category.id}
                      onEdit={onEdit}
                      onActivate={onActivate}
                      onRequestDeactivate={onRequestDeactivate}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default CategoriesTable;
