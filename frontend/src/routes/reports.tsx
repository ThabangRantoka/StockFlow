import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart, TrendingUp, Users, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/shared/KpiCard";
import { Panel } from "@/components/shared/Panel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useGrowth, useOrders, useProducts, useSales } from "@/hooks/useStockflow";
import { compactCurrency, currency, number } from "@/lib/format";
import { stockStatus } from "@/types";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — StockFlow" },
      { name: "description", content: "Revenue analytics, sales trends, top sellers and customer growth reporting." },
      { property: "og:title", content: "Reports — StockFlow" },
      { property: "og:description", content: "Revenue analytics, sales trends and customer growth." },
    ],
  }),
  component: ReportsPage,
});

const pieColors = ["var(--warning)", "var(--info)", "var(--success)", "var(--destructive)"];

function ReportsPage() {
  const { data: sales = [] } = useSales();
  const { data: growth = [] } = useGrowth();
  const { data: orders = [] } = useOrders();
  const { data: products = [] } = useProducts();

  const revenueYTD = sales.reduce((s, p) => s + p.revenue, 0);
  const ordersYTD = sales.reduce((s, p) => s + p.orders, 0);

  const sold = new Map<string, number>();
  orders.forEach((o) => o.items.forEach((i) => sold.set(i.name, (sold.get(i.name) ?? 0) + i.quantity)));
  const topSellers = [...sold.entries()]
    .map(([name, units]) => ({ name, units }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 6);

  const byStatus = ["pending", "processing", "completed", "cancelled"].map((s) => ({
    name: s[0]!.toUpperCase() + s.slice(1),
    value: orders.filter((o) => o.status === s).length,
  }));

  const lowStock = products.filter((p) => stockStatus(p) !== "in_stock");

  return (
    <AppShell title="Reports" subtitle="Analytics · year to date, 2026">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue YTD" value={currency(revenueYTD)} icon={Wallet} change={9.6} />
        <KpiCard label="Orders YTD" value={number(ordersYTD)} icon={ShoppingCart} accent="info" change={6.1} />
        <KpiCard label="Avg Order Value" value={currency(Math.round(revenueYTD / Math.max(1, ordersYTD)))} icon={TrendingUp} accent="success" change={3.4} />
        <KpiCard label="Customer Growth" value="+50.5%" icon={Users} accent="warning" hint="Apr → Sep" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Sales trend" description="Revenue and order volume by month" bodyClassName="p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis yAxisId="l" tickFormatter={(v) => compactCurrency(v as number)} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" width={56} />
                <YAxis yAxisId="r" orientation="right" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" width={36} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }} />
                <Line yAxisId="l" type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
                <Line yAxisId="r" type="monotone" dataKey="orders" stroke="var(--chart-3)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Orders by status" bodyClassName="p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                  {byStatus.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1.5 text-xs">
            {byStatus.map((s, i) => (
              <li key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i] }} />
                  {s.name}
                </span>
                <span className="font-semibold tabular-nums">{s.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Top-selling products" description="Units sold this period" bodyClassName="p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSellers} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="units" fill="var(--chart-1)" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Customer growth" description="Registered accounts" bodyClassName="p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" width={44} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="customers" fill="var(--chart-2)" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4" title="Low-stock report" description="SKUs at or below reorder level" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {["SKU", "Product", "Category", "On hand", "Reorder level", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lowStock.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold">{p.sku}</td>
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-5 py-3 tabular-nums">{p.stock}</td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">{p.reorderLevel}</td>
                  <td className="px-5 py-3"><StatusBadge value={stockStatus(p)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
