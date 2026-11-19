import { useNavigate } from "react-router-dom";
import useAuth from "../../auth/useAuth";
import Logo from "../common/Logo";
import Icon from "../ui/Icon";

type HeaderProps = {
  title: string;
};

function Header({ title }: HeaderProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Logo />
        <span className="hidden h-5 w-px bg-zinc-200 sm:block" aria-hidden="true" />
        <h1 className="hidden truncate text-sm font-medium text-zinc-500 sm:block">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full bg-sage-50 px-3 py-1 text-xs font-semibold text-sage-700 sm:inline-flex">
          Administrador
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
        >
          <Icon name="logout" className="h-3.5 w-3.5" />
          Salir
        </button>
      </div>
    </header>
  );
}

export default Header;
