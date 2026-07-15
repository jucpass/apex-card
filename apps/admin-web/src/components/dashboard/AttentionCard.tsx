import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/card';
import StatusBadge, { type StatusTone } from '@/components/common/StatusBadge';

type AttentionCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  count: number;
  tone: StatusTone;
  to: string;
  actionLabel: string;
};

function AttentionCard({
  icon: Icon,
  title,
  description,
  count,
  tone,
  to,
  actionLabel,
}: AttentionCardProps) {
  return (
    <Link
      to={to}
      aria-label={`${title} — ${actionLabel}`}
      className="group/attention-card block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="transition-shadow group-hover/attention-card:shadow-md">
        <CardContent className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <StatusBadge tone={tone} label={String(count)} />
        </CardContent>
        <CardContent className="pt-0">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover/attention-card:underline">
            {actionLabel}
            <ArrowRight className="size-3.5 transition-transform group-hover/attention-card:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export default AttentionCard;
