import { useState } from 'react';
import { ListOrdered, Plus, Trash2 } from 'lucide-react';
import type { ConceptItem } from '../../types/invoice';
import {
  calculateConceptSubtotal,
  formatCOP,
  formatNumberInput,
  parseCurrencyInput,
} from '../../utils/currency';
import { createConceptId } from '../../utils/storage';

interface ConceptsSectionProps {
  concepts: ConceptItem[];
  onChange: (next: ConceptItem[]) => void;
}

const MAX_QUANTITY = 999_999;

export function ConceptsSection({ concepts, onChange }: ConceptsSectionProps) {
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});

  const clearQuantityDraft = (id: string) => {
    setQuantityDrafts((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleUpdate = (id: string, patch: Partial<ConceptItem>) => {
    onChange(concepts.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleQuantityChange = (id: string, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      setQuantityDrafts((prev) => ({ ...prev, [id]: '' }));
      handleUpdate(id, { quantity: 1 });
      return;
    }

    const parsed = Number.parseInt(digits, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setQuantityDrafts((prev) => ({ ...prev, [id]: digits }));
      handleUpdate(id, { quantity: 1 });
      return;
    }

    const clamped = Math.min(parsed, MAX_QUANTITY);
    clearQuantityDraft(id);
    handleUpdate(id, { quantity: clamped });
  };

  const handleAdd = () => {
    onChange([
      ...concepts,
      {
        id: createConceptId(),
        description: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemove = (id: string) => {
    clearQuantityDraft(id);
    if (concepts.length <= 1) {
      onChange([
        {
          id: createConceptId(),
          description: '',
          quantity: 1,
          unitPrice: 0,
        },
      ]);
      return;
    }
    onChange(concepts.filter((item) => item.id !== id));
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            Por concepto ({concepts.length})
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {concepts.map((item, index) => {
          const subtotal = calculateConceptSubtotal(item);
          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-bold px-2.5 py-1">
                  Ítem {index + 1}.
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  aria-label={`Eliminar concepto ${index + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{concepts.length > 1 ? 'Eliminar' : 'Limpiar'}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor={`concept-desc-${item.id}`}
                  className="block text-xs font-semibold text-slate-600"
                >
                  Descripción del servicio o producto
                </label>
                <textarea
                  id={`concept-desc-${item.id}`}
                  rows={2}
                  value={item.description}
                  onChange={(e) =>
                    handleUpdate(item.id, { description: e.target.value })
                  }
                  placeholder="Descripción del producto o servicio"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition resize-y"
                />
              </div>

              <div className="grid grid-cols-12 gap-2.5 items-end">
                <div className="col-span-4 min-w-0 space-y-1.5">
                  <label
                    htmlFor={`concept-qty-${item.id}`}
                    className="block text-xs font-semibold text-slate-600"
                  >
                    Cantidad
                  </label>
                  <input
                    id={`concept-qty-${item.id}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={
                      item.id in quantityDrafts
                        ? quantityDrafts[item.id]
                        : String(item.quantity)
                    }
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    onBlur={() => clearQuantityDraft(item.id)}
                    placeholder="1"
                    className="w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                  />
                </div>

                <div className="col-span-8 min-w-0 space-y-1.5">
                  <label
                    htmlFor={`concept-price-${item.id}`}
                    className="block text-xs font-semibold text-slate-600"
                  >
                    Valor unitario (COP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 pointer-events-none">
                      $
                    </span>
                    <input
                      id={`concept-price-${item.id}`}
                      type="text"
                      inputMode="numeric"
                      value={formatNumberInput(item.unitPrice)}
                      onChange={(e) =>
                        handleUpdate(item.id, {
                          unitPrice: parseCurrencyInput(e.target.value),
                        })
                      }
                      placeholder="0"
                      className="w-full min-h-11 rounded-xl border border-slate-300 bg-white pl-7 pr-3.5 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 text-xs">
                <span className="text-slate-500 font-medium">Subtotal ítem {index + 1}</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCOP(subtotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="w-full min-h-11 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-sm inline-flex items-center justify-center gap-2 active:scale-[0.99] transition"
      >
        <Plus className="w-4 h-4" />
        <span>Agregar otro concepto</span>
      </button>
    </section>
  );
}
