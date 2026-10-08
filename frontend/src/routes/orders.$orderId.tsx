
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useSession, getToken } from "@/hooks/useSession";
import { currency, dateTime } from "@/lib/format";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order details — StockFlow" },
      {
        name: "description",
        content: "View real customer orders and purchased products.",
      },
    ],
  }),
  component: OrderDetailPage,
});

type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

type OrderItem = {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  quantity: number;
  unit_price: string | number;
};

type Order = {
  id: number;
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: OrderStatus;
  total_amount: string | number;
  created_at: string;
  items: OrderItem[];
};

const statuses: OrderStatus[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

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

function OrderDetailPage() {
  const { orderId } = useParams({
    from: "/orders/$orderId",
  });

  const queryClient = useQueryClient();
  const session = useSession();

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery<Order>({
    queryKey: ["orders", orderId],
    queryFn: () =>
      apiRequest<Order>(`/api/orders/${orderId}`),
  });

  const updateMutation = useMutation({
    mutationFn: (status: OrderStatus) =>
      apiRequest<Order>(`/api/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["orders"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["orders", orderId],
        }),
      ]);
    },
  });

  const userRole = session?.user?.role;

  const canUpdateStatus =
    userRole === "Admin" || userRole === "Manager";

  if (isLoading) {
    return (
      <AppShell title="Order details">
        <Panel>
          <p className="text-sm text-muted-foreground">
            Loading order from PostgreSQL...
          </p>
        </Panel>
      </AppShell>
    );
  }

  if (isError || !order) {
    return (
      <AppShell title="Order details">
        <Panel>
          <p className="text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Order not found."}
          </p>
          <Link
            to="/orders"
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            Back to orders
          </Link>
        </Panel>
      </AppShell>
    );
  }

  const orderNumber =
    `ORD-${String(order.id).padStart(5, "0")}`;

  const subtotal = order.items.reduce(
    (sum, item) =>
      sum +
      Number(item.unit_price) * item.quantity,
    0,
  );

  return (
    <AppShell
      title={`Order ${orderNumber}`}
      subtitle={`Placed ${dateTime(order.created_at)}`}
    >
      <Link
        to="/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to orders
      </Link>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel title="Line items" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    {[
                      "SKU",
                      "Product",
                      "Qty",
                      "Unit price",
                      "Line total",
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
                  {order.items.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-sm text-muted-foreground"
                      >
                        No products have been added to this order.
                      </td>
                    </tr>
                  )}

                  {order.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-5 py-3 font-mono text-xs">
                        {item.sku}
                      </td>

                      <td className="px-5 py-3 font-medium">
                        {item.name}
                      </td>

                      <td className="px-5 py-3 tabular-nums">
                        {item.quantity}
                      </td>

                      <td className="px-5 py-3 tabular-nums">
                        {currency(Number(item.unit_price))}
                      </td>

                      <td className="px-5 py-3 font-semibold tabular-nums">
                        {currency(
                          Number(item.unit_price) *
                            item.quantity,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 border-t border-border px-5 py-4 text-sm">
              <Row
                label="Items subtotal"
                value={currency(subtotal)}
              />

              <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Order total</span>
                <span className="tabular-nums">
                  {currency(Number(order.total_amount))}
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Order timeline">
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>

                <div>
                  <p className="text-sm font-semibold">
                    Order created
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Order saved to PostgreSQL
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dateTime(order.created_at)}
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>

                <div>
                  <p className="text-sm font-semibold">
                    Current status: {order.status}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Latest status stored in PostgreSQL.
                    Status-change timestamps are not yet tracked.
                  </p>
                </div>
              </li>
            </ol>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Customer">
            <p className="text-sm font-bold">
              {order.first_name} {order.last_name}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {order.email}
            </p>

            <Link
              to="/customers/$customerId"
              params={{
                customerId: String(order.customer_id),
              }}
              className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
            >
              View customer profile
            </Link>
          </Panel>

          <Panel title="Status">
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                value={order.status.toLowerCase()}
              />
            </div>

            {canUpdateStatus ? (
              <>
                <p className="mt-4 text-xs font-semibold">
                  Change order status
                </p>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={
                        updateMutation.isPending ||
                        order.status === status
                      }
                      onClick={() =>
                        updateMutation.mutate(status)
                      }
                      className={
                        order.status === status
                          ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                          : "rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                      }
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {updateMutation.isError && (
                  <p
                    role="alert"
                    className="mt-3 text-xs text-destructive"
                  >
                    {updateMutation.error instanceof Error
                      ? updateMutation.error.message
                      : "Unable to update order status."}
                  </p>
                )}

                {updateMutation.isSuccess &&
                  !updateMutation.isPending && (
                    <p
                      role="status"
                      className="mt-3 text-xs text-green-600"
                    >
                      Order status updated.
                    </p>
                  )}

                <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                  PUT /api/orders/{order.id}
                </p>
              </>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                Only Managers and Admins can update order status.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
