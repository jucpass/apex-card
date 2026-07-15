import {
  AlertTriangle,
  Pencil,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MemberDetails } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/common/StatusBadge';
import {
  canGrantMembership,
  canResetMembership,
  canRevokeMembership,
  formatMemberDate,
  memberLanguageLabelKey,
  memberStatusLabelKey,
  memberStatusTone,
  membershipStatusLabelKey,
  membershipStatusTextClass,
  membershipTypeLabelKey,
  membershipTypeTone,
} from '@/lib/memberFormatting';

type MemberDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberDetails | null;
  isLoading: boolean;
  errorMessage: string | null;
  onEdit: (member: MemberDetails) => void;
  onSuspend: (member: MemberDetails) => void;
  onReactivate: (member: MemberDetails) => void;
  onGrantMembership: (member: MemberDetails) => void;
  onRevokeMembership: (member: MemberDetails) => void;
  onResetMembership: (member: MemberDetails) => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function MemberDetailsSheet({
  open,
  onOpenChange,
  member,
  isLoading,
  errorMessage,
  onEdit,
  onSuspend,
  onReactivate,
  onGrantMembership,
  onRevokeMembership,
  onResetMembership,
}: MemberDetailsSheetProps) {
  const { t, i18n } = useTranslation();
  const isDeleted = member?.status === 'DELETED';
  const isFree = member?.membershipType === 'FREE';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{member?.fullName ?? t('members.details.title')}</SheetTitle>
          <SheetDescription>{member?.email ?? ''}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : errorMessage ? (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : member ? (
            <>
              <section className="flex flex-col gap-3">
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  {t('members.details.personalInfo')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <DetailRow label={t('members.details.fullName')} value={member.fullName} />
                  <DetailRow label={t('members.details.email')} value={member.email} />
                  <DetailRow
                    label={t('members.details.phone')}
                    value={member.phone || t('members.details.notProvided')}
                  />
                  <DetailRow
                    label={t('members.details.language')}
                    value={t(memberLanguageLabelKey[member.language])}
                  />
                  <DetailRow
                    label={t('members.details.dateOfBirth')}
                    value={
                      member.dateOfBirth
                        ? formatMemberDate(member.dateOfBirth, i18n.language)
                        : t('members.details.notProvided')
                    }
                  />
                  <DetailRow
                    label={t('members.details.homeCountry')}
                    value={member.homeCountryName || t('members.details.notProvided')}
                  />
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  {t('members.details.accountStatus')}
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge
                    tone={memberStatusTone[member.status]}
                    label={t(memberStatusLabelKey[member.status])}
                  />
                  <DetailRow
                    label={t('members.details.registeredAt')}
                    value={formatMemberDate(member.createdAt, i18n.language)}
                  />
                  <DetailRow
                    label={t('members.details.updatedAt')}
                    value={formatMemberDate(member.updatedAt, i18n.language)}
                  />
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  {t('members.details.membershipDetails')}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    tone={membershipTypeTone[member.membershipType]}
                    label={t(membershipTypeLabelKey[member.membershipType])}
                  />
                  {member.membershipStatus ? (
                    <span
                      className={`text-xs font-medium ${membershipStatusTextClass[member.membershipStatus]}`}
                    >
                      {t(membershipStatusLabelKey[member.membershipStatus])}
                    </span>
                  ) : null}
                </div>

                {isFree ? (
                  <p className="text-sm text-muted-foreground">
                    {t('members.details.membershipFreeHint')}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <DetailRow
                      label={t('members.details.grantedManually')}
                      value={
                        member.membership?.isManuallyGranted ? t('common.yes') : t('common.no')
                      }
                    />
                    {member.membershipStatus === 'ACTIVE' ? (
                      <DetailRow
                        label={t('members.details.renewalExpiryDate')}
                        value={
                          member.membership?.expiresAt
                            ? formatMemberDate(member.membership.expiresAt, i18n.language)
                            : t('members.grant.durationUnlimited')
                        }
                      />
                    ) : null}
                    {member.membershipStatus === 'EXPIRED' && member.membership?.expiresAt ? (
                      <DetailRow
                        label={t('members.details.expiredOn')}
                        value={formatMemberDate(member.membership.expiresAt, i18n.language)}
                      />
                    ) : null}
                    {member.membershipStatus === 'CANCELLED' && member.membership?.cancelledAt ? (
                      <DetailRow
                        label={t('members.details.cancelledOn')}
                        value={formatMemberDate(member.membership.cancelledAt, i18n.language)}
                      />
                    ) : null}
                  </div>
                )}
              </section>

              {!isDeleted && (
                <section className="flex flex-col gap-3">
                  <h3 className="font-heading text-sm font-semibold text-foreground">
                    {t('members.details.adminActions')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(member)}>
                      <Pencil />
                      {t('members.actions.edit')}
                    </Button>
                    {member.status === 'ACTIVE' ? (
                      <Button variant="destructive" size="sm" onClick={() => onSuspend(member)}>
                        <UserX />
                        {t('members.actions.suspend')}
                      </Button>
                    ) : member.status === 'SUSPENDED' ? (
                      <Button variant="outline" size="sm" onClick={() => onReactivate(member)}>
                        <UserCheck />
                        {t('members.actions.reactivate')}
                      </Button>
                    ) : null}
                    {canGrantMembership(member.membershipType, member.membershipStatus) && (
                      <Button variant="outline" size="sm" onClick={() => onGrantMembership(member)}>
                        <ShieldCheck />
                        {t('members.actions.grantMembership')}
                      </Button>
                    )}
                    {canRevokeMembership(member.membershipType, member.membershipStatus) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRevokeMembership(member)}
                      >
                        <ShieldOff />
                        {t('members.actions.revokeMembership')}
                      </Button>
                    )}
                    {canResetMembership(member.membershipType) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onResetMembership(member)}
                      >
                        <RotateCcw />
                        {t('members.actions.resetMembership')}
                      </Button>
                    )}
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MemberDetailsSheet;
