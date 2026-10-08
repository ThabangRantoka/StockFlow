
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { getToken } from "@/hooks/useSession";
import {
  compactCurrency,
  currency,
  number,
  shortDate,
} from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StockFlow" },
      {
        name: "description",
        content:
          "Live retail KPIs, sales trends, order status and inventory health.",
      },
    ],
  }),
  component: DashboardPage,
});

// ========================
// TYPES
// ========================

type DashboardSummary = {
  total_products: string | number;
  total_customers: string | number;
  total_orders: string | number;
  low_stock_products: string | number;
  total_sales: string | number;
};

type RecentOrder = {
  id: number;
  status: string;
  total_amount: string | number;
  created_at: string;
  first_name: string;
  last_name: string;
};

type DashboardResponse = {
  summary: DashboardSummary;
  recent_orders: RecentOrder[];
};

type ReportsResponse = {
  year: number;
  sales: {
    month: string;
    revenue: number;
    orders: number;
  }[];
  order_statuses: {
    status: string;
    total: number;
  }[];
};

type Product = {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
};

type Order = {
  id: number;
  created_at: string;
};

const statusColors: Record<string, string> = {
  Pending: "var(--warning)",
  Processing: "var(--info)",
  Shipped: "var(--chart-1)",
  Delivered: "var(--success)",
  Cancelled: "var(--destructive)",
};

const orderStatuses = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

// ========================
// API REQUEST
// ========================

async function apiRequest<T>(path: string): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error("Please sign in to view the dashboard.");
  }

  const response = await fetch(path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));

    throw new Error(
      result.message || "Failed to load dashboard data."
    );
  }

  return response.json();
}

// ========================
// DASHBOARD PAGE
// ========================

