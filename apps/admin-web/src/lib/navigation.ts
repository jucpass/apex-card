import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  Flag,
  GalleryHorizontal,
  Handshake,
  Image,
  KeyRound,
  Lock,
  MapPin,
  Megaphone,
  Percent,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Tags,
  UserCog,
  Users,
} from 'lucide-react';

export type NavItem = {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  path?: string;
  children?: NavItem[];
};

export const navItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, path: '/admin' },
  { id: 'members', labelKey: 'nav.members', icon: Users, path: '/admin/members' },
  { id: 'partners', labelKey: 'nav.partners', icon: Handshake, path: '/admin/partners' },
  { id: 'discounts', labelKey: 'nav.discounts', icon: Percent, path: '/admin/discounts' },
  {
    id: 'content',
    labelKey: 'nav.content',
    icon: Image,
    children: [
      {
        id: 'content-home-banners',
        labelKey: 'nav.contentHomeBanners',
        icon: GalleryHorizontal,
        path: '/admin/content/home-banners',
      },
      {
        id: 'content-promotions',
        labelKey: 'nav.contentPromotions',
        icon: Megaphone,
        path: '/admin/content/promotions',
      },
    ],
  },
  {
    id: 'locations',
    labelKey: 'nav.locations',
    icon: MapPin,
    children: [
      {
        id: 'locations-countries',
        labelKey: 'nav.locationsCountries',
        icon: Flag,
        path: '/admin/locations/countries',
      },
      {
        id: 'locations-cities',
        labelKey: 'nav.locationsCities',
        icon: Building2,
        path: '/admin/locations/cities',
      },
      {
        id: 'locations-categories',
        labelKey: 'nav.locationsCategories',
        icon: Tags,
        path: '/admin/locations/categories',
      },
    ],
  },
  { id: 'analytics', labelKey: 'nav.analytics', icon: BarChart3, path: '/admin/analytics' },
  {
    id: 'administration',
    labelKey: 'nav.administration',
    icon: ShieldCheck,
    children: [
      {
        id: 'administration-administrators',
        labelKey: 'nav.administrators',
        icon: UserCog,
        path: '/admin/administration/administrators',
      },
      {
        id: 'administration-roles',
        labelKey: 'nav.roles',
        icon: KeyRound,
        path: '/admin/administration/roles',
      },
      {
        id: 'administration-permissions',
        labelKey: 'nav.permissions',
        icon: Lock,
        path: '/admin/administration/permissions',
      },
    ],
  },
  { id: 'settings', labelKey: 'nav.settings', icon: Settings, path: '/admin/settings' },
];

export function isNavItemActive(path: string | undefined, pathname: string): boolean {
  if (!path) {
    return false;
  }
  if (path === '/admin') {
    return pathname === '/admin';
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}
