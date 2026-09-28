import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useOrders } from "@/hooks/useStockflow";
import { currency, dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Orders — StockFlow" },
      { name: "description", content: "Track and fulfil customer orders across online, in-store and marketplace channels." },
      { property: "og:title", content: "Orders — StockFlow" },
      { property: "og:description", content: "Track and fulfil customer orders across every sales channel." },
    ],
  }),
  component: OrdersPage,
});

const tabs = ["all", "pending", "processing", "completed", "cancelled"] as const;

function OrdersPage() {
  const { data: orders = [] } = useOrders();
  const [tab, setTab] = useState<(typeof tabs)[number]>("all");
  const rows = orders.filter((o) => tab === "all" || o.status === tab);

  return (
    <AppShell title="Orders" subtitle={`${orders.length} orders in the current period`}>
      <Panel bodyClassName="p-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-semibold capitalize transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t === "all" ? "All Orders" : t}
              <span className="ml-2 text-xs opacity-70">
                {t === "all" ? orders.length : orders.filter((o) => o.status === t).length}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="mt-4" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {["Order Number", "Customer", "Date", "Items", "Total", "Payment", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">No orders with this status.</td></tr>
              )}
              {rows.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <Link to="/orders/$orderId" params={{ orderId: o.id }} className="font-mono text-xs font-semibold text-primary hover:underline">
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-medium">{o.customerName}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{dateTime(o.date)}</td>
                  <td className="px-5 py-3 tabular-nums">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums">{currency(o.total)}</td>
                  <td className="px-5 py-3"><StatusBadge value={o.payment} /></td>
                  <td className="px-5 py-3"><StatusBadge value={o.status} /></td>
                  <td className="px-5 py-3">
                    <Link to="/orders/$orderId" params={{ orderId: o.id }} className="text-xs font-semibold text-primary hover:underline">
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
