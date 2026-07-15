import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import type {
  CountryDto,
  GrantableMembershipType,
  MemberDetails,
  MembershipPlanInput,
  SupportedLanguage,
  UpdateMemberInput,
} from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import MembershipPlanFields, { type DurationKind } from '@/components/members/MembershipPlanFields';
import {
  memberLanguageLabelKey,
  membershipStatusLabelKey,
  membershipStatusTextClass,
} from '@/lib/memberFormatting';

const NO_COUNTRY_VALUE = '__none__';
const toDateInputValue = (iso: string) => iso.slice(0, 10);

export type MemberEditSubmitPayload = {
  profile: UpdateMemberInput | null;
  membership: MembershipPlanInput | null;
};

type MemberEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberDetails | null;
  isLoading: boolean;
  countries: CountryDto[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (payload: MemberEditSubmitPayload) => void;
  onRequestReset: (member: MemberDetails) => void;
};

function MemberEditDialog({
  open,
  onOpenChange,
  member,
  isLoading,
  countries,
  isSubmitting,
  errorMessage,
  onSubmit,
  onRequestReset,
}: MemberEditDialogProps) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [homeCountryId, setHomeCountryId] = useState(NO_COUNTRY_VALUE);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [membershipType, setMembershipType] = useState<GrantableMembershipType>('PREMIUM');
  const [durationKind, setDurationKind] = useState<DurationKind>('unlimited');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryDateError, setExpiryDateError] = useState<string | null>(null);

  useEffect(() => {
    if (member && open) {
      setFullName(member.fullName);
      setPhone(member.phone ?? '');
      setLanguage(member.language);
      setHomeCountryId(member.homeCountryId ?? NO_COUNTRY_VALUE);
      setFullNameError(null);

      setMembershipType(member.membershipType === 'FREE' ? 'PREMIUM' : member.membershipType);
      const currentExpiresAt = member.membership?.expiresAt ?? null;
      setDurationKind(currentExpiresAt ? 'expiryDate' : 'unlimited');
      setExpiryDate(currentExpiresAt ? toDateInputValue(currentExpiresAt) : '');
      setExpiryDateError(null);
    }
  }, [member, open]);

  const isFree = member?.membershipType === 'FREE';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!member) {
      return;
    }

    const trimmedName = fullName.trim();

    if (trimmedName.length < 2) {
      setFullNameError(t('members.edit.fullNameRequired'));
      return;
    }

    setFullNameError(null);

    if (!isFree && durationKind === 'expiryDate' && !expiryDate) {
      setExpiryDateError(t('members.grant.expiryDateRequired'));
      return;
    }

    setExpiryDateError(null);

    const trimmedPhone = phone.trim();
    const nextPhone = trimmedPhone.length > 0 ? trimmedPhone : null;
    const nextHomeCountryId = homeCountryId === NO_COUNTRY_VALUE ? null : homeCountryId;

    const profileChanged =
      trimmedName !== member.fullName ||
      nextPhone !== member.phone ||
      language !== member.language ||
      nextHomeCountryId !== member.homeCountryId;

    const currentExpiresAt = member.membership?.expiresAt ?? null;
    const currentDurationKind: DurationKind = currentExpiresAt ? 'expiryDate' : 'unlimited';
    const membershipChanged =
      !isFree &&
      (membershipType !== member.membershipType ||
        durationKind !== currentDurationKind ||
        (durationKind === 'expiryDate' &&
          expiryDate !== (currentExpiresAt ? toDateInputValue(currentExpiresAt) : '')));

    const profile = profileChanged
      ? {
          fullName: trimmedName,
          phone: nextPhone,
          language,
          homeCountryId: nextHomeCountryId,
        }
      : null;

    const membership = membershipChanged
      ? {
          membershipType,
          duration:
            durationKind === 'unlimited'
              ? ({ kind: 'unlimited' } as const)
              : ({ kind: 'expiryDate', expiresAt: expiryDate } as const),
        }
      : null;

    if (!profile && !membership) {
      onOpenChange(false);
      return;
    }

    onSubmit({ profile, membership });
  };

  const isReady = !isLoading && member !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('members.edit.title')}</DialogTitle>
          <DialogDescription>{t('members.edit.description')}</DialogDescription>
        </DialogHeader>

        {!isReady ? (
          <div className="flex flex-col gap-4 py-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="member-edit-fullname">{t('members.edit.fullNameLabel')}</Label>
                <Input
                  id="member-edit-fullname"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  aria-invalid={fullNameError ? true : undefined}
                  required
                />
                {fullNameError ? <p className="text-xs text-destructive">{fullNameError}</p> : null}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="member-edit-phone">{t('members.edit.phoneLabel')}</Label>
                <Input
                  id="member-edit-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder={t('members.edit.phonePlaceholder')}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="member-edit-language">{t('members.edit.languageLabel')}</Label>
                <Select
                  value={language}
                  onValueChange={(value) => setLanguage(value as SupportedLanguage)}
                >
                  <SelectTrigger id="member-edit-language" className="w-full">
                    <SelectValue>
                      {(value: SupportedLanguage) => t(memberLanguageLabelKey[value])}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('settings.languageEnglish')}</SelectItem>
                    <SelectItem value="pt">{t('settings.languagePortuguese')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="member-edit-country">{t('members.edit.homeCountryLabel')}</Label>
                <Select
                  value={homeCountryId}
                  onValueChange={(value) => setHomeCountryId(value ?? NO_COUNTRY_VALUE)}
                >
                  <SelectTrigger id="member-edit-country" className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        value === NO_COUNTRY_VALUE
                          ? t('members.edit.homeCountryPlaceholder')
                          : (countries.find((country) => country.id === value)?.name ??
                            t('members.edit.homeCountryPlaceholder'))
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_COUNTRY_VALUE}>
                      {t('members.edit.homeCountryPlaceholder')}
                    </SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <Label>{t('members.edit.membershipSectionTitle')}</Label>

                {isFree ? (
                  <p className="text-xs text-muted-foreground">
                    {t('members.edit.membershipFreeHint')}
                  </p>
                ) : (
                  <>
                    {member.membershipStatus ? (
                      <p className="text-xs text-muted-foreground">
                        {t('members.edit.currentStatusPrefix')}{' '}
                        <span className={membershipStatusTextClass[member.membershipStatus]}>
                          {t(membershipStatusLabelKey[member.membershipStatus])}
                        </span>
                      </p>
                    ) : null}

                    <MembershipPlanFields
                      idPrefix="member-edit-membership"
                      membershipType={membershipType}
                      onMembershipTypeChange={setMembershipType}
                      durationKind={durationKind}
                      onDurationKindChange={setDurationKind}
                      expiryDate={expiryDate}
                      onExpiryDateChange={setExpiryDate}
                      expiryDateError={expiryDateError}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      disabled={isSubmitting}
                      onClick={() => onRequestReset(member)}
                    >
                      <RotateCcw />
                      {t('members.actions.resetMembership')}
                    </Button>
                  </>
                )}
              </div>

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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('members.edit.saving') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MemberEditDialog;
