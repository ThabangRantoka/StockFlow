
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { getToken } from "@/hooks/useSession";
import { compactCurrency, currency, number } from "@/lib/format";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — StockFlow" },
      {
        name: "description",
        content: "Real-time sales, inventory and customer reporting.",
      },
    ],
  }),
  component: ReportsPage,
});

type SalesMonth = {
  month: string;
  revenue: number;
  orders: number;
};

type CustomerMonth = {
  month: string;
  customers: number;
};

type OrderStatus = {
  status: string;
  total: number;
};

type TopSeller = {
  id: number;
  name: string;
  sku: string;
  units: number;
};

type LowStockProduct = {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  stock_quantity: number;
  reorder_level: number;
  status: string;
};

type ReportsResponse = {
  year: number;
  summary: {
    revenue: number;
    total_orders: number;
    average_order_value: number;
    total_new_customers: number;
  };
  sales: SalesMonth[];
  order_statuses: OrderStatus[];
  top_sellers: TopSeller[];
  customer_growth: CustomerMonth[];
  low_stock: LowStockProduct[];
};

const pieColors = [
  "var(--warning)",
  "var(--info)",
  "var(--chart-1)",
  "var(--success)",
  "var(--destructive)",
];

const statuses = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

async function fetchReports(): Promise<ReportsResponse> {
  const token = getToken();

  const response = await fetch("/api/reports", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));

    throw new Error(
      result.message || "Failed to load reports"
    );
  }

  return response.json();
}

function ReportsPage() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["reports"],
    queryFn: fetchReports,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <AppShell title="Reports">
        <Panel>
          <p className="text-sm text-muted-foreground">
            Loading reports from PostgreSQL...
          </p>
        </Panel>
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell title="Reports">
        <Panel>
          <p className="text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Unable to load reports."}
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg border border-border px-4 py-2 text-sm"
            onClick={() => refetch()}
          >
            Try again
          </button>
        </Panel>
      </AppShell>
    );
  }

  const {
    year,
    summary,
    sales,
    top_sellers: topSellers,
    customer_growth: growth,
    low_stock: lowStock,
  } = data;

  const byStatus = statuses.map((status) => ({
    name: status,
    value: data.order_statuses
      .filter(
        (item) =>
          item.status.toLowerCase() === status.toLowerCase()
      )
      .reduce((total, item) => total + item.total, 0),
  }));

  const totalStatusOrders = byStatus.reduce(
    (total, item) => total + item.value,
    0
  );

  return (
    <AppShell
      title="Reports"
      subtitle={`Analytics · year to date, ${year}`}
    >
      {/* KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue YTD"
          value={currency(summary.revenue)}
          icon={Wallet}
        />

        <KpiCard
          label="Orders YTD"
          value={number(summary.total_orders)}
          icon={ShoppingCart}
          accent="info"
        />

        <KpiCard
          label="Avg Order Value"
          value={currency(summary.average_order_value)}
          icon={TrendingUp}
          accent="success"
        />

        <KpiCard
          label="New Customers YTD"
          value={number(summary.total_new_customers)}
          icon={Users}
          accent="warning"
        />
      </div>

      {/* SALES TREND AND ORDER STATUS */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Sales trend"
          description="Revenue and order volume by month"
          bodyClassName="p-4"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sales}
                margin={{
                  top: 8,
                  right: 8,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--muted-foreground)"
                />

                <YAxis
                  yAxisId="l"
                  tickFormatter={(value) =>
                    compactCurrency(Number(value))
                  }
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--muted-foreground)"
                  width={56}
                />

                <YAxis
                  yAxisId="r"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--muted-foreground)"
                  width={36}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />

                <Line
                  yAxisId="l"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={false}
                />

                <Line
                  yAxisId="r"
                  type="monotone"
                  dataKey="orders"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Orders by status"
          description="All recorded orders"
          bodyClassName="p-4"
        >
          <div className="h-72">
            {totalStatusOrders > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={3}
                  >
                    {byStatus.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={pieColors[index]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No orders recorded yet.
              </div>
            )}
          </div>

          <ul className="space-y-1.5 text-xs">
            {byStatus.map((item, index) => (
              <li
                key={item.name}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: pieColors[index],
                    }}
                  />
                  {item.name}
                </span>

                <span className="font-semibold tabular-nums">
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* TOP SELLERS AND CUSTOMER GROWTH */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Top-selling products"
          description={`Units sold in ${year}`}
          bodyClassName="p-4"
        >
          <div className="h-72">
            {topSellers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSellers}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                    allowDecimals={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--muted-foreground)"
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  />

                  <Bar
                    dataKey="units"
                    fill="var(--chart-1)"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No product sales recorded yet.
              </div>
            )}
          </div>
        </Panel>

        <Panel
          title="Customer growth"
          description={`New customer registrations in ${year}`}
          bodyClassName="p-4"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growth}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--muted-foreground)"
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--muted-foreground)"
                  width={44}
                  allowDecimals={false}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />

                <Bar
                  dataKey="customers"
                  fill="var(--chart-2)"
                  radius={[6, 6, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* LOW STOCK REPORT */}
      <Panel
        className="mt-4"
        title="Low-stock report"
        description="SKUs at or below reorder level"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {[
                  "SKU",
                  "Product",
                  "Category",
                  "On hand",
                  "Reorder level",
                  "Status",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 font-semibold"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {lowStock.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    No low-stock products. Inventory levels look good.
                  </td>
                </tr>
              ) : (
                lowStock.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-semibold">
                      {product.sku}
                    </td>

                    <td className="px-5 py-3 font-medium">
                      {product.name}
                    </td>

                    <td className="px-5 py-3 text-muted-foreground">
                      {product.category || "—"}
                    </td>

                    <td className="px-5 py-3 tabular-nums">
                      {product.stock_quantity}
                    </td>

                    <td className="px-5 py-3 tabular-nums text-muted-foreground">
                      {product.reorder_level}
                    </td>

                    <td className="px-5 py-3">
                      <StatusBadge value={product.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
