import type { InvoiceData } from '../../types/invoice';
import {
  calculateInvoiceTotal,
  formatCOP,
  formatDocumentDisplay,
} from '../../utils/currency';
import { numberToSpanishPesos } from '../../utils/numberToSpanishWords';
import { getConceptDisplayParts } from '../../services/pdfGenerator';

interface DocumentSheetProps {
  invoice: InvoiceData;
}

export const SHEET_DIMENSIONS = {
  letter: { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
} as const;

/**
 * Exact 1:1 visual replica of the Cuenta de Cobro page (Letter or A4).
 * Rendered at native 96 DPI sheet dimensions and scaled smoothly inside PreviewModal.
 */
export function DocumentSheet({ invoice }: DocumentSheetProps) {
  const dims = SHEET_DIMENSIONS[invoice.pageSize];
  const totalAmount = calculateInvoiceTotal(invoice.concepts);
  const totalWords = numberToSpanishPesos(totalAmount);
  const clientName = invoice.client.name.trim();
  const clientDocument = formatDocumentDisplay(
    invoice.client.documentType,
    invoice.client.documentNumber
  );
  const clientAddress = invoice.client.address.trim();
  const creditorName = invoice.creditor.fullName.trim();
  const creditorId = formatDocumentDisplay(
    invoice.creditor.documentType,
    invoice.creditor.documentNumber
  );
  const creditorPhone = invoice.creditor.phone.trim();

  const activeConcepts = invoice.concepts.filter(
    (item) => item.description.trim() !== '' || item.unitPrice > 0
  );
  const conceptsToRender =
    activeConcepts.length > 0 ? activeConcepts : invoice.concepts.slice(0, 1);

  return (
    <div
      className="document-sheet-font bg-white text-[#111111] shadow-xl flex flex-col justify-between box-border select-text"
      style={{
        width: `${dims.width}px`,
        minHeight: `${dims.height}px`,
        padding: '96px', // 1 inch (25.4mm) at 96dpi
        fontSize: '14.67px', // 11pt
        lineHeight: 1.4,
      }}
    >
      <div>
        {/* 1. Date (top-left) */}
        <div className="text-left min-h-[21px]">
          {invoice.dateDisplay.trim() || '\u00A0'}
        </div>

        {/* 2. Consecutive (top-right, below date) */}
        <div className="text-right mt-7 min-h-[21px]">
          {invoice.consecutive.trim() || '\u00A0'}
        </div>

        {/* 3. Client Block (centered, bold) */}
        <div className="text-center mt-24 min-h-[68px]">
          {clientName ? (
            <div
              className="font-bold leading-snug"
              style={{ fontSize: '18.67px' }} // 14pt
            >
              {clientName}
            </div>
          ) : (
            <div className="text-slate-300 italic text-sm">
              [Nombre / Razón social del cliente]
            </div>
          )}
          {clientDocument && <div className="font-bold mt-0.5">{clientDocument}</div>}
          {clientAddress && <div className="font-bold">{clientAddress}</div>}
        </div>

        {/* 4. Creditor Block (centered) */}
        <div className="text-center mt-16">
          <div className="font-bold">DEBE A:</div>
          {creditorName && <div>{creditorName}</div>}
          {creditorId && <div>{creditorId}</div>}
        </div>

        {/* 5. "LA SUMA DE:" */}
        <div className="text-center font-bold mt-14">LA SUMA DE:</div>

        {/* 6. Total Amount in Spanish words + COP */}
        <div className="text-center font-bold mt-12 px-2">
          {totalWords} ({formatCOP(totalAmount)})
        </div>

        {/* 7. Concepts List */}
        <div className="mt-16 text-left">
          <div>Por concepto:</div>
          <ol className="mt-1.5 space-y-2 list-none pl-5">
            {conceptsToRender.map((item, idx) => {
              const { regularText, boldText } = getConceptDisplayParts(item);
              const isEmptyRow = !item.description.trim() && item.unitPrice === 0;
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="shrink-0 w-5">{idx + 1}.</span>
                  <span className="flex-1 break-words">
                    {isEmptyRow ? (
                      <span className="text-slate-300 italic">
                        [Descripción del concepto],{' '}
                        <strong className="font-bold text-slate-400">total $0</strong>
                      </span>
                    ) : (
                      <>
                        {regularText}
                        <strong className="font-bold">{boldText}</strong>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* 8. Signature Block (bottom-left) */}
      <div className="mt-16 pt-4 text-left leading-[1.35]">
        <div>Cordialmente,</div>
        {creditorName && <div>{creditorName}</div>}
        {creditorId && <div>{creditorId}</div>}
        {creditorPhone && <div>{creditorPhone}</div>}
      </div>
    </div>
  );
}
