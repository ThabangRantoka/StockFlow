
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  Cloud,
  Database,
  KeyRound,
  RefreshCw,
  Server,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/api-status")({
  head: () => ({
    meta: [
      { title: "API & Integration Status — StockFlow" },
      {
        name: "description",
        content: "Live REST API and PostgreSQL connectivity monitoring.",
      },
    ],
  }),
  component: ApiStatusPage,
});

type HealthState = "checking" | "online" | "offline";

type HealthResponse = {
  status?: string;
  message?: string;
  services?: {
    api?: string;
    database?: string;
  };
};

type HealthLog = {
  method: string;
  path: string;
  status: number | null;
  latencyMs: number;
  time: string;
};

const methodTone: Record<string, string> = {
  GET: "bg-info/12 text-info border-info/25",
  POST: "bg-success/12 text-success border-success/25",
  PUT: "bg-warning/18 text-warning-foreground border-warning/30",
  DELETE: "bg-destructive/10 text-destructive border-destructive/25",
};

const endpoints = [
  ["GET", "/api/health", "Check Express and PostgreSQL connectivity"],
  ["GET", "/api/products", "List products stored in PostgreSQL"],
  ["POST", "/api/products", "Create a product"],
  ["PUT", "/api/products/:id", "Update a product"],
  ["DELETE", "/api/products/:id", "Delete a product"],
  ["GET", "/api/inventory", "Retrieve inventory information"],
  ["GET", "/api/orders", "List customer orders"],
  ["POST", "/api/orders", "Create an order"],
  ["POST", "/api/orders/items", "Add an order item and deduct stock"],
  ["PUT", "/api/orders/:id", "Update an order status"],
  ["GET", "/api/customers", "List customer accounts"],
  ["POST", "/api/customers", "Create a customer"],
  ["PUT", "/api/customers/:id", "Update customer details"],
  ["GET", "/api/dashboard", "Retrieve dashboard information"],
  ["GET", "/api/reports", "Retrieve reporting information"],
] as const;

