import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MemberListItem, MemberSortField, SortOrder } from '@apex-card/shared';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  formatMemberDate,
  initialsFromName,
  memberLanguageLabelKey,
  memberStatusLabelKey,
  memberStatusTone,
  membershipStatusLabelKey,
  membershipStatusTextClass,
  membershipTypeLabelKey,
  membershipTypeTone,
} from '@/lib/memberFormatting';
import MemberRowActions from '@/components/members/MemberRowActions';

type SortableField = Extract<MemberSortField, 'fullName' | 'createdAt' | 'status'>;

type MembersTableProps = {
  members: MemberListItem[];
  sortBy: MemberSortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortableField) => void;
  hasActiveFilters: boolean;
  pendingMemberId: string | null;
  onView: (member: MemberListItem) => void;
  onEdit: (member: MemberListItem) => void;
  onSuspend: (member: MemberListItem) => void;
  onReactivate: (member: MemberListItem) => void;
  onGrantMembership: (member: MemberListItem) => void;
  onRevokeMembership: (member: MemberListItem) => void;
  onResetMembership: (member: MemberListItem) => void;
};

function SortableHeader({
  field,
  label,
  sortBy,
  sortOrder,
  onSortChange,
  className,
}: {
  field: SortableField;
  label: string;
  sortBy: MemberSortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortableField) => void;
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

function MembersTable({
  members,
  sortBy,
  sortOrder,
  onSortChange,
  hasActiveFilters,
  pendingMemberId,
  onView,
  onEdit,
  onSuspend,
  onReactivate,
  onGrantMembership,
  onRevokeMembership,
  onResetMembership,
}: MembersTableProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader
              field="fullName"
              label={t('members.table.member')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
            />
            <SortableHeader
              field="status"
              label={t('members.table.status')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
            />
            <TableHead>{t('members.table.membershipStatus')}</TableHead>
            <TableHead className="hidden lg:table-cell">{t('members.table.language')}</TableHead>
            <SortableHeader
              field="createdAt"
              label={t('members.table.registered')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
              className="hidden md:table-cell"
            />
            <TableHead className="w-10 text-right">
              <span className="sr-only">{t('members.table.actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center whitespace-normal">
                <p className="text-sm font-medium text-foreground">
                  {hasActiveFilters ? t('members.empty.noResults') : t('members.empty.noMembers')}
                </p>
                {hasActiveFilters ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('members.empty.noResultsHint')}
                  </p>
                ) : null}
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-2.5">
                    <Avatar>
                      <AvatarFallback>{initialsFromName(member.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {member.fullName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    tone={memberStatusTone[member.status]}
                    label={t(memberStatusLabelKey[member.status])}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-0.5">
                    <StatusBadge
                      tone={membershipTypeTone[member.membershipType]}
                      label={t(membershipTypeLabelKey[member.membershipType])}
                    />
                    {member.membershipGrantedManually || member.membershipStatus ? (
                      <p className="text-xs text-muted-foreground">
                        {member.membershipGrantedManually ? (
                          <span>{t('members.membershipType.grantedIndicator')}</span>
                        ) : null}
                        {member.membershipGrantedManually && member.membershipStatus ? (
                          <span> · </span>
                        ) : null}
                        {member.membershipStatus ? (
                          <span className={membershipStatusTextClass[member.membershipStatus]}>
                            {t(membershipStatusLabelKey[member.membershipStatus])}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {t(memberLanguageLabelKey[member.language])}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatMemberDate(member.createdAt, i18n.language)}
                </TableCell>
                <TableCell className="text-right">
                  <MemberRowActions
                    member={member}
                    disabled={pendingMemberId === member.id}
                    onView={onView}
                    onEdit={onEdit}
                    onSuspend={onSuspend}
                    onReactivate={onReactivate}
                    onGrantMembership={onGrantMembership}
                    onRevokeMembership={onRevokeMembership}
                    onResetMembership={onResetMembership}
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

export default MembersTable;
