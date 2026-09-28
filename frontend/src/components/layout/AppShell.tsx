import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Boxes,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plug,
  Search,
  Settings,
  ShoppingCart,
  Users,
  BarChart3,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/hooks/useSession";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/api-status", label: "API / Integration", icon: Plug },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Boxes className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span className="min-w-0">
        <span className="block text-base leading-none font-extrabold tracking-tight text-sidebar-accent-foreground">
          StockFlow
        </span>
        <span className="block text-[10px] font-medium tracking-widest text-sidebar-foreground/60 uppercase">
          Retail Ops
        </span>
      </span>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo />
        <button
          className="rounded-md p-1 text-sidebar-foreground/70 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 pt-2 pb-2 text-[10px] font-bold tracking-widest text-sidebar-foreground/45 uppercase">
          Operations
        </p>
        {nav.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" strokeWidth={2.1} />
              <span className="truncate">{item.label}</span>
              {active && <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-70" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              {user.initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-sidebar-accent-foreground">
                {user.name}
              </span>
              <span className="block truncate text-[11px] text-sidebar-foreground/60">
                {user.role}
              </span>
            </span>
          </div>
          <button
            aria-label="Log out"
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="rounded-md p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar/60 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-pop">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="rounded-md border border-border p-2 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight text-foreground">{title}</h1>
                {subtitle && (
                  <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <label className="relative hidden md:block">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search products, orders, customers…"
                  aria-label="Global search"
                  className="h-9 w-64 rounded-lg border border-input bg-background pr-3 pl-9 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 xl:w-80"
                />
              </label>
              <button
                className="relative rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              </button>
              <div className="flex items-center gap-2 rounded-lg border border-border py-1 pr-3 pl-1">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {user.initials}
                </span>
                <span className="hidden text-xs leading-tight sm:block">
                  <span className="block font-semibold text-foreground">{user.name}</span>
                  <span className="block text-muted-foreground">{user.role}</span>
                </span>
              </div>
            </div>
          </div>
          {actions && <div className="border-t border-border px-4 py-2.5 sm:px-6">{actions}</div>}
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
