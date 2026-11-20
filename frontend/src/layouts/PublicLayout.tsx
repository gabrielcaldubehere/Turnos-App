import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";
import useAuth from "../auth/useAuth";
import Logo from "../components/common/Logo";
import ThemeToggle from "../components/common/ThemeToggle";
import Icon from "../components/ui/Icon";
import { formatBusinessName } from "../utils/format";

function PublicLayout() {
  const { businessSlug = "negocio" } = useParams();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const businessName = formatBusinessName(businessSlug);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-2 py-2 text-xs font-medium transition sm:px-3 sm:text-sm ${
      isActive
        ? "bg-sage-50 text-sage-700"
        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
    }`;

  const handleSignOut = () => {
    signOut();
    navigate("/main", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-0">
          <Link to={`/b/${businessSlug}/booking`} aria-label="Ir al inicio" className="self-start">
            <Logo />
          </Link>

          <nav aria-label="Navegación de reservas" className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end sm:gap-2">
            <NavLink to={`/b/${businessSlug}/booking`} className={linkClass} end>
              Reservar
            </NavLink>
            {user.role === "client" && user.username ? (
              <>
                <NavLink
                  to={`/client/${user.username}`}
                  className={linkClass}
                >
                  Mis turnos
                </NavLink>
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Salir"
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900 sm:px-3 sm:text-sm"
                >
                  <Icon name="logout" className="h-4 w-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            ) : (
              <NavLink
                to="/main"
                className="inline-flex items-center gap-1.5 rounded-lg bg-sage-600 px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-sage-700 sm:px-3 sm:text-sm"
              >
                Ingresar
                <Icon name="arrow-right" className="h-4 w-4" />
              </NavLink>
            )}
            <ThemeToggle compact />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-zinc-500">
            Reserva online
          </span>
          <span className="rounded-full bg-sage-500/15 px-3 py-1 text-sm font-semibold text-sage-700">
            {businessName}
          </span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default PublicLayout;
