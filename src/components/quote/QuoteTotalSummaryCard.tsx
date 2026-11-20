import { Calculator, Eye, EyeOff, Tag } from 'lucide-react';
import type { QuoteRow } from '../../types/quote';
import {
  formatCOP,
  formatNumberInput,
  parseCurrencyInput,
} from '../../utils/currency';
import { calculateQuoteTotals } from '../../utils/quoteStorage';

interface QuoteTotalSummaryCardProps {
  rows: QuoteRow[];
  showTotals: boolean;
  discount: number;
  onToggleShowTotals: (next: boolean) => void;
  onChangeDiscount: (next: number) => void;
}

export function QuoteTotalSummaryCard({
  rows,
  showTotals,
  discount,
  onToggleShowTotals,
  onChangeDiscount,
}: QuoteTotalSummaryCardProps) {
  const { subtotal, discount: safeDiscount, total } = calculateQuoteTotals(
    rows,
    discount
  );

  return (
    <section className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs bg-white">
      {/* Toggle Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          {showTotals ? (
            <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              Mostrar SUBTOTAL y TOTAL
            </p>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              {showTotals
                ? 'Se incluirán debajo de la tabla en el PDF'
                : 'Ocultos: solo se muestran los valores de la tabla'}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={showTotals}
          aria-label="Mostrar SUBTOTAL y TOTAL en la cotización"
          onClick={() => onToggleShowTotals(!showTotals)}
          className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
            showTotals ? 'bg-emerald-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`block w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
              showTotals ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Discount Input + Live Preview of Totals (when enabled) */}
      {showTotals && (
        <div>
          {/* Optional Discount Input */}
          <div className="px-4 py-3 bg-white border-b border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="quote-discount"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600"
              >
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Descuento (COP)</span>
              </label>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                Opcional
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 pointer-events-none">
                $
              </span>
              <input
                id="quote-discount"
                type="text"
                inputMode="numeric"
                value={formatNumberInput(discount)}
                onChange={(e) =>
                  onChangeDiscount(parseCurrencyInput(e.target.value))
                }
                placeholder="0"
                className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 pl-7 pr-3.5 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {safeDiscount > 0
                ? 'Se restará del subtotal y se mostrará en el documento.'
                : 'Si lo dejas vacío o en 0, la fila de descuento no aparecerá en el PDF.'}
            </p>
          </div>

          {/* Summary Breakdown */}
          <div className="bg-[#F3F2EF] text-[#2C2927] px-4 py-2.5 space-y-1.5 border-b border-slate-300/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#625E5A]">
                SUBTOTAL:
              </span>
              <span className="text-sm font-bold tracking-tight break-all">
                {formatCOP(subtotal)}
              </span>
            </div>

            {safeDiscount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#625E5A]">
                  DESCUENTO:
                </span>
                <span className="text-sm font-bold tracking-tight text-rose-700 break-all">
                  -{formatCOP(safeDiscount)}
                </span>
              </div>
            )}
          </div>

          <div className="bg-[#3E3B39] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-200">
              <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>TOTAL:</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-400 break-all">
              {formatCOP(total)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
