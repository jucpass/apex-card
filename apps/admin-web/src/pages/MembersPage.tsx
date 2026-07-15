import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type {
  CountriesResponse,
  CountryDto,
  GrantableMembershipType,
  MemberDetails,
  MemberDetailsResponse,
  MemberListItem,
  MemberListResponse,
  MemberSortField,
  MembershipPlanInput,
  MembershipStatus,
  PaginationMeta,
  SortOrder,
  SupportedLanguage,
  UserStatus,
} from '@apex-card/shared';

import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import MemberConfirmDialog from '@/components/members/MemberConfirmDialog';
import MemberDetailsSheet from '@/components/members/MemberDetailsSheet';
import MemberEditDialog, {
  type MemberEditSubmitPayload,
} from '@/components/members/MemberEditDialog';
import MemberGrantMembershipDialog from '@/components/members/MemberGrantMembershipDialog';
import MembersFilters, { ALL_VALUE } from '@/components/members/MembersFilters';
import MembersTable from '@/components/members/MembersTable';
import { ApiError, apiRequest } from '@/lib/apiClient';

type MembersPageProps = {
  session: Session;
};

type ConfirmActionType = 'suspend' | 'reactivate' | 'revoke' | 'reset';

type ConfirmState = {
  type: ConfirmActionType;
  member: MemberListItem;
};

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
};

const PAGE_SIZE = 20;

const EMPTY_PAGINATION: PaginationMeta = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };

const confirmActionSuccessKey: Record<ConfirmActionType, string> = {
  suspend: 'members.success.suspended',
  reactivate: 'members.success.reactivated',
  revoke: 'members.success.membershipRevoked',
  reset: 'members.success.membershipReset',
};

const confirmActionErrorKey: Record<ConfirmActionType, string> = {
  suspend: 'members.errors.statusUpdateFailed',
  reactivate: 'members.errors.statusUpdateFailed',
  revoke: 'members.errors.membershipUpdateFailed',
  reset: 'members.errors.membershipUpdateFailed',
};

const membershipActionEndpoint: Partial<Record<ConfirmActionType, string>> = {
  revoke: 'revoke',
  reset: 'reset',
};

