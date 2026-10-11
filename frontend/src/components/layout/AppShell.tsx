

import {
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";

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
  CheckCheck,
  Inbox,
  RefreshCw,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { GlobalSearch } from "./GlobalSearch";

import { cn } from "@/lib/utils";
import {
  getToken,
  signOut,
  useSession,
} from "@/hooks/useSession";

// =====================================
// SIDEBAR NAVIGATION
// =====================================

const nav = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/products",
    label: "Products",
    icon: Package,
  },
  {
    to: "/inventory",
    label: "Inventory",
    icon: Boxes,
  },
  {
    to: "/orders",
    label: "Orders",
    icon: ShoppingCart,
  },
  {
    to: "/customers",
    label: "Customers",
    icon: Users,
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
  },
  {
    to: "/api-status",
    label: "API / Integration",
    icon: Plug,
  },
  {
    to: "/users",
    label: "User Management",
    icon: Users,
    adminOnly: true,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
  },
] as const;

// =====================================
// NOTIFICATION TYPES
// =====================================

type StockNotification = {
  id: number;
  type: "low_stock" | "order" | "system";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type NotificationsResponse = {
  notifications: StockNotification[];
};

type UnreadResponse = {
  unread_count: number;
};

// =====================================
// NOTIFICATION API
// =====================================

async function notificationRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const response = await fetch(
    `/api/notifications${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Notification request failed (${response.status})`,
    );
  }

  return data as T;
}

// =====================================
// LOGO
// =====================================

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

