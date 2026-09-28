import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string | undefined;
  description?: string | undefined;
  action?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
  bodyClassName?: string | undefined;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-card", className)}>
      {(title || action) && (
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-bold text-foreground">{title}</h2>}
            {description && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
