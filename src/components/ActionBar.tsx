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
      className="safe-area-bottom fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 pt-2.5 shadow-[0_-4px_20px_rgba(15,23,42,0.08)]"
    >
      <div className="max-w-lg mx-auto grid grid-cols-12 gap-2">
        <button
          type="button"
          onClick={onPreview}
          className="col-span-4 min-h-12 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
        >
          <Eye className="w-4 h-4 shrink-0" />
          <span>Vista previa</span>
        </button>

        <button
          type="button"
          disabled={isExporting}
          onClick={onShare}
          className="col-span-4 min-h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-60"
        >
          <Share2 className="w-4 h-4 shrink-0" />
          <span>Compartir</span>
        </button>

        <button
          type="button"
          disabled={isExporting}
          onClick={onDownload}
          className="col-span-4 min-h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-60"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Descargar</span>
        </button>
      </div>
    </nav>
  );
}
