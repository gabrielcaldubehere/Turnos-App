export type UserRole = "guest" | "client" | "admin";

export interface SessionUser {
  role: UserRole;
  email?: string;
  token?: string;
}
