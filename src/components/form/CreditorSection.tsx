import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import type { CreditorInfo } from '../../types/invoice';
import { formatDocumentDisplay } from '../../utils/currency';

interface CreditorSectionProps {
  creditor: CreditorInfo;
  onChange: (next: CreditorInfo) => void;
}

export function CreditorSection({ creditor, onChange }: CreditorSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSavedData = Boolean(
    creditor.fullName.trim() ||
      creditor.documentType.trim() ||
      creditor.documentNumber.trim() ||
      creditor.phone.trim()
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3.5">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight truncate">
            Datos del Acreedor (DEBE A / Firma)
          </h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasSavedData && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="w-3 h-3" />
              Guardado
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className="rounded-xl bg-slate-50 border border-slate-200/70 px-3 py-2.5 text-xs text-slate-600 space-y-0.5 cursor-pointer"
        >
          <p className="font-semibold text-slate-800">
            {creditor.fullName || 'Toca para ingresar tus datos'}
          </p>
          <p>
            {[
              formatDocumentDisplay(creditor.documentType, creditor.documentNumber),
              creditor.phone,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 border-t border-slate-100 pt-3">
          {/* 1. Nombre completo */}
          <div className="space-y-1.5">
            <label
              htmlFor="creditor-name"
              className="block text-xs font-semibold text-slate-600"
            >
              Nombre completo
            </label>
            <input
              id="creditor-name"
              type="text"
              value={creditor.fullName}
              onChange={(e) => onChange({ ...creditor, fullName: e.target.value })}
              placeholder="Nombre completo del acreedor"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>

          {/* 2. Documento del acreedor: Tipo + Número */}
          <div className="space-y-1.5">
            <label
              htmlFor="creditor-doc-number"
              className="block text-xs font-semibold text-slate-600"
            >
              Documento del acreedor (C.C., C.E., NIT, etc.)
            </label>
            <div className="grid grid-cols-12 gap-2.5">
              <div className="col-span-4">
                <input
                  id="creditor-doc-type"
                  type="text"
                  list="creditor-doc-type-suggestions"
                  aria-label="Tipo de documento del acreedor"
                  value={creditor.documentType}
                  onChange={(e) =>
                    onChange({ ...creditor, documentType: e.target.value })
                  }
                  placeholder="Tipo"
                  className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                />
                <datalist id="creditor-doc-type-suggestions">
                  <option value="C.C." />
                  <option value="C.E." />
                  <option value="NIT." />
                  <option value="T.I." />
                  <option value="PAS." />
                </datalist>
              </div>
              <div className="col-span-8">
                <input
                  id="creditor-doc-number"
                  type="text"
                  value={creditor.documentNumber}
                  onChange={(e) =>
                    onChange({ ...creditor, documentNumber: e.target.value })
                  }
                  placeholder="Número de documento"
                  className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
                />
              </div>
            </div>
          </div>

          {/* 3. Teléfono de contacto */}
          <div className="space-y-1.5">
            <label
              htmlFor="creditor-phone"
              className="block text-xs font-semibold text-slate-600"
            >
              Teléfono de contacto
            </label>
            <input
              id="creditor-phone"
              type="tel"
              inputMode="tel"
              value={creditor.phone}
              onChange={(e) => onChange({ ...creditor, phone: e.target.value })}
              placeholder="Teléfono de contacto"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Estos datos se guardan solo de forma local en tu dispositivo para no escribirlos cada vez.
          </p>
        </div>
      )}
    </section>
  );
}
