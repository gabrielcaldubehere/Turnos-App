import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginAdmin, loginClient } from "../services/appointmentService";
import AuthContext from "./authContextStore";
import type { SessionUser } from "./types";

const STORAGE_KEY = "turnos.session";
const guestUser: SessionUser = { role: "guest" };

function readStoredUser(): SessionUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return guestUser;
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    return parsed.role === "admin" || parsed.role === "client"
      ? (parsed as SessionUser)
      : guestUser;
  } catch {
    return guestUser;
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser>(readStoredUser);

  const persistUser = useCallback((nextUser: SessionUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const signInAdmin = useCallback(
    async (username: string, password: string) => {
      const response = await loginAdmin(username, password);
      persistUser({ role: "admin", token: response.token });
    },
    [persistUser],
  );

  const signInClient = useCallback(
    async (email: string) => {
      const response = await loginClient(email);
      persistUser({
        role: "client",
        email: response.email,
        token: response.token,
      });
    },
    [persistUser],
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(guestUser);
  }, []);

  const value = useMemo(
    () => ({ user, signInAdmin, signInClient, signOut }),
    [user, signInAdmin, signInClient, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
