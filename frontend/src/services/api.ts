/**
 * Service layer.
 *
 * Every function here mirrors a REST endpoint on the future
 * Node.js + Express API (e.g. GET /api/products). Swap the mock
 * resolvers for `fetch(`${API_BASE}/products`)` and the UI keeps working.
 */
import {
  apiLogs,
  customers as seedCustomers,
  orders as seedOrders,
  products as seedProducts,
  salesTrend,
  customerGrowth,
} from "@/data/mock";
import type {
  ApiEndpointLog,
  Customer,
  KpiSummary,
  Order,
  OrderStatus,
  Product,
  SalesPoint,
} from "@/types";
import { stockStatus } from "@/types";

export const API_BASE = "/api";

const latency = <T>(data: T, ms = 220): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

// In-memory store standing in for PostgreSQL until the API exists.
const db = {
  products: [...seedProducts],
  customers: [...seedCustomers],
  orders: [...seedOrders],
};

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

/* ---------------------------------- products --------------------------------- */

export const productService = {
  /** GET /api/products */
  list: () => latency(db.products),
  /** GET /api/products/:id */
  get: (id: string) => latency(db.products.find((p) => p.id === id) ?? null),
  /** POST /api/products */
  create: (input: Omit<Product, "id" | "updatedAt">) => {
    const product: Product = { ...input, id: uid("p"), updatedAt: new Date().toISOString() };
    db.products = [product, ...db.products];
    return latency(product);
  },
  /** PUT /api/products/:id */
  update: (id: string, input: Partial<Product>) => {
    db.products = db.products.map((p) =>
      p.id === id ? { ...p, ...input, updatedAt: new Date().toISOString() } : p,
    );
    return latency(db.products.find((p) => p.id === id)!);
  },
  /** DELETE /api/products/:id */
  remove: (id: string) => {
    db.products = db.products.filter((p) => p.id !== id);
    return latency({ success: true });
  },
  /** PATCH /api/inventory/:id */
  adjustStock: (id: string, stock: number) =>
    productService.update(id, { stock: Math.max(0, stock) }),
};

/* --------------------------------- customers --------------------------------- */

export const customerService = {
  /** GET /api/customers */
  list: () => latency(db.customers),
  /** GET /api/customers/:id */
  get: (id: string) => latency(db.customers.find((c) => c.id === id) ?? null),
};

/* ----------------------------------- orders ---------------------------------- */

export const orderService = {
  /** GET /api/orders */
  list: () => latency(db.orders),
  /** GET /api/orders/:id */
  get: (id: string) => latency(db.orders.find((o) => o.id === id) ?? null),
  /** PATCH /api/orders/:id/status */
  updateStatus: (id: string, status: OrderStatus) => {
    db.orders = db.orders.map((o) =>
      o.id === id
        ? {
            ...o,
            status,
            timeline: [
              ...o.timeline,
              {
                label: `Status set to ${status}`,
                timestamp: new Date().toLocaleString("en-ZA"),
                note: "Updated by operator via dashboard",
              },
            ],
          }
        : o,
    );
    return latency(db.orders.find((o) => o.id === id)!);
  },
};

/* --------------------------------- analytics --------------------------------- */

export const analyticsService = {
  /** GET /api/analytics/summary */
  summary: (): Promise<KpiSummary> => {
    const lowStockItems = db.products.filter((p) => stockStatus(p) !== "in_stock").length;
    const today = "2026-09-09";
    return latency({
      totalProducts: db.products.length,
      lowStockItems,
      ordersToday: db.orders.filter((o) => o.date.startsWith(today)).length,
      totalCustomers: 921,
      monthlyRevenue: salesTrend[salesTrend.length - 1]!.revenue,
      revenueChange: 7.4,
    });
  },
  /** GET /api/analytics/sales */
  sales: (): Promise<SalesPoint[]> => latency(salesTrend),
  /** GET /api/analytics/customer-growth */
  growth: () => latency(customerGrowth),
};

/* ------------------------------- system status ------------------------------- */

export const systemService = {
  /** GET /api/health */
  health: () =>
    latency({
      services: [
        { name: "REST API", detail: "Node.js + Express · v1.4.2", status: "Online", uptime: "99.98%" },
        { name: "PostgreSQL Database", detail: "stockflow-db · eu-west", status: "Connected", uptime: "99.99%" },
        { name: "Azure Application", detail: "App Service · West Europe", status: "Healthy", uptime: "99.95%" },
        { name: "Authentication Service", detail: "JWT · refresh rotation", status: "Active", uptime: "100%" },
      ],
    }),
  /** GET /api/logs */
  logs: (): Promise<ApiEndpointLog[]> => latency(apiLogs),
};

export type { Customer, Order, Product };
