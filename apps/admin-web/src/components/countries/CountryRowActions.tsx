import { MoreHorizontal, Pencil, Power, PowerOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CountryListItem } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type CountryRowActionsProps = {
  country: CountryListItem;
  disabled?: boolean;
  onEdit: (country: CountryListItem) => void;
  onActivate: (country: CountryListItem) => void;
  onRequestDeactivate: (country: CountryListItem) => void;
};

function CountryRowActions({
  country,
  disabled,
  onEdit,
  onActivate,
  onRequestDeactivate,
}: CountryRowActionsProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={t('countries.actions.openMenu', { name: country.name })}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(country)}>
          <Pencil />
          <span>{t('countries.actions.edit')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {country.active ? (
          <DropdownMenuItem variant="destructive" onClick={() => onRequestDeactivate(country)}>
            <PowerOff />
            <span>{t('countries.actions.deactivate')}</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onActivate(country)}>
            <Power />
            <span>{t('countries.actions.activate')}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CountryRowActions;
