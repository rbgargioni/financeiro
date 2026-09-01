"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AppUser, Company } from "@/lib/types";
import { getUserById } from "@/lib/data/users";
import { getCompany } from "@/lib/data/companies";
import { login as loginRequest, logout as logoutRequest } from "@/lib/data/auth";

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        setCompany(null);
        setLoading(false);
        return;
      }
      const profile = await getUserById(firebaseUser.uid);
      setUser(profile ?? null);
      await loadCompanyFor(profile ?? null);
      setLoading(false);
    });
    return unsubscribe;
  }, [loadCompanyFor]);

  const login = useCallback(
    async (email: string, password: string) => {
      const loggedInUser = await loginRequest(email, password);
      setUser(loggedInUser);
      await loadCompanyFor(loggedInUser);
      return loggedInUser;
    },
    [loadCompanyFor]
  );

  const setSessionUser = useCallback(
    (newUser: AppUser) => {
      setUser(newUser);
      loadCompanyFor(newUser);
    },
    [loadCompanyFor]
  );

  const logout = useCallback(() => {
    logoutRequest();
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
