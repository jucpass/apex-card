import { MoreHorizontal, Pencil, Power, PowerOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CityListItem } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type CityRowActionsProps = {
  city: CityListItem;
  disabled?: boolean;
  onEdit: (city: CityListItem) => void;
  onActivate: (city: CityListItem) => void;
  onRequestDeactivate: (city: CityListItem) => void;
};

function CityRowActions({
  city,
  disabled,
  onEdit,
  onActivate,
  onRequestDeactivate,
}: CityRowActionsProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={t('cities.actions.openMenu', { name: city.name })}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(city)}>
          <Pencil />
          <span>{t('cities.actions.edit')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {city.active ? (
          <DropdownMenuItem variant="destructive" onClick={() => onRequestDeactivate(city)}>
            <PowerOff />
            <span>{t('cities.actions.deactivate')}</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onActivate(city)}>
            <Power />
            <span>{t('cities.actions.activate')}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CityRowActions;
