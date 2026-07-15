import { Eye, MoreHorizontal, Pencil, Power, PowerOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PartnerListItem } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type PartnerRowActionsProps = {
  partner: PartnerListItem;
  disabled?: boolean;
  onView: (partner: PartnerListItem) => void;
  onEdit: (partner: PartnerListItem) => void;
  onRequestActivate: (partner: PartnerListItem) => void;
  onRequestDeactivate: (partner: PartnerListItem) => void;
};

function PartnerRowActions({
  partner,
  disabled,
  onView,
  onEdit,
  onRequestActivate,
  onRequestDeactivate,
}: PartnerRowActionsProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={t('partners.actions.openMenu', { name: partner.name })}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onView(partner)}>
          <Eye />
          <span>{t('partners.actions.view')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(partner)}>
          <Pencil />
          <span>{t('partners.actions.edit')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {partner.status === 'ACTIVE' ? (
          <DropdownMenuItem variant="destructive" onClick={() => onRequestDeactivate(partner)}>
            <PowerOff />
            <span>{t('partners.actions.deactivate')}</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onRequestActivate(partner)}>
            <Power />
            <span>{t('partners.actions.activate')}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PartnerRowActions;
