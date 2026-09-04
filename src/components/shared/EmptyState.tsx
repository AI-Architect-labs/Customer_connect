import type { ReactNode } from 'react';
export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-12 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
