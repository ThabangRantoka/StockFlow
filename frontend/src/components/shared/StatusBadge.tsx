import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const tones: Record<Tone, string> = {
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/15 text-warning-foreground border-warning/35",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  info: "bg-info/12 text-info border-info/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

const map: Record<string, { label: string; tone: Tone }> = {
  in_stock: { label: "In Stock", tone: "success" },
  low_stock: { label: "Low Stock", tone: "warning" },
  out_of_stock: { label: "Out of Stock", tone: "danger" },
  pending: { label: "Pending", tone: "warning" },
  processing: { label: "Processing", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  paid: { label: "Paid", tone: "success" },
  unpaid: { label: "Unpaid", tone: "warning" },
  refunded: { label: "Refunded", tone: "neutral" },
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  draft: { label: "Draft", tone: "neutral" },
  discontinued: { label: "Discontinued", tone: "danger" },
};

export function StatusBadge({ value, className }: { value: string; className?: string | undefined }) {
  const entry = map[value] ?? { label: value, tone: "neutral" as Tone };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[entry.tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {entry.label}
    </span>
  );
}
