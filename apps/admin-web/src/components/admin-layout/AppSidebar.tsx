import { ChevronRight, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { isNavItemActive, navItems } from '@/lib/navigation';

function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { state, isMobile, setOpen } = useSidebar();

  const expandIfCollapsed = () => {
    if (!isMobile && state === 'collapsed') {
      setOpen(true);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-transparent active:bg-transparent"
              render={<Link to="/admin" />}
            >
              <CreditCard className="text-primary" />
              <span className="font-heading text-sm font-semibold">{t('admin.brandName')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.children) {
                  const groupActive = item.children.some((child) =>
                    isNavItemActive(child.path, location.pathname)
                  );

                  return (
                    <Collapsible key={item.id} defaultOpen={groupActive}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger
                          render={
                            <SidebarMenuButton
                              className="group/collapsible"
                              tooltip={t(item.labelKey)}
                              onClick={expandIfCollapsed}
                            >
                              <item.icon />
                              <span>{t(item.labelKey)}</span>
                              <ChevronRight className="ml-auto transition-transform group-data-[panel-open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          }
                        />
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.id}>
                                <SidebarMenuSubButton
                                  render={<Link to={child.path ?? '#'} />}
                                  isActive={isNavItemActive(child.path, location.pathname)}
                                >
                                  <child.icon />
                                  <span>{t(child.labelKey)}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                const active = isNavItemActive(item.path, location.pathname);

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      render={<Link to={item.path ?? '#'} />}
                      isActive={active}
                      tooltip={t(item.labelKey)}
                    >
                      <item.icon />
                      <span>{t(item.labelKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
