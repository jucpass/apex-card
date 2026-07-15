import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Plus, X } from 'lucide-react';
import type {
  CategoryDetails,
  CategoryDetailsResponse,
  CategoryListItem,
  CategoryListResponse,
  CategorySortField,
  CategoryStatusFilter,
  CreateCategoryInput,
  PaginationMeta,
  SortOrder,
  UpdateCategoryInput,
} from '@apex-card/shared';

import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CategoriesFilters, { ALL_VALUE } from '@/components/categories/CategoriesFilters';
import CategoriesTable from '@/components/categories/CategoriesTable';
import CategoryFormDialog from '@/components/categories/CategoryFormDialog';
import MemberConfirmDialog from '@/components/members/MemberConfirmDialog';
import { ApiError, apiRequest } from '@/lib/apiClient';

type CategoriesPageProps = {
  session: Session;
};

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
};

const PAGE_SIZE = 20;

const EMPTY_PAGINATION: PaginationMeta = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };

function CategoriesPage({ session }: CategoriesPageProps) {
  const { t } = useTranslation();

  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [loadError, setLoadError] = useState<'forbidden' | 'generic' | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CategoryStatusFilter | typeof ALL_VALUE>(ALL_VALUE);
  const [sortBy, setSortBy] = useState<CategorySortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formCategory, setFormCategory] = useState<CategoryDetails | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<CategoryListItem | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(handle);
  }, [searchInput]);

  const hasActiveFilters = search.length > 0 || status !== ALL_VALUE;

  const loadCategories = useCallback(async () => {
    setIsFetching(true);

    try {
      const params = new URLSearchParams();

      if (search) params.set('search', search);
      if (status !== ALL_VALUE) params.set('status', status);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));

      const result = await apiRequest<CategoryListResponse>(
        `/api/admin/categories?${params.toString()}`,
        session
      );

      setCategories(result.categories);
      setPagination(result.pagination);
      setLoadError(null);
    } catch (error) {
      setCategories([]);
      setPagination(EMPTY_PAGINATION);
      setLoadError(error instanceof ApiError && error.status === 403 ? 'forbidden' : 'generic');
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [session, search, status, sortBy, sortOrder, page]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleSortChange = (field: CategorySortField) => {
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
    setPage(1);
  };

  const patchCategory = (updated: CategoryDetails) => {
    setCategories((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleCreateRequest = () => {
    setFormError(null);
    setFormMode('create');
    setFormCategory(null);
    setFormOpen(true);
  };

  const handleEditRequest = (category: CategoryListItem) => {
    setFormError(null);
    setFormMode('edit');
    setFormCategory(category);
    setFormOpen(true);
  };

  const handleFormSubmit = async (input: CreateCategoryInput | UpdateCategoryInput) => {
    setIsSavingForm(true);
    setFormError(null);

    try {
      if (formMode === 'create') {
        const result = await apiRequest<CategoryDetailsResponse>('/api/admin/categories', session, {
          method: 'POST',
          body: JSON.stringify(input),
        });
        setFeedback({
          type: 'success',
          message: t('categories.success.created', { name: result.category.name }),
        });
      } else if (formCategory) {
        const result = await apiRequest<CategoryDetailsResponse>(
          `/api/admin/categories/${formCategory.id}`,
          session,
          { method: 'PATCH', body: JSON.stringify(input) }
        );
        patchCategory(result.category);
        setFeedback({
          type: 'success',
          message: t('categories.success.updated', { name: result.category.name }),
        });
      }

      setFormOpen(false);
      void loadCategories();
    } catch (error) {
      setFormError(
        error instanceof ApiError && error.status === 409
          ? t('categories.errors.duplicateName')
          : formMode === 'create'
            ? t('categories.errors.createFailed')
            : t('categories.errors.updateFailed')
      );
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleActivate = async (category: CategoryListItem) => {
    setPendingCategoryId(category.id);

    try {
      const result = await apiRequest<CategoryDetailsResponse>(
        `/api/admin/categories/${category.id}/status`,
        session,
        { method: 'PATCH', body: JSON.stringify({ active: true }) }
      );
      patchCategory(result.category);
      setFeedback({
        type: 'success',
        message: t('categories.success.activated', { name: result.category.name }),
      });
    } catch {
      setFeedback({ type: 'error', message: t('categories.errors.statusUpdateFailed') });
    } finally {
      setPendingCategoryId(null);
    }
  };

  const handleRequestDeactivate = (category: CategoryListItem) => {
    setFormOpen(false);
    setDeactivateTarget(category);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) {
      return;
    }

    setIsConfirmLoading(true);
    setPendingCategoryId(deactivateTarget.id);

    try {
      const result = await apiRequest<CategoryDetailsResponse>(
        `/api/admin/categories/${deactivateTarget.id}/status`,
        session,
        { method: 'PATCH', body: JSON.stringify({ active: false }) }
      );
      patchCategory(result.category);
      setFeedback({
        type: 'success',
        message: t('categories.success.deactivated', { name: result.category.name }),
      });
    } catch {
      setFeedback({ type: 'error', message: t('categories.errors.statusUpdateFailed') });
    } finally {
      setIsConfirmLoading(false);
      setPendingCategoryId(null);
      setDeactivateTarget(null);
    }
  };

  const handleFormStatusChange = (category: CategoryDetails, nextActive: boolean) => {
    setFormOpen(false);

    if (nextActive) {
      void handleActivate(category);
    } else {
      setDeactivateTarget(category);
    }
  };

  const deactivateCopy = useMemo(() => {
    if (!deactivateTarget) {
      return null;
    }

    return {
      title: t('categories.confirm.deactivateTitle'),
      description: t('categories.confirm.deactivateDescription', { name: deactivateTarget.name }),
      confirmLabel: t('categories.actions.deactivate'),
    };
  }, [deactivateTarget, t]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('categories.title')}
        description={
          pagination.total > 0
            ? t('categories.totalCount', { count: pagination.total })
            : t('categories.description')
        }
        actions={
          <Button onClick={handleCreateRequest}>
            <Plus />
            {t('categories.actions.create')}
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

      <CategoriesFilters
        search={searchInput}
        onSearchChange={setSearchInput}
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
              ? t('categories.errors.forbidden')
              : t('categories.errors.loadFailed')}
          </p>
          <Button variant="outline" size="sm" onClick={() => void loadCategories()}>
            {t('common.refresh')}
          </Button>
        </div>
      ) : (
        <>
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <CategoriesTable
              categories={categories}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              hasActiveFilters={hasActiveFilters}
              pendingCategoryId={pendingCategoryId}
              onEdit={handleEditRequest}
              onActivate={(category) => void handleActivate(category)}
              onRequestDeactivate={handleRequestDeactivate}
            />
          </div>

          {pagination.total > 0 ? (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                {t('categories.pagination.rangeInfo', {
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
                  {t('categories.pagination.previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('categories.pagination.pageInfo', {
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
                  {t('categories.pagination.next')}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        category={formCategory}
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

export default CategoriesPage;
