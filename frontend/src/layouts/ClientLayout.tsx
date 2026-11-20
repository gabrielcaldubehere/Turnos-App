import {
  Link,
  Navigate,
  Outlet,
  NavLink,
  useNavigate,
  useParams,
} from "react-router-dom";
import useAuth from "../auth/useAuth";
import Logo from "../components/common/Logo";
import ThemeToggle from "../components/common/ThemeToggle";
import Icon from "../components/ui/Icon";
import { normalizeUsername } from "../utils/username";

function ClientLayout() {
  const { username } = useParams();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (user.role !== "client") return <Navigate to="/main" replace />;

  const panelUsername = normalizeUsername(username ?? "");
  if (!user.username || panelUsername !== user.username) {
    return <Navigate to={`/client/${user.username ?? ""}`} replace />;
  }

  const handleSignOut = () => {
    signOut();
    navigate("/main", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-0">
          <Link to={`/client/${user.username}`} aria-label="Ir a mi panel" className="self-start">
            <Logo />
          </Link>

          <nav
            aria-label="Navegación del cliente"
            className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end sm:gap-2"
          >
            <NavLink
              to={`/client/${user.username}`}
              end
              className={({ isActive }) =>
                `rounded-lg px-2 py-2 text-xs font-medium transition sm:px-3 sm:text-sm ${
                  isActive
                    ? "bg-sage-50 text-sage-700"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                }`
              }
            >
              Mis turnos
            </NavLink>
            <NavLink
              to={`/client/${user.username}/new`}
              aria-label="Nuevo Turno"
              className="inline-flex items-center gap-1.5 rounded-lg bg-sage-600 px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-sage-700 sm:px-3 sm:text-sm"
            >
              <Icon name="plus" className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Turno</span>
            </NavLink>
            <ThemeToggle compact />
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Salir"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900 sm:px-3 sm:text-sm"
            >
              <Icon name="logout" className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default ClientLayout;
