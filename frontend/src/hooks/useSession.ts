import { useEffect, useState } from "react";
import type { SessionUser } from "@/types";

const KEY = "stockflow.session";

export const defaultUser: SessionUser = {
  name: "Thabang Rantoka",
  email: "thabang.rantoka@stockflow.io",
  role: "Admin",
  initials: "TR",
};

export function signIn(email: string) {
  const user: SessionUser = { ...defaultUser, email: email || defaultUser.email };
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export function signOut() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    setUser(raw ? (JSON.parse(raw) as SessionUser) : defaultUser);
    setReady(true);
  }, []);

  return { user: user ?? defaultUser, ready };
}
