import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import type { InvoiceData, PageSize } from '../../types/invoice';
import type { DocumentTab, QuoteData } from '../../types/quote';
import { DocumentSheet, SHEET_DIMENSIONS } from './DocumentSheet';
import { QuoteDocumentSheet } from './QuoteDocumentSheet';

interface PreviewModalProps {
  activeTab: DocumentTab;
  invoice: InvoiceData;
  quote: QuoteData;
  onClose: () => void;
  onChangePageSize: (size: PageSize) => void;
  onDownload: () => void;
  onShare: () => void;
  isExporting: boolean;
}

export function PreviewModal({
  activeTab,
  invoice,
  quote,
  onClose,
  onChangePageSize,
  onDownload,
  onShare,
  isExporting,
}: PreviewModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.45);
  const pageSize = activeTab === 'quote' ? quote.pageSize : invoice.pageSize;
  const dims = SHEET_DIMENSIONS[pageSize];

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.clientWidth - 24;
      const nextScale = Math.min(1, Math.max(0.2, availableWidth / dims.width));
      setScale(nextScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [dims.width]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-200">
      {/* Top Preview Bar */}
      <header className="safe-area-top bg-slate-900 text-white px-3 py-3 flex items-center justify-between gap-2 shadow-md">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 active:scale-[0.98] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Editar</span>
        </button>

        {/* Letter / A4 Toggle */}
        <div
          className="inline-flex rounded-xl bg-slate-800 p-1 text-xs font-semibold"
          role="group"
          aria-label="Tamaño de hoja"
        >
          <button
            type="button"
            onClick={() => onChangePageSize('letter')}
            className={`px-3 py-1.5 rounded-lg transition ${
              pageSize === 'letter'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Carta
          </button>
          <button
            type="button"
            onClick={() => onChangePageSize('a4')}
            className={`px-3 py-1.5 rounded-lg transition ${
              pageSize === 'a4'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            A4
          </button>
        </div>
      </header>

      {/* Scaled Sheet Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 flex justify-center items-start"
      >
        <div
          style={{
            width: `${dims.width * scale}px`,
            minHeight: `${dims.height * scale}px`,
          }}
          className="relative shrink-0"
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${dims.width}px`,
            }}
          >
            {activeTab === 'quote' ? (
              <QuoteDocumentSheet quote={quote} />
            ) : (
              <DocumentSheet invoice={invoice} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Export Actions */}
      <footer className="safe-area-bottom bg-white border-t border-slate-200 px-3 sm:px-4 pt-3 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-2.5 sm:gap-3">
          <button
            type="button"
            disabled={isExporting}
            onClick={onShare}
            className="min-w-0 min-h-12 px-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-emerald-700 active:scale-[0.99] transition disabled:opacity-60"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span className="truncate">Compartir PDF</span>
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={onDownload}
            className="min-w-0 min-h-12 px-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-slate-800 active:scale-[0.99] transition disabled:opacity-60"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="truncate">Descargar PDF</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
