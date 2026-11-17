import { Outlet, useParams } from "react-router-dom";

function PublicLayout() {
  const { businessSlug } = useParams();

  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center border-b border-zinc-200 bg-white px-6">
        <span className="text-sm font-medium text-zinc-500">Reserva online</span>
        <span className="ml-3 rounded-full bg-sage-500/15 px-3 py-1 text-sm font-semibold text-sage-700">
          {businessSlug}
        </span>
      </header>
      <main className="mx-auto w-full max-w-3xl p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default PublicLayout;
