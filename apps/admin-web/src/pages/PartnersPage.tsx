import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Plus, X } from 'lucide-react';
import type {
  CountriesResponse,
  CountryDto,
  PaginationMeta,
  PartnerDetailsResponse,
  PartnerListItem,
  PartnerListResponse,
  PartnerSortField,
  PartnerStatus,
  SortOrder,
} from '@apex-card/shared';

import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import MemberConfirmDialog from '@/components/members/MemberConfirmDialog';
import PartnersFilters, { ALL_VALUE } from '@/components/partners/PartnersFilters';
import PartnersTable from '@/components/partners/PartnersTable';
import { ApiError, apiRequest } from '@/lib/apiClient';

type PartnersPageProps = {
  session: Session;
};

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
};

type StatusChangeState = {
  partner: PartnerListItem;
  nextStatus: 'ACTIVE' | 'INACTIVE';
};

const PAGE_SIZE = 20;

const EMPTY_PAGINATION: PaginationMeta = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };

function PartnersPage({ session }: PartnersPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [partners, setPartners] = useState<PartnerListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [loadError, setLoadError] = useState<'forbidden' | 'generic' | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PartnerStatus | typeof ALL_VALUE>(ALL_VALUE);
  const [countryId, setCountryId] = useState<string | typeof ALL_VALUE>(ALL_VALUE);
  const [cityId, setCityId] = useState<string | typeof ALL_VALUE>(ALL_VALUE);
  const [sortBy, setSortBy] = useState<PartnerSortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);

  const [countries, setCountries] = useState<CountryDto[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pendingPartnerId, setPendingPartnerId] = useState<string | null>(null);
  const [statusChange, setStatusChange] = useState<StatusChangeState | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    void apiRequest<CountriesResponse>('/api/admin/countries/options', session)
      .then((result) => setCountries(result.countries))
      .catch(() => setCountries([]));
  }, [session]);

  useEffect(() => {
    if (countryId === ALL_VALUE) {
      setCities([]);
      return;
    }

    void apiRequest<{ cities: { id: string; name: string }[] }>(
      `/api/admin/cities/by-country/${countryId}`,
      session
    )
      .then((result) => setCities(result.cities))
      .catch(() => setCities([]));
  }, [countryId, session]);

  const hasActiveFilters =
    search.length > 0 || status !== ALL_VALUE || countryId !== ALL_VALUE || cityId !== ALL_VALUE;

  const loadPartners = useCallback(async () => {
    setIsFetching(true);

    try {
      const params = new URLSearchParams();

      if (search) params.set('search', search);
      if (status !== ALL_VALUE) params.set('status', status);
      if (countryId !== ALL_VALUE) params.set('countryId', countryId);
      if (cityId !== ALL_VALUE) params.set('cityId', cityId);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));

      const result = await apiRequest<PartnerListResponse>(
        `/api/admin/partners?${params.toString()}`,
        session
      );

      setPartners(result.partners);
      setPagination(result.pagination);
      setLoadError(null);
    } catch (error) {
      setPartners([]);
      setPagination(EMPTY_PAGINATION);
      setLoadError(error instanceof ApiError && error.status === 403 ? 'forbidden' : 'generic');
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [session, search, status, countryId, cityId, sortBy, sortOrder, page]);

  useEffect(() => {
    void loadPartners();
  }, [loadPartners]);

  const handleSortChange = (field: PartnerSortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatus(ALL_VALUE);
    setCountryId(ALL_VALUE);
    setCityId(ALL_VALUE);
    setPage(1);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusChange) {
      return;
    }

    const { partner, nextStatus } = statusChange;
    setIsConfirmLoading(true);
    setPendingPartnerId(partner.id);

    try {
      const result = await apiRequest<PartnerDetailsResponse>(
        `/api/admin/partners/${partner.id}/status`,
        session,
        { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) }
      );
      setPartners((prev) =>
        prev.map((item) => (item.id === result.partner.id ? result.partner : item))
      );
      setFeedback({
        type: 'success',
        message: t(
          nextStatus === 'ACTIVE' ? 'partners.success.activated' : 'partners.success.deactivated',
          { name: partner.name }
        ),
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof ApiError && error.status === 400 && nextStatus === 'ACTIVE'
            ? t('partners.errors.activationRequiresImage')
            : t('partners.errors.statusUpdateFailed'),
      });
    } finally {
      setIsConfirmLoading(false);
      setPendingPartnerId(null);
      setStatusChange(null);
    }
  };

  const confirmCopy = useMemo(() => {
    if (!statusChange) {
      return null;
    }

    const { partner, nextStatus } = statusChange;

    return nextStatus === 'ACTIVE'
      ? {
          title: t('partners.confirm.activateTitle'),
          description: t('partners.confirm.activateDescription', { name: partner.name }),
          confirmLabel: t('partners.actions.activate'),
          destructive: false,
        }
      : {
          title: t('partners.confirm.deactivateTitle'),
          description: t('partners.confirm.deactivateDescription', { name: partner.name }),
          confirmLabel: t('partners.actions.deactivate'),
          destructive: true,
        };
  }, [statusChange, t]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('partners.title')}
        description={
          pagination.total > 0
            ? t('partners.totalCount', { count: pagination.total })
            : t('partners.description')
        }
        actions={
          <Button onClick={() => navigate('/admin/partners/new')}>
            <Plus />
            {t('partners.actions.create')}
          </Button>
        }
      />

      {feedback ? (
        <div
          className={`flex items-center justify-between gap-3 rounded-lg p-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertTriangle className="size-4 shrink-0" />
            )}
            {feedback.message}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setFeedback(null)}
            aria-label={t('common.cancel')}
          >
            <X />
          </Button>
        </div>
      ) : null}

      <PartnersFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        countryId={countryId}
        onCountryIdChange={(value) => {
          setCountryId(value);
          setCityId(ALL_VALUE);
          setPage(1);
        }}
        countries={countries}
        cityId={cityId}
        onCityIdChange={(value) => {
          setCityId(value);
          setPage(1);
        }}
        cities={cities}
        hasActiveFilters={hasActiveFilters}
        onClear={handleClearFilters}
      />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl py-16 text-center ring-1 ring-foreground/10">
          <AlertTriangle className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {loadError === 'forbidden'
              ? t('partners.errors.forbidden')
              : t('partners.errors.loadFailed')}
          </p>
          <Button variant="outline" size="sm" onClick={() => void loadPartners()}>
            {t('common.refresh')}
          </Button>
        </div>
      ) : (
        <>
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <PartnersTable
              partners={partners}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              hasActiveFilters={hasActiveFilters}
              pendingPartnerId={pendingPartnerId}
              onView={(partner) => navigate(`/admin/partners/${partner.id}`)}
              onEdit={(partner) => navigate(`/admin/partners/${partner.id}?edit=1`)}
              onRequestActivate={(partner) => setStatusChange({ partner, nextStatus: 'ACTIVE' })}
              onRequestDeactivate={(partner) =>
                setStatusChange({ partner, nextStatus: 'INACTIVE' })
              }
            />
          </div>

          {pagination.total > 0 ? (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                {t('partners.pagination.rangeInfo', {
                  from: (pagination.page - 1) * pagination.pageSize + 1,
                  to: Math.min(pagination.page * pagination.pageSize, pagination.total),
                  total: pagination.total,
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1 || isFetching}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  {t('partners.pagination.previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('partners.pagination.pageInfo', {
                    page: pagination.page,
                    totalPages: pagination.totalPages,
                  })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages || isFetching}
                  onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                >
                  {t('partners.pagination.next')}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {confirmCopy ? (
        <MemberConfirmDialog
          open={Boolean(statusChange)}
          onOpenChange={(open) => {
            if (!open) {
              setStatusChange(null);
            }
          }}
          title={confirmCopy.title}
          description={confirmCopy.description}
          confirmLabel={confirmCopy.confirmLabel}
          destructive={confirmCopy.destructive}
          loading={isConfirmLoading}
          onConfirm={() => void handleConfirmStatusChange()}
        />
      ) : null}
    </div>
  );
}

export default PartnersPage;
