import type { LucideIcon } from 'lucide-react';

export type ActivityItem = {
  id: string;
  icon: LucideIcon;
  title: string;
  timestamp: string;
};

type ActivityListProps = {
  items: ActivityItem[];
};

function ActivityList({ items }: ActivityListProps) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <item.icon className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{item.title}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{item.timestamp}</span>
        </li>
      ))}
    </ul>
  );
}

export default ActivityList;
