"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppUser, Company } from "@/lib/types";
import { getUserById } from "@/lib/data/users";
import { getCompany } from "@/lib/data/companies";
import { login as loginRequest } from "@/lib/data/auth";

const SESSION_KEY = "financeiro_session_user_id";

interface AuthContextValue {
  user: AppUser | null;
  company: Company | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => void;
  refreshCompany: () => Promise<void>;
  setSessionUser: (user: AppUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCompanyFor = useCallback(async (appUser: AppUser | null) => {
    if (appUser?.companyId) {
      const c = await getCompany(appUser.companyId);
      setCompany(c ?? null);
    } else {
      setCompany(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      const storedId = window.localStorage.getItem(SESSION_KEY);
      if (!storedId) {
        setLoading(false);
        return;
      }
      const restoredUser = await getUserById(storedId);
      if (!active) return;
      if (restoredUser) {
        setUser(restoredUser);
        await loadCompanyFor(restoredUser);
      } else {
        window.localStorage.removeItem(SESSION_KEY);
      }
      if (active) setLoading(false);
    }
    restoreSession();
    return () => {
      active = false;
    };
  }, [loadCompanyFor]);

  const login = useCallback(
    async (email: string, password: string) => {
      const loggedInUser = await loginRequest(email, password);
      if (!loggedInUser) {
        throw new Error("E-mail ou senha inválidos.");
      }
      window.localStorage.setItem(SESSION_KEY, loggedInUser.id);
      setUser(loggedInUser);
      await loadCompanyFor(loggedInUser);
      return loggedInUser;
    },
    [loadCompanyFor]
  );

  const setSessionUser = useCallback(
    (newUser: AppUser) => {
      window.localStorage.setItem(SESSION_KEY, newUser.id);
      setUser(newUser);
      loadCompanyFor(newUser);
    },
    [loadCompanyFor]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setCompany(null);
  }, []);

  const refreshCompany = useCallback(async () => {
    await loadCompanyFor(user);
  }, [user, loadCompanyFor]);

  const value = useMemo(
    () => ({ user, company, loading, login, logout, refreshCompany, setSessionUser }),
    [user, company, loading, login, logout, refreshCompany, setSessionUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return ctx;
}
