
import { createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { getToken, useSession } from "@/hooks/useSession";
import { currency, shortDate } from "@/lib/format";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — StockFlow" },
      {
        name: "description",
        content: "Manage the StockFlow product catalogue.",
      },
    ],
  }),
  component: ProductsPage,
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

type ProductForm = {
  name: string;
  sku: string;
  category: string;
  price: string;
  stock_quantity: string;
};

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  category: "",
  price: "",
  stock_quantity: "",
};

type StockFilter =
  | "all"
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

function getStockStatus(product: Product): StockFilter {
  const quantity = Number(product.stock_quantity);

  if (quantity <= 0) return "out_of_stock";
  if (quantity <= 5) return "low_stock";

  return "in_stock";
}

function stockLabel(status: StockFilter): string {
  switch (status) {
    case "in_stock":
      return "In stock";
    case "low_stock":
      return "Low stock";
    case "out_of_stock":
      return "Out of stock";
    default:
      return "All stock levels";
  }
}

function stockColor(status: StockFilter): string {
  switch (status) {
    case "in_stock":
      return "bg-emerald-500/10 text-emerald-600";
    case "low_stock":
      return "bg-amber-500/10 text-amber-600";
    case "out_of_stock":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error(
      "You are not authenticated. Please sign in again.",
    );
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed (${response.status}).`,
    );
  }

  return data as T;
}

function ProductsPage() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stock, setStock] = useState<StockFilter>("all");

  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const role = user?.role ?? "";

  const canWrite = role === "Manager" || role === "Admin";
  const canDelete = role === "Admin";

  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiRequest<Product[]>("/api/products"),
    retry: 1,
  });

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter(Boolean),
      ),
    ).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term);

      const matchesCategory =
        category === "all" ||
        product.category === category;

      const matchesStock =
        stock === "all" ||
        getStockStatus(product) === stock;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, category, stock]);

  const saveMutation = useMutation({
    mutationFn: async (values: ProductForm) => {
      const payload = {
        name: values.name.trim(),
        sku: values.sku.trim().toUpperCase(),
        category: values.category.trim(),
        price: Number(values.price),
        stock_quantity: Number(values.stock_quantity),
      };

      if (editing) {
        return apiRequest<Product>(
          `/api/products/${editing.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
      }

      return apiRequest<Product>("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["products"],
      });

      closeModal();
    },

    onError: (mutationError) => {
      setFormError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to save product.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<unknown>(`/api/products/${id}`, {
        method: "DELETE",
      }),

    onSuccess: async () => {
      setDeleteError("");

      await queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },

    onError: (mutationError) => {
      setDeleteError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to delete product.",
      );
    },
  });

  function openNew() {
    if (!canWrite) return;

    setEditing(null);
    setForm({ ...emptyForm });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    if (!canWrite) return;

    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
    });

    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm({ ...emptyForm });
    setFormError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!canWrite) {
      setFormError(
        "You do not have permission to change products.",
      );
      return;
    }

    if (form.name.trim().length < 3) {
      setFormError(
        "Product name must contain at least 3 characters.",
      );
      return;
    }

    if (!form.sku.trim()) {
      setFormError("SKU is required.");
      return;
    }

    if (!form.category.trim()) {
      setFormError("Category is required.");
      return;
    }

    if (
      form.price.trim() === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0
    ) {
      setFormError("Enter a price greater than zero.");
      return;
    }

    if (
      form.stock_quantity.trim() === "" ||
      !Number.isInteger(Number(form.stock_quantity)) ||
      Number(form.stock_quantity) < 0
    ) {
      setFormError(
        "Stock quantity must be a non-negative whole number.",
      );
      return;
    }

    saveMutation.mutate(form);
  }

  function remove(product: Product) {
    if (!canDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`,
    );

    if (!confirmed) return;

    setDeleteError("");
    deleteMutation.mutate(product.id);
  }

  return (
    <AppShell
      title="Products"
      subtitle={`${products.length} SKUs in catalogue`}
    >
      <Panel bodyClassName="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by product name or SKU..."
              aria-label="Search products"
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              aria-label="Filter by category"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="all">All categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={stock}
              onChange={(event) =>
                setStock(event.target.value as StockFilter)
              }
              aria-label="Filter by stock status"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="all">All stock levels</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>

            {canWrite && (
              <button
                type="button"
                onClick={openNew}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            )}
          </div>
        </div>
      </Panel>

      {deleteError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {deleteError}
        </div>
      )}

      <Panel className="mt-4" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {[
                  "SKU",
                  "Product Name",
                  "Category",
                  "Price",
                  "Stock",
                  "Status",
                  "Created",
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
              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    Loading products from PostgreSQL...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={8} className="px-5 py-10">
                    <div className="text-center">
                      <p className="text-sm text-destructive">
                        {error instanceof Error
                          ? error.message
                          : "Unable to load products."}
                      </p>

                      <button
                        type="button"
                        onClick={() => void refetch()}
                        className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-semibold"
                      >
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                filteredProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      No products match those filters.
                    </td>
                  </tr>
                )}

              {!isLoading &&
                !isError &&
                filteredProducts.map((product) => {
                  const status = getStockStatus(product);

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-semibold">
                        {product.sku}
                      </td>

                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => setDetail(product)}
                          className="text-left font-medium hover:text-primary hover:underline"
                        >
                          {product.name}
                        </button>
                      </td>

                      <td className="px-5 py-3 text-muted-foreground">
                        {product.category}
                      </td>

                      <td className="px-5 py-3 font-semibold tabular-nums">
                        {currency(Number(product.price))}
                      </td>

                      <td className="px-5 py-3 tabular-nums">
                        {product.stock_quantity}
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockColor(status)}`}
                        >
                          {stockLabel(status)}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {product.created_at
                          ? shortDate(product.created_at)
                          : "—"}
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => openEdit(product)}
                              aria-label={`Edit ${product.name}`}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => remove(product)}
                              disabled={deleteMutation.isPending}
                              aria-label={`Delete ${product.name}`}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                          {!canWrite && !canDelete && (
                            <span className="text-xs text-muted-foreground">
                              View only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Panel>

      {modalOpen && canWrite && (
        <Modal
          title={editing ? "Edit Product" : "Add Product"}
          onClose={closeModal}
        >
          <form
            onSubmit={submit}
            className="space-y-4"
            noValidate
          >
            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {formError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product Name">
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  placeholder="Wireless Keyboard"
                />
              </Field>

              <Field label="SKU">
                <input
                  className={inputClass}
                  value={form.sku}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      sku: event.target.value,
                    })
                  }
                  placeholder="SKU-1042"
                />
              </Field>
            </div>

            <Field label="Category">
              <input
                className={inputClass}
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value,
                  })
                }
                placeholder="Electronics"
                list="stockflow-product-categories"
              />

              <datalist id="stockflow-product-categories">
                {categories.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price (ZAR)">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className={inputClass}
                  value={form.price}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      price: event.target.value,
                    })
                  }
                  placeholder="499.99"
                />
              </Field>

              <Field label="Stock Quantity">
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={inputClass}
                  value={form.stock_quantity}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      stock_quantity: event.target.value,
                    })
                  }
                  placeholder="25"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 rounded-lg border border-border px-4 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveMutation.isPending
                  ? "Saving..."
                  : editing
                    ? "Save Changes"
                    : "Create Product"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal
          title={detail.name}
          onClose={() => setDetail(null)}
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["SKU", detail.sku],
              ["Category", detail.category],
              ["Price", currency(Number(detail.price))],
              [
                "Stock on hand",
                String(detail.stock_quantity),
              ],
              ["Stock status", stockLabel(getStockStatus(detail))],
              [
                "Created",
                detail.created_at
                  ? shortDate(detail.created_at)
                  : "—",
              ],
            ].map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                  {key}
                </dt>

                <dd className="mt-1 text-sm font-medium">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </AppShell>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground">
        {label}
      </span>

      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-pop">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4">
          <h2 className="truncate text-sm font-bold">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
