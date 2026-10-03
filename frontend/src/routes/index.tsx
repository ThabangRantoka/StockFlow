import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Boxes,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — StockFlow Retail Operations" },
      {
        name: "description",
        content:
          "Sign in to StockFlow, the internal retail platform for inventory, orders, products and customer management.",
      },
      {
        property: "og:title",
        content: "Sign in — StockFlow Retail Operations",
      },
      {
        property: "og:description",
        content: "Internal retail inventory and order management platform.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    // Basic frontend validation
    if (!email.includes("@")) {
      return setError("Enter a valid work email address.");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setError("");
    setLoading(true);

    try {
      // Send login details to our Node.js backend
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      // Login failed
      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      // Save JWT
      localStorage.setItem("stockflow_token", data.token);

      // Save logged-in user
      localStorage.setItem(
        "stockflow_user",
        JSON.stringify(data.user)
      );

      // Login successful
      navigate({
        to: "/dashboard",
      });

    } catch (error) {
      console.error("Login request failed:", error);

      setError(
        "Unable to connect to the StockFlow server. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">

      {/* LEFT SIDE */}
      <section className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">

        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes
              className="h-6 w-6"
              strokeWidth={2.4}
            />
          </span>

          <span className="text-xl font-extrabold tracking-tight text-sidebar-accent-foreground">
            StockFlow
          </span>
        </div>

        <div className="max-w-lg">

          <h2 className="text-4xl leading-tight font-extrabold tracking-tight text-sidebar-accent-foreground">
            Retail inventory and orders, under one roof.
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground/75">
            Track stock levels across every channel, fulfil orders faster and
            keep your product catalogue accurate — from a single operations
            console.
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-6">

            {[
              ["1,240+", "SKUs managed"],
              ["99.98%", "API uptime"],
              ["274", "Orders this month"],
            ].map(([v, l]) => (

              <div key={l}>
                <dt className="text-2xl font-bold text-sidebar-accent-foreground">
                  {v}
                </dt>

                <dd className="mt-1 text-xs text-sidebar-foreground/60">
                  {l}
                </dd>
              </div>

            ))}

          </dl>

        </div>

        <p className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
          <ShieldCheck className="h-4 w-4" />
          Role-based access · Admin, Manager, Employee
        </p>

      </section>


      {/* LOGIN SIDE */}
      <section className="flex items-center justify-center bg-background px-5 py-12">

        <div className="w-full max-w-sm">

          {/* MOBILE LOGO */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">

            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Boxes
                className="h-6 w-6"
                strokeWidth={2.4}
              />
            </span>

            <span className="text-xl font-extrabold tracking-tight">
              StockFlow
            </span>

          </div>


          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sign in
          </h1>

          <p className="mt-1.5 text-sm text-muted-foreground">
            Use your StockFlow work account to continue.
          </p>


          <form
            onSubmit={submit}
            className="mt-8 space-y-5"
            noValidate
          >

            {/* EMAIL */}
            <div>

              <label
                htmlFor="email"
                className="text-xs font-semibold text-foreground"
              >
                Email address
              </label>

              <div className="relative mt-1.5">

                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  className="h-11 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="you@company.com"
                />

              </div>

            </div>


            {/* PASSWORD */}
            <div>

              <label
                htmlFor="password"
                className="text-xs font-semibold text-foreground"
              >
                Password
              </label>

              <div className="relative mt-1.5">

                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-11 w-full rounded-lg border border-input bg-card pr-10 pl-9 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  disabled={loading}
                  aria-label={
                    show
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                >
                  {show ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>

              </div>

            </div>


            {/* ERROR MESSAGE */}
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
              >
                {error}
              </p>
            )}


            {/* OPTIONS */}
            <div className="flex items-center justify-between text-xs">

              <label className="flex items-center gap-2 font-medium text-muted-foreground">

                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-input accent-primary"
                />

                Remember me

              </label>

              <button
                type="button"
                className="font-semibold text-primary hover:underline"
              >
                Forgot password?
              </button>

            </div>


            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>


          <p className="mt-6 text-center text-xs text-muted-foreground">
            Secure access to StockFlow Retail Operations.
          </p>

        </div>

      </section>

    </div>
  );
}