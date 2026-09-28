import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Boxes, Minus, PackageX, Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/shared/KpiCard";
import { Panel } from "@/components/shared/Panel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useProducts } from "@/hooks/useStockflow";
import { currency, number, shortDate } from "@/lib/format";
import { productService } from "@/services/api";
import { stockStatus } from "@/types";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — StockFlow" },
      { name: "description", content: "Monitor stock levels, reorder points and inventory value across the catalogue." },
      { property: "og:title", content: "Inventory — StockFlow" },
      { property: "og:description", content: "Monitor stock levels, reorder points and inventory value." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const qc = useQueryClient();
  const { data: products = [] } = useProducts();
  const [filter, setFilter] = useState("all");

  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const low = products.filter((p) => stockStatus(p) === "low_stock").length;
  const out = products.filter((p) => stockStatus(p) === "out_of_stock").length;
  const value = products.reduce((s, p) => s + p.stock * p.cost, 0);

  const rows = products.filter((p) => filter === "all" || stockStatus(p) === filter);

  const adjust = async (id: string, current: number, delta: number) => {
    await productService.adjustStock(id, current + delta);
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <AppShell title="Inventory" subtitle="Warehouse JHB-01 · live stock positions">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Inventory" value={`${number(totalUnits)} units`} icon={Boxes} hint={`${products.length} SKUs`} />
        <KpiCard label="Low Stock" value={number(low)} icon={AlertTriangle} accent="warning" hint="at or below reorder level" />
        <KpiCard label="Out of Stock" value={number(out)} icon={PackageX} accent="danger" hint="requires purchase order" />
        <KpiCard label="Inventory Value" value={currency(value)} icon={Wallet} accent="success" change={4.2} />
      </div>

      <Panel
        className="mt-4"
        title="Stock Register"
        description="Adjust quantities directly — changes post through the inventory service"
        bodyClassName="p-0"
        action={
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter inventory"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="all">All items</option>
            <option value="in_stock">In stock</option>
            <option value="low_stock">Low stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {["SKU", "Product", "Current Stock", "Reorder Level", "Stock Status", "Last Updated", "Adjust"].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold">{p.sku}</td>
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-10 font-semibold tabular-nums">{p.stock}</span>
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className={
                            stockStatus(p) === "out_of_stock"
                              ? "h-full bg-destructive"
                              : stockStatus(p) === "low_stock"
                                ? "h-full bg-warning"
                                : "h-full bg-success"
                          }
                          style={{ width: `${Math.min(100, (p.stock / (p.reorderLevel * 4 || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">{p.reorderLevel}</td>
                  <td className="px-5 py-3"><StatusBadge value={stockStatus(p)} /></td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{shortDate(p.updatedAt)}</td>
                  <td className="px-5 py-3">
                    <div className="inline-flex items-center rounded-lg border border-border">
                      <button onClick={() => adjust(p.id, p.stock, -1)} aria-label={`Decrease ${p.name} stock`} className="px-2 py-1.5 text-muted-foreground hover:text-destructive">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-px self-stretch bg-border" />
                      <button onClick={() => adjust(p.id, p.stock, 10)} aria-label={`Add 10 to ${p.name} stock`} className="px-2 py-1.5 text-muted-foreground hover:text-success">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
