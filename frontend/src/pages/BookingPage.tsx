import { useParams } from "react-router-dom";

function BookingPage() {
  const { businessSlug } = useParams();

  return (
    <section className="surface p-6">
      <p className="eyebrow">RESERVA ONLINE</p>
      <h1 className="mt-2 text-3xl font-bold text-zinc-900">Reservá tu turno</h1>
      <p className="mt-2 text-zinc-500">
        Estás reservando con{" "}
        <span className="font-medium text-zinc-700">{businessSlug}</span>.
      </p>
      <p className="mt-6 rounded-lg bg-sage-500/10 p-4 text-sm text-sage-700">
        La selección de servicios y profesionales estará disponible próximamente.
      </p>
    </section>
  );
}

export default BookingPage;
