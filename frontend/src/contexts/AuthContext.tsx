import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth";
import type { User } from "../api/auth";
import { setVerificationGateState } from "../utils/verificationGate";

type AuthState = {
  user: User | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (input: authApi.RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setVerificationGateState(user ? !!user.email_verified_at : null);
  }, [user]);

  const refetchUser = useCallback(async () => {
    const u = await authApi.getCurrentUser();
    setUser(u);
  }, []);

  useEffect(() => {
    let cancelled = false;
    authApi.getCurrentUser().then((u) => {
      if (!cancelled) {
        setUser(u);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await authApi.getCsrfCookie();
      const { user: u } = await authApi.login(email, password);
      setUser(u);
    },
    [],
  );

  const register = useCallback(async (input: authApi.RegisterInput) => {
    await authApi.getCsrfCookie();
    const { user: u } = await authApi.register(input);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    register,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
