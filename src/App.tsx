import { useEffect, useState } from 'react';
import { ActionBar } from './components/ActionBar';
import { HeaderBar } from './components/HeaderBar';
import { ClientSection } from './components/form/ClientSection';
import { ConceptsSection } from './components/form/ConceptsSection';
import { CreditorSection } from './components/form/CreditorSection';
import { HeaderSection } from './components/form/HeaderSection';
import { TotalSummaryCard } from './components/form/TotalSummaryCard';
import { PreviewModal } from './components/preview/PreviewModal';
import { downloadInvoicePdf, shareInvoicePdf } from './services/pdfGenerator';
import type { CreditorInfo, InvoiceData, PageSize } from './types/invoice';
import { formatDateToDisplay, getTodayIso, incrementConsecutive } from './utils/dateFormat';
import {
  createConceptId,
  loadInvoiceDraft,
  saveCreditorProfile,
  saveInvoiceDraft,
} from './utils/storage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function App() {
  const [invoice, setInvoice] = useState<InvoiceData>(() => loadInvoiceDraft());
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Persist invoice draft locally so nothing is lost on reload/close
  useEffect(() => {
    saveInvoiceDraft(invoice);
  }, [invoice]);

  // Online / Offline indicator
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Capture Android/Desktop PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      showToast('App instalada en tu dispositivo');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleCreditorChange = (creditor: CreditorInfo) => {
    saveCreditorProfile(creditor);
    setInvoice((prev) => ({ ...prev, creditor }));
  };

  const handleNewInvoice = () => {
    const todayIso = getTodayIso();
    setInvoice((prev) => ({
      ...prev,
      dateIso: todayIso,
      dateDisplay: formatDateToDisplay(todayIso),
      consecutive: incrementConsecutive(prev.consecutive),
      client: { name: '', documentType: '', documentNumber: '', address: '' },
      concepts: [
        {
          id: createConceptId(),
          description: '',
          quantity: 1,
          unitPrice: 0,
        },
      ],
    }));
    showToast('Nueva cuenta lista (consecutivo incrementado)');
  };

  const handleDownloadPdf = () => {
    setIsExporting(true);
    try {
      const filename = downloadInvoicePdf(invoice);
      showToast(`PDF descargado: ${filename}`);
    } catch {
      showToast('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePdf = async () => {
    setIsExporting(true);
    try {
      const result = await shareInvoicePdf(invoice);
      if (result.status === 'shared') {
        showToast('PDF listo para compartir');
      } else if (result.status === 'downloaded') {
        showToast(`Tu navegador no permite compartir directo; descargado ${result.filename}`);
      }
    } catch {
      showToast('No se pudo compartir el PDF. Intenta descargarlo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleChangePageSize = (pageSize: PageSize) => {
    setInvoice((prev) => ({ ...prev, pageSize }));
  };

  return (
    <div className="min-h-dvh flex flex-col bg-slate-100">
      <HeaderBar
        isOffline={isOffline}
        canInstall={Boolean(installPrompt)}
        onInstall={handleInstallClick}
        onNewInvoice={handleNewInvoice}
      />

      <main className="flex-1 w-full max-w-lg mx-auto px-3.5 pt-4 pb-28 space-y-4">
        <HeaderSection
          dateIso={invoice.dateIso}
          dateDisplay={invoice.dateDisplay}
          consecutive={invoice.consecutive}
          onChangeDateIso={(dateIso, dateDisplay) =>
            setInvoice((prev) => ({ ...prev, dateIso, dateDisplay }))
          }
          onChangeDateDisplay={(dateDisplay) =>
            setInvoice((prev) => ({ ...prev, dateDisplay }))
          }
          onChangeConsecutive={(consecutive) =>
            setInvoice((prev) => ({ ...prev, consecutive }))
          }
        />

        <ClientSection
          client={invoice.client}
          onChange={(client) => setInvoice((prev) => ({ ...prev, client }))}
        />

        <CreditorSection
          creditor={invoice.creditor}
          onChange={handleCreditorChange}
        />

        <ConceptsSection
          concepts={invoice.concepts}
          onChange={(concepts) => setInvoice((prev) => ({ ...prev, concepts }))}
        />

        <TotalSummaryCard concepts={invoice.concepts} />
      </main>

      <ActionBar
        onPreview={() => setShowPreview(true)}
        onShare={handleSharePdf}
        onDownload={handleDownloadPdf}
        isExporting={isExporting}
      />

      {showPreview && (
        <PreviewModal
          invoice={invoice}
          onClose={() => setShowPreview(false)}
          onChangePageSize={handleChangePageSize}
          onDownload={handleDownloadPdf}
          onShare={handleSharePdf}
          isExporting={isExporting}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] rounded-xl bg-slate-900/95 text-white px-4 py-2.5 text-xs font-medium shadow-lg border border-slate-700"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
