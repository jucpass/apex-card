import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Plus, X } from 'lucide-react';
import type {
  CountryAvailabilityFilter,
  CountryDetails,
  CountryDetailsResponse,
  CountryExploreFilter,
  CountryFeaturedFilter,
  CountryListItem,
  CountryListResponse,
  CountryRegion,
  CountrySortField,
  CountryStatusFilter,
  CreateCountryInput,
  PaginationMeta,
  SortOrder,
} from '@apex-card/shared';

import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CountriesFilters, { ALL_VALUE } from '@/components/countries/CountriesFilters';
import CountriesTable from '@/components/countries/CountriesTable';
import CountryFormDialog, {
  type CountryEditSubmitPayload,
} from '@/components/countries/CountryFormDialog';
import MemberConfirmDialog from '@/components/members/MemberConfirmDialog';
import { ApiError, apiRequest } from '@/lib/apiClient';

type CountriesPageProps = {
  session: Session;
};

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
};

const PAGE_SIZE = 20;

const EMPTY_PAGINATION: PaginationMeta = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };

function CountriesPage({ session }: CountriesPageProps) {
  const { t } = useTranslation();

  const [countries, setCountries] = useState<CountryListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [loadError, setLoadError] = useState<'forbidden' | 'generic' | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CountryStatusFilter | typeof ALL_VALUE>(ALL_VALUE);
  const [availableForPartners, setAvailableForPartners] = useState<
    CountryAvailabilityFilter | typeof ALL_VALUE
  >(ALL_VALUE);
  const [visibleInExplore, setVisibleInExplore] = useState<CountryExploreFilter | typeof ALL_VALUE>(
    ALL_VALUE
  );
  const [featured, setFeatured] = useState<CountryFeaturedFilter | typeof ALL_VALUE>(ALL_VALUE);
  const [region, setRegion] = useState<CountryRegion | typeof ALL_VALUE>(ALL_VALUE);
  const [sortBy, setSortBy] = useState<CountrySortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pendingCountryId, setPendingCountryId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formCountry, setFormCountry] = useState<CountryDetails | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<CountryListItem | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(handle);
  }, [searchInput]);

  const hasActiveFilters =
    search.length > 0 ||
    status !== ALL_VALUE ||
    availableForPartners !== ALL_VALUE ||
    visibleInExplore !== ALL_VALUE ||
    featured !== ALL_VALUE ||
    region !== ALL_VALUE;

  const loadCountries = useCallback(async () => {
    setIsFetching(true);

    try {
      const params = new URLSearchParams();

      if (search) params.set('search', search);
      if (status !== ALL_VALUE) params.set('status', status);
      if (availableForPartners !== ALL_VALUE)
        params.set('availableForPartners', availableForPartners);
      if (visibleInExplore !== ALL_VALUE) params.set('visibleInExplore', visibleInExplore);
      if (featured !== ALL_VALUE) params.set('featured', featured);
      if (region !== ALL_VALUE) params.set('region', region);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));

      const result = await apiRequest<CountryListResponse>(
        `/api/admin/countries?${params.toString()}`,
        session
      );

      setCountries(result.countries);
      setPagination(result.pagination);
      setLoadError(null);
    } catch (error) {
      setCountries([]);
      setPagination(EMPTY_PAGINATION);
      setLoadError(error instanceof ApiError && error.status === 403 ? 'forbidden' : 'generic');
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [
    session,
    search,
    status,
    availableForPartners,
    visibleInExplore,
    featured,
    region,
    sortBy,
    sortOrder,
    page,
  ]);

  useEffect(() => {
    void loadCountries();
  }, [loadCountries]);

  const handleSortChange = (field: CountrySortField) => {
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
    setAvailableForPartners(ALL_VALUE);
    setVisibleInExplore(ALL_VALUE);
    setFeatured(ALL_VALUE);
    setRegion(ALL_VALUE);
    setPage(1);
  };

  const patchCountry = (updated: CountryDetails) => {
    setCountries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setFormCountry((prev) => (prev && prev.id === updated.id ? updated : prev));
  };

  const handleCreateRequest = () => {
    setFormError(null);
    setFormMode('create');
    setFormCountry(null);
    setFormOpen(true);
  };

  const handleEditRequest = (country: CountryListItem) => {
    setFormError(null);
    setFormMode('edit');
    setFormCountry(country);
    setFormOpen(true);
  };

  const handleCreate = async (input: CreateCountryInput) => {
    setIsSavingForm(true);
    setFormError(null);

    try {
      const result = await apiRequest<CountryDetailsResponse>('/api/admin/countries', session, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setFeedback({
        type: 'success',
        message: t('countries.success.created', { name: result.country.name }),
      });
      setFormOpen(false);
      void loadCountries();
    } catch (error) {
      setFormError(
        error instanceof ApiError && error.status === 409
          ? t('countries.errors.duplicateName')
          : t('countries.errors.createFailed')
      );
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleEditSubmit = async (payload: CountryEditSubmitPayload) => {
    if (!formCountry) {
      return;
    }

    setIsSavingForm(true);
    setFormError(null);

    try {
      let latest = formCountry;

      if (payload.identity) {
        const result = await apiRequest<CountryDetailsResponse>(
          `/api/admin/countries/${latest.id}`,
          session,
          { method: 'PATCH', body: JSON.stringify(payload.identity) }
        );
        latest = result.country;
      }

      if (payload.availability) {
        const result = await apiRequest<CountryDetailsResponse>(
          `/api/admin/countries/${latest.id}/availability`,
          session,
          { method: 'PATCH', body: JSON.stringify(payload.availability) }
        );
        latest = result.country;
      }

      patchCountry(latest);
      setFeedback({
        type: 'success',
        message: t('countries.success.updated', { name: latest.name }),
      });
      setFormOpen(false);
      void loadCountries();
    } catch (error) {
      setFormError(
        error instanceof ApiError && error.status === 409
          ? t('countries.errors.duplicateName')
          : error instanceof ApiError && error.status === 400
            ? error.message
            : t('countries.errors.updateFailed')
      );
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleActivate = async (country: CountryListItem) => {
    setPendingCountryId(country.id);

    try {
      const result = await apiRequest<CountryDetailsResponse>(
        `/api/admin/countries/${country.id}/status`,
        session,
        { method: 'PATCH', body: JSON.stringify({ active: true }) }
      );
      patchCountry(result.country);
      setFeedback({
        type: 'success',
        message: t('countries.success.activated', { name: result.country.name }),
      });
    } catch {
      setFeedback({ type: 'error', message: t('countries.errors.statusUpdateFailed') });
    } finally {
      setPendingCountryId(null);
    }
  };

  const handleRequestDeactivate = (country: CountryListItem) => {
    setFormOpen(false);
    setDeactivateTarget(country);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) {
      return;
    }

    setIsConfirmLoading(true);
    setPendingCountryId(deactivateTarget.id);

    try {
      const result = await apiRequest<CountryDetailsResponse>(
        `/api/admin/countries/${deactivateTarget.id}/status`,
        session,
        { method: 'PATCH', body: JSON.stringify({ active: false }) }
      );
      patchCountry(result.country);
      setFeedback({
        type: 'success',
        message: t('countries.success.deactivated', { name: result.country.name }),
      });
    } catch {
      setFeedback({ type: 'error', message: t('countries.errors.statusUpdateFailed') });
    } finally {
      setIsConfirmLoading(false);
      setPendingCountryId(null);
      setDeactivateTarget(null);
    }
  };

  const handleFormStatusChange = (country: CountryDetails, nextActive: boolean) => {
    setFormOpen(false);

    if (nextActive) {
      void handleActivate(country);
    } else {
      setDeactivateTarget(country);
    }
  };

  const deactivateCopy = useMemo(() => {
    if (!deactivateTarget) {
      return null;
    }

    return {
      title: t('countries.confirm.deactivateTitle'),
      description: t('countries.confirm.deactivateDescription', { name: deactivateTarget.name }),
      confirmLabel: t('countries.actions.deactivate'),
    };
  }, [deactivateTarget, t]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('countries.title')}
        description={
          pagination.total > 0
            ? t('countries.totalCount', { count: pagination.total })
            : t('countries.description')
        }
        actions={
          <Button onClick={handleCreateRequest}>
            <Plus />
            {t('countries.actions.create')}
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

      <CountriesFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        availableForPartners={availableForPartners}
        onAvailableForPartnersChange={(value) => {
          setAvailableForPartners(value);
          setPage(1);
        }}
        visibleInExplore={visibleInExplore}
        onVisibleInExploreChange={(value) => {
          setVisibleInExplore(value);
          setPage(1);
        }}
        featured={featured}
        onFeaturedChange={(value) => {
          setFeatured(value);
          setPage(1);
        }}
        region={region}
        onRegionChange={(value) => {
          setRegion(value);
          setPage(1);
        }}
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
              ? t('countries.errors.forbidden')
              : t('countries.errors.loadFailed')}
          </p>
          <Button variant="outline" size="sm" onClick={() => void loadCountries()}>
            {t('common.refresh')}
          </Button>
        </div>
      ) : (
        <>
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <CountriesTable
              countries={countries}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              hasActiveFilters={hasActiveFilters}
              pendingCountryId={pendingCountryId}
              onEdit={handleEditRequest}
              onActivate={(country) => void handleActivate(country)}
              onRequestDeactivate={handleRequestDeactivate}
            />
          </div>

          {pagination.total > 0 ? (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                {t('countries.pagination.rangeInfo', {
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
                  {t('countries.pagination.previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('countries.pagination.pageInfo', {
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
                  {t('countries.pagination.next')}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <CountryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        country={formCountry}
        session={session}
        isSubmitting={isSavingForm}
        errorMessage={formError}
        onCreate={(input) => void handleCreate(input)}
        onEditSubmit={(payload) => void handleEditSubmit(payload)}
        onCountryUpdated={patchCountry}
        onRequestStatusChange={handleFormStatusChange}
      />

      {deactivateCopy ? (
        <MemberConfirmDialog
          open={Boolean(deactivateTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setDeactivateTarget(null);
            }
          }}
          title={deactivateCopy.title}
          description={deactivateCopy.description}
          confirmLabel={deactivateCopy.confirmLabel}
          destructive
          loading={isConfirmLoading}
          onConfirm={() => void handleConfirmDeactivate()}
        />
      ) : null}
    </div>
  );
}

export default CountriesPage;
