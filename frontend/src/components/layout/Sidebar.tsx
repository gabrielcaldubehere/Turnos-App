const navigationItems = [
  { label: "Dashboard", href: "#dashboard" },
  { label: "Turnos", href: "#appointments" },
  { label: "Clientes", href: "#clients" },
  { label: "Servicios", href: "#services" },
  { label: "Configuración", href: "#settings" },
];

function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4">
      <nav aria-label="Navegación principal">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
