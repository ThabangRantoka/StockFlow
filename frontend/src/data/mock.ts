import type { ApiEndpointLog, Customer, Order, Product, SalesPoint } from "@/types";

export const categories = [
  "Smartphones",
  "Laptops",
  "Headphones",
  "Smart Watches",
  "Chargers",
  "Tablets",
  "Accessories",
];

type ProductSeed = [string, string, string, number, number, number, number, string];

const productSeeds: ProductSeed[] = [
  ["SKU-1001", "Aurora X5 Smartphone", "Smartphones", 18999, 14200, 142, 25, "6.7-inch AMOLED flagship with a 200MP camera system."],
  ["SKU-1002", "Aurora Lite 5G", "Smartphones", 8499, 6100, 18, 20, "Affordable 5G handset with a 5000mAh battery."],
  ["SKU-1003", "Nimbus Pro 14 Laptop", "Laptops", 32499, 25800, 46, 10, "14-inch ultrabook, 32GB RAM, 1TB NVMe SSD."],
  ["SKU-1004", "Nimbus Air 13", "Laptops", 21999, 17400, 7, 12, "Fanless 13-inch laptop with 18-hour battery life."],
  ["SKU-1005", "PulseBeat ANC Headphones", "Headphones", 4299, 2650, 210, 40, "Over-ear active noise cancelling, 40h playback."],
  ["SKU-1006", "PulseBeat Buds Mini", "Headphones", 1499, 820, 0, 30, "True wireless earbuds with charging case."],
  ["SKU-1007", "Chrono Fit 3 Smart Watch", "Smart Watches", 5299, 3400, 88, 20, "AMOLED fitness watch with GPS and ECG."],
  ["SKU-1008", "Chrono Active Band", "Smart Watches", 1299, 690, 14, 15, "Lightweight activity tracker with sleep insights."],
  ["SKU-1009", "VoltEdge 65W GaN Charger", "Chargers", 899, 410, 320, 50, "Compact dual USB-C fast charger."],
  ["SKU-1010", "VoltEdge Wireless Pad", "Chargers", 649, 280, 22, 25, "15W Qi2 magnetic charging pad."],
  ["SKU-1011", "Slate Tab 11 Pro", "Tablets", 12999, 9700, 54, 15, "11-inch 120Hz tablet with stylus support."],
  ["SKU-1012", "Slate Tab Go", "Tablets", 4999, 3550, 3, 10, "Entry-level 10-inch tablet for media and study."],
  ["SKU-1013", "Carbon Laptop Sleeve 14", "Accessories", 749, 310, 175, 30, "Water-resistant padded sleeve."],
  ["SKU-1014", "Aurora Clear Case", "Accessories", 349, 120, 0, 40, "Shockproof transparent phone case."],
  ["SKU-1015", "Nimbus USB-C Hub 8-in-1", "Accessories", 1199, 560, 63, 20, "HDMI, ethernet, SD and 100W passthrough."],
  ["SKU-1016", "Chrono Sport Strap", "Accessories", 429, 150, 11, 25, "Breathable silicone strap, 22mm."],
];

export const products: Product[] = productSeeds.map(
  ([sku, name, category, price, cost, stock, reorderLevel, description], i) => ({
    id: `p-${i + 1}`,
    sku,
    name,
    category,
    price,
    cost,
    stock,
    reorderLevel,
    description,
    status: stock === 0 && i % 7 === 5 ? "draft" : "active",
    imageUrl: "",
    updatedAt: `2026-09-${String(((i * 3) % 8) + 1).padStart(2, "0")}T09:${String((i * 7) % 60).padStart(2, "0")}:00Z`,
  }),
);

type CustomerSeed = [string, string, string, string, number, number, string, Customer["status"]];

const customerSeeds: CustomerSeed[] = [
  ["Thandi Mokoena", "thandi.mokoena@brightretail.co.za", "+27 82 441 7720", "Johannesburg", 14, 148320, "2026-09-08", "active"],
  ["Sipho Dlamini", "sipho.dlamini@nexuscorp.co.za", "+27 83 209 1145", "Pretoria", 9, 96450, "2026-09-07", "active"],
  ["Anika Pillay", "anika.pillay@gmail.com", "+27 71 883 5502", "Durban", 21, 213990, "2026-09-09", "active"],
  ["Johan van Wyk", "johan.vw@capegear.co.za", "+27 84 116 9034", "Cape Town", 6, 54210, "2026-08-29", "active"],
  ["Lerato Nkosi", "lerato.nkosi@outlook.com", "+27 76 552 3311", "Soweto", 3, 18740, "2026-07-14", "inactive"],
  ["Michael Chen", "m.chen@orbitsupply.com", "+27 82 771 4408", "Sandton", 17, 176520, "2026-09-06", "active"],
  ["Fatima Adams", "fatima.adams@zenithlabs.co.za", "+27 79 330 8812", "Gqeberha", 5, 41880, "2026-08-18", "active"],
  ["Peter Botha", "peter.botha@gmail.com", "+27 72 604 2277", "Bloemfontein", 2, 9640, "2026-06-30", "inactive"],
];

