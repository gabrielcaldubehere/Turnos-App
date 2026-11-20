import { useCallback, useMemo, useState, type ReactNode } from "react";
import { login, registerClient } from "../services/appointmentService";
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

  const persistUser = useCallback((nextUser: SessionUser): SessionUser => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const signIn = useCallback(
    async (username: string, password: string) => {
      const response = await login(username, password);
      return persistUser({
        role: response.role,
        username: response.username,
        email: response.email,
        token: response.token,
      });
    },
    [persistUser],
  );

  const signUpClient = useCallback(
    async (username: string, password: string) => {
      const response = await registerClient(username, password);
      return persistUser({
        role: "client",
        username: response.username,
        token: response.token,
      });
    },
    [persistUser],
  );

  const signInAdmin = useCallback(
    async (username: string, password: string) => {
      const session = await signIn(username, password);
      if (session.role !== "admin") {
        throw new Error("Las credenciales no corresponden a un administrador.");
      }
      return session;
    },
    [signIn],
  );

  const signInClient = useCallback(
    async (username: string, password: string) => {
      const session = await signIn(username, password);
      if (session.role !== "client") {
        throw new Error("Las credenciales no corresponden a un cliente.");
      }
      return session;
    },
    [signIn],
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(guestUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      signIn,
      signUpClient,
      signInAdmin,
      signInClient,
      signOut,
    }),
    [user, signIn, signUpClient, signInAdmin, signInClient, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
