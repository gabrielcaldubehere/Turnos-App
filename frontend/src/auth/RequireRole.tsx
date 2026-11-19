import type { ReactNode } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
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
  const { businessSlug } = useParams();

  if (user.role !== role) {
    const fallback =
      role === "admin"
        ? "/admin/login"
        : businessSlug
          ? `/b/${businessSlug}/login`
          : "/admin/login";

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
