import { Calendar, Eraser, FileText } from 'lucide-react';
import { formatDateToSlashDisplay } from '../../utils/dateFormat';

interface QuoteHeaderSectionProps {
  dateIso: string;
  dateDisplay: string;
  subject: string;
  clientName: string;
  clientIdLabel: string;
  clientIdNumber: string;
  onChangeDateIso: (iso: string, formatted: string) => void;
  onChangeDateDisplay: (display: string) => void;
  onChangeSubject: (value: string) => void;
  onChangeClientName: (value: string) => void;
  onChangeClientIdLabel: (value: string) => void;
  onChangeClientIdNumber: (value: string) => void;
  onClearClient: () => void;
}

export function QuoteHeaderSection({
  dateIso,
  dateDisplay,
  subject,
  clientName,
  clientIdLabel,
  clientIdNumber,
  onChangeDateIso,
  onChangeDateDisplay,
  onChangeSubject,
  onChangeClientName,
  onChangeClientIdLabel,
  onChangeClientIdNumber,
  onClearClient,
}: QuoteHeaderSectionProps) {
  const hasClientData = Boolean(clientName.trim() || clientIdNumber.trim());

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3.5">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight truncate">
            Datos de la Cotización y Cliente
          </h2>
        </div>
        {hasClientData && (
          <button
            type="button"
            onClick={onClearClient}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Limpiar cliente</span>
          </button>
        )}
      </div>

      {/* 1. Fecha */}
      <div className="space-y-1.5">
        <label
          htmlFor="quote-date-display"
          className="block text-xs font-semibold text-slate-600"
        >
          Fecha (DD/MM/AAAA)
        </label>
        <div className="flex gap-2">
          <input
            id="quote-date-display"
            type="text"
            value={dateDisplay}
            onChange={(e) => onChangeDateDisplay(e.target.value)}
            placeholder="DD/MM/AAAA"
            className="flex-1 min-w-0 min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
          />
          <label
            className="relative shrink-0 w-11 h-11 overflow-hidden rounded-xl border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 cursor-pointer active:scale-95 transition"
            title="Elegir fecha en calendario"
          >
            <Calendar className="w-4 h-4 pointer-events-none" />
            <input
              type="date"
              aria-label="Seleccionar fecha de cotización"
              value={dateIso}
              onChange={(e) => {
                const nextIso = e.target.value;
                if (nextIso) {
                  onChangeDateIso(nextIso, formatDateToSlashDisplay(nextIso));
                }
              }}
              className="absolute inset-0 w-full h-full min-w-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 2. Asunto */}
      <div className="space-y-1.5">
        <label
          htmlFor="quote-subject"
          className="block text-xs font-semibold text-slate-600"
        >
          Asunto
        </label>
        <input
          id="quote-subject"
          type="text"
          value={subject}
          onChange={(e) => onChangeSubject(e.target.value)}
          placeholder="Cotización"
          className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
        />
      </div>

      {/* 3. Cliente */}
      <div className="space-y-1.5">
        <label
          htmlFor="quote-client-name"
          className="block text-xs font-semibold text-slate-600"
        >
          Cliente (nombre o razón social)
        </label>
        <input
          id="quote-client-name"
          type="text"
          value={clientName}
          onChange={(e) => onChangeClientName(e.target.value)}
          placeholder="Cliente Ejemplo S.A.S."
          className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
        />
      </div>

      {/* 4. Identificación del cliente (RUT / NIT / C.C.) */}
      <div className="space-y-1.5">
        <label
          htmlFor="quote-client-id-number"
          className="block text-xs font-semibold text-slate-600"
        >
          Documento del cliente (RUT, NIT, C.C., etc.)
        </label>
        <div className="grid grid-cols-12 gap-2.5">
          <div className="col-span-4 min-w-0">
            <input
              id="quote-client-id-label"
              type="text"
              list="quote-client-id-suggestions"
              aria-label="Tipo de documento del cliente"
              value={clientIdLabel}
              onChange={(e) => onChangeClientIdLabel(e.target.value)}
              placeholder="RUT"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
            <datalist id="quote-client-id-suggestions">
              <option value="RUT" />
              <option value="NIT" />
              <option value="C.C." />
              <option value="C.E." />
            </datalist>
          </div>
          <div className="col-span-8 min-w-0">
            <input
              id="quote-client-id-number"
              type="text"
              value={clientIdNumber}
              onChange={(e) => onChangeClientIdNumber(e.target.value)}
              placeholder="000.000.000-0"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
