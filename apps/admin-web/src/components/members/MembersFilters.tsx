import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MembershipStatus, SupportedLanguage, UserStatus } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  memberLanguageLabelKey,
  memberStatusLabelKey,
  membershipStatusLabelKey,
} from '@/lib/memberFormatting';

export const ALL_VALUE = 'all';

type MembersFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: UserStatus | typeof ALL_VALUE;
  onStatusChange: (value: UserStatus | typeof ALL_VALUE) => void;
  membershipStatus: MembershipStatus | typeof ALL_VALUE;
  onMembershipStatusChange: (value: MembershipStatus | typeof ALL_VALUE) => void;
  language: SupportedLanguage | typeof ALL_VALUE;
  onLanguageChange: (value: SupportedLanguage | typeof ALL_VALUE) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
};

const statusOptions: UserStatus[] = ['ACTIVE', 'SUSPENDED', 'DELETED'];
const membershipStatusOptions: MembershipStatus[] = ['ACTIVE', 'EXPIRED', 'CANCELLED'];
const languageOptions: SupportedLanguage[] = ['en', 'pt'];

function MembersFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  membershipStatus,
  onMembershipStatusChange,
  language,
  onLanguageChange,
  hasActiveFilters,
  onClear,
}: MembersFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('members.filters.searchPlaceholder')}
          aria-label={t('members.filters.searchPlaceholder')}
          className="pl-8"
        />
      </div>

      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as UserStatus | typeof ALL_VALUE)}
      >
        <SelectTrigger aria-label={t('members.filters.status')} className="w-full sm:w-auto">
          <SelectValue placeholder={t('members.filters.statusAll')}>
            {(value: UserStatus | typeof ALL_VALUE) =>
              value === ALL_VALUE ? t('members.filters.statusAll') : t(memberStatusLabelKey[value])
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('members.filters.statusAll')}</SelectItem>
          {statusOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(memberStatusLabelKey[option])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={membershipStatus}
        onValueChange={(value) =>
          onMembershipStatusChange(value as MembershipStatus | typeof ALL_VALUE)
        }
      >
        <SelectTrigger
          aria-label={t('members.filters.membershipStatus')}
          className="w-full sm:w-auto"
        >
          <SelectValue placeholder={t('members.filters.membershipStatusAll')}>
            {(value: MembershipStatus | typeof ALL_VALUE) =>
              value === ALL_VALUE
                ? t('members.filters.membershipStatusAll')
                : t(membershipStatusLabelKey[value])
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('members.filters.membershipStatusAll')}</SelectItem>
          {membershipStatusOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(membershipStatusLabelKey[option])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={language}
        onValueChange={(value) => onLanguageChange(value as SupportedLanguage | typeof ALL_VALUE)}
      >
        <SelectTrigger aria-label={t('members.filters.language')} className="w-full sm:w-auto">
          <SelectValue placeholder={t('members.filters.languageAll')}>
            {(value: SupportedLanguage | typeof ALL_VALUE) =>
              value === ALL_VALUE
                ? t('members.filters.languageAll')
                : t(memberLanguageLabelKey[value])
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('members.filters.languageAll')}</SelectItem>
          {languageOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(memberLanguageLabelKey[option])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="w-full sm:w-auto">
          <X />
          {t('members.filters.clear')}
        </Button>
      ) : null}
    </div>
  );
}

export default MembersFilters;
