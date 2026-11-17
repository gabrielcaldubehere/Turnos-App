import { NavLink } from "react-router-dom";
import Icon, { type IconName } from "../ui/Icon";

const navigationItems: { label: string; to: string; icon: IconName }[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: "dashboard" },
  { label: "Turnos", to: "/admin/appointments", icon: "calendar" },
  { label: "Clientes", to: "/admin/clients", icon: "users" },
  { label: "Profesionales", to: "/admin/professionals", icon: "professional" },
  { label: "Servicios", to: "/admin/services", icon: "services" },
  { label: "Configuración", to: "/admin/settings", icon: "settings" },
];

function Sidebar() {
  return (
    <aside className="w-full border-b border-zinc-200 bg-white px-3 py-4 lg:w-64 lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
      <div className="flex items-center gap-3 border-b border-zinc-100 px-2 pb-5 lg:px-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-500 text-white shadow-card">
          <Icon name="dashboard" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">Turnos AI</p>
          <p className="truncate text-xs text-zinc-400">Panel administrativo</p>
        </div>
      </div>

      <nav aria-label="Navegación principal" className="mt-4">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-2 lg:overflow-visible">
          {navigationItems.map((item) => (
            <li key={item.to} className="shrink-0">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-sage-500/10 text-sage-700 ring-1 ring-sage-500/20"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                    {isActive && (
                      <span
                        className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-sage-500 lg:block"
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
