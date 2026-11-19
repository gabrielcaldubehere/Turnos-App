import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";
import useAuth from "../auth/useAuth";
import Logo from "../components/common/Logo";
import Icon from "../components/ui/Icon";
import { formatBusinessName } from "../utils/format";

function PublicLayout() {
  const { businessSlug = "negocio" } = useParams();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const businessName = formatBusinessName(businessSlug);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-sage-50 text-sage-700"
        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
    }`;

  const handleSignOut = () => {
    signOut();
    navigate(`/b/${businessSlug}/booking`, { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-6">
          <Link to={`/b/${businessSlug}/booking`} aria-label="Ir al inicio">
            <Logo />
          </Link>

          <nav aria-label="Navegación de reservas" className="flex items-center gap-1 sm:gap-2">
            <NavLink to={`/b/${businessSlug}/booking`} className={linkClass} end>
              Reservar
            </NavLink>
            {user.role === "client" ? (
              <>
                <NavLink
                  to={`/b/${businessSlug}/my-appointments`}
                  className={linkClass}
                >
                  Mis turnos
                </NavLink>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
                >
                  <Icon name="logout" className="h-4 w-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            ) : (
              <NavLink
                to={`/b/${businessSlug}/login`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sage-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sage-700"
              >
                Ingresar
                <Icon name="arrow-right" className="h-4 w-4" />
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl p-6">
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