// =====================================
// APP SHELL
// =====================================

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

  // Notification state
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [notifications, setNotifications] = useState<
    StockNotification[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [notificationLoading, setNotificationLoading] =
    useState(false);

  const [notificationError, setNotificationError] =
    useState("");

  const [notificationBusy, setNotificationBusy] =
    useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);

  const requestSequence = useRef(0);

  const { user, ready, authenticated } = useSession();

  const navigate = useNavigate();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  // =====================================
  // LOAD NOTIFICATIONS
  // =====================================

  const loadNotifications = useCallback(
    async (showLoading = false) => {
      const requestId = ++requestSequence.current;

      if (showLoading) {
        setNotificationLoading(true);
      }

      try {
        const [listData, countData] = await Promise.all([
          notificationRequest<NotificationsResponse>(""),
          notificationRequest<UnreadResponse>(
            "/unread-count",
          ),
        ]);

        if (requestId !== requestSequence.current) {
          return;
        }

        if (!Array.isArray(listData.notifications)) {
          throw new Error(
            "Unexpected notification response.",
          );
        }

        setNotifications(listData.notifications);
        setUnreadCount(
          Number(countData.unread_count) || 0,
        );

        setNotificationError("");
      } catch (error) {
        if (requestId !== requestSequence.current) {
          return;
        }

        setNotificationError(
          error instanceof Error
            ? error.message
            : "Failed to load notifications.",
        );
      } finally {
        if (requestId === requestSequence.current) {
          setNotificationLoading(false);
        }
      }
    },
    [],
  );

  // =====================================
  // POLLING
  // =====================================

  useEffect(() => {
    if (!ready || !authenticated || !user) {
      requestSequence.current += 1;
      setNotifications([]);
      setUnreadCount(0);
      setNotificationError("");
      return;
    }

    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      window.clearInterval(interval);
      requestSequence.current += 1;
    };
  }, [
    ready,
    authenticated,
    user?.email,
    loadNotifications,
  ]);

  // =====================================
  // MARK ONE AS READ
  // =====================================

  const markAsRead = async (id: number) => {
    if (notificationBusy) return;

    setNotificationBusy(true);
    setNotificationError("");

    try {
      await notificationRequest(
        `/${id}/read`,
        {
          method: "PATCH",
        },
      );

      await loadNotifications();
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read.",
      );
    } finally {
      setNotificationBusy(false);
    }
  };

  // =====================================
  // MARK ALL AS READ
  // =====================================

  const markAllAsRead = async () => {
    if (notificationBusy) return;

    setNotificationBusy(true);
    setNotificationError("");

    try {
      await notificationRequest(
        "/read-all",
        {
          method: "PATCH",
        },
      );

      await loadNotifications();
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Failed to mark notifications as read.",
      );
    } finally {
      setNotificationBusy(false);
    }
  };

  // =====================================
  // CLOSE DROPDOWN
  // =====================================

  useEffect(() => {
    if (!notificationsOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node,
        )
      ) {
        setNotificationsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [notificationsOpen]);

  useEffect(() => {
    setNotificationsOpen(false);
  }, [pathname]);

  // =====================================
  // AUTHENTICATION
  // =====================================

  useEffect(() => {
    if (ready && !authenticated) {
      navigate({
        to: "/",
        replace: true,
      });
    }
  }, [ready, authenticated, navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Boxes className="mx-auto h-8 w-8 text-primary" />

          <p className="mt-3 text-sm font-medium text-foreground">
            Loading StockFlow...
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    requestSequence.current += 1;

    signOut();

    setNotificationsOpen(false);
    setNotifications([]);
    setUnreadCount(0);

    navigate({
      to: "/",
      replace: true,
    });
  };

  // =====================================
  // SIDEBAR
  // =====================================

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo />

        <button
          type="button"
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

        {nav
          .filter(
            (item) =>
              !("adminOnly" in item) ||
              user.role === "Admin",
          )
          .map((item) => {
            const active =
              pathname === item.to ||
              pathname.startsWith(
                item.to + "/",
              );

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
                <item.icon
                  className="h-4.5 w-4.5 shrink-0"
                  strokeWidth={2.1}
                />

                <span className="truncate">
                  {item.label}
                </span>

                {active && (
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-70" />
                )}
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
            type="button"
            aria-label="Log out"
            onClick={handleLogout}
            className="rounded-md p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar/60 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // =====================================
  // MAIN APPLICATION
  // =====================================

  return (
    <div className="min-h-screen bg-background">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        {sidebar}
      </aside>

      {/* MOBILE SIDEBAR */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute inset-y-0 left-0 w-72 shadow-pop">
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-md border border-border p-2 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
                  {title}
                </h1>

                {subtitle && (
                  <p className="truncate text-xs text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* SEARCH */}
                {/* GLOBAL SEARCH */}
                  <GlobalSearch />

              {/* =====================================
                  NOTIFICATION BELL
              ===================================== */}

              <div
                ref={notificationRef}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!notificationsOpen) {
                      void loadNotifications(true);
                    }

                    setNotificationsOpen(
                      (previous) => !previous,
                    );
                  }}
                  aria-label={
                    unreadCount > 0
                      ? `Notifications, ${unreadCount} unread`
                      : "Notifications"
                  }
                  aria-expanded={notificationsOpen}
                  aria-haspopup="dialog"
                  className={cn(
                    "relative rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground",
                    notificationsOpen &&
                      "bg-accent text-foreground",
                  )}
                >
                  <Bell className="h-4.5 w-4.5" />

                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </button>

                {/* NOTIFICATION DROPDOWN */}
                {notificationsOpen && (
                  <div
                    role="dialog"
                    aria-label="Notifications panel"
                    className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xl"
                  >
                    {/* HEADER */}
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <div>
                        <h2 className="text-sm font-bold text-foreground">
                          Notifications
                        </h2>

                        <p className="text-xs text-muted-foreground">
                          {unreadCount > 0
                            ? `${unreadCount} unread`
                            : "You're all caught up"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void loadNotifications(true)
                          }
                          disabled={notificationLoading}
                          aria-label="Refresh notifications"
                          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                        >
                          <RefreshCw
                            className={cn(
                              "h-4 w-4",
                              notificationLoading &&
                                "animate-spin",
                            )}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setNotificationsOpen(false)
                          }
                          aria-label="Close notifications"
                          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* ERROR */}
                    {notificationError && (
                      <p
                        role="alert"
                        className="border-b border-border px-4 py-3 text-xs text-destructive"
                      >
                        {notificationError}
                      </p>
                    )}

                    {/* LOADING */}
                    {notificationLoading &&
                    notifications.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 px-6 py-10">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />

                        <p className="text-sm text-muted-foreground">
                          Loading notifications...
                        </p>
                      </div>
                    ) : notifications.length > 0 ? (
                      <>
                        {/* NOTIFICATION LIST */}
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.map(
                            (notification) => (
                              <button
                                key={notification.id}
                                type="button"
                                disabled={
                                  notificationBusy ||
                                  notification.is_read
                                }
                                onClick={() =>
                                  void markAsRead(
                                    notification.id,
                                  )
                                }
                                className={cn(
                                  "block w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent/50 disabled:cursor-default",
                                  !notification.is_read &&
                                    "bg-primary/5",
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-foreground">
                                    {notification.title}
                                  </p>

                                  {!notification.is_read && (
                                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                  )}
                                </div>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  {notification.message}
                                </p>

                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <p className="text-[11px] text-muted-foreground">
                                    {new Date(
                                      notification.created_at,
                                    ).toLocaleString()}
                                  </p>

                                  {!notification.is_read && (
                                    <span className="text-[11px] font-medium text-primary">
                                      Mark as read
                                    </span>
                                  )}
                                </div>
                              </button>
                            ),
                          )}
                        </div>

                        {/* MARK ALL READ */}
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            disabled={notificationBusy}
                            onClick={() =>
                              void markAllAsRead()
                            }
                            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-primary transition-colors hover:bg-accent disabled:opacity-50"
                          >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read
                          </button>
                        )}
                      </>
                    ) : (
                      /* EMPTY STATE */
                      <div className="flex flex-col items-center px-6 py-10 text-center">
                        <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted">
                          <Inbox className="h-6 w-6 text-muted-foreground" />
                        </span>

                        <p className="text-sm font-semibold text-foreground">
                          No notifications yet
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          New StockFlow alerts will appear
                          here.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CURRENT USER */}
              <div className="flex items-center gap-2 rounded-lg border border-border py-1 pr-3 pl-1">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {user.initials}
                </span>

                <span className="hidden text-xs leading-tight sm:block">
                  <span className="block font-semibold text-foreground">
                    {user.name}
                  </span>

                  <span className="block text-muted-foreground">
                    {user.role}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {actions && (
            <div className="border-t border-border px-4 py-2.5 sm:px-6">
              {actions}
            </div>
          )}
        </header>

        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
