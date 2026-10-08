
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  Minus,
  PackageX,
  Plus,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/shared/KpiCard";
import { Panel } from "@/components/shared/Panel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getToken } from "@/hooks/useSession";
import { currency, number, shortDate } from "@/lib/format";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — StockFlow" },
      {
        name: "description",
        content: "Monitor real inventory levels from PostgreSQL.",
      },
    ],
  }),
  component: InventoryPage,
});

type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: string | number;
  stock_quantity: number;
  created_at: string;
};

type StockFilter =
  | "all"
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

const LOW_STOCK_THRESHOLD = 5;

function getStockStatus(product: Product) {
  if (product.stock_quantity <= 0) return "out_of_stock";
  if (product.stock_quantity <= LOW_STOCK_THRESHOLD) {
    return "low_stock";
  }
  return "in_stock";
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed (${response.status})`,
    );
  }

  return data as T;
}

function InventoryPage() {
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<StockFilter>("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => request<Product[]>("/api/products"),
  });

  const stockMutation = useMutation({
    mutationFn: async ({
      product,
      delta,
    }: {
      product: Product;
      delta: number;
    }) => {
      const newQuantity = product.stock_quantity + delta;

      if (newQuantity < 0) {
        throw new Error("Stock cannot be less than zero.");
      }

      return request<Product>(`/api/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: product.name,
          sku: product.sku,
          category: product.category,
          price: Number(product.price),
          stock_quantity: newQuantity,
        }),
      });
    },

    onSuccess: async () => {
      setErrorMessage("");
      setSuccessMessage("Stock quantity updated successfully.");

      await queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },

    onError: (error: Error) => {
      setSuccessMessage("");
      setErrorMessage(error.message);
    },
  });

  const totalUnits = products.reduce(
    (sum, product) => sum + product.stock_quantity,
    0,
  );

  const low = products.filter(
    (product) => getStockStatus(product) === "low_stock",
  ).length;

  const out = products.filter(
    (product) => getStockStatus(product) === "out_of_stock",
  ).length;

  // Estimated retail value, not inventory cost.
  const retailValue = products.reduce(
    (sum, product) =>
      sum + product.stock_quantity * Number(product.price),
    0,
  );

  const rows = products.filter(
    (product) =>
      filter === "all" || getStockStatus(product) === filter,
  );

  const adjust = (product: Product, delta: number) => {
    setErrorMessage("");
    setSuccessMessage("");

    stockMutation.mutate({ product, delta });
  };

  return (
    <AppShell
      title="Inventory"
      subtitle="Live inventory positions from PostgreSQL"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Inventory"
          value={`${number(totalUnits)} units`}
          icon={Boxes}
          hint={`${products.length} SKUs`}
        />

        <KpiCard
          label="Low Stock"
          value={number(low)}
          icon={AlertTriangle}
          accent="warning"
          hint={`1–${LOW_STOCK_THRESHOLD} units remaining`}
        />

        <KpiCard
          label="Out of Stock"
          value={number(out)}
          icon={PackageX}
          accent="danger"
          hint="0 units remaining"
        />

        <KpiCard
          label="Estimated Retail Value"
          value={currency(retailValue)}
          icon={Wallet}
          accent="success"
          hint="Selling price × stock units"
        />
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400"
        >
          {successMessage}
        </div>
      )}

      <Panel
        className="mt-4"
        title="Stock Register"
        description="Live product quantities — adjustments are saved to PostgreSQL"
        bodyClassName="p-0"
        action={
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as StockFilter)
            }
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
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading inventory from PostgreSQL...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Unable to load inventory."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {[
                    "SKU",
                    "Product",
                    "Current Stock",
                    "Low Stock Level",
                    "Stock Status",
                    "Date Added",
                    "Adjust",
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
                {rows.map((product) => {
                  const status = getStockStatus(product);

                  const progress = Math.min(
                    100,
                    Math.max(
                      0,
                      (product.stock_quantity /
                        (LOW_STOCK_THRESHOLD * 4)) *
                        100,
                    ),
                  );

                  return (
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

                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-10 font-semibold tabular-nums">
                            {product.stock_quantity}
                          </span>

                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className={
                                status === "out_of_stock"
                                  ? "h-full bg-destructive"
                                  : status === "low_stock"
                                    ? "h-full bg-warning"
                                    : "h-full bg-success"
                              }
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3 tabular-nums text-muted-foreground">
                        {LOW_STOCK_THRESHOLD}
                      </td>

                      <td className="px-5 py-3">
                        <StatusBadge value={status} />
                      </td>

                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {shortDate(product.created_at)}
                      </td>

                      <td className="px-5 py-3">
                        <div className="inline-flex items-center rounded-lg border border-border">
                          <button
                            type="button"
                            onClick={() => adjust(product, -1)}
                            disabled={
                              stockMutation.isPending ||
                              product.stock_quantity <= 0
                            }
                            aria-label={`Decrease ${product.name} stock`}
                            className="px-2 py-1.5 text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>

                          <span className="w-px self-stretch bg-border" />

                          <button
                            type="button"
                            onClick={() => adjust(product, 10)}
                            disabled={stockMutation.isPending}
                            aria-label={`Add 10 to ${product.name} stock`}
                            className="px-2 py-1.5 text-muted-foreground hover:text-success disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {rows.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No inventory items match this filter.
              </div>
            )}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
