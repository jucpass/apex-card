import { Badge } from '@/components/ui/badge';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

const toneClassName: Record<StatusTone, string> = {
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  neutral: 'bg-muted text-muted-foreground',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

type StatusBadgeProps = {
  tone: StatusTone;
  label: string;
};

function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={`border-transparent ${toneClassName[tone]}`}>
      {label}
    </Badge>
  );
}

export default StatusBadge;
