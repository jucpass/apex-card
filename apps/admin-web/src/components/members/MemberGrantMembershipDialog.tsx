import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GrantableMembershipType, MembershipPlanInput } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import MembershipPlanFields, { type DurationKind } from '@/components/members/MembershipPlanFields';

type MemberGrantMembershipDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  defaultType: GrantableMembershipType;
  isSubmitting: boolean;
  errorMessage: string | null;
  onConfirm: (input: MembershipPlanInput) => void;
};

function MemberGrantMembershipDialog({
  open,
  onOpenChange,
  memberName,
  defaultType,
  isSubmitting,
  errorMessage,
  onConfirm,
}: MemberGrantMembershipDialogProps) {
  const { t } = useTranslation();
  const [membershipType, setMembershipType] = useState<GrantableMembershipType>(defaultType);
  const [durationKind, setDurationKind] = useState<DurationKind>('unlimited');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryDateError, setExpiryDateError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMembershipType(defaultType);
      setDurationKind('unlimited');
      setExpiryDate('');
      setExpiryDateError(null);
    }
  }, [open, defaultType]);

  const handleConfirm = () => {
    if (durationKind === 'expiryDate' && !expiryDate) {
      setExpiryDateError(t('members.grant.expiryDateRequired'));
      return;
    }

    setExpiryDateError(null);
    onConfirm({
      membershipType,
      duration:
        durationKind === 'unlimited'
          ? { kind: 'unlimited' }
          : { kind: 'expiryDate', expiresAt: expiryDate },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('members.grant.title')}</DialogTitle>
          <DialogDescription>
            {t('members.grant.description', { name: memberName })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <MembershipPlanFields
            idPrefix="grant-membership"
            membershipType={membershipType}
            onMembershipTypeChange={setMembershipType}
            durationKind={durationKind}
            onDurationKindChange={setDurationKind}
            expiryDate={expiryDate}
            onExpiryDateChange={setExpiryDate}
            expiryDateError={expiryDateError}
          />
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={handleConfirm}>
            {isSubmitting ? t('members.actions.working') : t('members.grant.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MemberGrantMembershipDialog;
