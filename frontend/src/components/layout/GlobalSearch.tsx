
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "@tanstack/react-router";

import {
  Search,
  Package,
  ShoppingCart,
  Users,
  Loader2,
  X,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

import { getToken } from "@/hooks/useSession";

type Product = {
  id: number;
  name: string;
  sku: string;
};

type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

type Order = {
  id: number;
  first_name: string;
  last_name: string;
  status: string;
};

type SearchResult = {
  id: string;
  category: "product" | "customer" | "order";
  title: string;
  description: string;
  path: string;
};

const MAX_RESULTS = 8;

function getOrderNumber(id: number): string {
  return `ORD-${String(id).padStart(5, "0")}`;
}

async function fetchList<T>(
  path: string,
  signal: AbortSignal
): Promise<T[]> {
  const token = getToken();

  if (!token) {
    throw new Error("Please sign in to search.");
  }

  const response = await fetch(path, {
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Search request failed (${response.status}).`
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      "Unexpected search response from the server."
    );
  }

  return data as T[];
}

export function GlobalSearch() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchSequence = useRef(0);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      searchSequence.current += 1;
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    const sequence = ++searchSequence.current;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const [products, customers, orders] =
          await Promise.all([
            fetchList<Product>(
              "/api/products",
              controller.signal
            ),
            fetchList<Customer>(
              "/api/customers",
              controller.signal
            ),
            fetchList<Order>(
              "/api/orders",
              controller.signal
            ),
          ]);

        if (sequence !== searchSequence.current) {
          return;
        }

        const term = query.trim().toLowerCase();

        const productResults: SearchResult[] = products
          .filter((product) =>
            `${product.name ?? ""} ${product.sku ?? ""}`
              .toLowerCase()
              .includes(term)
          )
          .map((product) => ({
            id: `product-${product.id}`,
            category: "product",
            title: product.name,
            description: `SKU: ${product.sku}`,
            path: "/products",
          }));

        const customerResults: SearchResult[] = customers
          .filter((customer) =>
            [
              customer.first_name ?? "",
              customer.last_name ?? "",
              customer.email ?? "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(term)
          )
          .map((customer) => ({
            id: `customer-${customer.id}`,
            category: "customer",
            title:
              `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim(),
            description: customer.email ?? "",
            path: "/customers",
          }));

        const orderResults: SearchResult[] = orders
          .filter((order) => {
            const orderNumber = getOrderNumber(order.id);

            const searchableText = [
              orderNumber,
              String(order.id),
              order.first_name ?? "",
              order.last_name ?? "",
              order.status ?? "",
            ]
              .join(" ")
              .toLowerCase();

            return searchableText.includes(term);
          })
          .map((order) => ({
            id: `order-${order.id}`,
            category: "order",
            title: getOrderNumber(order.id),
            description:
              `${order.first_name ?? ""} ${order.last_name ?? ""} · ${order.status ?? ""}`.trim(),
            path: `/orders/${order.id}`,
          }));

        setResults(
          [
            ...productResults,
            ...customerResults,
            ...orderResults,
          ].slice(0, MAX_RESULTS)
        );

        setActiveIndex(-1);
      } catch (err) {
        if (
          controller.signal.aborted ||
          sequence !== searchSequence.current
        ) {
          return;
        }

        setResults([]);

        setError(
          err instanceof Error
            ? err.message
            : "Search is temporarily unavailable."
        );
      } finally {
        if (
          !controller.signal.aborted &&
          sequence === searchSequence.current
        ) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        closeSearch();
      }
    };

    const handleShortcut = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleShortcut
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleShortcut
      );
    };
  }, [closeSearch]);

  const selectResult = (result: SearchResult) => {
    setQuery("");
    setResults([]);
    closeSearch();

    void navigate({
      to: result.path,
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Escape") {
      closeSearch();
      inputRef.current?.blur();
      return;
    }

    if (!open || results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((current) =>
        current < results.length - 1
          ? current + 1
          : 0
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((current) =>
        current > 0
          ? current - 1
          : results.length - 1
      );
    }

if (event.key === "Enter") {
  event.preventDefault();

  const selectedResult =
    results[activeIndex >= 0 ? activeIndex : 0];

  if (selectedResult) {
    selectResult(selectedResult);
  }
}
  };

  const iconFor = (category: SearchResult["category"]) => {
    if (category === "product") {
      return <Package className="h-4 w-4" />;
    }

    if (category === "customer") {
      return <Users className="h-4 w-4" />;
    }

    return <ShoppingCart className="h-4 w-4" />;
  };

  return (
    <div
      ref={rootRef}
      className="relative hidden md:block"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, orders, customers..."
          aria-label="Global search"
          aria-expanded={open}
          aria-controls="stockflow-search-results"
          aria-autocomplete="list"
          role="combobox"
          className="h-9 w-64 rounded-lg border border-input bg-background pr-9 pl-9 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 xl:w-80"
        />

        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div
          id="stockflow-search-results"
          role="listbox"
          aria-label="Search results"
          className="absolute right-0 top-full z-50 mt-3 w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xl"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold text-foreground">
              Search results
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Products, orders and customers
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching StockFlow...
            </div>
          ) : error ? (
            <div
              role="alert"
              className="flex items-start gap-2 px-4 py-5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-7 text-center">
              <Search className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />

              <p className="text-sm font-semibold">
                No results found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Try another name, SKU or order number.
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto p-1.5">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  id={`search-result-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectResult(result)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    index === activeIndex
                      ? "bg-accent"
                      : "hover:bg-accent/60"
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    {iconFor(result.category)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {result.title}
                    </span>

                    <span className="block truncate text-xs text-muted-foreground">
                      {result.description}
                    </span>
                  </span>

                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            ↑ ↓ Navigate · Enter Open · Esc Close
          </div>
        </div>
      )}
    </div>
  );
}
