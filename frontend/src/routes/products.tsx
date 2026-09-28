import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { categories } from "@/data/mock";
import { useProducts } from "@/hooks/useStockflow";
import { currency, shortDate } from "@/lib/format";
import { productService } from "@/services/api";
import { stockStatus, type Product } from "@/types";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — StockFlow" },
      { name: "description", content: "Manage the retail product catalogue: SKUs, pricing, categories and stock." },
      { property: "og:title", content: "Products — StockFlow" },
      { property: "og:description", content: "Manage SKUs, pricing, categories and stock levels." },
    ],
  }),
  component: ProductsPage,
});

const empty = {
  name: "",
  sku: "",
  description: "",
  category: categories[0]!,
  price: "",
  stock: "",
  imageUrl: "",
  status: "active" as Product["status"],
  reorderLevel: "20",
};

function ProductsPage() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useProducts();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [stock, setStock] = useState("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rows = useMemo(
    () =>
      products.filter(
        (p) =>
          (p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.sku.toLowerCase().includes(q.toLowerCase())) &&
          (category === "all" || p.category === category) &&
          (stock === "all" || stockStatus(p) === stock),
      ),
    [products, q, category, stock],
  );

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      description: p.description,
      category: p.category,
      price: String(p.price),
      stock: String(p.stock),
      imageUrl: p.imageUrl,
      status: p.status,
      reorderLevel: String(p.reorderLevel),
    });
    setErrors({});
    setOpen(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 3) next['name'] = "Product name must be at least 3 characters.";
    if (!/^SKU-\d{3,}$/i.test(form.sku.trim())) next['sku'] = "Use the SKU-#### format, e.g. SKU-1042.";
    if (!form.price || Number(form.price) <= 0) next['price'] = "Enter a price greater than zero.";
    if (form.stock === "" || Number(form.stock) < 0) next['stock'] = "Stock quantity cannot be negative.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      description: form.description,
      category: form.category,
      price: Number(form.price),
      cost: Math.round(Number(form.price) * 0.68),
      stock: Number(form.stock),
      reorderLevel: Number(form.reorderLevel || 20),
      status: form.status,
      imageUrl: form.imageUrl,
    };
    if (editing) await productService.update(editing.id, payload);
    else await productService.create(payload);
    await qc.invalidateQueries({ queryKey: ["products"] });
    setOpen(false);
  };

  const remove = async (p: Product) => {
    await productService.remove(p.id);
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <AppShell title="Products" subtitle={`${products.length} SKUs in catalogue`}>
      <Panel bodyClassName="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by product name or SKU…"
              aria-label="Search products"
              className="h-10 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              aria-label="Filter by stock status"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="all">All stock levels</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
            <button
              onClick={openNew}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
          </div>
        </div>
      </Panel>

      <Panel className="mt-4" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {["SKU", "Product Name", "Category", "Price", "Stock", "Status", "Last Updated", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">Loading catalogue…</td></tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">No products match those filters.</td></tr>
              )}
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold">{p.sku}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => setDetail(p)} className="text-left font-medium hover:text-primary hover:underline">
                      {p.name}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums">{currency(p.price)}</td>
                  <td className="px-5 py-3 tabular-nums">{p.stock}</td>
                  <td className="px-5 py-3"><StatusBadge value={stockStatus(p)} /></td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{shortDate(p.updatedAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(p)} aria-label={`Delete ${p.name}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {open && (
        <Modal title={editing ? "Edit Product" : "Add Product"} onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product Name" error={errors['name']}>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="SKU" error={errors['sku']}>
                <input className={inputCls} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-1042" />
              </Field>
            </div>
            <Field label="Description">
              <textarea rows={3} className={inputCls + " h-auto py-2"} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Category">
                <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Price (ZAR)" error={errors['price']}>
                <input type="number" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </Field>
              <Field label="Stock Quantity" error={errors['stock']}>
                <input type="number" className={inputCls} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Reorder Level">
                <input type="number" className={inputCls} value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
              </Field>
              <Field label="Image URL">
                <input className={inputCls} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
              </Field>
              <Field label="Status">
                <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Product["status"] })}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold">Cancel</button>
              <button type="submit" className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                {editing ? "Save changes" : "Create product"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["SKU", detail.sku],
              ["Category", detail.category],
              ["Price", currency(detail.price)],
              ["Unit cost", currency(detail.cost)],
              ["Stock on hand", String(detail.stock)],
              ["Reorder level", String(detail.reorderLevel)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold text-muted-foreground uppercase">{k}</dt>
                <dd className="mt-1 text-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">{detail.description}</p>
          <div className="mt-4 flex gap-2"><StatusBadge value={stockStatus(detail)} /><StatusBadge value={detail.status} /></div>
        </Modal>
      )}
    </AppShell>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-xs font-medium text-destructive">{error}</span>}
    </label>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-pop">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4">
          <h2 className="truncate text-sm font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
