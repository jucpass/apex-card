import { ArrowDown, ArrowUp, ArrowUpDown, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PartnerListItem, PartnerSortField, SortOrder } from '@apex-card/shared';

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
  formatPartnerDate,
  partnerStatusLabelKey,
  partnerStatusTone,
} from '@/lib/partnerFormatting';
import PartnerRowActions from '@/components/partners/PartnerRowActions';

type PartnersTableProps = {
  partners: PartnerListItem[];
  sortBy: PartnerSortField;
  sortOrder: SortOrder;
  onSortChange: (field: PartnerSortField) => void;
  hasActiveFilters: boolean;
  pendingPartnerId: string | null;
  onView: (partner: PartnerListItem) => void;
  onEdit: (partner: PartnerListItem) => void;
  onRequestActivate: (partner: PartnerListItem) => void;
  onRequestDeactivate: (partner: PartnerListItem) => void;
};

function SortableHeader({
  field,
  label,
  sortBy,
  sortOrder,
  onSortChange,
  className,
}: {
  field: PartnerSortField;
  label: string;
  sortBy: PartnerSortField;
  sortOrder: SortOrder;
  onSortChange: (field: PartnerSortField) => void;
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

function PartnersTable({
  partners,
  sortBy,
  sortOrder,
  onSortChange,
  hasActiveFilters,
  pendingPartnerId,
  onView,
  onEdit,
  onRequestActivate,
  onRequestDeactivate,
}: PartnersTableProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader
              field="name"
              label={t('partners.table.name')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
            />
            <TableHead className="hidden lg:table-cell">{t('partners.table.contact')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('partners.table.location')}</TableHead>
            <SortableHeader
              field="status"
              label={t('partners.table.status')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
            />
            <SortableHeader
              field="updatedAt"
              label={t('partners.table.updated')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
              className="hidden md:table-cell"
            />
            <TableHead className="w-10 text-right">
              <span className="sr-only">{t('partners.table.actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center whitespace-normal">
                <p className="text-sm font-medium text-foreground">
                  {hasActiveFilters
                    ? t('partners.empty.noResults')
                    : t('partners.empty.noPartners')}
                </p>
                {hasActiveFilters ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('partners.empty.noResultsHint')}
                  </p>
                ) : null}
              </TableCell>
            </TableRow>
          ) : (
            partners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell className="whitespace-normal">
                  <button
                    type="button"
                    onClick={() => onView(partner)}
                    className="flex items-center gap-2.5 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <span
                      className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground"
                      aria-hidden="true"
                    >
                      {partner.coverImageUrl ? (
                        <img
                          src={partner.coverImageUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <Store className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <p className="text-sm font-medium text-foreground hover:underline">
                        {partner.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {partner.email ?? partner.slug}
                      </p>
                    </span>
                  </button>
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                  {partner.phone || partner.whatsapp ? (
                    <div className="flex flex-col gap-0.5">
                      {partner.phone ? <span>{partner.phone}</span> : null}
                      {partner.whatsapp ? (
                        <span>
                          {t('partners.table.whatsappPrefix')} {partner.whatsapp}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                  {[partner.cityName, partner.countryName].filter(Boolean).join(', ') || '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    tone={partnerStatusTone[partner.status]}
                    label={t(partnerStatusLabelKey[partner.status])}
                  />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatPartnerDate(partner.updatedAt, i18n.language)}
                </TableCell>
                <TableCell className="text-right">
                  <PartnerRowActions
                    partner={partner}
                    disabled={pendingPartnerId === partner.id}
                    onView={onView}
                    onEdit={onEdit}
                    onRequestActivate={onRequestActivate}
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

export default PartnersTable;
