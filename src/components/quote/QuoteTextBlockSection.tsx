import { AlignLeft, Eraser, StickyNote } from 'lucide-react';

interface QuoteTextBlockSectionProps {
  id: string;
  title: string;
  hint: string;
  placeholder: string;
  value: string;
  icon: 'description' | 'notes';
  onChange: (next: string) => void;
}

export function QuoteTextBlockSection({
  id,
  title,
  hint,
  placeholder,
  value,
  icon,
  onChange,
}: QuoteTextBlockSectionProps) {
  const IconComponent = icon === 'description' ? AlignLeft : StickyNote;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-2.5">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <IconComponent className="w-4 h-4 text-slate-500 shrink-0" />
          <label
            htmlFor={id}
            className="text-sm font-bold text-slate-800 tracking-tight truncate"
          >
            {title}
          </label>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            Opcional
          </span>
        </div>

        {value.trim() && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition resize-y"
      />

      <p className="text-[11px] text-slate-500">{hint}</p>
    </section>
  );
}