function MembersPage({ session }: MembersPageProps) {
  const { t } = useTranslation();

  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [loadError, setLoadError] = useState<'forbidden' | 'generic' | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | typeof ALL_VALUE>(ALL_VALUE);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | typeof ALL_VALUE>(
    ALL_VALUE
  );
  const [language, setLanguage] = useState<SupportedLanguage | typeof ALL_VALUE>(ALL_VALUE);
  const [sortBy, setSortBy] = useState<MemberSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);

  const [countries, setCountries] = useState<CountryDto[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const [selectedMember, setSelectedMember] = useState<MemberDetails | null>(null);
  const [selectedMemberLoading, setSelectedMemberLoading] = useState(false);
  const [selectedMemberError, setSelectedMemberError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);

  const [grantMember, setGrantMember] = useState<MemberListItem | null>(null);
  const [isGranting, setIsGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);

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
    membershipStatus !== ALL_VALUE ||
    language !== ALL_VALUE;

  const loadMembers = useCallback(async () => {
    setIsFetching(true);

    try {
      const params = new URLSearchParams();

      if (search) params.set('search', search);
      if (status !== ALL_VALUE) params.set('status', status);
      if (membershipStatus !== ALL_VALUE) params.set('membershipStatus', membershipStatus);
      if (language !== ALL_VALUE) params.set('language', language);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));

      const result = await apiRequest<MemberListResponse>(
        `/api/admin/members?${params.toString()}`,
        session
      );

      setMembers(result.members);
      setPagination(result.pagination);
      setLoadError(null);
    } catch (error) {
      setMembers([]);
      setPagination(EMPTY_PAGINATION);
      setLoadError(error instanceof ApiError && error.status === 403 ? 'forbidden' : 'generic');
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [session, search, status, membershipStatus, language, sortBy, sortOrder, page]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    void apiRequest<CountriesResponse>('/api/admin/countries/options', session)
      .then((result) => setCountries(result.countries))
      .catch(() => setCountries([]));
  }, [session]);

  const handleSortChange = (field: MemberSortField) => {
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
    setMembershipStatus(ALL_VALUE);
    setLanguage(ALL_VALUE);
    setPage(1);
  };

  const patchMember = (updated: MemberDetails) => {
    setMembers((prev) => prev.map((member) => (member.id === updated.id ? updated : member)));
    setSelectedMember((prev) => (prev && prev.id === updated.id ? updated : prev));
  };

  const loadMemberDetails = async (id: string) => {
    setSelectedMember(null);
    setSelectedMemberError(null);
    setSelectedMemberLoading(true);

    try {
      const result = await apiRequest<MemberDetailsResponse>(`/api/admin/members/${id}`, session);
      setSelectedMember(result.member);
    } catch {
      setSelectedMemberError(t('members.errors.loadMemberFailed'));
    } finally {
      setSelectedMemberLoading(false);
    }
  };

  const handleView = (member: MemberListItem) => {
    setSheetOpen(true);
    void loadMemberDetails(member.id);
  };

  const handleEditRequest = (member: MemberListItem | MemberDetails) => {
    setEditError(null);
    setSheetOpen(false);
    setEditOpen(true);

    if ('phone' in member) {
      setSelectedMember(member);
    } else {
      void loadMemberDetails(member.id);
    }
  };

  const handleEditSubmit = async (payload: MemberEditSubmitPayload) => {
    if (!selectedMember) {
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    try {
      let latest = selectedMember;

      if (payload.profile) {
        const result = await apiRequest<MemberDetailsResponse>(
          `/api/admin/members/${latest.id}`,
          session,
          { method: 'PATCH', body: JSON.stringify(payload.profile) }
        );
        latest = result.member;
      }

      if (payload.membership) {
        const result = await apiRequest<MemberDetailsResponse>(
          `/api/admin/members/${latest.id}/membership`,
          session,
          { method: 'PATCH', body: JSON.stringify(payload.membership) }
        );
        latest = result.member;
      }

      patchMember(latest);
      setEditOpen(false);
      setFeedback({ type: 'success', message: t('members.success.updated') });
    } catch (error) {
      setEditError(
        error instanceof ApiError && error.status === 409
          ? t('members.errors.phoneConflict')
          : t('members.errors.updateFailed')
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const requestConfirm = (type: ConfirmActionType, member: MemberListItem) => {
    setConfirmState({ type, member });
  };

  const handleConfirm = async () => {
    if (!confirmState) {
      return;
    }

    const { type, member } = confirmState;
    setIsConfirmLoading(true);
    setPendingMemberId(member.id);

    try {
      const membershipEndpoint = membershipActionEndpoint[type];
      const result =
        type === 'suspend' || type === 'reactivate'
          ? await apiRequest<MemberDetailsResponse>(
              `/api/admin/members/${member.id}/status`,
              session,
              {
                method: 'PATCH',
                body: JSON.stringify({ status: type === 'suspend' ? 'SUSPENDED' : 'ACTIVE' }),
              }
            )
          : await apiRequest<MemberDetailsResponse>(
              `/api/admin/members/${member.id}/membership/${membershipEndpoint}`,
              session,
              { method: 'POST' }
            );

      patchMember(result.member);
      setFeedback({
        type: 'success',
        message: t(confirmActionSuccessKey[type], { name: member.fullName }),
      });
      setSheetOpen(false);
    } catch {
      setFeedback({ type: 'error', message: t(confirmActionErrorKey[type]) });
    } finally {
      setIsConfirmLoading(false);
      setPendingMemberId(null);
      setConfirmState(null);
    }
  };

  const confirmCopy = useMemo(() => {
    if (!confirmState) {
      return null;
    }

    const { type, member } = confirmState;

    const map: Record<
      ConfirmActionType,
      { title: string; description: string; confirmLabel: string; destructive: boolean }
    > = {
      suspend: {
        title: t('members.confirm.suspendTitle'),
        description: t('members.confirm.suspendDescription', { name: member.fullName }),
        confirmLabel: t('members.actions.suspend'),
        destructive: true,
      },
      reactivate: {
        title: t('members.confirm.reactivateTitle'),
        description: t('members.confirm.reactivateDescription', { name: member.fullName }),
        confirmLabel: t('members.actions.reactivate'),
        destructive: false,
      },
      revoke: {
        title: t('members.confirm.revokeTitle'),
        description: t('members.confirm.revokeDescription', { name: member.fullName }),
        confirmLabel: t('members.actions.revokeMembership'),
        destructive: true,
      },
      reset: {
        title: t('members.confirm.resetTitle'),
        description: t('members.confirm.resetDescription', { name: member.fullName }),
        confirmLabel: t('members.actions.resetMembership'),
        destructive: true,
      },
    };

    return map[type];
  }, [confirmState, t]);

  const handleGrantRequest = (member: MemberListItem) => {
    setGrantError(null);
    setGrantMember(member);
  };

  const handleGrantConfirm = async (input: MembershipPlanInput) => {
    if (!grantMember) {
      return;
    }

    setIsGranting(true);
    setGrantError(null);
    setPendingMemberId(grantMember.id);

    try {
      const result = await apiRequest<MemberDetailsResponse>(
        `/api/admin/members/${grantMember.id}/membership/grant`,
        session,
        { method: 'POST', body: JSON.stringify(input) }
      );
      patchMember(result.member);
      setFeedback({
        type: 'success',
        message: t('members.success.membershipGranted', { name: grantMember.fullName }),
      });
      setGrantMember(null);
      setSheetOpen(false);
    } catch {
      setGrantError(t('members.errors.membershipUpdateFailed'));
    } finally {
      setIsGranting(false);
      setPendingMemberId(null);
    }
  };

  const handleResetRequest = (member: MemberListItem) => {
    setEditOpen(false);
    requestConfirm('reset', member);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('members.title')}
        description={
          pagination.total > 0
            ? t('members.totalCount', { count: pagination.total })
            : t('members.description')
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

      <MembersFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        membershipStatus={membershipStatus}
        onMembershipStatusChange={(value) => {
          setMembershipStatus(value);
          setPage(1);
        }}
        language={language}
        onLanguageChange={(value) => {
          setLanguage(value);
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
              ? t('members.errors.forbidden')
              : t('members.errors.loadFailed')}
          </p>
          <Button variant="outline" size="sm" onClick={() => void loadMembers()}>
            {t('common.refresh')}
          </Button>
        </div>
      ) : (
        <>
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <MembersTable
              members={members}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              hasActiveFilters={hasActiveFilters}
              pendingMemberId={pendingMemberId}
              onView={handleView}
              onEdit={handleEditRequest}
              onSuspend={(member) => requestConfirm('suspend', member)}
              onReactivate={(member) => requestConfirm('reactivate', member)}
              onGrantMembership={handleGrantRequest}
              onRevokeMembership={(member) => requestConfirm('revoke', member)}
              onResetMembership={handleResetRequest}
            />
          </div>

          {pagination.total > 0 ? (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                {t('members.pagination.rangeInfo', {
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
                  {t('members.pagination.previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('members.pagination.pageInfo', {
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
                  {t('members.pagination.next')}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <MemberDetailsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        member={selectedMember}
        isLoading={selectedMemberLoading}
        errorMessage={selectedMemberError}
        onEdit={handleEditRequest}
        onSuspend={(member) => requestConfirm('suspend', member)}
        onReactivate={(member) => requestConfirm('reactivate', member)}
        onGrantMembership={handleGrantRequest}
        onRevokeMembership={(member) => requestConfirm('revoke', member)}
        onResetMembership={handleResetRequest}
      />

      <MemberEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={selectedMember}
        isLoading={selectedMemberLoading}
        countries={countries}
        isSubmitting={isSavingEdit}
        errorMessage={editError}
        onSubmit={(payload) => void handleEditSubmit(payload)}
        onRequestReset={handleResetRequest}
      />

      <MemberGrantMembershipDialog
        open={Boolean(grantMember)}
        onOpenChange={(open) => {
          if (!open) {
            setGrantMember(null);
          }
        }}
        memberName={grantMember?.fullName ?? ''}
        defaultType={
          grantMember && grantMember.membershipType !== 'FREE'
            ? (grantMember.membershipType as GrantableMembershipType)
            : 'PREMIUM'
        }
        isSubmitting={isGranting}
        errorMessage={grantError}
        onConfirm={(input) => void handleGrantConfirm(input)}
      />

      {confirmCopy ? (
        <MemberConfirmDialog
          open={Boolean(confirmState)}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmState(null);
            }
          }}
          title={confirmCopy.title}
          description={confirmCopy.description}
          confirmLabel={confirmCopy.confirmLabel}
          destructive={confirmCopy.destructive}
          loading={isConfirmLoading}
          onConfirm={() => void handleConfirm()}
        />
      ) : null}
    </div>
  );
}

export default MembersPage;
