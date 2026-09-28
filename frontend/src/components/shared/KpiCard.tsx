import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  change?: number | undefined;
  hint?: string | undefined;
  accent?: "primary" | "success" | "warning" | "danger" | "info" | undefined;
}

const accents = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/18 text-warning-foreground",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/12 text-info",
};

export function KpiCard({ label, value, icon: Icon, change, hint, accent = "primary" }: KpiCardProps) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", accents[accent])}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {change !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-semibold",
              up ? "text-success" : "text-destructive",
            )}
          >
            {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {up ? "+" : ""}
            {change}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
