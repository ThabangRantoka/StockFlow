
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, RefreshCw, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/shared/Panel";
import { getToken, useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/users")({
  component: UsersPage,
});

type Role = "Admin" | "Manager" | "Employee";
type Status = "Active" | "Inactive";

type Account = {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  status: Status;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm";

const buttonClass =
  "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50";

async function apiRequest(path: string, options: RequestInit = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Please sign in again.");
  }

  const response = await fetch(`/api/users${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  return data;
}

function UsersPage() {
  const { user } = useSession();
  const [users, setUsers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Employee");

  const isAdmin = user?.role === "Admin";

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("");
      if (!Array.isArray(data)) {
        throw new Error("Unexpected user list response.");
      }
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      void loadUsers();
    }
  }, [isAdmin]);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("Employee");
      setShowForm(false);
      setSuccess("User created successfully.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setCreating(false);
    }
  }

  async function updateRole(account: Account, nextRole: Role) {
    if (nextRole === account.role) return;

    if (account.email === user?.email && nextRole !== "Admin") {
      setError("You cannot remove your own Admin role.");
      return;
    }

    setBusyId(account.id);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/${account.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });

      setSuccess(`Role updated for ${account.full_name}.`);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateStatus(account: Account) {
    const nextStatus: Status =
      account.status === "Active" ? "Inactive" : "Active";

    if (account.email === user?.email && nextStatus === "Inactive") {
      setError("You cannot deactivate your own account.");
      return;
    }

    const confirmed = window.confirm(
      `${nextStatus === "Inactive" ? "Deactivate" : "Activate"} ${account.full_name}?`
    );

    if (!confirmed) return;

    setBusyId(account.id);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/${account.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      setSuccess(`Account ${nextStatus.toLowerCase()} successfully.`);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell
      title="User Management"
      subtitle="Manage StockFlow accounts and permissions"
    >
      {!isAdmin ? (
        <Panel title="Access denied">
          <p className="text-sm text-muted-foreground">
            Only administrators can manage users.
          </p>
        </Panel>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {users.length} user accounts
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void loadUsers()}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className={`${buttonClass} flex items-center gap-2`}
              >
                <Plus className="h-4 w-4" />
                Add User
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="text-sm text-foreground">
              {success}
            </p>
          )}

          {showForm && (
            <Panel title="Create User" description="Add a new StockFlow account">
              <form onSubmit={(event) => void createUser(event)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    Full name
                    <input
                      className={`${inputClass} mt-1.5`}
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />
                  </label>

                  <label className="block text-sm">
                    Email address
                    <input
                      type="email"
                      className={`${inputClass} mt-1.5`}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </label>

                  <label className="block text-sm">
                    Temporary password
                    <input
                      type="password"
                      minLength={8}
                      autoComplete="new-password"
                      className={`${inputClass} mt-1.5`}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </label>

                  <label className="block text-sm">
                    Role
                    <select
                      className={`${inputClass} mt-1.5`}
                      value={role}
                      onChange={(event) => setRole(event.target.value as Role)}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </label>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-border px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creating}
                    className={buttonClass}
                  >
                    {creating ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </Panel>
          )}

          <Panel
            title="All Users"
            description="Manage roles and account access"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Email</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((account) => {
                    const isSelf = account.email === user?.email;

                    return (
                      <tr key={account.id} className="border-b border-border">
                        <td className="px-3 py-3 font-medium">
                          {account.full_name}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (You)
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3">{account.email}</td>

                        <td className="px-3 py-3">
                          <select
                            className={inputClass}
                            value={account.role}
                            disabled={busyId !== null || isSelf}
                            onChange={(event) =>
                              void updateRole(
                                account,
                                event.target.value as Role
                              )
                            }
                          >
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Employee">Employee</option>
                          </select>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={
                              account.status === "Active"
                                ? "font-semibold text-green-600"
                                : "font-semibold text-muted-foreground"
                            }
                          >
                            {account.status}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <button
                            type="button"
                            disabled={busyId !== null || isSelf}
                            onClick={() => void updateStatus(account)}
                            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:opacity-50"
                          >
                            {account.status === "Active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {loading && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Loading users...
                </p>
              )}

              {!loading && users.length === 0 && !error && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No users found.
                </p>
              )}
            </div>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
