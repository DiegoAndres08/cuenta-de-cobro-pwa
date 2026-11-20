import { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Copy,
  FolderOpen,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type { DocumentTab } from '../types/quote';
import { calculateInvoiceTotal, formatCOP } from '../utils/currency';
import { calculateQuoteTotals } from '../utils/quoteStorage';
import {
  type SavedInvoiceRecord,
  type SavedQuoteRecord,
  filterSavedInvoices,
  filterSavedQuotes,
  formatSavedTimestamp,
} from '../utils/savedDocumentsStorage';

interface SavedDocumentsModalProps {
  activeTab: DocumentTab;
  savedInvoices: SavedInvoiceRecord[];
  savedQuotes: SavedQuoteRecord[];
  activeSavedId: string | null;
  onClose: () => void;
  onLoadInvoice: (record: SavedInvoiceRecord) => void;
  onDuplicateInvoice: (record: SavedInvoiceRecord) => void;
  onDeleteInvoice: (id: string) => void;
  onLoadQuote: (record: SavedQuoteRecord) => void;
  onDuplicateQuote: (record: SavedQuoteRecord) => void;
  onDeleteQuote: (id: string) => void;
}

export function SavedDocumentsModal({
  activeTab,
  savedInvoices,
  savedQuotes,
  activeSavedId,
  onClose,
  onLoadInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
  onLoadQuote,
  onDuplicateQuote,
  onDeleteQuote,
}: SavedDocumentsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isQuote = activeTab === 'quote';
  const totalCount = isQuote ? savedQuotes.length : savedInvoices.length;
  const filteredInvoices = isQuote
    ? []
    : filterSavedInvoices(savedInvoices, searchQuery);
  const filteredQuotes = isQuote ? filterSavedQuotes(savedQuotes, searchQuery) : [];
  const visibleCount = isQuote ? filteredQuotes.length : filteredInvoices.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100">
      {/* Top Bar */}
      <header className="safe-area-top bg-slate-900 text-white px-3 py-3 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 active:scale-[0.98] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <div className="min-w-0 text-right">
            <h2 className="text-sm font-bold leading-tight truncate">
              {isQuote ? 'Cotizaciones guardadas' : 'Cuentas guardadas'}
            </h2>
            <p className="text-[11px] text-slate-300">
              {totalCount === 1
                ? '1 documento en este dispositivo'
                : `${totalCount} documentos en este dispositivo`}
            </p>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      {totalCount > 0 && (
        <div className="bg-white border-b border-slate-200 px-3.5 py-2.5">
          <div className="max-w-lg mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isQuote
                  ? 'Buscar por cliente, asunto, fecha o ítem...'
                  : 'Buscar por cliente, consecutivo, fecha o concepto...'
              }
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/70 pl-9 pr-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* List Content */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 safe-area-bottom">
        <div className="max-w-lg mx-auto space-y-3">
          {totalCount === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {isQuote
                  ? 'Aún no tienes cotizaciones guardadas'
                  : 'Aún no tienes cuentas de cobro guardadas'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Cuando completes un documento para un cliente, toca{' '}
                <strong className="text-slate-700">Guardar</strong> para conservarlo aquí y volver a abrirlo o eliminarlo cuando quieras.
              </p>
            </div>
          ) : visibleCount === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center space-y-1.5">
              <p className="text-sm font-semibold text-slate-700">
                No se encontraron coincidencias
              </p>
              <p className="text-xs text-slate-500">
                Intenta con otro nombre de cliente, fecha o palabra clave.
              </p>
            </div>
          ) : !isQuote ? (
            filteredInvoices.map((record) => {
              const total = calculateInvoiceTotal(record.data.concepts);
              const clientName =
                record.data.client.name.trim() || 'Sin nombre de cliente';
              const isCurrent = record.id === activeSavedId;
              const isConfirming = confirmDeleteId === record.id;

              return (
                <article
                  key={record.id}
                  className={`bg-white rounded-2xl border p-3.5 shadow-xs space-y-3 transition ${
                    isCurrent
                      ? 'border-emerald-400 ring-1 ring-emerald-200'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {clientName}
                        </h3>
                        {isCurrent && (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold shrink-0">
                            En edición
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 truncate">
                        {record.data.consecutive.trim() || 'Cuenta de cobro'}
                      </p>
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {record.data.dateDisplay.trim() || 'Sin fecha'}
                        </span>
                        <span>
                          {record.data.concepts.length}{' '}
                          {record.data.concepts.length === 1 ? 'ítem' : 'ítems'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block rounded-xl bg-slate-900 text-emerald-400 px-2.5 py-1 text-xs font-extrabold">
                        {formatCOP(total)}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatSavedTimestamp(record.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {isConfirming ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2">
                      <span className="text-xs font-semibold text-rose-800">
                        ¿Eliminar esta cuenta?
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDeleteId(null);
                            onDeleteInvoice(record.id);
                          }}
                          className="rounded-lg bg-rose-600 hover:bg-rose-700 px-2.5 py-1.5 text-xs font-semibold text-white"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onLoadInvoice(record)}
                        className="flex-1 min-h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 active:scale-[0.98] transition"
                      >
                        Abrir / Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateInvoice(record)}
                        className="min-h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 inline-flex items-center gap-1 active:scale-[0.98] transition"
                        title="Crear copia nueva para este cliente"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(record.id)}
                        className="min-h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 inline-flex items-center justify-center active:scale-[0.98] transition"
                        aria-label={`Eliminar cuenta de ${clientName}`}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          ) : (
            filteredQuotes.map((record) => {
              const { total } = calculateQuoteTotals(
                record.data.rows,
                record.data.discount
              );
              const clientName =
                record.data.clientName.trim() || 'Sin nombre de cliente';
              const isCurrent = record.id === activeSavedId;
              const isConfirming = confirmDeleteId === record.id;

              return (
                <article
                  key={record.id}
                  className={`bg-white rounded-2xl border p-3.5 shadow-xs space-y-3 transition ${
                    isCurrent
                      ? 'border-emerald-400 ring-1 ring-emerald-200'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {clientName}
                        </h3>
                        {isCurrent && (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold shrink-0">
                            En edición
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 truncate">
                        {record.data.subject.trim() || 'Cotización'}
                        {record.data.clientIdNumber.trim()
                          ? ` · ${record.data.clientIdNumber.trim()}`
                          : ''}
                      </p>
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {record.data.dateDisplay.trim() || 'Sin fecha'}
                        </span>
                        <span>
                          {record.data.rows.length}{' '}
                          {record.data.rows.length === 1 ? 'fila' : 'filas'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block rounded-xl bg-[#3E3B39] text-emerald-400 px-2.5 py-1 text-xs font-extrabold">
                        {formatCOP(total)}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatSavedTimestamp(record.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {isConfirming ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2">
                      <span className="text-xs font-semibold text-rose-800">
                        ¿Eliminar esta cotización?
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDeleteId(null);
                            onDeleteQuote(record.id);
                          }}
                          className="rounded-lg bg-rose-600 hover:bg-rose-700 px-2.5 py-1.5 text-xs font-semibold text-white"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onLoadQuote(record)}
                        className="flex-1 min-h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 active:scale-[0.98] transition"
                      >
                        Abrir / Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateQuote(record)}
                        className="min-h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 inline-flex items-center gap-1 active:scale-[0.98] transition"
                        title="Crear copia nueva para este cliente"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(record.id)}
                        className="min-h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 inline-flex items-center justify-center active:scale-[0.98] transition"
                        aria-label={`Eliminar cotización de ${clientName}`}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
