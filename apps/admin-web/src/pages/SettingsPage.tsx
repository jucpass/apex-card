import { KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Session } from '@supabase/supabase-js';

import PageHeader from '@/components/common/PageHeader';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { initialsFromEmail } from '@/components/admin-layout/UserMenu';
import { setAppLanguage, supportedLanguages, type SupportedLanguage } from '@/i18n';
import { formatMemberDate } from '@/lib/memberFormatting';

type SettingsPageProps = {
  session: Session;
};

const languageLabelKeys: Record<SupportedLanguage, string> = {
  en: 'settings.languageEnglish',
  pt: 'settings.languagePortuguese',
};

function SettingsPage({ session }: SettingsPageProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as SupportedLanguage;

  const email = session.user.email ?? '';
  const metadata = session.user.user_metadata as { full_name?: string; name?: string } | undefined;
  const fullName =
    metadata?.full_name ||
    metadata?.name ||
    (email ? email.split('@')[0] : t('settings.profile.notProvided'));
  const memberSince = session.user.created_at
    ? formatMemberDate(session.user.created_at, i18n.language)
    : t('settings.profile.notProvided');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('settings.title')} description={t('settings.description')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.profile.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar size="lg">
            <AvatarFallback>{initialsFromEmail(email)}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">
                {t('settings.profile.fullName')}
              </span>
              <span className="text-sm font-medium text-foreground">{fullName}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{t('settings.profile.email')}</span>
              <span className="truncate text-sm font-medium text-foreground">{email}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">
                {t('settings.profile.memberSince')}
              </span>
              <span className="text-sm font-medium text-foreground">{memberSince}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.language')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t('settings.languageDescription')}</p>
          <Select
            value={currentLanguage}
            onValueChange={(value) => void setAppLanguage(value as SupportedLanguage)}
          >
            <SelectTrigger className="w-full sm:w-64" aria-label={t('settings.language')}>
              <SelectValue>{(value: SupportedLanguage) => t(languageLabelKeys[value])}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((language) => (
                <SelectItem key={language} value={language}>
                  {t(languageLabelKeys[language])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.security.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled title={t('userMenu.changePasswordUnavailable')}>
            <KeyRound />
            {t('userMenu.changePassword')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
