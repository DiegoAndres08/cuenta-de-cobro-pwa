import { describe, expect, it } from 'vitest';
import {
  formatClientIdLabel,
  generateQuotePdf,
  getQuoteCellDisplayText,
} from '../services/quotePdfGenerator';
import type { QuoteData } from '../types/quote';
import {
  buildQuotePdfFilename,
  formatDateToSlashDisplay,
} from '../utils/dateFormat';
import {
  DEFAULT_QUOTE_COLUMNS,
  DEFAULT_QUOTE_ISSUER,
  QUOTE_DATA_STORAGE_KEY,
  QUOTE_ISSUER_STORAGE_KEY,
  calculateQuoteRowTotal,
  calculateQuoteTotal,
  calculateQuoteTotals,
  computeQuoteColumnWidths,
  parseBulletLines,
} from '../utils/quoteStorage';

const sampleQuote: QuoteData = {
  dateIso: '2026-08-05',
  dateDisplay: '05/08/2026',
  subject: 'Cotización',
  clientName: 'Cliente Ejemplo S.A.S.',
  clientIdLabel: 'RUT',
  clientIdNumber: '000.000.000-0',
  introDescription: '',
  notes: '',
  showTotals: true,
  discount: 0,
  issuer: {
    companyName: 'NOMBRE DE TU EMPRESA',
    companyNit: 'NIT 000.000.000-0',
    signerName: 'Nombre y Apellido',
    signerRole: 'Cargo',
    phone: '(+00) 000 000 0000',
    address: 'Dirección de ejemplo\nBarrio o Ciudad',
  },
  columns: DEFAULT_QUOTE_COLUMNS.map((c) => ({ ...c })),
  rows: [
    {
      id: 'row-1',
      description: 'Producto o servicio de ejemplo con especificaciones técnicas',
      quantity: 2,
      unitPrice: 170000,
      customValues: {},
    },
  ],
  pageSize: 'letter',
};

describe('quoteStorage and utilities', () => {
  it('keeps default issuer profile completely empty/generic for privacy', () => {
    expect(DEFAULT_QUOTE_ISSUER).toEqual({
      companyName: '',
      companyNit: '',
      signerName: '',
      signerRole: '',
      phone: '',
      address: '',
    });
    expect(QUOTE_DATA_STORAGE_KEY).not.toBe('cdc_invoice_draft_v2');
    expect(QUOTE_ISSUER_STORAGE_KEY).not.toBe('cdc_creditor_profile_v2');
  });

  it('calculates row subtotals, optional discount, and grand total accurately', () => {
    const rows = [
      { id: 'r1', description: 'Ítem A', quantity: 2, unitPrice: 170000, customValues: {} },
      { id: 'r2', description: 'Ítem B', quantity: 3, unitPrice: 50000, customValues: {} },
    ];
    expect(calculateQuoteRowTotal(rows[0])).toBe(340000);
    expect(calculateQuoteRowTotal(rows[1])).toBe(150000);
    expect(calculateQuoteTotal(rows)).toBe(490000);

    expect(calculateQuoteTotals(rows, 0)).toEqual({
      subtotal: 490000,
      discount: 0,
      total: 490000,
    });
    expect(calculateQuoteTotals(rows, 40000)).toEqual({
      subtotal: 490000,
      discount: 40000,
      total: 450000,
    });
    // Never goes below 0 even if discount exceeds subtotal
    expect(calculateQuoteTotals(rows, 900000)).toEqual({
      subtotal: 490000,
      discount: 900000,
      total: 0,
    });
  });

  it('normalizes column widths to 100% for default and custom columns', () => {
    const defaultWidths = computeQuoteColumnWidths(DEFAULT_QUOTE_COLUMNS);
    expect(defaultWidths).toHaveLength(5);
    expect(defaultWidths.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5);

    const extendedCols = [
      ...DEFAULT_QUOTE_COLUMNS.slice(0, 2),
      { id: 'col_measure', label: 'Medida', kind: 'custom' as const },
      { id: 'col_material', label: 'Material', kind: 'custom' as const },
      ...DEFAULT_QUOTE_COLUMNS.slice(2),
    ];
    const extendedWidths = computeQuoteColumnWidths(extendedCols);
    expect(extendedWidths).toHaveLength(7);
    expect(extendedWidths.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5);
  });

  it('formats slash dates, client ID labels, and safe quote PDF filenames', () => {
    expect(formatDateToSlashDisplay('2026-08-05')).toBe('05/08/2026');
    expect(formatClientIdLabel('RUT')).toBe('RUT:');
    expect(formatClientIdLabel('nit:')).toBe('NIT:');
    expect(formatClientIdLabel('C.C.')).toBe('C.C.:');
    expect(formatClientIdLabel('   ')).toBe('RUT:');

    expect(buildQuotePdfFilename('Cotización', 'Cliente Ejemplo S.A.S.')).toBe(
      'Cotizacion_Cliente_Ejemplo_S_A_S.pdf'
    );
    expect(buildQuotePdfFilename('Cotización', '')).toBe('Cotizacion.pdf');
  });

  it('parses optional description and notes text into clean bullet lines', () => {
    expect(parseBulletLines('')).toEqual([]);
    expect(parseBulletLines('   \n  \n')).toEqual([]);
    expect(
      parseBulletLines('- Primera condición de ejemplo\n• Segunda nota\nTercera línea')
    ).toEqual([
      'Primera condición de ejemplo',
      'Segunda nota',
      'Tercera línea',
    ]);
  });
});

