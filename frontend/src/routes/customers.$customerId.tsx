
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Phone,
  Pencil,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getToken } from "@/hooks/useSession";
import { currency, shortDate } from "@/lib/format";

export const Route = createFileRoute("/customers/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer profile — StockFlow" },
      {
        name: "description",
        content: "Customer contact details and real order history.",
      },
    ],
  }),
  component: CustomerDetailPage,
});

type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
};

type Order = {
  id: number;
  customer_id: number;
  first_name: string;
  last_name: string;
  status: string;
  total_amount: string | number;
  created_at: string;
};

type CustomerForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

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

function CustomerDetailPage() {
  const { customerId } = useParams({
    from: "/customers/$customerId",
  });

  const queryClient = useQueryClient();

  const [showEdit, setShowEdit] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<CustomerForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const {
    data: customers = [],
    isLoading: customersLoading,
    isError: customersError,
    error: customerError,
  } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () =>
      apiRequest<Customer[]>("/api/customers"),
  });

  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersQueryError,
  } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () =>
      apiRequest<Order[]>("/api/orders"),
  });

  const customer = customers.find(
    (item) => String(item.id) === customerId,
  );

  const history = orders.filter(
    (order) => String(order.customer_id) === customerId,
  );

  const totalSpent = history.reduce(
    (sum, order) => sum + Number(order.total_amount),
    0,
  );

  const latestOrder =
    history.length > 0
      ? [...history].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        )[0]
      : null;

  useEffect(() => {
    if (customer && !showEdit) {
      setForm({
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone ?? "",
      });
    }
  }, [customer, showEdit]);

  const updateMutation = useMutation({
    mutationFn: (payload: CustomerForm) =>
      apiRequest<Customer>(
        `/api/customers/${customerId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      ),

    onSuccess: async () => {
      setShowEdit(false);
      setFormError("");
      setSuccess("Customer details updated successfully.");

      await queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
    },

    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const submitEdit = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    if (
      !payload.first_name ||
      !payload.last_name ||
      !payload.email
    ) {
      setFormError(
        "First name, last name and email are required.",
      );
      return;
    }

    updateMutation.mutate(payload);
  };

  if (customersLoading) {
    return (
      <AppShell title="Customer profile">
        <Panel>
          <p className="text-sm text-muted-foreground">
            Loading customer from PostgreSQL...
          </p>
        </Panel>
      </AppShell>
    );
  }

  if (customersError || !customer) {
    return (
      <AppShell title="Customer profile">
        <Panel>
          <p className="text-sm text-destructive">
            {customerError instanceof Error
              ? customerError.message
              : "Customer not found."}
          </p>

          <Link
            to="/customers"
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            Back to customers
          </Link>
        </Panel>
      </AppShell>
    );
  }

  const name =
    `${customer.first_name} ${customer.last_name}`;

  const initials =
    `${customer.first_name.charAt(0)}${customer.last_name.charAt(0)}`.toUpperCase();

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20";

  return (
    <AppShell
      title={name}
      subtitle="Customer profile from PostgreSQL"
    >
      <Link
        to="/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to customers
      </Link>

      {success && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
        >
          {success}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Profile">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {initials}
            </span>

            <div className="min-w-0">
              <p className="truncate font-bold">{name}</p>
              <p className="text-xs text-muted-foreground">
                Customer #{customer.id}
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {customer.email}
              </span>
            </li>

            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              {customer.phone || "No phone number"}
            </li>
          </ul>

          <button
            type="button"
            onClick={() => {
              setForm({
                first_name: customer.first_name,
                last_name: customer.last_name,
                email: customer.email,
                phone: customer.phone ?? "",
              });
              setFormError("");
              setSuccess("");
              setShowEdit(true);
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Pencil className="h-4 w-4" />
            Edit Customer
          </button>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
            <Stat
              label="Orders"
              value={
                ordersLoading || ordersError
                  ? "—"
                  : String(history.length)
              }
            />

            <Stat
              label="Spend"
              value={
                ordersLoading || ordersError
                  ? "—"
                  : currency(totalSpent)
              }
            />

            <Stat
              label="Last"
              value={
                ordersLoading || ordersError
                  ? "—"
                  : latestOrder
                    ? shortDate(latestOrder.created_at)
                    : "—"
              }
            />
          </div>
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Order history"
          bodyClassName="p-0"
        >
          {ordersLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading order history...
            </div>
          ) : ordersError ? (
            <div
              role="alert"
              className="p-8 text-center text-sm text-destructive"
            >
              {ordersQueryError instanceof Error
                ? ordersQueryError.message
                : "Unable to load order history."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    {[
                      "Order",
                      "Date",
                      "Items",
                      "Total",
                      "Payment",
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
                  {history.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-muted-foreground"
                      >
                        No orders found for this customer.
                      </td>
                    </tr>
                  )}

                  {history.map((order) => (
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

                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {shortDate(order.created_at)}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-customer-title"
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2
                  id="edit-customer-title"
                  className="text-lg font-bold"
                >
                  Edit Customer
                </h2>

                <p className="text-sm text-muted-foreground">
                  Update customer details in PostgreSQL.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={updateMutation.isPending}
                onClick={() => setShowEdit(false)}
                className="rounded-lg p-2 hover:bg-muted disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={submitEdit}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="edit-first-name"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  First Name
                </label>

                <input
                  id="edit-first-name"
                  className={inputClass}
                  value={form.first_name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      first_name: event.target.value,
                    })
                  }
                  required
                  disabled={updateMutation.isPending}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-last-name"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Last Name
                </label>

                <input
                  id="edit-last-name"
                  className={inputClass}
                  value={form.last_name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      last_name: event.target.value,
                    })
                  }
                  required
                  disabled={updateMutation.isPending}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-email"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Email
                </label>

                <input
                  id="edit-email"
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email: event.target.value,
                    })
                  }
                  required
                  disabled={updateMutation.isPending}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-phone"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Phone
                </label>

                <input
                  id="edit-phone"
                  type="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target.value,
                    })
                  }
                  disabled={updateMutation.isPending}
                />
              </div>

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
                  disabled={updateMutation.isPending}
                  onClick={() => setShowEdit(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm font-bold tabular-nums">
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}
