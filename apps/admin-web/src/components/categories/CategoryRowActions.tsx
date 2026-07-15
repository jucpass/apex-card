import { MoreHorizontal, Pencil, Power, PowerOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CategoryListItem } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type CategoryRowActionsProps = {
  category: CategoryListItem;
  disabled?: boolean;
  onEdit: (category: CategoryListItem) => void;
  onActivate: (category: CategoryListItem) => void;
  onRequestDeactivate: (category: CategoryListItem) => void;
};

function CategoryRowActions({
  category,
  disabled,
  onEdit,
  onActivate,
  onRequestDeactivate,
}: CategoryRowActionsProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={t('categories.actions.openMenu', { name: category.name })}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(category)}>
          <Pencil />
          <span>{t('categories.actions.edit')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {category.active ? (
          <DropdownMenuItem variant="destructive" onClick={() => onRequestDeactivate(category)}>
            <PowerOff />
            <span>{t('categories.actions.deactivate')}</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onActivate(category)}>
            <Power />
            <span>{t('categories.actions.activate')}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CategoryRowActions;
