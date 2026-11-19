import { describe, expect, it } from 'vitest';
import {
  calculateConceptSubtotal,
  calculateInvoiceTotal,
  formatCOP,
  formatDocumentDisplay,
  parseCurrencyInput,
} from '../utils/currency';
import {
  buildPdfFilename,
  formatDateToDisplay,
  incrementConsecutive,
} from '../utils/dateFormat';

describe('currency utilities', () => {
  it('formats Colombian pesos with dot separators', () => {
    expect(formatCOP(0)).toBe('$0');
    expect(formatCOP(380000)).toBe('$380.000');
    expect(formatCOP(1250000)).toBe('$1.250.000');
  });

  it('parses user currency strings safely', () => {
    expect(parseCurrencyInput('$380.000')).toBe(380000);
    expect(parseCurrencyInput('1.500.000')).toBe(1500000);
    expect(parseCurrencyInput('')).toBe(0);
  });

  it('calculates subtotals and invoice total', () => {
    const items = [
      { id: '1', description: 'Producto de prueba', quantity: 1, unitPrice: 380000 },
      { id: '2', description: 'Servicio adicional', quantity: 2, unitPrice: 60000 },
    ];
    expect(calculateConceptSubtotal(items[0])).toBe(380000);
    expect(calculateConceptSubtotal(items[1])).toBe(120000);
    expect(calculateInvoiceTotal(items)).toBe(500000);
  });

  it('combines document type and number cleanly for client and creditor', () => {
    expect(formatDocumentDisplay('NIT.', '900000000-1')).toBe('NIT. 900000000-1');
    expect(formatDocumentDisplay('C.C.', '12345678')).toBe('C.C. 12345678');
    expect(formatDocumentDisplay('C.E.', '987654')).toBe('C.E. 987654');
    expect(formatDocumentDisplay('', '12345678')).toBe('12345678');
    expect(formatDocumentDisplay('NIT.', '')).toBe('');
  });
});

describe('date and consecutive utilities', () => {
  it('formats ISO date into DD - Mes - AAAA', () => {
    expect(formatDateToDisplay('2026-11-05')).toBe('05 - Noviembre - 2026');
    expect(formatDateToDisplay('2026-01-19')).toBe('19 - Enero - 2026');
  });

  it('increments consecutive preserving zero padding', () => {
    expect(incrementConsecutive('Cuenta de cobro 001')).toBe('Cuenta de cobro 002');
    expect(incrementConsecutive('Cuenta de cobro 009')).toBe('Cuenta de cobro 010');
    expect(incrementConsecutive('Cuenta de cobro 099')).toBe('Cuenta de cobro 100');
  });

  it('builds safe PDF filenames', () => {
    expect(buildPdfFilename('Cuenta de cobro 001')).toBe('Cuenta_de_cobro_001.pdf');
    expect(buildPdfFilename('   ')).toBe('Cuenta_de_cobro.pdf');
  });
});
