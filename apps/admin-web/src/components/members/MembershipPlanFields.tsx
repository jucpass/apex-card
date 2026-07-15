import { useTranslation } from 'react-i18next';
import type { GrantableMembershipType } from '@apex-card/shared';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { membershipTypeLabelKey } from '@/lib/memberFormatting';

// Mirrors the shared `grantableMembershipTypes` list (packages/shared/src/constants/membership.ts).
// Declared locally, matching MembersFilters.tsx's existing pattern — see MemberEditDialog.tsx
// for why a real (non-type) value import from @apex-card/shared isn't used here.
const grantableMembershipTypeOptions: GrantableMembershipType[] = ['PREMIUM', 'STUDENT', 'WORKER'];

export type DurationKind = 'unlimited' | 'expiryDate';

type MembershipPlanFieldsProps = {
  idPrefix: string;
  membershipType: GrantableMembershipType;
  onMembershipTypeChange: (type: GrantableMembershipType) => void;
  durationKind: DurationKind;
  onDurationKindChange: (kind: DurationKind) => void;
  expiryDate: string;
  onExpiryDateChange: (value: string) => void;
  expiryDateError?: string | null;
};

function MembershipPlanFields({
  idPrefix,
  membershipType,
  onMembershipTypeChange,
  durationKind,
  onDurationKindChange,
  expiryDate,
  onExpiryDateChange,
  expiryDateError,
}: MembershipPlanFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-type`}>{t('members.grant.typeLabel')}</Label>
        <Select
          value={membershipType}
          onValueChange={(value) => onMembershipTypeChange(value as GrantableMembershipType)}
        >
          <SelectTrigger id={`${idPrefix}-type`} className="w-full">
            <SelectValue>
              {(value: GrantableMembershipType) => t(membershipTypeLabelKey[value])}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {grantableMembershipTypeOptions.map((type) => (
              <SelectItem key={type} value={type}>
                {t(membershipTypeLabelKey[type])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-duration`}>{t('members.grant.durationLabel')}</Label>
        <Select
          value={durationKind}
          onValueChange={(value) => onDurationKindChange(value as DurationKind)}
        >
          <SelectTrigger id={`${idPrefix}-duration`} className="w-full">
            <SelectValue>
              {(value: DurationKind) =>
                value === 'unlimited'
                  ? t('members.grant.durationUnlimited')
                  : t('members.grant.durationExpiryDate')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unlimited">{t('members.grant.durationUnlimited')}</SelectItem>
            <SelectItem value="expiryDate">{t('members.grant.durationExpiryDate')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {durationKind === 'expiryDate' ? (
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-expiry`}>{t('members.grant.expiryDateLabel')}</Label>
          <Input
            id={`${idPrefix}-expiry`}
            type="date"
            value={expiryDate}
            onChange={(event) => onExpiryDateChange(event.target.value)}
            aria-invalid={expiryDateError ? true : undefined}
            required
          />
          {expiryDateError ? <p className="text-xs text-destructive">{expiryDateError}</p> : null}
        </div>
      ) : null}
    </>
  );
}

export default MembershipPlanFields;
