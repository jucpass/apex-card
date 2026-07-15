import { KeyRound, LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LanguageSelector from '@/components/admin-layout/LanguageSelector';

type UserMenuProps = {
  adminEmail: string;
  onSignOut: () => void;
};

export function initialsFromEmail(email: string): string {
  const [localPart] = email.split('@');
  return (localPart || email).slice(0, 2).toUpperCase();
}

function UserMenu({ adminEmail, onSignOut }: UserMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarFallback>{initialsFromEmail(adminEmail)}</AvatarFallback>
            </Avatar>
            <span className="sr-only">{t('userMenu.openMenu')}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium text-foreground">{t('userMenu.signedInAs')}</p>
            <p className="truncate text-xs text-muted-foreground">{adminEmail}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/admin/settings" />}>
          <User />
          <span>{t('userMenu.myAccount')}</span>
        </DropdownMenuItem>
        <LanguageSelector />
        <DropdownMenuItem disabled title={t('userMenu.changePasswordUnavailable')}>
          <KeyRound />
          <span>{t('userMenu.changePassword')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onSignOut}>
          <LogOut />
          <span>{t('userMenu.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
