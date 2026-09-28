import { createFileRoute } from "@tanstack/react-router";
import { Bell, Cog, Lock, ShieldCheck, User, Users } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — StockFlow" },
      { name: "description", content: "Manage profile, account, security, notifications and role-based access." },
      { property: "og:title", content: "Settings — StockFlow" },
      { property: "og:description", content: "Profile, security, notifications and role-based access control." },
    ],
  }),
  component: SettingsPage,
});

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Cog },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "system", label: "System Preferences", icon: ShieldCheck },
  { id: "roles", label: "User Roles", icon: Users },
] as const;

const roles = [
  { name: "Admin", desc: "Full access to every module, including user management and system settings.", perms: ["Products", "Inventory", "Orders", "Customers", "Reports", "Settings", "User roles"] },
  { name: "Manager", desc: "Manages the catalogue, stock positions and order fulfilment.", perms: ["Products", "Inventory", "Orders", "Customers", "Reports"] },
  { name: "Employee", desc: "Limited operational access for day-to-day order handling.", perms: ["Orders", "Customers"] },
];

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

function SettingsPage() {
  const { user } = useSession();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("profile");

  return (
    <AppShell title="Settings" subtitle="Workspace and account configuration">
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="rounded-xl border border-border bg-card p-2 shadow-card">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <t.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          {tab === "profile" && (
            <Panel title="Profile" description="How your details appear across StockFlow">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" defaultValue={user.name} />
                <Field label="Work email" defaultValue={user.email} />
                <Field label="Job title" defaultValue="Retail Operations Lead" />
                <Field label="Phone" defaultValue="+27 82 000 1122" />
              </div>
              <SaveBar />
            </Panel>
          )}

          {tab === "account" && (
            <Panel title="Account" description="Organisation and locale defaults">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Organisation" defaultValue="StockFlow Retail (Pty) Ltd" />
                <Field label="Warehouse" defaultValue="JHB-01 — Johannesburg" />
                <Select label="Currency" options={["ZAR — South African Rand", "USD — US Dollar"]} />
                <Select label="Timezone" options={["Africa/Johannesburg (UTC+2)", "UTC"]} />
              </div>
              <SaveBar />
            </Panel>
          )}

          {tab === "security" && (
            <Panel title="Security" description="Password and session protection">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Current password" type="password" defaultValue="" />
                <Field label="New password" type="password" defaultValue="" />
              </div>
              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <Toggle label="Two-factor authentication" desc="Require an authenticator code at sign in." defaultChecked />
                <Toggle label="Sign out inactive sessions" desc="End sessions after 30 minutes of inactivity." defaultChecked />
              </div>
              <SaveBar />
            </Panel>
          )}

          {tab === "notifications" && (
            <Panel title="Notifications" description="Choose what StockFlow alerts you about">
              <div className="space-y-3">
                <Toggle label="Low stock alerts" desc="Notify when a SKU drops to its reorder level." defaultChecked />
                <Toggle label="New orders" desc="Push a notification for every incoming order." defaultChecked />
                <Toggle label="Failed payments" desc="Alert when a payment is declined or reversed." defaultChecked />
                <Toggle label="Weekly summary email" desc="Sales, stock and customer digest every Monday." />
              </div>
              <SaveBar />
            </Panel>
          )}

          {tab === "system" && (
            <Panel title="System Preferences" description="Defaults applied across the workspace">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Default landing page" options={["Dashboard", "Orders", "Inventory"]} />
                <Select label="Table page size" options={["25 rows", "50 rows", "100 rows"]} />
                <Field label="Global reorder threshold" defaultValue="20" />
                <Select label="Date format" options={["DD MMM YYYY", "YYYY-MM-DD"]} />
              </div>
              <SaveBar />
            </Panel>
          )}

          {tab === "roles" && (
            <Panel title="User Roles" description="Role-based access control model">
              <div className="space-y-3">
                {roles.map((r) => (
                  <div key={r.name} className="rounded-lg border border-border p-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-bold">{r.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
                      </div>
                      {r.name === user.role && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          Your role
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.perms.map((p) => (
                        <span key={p} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <input type={type} defaultValue={defaultValue} className={inputCls + " mt-1.5"} />
    </label>
  );
}

function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <select className={inputCls + " mt-1.5"}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Toggle({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked?: boolean }) {
  return (
    <label className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border p-3.5">
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
      <input type="checkbox" defaultChecked={defaultChecked} className="h-5 w-5 shrink-0 rounded accent-primary" />
    </label>
  );
}

function SaveBar() {
  return (
    <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
      <button className="h-10 rounded-lg border border-border px-4 text-sm font-semibold">Cancel</button>
      <button className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        Save changes
      </button>
    </div>
  );
}
