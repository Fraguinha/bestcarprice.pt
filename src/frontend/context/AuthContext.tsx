import { createContext, useEffect, useState, type ReactNode } from "react";
import { checkAuthStatus, login as apiLogin, logout as apiLogout } from "@/lib/api";
import type { User } from "@/types/user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus()
      .then((status) => {
        if (status.authenticated && status.user) {
          setUser(status.user);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    if (response.success && response.user) {
      setUser(response.user);
    } else {
      throw new Error(response.error || "Falha na autenticação");
    }
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