describe('quotePdfGenerator', () => {
  it('formats cells cleanly including custom columns', () => {
    const customCol = { id: 'col_mat', label: 'Material', kind: 'custom' as const };
    const row = {
      id: 'r1',
      description: 'Artículo de prueba',
      quantity: 3,
      unitPrice: 80000,
      customValues: { col_mat: 'Acero' },
    };

    expect(getQuoteCellDisplayText(row, DEFAULT_QUOTE_COLUMNS[0], 0)).toBe('1');
    expect(getQuoteCellDisplayText(row, DEFAULT_QUOTE_COLUMNS[1], 0)).toBe('Artículo de prueba');
    expect(getQuoteCellDisplayText(row, customCol, 0)).toBe('Acero');
    expect(getQuoteCellDisplayText(row, DEFAULT_QUOTE_COLUMNS[2], 0)).toBe('3');
    expect(getQuoteCellDisplayText(row, DEFAULT_QUOTE_COLUMNS[3], 0)).toBe('$80.000');
    expect(getQuoteCellDisplayText(row, DEFAULT_QUOTE_COLUMNS[4], 0)).toBe('$240.000');
  });

  it('generates a valid single-page PDF for Letter and A4 formats', () => {
    const letterDoc = generateQuotePdf(sampleQuote);
    const letterUri = letterDoc.output('datauristring');
    expect(letterUri.startsWith('data:application/pdf;filename=generated.pdf;base64,')).toBe(
      true
    );
    expect(letterDoc.getNumberOfPages()).toBe(1);

    const a4Doc = generateQuotePdf({ ...sampleQuote, pageSize: 'a4' });
    expect(a4Doc.getNumberOfPages()).toBe(1);
    expect(a4Doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });

  it('supports custom columns and multipage tables while anchoring footer on the last page', () => {
    const customCol = { id: 'col_spec', label: 'Especificación', kind: 'custom' as const };
    const columns = [
      ...DEFAULT_QUOTE_COLUMNS.slice(0, 2),
      customCol,
      ...DEFAULT_QUOTE_COLUMNS.slice(2),
    ];

    const manyRows = Array.from({ length: 24 }, (_, idx) => ({
      id: `row-${idx + 1}`,
      description: `Servicio profesional de muestra número ${idx + 1} con detalles adicionales`,
      quantity: (idx % 3) + 1,
      unitPrice: 120000,
      customValues: { col_spec: `Tipo ${idx + 1}` },
    }));

    const doc = generateQuotePdf({
      ...sampleQuote,
      columns,
      rows: manyRows,
    });

    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(2500);
  });

  it('supports optional description, optional notes, hidden totals, and 2-column price list layout', () => {
    const priceListQuote: QuoteData = {
      ...sampleQuote,
      introDescription: 'Descripción general de ejemplo para el proyecto.',
      notes: 'Condición comercial de ejemplo 1.\nCondición comercial de ejemplo 2.',
      showTotals: false,
      columns: [
        { id: 'col_description', label: 'Medidas', kind: 'description' },
        { id: 'col_unit_price', label: 'Precio', kind: 'unitPrice' },
      ],
      rows: [
        {
          id: 'r1',
          description: 'Modelo 45 x 45',
          quantity: 1,
          unitPrice: 850000,
          customValues: {},
        },
        {
          id: 'r2',
          description: 'Modelo 60 x 40',
          quantity: 1,
          unitPrice: 950000,
          customValues: {},
        },
      ],
    };

    const doc = generateQuotePdf(priceListQuote);
    expect(doc.getNumberOfPages()).toBe(1);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1500);

    const discountedDoc = generateQuotePdf({
      ...sampleQuote,
      discount: 40000,
    });
    expect(discountedDoc.getNumberOfPages()).toBe(1);
    expect(discountedDoc.output('arraybuffer').byteLength).toBeGreaterThan(1500);
  });
});
