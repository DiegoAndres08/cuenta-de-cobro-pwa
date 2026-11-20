import { describe, expect, it } from 'vitest';
import type { InvoiceData } from '../types/invoice';
import type { QuoteData } from '../types/quote';
import { DEFAULT_QUOTE_COLUMNS } from '../utils/quoteStorage';
import {
  SAVED_INVOICES_STORAGE_KEY,
  SAVED_QUOTES_STORAGE_KEY,
  deleteSavedInvoice,
  deleteSavedQuote,
  duplicateInvoiceForToday,
  duplicateQuoteForToday,
  filterSavedInvoices,
  filterSavedQuotes,
  upsertSavedInvoice,
  upsertSavedQuote,
} from '../utils/savedDocumentsStorage';

const sampleInvoiceA: InvoiceData = {
  dateIso: '2026-10-01',
  dateDisplay: '01 - Octubre - 2026',
  consecutive: 'Cuenta de cobro 001',
  client: {
    name: 'Cliente Alfa S.A.S.',
    documentType: 'NIT.',
    documentNumber: '900000001-1',
    address: 'Dirección de ejemplo 1',
  },
  creditor: {
    fullName: 'Nombre y Apellido',
    documentType: 'C.C.',
    documentNumber: '12345678',
    phone: '3000000000',
  },
  concepts: [
    {
      id: 'c1',
      description: 'Servicio de diseño de ejemplo',
      quantity: 1,
      unitPrice: 250000,
    },
  ],
  pageSize: 'letter',
};

const sampleQuoteA: QuoteData = {
  dateIso: '2026-10-01',
  dateDisplay: '01/10/2026',
  subject: 'Cotización',
  clientName: 'Cliente Beta Ltda.',
  clientIdLabel: 'RUT',
  clientIdNumber: '000.000.000-1',
  introDescription: 'Descripción general de ejemplo',
  notes: 'Condición de ejemplo',
  showTotals: true,
  discount: 20000,
  issuer: {
    companyName: 'NOMBRE DE TU EMPRESA',
    companyNit: 'NIT 000.000.000-0',
    signerName: 'Nombre y Apellido',
    signerRole: 'Cargo',
    phone: '(+00) 000 000 0000',
    address: 'Dirección de ejemplo',
  },
  columns: DEFAULT_QUOTE_COLUMNS.map((c) => ({ ...c })),
  rows: [
    {
      id: 'r1',
      description: 'Producto de prueba A',
      quantity: 2,
      unitPrice: 150000,
      customValues: {},
    },
  ],
  pageSize: 'letter',
};

describe('savedDocumentsStorage', () => {
  it('uses distinct localStorage keys for saved invoices and saved quotes', () => {
    expect(SAVED_INVOICES_STORAGE_KEY).not.toBe(SAVED_QUOTES_STORAGE_KEY);
    expect(SAVED_INVOICES_STORAGE_KEY).not.toBe('cdc_invoice_draft_v2');
    expect(SAVED_QUOTES_STORAGE_KEY).not.toBe('cotizacion_data_v1');
  });

  it('saves, updates, isolates snapshots, filters, duplicates, and deletes invoices', () => {
    const first = upsertSavedInvoice([], sampleInvoiceA);
    expect(first.isUpdate).toBe(false);
    expect(first.records).toHaveLength(1);

    // Mutating original input must not mutate saved snapshot
    const mutated: InvoiceData = {
      ...sampleInvoiceA,
      client: { ...sampleInvoiceA.client, name: 'Cliente Gamma S.A.S.' },
      consecutive: 'Cuenta de cobro 002',
    };
    const second = upsertSavedInvoice(first.records, mutated);
    expect(second.records).toHaveLength(2);
    expect(second.records[1].data.client.name).toBe('Cliente Alfa S.A.S.');

    // Update existing record in place without duplicating
    const updated = upsertSavedInvoice(
      second.records,
      {
        ...sampleInvoiceA,
        concepts: [
          {
            id: 'c1',
            description: 'Servicio actualizado',
            quantity: 2,
            unitPrice: 250000,
          },
        ],
      },
      first.record.id
    );
    expect(updated.isUpdate).toBe(true);
    expect(updated.records).toHaveLength(2);
    expect(updated.records[0].id).toBe(first.record.id);
    expect(updated.records[0].data.concepts[0].quantity).toBe(2);

    // Accent-insensitive filtering by client name
    expect(filterSavedInvoices(updated.records, 'gamma')).toHaveLength(1);
    expect(filterSavedInvoices(updated.records, 'alfa')).toHaveLength(1);
    expect(filterSavedInvoices(updated.records, 'inexistente')).toHaveLength(0);

    // Duplicate increments consecutive and assigns fresh concept IDs
    const dup = duplicateInvoiceForToday(updated.records[0].data);
    expect(dup.consecutive).toBe('Cuenta de cobro 002');
    expect(dup.concepts[0].id).not.toBe('c1');

    // Delete specific record
    const afterDelete = deleteSavedInvoice(updated.records, first.record.id);
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].data.client.name).toBe('Cliente Gamma S.A.S.');
  });

  it('saves, updates, filters, duplicates, and deletes quotes independently', () => {
    const first = upsertSavedQuote([], sampleQuoteA);
    expect(first.isUpdate).toBe(false);
    expect(first.records).toHaveLength(1);

    const quoteB: QuoteData = {
      ...sampleQuoteA,
      clientName: 'Cliente Ómega S.A.S.',
      subject: 'Cotización Especial',
    };
    const second = upsertSavedQuote(first.records, quoteB);
    expect(second.records).toHaveLength(2);

    // Update quote A in place
    const updated = upsertSavedQuote(
      second.records,
      { ...sampleQuoteA, discount: 50000 },
      first.record.id
    );
    expect(updated.isUpdate).toBe(true);
    expect(updated.records).toHaveLength(2);
    expect(updated.records[0].data.discount).toBe(50000);

    // Accent-insensitive search ("omega" matches "Ómega")
    expect(filterSavedQuotes(updated.records, 'omega')).toHaveLength(1);
    expect(filterSavedQuotes(updated.records, 'beta')).toHaveLength(1);

    // Duplicate creates fresh row IDs
    const dup = duplicateQuoteForToday(updated.records[0].data);
    expect(dup.rows[0].id).not.toBe('r1');
    expect(dup.clientName).toBe('Cliente Beta Ltda.');

    // Delete quote B
    const afterDelete = deleteSavedQuote(updated.records, second.record.id);
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].id).toBe(first.record.id);
  });
});
