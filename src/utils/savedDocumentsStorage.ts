import type { InvoiceData } from '../types/invoice';
import type { QuoteData } from '../types/quote';
import {
  formatDateToDisplay,
  formatDateToSlashDisplay,
  getTodayIso,
  incrementConsecutive,
} from './dateFormat';
import { createQuoteId } from './quoteStorage';
import { createConceptId } from './storage';

export const SAVED_INVOICES_STORAGE_KEY = 'cdc_saved_invoices_v1';
export const SAVED_QUOTES_STORAGE_KEY = 'cotizacion_saved_quotes_v1';

export interface SavedInvoiceRecord {
  id: string;
  savedAt: string;
  updatedAt: string;
  data: InvoiceData;
}

export interface SavedQuoteRecord {
  id: string;
  savedAt: string;
  updatedAt: string;
  data: QuoteData;
}

function createRecordId(prefix: 'inv' | 'quo'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function cloneInvoiceData(data: InvoiceData): InvoiceData {
  return {
    ...data,
    client: { ...data.client },
    creditor: { ...data.creditor },
    concepts: data.concepts.map((c) => ({ ...c })),
  };
}

export function cloneQuoteData(data: QuoteData): QuoteData {
  return {
    ...data,
    issuer: { ...data.issuer },
    columns: data.columns.map((c) => ({ ...c })),
    rows: data.rows.map((r) => ({
      ...r,
      customValues: { ...r.customValues },
    })),
  };
}

export function duplicateInvoiceForToday(data: InvoiceData): InvoiceData {
  const todayIso = getTodayIso();
  const cloned = cloneInvoiceData(data);
  return {
    ...cloned,
    dateIso: todayIso,
    dateDisplay: formatDateToDisplay(todayIso),
    consecutive: incrementConsecutive(cloned.consecutive),
    concepts: cloned.concepts.map((c) => ({
      ...c,
      id: createConceptId(),
    })),
  };
}

export function duplicateQuoteForToday(data: QuoteData): QuoteData {
  const todayIso = getTodayIso();
  const cloned = cloneQuoteData(data);
  return {
    ...cloned,
    dateIso: todayIso,
    dateDisplay: formatDateToSlashDisplay(todayIso),
    rows: cloned.rows.map((r) => ({
      ...r,
      id: createQuoteId('row'),
    })),
  };
}

export function loadSavedInvoices(): SavedInvoiceRecord[] {
  try {
    const raw = localStorage.getItem(SAVED_INVOICES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedInvoiceRecord =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.updatedAt === 'string' &&
        Boolean(item.data) &&
        typeof item.data === 'object'
    );
  } catch {
    return [];
  }
}

export function persistSavedInvoices(records: SavedInvoiceRecord[]): void {
  try {
    localStorage.setItem(SAVED_INVOICES_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota or private mode errors gracefully
  }
}

export function upsertSavedInvoice(
  records: SavedInvoiceRecord[],
  data: InvoiceData,
  existingId?: string | null
): { records: SavedInvoiceRecord[]; record: SavedInvoiceRecord; isUpdate: boolean } {
  const nowIso = new Date().toISOString();
  const snapshot = cloneInvoiceData(data);
  const existing = existingId ? records.find((r) => r.id === existingId) : undefined;

  if (existing) {
    const updated: SavedInvoiceRecord = {
      ...existing,
      updatedAt: nowIso,
      data: snapshot,
    };
    const next = [updated, ...records.filter((r) => r.id !== existing.id)];
    return { records: next, record: updated, isUpdate: true };
  }

  const created: SavedInvoiceRecord = {
    id: createRecordId('inv'),
    savedAt: nowIso,
    updatedAt: nowIso,
    data: snapshot,
  };
  return { records: [created, ...records], record: created, isUpdate: false };
}

export function deleteSavedInvoice(
  records: SavedInvoiceRecord[],
  id: string
): SavedInvoiceRecord[] {
  return records.filter((r) => r.id !== id);
}

export function loadSavedQuotes(): SavedQuoteRecord[] {
  try {
    const raw = localStorage.getItem(SAVED_QUOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedQuoteRecord =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.updatedAt === 'string' &&
        Boolean(item.data) &&
        typeof item.data === 'object'
    );
  } catch {
    return [];
  }
}

export function persistSavedQuotes(records: SavedQuoteRecord[]): void {
  try {
    localStorage.setItem(SAVED_QUOTES_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota or private mode errors gracefully
  }
}

export function upsertSavedQuote(
  records: SavedQuoteRecord[],
  data: QuoteData,
  existingId?: string | null
): { records: SavedQuoteRecord[]; record: SavedQuoteRecord; isUpdate: boolean } {
  const nowIso = new Date().toISOString();
  const snapshot = cloneQuoteData(data);
  const existing = existingId ? records.find((r) => r.id === existingId) : undefined;

  if (existing) {
    const updated: SavedQuoteRecord = {
      ...existing,
      updatedAt: nowIso,
      data: snapshot,
    };
    const next = [updated, ...records.filter((r) => r.id !== existing.id)];
    return { records: next, record: updated, isUpdate: true };
  }

  const created: SavedQuoteRecord = {
    id: createRecordId('quo'),
    savedAt: nowIso,
    updatedAt: nowIso,
    data: snapshot,
  };
  return { records: [created, ...records], record: created, isUpdate: false };
}

export function deleteSavedQuote(
  records: SavedQuoteRecord[],
  id: string
): SavedQuoteRecord[] {
  return records.filter((r) => r.id !== id);
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function filterSavedInvoices(
  records: SavedInvoiceRecord[],
  query: string
): SavedInvoiceRecord[] {
  const needle = normalizeSearchText(query);
  if (!needle) return records;

  return records.filter((rec) => {
    const haystack = normalizeSearchText(
      [
        rec.data.client.name,
        rec.data.client.documentNumber,
        rec.data.consecutive,
        rec.data.dateDisplay,
        ...rec.data.concepts.map((c) => c.description),
      ].join(' ')
    );
    return haystack.includes(needle);
  });
}

export function filterSavedQuotes(
  records: SavedQuoteRecord[],
  query: string
): SavedQuoteRecord[] {
  const needle = normalizeSearchText(query);
  if (!needle) return records;

  return records.filter((rec) => {
    const haystack = normalizeSearchText(
      [
        rec.data.clientName,
        rec.data.clientIdNumber,
        rec.data.subject,
        rec.data.dateDisplay,
        rec.data.introDescription,
        ...rec.data.rows.map((r) =>
          [r.description, ...Object.values(r.customValues)].join(' ')
        ),
      ].join(' ')
    );
    return haystack.includes(needle);
  });
}

export function formatSavedTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}
