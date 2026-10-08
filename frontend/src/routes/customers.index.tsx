
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus, Search, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { getToken } from "@/hooks/useSession";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — StockFlow" },
      {
        name: "description",
        content: "Manage customer accounts stored in PostgreSQL.",
      },
    ],
  }),
  component: CustomersPage,
});

type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
};

type CustomerForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

const emptyForm: CustomerForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
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

function CustomersPage() {
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    data: customers = [],
    isLoading,
    isError,
    error,
  } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () =>
      apiRequest<Customer[]>("/api/customers"),
  });

  const createMutation = useMutation({
    mutationFn: (newCustomer: CustomerForm) =>
      apiRequest<Customer>("/api/customers", {
        method: "POST",
        body: JSON.stringify(newCustomer),
      }),

    onSuccess: async () => {
      setShowCreate(false);
      setForm({ ...emptyForm });
      setFormError("");
      setSuccess("Customer created successfully.");

      await queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
    },

    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const submitCustomer = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    const payload: CustomerForm = {
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

    createMutation.mutate(payload);
  };

  const search = q.trim().toLowerCase();

  const rows = customers.filter((customer) => {
    const name =
      `${customer.first_name} ${customer.last_name}`.toLowerCase();

    return (
      name.includes(search) ||
      customer.email.toLowerCase().includes(search) ||
      (customer.phone ?? "").toLowerCase().includes(search)
    );
  });

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20";

  return (
    <AppShell
      title="Customers"
      subtitle={`${customers.length} customer accounts in PostgreSQL`}
    >
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setForm({ ...emptyForm });
            setFormError("");
            setSuccess("");
            setShowCreate(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Customer
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

      <Panel bodyClassName="p-4">
        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search customers by name, email or phone..."
            aria-label="Search customers"
            className="h-10 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
        </label>
      </Panel>

      <Panel className="mt-4" bodyClassName="p-0">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading customers from PostgreSQL...
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="p-10 text-center text-sm text-destructive"
          >
            {error instanceof Error
              ? error.message
              : "Unable to load customers."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {[
                    "Customer Name",
                    "Email",
                    "Phone",
                    "Orders",
                    "Total Spent",
                    "Last Order",
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
                      {customers.length === 0
                        ? "No customers found in PostgreSQL."
                        : "No customers match your search."}
                    </td>
                  </tr>
                )}

                {rows.map((customer) => {
                  const name =
                    `${customer.first_name} ${customer.last_name}`;

                  const initials =
                    `${customer.first_name.charAt(0)}${customer.last_name.charAt(0)}`.toUpperCase();

                  return (
                    <tr
                      key={customer.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-5 py-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                            {initials}
                          </span>

                          <span className="truncate font-medium">
                            {name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-muted-foreground">
                        {customer.email}
                      </td>

                      <td className="px-5 py-3 text-muted-foreground">
                        {customer.phone || "—"}
                      </td>

                      <td className="px-5 py-3 text-muted-foreground">
                        —
                      </td>

                      <td className="px-5 py-3 text-muted-foreground">
                        —
                      </td>

                      <td className="px-5 py-3 text-muted-foreground">
                        —
                      </td>

                      <td className="px-5 py-3 text-muted-foreground">
                        —
                      </td>

                      <td className="px-5 py-3">
                        <Link
                          to="/customers/$customerId"
                          params={{
                            customerId: String(customer.id),
                          }}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          View profile
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
            aria-labelledby="create-customer-title"
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2
                  id="create-customer-title"
                  className="text-lg font-bold"
                >
                  Add Customer
                </h2>

                <p className="text-sm text-muted-foreground">
                  Register a customer in PostgreSQL.
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
              onSubmit={submitCustomer}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="customer-first-name"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  First Name
                </label>

                <input
                  id="customer-first-name"
                  className={inputClass}
                  value={form.first_name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      first_name: event.target.value,
                    })
                  }
                  required
                  disabled={createMutation.isPending}
                  placeholder="e.g. Sipho"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-last-name"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Last Name
                </label>

                <input
                  id="customer-last-name"
                  className={inputClass}
                  value={form.last_name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      last_name: event.target.value,
                    })
                  }
                  required
                  disabled={createMutation.isPending}
                  placeholder="e.g. Dlamini"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-email"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Email
                </label>

                <input
                  id="customer-email"
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
                  disabled={createMutation.isPending}
                  placeholder="sipho@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-phone"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Phone
                </label>

                <input
                  id="customer-phone"
                  type="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target.value,
                    })
                  }
                  disabled={createMutation.isPending}
                  placeholder="0712345678"
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
                  disabled={createMutation.isPending}
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createMutation.isPending
                    ? "Saving..."
                    : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
