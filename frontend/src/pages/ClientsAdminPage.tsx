import { Fragment, useEffect, useState } from "react";
import Icon from "../components/ui/Icon";
import { getClients, updateClient } from "../services/appointmentService";
import type { ClientRecord, ClientUpdate } from "../types/appointment";

type ClientDraft = {
  username: string;
  name: string;
  phone: string;
  email: string;
  age: string;
};

const inputClass =
  "mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25";

function toDraft(client: ClientRecord): ClientDraft {
  return {
    username: client.username,
    name: client.name ?? "",
    phone: client.phone ?? "",
    email: client.email ?? "",
    age: client.age === null ? "" : String(client.age),
  };
}

function ClientsAdminPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ClientDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    getClients()
      .then((data) => {
        if (active) setClients(data);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar los clientes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  const startEdit = (client: ClientRecord) => {
    setEditingId(client.username);
    setDraft(toDraft(client));
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!editingId || !draft) return;
    setSaving(true);
    setError(null);

    const age = draft.age.trim();
    const payload: ClientUpdate = {
      username: draft.username.trim() || undefined,
      name: draft.name.trim() || undefined,
      phone: draft.phone.trim() || undefined,
      email: draft.email.trim() || undefined,
      age: age ? Number(age) : undefined,
    };

    try {
      await updateClient(editingId, payload);
      cancelEdit();
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo guardar el cliente.",
      );
    } finally {
      setSaving(false);
    }
  };

  const renderFields = () => {
    if (!draft) return null;
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="min-w-0 text-xs font-medium text-zinc-700">
          Nombre
          <input
            value={draft.name}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
            className={inputClass}
          />
        </label>
        <label className="min-w-0 text-xs font-medium text-zinc-700">
          Usuario
          <input
            value={draft.username}
            onChange={(event) =>
              setDraft({ ...draft, username: event.target.value })
            }
            className={inputClass}
          />
        </label>
        <label className="min-w-0 text-xs font-medium text-zinc-700">
          Teléfono
          <input
            value={draft.phone}
            onChange={(event) =>
              setDraft({ ...draft, phone: event.target.value })
            }
            className={inputClass}
          />
        </label>
        <label className="min-w-0 text-xs font-medium text-zinc-700">
          Email
          <input
            type="email"
            value={draft.email}
            onChange={(event) =>
              setDraft({ ...draft, email: event.target.value })
            }
            className={inputClass}
          />
        </label>
        <label className="min-w-0 text-xs font-medium text-zinc-700">
          Edad
          <input
            type="number"
            min={1}
            max={120}
            value={draft.age}
            onChange={(event) =>
              setDraft({ ...draft, age: event.target.value })
            }
            className={inputClass}
          />
        </label>
      </div>
    );
  };

  const renderActions = () => (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-lg bg-sage-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon name="check" className="h-3.5 w-3.5" />
        {saving ? "Guardando..." : "Guardar"}
      </button>
      <button
        type="button"
        onClick={cancelEdit}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
      >
        Cancelar
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Clientes</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          Clientes registrados
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Editá los datos directamente en la fila y guardá los cambios.
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="surface flex items-center justify-center gap-3 px-5 py-12 text-sm text-zinc-500">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-sage-500 border-t-transparent"
            aria-hidden="true"
          />
          Cargando clientes...
        </div>
      ) : clients.length === 0 ? (
        <div className="surface px-5 py-12 text-center text-sm text-zinc-500">
          No hay clientes registrados todavía.
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <div className="surface overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/70 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Teléfono</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Edad</th>
                    <th className="px-4 py-3 font-medium">Turnos</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {clients.map((client) => {
                    const isEditing = editingId === client.username;
                    return (
                      <Fragment key={client.username}>
                        <tr className="align-top">
                          <td className="px-4 py-3 font-medium text-zinc-900">
                            {client.name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-zinc-600">
                            {client.username}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-zinc-600">
                            {client.phone ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-zinc-600">
                            {client.email ?? "—"}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-zinc-600">
                            {client.age ?? "—"}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-zinc-600">
                            {client.appointmentsCount}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => startEdit(client)}
                              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-sage-300 hover:bg-sage-50"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                        {isEditing && (
                          <tr>
                            <td colSpan={7} className="px-4 pb-4">
                              <div className="space-y-3 rounded-lg border border-sage-200 bg-sage-50/60 p-3">
                                {renderFields()}
                                {renderActions()}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {clients.map((client) => {
              const isEditing = editingId === client.username;
              return (
                <div key={client.username} className="surface space-y-3 p-4">
                  {isEditing ? (
                    <>
                      {renderFields()}
                      {renderActions()}
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-zinc-900">
                            {client.name ?? "Sin nombre"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            @{client.username} · {client.appointmentsCount} turnos
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startEdit(client)}
                          className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                        >
                          Editar
                        </button>
                      </div>
                      <dl className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <dt className="text-zinc-500">Teléfono</dt>
                          <dd className="break-all text-zinc-800">
                            {client.phone ?? "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-zinc-500">Edad</dt>
                          <dd className="text-zinc-800">{client.age ?? "—"}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-zinc-500">Email</dt>
                          <dd className="break-all text-zinc-800">
                            {client.email ?? "—"}
                          </dd>
                        </div>
                      </dl>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default ClientsAdminPage;
