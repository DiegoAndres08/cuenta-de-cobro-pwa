import { CopyPlus, FolderOpen, Save } from 'lucide-react';
import type { DocumentTab } from '../types/quote';

interface SavedToolbarProps {
  activeTab: DocumentTab;
  savedCount: number;
  editingLabel: string | null;
  onOpenSaved: () => void;
  onSave: () => void;
  onSaveAsNew: () => void;
}

export function SavedToolbar({
  activeTab,
  savedCount,
  editingLabel,
  onOpenSaved,
  onSave,
  onSaveAsNew,
}: SavedToolbarProps) {
  const isEditingSaved = editingLabel !== null;
  const pluralLabel = activeTab === 'quote' ? 'Cotizaciones' : 'Cuentas';

  return (
    <section
      aria-label="Documentos guardados por cliente"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2.5 space-y-2"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSaved}
          className="flex-1 min-w-0 min-h-10 rounded-xl border border-slate-300 bg-slate-50/80 hover:bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
        >
          <FolderOpen className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="truncate">Guardadas</span>
          <span className="shrink-0 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-slate-900 text-white text-[11px] font-bold">
            {savedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={onSave}
          className="flex-1 min-w-0 min-h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
        >
          <Save className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {isEditingSaved ? 'Actualizar' : 'Guardar'}
          </span>
        </button>
      </div>

      {isEditingSaved && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50/80 border border-emerald-200/70 px-3 py-1.5 text-[11px]">
          <span className="text-emerald-900 font-medium truncate min-w-0">
            Editando guardada: <strong>{editingLabel}</strong>
          </span>
          <button
            type="button"
            onClick={onSaveAsNew}
            className="shrink-0 inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
            title={`Guardar como una nueva entrada en ${pluralLabel}`}
          >
            <CopyPlus className="w-3.5 h-3.5" />
            <span>Guardar copia</span>
          </button>
        </div>
      )}
    </section>
  );
}
