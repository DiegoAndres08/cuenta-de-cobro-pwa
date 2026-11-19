import type { CreditorInfo, InvoiceData } from '../types/invoice';
import { formatDateToDisplay, getTodayIso } from './dateFormat';

const CREDITOR_STORAGE_KEY = 'cdc_creditor_profile_v2';
const DRAFT_STORAGE_KEY = 'cdc_invoice_draft_v2';

export const DEFAULT_CREDITOR: CreditorInfo = {
  fullName: '',
  documentType: '',
  documentNumber: '',
  phone: '',
};

export function createConceptId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadCreditorProfile(): CreditorInfo {
  try {
    const raw = localStorage.getItem(CREDITOR_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CREDITOR };
    const parsed = JSON.parse(raw) as Partial<CreditorInfo>;
    return {
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : '',
      documentType:
        typeof parsed.documentType === 'string' ? parsed.documentType : '',
      documentNumber:
        typeof parsed.documentNumber === 'string' ? parsed.documentNumber : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
    };
  } catch {
    return { ...DEFAULT_CREDITOR };
  }
}

export function saveCreditorProfile(creditor: CreditorInfo): void {
  try {
    localStorage.setItem(CREDITOR_STORAGE_KEY, JSON.stringify(creditor));
  } catch {
    // Ignore storage quota or private mode errors gracefully
  }
}

export function createInitialInvoice(): InvoiceData {
  const todayIso = getTodayIso();
  const savedCreditor = loadCreditorProfile();

  return {
    dateIso: todayIso,
    dateDisplay: formatDateToDisplay(todayIso),
    consecutive: 'Cuenta de cobro 001',
    client: {
      name: '',
      documentType: '',
      documentNumber: '',
      address: '',
    },
    creditor: savedCreditor,
    concepts: [
      {
        id: createConceptId(),
        description: '',
        quantity: 1,
        unitPrice: 0,
      },
    ],
    pageSize: 'letter',
  };
}

export function loadInvoiceDraft(): InvoiceData {
  const fallback = createInitialInvoice();
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<InvoiceData>;
    const savedCreditor = loadCreditorProfile();

    return {
      dateIso: typeof parsed.dateIso === 'string' ? parsed.dateIso : fallback.dateIso,
      dateDisplay:
        typeof parsed.dateDisplay === 'string' ? parsed.dateDisplay : fallback.dateDisplay,
      consecutive:
        typeof parsed.consecutive === 'string' ? parsed.consecutive : fallback.consecutive,
      client: {
        name: typeof parsed.client?.name === 'string' ? parsed.client.name : '',
        documentType:
          typeof parsed.client?.documentType === 'string'
            ? parsed.client.documentType
            : '',
        documentNumber:
          typeof parsed.client?.documentNumber === 'string'
            ? parsed.client.documentNumber
            : '',
        address: typeof parsed.client?.address === 'string' ? parsed.client.address : '',
      },
      creditor: savedCreditor,
      concepts:
        Array.isArray(parsed.concepts) && parsed.concepts.length > 0
          ? parsed.concepts.map((c) => ({
              id: typeof c.id === 'string' ? c.id : createConceptId(),
              description: typeof c.description === 'string' ? c.description : '',
              quantity: typeof c.quantity === 'number' && c.quantity > 0 ? c.quantity : 1,
              unitPrice: typeof c.unitPrice === 'number' && c.unitPrice >= 0 ? c.unitPrice : 0,
            }))
          : fallback.concepts,
      pageSize: parsed.pageSize === 'a4' ? 'a4' : 'letter',
    };
  } catch {
    return fallback;
  }
}

export function saveInvoiceDraft(invoice: InvoiceData): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(invoice));
  } catch {
    // Ignore storage errors gracefully
  }
}
