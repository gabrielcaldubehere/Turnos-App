import { NavLink } from "react-router-dom";
import Logo from "../common/Logo";
import Icon, { type IconName } from "../ui/Icon";

const navigationItems: { label: string; to: string; icon: IconName }[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: "dashboard" },
  { label: "Turnos", to: "/admin/appointments", icon: "calendar" },
  { label: "Clientes", to: "/admin/clients", icon: "users" },
  { label: "Profesionales", to: "/admin/professionals", icon: "professional" },
  { label: "Servicios", to: "/admin/services", icon: "services" },
];

function Sidebar() {
  return (
    <aside className="w-full border-b border-zinc-200 bg-white px-3 py-4 lg:w-64 lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
      <div className="flex items-center border-b border-zinc-100 px-2 pb-4 lg:px-3 lg:pb-5">
        <Logo subtitle="Panel administrativo" />
      </div>

      <nav aria-label="Navegación principal" className="mt-3 lg:mt-4">
        <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:flex lg:flex-col lg:gap-2">
          {navigationItems.map((item) => (
            <li key={item.to} className="min-w-0">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-xs font-medium transition-all duration-200 sm:gap-3 sm:px-3 sm:text-sm lg:py-2.5 ${
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
