
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Cog, Lock, ShieldCheck, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { getToken, updateStoredUser, useSession, type StoredUser } from "@/hooks/useSession";
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

  const [profile, setProfile] = useState<StoredUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      try {
        const token = getToken();
        if (!token) throw new Error("Please sign in again.");
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load profile.");
        const loaded = data.user as StoredUser;
        setProfile(loaded);
        setFullName(loaded.full_name);
        setEmail(loaded.email);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load profile.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadProfile();
    return () => controller.abort();
  }, []);

  function cancelProfile() {
    if (!profile) return;
    setFullName(profile.full_name);
    setEmail(profile.email);
    setError("");
    setSuccess("");
  }

  async function saveProfile() {
    if (!profile || saving) return;
    setError("");
    setSuccess("");
    if (!fullName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a full name and a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: fullName.trim(), email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save profile.");
      const updated = data.user as StoredUser;
      setProfile(updated);
      setFullName(updated.full_name);
      setEmail(updated.email);
      updateStoredUser(updated);
      setSuccess("Profile saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (changingPassword) return;
    setPasswordError("");
    setPasswordSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please complete all three password fields.");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 72) {
      setPasswordError("New password must be between 8 and 72 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("Choose a password different from your current password.");
      return;
    }
    setChangingPassword(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not change password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password changed successfully. Use the new password next time you sign in.");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setChangingPassword(false);
    }
  }

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
              {loading ? <p className="text-sm text-muted-foreground">Loading profile...</p> : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block"><span className="text-xs font-semibold">Full name</span>
                      <input className={inputCls + " mt-1.5"} value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!profile || saving} />
                    </label>
                    <label className="block"><span className="text-xs font-semibold">Work email</span>
                      <input type="email" className={inputCls + " mt-1.5"} value={email} onChange={(e) => setEmail(e.target.value)} disabled={!profile || saving} />
                    </label>
                    <label className="block"><span className="text-xs font-semibold">Role</span><input className={inputCls + " mt-1.5"} value={profile?.role || ""} readOnly /></label>
                    <label className="block"><span className="text-xs font-semibold">Account status</span><input className={inputCls + " mt-1.5"} value={profile?.status || ""} readOnly /></label>
                  </div>
                  {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
                  {success && <p role="status" className="mt-3 text-sm text-foreground">{success}</p>}
                  <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
                    <button type="button" onClick={cancelProfile} disabled={!profile || saving} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold">Cancel</button>
                    <button type="button" onClick={() => void saveProfile()} disabled={!profile || saving} className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button>
                  </div>
                </>
              )}
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
              <p className="mt-5 text-xs text-muted-foreground">These settings are not connected to the backend yet.</p>
            </Panel>
          )}

          {tab === "security" && (
            <Panel title="Security" description="Password and session protection">
              <form onSubmit={(event) => void savePassword(event)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block"><span className="text-xs font-semibold">Current password</span>
                    <input type="password" autoComplete="current-password" className={inputCls + " mt-1.5"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={changingPassword} required />
                  </label>
                  <label className="block"><span className="text-xs font-semibold">New password</span>
                    <input type="password" autoComplete="new-password" minLength={8} className={inputCls + " mt-1.5"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={changingPassword} required />
                  </label>
                  <label className="block sm:col-span-2"><span className="text-xs font-semibold">Confirm new password</span>
                    <input type="password" autoComplete="new-password" minLength={8} className={inputCls + " mt-1.5"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={changingPassword} required />
                  </label>
                </div>
                {passwordError && <p role="alert" className="mt-3 text-sm text-destructive">{passwordError}</p>}
                {passwordSuccess && <p role="status" className="mt-3 text-sm text-foreground">{passwordSuccess}</p>}
                <div className="mt-5 flex justify-end border-t border-border pt-4">
                  <button type="submit" disabled={changingPassword} className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{changingPassword ? "Changing password..." : "Change password"}</button>
                </div>
              </form>
              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <p className="text-sm font-semibold">Additional security features</p>
                <p className="text-xs text-muted-foreground">Two-factor authentication and automatic session timeout are not implemented yet.</p>
              </div>
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
              <p className="mt-5 text-xs text-muted-foreground">These settings are not connected to the backend yet.</p>
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
              <p className="mt-5 text-xs text-muted-foreground">These settings are not connected to the backend yet.</p>
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
                      {r.name === user?.role && (
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
