import {
  ClipboardList,
  Download,
  FileText,
  RotateCcw,
  WifiOff,
} from 'lucide-react';
import type { DocumentTab } from '../types/quote';

interface HeaderBarProps {
  activeTab: DocumentTab;
  onChangeTab: (tab: DocumentTab) => void;
  isOffline: boolean;
  canInstall: boolean;
  onInstall: () => void;
  onNewDocument: () => void;
}

export function HeaderBar({
  activeTab,
  onChangeTab,
  isOffline,
  canInstall,
  onInstall,
  onNewDocument,
}: HeaderBarProps) {
  const isQuote = activeTab === 'quote';

  return (
    <header className="safe-area-top sticky top-0 z-30 bg-slate-900 text-white shadow-sm">
      <div className="max-w-lg mx-auto px-3.5 sm:px-4 pt-3 pb-2.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
              {isQuote ? (
                <ClipboardList className="w-5 h-5 text-emerald-400" />
              ) : (
                <FileText className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-tight truncate">
                {isQuote ? 'Cotización' : 'Cuenta de Cobro'}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                {isOffline ? (
                  <>
                    <WifiOff className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="text-amber-300 font-medium">
                      Modo sin conexión
                    </span>
                  </>
                ) : (
                  <span className="truncate">Generador PDF · Funciona offline</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canInstall && (
              <button
                type="button"
                onClick={onInstall}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-2.5 py-2 text-xs font-semibold text-white active:scale-95 transition"
                title="Instalar app en el celular"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNewDocument}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-2.5 py-2 text-xs font-medium text-slate-200 active:scale-95 transition"
              title={
                isQuote
                  ? 'Nueva cotización (conserva tus datos de empresa y pie de página)'
                  : 'Nueva cuenta de cobro (conserva tus datos de acreedor)'
              }
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nueva</span>
            </button>
          </div>
        </div>

        {/* Document Type Tabs */}
        <div
          role="tablist"
          aria-label="Tipo de documento"
          className="grid grid-cols-2 gap-1 rounded-xl bg-slate-800/90 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'invoice'}
            onClick={() => onChangeTab('invoice')}
            className={`min-w-0 min-h-9 rounded-lg px-2 py-1.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition ${
              activeTab === 'invoice'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Cuenta de Cobro</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'quote'}
            onClick={() => onChangeTab('quote')}
            className={`min-w-0 min-h-9 rounded-lg px-2 py-1.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition ${
              activeTab === 'quote'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Cotización</span>
          </button>
        </div>
      </div>
    </header>
  );
}
