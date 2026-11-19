import { Calendar, Hash, Plus } from 'lucide-react';
import { formatDateToDisplay, incrementConsecutive } from '../../utils/dateFormat';

interface HeaderSectionProps {
  dateIso: string;
  dateDisplay: string;
  consecutive: string;
  onChangeDateIso: (iso: string, formatted: string) => void;
  onChangeDateDisplay: (display: string) => void;
  onChangeConsecutive: (value: string) => void;
}

export function HeaderSection({
  dateIso,
  dateDisplay,
  consecutive,
  onChangeDateIso,
  onChangeDateDisplay,
  onChangeConsecutive,
}: HeaderSectionProps) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <Calendar className="w-4 h-4 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">
          Encabezado del documento
        </h2>
      </div>

      {/* Date row: editable text + synced native calendar picker */}
      <div className="space-y-1.5">
        <label
          htmlFor="invoice-date-display"
          className="block text-xs font-semibold text-slate-600"
        >
          Fecha (DD - Mes - AAAA)
        </label>
        <div className="flex gap-2">
          <input
            id="invoice-date-display"
            type="text"
            value={dateDisplay}
            onChange={(e) => onChangeDateDisplay(e.target.value)}
            placeholder="DD - Mes - AAAA"
            className="flex-1 min-w-0 min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
          />
          <label
            className="relative shrink-0 w-11 h-11 overflow-hidden rounded-xl border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 cursor-pointer active:scale-95 transition"
            title="Elegir fecha en calendario"
          >
            <Calendar className="w-4 h-4 pointer-events-none" />
            <input
              type="date"
              aria-label="Seleccionar fecha en calendario"
              value={dateIso}
              onChange={(e) => {
                const nextIso = e.target.value;
                if (nextIso) {
                  onChangeDateIso(nextIso, formatDateToDisplay(nextIso));
                }
              }}
              className="absolute inset-0 w-full h-full min-w-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Consecutive row */}
      <div className="space-y-1.5">
        <label
          htmlFor="invoice-consecutive"
          className="block text-xs font-semibold text-slate-600"
        >
          Consecutivo
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="invoice-consecutive"
              type="text"
              value={consecutive}
              onChange={(e) => onChangeConsecutive(e.target.value)}
              placeholder="Cuenta de cobro 001"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 pl-9 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>
          <button
            type="button"
            onClick={() => onChangeConsecutive(incrementConsecutive(consecutive))}
            className="shrink-0 min-h-11 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-0.5 active:scale-95 transition"
            title="Incrementar consecutivo (+1)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>1</span>
          </button>
        </div>
      </div>
    </section>
  );
}
