export type UserRole = "guest" | "client" | "admin";

export interface SessionUser {
  role: UserRole;
  username?: string;
  email?: string;
  token?: string;
}