function ApiStatusPage() {
  const [apiState, setApiState] = useState<HealthState>("checking");
  const [databaseState, setDatabaseState] =
    useState<HealthState>("checking");

  const [message, setMessage] = useState("Checking API connection...");
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function checkHealth() {
    setRefreshing(true);
    setApiState("checking");
    setDatabaseState("checking");

    const start = performance.now();
    let status: number | null = null;

    try {
      const response = await fetch("/api/health", {
        cache: "no-store",
      });

      status = response.status;

      const result: HealthResponse = await response.json();

      // A valid health response means Express is reachable,
      // even if PostgreSQL has failed.
      const apiOnline =
        result.services?.api === "online";

      const databaseOnline =
        result.services?.database === "online";

      setApiState(apiOnline ? "online" : "offline");
      setDatabaseState(databaseOnline ? "online" : "offline");

      setMessage(
        result.message ||
          (response.ok
            ? "StockFlow API is running"
            : "API health check failed")
      );
    } catch {
      setApiState("offline");
      setDatabaseState("offline");
      setMessage("Cannot connect to the StockFlow API");
    } finally {
      const latencyMs = Math.round(performance.now() - start);
      const time = new Date().toLocaleTimeString();

      setLastChecked(new Date().toLocaleString());

      setLogs((previous) =>
        [
          {
            method: "GET",
            path: "/api/health",
            status,
            latencyMs,
            time,
          },
          ...previous,
        ].slice(0, 10)
      );

      setRefreshing(false);
    }
  }

  useEffect(() => {
    void checkHealth();
  }, []);

  const services = [
    {
      name: "REST API",
      detail: message,
      state: apiState,
      icon: Server,
    },
    {
      name: "PostgreSQL Database",
      detail:
        databaseState === "online"
          ? "PostgreSQL responded successfully to SELECT 1."
          : databaseState === "checking"
            ? "Checking PostgreSQL connectivity..."
            : "PostgreSQL connection could not be verified.",
      state: databaseState,
      icon: Database,
    },
    {
      name: "Microsoft Azure",
      detail: "Cloud deployment has not been configured yet.",
      state: "not-deployed",
      icon: Cloud,
    },
    {
      name: "JWT Authentication",
      detail: "JWT authentication is configured on protected API routes.",
      state: "configured",
      icon: KeyRound,
    },
  ] as const;

  function badgeTone(state: string) {
    if (state === "online") {
      return "border-success/25 bg-success/12 text-success";
    }

    if (state === "offline") {
      return "border-destructive/25 bg-destructive/10 text-destructive";
    }

    if (state === "checking") {
      return "border-warning/30 bg-warning/15 text-warning-foreground";
    }

    return "border-border bg-muted text-muted-foreground";
  }

  function statusLabel(state: string) {
    if (state === "online") return "Online";
    if (state === "offline") return "Offline";
    if (state === "checking") return "Checking";
    if (state === "not-deployed") return "Not deployed";
    return "Configured";
  }

  return (
    <AppShell
      title="API / Integration Status"
      subtitle="Node.js + Express · PostgreSQL · Integration monitoring"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {lastChecked
            ? `Last checked: ${lastChecked}`
            : "Checking API connectivity..."}
        </p>

        <button
          type="button"
          onClick={() => void checkHealth()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-4 w-4", refreshing && "animate-spin")}
          />
          {refreshing ? "Checking..." : "Check connection"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {services.map((service) => {
          const Icon = service.icon;

          return (
            <div
              key={service.name}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>

                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    badgeTone(service.state)
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusLabel(service.state)}
                </span>
              </div>

              <p className="mt-3 text-sm font-bold">{service.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {service.detail}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Available endpoints"
          description="REST endpoints implemented in StockFlow"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {endpoints.map(([method, path, description]) => (
              <li
                key={`${method}-${path}`}
                className="flex items-start gap-3 px-5 py-3.5"
              >
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold",
                    methodTone[method]
                  )}
                >
                  {method}
                </span>

                <div className="min-w-0">
                  <p className="break-all font-mono text-xs font-semibold">
                    {path}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Recent API activity"
          description="Health checks performed from this browser page"
          bodyClassName="p-0"
          action={<Activity className="h-4 w-4 text-primary" />}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {["Method", "Endpoint", "Status", "Latency", "Time"].map(
                    (heading) => (
                      <th key={heading} className="px-5 py-3 font-semibold">
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {logs.map((log, index) => (
                  <tr
                    key={index}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-2.5">
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold",
                          methodTone[log.method]
                        )}
                      >
                        {log.method}
                      </span>
                    </td>

                    <td className="px-5 py-2.5 font-mono text-xs">
                      {log.path}
                    </td>

                    <td
                      className={cn(
                        "px-5 py-2.5 font-mono text-xs font-bold",
                        log.status === null || log.status >= 400
                          ? "text-destructive"
                          : "text-success"
                      )}
                    >
                      {log.status ?? "Network error"}
                    </td>

                    <td className="px-5 py-2.5 text-xs text-muted-foreground">
                      {log.latencyMs} ms
                    </td>

                    <td className="px-5 py-2.5 text-xs text-muted-foreground">
                      {log.time}
                    </td>
                  </tr>
                ))}

                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-sm text-muted-foreground"
                    >
                      No health checks recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4" title="Integration notes">
        <p className="text-sm leading-relaxed text-muted-foreground">
          StockFlow uses a React and TypeScript frontend connected to a
          Node.js and Express REST API. PostgreSQL stores products,
          customers, orders and inventory data. Protected endpoints
          use JWT authentication and role-based access control.
          The health endpoint checks PostgreSQL connectivity using
          a database query. Microsoft Azure deployment has not
          been configured yet.
        </p>
      </Panel>
    </AppShell>
  );
}
