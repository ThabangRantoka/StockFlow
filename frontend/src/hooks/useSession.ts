
import { useEffect, useState } from "react";
import type { SessionUser } from "@/types";

const TOKEN_KEY = "stockflow_token";
const USER_KEY = "stockflow_user";
const SESSION_EVENT = "stockflow:session-updated";

export type StoredUser = {
  id: number;
  full_name: string;
  email: string;
  role: "Admin" | "Manager" | "Employee";
  status: string;
};

function convertUser(user: StoredUser): SessionUser {
  const name = user.full_name;

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    name,
    email: user.email,
    role: user.role,
    initials,
  };
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): SessionUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return convertUser(JSON.parse(raw) as StoredUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function updateStoredUser(user: StoredUser): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function signOut(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function refreshSession() {
      const token = getToken();
      const storedUser = getStoredUser();

      setUser(token && storedUser ? storedUser : null);
      setReady(true);
    }

    refreshSession();

    window.addEventListener(SESSION_EVENT, refreshSession);
    window.addEventListener("storage", refreshSession);

    return () => {
      window.removeEventListener(SESSION_EVENT, refreshSession);
      window.removeEventListener("storage", refreshSession);
    };
  }, []);

  return {
    user,
    ready,
    authenticated: Boolean(user && getToken()),
  };
}
