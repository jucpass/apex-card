import { Check, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { setAppLanguage, supportedLanguages, type SupportedLanguage } from '@/i18n';

const languageLabelKeys: Record<SupportedLanguage, string> = {
  en: 'settings.languageEnglish',
  pt: 'settings.languagePortuguese',
};

function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as SupportedLanguage;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages />
        <span>{t('settings.language')}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('settings.language')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {supportedLanguages.map((language) => (
            <DropdownMenuItem key={language} onClick={() => void setAppLanguage(language)}>
              <span className="flex-1">{t(languageLabelKeys[language])}</span>
              {currentLanguage === language ? <Check className="size-3.5" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export default LanguageSelector;
