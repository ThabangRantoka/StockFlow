export type ProductStatus = "active" | "draft" | "discontinued";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
export type PaymentStatus = "paid" | "unpaid" | "refunded";
export type CustomerStatus = "active" | "inactive";
export type UserRole = "Admin" | "Manager" | "Employee";

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorderLevel: number;
  status: ProductStatus;
  imageUrl: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
  status: CustomerStatus;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderEvent {
  label: string;
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  date: string;
  items: OrderItem[];
  total: number;
  payment: PaymentStatus;
  status: OrderStatus;
  channel: "Online" | "In-store" | "Marketplace";
  timeline: OrderEvent[];
}

export interface KpiSummary {
  totalProducts: number;
  lowStockItems: number;
  ordersToday: number;
  totalCustomers: number;
  monthlyRevenue: number;
  revenueChange: number;
}

export interface SalesPoint {
  month: string;
  revenue: number;
  orders: number;
}

export interface ApiEndpointLog {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  status: number;
  latencyMs: number;
  time: string;
}

export interface SessionUser {
  name: string;
  email: string;
  role: UserRole;
  initials: string;
}

export function stockStatus(p: Pick<Product, "stock" | "reorderLevel">): StockStatus {
  if (p.stock <= 0) return "out_of_stock";
  if (p.stock <= p.reorderLevel) return "low_stock";
  return "in_stock";
}
