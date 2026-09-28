import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCustomers } from "@/hooks/useStockflow";
import { currency, shortDate } from "@/lib/format";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — StockFlow" },
      { name: "description", content: "Customer accounts, order counts, lifetime spend and account status." },
      { property: "og:title", content: "Customers — StockFlow" },
      { property: "og:description", content: "Customer accounts, order history and lifetime spend." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { data: customers = [] } = useCustomers();
  const [q, setQ] = useState("");
  const rows = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.email.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell title="Customers" subtitle={`${customers.length} accounts on file`}>
      <Panel bodyClassName="p-4">
        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customers by name or email…"
            aria-label="Search customers"
            className="h-10 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
        </label>
      </Panel>

      <Panel className="mt-4" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {["Customer Name", "Email", "Phone", "Orders", "Total Spent", "Last Order", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {c.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <span className="truncate font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-5 py-3 tabular-nums">{c.orders}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums">{currency(c.totalSpent)}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{shortDate(c.lastOrder)}</td>
                  <td className="px-5 py-3"><StatusBadge value={c.status} /></td>
                  <td className="px-5 py-3">
                    <Link to="/customers/$customerId" params={{ customerId: c.id }} className="text-xs font-semibold text-primary hover:underline">
                      View profile
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