function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      apiRequest<DashboardResponse>("/api/dashboard"),
    staleTime: 30_000,
  });

  const reportsQuery = useQuery({
    queryKey: ["reports"],
    queryFn: () =>
      apiRequest<ReportsResponse>("/api/reports"),
    staleTime: 30_000,
  });

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () =>
      apiRequest<Product[]>("/api/products"),
    staleTime: 30_000,
  });

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: () =>
      apiRequest<Order[]>("/api/orders"),
    staleTime: 30_000,
  });

  const isLoading =
    dashboardQuery.isLoading ||
    reportsQuery.isLoading ||
    productsQuery.isLoading ||
    ordersQuery.isLoading;

  const hasError =
    dashboardQuery.isError ||
    reportsQuery.isError ||
    productsQuery.isError ||
    ordersQuery.isError;

  if (isLoading) {
    return (
      <AppShell title="Dashboard">
        <Panel>
          <p className="text-sm text-muted-foreground">
            Loading dashboard from PostgreSQL...
          </p>
        </Panel>
      </AppShell>
    );
  }

  if (hasError) {
    const error =
      dashboardQuery.error ||
      reportsQuery.error ||
      productsQuery.error ||
      ordersQuery.error;

    return (
      <AppShell title="Dashboard">
        <Panel>
          <p className="text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Failed to load dashboard."}
          </p>

          <button
            type="button"
            className="mt-4 rounded-lg border border-border px-4 py-2 text-sm"
            onClick={() => {
              dashboardQuery.refetch();
              reportsQuery.refetch();
              productsQuery.refetch();
              ordersQuery.refetch();
            }}
          >
            Try again
          </button>
        </Panel>
      </AppShell>
    );
  }

  const dashboard = dashboardQuery.data!;
  const reports = reportsQuery.data!;
  const products = productsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];

  const summary = dashboard.summary;

  // ========================
  // REAL KPI CALCULATIONS
  // ========================

  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const ordersToday = orders.filter((order) => {
    const date = new Date(order.created_at);

    const orderDay = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    return orderDay === today;
  }).length;

  const monthlyRevenue =
    reports.year === now.getFullYear()
      ? reports.sales[now.getMonth()]?.revenue ?? 0
      : 0;

  // ========================
  // ORDER STATUS
  // ========================

  const orderStatus = orderStatuses.map((status) => {
    const match = reports.order_statuses.find(
      (item) =>
        item.status.toLowerCase() === status.toLowerCase()
    );

    return {
      name: status,
      value: match?.total ?? 0,
    };
  });

  // ========================
  // INVENTORY
  // ========================

  const inStock = products.filter(
    (product) => Number(product.stock_quantity) > 5
  ).length;

  const lowStock = products.filter(
    (product) =>
      Number(product.stock_quantity) > 0 &&
      Number(product.stock_quantity) <= 5
  ).length;

  const outOfStock = products.filter(
    (product) => Number(product.stock_quantity) === 0
  ).length;

  const inventory = [
    {
      label: "Products in stock",
      value: inStock,
      tone: "bg-success",
    },
    {
      label: "Low stock",
      value: lowStock,
      tone: "bg-warning",
    },
    {
      label: "Out of stock",
      value: outOfStock,
      tone: "bg-destructive",
    },
  ];

  const totalInventoryProducts = Math.max(
    1,
    products.length
  );

  const recentOrders = dashboard.recent_orders;

  const subtitle = `Operational overview · ${now.toLocaleDateString(
    "en-ZA",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  )}`;

  return (
    <AppShell title="Dashboard" subtitle={subtitle}>
      {/* KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total Products"
          value={number(Number(summary.total_products))}
          icon={Package}
        />

        <KpiCard
          label="Low Stock Items"
          value={number(lowStock + outOfStock)}
          icon={AlertTriangle}
          accent="warning"
          hint="At or below 5 units"
        />

        <KpiCard
          label="Orders Today"
          value={number(ordersToday)}
          icon={ShoppingCart}
          accent="info"
        />

        <KpiCard
          label="Total Customers"
          value={number(Number(summary.total_customers))}
          icon={Users}
          accent="success"
        />

        <KpiCard
          label="Monthly Revenue"
          value={currency(monthlyRevenue)}
          icon={Wallet}
        />
      </div>

      {/* SALES AND STATUS CHARTS */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Sales Overview"
          description={`Revenue by month (${reports.year}, ZAR)`}
          bodyClassName="p-4"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={reports.sales}
                margin={{
                  top: 8,
                  right: 8,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="rev"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

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
                  tickFormatter={(value) =>
                    compactCurrency(Number(value))
                  }
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--muted-foreground)"
                  width={56}
                />

                <Tooltip
                  formatter={(value) =>
                    currency(Number(value))
                  }
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Order Status"
          description="Current distribution"
          bodyClassName="p-4"
        >
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={orderStatus}
                margin={{
                  top: 8,
                  right: 8,
                  left: -16,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                />

                <YAxis
                  allowDecimals={false}
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
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                >
                  {orderStatus.map((item) => (
                    <Cell
                      key={item.name}
                      fill={statusColors[item.name]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* INVENTORY OVERVIEW */}
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <p className="text-xs font-bold text-foreground">
              Inventory Overview
            </p>

            {inventory.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {item.label}
                  </span>

                  <span className="font-semibold tabular-nums">
                    {item.value}
                  </span>
                </div>

                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${item.tone}`}
                    style={{
                      width: `${
                        (item.value / totalInventoryProducts) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* RECENT ORDERS */}
      <Panel
        className="mt-4"
        title="Recent Orders"
        description="Latest recorded orders"
        bodyClassName="p-0"
        action={
          <Link
            to="/orders"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View all orders
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {[
                  "Order ID",
                  "Customer",
                  "Date",
                  "Total",
                  "Status",
                  "",
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
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-semibold">
                      {`ORD-${String(order.id).padStart(5, "0")}`}
                    </td>

                    <td className="px-5 py-3">
                      {order.first_name} {order.last_name}
                    </td>

                    <td className="px-5 py-3 text-muted-foreground">
                      {shortDate(order.created_at)}
                    </td>

                    <td className="px-5 py-3 font-semibold tabular-nums">
                      {currency(Number(order.total_amount))}
                    </td>

                    <td className="px-5 py-3">
                      <StatusBadge
                        value={order.status.toLowerCase()}
                      />
                    </td>

                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/orders/$orderId"
                        params={{
                          orderId: String(order.id),
                        }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Boxes className="h-3.5 w-3.5" />
        Live operational data from the StockFlow Node.js,
        Express and PostgreSQL backend.
      </p>
    </AppShell>
  );
}
