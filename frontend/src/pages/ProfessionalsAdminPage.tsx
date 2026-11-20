import { useEffect, useState, type FormEvent } from "react";
import Icon from "../components/ui/Icon";
import {
  createProfessional,
  getProfessionals,
  updateProfessional,
} from "../services/appointmentService";
import type {
  ProfessionalInput,
  ProfessionalOption,
} from "../types/appointment";

const emptyForm: ProfessionalInput = {
  name: "",
  specialty: null,
  active: true,
};

function ProfessionalsAdminPage() {
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [form, setForm] = useState<ProfessionalInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    getProfessionals()
      .then((data) => {
        if (active) setProfessionals(data);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar los profesionales.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  const startEdit = (professional: ProfessionalOption) => {
    setEditingId(professional.id);
    setForm({
      name: professional.name,
      specialty: professional.specialty,
      active: professional.active,
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
        await updateProfessional(editingId, form);
      } else {
        await createProfessional(form);
      }
      startCreate();
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo guardar el profesional.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Equipo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Profesionales
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Creá y editá profesionales disponibles para las reservas.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-700"
        >
          <Icon name="plus" className="h-4 w-4" />
          Agregar profesional
        </button>
      </header>

      <form onSubmit={handleSubmit} className="surface space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            {editingId ? "Modificar profesional" : "Nuevo profesional"}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            Especialidad
            <input
              value={form.specialty ?? ""}
              onChange={(event) =>
                setForm({ ...form, specialty: event.target.value || null })
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) =>
              setForm({ ...form, active: event.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-300 accent-sage-600"
          />
          Disponible para reservas
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
              : "Agregar profesional"}
        </button>
      </form>

      <div className="surface hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/70 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-medium">Profesional</th>
              <th className="px-5 py-3 font-medium">Especialidad</th>
              <th className="px-5 py-3 font-medium">Estado</th>
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
            ) : professionals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-zinc-500">
                  No hay profesionales cargados.
                </td>
              </tr>
            ) : (
              professionals.map((professional) => (
                <tr key={professional.id}>
                  <td className="px-5 py-4 font-medium text-zinc-900">
                    {professional.name}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {professional.specialty ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        professional.active
                          ? "bg-sage-50 text-sage-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {professional.active ? "Disponible" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => startEdit(professional)}
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
        ) : professionals.length === 0 ? (
          <div className="surface px-5 py-8 text-center text-sm text-zinc-500">
            No hay profesionales cargados.
          </div>
        ) : (
          professionals.map((professional) => (
            <div key={professional.id} className="surface flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold text-zinc-900">
                  {professional.name}
                </p>
                <p className="mt-0.5 break-words text-xs text-zinc-500">
                  {professional.specialty ?? "Sin especialidad"}
                </p>
                <p className="mt-2 text-xs text-zinc-600">
                  {professional.active ? "Disponible" : "Inactivo"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(professional)}
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

export default ProfessionalsAdminPage;
