import { useEffect, useState, type FormEvent } from "react";
import Icon from "../components/ui/Icon";
import {
  createService,
  getServices,
  updateService,
} from "../services/appointmentService";
import type { ServiceInput, ServiceOption } from "../types/appointment";
import { formatCurrency } from "../utils/format";

const emptyForm: ServiceInput = {
  name: "",
  durationMinutes: 30,
  price: 0,
  description: "",
};

function ServicesAdminPage() {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [form, setForm] = useState<ServiceInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    getServices()
      .then((data) => {
        if (active) setServices(data);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar los servicios.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  const startEdit = (service: ServiceOption) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
      description: service.description,
    });
    setError(null);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateService(editingId, form);
      } else {
        await createService(form);
      }
      startCreate();
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo guardar el servicio.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Configuración</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Servicios
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Los cambios se reflejan en el formulario de reserva al recargarlo.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-700"
        >
          <Icon name="plus" className="h-4 w-4" />
          Agregar servicio
        </button>
      </header>

      <form onSubmit={handleSubmit} className="surface space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            {editingId ? "Modificar servicio" : "Nuevo servicio"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition hover:text-zinc-800"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="text-xs font-medium text-zinc-700">
            Nombre
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
              required
            />
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Duración (min)
            <input
              type="number"
              min={15}
              step={15}
              value={form.durationMinutes}
              onChange={(event) =>
                setForm({ ...form, durationMinutes: Number(event.target.value) })
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
              required
            />
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Precio
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(event) =>
                setForm({ ...form, price: Number(event.target.value) })
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
              required
            />
          </label>
        </div>

        <label className="block text-xs font-medium text-zinc-700">
          Descripción
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            rows={2}
            className="mt-1.5 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
          />
        </label>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name="check" className="h-4 w-4" />
          {saving
            ? "Guardando..."
            : editingId
              ? "Guardar cambios"
              : "Agregar servicio"}
        </button>
      </form>

      <div className="surface hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/70 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-medium">Servicio</th>
              <th className="px-5 py-3 font-medium">Duración</th>
              <th className="px-5 py-3 font-medium">Precio</th>
              <th className="px-5 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-zinc-500">
                  Cargando...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-zinc-500">
                  No hay servicios cargados.
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-zinc-900">{service.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {service.description || "Sin descripción"}
                    </p>
                  </td>
                  <td className="px-5 py-4 tabular-nums text-zinc-600">
                    {service.durationMinutes} min
                  </td>
                  <td className="px-5 py-4 tabular-nums text-zinc-600">
                    {formatCurrency(service.price)}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => startEdit(service)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-sage-300 hover:bg-sage-50"
                    >
                      Modificar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="surface px-5 py-8 text-center text-sm text-zinc-500">
            Cargando...
          </div>
        ) : services.length === 0 ? (
          <div className="surface px-5 py-8 text-center text-sm text-zinc-500">
            No hay servicios cargados.
          </div>
        ) : (
          services.map((service) => (
            <div key={service.id} className="surface flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold text-zinc-900">
                  {service.name}
                </p>
                <p className="mt-0.5 break-words text-xs text-zinc-500">
                  {service.description || "Sin descripción"}
                </p>
                <p className="mt-2 text-xs tabular-nums text-zinc-600">
                  {service.durationMinutes} min · {formatCurrency(service.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(service)}
                className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Modificar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ServicesAdminPage;
