import { createContext } from "react";
import type { SessionUser } from "./types";

export type AuthContextValue = {
  user: SessionUser;
  signIn: (username: string, password: string) => Promise<SessionUser>;
  signUpClient: (username: string, password: string) => Promise<SessionUser>;
  signInAdmin: (username: string, password: string) => Promise<SessionUser>;
  signInClient: (username: string, password: string) => Promise<SessionUser>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export default AuthContext;
