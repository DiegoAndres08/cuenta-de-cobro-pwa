import { useEffect, useState } from 'react';
import { ActionBar } from './components/ActionBar';
import { HeaderBar } from './components/HeaderBar';
import { ClientSection } from './components/form/ClientSection';
import { ConceptsSection } from './components/form/ConceptsSection';
import { CreditorSection } from './components/form/CreditorSection';
import { HeaderSection } from './components/form/HeaderSection';
import { TotalSummaryCard } from './components/form/TotalSummaryCard';
import { PreviewModal } from './components/preview/PreviewModal';
import { QuoteHeaderSection } from './components/quote/QuoteHeaderSection';
import { QuoteIssuerSection } from './components/quote/QuoteIssuerSection';
import { QuoteTableSection } from './components/quote/QuoteTableSection';
import { QuoteTextBlockSection } from './components/quote/QuoteTextBlockSection';
import { QuoteTotalSummaryCard } from './components/quote/QuoteTotalSummaryCard';
import { downloadInvoicePdf, shareInvoicePdf } from './services/pdfGenerator';
import { downloadQuotePdf, shareQuotePdf } from './services/quotePdfGenerator';
import type { CreditorInfo, InvoiceData, PageSize } from './types/invoice';
import type { DocumentTab, QuoteData, QuoteIssuerProfile } from './types/quote';
import {
  formatDateToDisplay,
  formatDateToSlashDisplay,
  getTodayIso,
  incrementConsecutive,
} from './utils/dateFormat';
import {
  ACTIVE_TAB_STORAGE_KEY,
  createEmptyQuoteRow,
  loadQuoteDraft,
  saveQuoteDraft,
  saveQuoteIssuerProfile,
} from './utils/quoteStorage';
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

