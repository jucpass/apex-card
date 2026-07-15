import {
  Eye,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MemberListItem } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  canGrantMembership,
  canResetMembership,
  canRevokeMembership,
} from '@/lib/memberFormatting';

type MemberRowActionsProps = {
  member: MemberListItem;
  disabled?: boolean;
  onView: (member: MemberListItem) => void;
  onEdit: (member: MemberListItem) => void;
  onSuspend: (member: MemberListItem) => void;
  onReactivate: (member: MemberListItem) => void;
  onGrantMembership: (member: MemberListItem) => void;
  onRevokeMembership: (member: MemberListItem) => void;
  onResetMembership: (member: MemberListItem) => void;
};

function MemberRowActions({
  member,
  disabled,
  onView,
  onEdit,
  onSuspend,
  onReactivate,
  onGrantMembership,
  onRevokeMembership,
  onResetMembership,
}: MemberRowActionsProps) {
  const { t } = useTranslation();
  const isDeleted = member.status === 'DELETED';
  const canGrant = canGrantMembership(member.membershipType, member.membershipStatus);
  const canRevoke = canRevokeMembership(member.membershipType, member.membershipStatus);
  const canReset = canResetMembership(member.membershipType);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={t('members.actions.openMenu', { name: member.fullName })}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onView(member)}>
          <Eye />
          <span>{t('members.actions.view')}</span>
        </DropdownMenuItem>

        {!isDeleted && (
          <DropdownMenuItem onClick={() => onEdit(member)}>
            <Pencil />
            <span>{t('members.actions.edit')}</span>
          </DropdownMenuItem>
        )}

        {!isDeleted && (member.status === 'ACTIVE' || member.status === 'SUSPENDED') && (
          <>
            <DropdownMenuSeparator />
            {member.status === 'ACTIVE' ? (
              <DropdownMenuItem variant="destructive" onClick={() => onSuspend(member)}>
                <UserX />
                <span>{t('members.actions.suspend')}</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onReactivate(member)}>
                <UserCheck />
                <span>{t('members.actions.reactivate')}</span>
              </DropdownMenuItem>
            )}
          </>
        )}

        {!isDeleted && (canGrant || canRevoke || canReset) && (
          <>
            <DropdownMenuSeparator />
            {canGrant && (
              <DropdownMenuItem onClick={() => onGrantMembership(member)}>
                <ShieldCheck />
                <span>{t('members.actions.grantMembership')}</span>
              </DropdownMenuItem>
            )}
            {canRevoke && (
              <DropdownMenuItem variant="destructive" onClick={() => onRevokeMembership(member)}>
                <ShieldOff />
                <span>{t('members.actions.revokeMembership')}</span>
              </DropdownMenuItem>
            )}
            {canReset && (
              <DropdownMenuItem variant="destructive" onClick={() => onResetMembership(member)}>
                <RotateCcw />
                <span>{t('members.actions.resetMembership')}</span>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default MemberRowActions;
