import { MapPin, Phone } from 'lucide-react';
import type { QuoteData } from '../../types/quote';
import { formatCOP } from '../../utils/currency';
import {
  calculateQuoteTotals,
  computeQuoteColumnWidths,
  parseBulletLines,
} from '../../utils/quoteStorage';
import {
  formatClientIdLabel,
  getQuoteCellDisplayText,
} from '../../services/quotePdfGenerator';
import { SHEET_DIMENSIONS } from './DocumentSheet';

interface QuoteDocumentSheetProps {
  quote: QuoteData;
}

/**
 * Exact 1:1 visual replica of the Cotización page (Letter or A4),
 * rendered at native 96 DPI sheet dimensions and scaled inside PreviewModal.
 */
export function QuoteDocumentSheet({ quote }: QuoteDocumentSheetProps) {
  const dims = SHEET_DIMENSIONS[quote.pageSize];
  const colWidths = computeQuoteColumnWidths(quote.columns);

  const activeRows = quote.rows.filter(
    (r) =>
      r.description.trim() !== '' ||
      r.unitPrice > 0 ||
      r.quantity > 1 ||
      Object.values(r.customValues).some((v) => v.trim() !== '')
  );
  const rowsToRender = activeRows.length > 0 ? activeRows : quote.rows.slice(0, 1);
  const { subtotal, discount: safeDiscount, total } = calculateQuoteTotals(
    rowsToRender,
    quote.discount
  );
  const formattedSubtotal = formatCOP(subtotal);
  const formattedDiscount = formatCOP(safeDiscount);
  const formattedTotal = formatCOP(total);

  const companyName = quote.issuer.companyName.trim().toUpperCase();
  const companyNit = quote.issuer.companyNit.trim();
  const signerName = quote.issuer.signerName.trim();
  const signerRole = quote.issuer.signerRole.trim();
  const phone = quote.issuer.phone.trim();
  const addressLines = quote.issuer.address
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const introBullets = parseBulletLines(quote.introDescription);
  const noteBullets = parseBulletLines(quote.notes);

  // Align SUBTOTAL / DESCUENTO / TOTAL block to the right side of the table
  const lastTwoPct =
    colWidths.length >= 2
      ? colWidths[colWidths.length - 2] + colWidths[colWidths.length - 1]
      : 44;
  const totalsWidthPct = Math.min(58, Math.max(42, lastTwoPct));

  return (
    <div
      className="document-sheet-font bg-[#F3F2EF] text-[#2C2927] shadow-xl flex flex-col justify-between box-border select-text overflow-hidden"
      style={{
        width: `${dims.width}px`,
        minHeight: `${dims.height}px`,
      }}
    >
      {/* Main Body Content */}
      <div className="px-[82px] pt-[84px] pb-12">
        {/* 1. Centered Company Header */}
        <div className="text-center">
          {companyName ? (
            <h1
              className="font-bold uppercase text-[#2C2927] leading-snug"
              style={{ fontSize: '22px', letterSpacing: '0.16em' }}
            >
              {companyName}
            </h1>
          ) : (
            <div
              className="font-bold uppercase text-[#A8A39D] italic leading-snug"
              style={{ fontSize: '21px', letterSpacing: '0.12em' }}
            >
              [NOMBRE DE TU EMPRESA]
            </div>
          )}

          {companyNit ? (
            <div
              className="text-[#625E5A] mt-1.5"
              style={{ fontSize: '15.5px', letterSpacing: '0.03em' }}
            >
              {companyNit}
            </div>
          ) : (
            <div className="text-[#B5B0AA] italic mt-1" style={{ fontSize: '14.5px' }}>
              [NIT 000.000.000-0]
            </div>
          )}
        </div>

        {/* 2. Right-aligned Metadata Block */}
        <div className="mt-11 flex justify-end">
          <div
            className="grid gap-x-3 gap-y-1 text-[13px] leading-snug"
            style={{
              gridTemplateColumns: 'auto minmax(175px, 235px)',
            }}
          >
            <span className="font-bold text-right text-[#2C2927]">FECHA:</span>
            <span className="text-[#625E5A] break-words">
              {quote.dateDisplay.trim() || '—'}
            </span>

            <span className="font-bold text-right text-[#2C2927]">ASUNTO:</span>
            <span className="text-[#625E5A] break-words">
              {quote.subject.trim() || 'Cotización'}
            </span>

            <span className="font-bold text-right text-[#2C2927]">CLIENTE:</span>
            <span className="text-[#625E5A] break-words">
              {quote.clientName.trim() || (
                <span className="text-[#B5B0AA] italic">Cliente Ejemplo S.A.S.</span>
              )}
            </span>

            <span className="font-bold text-right text-[#2C2927]">
              {formatClientIdLabel(quote.clientIdLabel)}
            </span>
            <span className="text-[#625E5A] break-words">
              {quote.clientIdNumber.trim() || '—'}
            </span>
          </div>
        </div>

        {/* 2.5 Optional "Descripción:" bullet list above the table */}
        {introBullets.length > 0 && (
          <div className="mt-7 text-left text-[13px] leading-snug">
            <div className="font-bold text-[#2C2927]">Descripción:</div>
            <ul className="mt-1.5 space-y-1.5 list-none pl-2">
              {introBullets.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-[#625E5A]">
                  <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-[#2C2927] shrink-0" />
                  <span className="break-words">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Dynamic Variable-Column Table (Zebra-striped modern style) */}
        <div className={introBullets.length > 0 ? 'mt-4' : 'mt-9'}>
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              {quote.columns.map((col, idx) => (
                <col key={col.id} style={{ width: `${colWidths[idx]}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-[#3E3B39] text-white">
                {quote.columns.map((col) => (
                  <th
                    key={col.id}
                    className={`py-3 px-3 font-bold break-words ${
                      col.kind === 'description' ? 'text-left pl-4' : 'text-center'
                    }`}
                    style={{
                      fontSize: quote.columns.length > 6 ? '11.5px' : '13px',
                    }}
                  >
                    {col.label.trim() || 'Columna'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowsToRender.map((row, rowIndex) => {
                const isPlaceholderRow =
                  !row.description.trim() &&
                  row.unitPrice === 0 &&
                  !Object.values(row.customValues).some((v) => v.trim() !== '');
                const isZebra = rowIndex % 2 === 1;

                return (
                  <tr
                    key={row.id}
                    className={isZebra ? 'bg-[#E3E1DD]' : 'bg-[#F3F2EF]'}
                  >
                    {quote.columns.map((col) => {
                      const text = getQuoteCellDisplayText(row, col, rowIndex);
                      return (
                        <td
                          key={col.id}
                          className={`py-3 px-3 align-middle text-[#2C2927] break-words leading-snug ${
                            col.kind === 'description'
                              ? 'text-left pl-4'
                              : 'text-center'
                          }`}
                          style={{
                            fontSize: quote.columns.length > 6 ? '11.5px' : '13px',
                          }}
                        >
                          {isPlaceholderRow && col.kind === 'description' ? (
                            <span className="text-[#A8A39D] italic">
                              [Descripción del servicio o producto]
                            </span>
                          ) : (
                            text || '\u00A0'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 4. Optional Right-aligned Totals Block (SUBTOTAL / optional DESCUENTO / dark TOTAL bar) */}
          {quote.showTotals && (
            <div className="mt-5 flex justify-end">
              <div style={{ width: `${totalsWidthPct}%` }} className="space-y-2">
                <div className="px-3.5 space-y-2 text-[13px] font-bold text-[#2C2927]">
                  <div className="flex items-center justify-between gap-3">
                    <span>SUBTOTAL:</span>
                    <span className="text-right">{formattedSubtotal}</span>
                  </div>
                  {safeDiscount > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <span>DESCUENTO:</span>
                      <span className="text-right">-{formattedDiscount}</span>
                    </div>
                  )}
                </div>

                <div className="bg-[#3E3B39] text-white font-bold text-[14px] px-3.5 py-2.5 flex items-center justify-between gap-3 mt-2.5">
                  <span>TOTAL:</span>
                  <span className="text-right">{formattedTotal}</span>
                </div>
              </div>
            </div>
          )}

          {/* 4.5 Optional "Notas:" bullet list below table / totals */}
          {noteBullets.length > 0 && (
            <div className="mt-7 text-left text-[13px] leading-snug">
              <div className="font-bold text-[#2C2927]">Notas:</div>
              <ul className="mt-1.5 space-y-1.5 list-none pl-2">
                {noteBullets.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[#625E5A]">
                    <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-[#2C2927] shrink-0" />
                    <span className="break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 5. Fixed Bottom Footer (Always anchored at the bottom of the sheet) */}
      <div className="mt-auto">
        {/* Centered Signer Name + Role */}
        <div className="text-center pb-5 px-12 min-h-[44px] flex flex-col justify-end">
          {signerName ? (
            <div className="font-bold text-[13px] text-[#2C2927] leading-tight">
              {signerName}
            </div>
          ) : (
            <div className="font-bold text-[12.5px] text-[#B5B0AA] italic leading-tight">
              [Nombre y Apellido]
            </div>
          )}
          {signerRole ? (
            <div className="text-[12px] text-[#625E5A] mt-0.5 leading-tight">
              {signerRole}
            </div>
          ) : (
            <div className="text-[11.5px] text-[#B5B0AA] italic mt-0.5 leading-tight">
              [Cargo]
            </div>
          )}
        </div>

        {/* Full-bleed Dark Charcoal Strip */}
        <div className="bg-[#3E3B39] text-white px-10 py-6 grid grid-cols-2 gap-6 items-start min-h-[102px]">
          <div className="flex flex-col items-center text-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white text-[#3E3B39] flex items-center justify-center shrink-0">
              <Phone className="w-3.5 h-3.5 fill-current" />
            </span>
            <span className="text-[11.5px] tracking-wide leading-snug break-words">
              {phone || (
                <span className="text-white/50 italic">(+00) 000 000 0000</span>
              )}
            </span>
          </div>

          <div className="flex flex-col items-center text-center gap-2">
            <span className="w-6 h-6 flex items-center justify-center shrink-0 text-white">
              <MapPin className="w-5 h-5 fill-white text-[#3E3B39]" />
            </span>
            <div className="text-[11.5px] leading-snug break-words">
              {addressLines.length > 0 ? (
                addressLines.map((line, idx) => <div key={idx}>{line}</div>)
              ) : (
                <div className="text-white/50 italic">Dirección de ejemplo</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
