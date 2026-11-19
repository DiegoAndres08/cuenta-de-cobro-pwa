import { Calculator } from 'lucide-react';
import type { ConceptItem } from '../../types/invoice';
import { calculateInvoiceTotal, formatCOP } from '../../utils/currency';
import { numberToSpanishPesos } from '../../utils/numberToSpanishWords';

interface TotalSummaryCardProps {
  concepts: ConceptItem[];
}

export function TotalSummaryCard({ concepts }: TotalSummaryCardProps) {
  const total = calculateInvoiceTotal(concepts);
  const words = numberToSpanishPesos(total);

  return (
    <section className="rounded-2xl bg-slate-900 text-white p-4 shadow-md space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>LA SUMA DE</span>
        </div>
        <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-400 break-all">
          {formatCOP(total)}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-100 leading-snug bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-700/60 break-words">
        {words} ({formatCOP(total)})
      </p>
    </section>
  );
}
