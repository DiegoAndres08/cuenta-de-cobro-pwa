import type {
  QuoteColumn,
  QuoteColumnKind,
  QuoteData,
  QuoteIssuerProfile,
  QuoteRow,
} from '../types/quote';
import { formatDateToSlashDisplay, getTodayIso } from './dateFormat';

export const QUOTE_ISSUER_STORAGE_KEY = 'cotizacion_issuer_profile_v1';
export const QUOTE_DATA_STORAGE_KEY = 'cotizacion_data_v1';
export const ACTIVE_TAB_STORAGE_KEY = 'cdc_active_tab_v1';

export const DEFAULT_QUOTE_ISSUER: QuoteIssuerProfile = {
  companyName: '',
  companyNit: '',
  signerName: '',
  signerRole: '',
  phone: '',
  address: '',
};

export const DEFAULT_QUOTE_COLUMNS: QuoteColumn[] = [
  { id: 'col_index', label: 'No.', kind: 'index' },
  { id: 'col_description', label: 'Descripción', kind: 'description' },
  { id: 'col_quantity', label: 'Cantidad', kind: 'quantity' },
  { id: 'col_unit_price', label: 'Precio', kind: 'unitPrice' },
  { id: 'col_row_total', label: 'Total', kind: 'rowTotal' },
];

export function createQuoteId(prefix = 'q'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyQuoteRow(): QuoteRow {
  return {
    id: createQuoteId('row'),
    description: '',
    quantity: 1,
    unitPrice: 0,
    customValues: {},
  };
}

export function calculateQuoteRowTotal(
  row: Pick<QuoteRow, 'quantity' | 'unitPrice'>
): number {
  const qty = Number.isFinite(row.quantity) && row.quantity > 0 ? row.quantity : 1;
  const price = Number.isFinite(row.unitPrice) && row.unitPrice > 0 ? row.unitPrice : 0;
  return Math.round(qty * price);
}

export function calculateQuoteTotal(rows: QuoteRow[]): number {
  return rows.reduce((sum, row) => sum + calculateQuoteRowTotal(row), 0);
}

export function calculateQuoteTotals(
  rows: QuoteRow[],
  discount: number
): { subtotal: number; discount: number; total: number } {
  const subtotal = calculateQuoteTotal(rows);
  const safeDiscount =
    Number.isFinite(discount) && discount > 0 ? Math.round(discount) : 0;
  const total = Math.max(0, subtotal - safeDiscount);
  return { subtotal, discount: safeDiscount, total };
}

/**
 * Splits a multi-line optional text block (Descripción / Notas) into clean bullet items,
 * stripping leading bullet markers if the user typed them manually.
 */
export function parseBulletLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);
}

const VALID_COLUMN_KINDS: QuoteColumnKind[] = [
  'index',
  'description',
  'quantity',
  'unitPrice',
  'rowTotal',
  'custom',
];

function sanitizeColumns(rawColumns: unknown): QuoteColumn[] {
  if (!Array.isArray(rawColumns) || rawColumns.length === 0) {
    return DEFAULT_QUOTE_COLUMNS.map((c) => ({ ...c }));
  }

  const sanitized: QuoteColumn[] = [];
  const seenIds = new Set<string>();

  for (const col of rawColumns) {
    if (!col || typeof col !== 'object') continue;
    const candidate = col as Partial<QuoteColumn>;
    const kind = VALID_COLUMN_KINDS.includes(candidate.kind as QuoteColumnKind)
      ? (candidate.kind as QuoteColumnKind)
      : 'custom';
    const id =
      typeof candidate.id === 'string' && candidate.id.trim()
        ? candidate.id.trim()
        : createQuoteId('col');
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const fallbackLabel =
      DEFAULT_QUOTE_COLUMNS.find((d) => d.kind === kind)?.label ?? 'Columna';
    const label =
      typeof candidate.label === 'string' && candidate.label.trim()
        ? candidate.label.trim()
        : fallbackLabel;

    sanitized.push({ id, label, kind });
  }

  if (sanitized.length === 0) {
    return DEFAULT_QUOTE_COLUMNS.map((c) => ({ ...c }));
  }

  return sanitized;
}

export function loadQuoteIssuerProfile(): QuoteIssuerProfile {
  try {
    const raw = localStorage.getItem(QUOTE_ISSUER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_QUOTE_ISSUER };
    const parsed = JSON.parse(raw) as Partial<QuoteIssuerProfile>;
    return {
      companyName: typeof parsed.companyName === 'string' ? parsed.companyName : '',
      companyNit: typeof parsed.companyNit === 'string' ? parsed.companyNit : '',
      signerName: typeof parsed.signerName === 'string' ? parsed.signerName : '',
      signerRole: typeof parsed.signerRole === 'string' ? parsed.signerRole : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      address: typeof parsed.address === 'string' ? parsed.address : '',
    };
  } catch {
    return { ...DEFAULT_QUOTE_ISSUER };
  }
}

