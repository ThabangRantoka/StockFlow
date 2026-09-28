import { createFileRoute } from "@tanstack/react-router";
import { Activity, Cloud, Database, KeyRound, Server } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { useApiLogs, useHealth } from "@/hooks/useStockflow";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/api-status")({
  head: () => ({
    meta: [
      { title: "API & Integration Status — StockFlow" },
      { name: "description", content: "Health of the REST API, PostgreSQL database, Azure app service and authentication." },
      { property: "og:title", content: "API & Integration Status — StockFlow" },
      { property: "og:description", content: "REST API, database, Azure and authentication service health." },
    ],
  }),
  component: ApiStatusPage,
});

const icons = [Server, Database, Cloud, KeyRound];

const methodTone: Record<string, string> = {
  GET: "bg-info/12 text-info border-info/25",
  POST: "bg-success/12 text-success border-success/25",
  PATCH: "bg-warning/18 text-warning-foreground border-warning/30",
  DELETE: "bg-destructive/10 text-destructive border-destructive/25",
};

const statusTone = (code: number) =>
  code >= 400 ? "text-destructive" : code === 201 ? "text-info" : "text-success";

const endpoints = [
  ["GET", "/api/products", "List the product catalogue with filters and pagination"],
  ["POST", "/api/products", "Create a new product record"],
  ["GET", "/api/orders", "List orders filtered by status or channel"],
  ["POST", "/api/orders", "Create an order and reserve stock"],
  ["GET", "/api/customers", "List customer accounts and lifetime value"],
  ["PATCH", "/api/orders/:id/status", "Transition an order through the fulfilment workflow"],
] as const;

function ApiStatusPage() {
  const { data: health } = useHealth();
  const { data: logs = [] } = useApiLogs();

  return (
    <AppShell title="API / Integration Status" subtitle="Node.js + Express · PostgreSQL · Microsoft Azure">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(health?.services ?? []).map((s, i) => {
          const Icon = icons[i] ?? Server;
          return (
            <div key={s.name} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/12 px-2.5 py-0.5 text-xs font-semibold text-success">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  {s.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold">{s.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.detail}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Uptime <span className="font-semibold text-foreground tabular-nums">{s.uptime}</span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Available endpoints" description="Contract the frontend consumes" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {endpoints.map(([method, path, desc]) => (
              <li key={method + path} className="flex items-start gap-3 px-5 py-3.5">
                <span className={cn("mt-0.5 shrink-0 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold", methodTone[method])}>
                  {method}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-semibold text-foreground">{path}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Recent API activity"
          description="Live request log from the gateway"
          bodyClassName="p-0"
          action={<Activity className="h-4 w-4 text-success" />}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {["Method", "Endpoint", "Status", "Latency", "Time"].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-5 py-2.5">
                      <span className={cn("rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold", methodTone[l.method])}>
                        {l.method}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 font-mono text-xs">{l.path}</td>
                    <td className={cn("px-5 py-2.5 font-mono text-xs font-bold", statusTone(l.status))}>{l.status}</td>
                    <td className="px-5 py-2.5 text-xs tabular-nums text-muted-foreground">{l.latencyMs} ms</td>
                    <td className="px-5 py-2.5 text-xs text-muted-foreground">{l.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4" title="Integration notes">
        <p className="text-sm leading-relaxed text-muted-foreground">
          The frontend talks to a single service layer that mirrors the REST contract above. Each UI
          screen calls a typed service method rather than a hard-coded data source, so pointing the
          app at the live Express API deployed on Azure App Service is a base-URL change — the
          components, hooks and types stay untouched.
        </p>
      </Panel>
    </AppShell>
  );
}
