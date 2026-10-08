
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getToken } from "@/hooks/useSession";
import { currency, dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Orders — StockFlow" },
      {
        name: "description",
        content: "Manage real customer orders in PostgreSQL.",
      },
    ],
  }),
  component: OrdersPage,
});

type Order = {
  id: number;
  customer_id: number;
  first_name: string;
  last_name: string;
  status: string;
  total_amount: string | number;
  created_at: string;
};

type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

type Product = {
  id: number;
  name: string;
  sku: string;
  price: string | number;
  stock_quantity: number;
};

type CreatedOrder = {
  id: number;
};

const tabs = [
  "all",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderTab = (typeof tabs)[number];

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
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

function OrdersPage() {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<OrderTab>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
  } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => apiRequest<Order[]>("/api/orders"),
  });

  const {
    data: customers = [],
    isLoading: customersLoading,
    isError: customersError,
  } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () =>
      apiRequest<Customer[]>("/api/customers"),
    enabled: showCreate,
  });

  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () =>
      apiRequest<Product[]>("/api/products"),
    enabled: showCreate,
  });

  const selectedProduct = products.find(
    (product) => String(product.id) === productId,
  );

  const availableProducts = products.filter(
    (product) => product.stock_quantity > 0,
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const selectedCustomerId = Number(customerId);
      const selectedProductId = Number(productId);
      const selectedQuantity = Number(quantity);

      if (!selectedCustomerId || !selectedProductId) {
        throw new Error(
          "Please select a customer and a product.",
        );
      }

      if (
        !Number.isSafeInteger(selectedQuantity) ||
        selectedQuantity <= 0
      ) {
        throw new Error(
          "Quantity must be a positive whole number.",
        );
      }

      if (
        !selectedProduct ||
        selectedQuantity > selectedProduct.stock_quantity
      ) {
        throw new Error(
          "Not enough stock available for this product.",
        );
      }

      // First request: create the order.
      const order = await apiRequest<CreatedOrder>(
        "/api/orders",
        {
          method: "POST",
          body: JSON.stringify({
            customer_id: selectedCustomerId,
            status: "Pending",
          }),
        },
      );

      // Second request: add an item and deduct stock.
      try {
        await apiRequest("/api/orders/items", {
          method: "POST",
          body: JSON.stringify({
            order_id: order.id,
            product_id: selectedProductId,
            quantity: selectedQuantity,
          }),
        });
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : "Unknown error";

        throw new Error(
          `Order #${order.id} was created, but adding the product failed: ${reason}. The order may be empty. Check the order before trying again.`,
        );
      }

      return order;
    },

    onSuccess: (order) => {
      setFormError("");
      setSuccess(
        `Order #${order.id} created successfully. Inventory has been updated.`,
      );
      setShowCreate(false);
      setCustomerId("");
      setProductId("");
      setQuantity("1");
      setTab("all");
    },

    onError: (error: Error) => {
      setFormError(error.message);
    },

    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["orders"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["products"],
        }),
      ]);
    },
  });

  const submitOrder = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");
    createMutation.mutate();
  };

  const rows = orders.filter(
    (order) =>
      tab === "all" ||
      order.status.toLowerCase() === tab,
  );

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20";

  return (
    <AppShell
      title="Orders"
      subtitle={`${orders.length} orders in PostgreSQL`}
    >
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setFormError("");
            setSuccess("");
            setShowCreate(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Order
        </button>
      </div>

      {success && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
        >
          {success}
        </div>
      )}

      <Panel bodyClassName="p-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((currentTab) => {
            const count =
              currentTab === "all"
                ? orders.length
                : orders.filter(
                    (order) =>
                      order.status.toLowerCase() ===
                      currentTab,
                  ).length;

            return (
              <button
                key={currentTab}
                type="button"
                onClick={() => setTab(currentTab)}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-semibold capitalize transition-colors",
                  tab === currentTab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {currentTab === "all"
                  ? "All Orders"
                  : currentTab}

                <span className="ml-2 text-xs opacity-70">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel className="mt-4" bodyClassName="p-0">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading orders from PostgreSQL...
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="p-10 text-center text-sm text-destructive"
          >
            {error instanceof Error
              ? error.message
              : "Unable to load orders."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {[
                    "Order Number",
                    "Customer",
                    "Date",
                    "Items",
                    "Total",
                    "Payment",
                    "Status",
                    "Actions",
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
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      {orders.length === 0
                        ? "No orders found in PostgreSQL."
                        : "No orders with this status."}
                    </td>
                  </tr>
                )}

                {rows.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to="/orders/$orderId"
                        params={{
                          orderId: String(order.id),
                        }}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {`ORD-${String(order.id).padStart(5, "0")}`}
                      </Link>
                    </td>

                    <td className="px-5 py-3 font-medium">
                      {order.first_name} {order.last_name}
                    </td>

                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {dateTime(order.created_at)}
                    </td>

                    <td className="px-5 py-3 text-muted-foreground">
                      —
                    </td>

                    <td className="px-5 py-3 font-semibold tabular-nums">
                      {currency(Number(order.total_amount))}
                    </td>

                    <td className="px-5 py-3 text-muted-foreground">
                      —
                    </td>

                    <td className="px-5 py-3">
                      <StatusBadge
                        value={order.status.toLowerCase()}
                      />
                    </td>

                    <td className="px-5 py-3">
                      <Link
                        to="/orders/$orderId"
                        params={{
                          orderId: String(order.id),
                        }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-order-title"
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2
                  id="create-order-title"
                  className="text-lg font-bold"
                >
                  Create Order
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select a customer and a product.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={createMutation.isPending}
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-2 hover:bg-muted disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={submitOrder}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="order-customer"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Customer
                </label>

                <select
                  id="order-customer"
                  className={inputClass}
                  value={customerId}
                  onChange={(event) =>
                    setCustomerId(event.target.value)
                  }
                  required
                  disabled={
                    createMutation.isPending ||
                    customersLoading ||
                    customersError
                  }
                >
                  <option value="">
                    {customersLoading
                      ? "Loading customers..."
                      : customersError
                        ? "Unable to load customers"
                        : "Select customer"}
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.first_name}{" "}
                      {customer.last_name} — {customer.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="order-product"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Product
                </label>

                <select
                  id="order-product"
                  className={inputClass}
                  value={productId}
                  onChange={(event) =>
                    setProductId(event.target.value)
                  }
                  required
                  disabled={
                    createMutation.isPending ||
                    productsLoading ||
                    productsError
                  }
                >
                  <option value="">
                    {productsLoading
                      ? "Loading products..."
                      : productsError
                        ? "Unable to load products"
                        : "Select product"}
                  </option>

                  {availableProducts.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} —{" "}
                      {product.stock_quantity} available
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="order-quantity"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Quantity
                </label>

                <input
                  id="order-quantity"
                  type="number"
                  min={1}
                  max={
                    selectedProduct?.stock_quantity
                  }
                  step={1}
                  required
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  disabled={createMutation.isPending}
                  className={inputClass}
                />
              </div>

              {selectedProduct && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span>Available stock</span>
                    <strong>
                      {selectedProduct.stock_quantity}
                    </strong>
                  </div>

                  <div className="mt-2 flex justify-between">
                    <span>Estimated order total</span>
                    <strong>
                      {currency(
                        Number(selectedProduct.price) *
                          (Number(quantity) || 0),
                      )}
                    </strong>
                  </div>
                </div>
              )}

              {customers.length === 0 &&
                !customersLoading &&
                !customersError && (
                  <p className="text-sm text-amber-600">
                    No customers available. Create a
                    customer first.
                  </p>
                )}

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  disabled={createMutation.isPending}
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    customersLoading ||
                    productsLoading ||
                    customersError ||
                    productsError ||
                    customers.length === 0 ||
                    availableProducts.length === 0
                  }
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createMutation.isPending
                    ? "Creating..."
                    : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
