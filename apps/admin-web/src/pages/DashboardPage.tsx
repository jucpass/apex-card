import { RefreshCcw, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import AttentionCard from '@/components/dashboard/AttentionCard';
import ActivityList from '@/components/dashboard/ActivityList';
import KpiCard from '@/components/dashboard/KpiCard';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockActivityItems, mockAttentionItems, mockKpis } from '@/data/mockDashboard';

const growthPlaceholderBars = [38, 52, 46, 64, 58, 72, 68, 80, 74, 88, 82, 95];

function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        actions={
          <>
            <Button variant="outline" size="sm">
              {t('dashboard.dateRangePlaceholder')}
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCcw />
              {t('dashboard.refresh')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockKpis.map((kpi) => (
          <KpiCard
            key={kpi.id}
            title={t(kpi.titleKey)}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
            comparisonPeriod={t('dashboard.kpi.comparisonPeriod')}
          />
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t('dashboard.attention.title')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockAttentionItems.map((item) => (
            <AttentionCard
              key={item.id}
              icon={item.icon}
              title={t(item.titleKey)}
              description={t(item.descriptionKey)}
              count={item.count}
              tone={item.tone}
              to={item.to}
              actionLabel={t('dashboard.attention.review')}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{t('dashboard.growth.title')}</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              role="img"
              aria-label={t('dashboard.growth.placeholderLabel')}
              className="flex h-40 items-end gap-1.5"
            >
              {growthPlaceholderBars.map((height, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div
                  key={index}
                  className="flex-1 rounded-t-sm bg-primary/20"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {t('dashboard.growth.placeholderNote')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.activity.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityList
              items={mockActivityItems.map((item) => ({
                id: item.id,
                icon: item.icon,
                title: t(item.titleKey),
                timestamp: item.timestamp,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
