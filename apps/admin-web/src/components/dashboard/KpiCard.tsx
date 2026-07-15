import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type KpiTrend = {
  value: number;
  direction: 'up' | 'down';
};

type KpiCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: KpiTrend;
  comparisonPeriod?: string;
};

function KpiCard({ title, value, icon: Icon, trend, comparisonPeriod }: KpiCardProps) {
  const TrendIcon = trend?.direction === 'down' ? TrendingDown : TrendingUp;
  const trendColor =
    trend?.direction === 'down' ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="font-heading text-2xl font-semibold text-foreground">{value}</p>
        {trend ? (
          <p className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="size-3.5" />
            <span>{trend.value}%</span>
            {comparisonPeriod ? (
              <span className="text-muted-foreground">{comparisonPeriod}</span>
            ) : null}
          </p>
        ) : comparisonPeriod ? (
          <p className="text-xs text-muted-foreground">{comparisonPeriod}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default KpiCard;
