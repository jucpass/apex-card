import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Plus, X } from 'lucide-react';
import type {
  CityDetails,
  CityDetailsResponse,
  CityListItem,
  CityListResponse,
  CitySortField,
  CityStatusFilter,
  CountriesResponse,
  CountryDto,
  CreateCityInput,
  PaginationMeta,
  SortOrder,
  UpdateCityInput,
} from '@apex-card/shared';

import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CitiesFilters, { ALL_VALUE } from '@/components/cities/CitiesFilters';
import CitiesTable from '@/components/cities/CitiesTable';
import CityFormDialog from '@/components/cities/CityFormDialog';
import MemberConfirmDialog from '@/components/members/MemberConfirmDialog';
import { ApiError, apiRequest } from '@/lib/apiClient';

type CitiesPageProps = {
  session: Session;
};

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
};

const PAGE_SIZE = 20;

const EMPTY_PAGINATION: PaginationMeta = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };

function CitiesPage({ session }: CitiesPageProps) {
  const { t } = useTranslation();

  const [cities, setCities] = useState<CityListItem[]>([]);
  const [countries, setCountries] = useState<CountryDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [loadError, setLoadError] = useState<'forbidden' | 'generic' | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [countryId, setCountryId] = useState<string | typeof ALL_VALUE>(ALL_VALUE);
  const [status, setStatus] = useState<CityStatusFilter | typeof ALL_VALUE>(ALL_VALUE);
  const [sortBy, setSortBy] = useState<CitySortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pendingCityId, setPendingCityId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formCity, setFormCity] = useState<CityDetails | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<CityListItem | null>(null);
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

  const hasActiveFilters = search.length > 0 || countryId !== ALL_VALUE || status !== ALL_VALUE;

  const loadCities = useCallback(async () => {
    setIsFetching(true);

    try {
      const params = new URLSearchParams();

      if (search) params.set('search', search);
      if (countryId !== ALL_VALUE) params.set('countryId', countryId);
      if (status !== ALL_VALUE) params.set('status', status);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));

      const result = await apiRequest<CityListResponse>(
        `/api/admin/cities?${params.toString()}`,
        session
      );

      setCities(result.cities);
      setPagination(result.pagination);
      setLoadError(null);
    } catch (error) {
      setCities([]);
      setPagination(EMPTY_PAGINATION);
      setLoadError(error instanceof ApiError && error.status === 403 ? 'forbidden' : 'generic');
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [session, search, countryId, status, sortBy, sortOrder, page]);

  useEffect(() => {
    void loadCities();
  }, [loadCities]);

  const handleSortChange = (field: CitySortField) => {
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
    setCountryId(ALL_VALUE);
    setStatus(ALL_VALUE);
    setPage(1);
  };

  const patchCity = (updated: CityDetails) => {
    setCities((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleCreateRequest = () => {
    setFormError(null);
    setFormMode('create');
    setFormCity(null);
    setFormOpen(true);
  };

  const handleEditRequest = (city: CityListItem) => {
    setFormError(null);
    setFormMode('edit');
    setFormCity(city);
    setFormOpen(true);
  };

  const handleFormSubmit = async (input: CreateCityInput | UpdateCityInput) => {
    setIsSavingForm(true);
    setFormError(null);

    try {
      if (formMode === 'create') {
        const result = await apiRequest<CityDetailsResponse>('/api/admin/cities', session, {
          method: 'POST',
          body: JSON.stringify(input),
        });
        setFeedback({
          type: 'success',
          message: t('cities.success.created', { name: result.city.name }),
        });
      } else if (formCity) {
        const result = await apiRequest<CityDetailsResponse>(
          `/api/admin/cities/${formCity.id}`,
          session,
          { method: 'PATCH', body: JSON.stringify(input) }
        );
        patchCity(result.city);
        setFeedback({
          type: 'success',
          message: t('cities.success.updated', { name: result.city.name }),
        });
      }

      setFormOpen(false);
      void loadCities();
    } catch (error) {
      setFormError(
        error instanceof ApiError && error.status === 409
          ? t('cities.errors.duplicateName')
          : formMode === 'create'
            ? t('cities.errors.createFailed')
            : t('cities.errors.updateFailed')
      );
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleActivate = async (city: CityListItem) => {
    setPendingCityId(city.id);

    try {
      const result = await apiRequest<CityDetailsResponse>(
        `/api/admin/cities/${city.id}/status`,
        session,
        { method: 'PATCH', body: JSON.stringify({ active: true }) }
      );
      patchCity(result.city);
      setFeedback({
        type: 'success',
        message: t('cities.success.activated', { name: result.city.name }),
      });
    } catch {
      setFeedback({ type: 'error', message: t('cities.errors.statusUpdateFailed') });
    } finally {
      setPendingCityId(null);
    }
  };

  const handleRequestDeactivate = (city: CityListItem) => {
    setFormOpen(false);
    setDeactivateTarget(city);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) {
      return;
    }

    setIsConfirmLoading(true);
    setPendingCityId(deactivateTarget.id);

    try {
      const result = await apiRequest<CityDetailsResponse>(
        `/api/admin/cities/${deactivateTarget.id}/status`,
        session,
        { method: 'PATCH', body: JSON.stringify({ active: false }) }
      );
      patchCity(result.city);
      setFeedback({
        type: 'success',
        message: t('cities.success.deactivated', { name: result.city.name }),
      });
    } catch {
      setFeedback({ type: 'error', message: t('cities.errors.statusUpdateFailed') });
    } finally {
      setIsConfirmLoading(false);
      setPendingCityId(null);
      setDeactivateTarget(null);
    }
  };

  const handleFormStatusChange = (city: CityDetails, nextActive: boolean) => {
    setFormOpen(false);

    if (nextActive) {
      void handleActivate(city);
    } else {
      setDeactivateTarget(city);
    }
  };

  const deactivateCopy = useMemo(() => {
    if (!deactivateTarget) {
      return null;
    }

    return {
      title: t('cities.confirm.deactivateTitle'),
      description: t('cities.confirm.deactivateDescription', { name: deactivateTarget.name }),
      confirmLabel: t('cities.actions.deactivate'),
    };
  }, [deactivateTarget, t]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('cities.title')}
        description={
          pagination.total > 0
            ? t('cities.totalCount', { count: pagination.total })
            : t('cities.description')
        }
        actions={
          <Button onClick={handleCreateRequest} disabled={!countries.length}>
            <Plus />
            {t('cities.actions.create')}
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

      <CitiesFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        countryId={countryId}
        onCountryIdChange={(value) => {
          setCountryId(value);
          setPage(1);
        }}
        countries={countries}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
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
              ? t('cities.errors.forbidden')
              : t('cities.errors.loadFailed')}
          </p>
          <Button variant="outline" size="sm" onClick={() => void loadCities()}>
            {t('common.refresh')}
          </Button>
        </div>
      ) : (
        <>
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <CitiesTable
              cities={cities}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              hasActiveFilters={hasActiveFilters}
              pendingCityId={pendingCityId}
              onEdit={handleEditRequest}
              onActivate={(city) => void handleActivate(city)}
              onRequestDeactivate={handleRequestDeactivate}
            />
          </div>

          {pagination.total > 0 ? (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                {t('cities.pagination.rangeInfo', {
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
                  {t('cities.pagination.previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('cities.pagination.pageInfo', {
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
                  {t('cities.pagination.next')}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <CityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        city={formCity}
        countries={countries}
        isSubmitting={isSavingForm}
        errorMessage={formError}
        onSubmit={(input) => void handleFormSubmit(input)}
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

export default CitiesPage;