export const customers: Customer[] = customerSeeds.map(
  ([name, email, phone, city, orders, totalSpent, lastOrder, status], i) => ({
    id: `c-${i + 1}`,
    name,
    email,
    phone,
    city,
    orders,
    totalSpent,
    lastOrder,
    status,
  }),
);

type OrderSeed = [string, number, number[], Order["status"], Order["payment"], Order["channel"], string];

const orderSeeds: OrderSeed[] = [
  ["2026-09-09", 2, [0, 4], "processing", "paid", "Online", "10:24"],
  ["2026-09-09", 0, [2], "pending", "unpaid", "Online", "09:11"],
  ["2026-09-09", 5, [8, 12, 14], "completed", "paid", "In-store", "08:47"],
  ["2026-09-08", 1, [6, 10], "completed", "paid", "Marketplace", "16:02"],
  ["2026-09-08", 3, [1], "cancelled", "refunded", "Online", "13:38"],
  ["2026-09-07", 2, [3, 8], "processing", "paid", "Online", "11:20"],
  ["2026-09-07", 6, [4, 15], "completed", "paid", "In-store", "10:05"],
  ["2026-09-06", 0, [10, 12], "pending", "unpaid", "Online", "15:44"],
  ["2026-09-06", 5, [0], "completed", "paid", "Marketplace", "12:19"],
  ["2026-09-05", 7, [6, 13], "processing", "paid", "Online", "14:52"],
  ["2026-09-05", 4, [2, 8, 14], "completed", "paid", "In-store", "09:33"],
  ["2026-09-04", 1, [11], "cancelled", "refunded", "Online", "17:26"],
];

export const orders: Order[] = orderSeeds.map(
  ([date, ci, pidx, status, payment, channel, time], i) => {
    const customer = customers[ci]!;
    const items = pidx.map((p, k) => {
      const prod = products[p]!;
      return {
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        quantity: ((i + k) % 3) + 1,
        price: prod.price,
      };
    });
    const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const timeline = [
      {
        label: "Order placed",
        timestamp: `${date} ${time}`,
        note: `Received via ${channel} channel`,
      },
      {
        label:
          "Payment " +
          (payment === "paid" ? "confirmed" : payment === "refunded" ? "refunded" : "awaiting"),
        timestamp: `${date} ${time}`,
        note: "Gateway reference PAY-" + (48210 + i),
      },
    ];
    if (status === "processing" || status === "completed")
      timeline.push({ label: "Picked & packed", timestamp: `${date} 18:00`, note: "Warehouse JHB-01" });
    if (status === "completed")
      timeline.push({ label: "Delivered", timestamp: `${date} 19:40`, note: "Signed for by recipient" });
    if (status === "cancelled")
      timeline.push({ label: "Cancelled", timestamp: `${date} 20:10`, note: "Cancelled at customer request" });

    return {
      id: `o-${i + 1}`,
      number: `ORD-${10250 + i}`,
      customerId: customer.id,
      customerName: customer.name,
      date: `${date}T${time}:00Z`,
      items,
      total,
      payment,
      status,
      channel,
      timeline,
    };
  },
);

export const salesTrend: SalesPoint[] = [
  { month: "Jan", revenue: 412000, orders: 168 },
  { month: "Feb", revenue: 438500, orders: 181 },
  { month: "Mar", revenue: 502300, orders: 205 },
  { month: "Apr", revenue: 478900, orders: 193 },
  { month: "May", revenue: 561400, orders: 228 },
  { month: "Jun", revenue: 598200, orders: 241 },
  { month: "Jul", revenue: 572600, orders: 233 },
  { month: "Aug", revenue: 641800, orders: 262 },
  { month: "Sep", revenue: 689350, orders: 274 },
];

export const customerGrowth = [
  { month: "Apr", customers: 612 },
  { month: "May", customers: 668 },
  { month: "Jun", customers: 731 },
  { month: "Jul", customers: 789 },
  { month: "Aug", customers: 854 },
  { month: "Sep", customers: 921 },
];

export const apiLogs: ApiEndpointLog[] = [
  { method: "GET", path: "/api/products", status: 200, latencyMs: 84, time: "09:41:22" },
  { method: "POST", path: "/api/products", status: 201, latencyMs: 132, time: "09:40:58" },
  { method: "GET", path: "/api/orders", status: 200, latencyMs: 96, time: "09:40:11" },
  { method: "POST", path: "/api/orders", status: 201, latencyMs: 178, time: "09:39:47" },
  { method: "GET", path: "/api/customers", status: 200, latencyMs: 72, time: "09:38:03" },
  { method: "PATCH", path: "/api/orders/:id/status", status: 200, latencyMs: 109, time: "09:37:36" },
  { method: "GET", path: "/api/products/SKU-9999", status: 404, latencyMs: 41, time: "09:36:12" },
  { method: "DELETE", path: "/api/products/:id", status: 200, latencyMs: 118, time: "09:35:02" },
];
