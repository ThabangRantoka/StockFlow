import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCustomer, useOrders } from "@/hooks/useStockflow";
import { currency, shortDate } from "@/lib/format";

export const Route = createFileRoute("/customers/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer profile — StockFlow" },
      { name: "description", content: "Customer contact details, lifetime value and complete order history." },
      { property: "og:title", content: "Customer profile — StockFlow" },
      { property: "og:description", content: "Contact details, lifetime value and order history." },
    ],
  }),
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { customerId } = useParams({ from: "/customers/$customerId" });
  const { data: customer } = useCustomer(customerId);
  const { data: orders = [] } = useOrders();
  const history = orders.filter((o) => o.customerId === customerId);

  if (!customer) {
    return (
      <AppShell title="Customer profile">
        <Panel><p className="text-sm text-muted-foreground">Loading customer…</p></Panel>
      </AppShell>
    );
  }

  return (
    <AppShell title={customer.name} subtitle={`Customer since 2024 · ${customer.city}`}>
      <Link to="/customers" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to customers
      </Link>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Profile">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {customer.name.split(" ").map((n) => n[0]).join("")}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">{customer.name}</p>
              <StatusBadge value={customer.status} className="mt-1" />
            </div>
          </div>
          <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{customer.email}</span></li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" />{customer.phone}</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" />{customer.city}, South Africa</li>
          </ul>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
            <Stat label="Orders" value={String(customer.orders)} />
            <Stat label="Spend" value={currency(customer.totalSpent)} />
            <Stat label="Last" value={shortDate(customer.lastOrder)} />
          </div>
        </Panel>

        <Panel className="xl:col-span-2" title="Order history" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {["Order", "Date", "Items", "Total", "Payment", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No orders in this period.</td></tr>
                )}
                {history.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-5 py-3">
                      <Link to="/orders/$orderId" params={{ orderId: o.id }} className="font-mono text-xs font-semibold text-primary hover:underline">
                        {o.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{shortDate(o.date)}</td>
                    <td className="px-5 py-3 tabular-nums">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="px-5 py-3 font-semibold tabular-nums">{currency(o.total)}</td>
                    <td className="px-5 py-3"><StatusBadge value={o.payment} /></td>
                    <td className="px-5 py-3"><StatusBadge value={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
