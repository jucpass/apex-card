import { Outlet } from 'react-router-dom';

import AppHeader from '@/components/admin-layout/AppHeader';
import AppSidebar from '@/components/admin-layout/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

type AdminLayoutProps = {
  adminEmail: string;
  onSignOut: () => void;
};

function AdminLayout({ adminEmail, onSignOut }: AdminLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader adminEmail={adminEmail} onSignOut={onSignOut} />
          <div className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1600px]">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export default AdminLayout;
