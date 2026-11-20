import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "./useAuth";
import type { UserRole } from "./types";

type RequireRoleProps = {
  role: Exclude<UserRole, "guest">;
  redirectTo?: string;
  children: ReactNode;
};

function RequireRole({ role, redirectTo, children }: RequireRoleProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (user.role !== role) {
    const fallback = "/main";

    return (
      <Navigate
        to={redirectTo ?? fallback}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}

export default RequireRole;
