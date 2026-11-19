import { Building2, Eraser } from 'lucide-react';
import type { ClientInfo } from '../../types/invoice';

interface ClientSectionProps {
  client: ClientInfo;
  onChange: (next: ClientInfo) => void;
}

export function ClientSection({ client, onChange }: ClientSectionProps) {
  const hasAnyValue = Boolean(
    client.name.trim() ||
      client.documentType.trim() ||
      client.documentNumber.trim() ||
      client.address.trim()
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            Datos del Cliente (a quien se cobra)
          </h2>
        </div>
        {hasAnyValue && (
          <button
            type="button"
            onClick={() =>
              onChange({ name: '', documentType: '', documentNumber: '', address: '' })
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* 1. Nombre o Razón social */}
      <div className="space-y-1.5">
        <label
          htmlFor="client-name"
          className="block text-xs font-semibold text-slate-600"
        >
          Nombre o Razón social
        </label>
        <input
          id="client-name"
          type="text"
          value={client.name}
          onChange={(e) => onChange({ ...client, name: e.target.value })}
          placeholder="Nombre del cliente o empresa"
          className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
        />
      </div>

      {/* 2. Documento del cliente: Tipo (cuadro pequeño) + Número (cuadro al lado) */}
      <div className="space-y-1.5">
        <label
          htmlFor="client-doc-number"
          className="block text-xs font-semibold text-slate-600"
        >
          Documento del cliente (NIT, C.C., C.E., etc.)
        </label>
        <div className="grid grid-cols-12 gap-2.5">
          <div className="col-span-4">
            <input
              id="client-doc-type"
              type="text"
              list="client-doc-type-suggestions"
              aria-label="Tipo de documento del cliente"
              value={client.documentType}
              onChange={(e) => onChange({ ...client, documentType: e.target.value })}
              placeholder="Tipo"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
            <datalist id="client-doc-type-suggestions">
              <option value="NIT." />
              <option value="C.C." />
              <option value="C.E." />
              <option value="T.I." />
              <option value="PAS." />
            </datalist>
          </div>
          <div className="col-span-8">
            <input
              id="client-doc-number"
              type="text"
              value={client.documentNumber}
              onChange={(e) => onChange({ ...client, documentNumber: e.target.value })}
              placeholder="Número de documento"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>
        </div>
      </div>

      {/* 3. Dirección (siempre debajo de los dos cuadros de documento) */}
      <div className="space-y-1.5">
        <label
          htmlFor="client-address"
          className="block text-xs font-semibold text-slate-600"
        >
          Dirección
        </label>
        <input
          id="client-address"
          type="text"
          value={client.address}
          onChange={(e) => onChange({ ...client, address: e.target.value })}
          placeholder="Dirección del cliente"
          className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
        />
      </div>
    </section>
  );
}
