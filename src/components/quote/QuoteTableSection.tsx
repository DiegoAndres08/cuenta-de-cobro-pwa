import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Columns3,
  GripVertical,
  Plus,
  RotateCcw,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import type { QuoteColumn, QuoteRow } from '../../types/quote';
import {
  formatCOP,
  formatNumberInput,
  parseCurrencyInput,
} from '../../utils/currency';
import {
  DEFAULT_QUOTE_COLUMNS,
  calculateQuoteRowTotal,
  createEmptyQuoteRow,
  createQuoteId,
} from '../../utils/quoteStorage';

interface QuoteTableSectionProps {
  columns: QuoteColumn[];
  rows: QuoteRow[];
  onChangeColumns: (next: QuoteColumn[]) => void;
  onChangeRows: (next: QuoteRow[]) => void;
}

const MAX_QUANTITY = 999_999;

export function QuoteTableSection({
  columns,
  rows,
  onChangeColumns,
  onChangeRows,
}: QuoteTableSectionProps) {
  const [newColumnLabel, setNewColumnLabel] = useState('');
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null);
  const [focusedColInputId, setFocusedColInputId] = useState<string | null>(null);

  const customColumns = columns.filter((c) => c.kind === 'custom');
  const descCol = columns.find((c) => c.kind === 'description');
  const qtyCol = columns.find((c) => c.kind === 'quantity');
  const priceCol = columns.find((c) => c.kind === 'unitPrice');
  const totalCol = columns.find((c) => c.kind === 'rowTotal');

  const missingStandardCols = DEFAULT_QUOTE_COLUMNS.filter(
    (def) => !columns.some((c) => c.kind === def.kind)
  );

  const isDefaultColumns =
    columns.length === DEFAULT_QUOTE_COLUMNS.length &&
    columns.every(
      (col, idx) =>
        col.kind === DEFAULT_QUOTE_COLUMNS[idx].kind &&
        col.label === DEFAULT_QUOTE_COLUMNS[idx].label
    );

  const clearQuantityDraft = (id: string) => {
    setQuantityDrafts((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleAddColumn = () => {
    const label = newColumnLabel.trim();
    if (!label) return;

    const newCol: QuoteColumn = {
      id: createQuoteId('col'),
      label,
      kind: 'custom',
    };

    // Insert custom columns right before Cantidad or Precio so numeric columns stay at right
    const qtyIndex = columns.findIndex(
      (c) => c.kind === 'quantity' || c.kind === 'unitPrice'
    );
    const insertAt = qtyIndex >= 0 ? qtyIndex : columns.length;
    const nextCols = [...columns];
    nextCols.splice(insertAt, 0, newCol);

    onChangeColumns(nextCols);
    setNewColumnLabel('');
  };

  const handleRestoreStandardColumn = (col: QuoteColumn) => {
    if (columns.some((c) => c.kind === col.kind)) return;
    const order = DEFAULT_QUOTE_COLUMNS.map((d) => d.kind);
    const targetOrderIdx = order.indexOf(col.kind);

    let insertAt = columns.length;
    for (let i = 0; i < columns.length; i++) {
      const currOrderIdx = order.indexOf(columns[i].kind);
      if (currOrderIdx >= 0 && currOrderIdx > targetOrderIdx) {
        insertAt = i;
        break;
      }
    }

    const nextCols = [...columns];
    nextCols.splice(insertAt, 0, { ...col });
    onChangeColumns(nextCols);
  };

  const handleRemoveColumn = (colId: string) => {
    if (columns.length <= 1) return;
    const target = columns.find((c) => c.id === colId);
    if (!target) return;

    onChangeColumns(columns.filter((c) => c.id !== colId));

    if (target.kind === 'custom') {
      onChangeRows(
        rows.map((row) => {
          if (!(colId in row.customValues)) return row;
          const nextCustom = { ...row.customValues };
          delete nextCustom[colId];
          return { ...row, customValues: nextCustom };
        })
      );
    } else if (target.kind === 'quantity') {
      setQuantityDrafts({});
      onChangeRows(rows.map((row) => ({ ...row, quantity: 1 })));
    } else if (target.kind === 'unitPrice') {
      onChangeRows(rows.map((row) => ({ ...row, unitPrice: 0 })));
    } else if (target.kind === 'description') {
      onChangeRows(rows.map((row) => ({ ...row, description: '' })));
    }
  };

  const handleRenameColumn = (colId: string, label: string) => {
    onChangeColumns(
      columns.map((c) => (c.id === colId ? { ...c, label } : c))
    );
  };

  const handleMoveColumn = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= columns.length ||
      toIndex >= columns.length
    ) {
      return;
    }
    const nextCols = [...columns];
    const [moved] = nextCols.splice(fromIndex, 1);
    nextCols.splice(toIndex, 0, moved);
    onChangeColumns(nextCols);
  };

  const handleResetColumns = () => {
    onChangeColumns(DEFAULT_QUOTE_COLUMNS.map((c) => ({ ...c })));
    onChangeRows(rows.map((r) => ({ ...r, customValues: {} })));
  };

  const handleUpdateRow = (id: string, patch: Partial<QuoteRow>) => {
    onChangeRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleUpdateCustomCell = (rowId: string, colId: string, value: string) => {
    onChangeRows(
      rows.map((r) =>
        r.id === rowId
          ? { ...r, customValues: { ...r.customValues, [colId]: value } }
          : r
      )
    );
  };

  const handleQuantityChange = (id: string, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      setQuantityDrafts((prev) => ({ ...prev, [id]: '' }));
      handleUpdateRow(id, { quantity: 1 });
      return;
    }

    const parsed = Number.parseInt(digits, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setQuantityDrafts((prev) => ({ ...prev, [id]: digits }));
      handleUpdateRow(id, { quantity: 1 });
      return;
    }

    const clamped = Math.min(parsed, MAX_QUANTITY);
    clearQuantityDraft(id);
    handleUpdateRow(id, { quantity: clamped });
  };

  const handleAddRow = () => {
    onChangeRows([...rows, createEmptyQuoteRow()]);
  };

  const handleRemoveRow = (id: string) => {
    clearQuantityDraft(id);
    if (rows.length <= 1) {
      onChangeRows([createEmptyQuoteRow()]);
      return;
    }
    onChangeRows(rows.filter((r) => r.id !== id));
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3.5">
      {/* Header + Column Manager Toggle */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Table2 className="w-4 h-4 text-slate-500 shrink-0" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight truncate">
            Tabla de ítems ({rows.length})
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowColumnManager((prev) => !prev)}
          className={`shrink-0 inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition ${
            showColumnManager || !isDefaultColumns
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          <Columns3 className="w-3.5 h-3.5" />
          <span>Columnas ({columns.length})</span>
        </button>
      </div>

      {/* Variable Columns Manager */}
      {showColumnManager && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">
              Columnas activas (arrastra o usa las flechas)
            </span>
            {!isDefaultColumns && (
              <button
                type="button"
                onClick={handleResetColumns}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar por defecto</span>
              </button>
            )}
          </div>

          {/* Sortable active columns list (drag & drop + up/down arrows + rename + remove) */}
          <div className="space-y-1.5">
            {columns.map((col, idx) => {
              const isDragging = draggedColIndex === idx;
              const isDragTarget =
                dragOverColIndex === idx &&
                draggedColIndex !== null &&
                draggedColIndex !== idx;

              return (
                <div
                  key={col.id}
                  draggable={focusedColInputId !== col.id}
                  onDragStart={(e) => {
                    setDraggedColIndex(idx);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(idx));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverColIndex !== idx) {
                      setDragOverColIndex(idx);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverColIndex === idx) {
                      setDragOverColIndex(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedColIndex !== null && draggedColIndex !== idx) {
                      handleMoveColumn(draggedColIndex, idx);
                    }
                    setDraggedColIndex(null);
                    setDragOverColIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedColIndex(null);
                    setDragOverColIndex(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-xs transition ${
                    col.kind === 'custom'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-700'
                  } ${isDragging ? 'opacity-45' : ''} ${
                    isDragTarget
                      ? 'ring-2 ring-slate-900 border-slate-900'
                      : ''
                  }`}
                >
                  <span
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                    title="Arrastra para reordenar"
                    aria-hidden="true"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </span>

                  <span className="w-4 text-center text-[11px] font-bold text-slate-400 shrink-0 select-none">
                    {idx + 1}
                  </span>

                  <input
                    type="text"
                    aria-label={`Nombre de columna ${col.label}`}
                    value={col.label}
                    onFocus={() => setFocusedColInputId(col.id)}
                    onBlur={() => setFocusedColInputId(null)}
                    onChange={(e) => handleRenameColumn(col.id, e.target.value)}
                    className="flex-1 min-w-0 bg-transparent font-semibold focus:outline-none text-xs px-1 py-0.5 rounded focus:bg-white/80"
                  />

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveColumn(idx, idx - 1)}
                      className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-600 disabled:opacity-25 transition"
                      aria-label={`Mover columna ${col.label} a la izquierda`}
                      title="Mover antes"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === columns.length - 1}
                      onClick={() => handleMoveColumn(idx, idx + 1)}
                      className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-600 disabled:opacity-25 transition"
                      aria-label={`Mover columna ${col.label} a la derecha`}
                      title="Mover después"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(col.id)}
                        className={`p-1 rounded-lg transition ${
                          col.kind === 'custom'
                            ? 'hover:bg-emerald-200/70 text-emerald-800'
                            : 'hover:bg-rose-100 text-slate-500 hover:text-rose-600'
                        }`}
                        aria-label={`Quitar columna ${col.label}`}
                        title="Quitar columna"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick restore chips for any removed standard columns */}
          {missingStandardCols.length > 0 && (
            <div className="space-y-1">
              <span className="block text-[11px] font-medium text-slate-500">
                Volver a agregar columnas estándar:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missingStandardCols.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleRestoreStandardColumn(col)}
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white hover:border-slate-900 hover:text-slate-900 px-2 py-1 text-[11px] font-medium text-slate-600 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{col.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add custom column input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newColumnLabel}
              onChange={(e) => setNewColumnLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddColumn();
                }
              }}
              placeholder="Nueva columna (ej. Medidas, Material)"
              className="flex-1 min-w-0 min-h-10 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <button
              type="button"
              onClick={handleAddColumn}
              disabled={!newColumnLabel.trim()}
              className="shrink-0 min-h-10 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-40 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Puedes renombrar, quitar cualquier columna (ej. dejar solo Medidas y Precio) o añadir columnas personalizadas.
          </p>
        </div>
      )}

      {/* Dynamic Rows List */}
      <div className="space-y-3">
        {rows.map((row, index) => {
          const rowTotal = calculateQuoteRowTotal(row);

          return (
            <div
              key={row.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center justify-center rounded-lg bg-[#3E3B39] text-white text-xs font-bold px-2.5 py-1">
                  Fila {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveRow(row.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  aria-label={`Eliminar fila ${index + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{rows.length > 1 ? 'Eliminar' : 'Limpiar'}</span>
                </button>
              </div>

              {/* Description (only when Description column is active) */}
              {descCol && (
                <div className="space-y-1.5">
                  <label
                    htmlFor={`quote-row-desc-${row.id}`}
                    className="block text-xs font-semibold text-slate-600"
                  >
                    {descCol.label.trim() || 'Descripción'}
                  </label>
                  <textarea
                    id={`quote-row-desc-${row.id}`}
                    rows={2}
                    value={row.description}
                    onChange={(e) =>
                      handleUpdateRow(row.id, { description: e.target.value })
                    }
                    placeholder="Detalle del producto o servicio"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition resize-y"
                  />
                </div>
              )}

              {/* Custom Columns Inputs (if any) */}
              {customColumns.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {customColumns.map((col) => (
                    <div key={col.id} className="min-w-0 space-y-1.5">
                      <label
                        htmlFor={`quote-row-${row.id}-${col.id}`}
                        className="block text-xs font-semibold text-slate-600 truncate"
                      >
                        {col.label.trim() || 'Columna'}
                      </label>
                      <input
                        id={`quote-row-${row.id}-${col.id}`}
                        type="text"
                        value={row.customValues[col.id] ?? ''}
                        onChange={(e) =>
                          handleUpdateCustomCell(row.id, col.id, e.target.value)
                        }
                        placeholder={col.label.trim() || 'Valor'}
                        className="w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity and/or Unit Price (only rendered for active columns) */}
              {(qtyCol || priceCol) && (
                <div className="grid grid-cols-12 gap-2.5 items-end">
                  {qtyCol && (
                    <div
                      className={`${
                        priceCol ? 'col-span-4' : 'col-span-12'
                      } min-w-0 space-y-1.5`}
                    >
                      <label
                        htmlFor={`quote-row-qty-${row.id}`}
                        className="block text-xs font-semibold text-slate-600 truncate"
                      >
                        {qtyCol.label.trim() || 'Cantidad'}
                      </label>
                      <input
                        id={`quote-row-qty-${row.id}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        value={
                          row.id in quantityDrafts
                            ? quantityDrafts[row.id]
                            : String(row.quantity)
                        }
                        onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                        onBlur={() => clearQuantityDraft(row.id)}
                        placeholder="1"
                        className="w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                      />
                    </div>
                  )}

                  {priceCol && (
                    <div
                      className={`${
                        qtyCol ? 'col-span-8' : 'col-span-12'
                      } min-w-0 space-y-1.5`}
                    >
                      <label
                        htmlFor={`quote-row-price-${row.id}`}
                        className="block text-xs font-semibold text-slate-600 truncate"
                      >
                        {priceCol.label.trim() || 'Precio'} (COP)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 pointer-events-none">
                          $
                        </span>
                        <input
                          id={`quote-row-price-${row.id}`}
                          type="text"
                          inputMode="numeric"
                          value={formatNumberInput(row.unitPrice)}
                          onChange={(e) =>
                            handleUpdateRow(row.id, {
                              unitPrice: parseCurrencyInput(e.target.value),
                            })
                          }
                          placeholder="0"
                          className="w-full min-h-11 rounded-xl border border-slate-300 bg-white pl-7 pr-3.5 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Row Auto-calculated Total (only shown when Total column is active) */}
              {totalCol && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 text-xs">
                  <span className="text-slate-500 font-medium">
                    {totalCol.label.trim() || 'Total'} fila {index + 1}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCOP(rowTotal)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Row Button */}
      <button
        type="button"
        onClick={handleAddRow}
        className="w-full min-h-11 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-sm inline-flex items-center justify-center gap-2 active:scale-[0.99] transition"
      >
        <Plus className="w-4 h-4" />
        <span>Agregar otra fila</span>
      </button>
    </section>
  );
}
