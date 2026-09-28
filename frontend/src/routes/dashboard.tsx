import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  Package,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/shared/KpiCard";
import { Panel } from "@/components/shared/Panel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useOrders, useProducts, useSales, useSummary } from "@/hooks/useStockflow";
import { compactCurrency, currency, number, shortDate } from "@/lib/format";
import { stockStatus } from "@/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StockFlow" },
      { name: "description", content: "Live retail KPIs, sales trends, order status and inventory health." },
      { property: "og:title", content: "Dashboard — StockFlow" },
      { property: "og:description", content: "Live retail KPIs, sales trends and inventory health." },
    ],
  }),
  component: DashboardPage,
});

const statusColors: Record<string, string> = {
  Pending: "var(--warning)",
  Processing: "var(--info)",
  Completed: "var(--success)",
  Cancelled: "var(--destructive)",
};

function DashboardPage() {
  const { data: summary } = useSummary();
  const { data: sales = [] } = useSales();
  const { data: orders = [] } = useOrders();
  const { data: products = [] } = useProducts();

  const orderStatus = ["pending", "processing", "completed", "cancelled"].map((s) => ({
    name: s[0]!.toUpperCase() + s.slice(1),
    value: orders.filter((o) => o.status === s).length,
  }));

  const inventory = [
    { label: "Products in stock", value: products.filter((p) => stockStatus(p) === "in_stock").length, tone: "bg-success" },
    { label: "Low stock", value: products.filter((p) => stockStatus(p) === "low_stock").length, tone: "bg-warning" },
    { label: "Out of stock", value: products.filter((p) => stockStatus(p) === "out_of_stock").length, tone: "bg-destructive" },
  ];
  const totalInv = Math.max(1, products.length);

  return (
    <AppShell title="Dashboard" subtitle="Operational overview · Wednesday, 9 September 2026">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Products" value={number(summary?.totalProducts ?? 0)} icon={Package} change={2.1} hint="vs last month" />
        <KpiCard label="Low Stock Items" value={number(summary?.lowStockItems ?? 0)} icon={AlertTriangle} accent="warning" hint="needs reorder" />
        <KpiCard label="Orders Today" value={number(summary?.ordersToday ?? 0)} icon={ShoppingCart} accent="info" change={12.5} />
        <KpiCard label="Total Customers" value={number(summary?.totalCustomers ?? 0)} icon={Users} accent="success" change={7.8} />
        <KpiCard label="Monthly Revenue" value={currency(summary?.monthlyRevenue ?? 0)} icon={Wallet} change={summary?.revenueChange} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Sales Overview"
          description="Revenue by month (ZAR)"
          bodyClassName="p-4"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis tickFormatter={(v) => compactCurrency(v as number)} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" width={56} />
                <Tooltip
                  formatter={(v) => currency(v as number)}
                  contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Order Status" description="Current distribution" bodyClassName="p-4">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStatus} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {orderStatus.map((s) => (
                    <Cell key={s.name} fill={statusColors[s.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <p className="text-xs font-bold text-foreground">Inventory Overview</p>
            {inventory.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold tabular-nums">{row.value}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${(row.value / totalInv) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-4"
        title="Recent Orders"
        description="Latest activity across all channels"
        bodyClassName="p-0"
        action={
          <Link to="/orders" className="text-xs font-semibold text-primary hover:underline">
            View all orders
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {["Order ID", "Customer", "Date", "Total", "Payment", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 7).map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold">{o.number}</td>
                  <td className="px-5 py-3">{o.customerName}</td>
                  <td className="px-5 py-3 text-muted-foreground">{shortDate(o.date)}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums">{currency(o.total)}</td>
                  <td className="px-5 py-3"><StatusBadge value={o.payment} /></td>
                  <td className="px-5 py-3"><StatusBadge value={o.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <Link to="/orders/$orderId" params={{ orderId: o.id }} className="text-xs font-semibold text-primary hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Boxes className="h-3.5 w-3.5" /> Data served through the StockFlow service layer — ready to
        swap to the Node.js + Express REST API.
      </p>
    </AppShell>
  );
}
