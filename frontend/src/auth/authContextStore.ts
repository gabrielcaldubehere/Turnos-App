import { createContext } from "react";
import type { SessionUser } from "./types";

export type AuthContextValue = {
  user: SessionUser;
  signInAdmin: (username: string, password: string) => Promise<void>;
  signInClient: (email: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export default AuthContext;
