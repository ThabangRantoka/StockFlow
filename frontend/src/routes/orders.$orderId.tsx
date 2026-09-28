import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCustomers, useOrder } from "@/hooks/useStockflow";
import { currency, dateTime } from "@/lib/format";
import { orderService } from "@/services/api";
import type { OrderStatus } from "@/types";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order details — StockFlow" },
      { name: "description", content: "Full order breakdown: customer, line items, payment status and fulfilment timeline." },
      { property: "og:title", content: "Order details — StockFlow" },
      { property: "og:description", content: "Customer, line items, payment status and fulfilment timeline." },
    ],
  }),
  component: OrderDetailPage,
});

const statuses: OrderStatus[] = ["pending", "processing", "completed", "cancelled"];

function OrderDetailPage() {
  const { orderId } = useParams({ from: "/orders/$orderId" });
  const qc = useQueryClient();
  const { data: order } = useOrder(orderId);
  const { data: customers = [] } = useCustomers();
  const customer = customers.find((c) => c.id === order?.customerId);

  if (!order) {
    return (
      <AppShell title="Order details">
        <Panel><p className="text-sm text-muted-foreground">Loading order…</p></Panel>
      </AppShell>
    );
  }

  const change = async (status: OrderStatus) => {
    await orderService.updateStatus(order.id, status);
    qc.invalidateQueries({ queryKey: ["orders"] });
  };

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const vat = Math.round(subtotal * 0.15);

  return (
    <AppShell title={`Order ${order.number}`} subtitle={`${order.channel} · placed ${dateTime(order.date)}`}>
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
      </Link>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel title="Line items" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    {["SKU", "Product", "Qty", "Unit price", "Line total"].map((h) => (
                      <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((i) => (
                    <tr key={i.productId} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-mono text-xs">{i.sku}</td>
                      <td className="px-5 py-3 font-medium">{i.name}</td>
                      <td className="px-5 py-3 tabular-nums">{i.quantity}</td>
                      <td className="px-5 py-3 tabular-nums">{currency(i.price)}</td>
                      <td className="px-5 py-3 font-semibold tabular-nums">{currency(i.price * i.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1.5 border-t border-border px-5 py-4 text-sm">
              <Row label="Subtotal" value={currency(subtotal)} />
              <Row label="VAT (15%, incl.)" value={currency(vat)} />
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>Order total</span>
                <span className="tabular-nums">{currency(order.total)}</span>
              </div>
            </div>
          </Panel>

          <Panel title="Order timeline">
            <ol className="space-y-4">
              {order.timeline.map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{e.label}</p>
                    <p className="text-xs text-muted-foreground">{e.note}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{e.timestamp}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Customer">
            <p className="text-sm font-bold">{order.customerName}</p>
            <p className="mt-1 text-xs text-muted-foreground">{customer?.email}</p>
            <p className="text-xs text-muted-foreground">{customer?.phone}</p>
            <p className="text-xs text-muted-foreground">{customer?.city}, South Africa</p>
            {customer && (
              <Link
                to="/customers/$customerId"
                params={{ customerId: customer.id }}
                className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
              >
                View customer profile
              </Link>
            )}
          </Panel>

          <Panel title="Status">
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={order.payment} />
              <StatusBadge value={order.status} />
            </div>
            <p className="mt-4 text-xs font-semibold text-foreground">Change order status</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => change(s)}
                  className={
                    s === order.status
                      ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground capitalize"
                      : "rounded-lg border border-border px-3 py-2 text-xs font-semibold capitalize hover:bg-muted"
                  }
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">
              PATCH /api/orders/{order.id}/status
            </p>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