function loadInitialTab(): DocumentTab {
  try {
    const saved = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    return saved === 'quote' ? 'quote' : 'invoice';
  } catch {
    return 'invoice';
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<DocumentTab>(() => loadInitialTab());
  const [invoice, setInvoice] = useState<InvoiceData>(() => loadInvoiceDraft());
  const [quote, setQuote] = useState<QuoteData>(() => loadQuoteDraft());
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

  // Remember selected tab locally
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
    } catch {
      // Ignore storage errors gracefully
    }
  }, [activeTab]);

  // Independent localStorage persistence for Cuenta de Cobro
  useEffect(() => {
    saveInvoiceDraft(invoice);
  }, [invoice]);

  // Independent localStorage persistence for Cotización
  useEffect(() => {
    saveQuoteDraft(quote);
  }, [quote]);

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

  const handleQuoteIssuerChange = (issuer: QuoteIssuerProfile) => {
    saveQuoteIssuerProfile(issuer);
    setQuote((prev) => ({ ...prev, issuer }));
  };

  const handleNewDocument = () => {
    const todayIso = getTodayIso();

    if (activeTab === 'quote') {
      setQuote((prev) => ({
        ...prev,
        dateIso: todayIso,
        dateDisplay: formatDateToSlashDisplay(todayIso),
        subject: 'Cotización',
        clientName: '',
        clientIdNumber: '',
        introDescription: '',
        notes: '',
        discount: 0,
        rows: [createEmptyQuoteRow()],
      }));
      showToast('Nueva cotización lista (datos del emisor conservados)');
      return;
    }

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
      const filename =
        activeTab === 'quote'
          ? downloadQuotePdf(quote)
          : downloadInvoicePdf(invoice);
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
      const result =
        activeTab === 'quote'
          ? await shareQuotePdf(quote)
          : await shareInvoicePdf(invoice);
      if (result.status === 'shared') {
        showToast('PDF listo para compartir');
      } else if (result.status === 'downloaded') {
        showToast(
          `Tu navegador no permite compartir directo; descargado ${result.filename}`
        );
      }
    } catch {
      showToast('No se pudo compartir el PDF. Intenta descargarlo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleChangePageSize = (pageSize: PageSize) => {
    if (activeTab === 'quote') {
      setQuote((prev) => ({ ...prev, pageSize }));
    } else {
      setInvoice((prev) => ({ ...prev, pageSize }));
    }
  };

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-clip flex flex-col bg-slate-100">
      <HeaderBar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setShowPreview(false);
          setActiveTab(tab);
        }}
        isOffline={isOffline}
        canInstall={Boolean(installPrompt)}
        onInstall={handleInstallClick}
        onNewDocument={handleNewDocument}
      />

      <main className="flex-1 w-full max-w-lg mx-auto px-3.5 pt-4 pb-28 space-y-4">
        {activeTab === 'invoice' ? (
          <>
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
          </>
        ) : (
          <>
            <QuoteIssuerSection
              issuer={quote.issuer}
              onChange={handleQuoteIssuerChange}
            />

            <QuoteHeaderSection
              dateIso={quote.dateIso}
              dateDisplay={quote.dateDisplay}
              subject={quote.subject}
              clientName={quote.clientName}
              clientIdLabel={quote.clientIdLabel}
              clientIdNumber={quote.clientIdNumber}
              onChangeDateIso={(dateIso, dateDisplay) =>
                setQuote((prev) => ({ ...prev, dateIso, dateDisplay }))
              }
              onChangeDateDisplay={(dateDisplay) =>
                setQuote((prev) => ({ ...prev, dateDisplay }))
              }
              onChangeSubject={(subject) =>
                setQuote((prev) => ({ ...prev, subject }))
              }
              onChangeClientName={(clientName) =>
                setQuote((prev) => ({ ...prev, clientName }))
              }
              onChangeClientIdLabel={(clientIdLabel) =>
                setQuote((prev) => ({ ...prev, clientIdLabel }))
              }
              onChangeClientIdNumber={(clientIdNumber) =>
                setQuote((prev) => ({ ...prev, clientIdNumber }))
              }
              onClearClient={() =>
                setQuote((prev) => ({
                  ...prev,
                  clientName: '',
                  clientIdNumber: '',
                }))
              }
            />

            <QuoteTextBlockSection
              id="quote-intro-description"
              title="Descripción"
              icon="description"
              value={quote.introDescription}
              onChange={(introDescription) =>
                setQuote((prev) => ({ ...prev, introDescription }))
              }
              placeholder="Descripción general del servicio o producto (cada línea genera una viñeta)"
              hint="Aparece encima de la tabla con viñetas. Si lo dejas vacío no se muestra en el PDF."
            />

            <QuoteTableSection
              columns={quote.columns}
              rows={quote.rows}
              onChangeColumns={(columns) =>
                setQuote((prev) => ({ ...prev, columns }))
              }
              onChangeRows={(rows) => setQuote((prev) => ({ ...prev, rows }))}
            />

            <QuoteTotalSummaryCard
              rows={quote.rows}
              showTotals={quote.showTotals}
              discount={quote.discount}
              onToggleShowTotals={(showTotals) =>
                setQuote((prev) => ({ ...prev, showTotals }))
              }
              onChangeDiscount={(discount) =>
                setQuote((prev) => ({ ...prev, discount }))
              }
            />

            <QuoteTextBlockSection
              id="quote-notes"
              title="Notas"
              icon="notes"
              value={quote.notes}
              onChange={(notes) => setQuote((prev) => ({ ...prev, notes }))}
              placeholder="Condiciones de pago, tiempos de entrega o vigencia (cada línea genera una viñeta)"
              hint="Aparece debajo de la tabla con viñetas. Si lo dejas vacío no se muestra en el PDF."
            />
          </>
        )}
      </main>

      <ActionBar
        onPreview={() => setShowPreview(true)}
        onShare={handleSharePdf}
        onDownload={handleDownloadPdf}
        isExporting={isExporting}
      />

      {showPreview && (
        <PreviewModal
          activeTab={activeTab}
          invoice={invoice}
          quote={quote}
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
