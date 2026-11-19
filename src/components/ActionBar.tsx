import { Download, Eye, Share2 } from 'lucide-react';

interface ActionBarProps {
  onPreview: () => void;
  onShare: () => void;
  onDownload: () => void;
  isExporting: boolean;
}

export function ActionBar({
  onPreview,
  onShare,
  onDownload,
  isExporting,
}: ActionBarProps) {
  return (
    <nav
      aria-label="Acciones de vista previa y exportación"
      className="safe-area-bottom fixed bottom-0 inset-x-0 w-full max-w-full z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 pt-2.5 shadow-[0_-4px_20px_rgba(15,23,42,0.08)]"
    >
      <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onPreview}
          className="min-w-0 min-h-12 px-2 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-[11px] min-[380px]:text-xs sm:text-sm leading-tight flex flex-col min-[380px]:flex-row items-center justify-center gap-0.5 min-[380px]:gap-1.5 active:scale-[0.98] transition"
        >
          <Eye className="w-4 h-4 shrink-0" />
          <span className="truncate">Vista previa</span>
        </button>

        <button
          type="button"
          disabled={isExporting}
          onClick={onShare}
          className="min-w-0 min-h-12 px-2 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] min-[380px]:text-xs sm:text-sm leading-tight flex flex-col min-[380px]:flex-row items-center justify-center gap-0.5 min-[380px]:gap-1.5 active:scale-[0.98] transition disabled:opacity-60"
        >
          <Share2 className="w-4 h-4 shrink-0" />
          <span className="truncate">Compartir</span>
        </button>

        <button
          type="button"
          disabled={isExporting}
          onClick={onDownload}
          className="min-w-0 min-h-12 px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] min-[380px]:text-xs sm:text-sm leading-tight flex flex-col min-[380px]:flex-row items-center justify-center gap-0.5 min-[380px]:gap-1.5 active:scale-[0.98] transition disabled:opacity-60"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span className="truncate">Descargar</span>
        </button>
      </div>
    </nav>
  );
}