export function saveQuoteIssuerProfile(issuer: QuoteIssuerProfile): void {
  try {
    localStorage.setItem(QUOTE_ISSUER_STORAGE_KEY, JSON.stringify(issuer));
  } catch {
    // Ignore storage quota or private mode errors gracefully
  }
}

export function createInitialQuote(): QuoteData {
  const todayIso = getTodayIso();
  const savedIssuer = loadQuoteIssuerProfile();

  return {
    dateIso: todayIso,
    dateDisplay: formatDateToSlashDisplay(todayIso),
    subject: 'Cotización',
    clientName: '',
    clientIdLabel: 'RUT',
    clientIdNumber: '',
    introDescription: '',
    notes: '',
    showTotals: true,
    discount: 0,
    issuer: savedIssuer,
    columns: DEFAULT_QUOTE_COLUMNS.map((c) => ({ ...c })),
    rows: [createEmptyQuoteRow()],
    pageSize: 'letter',
  };
}

export function loadQuoteDraft(): QuoteData {
  const fallback = createInitialQuote();
  try {
    const raw = localStorage.getItem(QUOTE_DATA_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<QuoteData>;
    const savedIssuer = loadQuoteIssuerProfile();

    const rows: QuoteRow[] =
      Array.isArray(parsed.rows) && parsed.rows.length > 0
        ? parsed.rows.map((r) => {
            const customValues: Record<string, string> = {};
            if (r && typeof r.customValues === 'object' && r.customValues !== null) {
              for (const [key, val] of Object.entries(r.customValues)) {
                if (typeof val === 'string') {
                  customValues[key] = val;
                }
              }
            }
            return {
              id: typeof r?.id === 'string' ? r.id : createQuoteId('row'),
              description: typeof r?.description === 'string' ? r.description : '',
              quantity: typeof r?.quantity === 'number' && r.quantity > 0 ? r.quantity : 1,
              unitPrice:
                typeof r?.unitPrice === 'number' && r.unitPrice >= 0 ? r.unitPrice : 0,
              customValues,
            };
          })
        : fallback.rows;

    return {
      dateIso: typeof parsed.dateIso === 'string' ? parsed.dateIso : fallback.dateIso,
      dateDisplay:
        typeof parsed.dateDisplay === 'string'
          ? parsed.dateDisplay
          : fallback.dateDisplay,
      subject: typeof parsed.subject === 'string' ? parsed.subject : fallback.subject,
      clientName: typeof parsed.clientName === 'string' ? parsed.clientName : '',
      clientIdLabel:
        typeof parsed.clientIdLabel === 'string'
          ? parsed.clientIdLabel
          : fallback.clientIdLabel,
      clientIdNumber:
        typeof parsed.clientIdNumber === 'string' ? parsed.clientIdNumber : '',
      introDescription:
        typeof parsed.introDescription === 'string' ? parsed.introDescription : '',
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      showTotals: typeof parsed.showTotals === 'boolean' ? parsed.showTotals : true,
      discount:
        typeof parsed.discount === 'number' && parsed.discount > 0
          ? Math.round(parsed.discount)
          : 0,
      issuer: savedIssuer,
      columns: sanitizeColumns(parsed.columns),
      rows,
      pageSize: parsed.pageSize === 'a4' ? 'a4' : 'letter',
    };
  } catch {
    return fallback;
  }
}

export function saveQuoteDraft(quote: QuoteData): void {
  try {
    localStorage.setItem(QUOTE_DATA_STORAGE_KEY, JSON.stringify(quote));
  } catch {
    // Ignore storage errors gracefully
  }
}

/**
 * Computes proportional column width percentages summing to 100%, matching
 * the visual proportions of the reference template and adapting cleanly when
 * custom columns are added or removed.
 */
export function computeQuoteColumnWidths(columns: QuoteColumn[]): number[] {
  const weights = columns.map((col) => {
    switch (col.kind) {
      case 'index':
        return 0.72;
      case 'description':
        return 2.9;
      case 'quantity':
        return 1.05;
      case 'unitPrice':
        return 1.5;
      case 'rowTotal':
        return 1.55;
      case 'custom':
      default:
        return 1.3;
    }
  });

  const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;
  return weights.map((w) => (w / totalWeight) * 100);
}
