import { useState } from 'react';
import { Building2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import type { QuoteIssuerProfile } from '../../types/quote';

interface QuoteIssuerSectionProps {
  issuer: QuoteIssuerProfile;
  onChange: (next: QuoteIssuerProfile) => void;
}

export function QuoteIssuerSection({ issuer, onChange }: QuoteIssuerSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasSavedData = Boolean(
    issuer.companyName.trim() ||
      issuer.companyNit.trim() ||
      issuer.signerName.trim() ||
      issuer.signerRole.trim() ||
      issuer.phone.trim() ||
      issuer.address.trim()
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
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight truncate">
            Datos del Emisor y Pie de Página
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
          <p className="font-semibold text-slate-800 truncate">
            {issuer.companyName || 'Toca para configurar tu empresa y pie de página'}
          </p>
          <p className="truncate">
            {[issuer.companyNit, issuer.signerName, issuer.phone]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 border-t border-slate-100 pt-3">
          {/* 1. Nombre de la empresa */}
          <div className="space-y-1.5">
            <label
              htmlFor="quote-company-name"
              className="block text-xs font-semibold text-slate-600"
            >
              Nombre de la empresa (encabezado en mayúsculas)
            </label>
            <input
              id="quote-company-name"
              type="text"
              value={issuer.companyName}
              onChange={(e) => onChange({ ...issuer, companyName: e.target.value })}
              placeholder="NOMBRE DE TU EMPRESA"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>

          {/* 2. Identificador tributario (NIT) */}
          <div className="space-y-1.5">
            <label
              htmlFor="quote-company-nit"
              className="block text-xs font-semibold text-slate-600"
            >
              Identificador tributario (NIT)
            </label>
            <input
              id="quote-company-nit"
              type="text"
              value={issuer.companyNit}
              onChange={(e) => onChange({ ...issuer, companyNit: e.target.value })}
              placeholder="NIT 000.000.000-0"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>

          {/* 3. Firma: Nombre y Cargo */}
          <div className="grid grid-cols-12 gap-2.5">
            <div className="col-span-7 min-w-0 space-y-1.5">
              <label
                htmlFor="quote-signer-name"
                className="block text-xs font-semibold text-slate-600"
              >
                Nombre (firma)
              </label>
              <input
                id="quote-signer-name"
                type="text"
                value={issuer.signerName}
                onChange={(e) => onChange({ ...issuer, signerName: e.target.value })}
                placeholder="Nombre y Apellido"
                className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
              />
            </div>

            <div className="col-span-5 min-w-0 space-y-1.5">
              <label
                htmlFor="quote-signer-role"
                className="block text-xs font-semibold text-slate-600"
              >
                Cargo
              </label>
              <input
                id="quote-signer-role"
                type="text"
                value={issuer.signerRole}
                onChange={(e) => onChange({ ...issuer, signerRole: e.target.value })}
                placeholder="Cargo"
                className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
              />
            </div>
          </div>

          {/* 4. Teléfono (pie izquierdo) */}
          <div className="space-y-1.5">
            <label
              htmlFor="quote-phone"
              className="block text-xs font-semibold text-slate-600"
            >
              Teléfono (franja inferior izquierda)
            </label>
            <input
              id="quote-phone"
              type="tel"
              inputMode="tel"
              value={issuer.phone}
              onChange={(e) => onChange({ ...issuer, phone: e.target.value })}
              placeholder="(+00) 000 000 0000"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>

          {/* 5. Dirección (pie derecho) */}
          <div className="space-y-1.5">
            <label
              htmlFor="quote-address"
              className="block text-xs font-semibold text-slate-600"
            >
              Dirección (franja inferior derecha)
            </label>
            <textarea
              id="quote-address"
              rows={2}
              value={issuer.address}
              onChange={(e) => onChange({ ...issuer, address: e.target.value })}
              placeholder="Dirección de ejemplo&#10;Barrio o ciudad"
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition resize-y"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Estos datos se guardan solo de forma local en tu dispositivo y se conservan al crear nuevas cotizaciones.
          </p>
        </div>
      )}
    </section>
  );
}
