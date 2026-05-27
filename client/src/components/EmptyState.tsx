import { type ReactNode } from 'react';

export type EmptyStateTone = 'default' | 'amber' | 'emerald' | 'blue';

export interface EmptyStateProps {
  icon: string | ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: EmptyStateTone;
}

const toneMap: Record<EmptyStateTone, { shell: string; iconBg: string; title: string }> = {
  default: {
    shell: 'border-outline-variant/20 bg-white dark:bg-card',
    iconBg: 'bg-primary/8 text-primary',
    title: 'text-primary',
  },
  amber: {
    shell: 'border-outline-variant/20 bg-surface-container dark:bg-card',
    iconBg: 'bg-white dark:bg-surface-container text-on-surface-variant dark:text-muted-foreground shadow-sm',
    title: 'text-on-surface dark:text-foreground',
  },
  emerald: {
    shell: 'border-outline-variant/20 bg-surface-container dark:bg-card',
    iconBg: 'bg-white dark:bg-surface-container text-on-surface-variant dark:text-muted-foreground shadow-sm',
    title: 'text-on-surface dark:text-foreground',
  },
  blue: {
    shell: 'border-outline-variant/20 bg-surface-container dark:bg-card',
    iconBg: 'bg-white dark:bg-surface-container text-on-surface-variant dark:text-muted-foreground shadow-sm',
    title: 'text-on-surface dark:text-foreground',
  },
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'default',
}: EmptyStateProps) {
  const styles = toneMap[tone];
  return (
    <div className={`flex flex-col items-center gap-3.5 rounded-3xl border px-5 py-9 text-center shadow-xs transition-all ${styles.shell}`}>
      <div className={`grid h-14 w-14 place-items-center rounded-2xl ${styles.iconBg}`}>
        {typeof icon === 'string' ? (
          <span className="material-symbols-outlined text-2xl" aria-hidden="true">{icon}</span>
        ) : (
          icon
        )}
      </div>
      <div className="max-w-xs">
        <p className={`font-display text-base font-black ${styles.title}`}>{title}</p>
        {description && <p className="mt-1 text-xs font-semibold leading-relaxed text-on-surface-variant/65">{description}</p>}
      </div>
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}
