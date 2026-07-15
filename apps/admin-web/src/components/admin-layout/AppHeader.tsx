import { Bell, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { navItems } from '@/lib/navigation';
import UserMenu from '@/components/admin-layout/UserMenu';

type BreadcrumbEntry = { labelKey: string; path?: string };

function useBreadcrumbs(pathname: string): BreadcrumbEntry[] {
  for (const item of navItems) {
    if (item.children) {
      const child = item.children.find((childItem) => childItem.path === pathname);
      if (child) {
        return [{ labelKey: item.labelKey }, { labelKey: child.labelKey, path: child.path }];
      }
    }
    if (item.path === pathname) {
      return [{ labelKey: item.labelKey, path: item.path }];
    }
  }

  return [{ labelKey: 'nav.dashboard', path: '/admin' }];
}

type AppHeaderProps = {
  adminEmail: string;
  onSignOut: () => void;
};

function AppHeader({ adminEmail, onSignOut }: AppHeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const crumbs = useBreadcrumbs(location.pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 md:px-4">
      <SidebarTrigger aria-label={t('layout.toggleSidebar')} />

      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <span key={crumb.labelKey} className="flex items-center gap-1.5">
                <BreadcrumbItem>
                  {isLast || !crumb.path ? (
                    <BreadcrumbPage>{t(crumb.labelKey)}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link to={crumb.path} />}>
                      {t(crumb.labelKey)}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {isLast ? null : <BreadcrumbSeparator />}
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden md:inline-flex"
          aria-label={t('layout.search')}
        >
          <Search />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={t('layout.notifications')}>
          <Bell />
        </Button>
        <UserMenu adminEmail={adminEmail} onSignOut={onSignOut} />
      </div>
    </header>
  );
}

export default AppHeader;
