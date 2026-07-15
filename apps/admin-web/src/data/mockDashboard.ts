import {
  Handshake,
  Percent,
  ShieldAlert,
  Star,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { KpiTrend } from '@/components/dashboard/KpiCard';
import type { StatusTone } from '@/components/common/StatusBadge';

export type MockKpi = {
  id: string;
  icon: LucideIcon;
  titleKey: string;
  value: string;
  trend: KpiTrend;
};

export const mockKpis: MockKpi[] = [
  {
    id: 'total-members',
    icon: Users,
    titleKey: 'dashboard.kpi.totalMembers',
    value: '12,480',
    trend: { value: 8, direction: 'up' },
  },
  {
    id: 'active-members',
    icon: UserCog,
    titleKey: 'dashboard.kpi.activeMembers',
    value: '9,214',
    trend: { value: 4, direction: 'up' },
  },
  {
    id: 'total-partners',
    icon: Handshake,
    titleKey: 'dashboard.kpi.totalPartners',
    value: '318',
    trend: { value: 2, direction: 'down' },
  },
  {
    id: 'active-discounts',
    icon: Percent,
    titleKey: 'dashboard.kpi.activeDiscounts',
    value: '742',
    trend: { value: 12, direction: 'up' },
  },
];

export type MockAttentionItem = {
  id: string;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  count: number;
  tone: StatusTone;
  to: string;
};

export const mockAttentionItems: MockAttentionItem[] = [
  {
    id: 'partners-awaiting-approval',
    icon: Handshake,
    titleKey: 'dashboard.attention.partnersAwaitingApproval.title',
    descriptionKey: 'dashboard.attention.partnersAwaitingApproval.description',
    count: 6,
    tone: 'warning',
    to: '/admin/partners',
  },
  {
    id: 'reviews-awaiting-moderation',
    icon: Star,
    titleKey: 'dashboard.attention.reviewsAwaitingModeration.title',
    descriptionKey: 'dashboard.attention.reviewsAwaitingModeration.description',
    count: 14,
    tone: 'info',
    to: '/admin/reviews',
  },
  {
    id: 'discounts-expiring-soon',
    icon: Percent,
    titleKey: 'dashboard.attention.discountsExpiringSoon.title',
    descriptionKey: 'dashboard.attention.discountsExpiringSoon.description',
    count: 9,
    tone: 'warning',
    to: '/admin/discounts',
  },
  {
    id: 'subscription-issues',
    icon: ShieldAlert,
    titleKey: 'dashboard.attention.subscriptionIssues.title',
    descriptionKey: 'dashboard.attention.subscriptionIssues.description',
    count: 3,
    tone: 'danger',
    to: '/admin/members',
  },
];

export type MockActivityItem = {
  id: string;
  icon: LucideIcon;
  titleKey: string;
  timestamp: string;
};

export const mockActivityItems: MockActivityItem[] = [
  {
    id: 'activity-1',
    icon: Handshake,
    titleKey: 'dashboard.activity.partnerCreated',
    timestamp: '5m',
  },
  {
    id: 'activity-2',
    icon: Star,
    titleKey: 'dashboard.activity.reviewSubmitted',
    timestamp: '22m',
  },
  {
    id: 'activity-3',
    icon: UserPlus,
    titleKey: 'dashboard.activity.subscriptionRenewed',
    timestamp: '1h',
  },
  {
    id: 'activity-4',
    icon: Percent,
    titleKey: 'dashboard.activity.discountUpdated',
    timestamp: '3h',
  },
  {
    id: 'activity-5',
    icon: UserCog,
    titleKey: 'dashboard.activity.administratorAction',
    timestamp: '5h',
  },
];
