import { describe, expect, it } from 'vitest';
import { generateInvoicePdf, getConceptDisplayParts } from '../services/pdfGenerator';
import type { InvoiceData } from '../types/invoice';

const sampleInvoice: InvoiceData = {
  dateIso: '2026-11-05',
  dateDisplay: '05 - Noviembre - 2026',
  consecutive: 'Cuenta de cobro 001',
  client: {
    name: 'Empresa Ejemplo S.A.S.',
    documentType: 'NIT.',
    documentNumber: '900000000-1',
    address: 'Calle 10 No. 20-30',
  },
  creditor: {
    fullName: 'NOMBRE DEL ACREEDOR',
    documentType: 'C.C.',
    documentNumber: '12345678',
    phone: '3000000000',
  },
  concepts: [
    {
      id: 'c1',
      description: 'Descripción del servicio o producto de ejemplo',
      quantity: 1,
      unitPrice: 380000,
    },
  ],
  pageSize: 'letter',
};

describe('pdfGenerator', () => {
  it('formats single and multi-quantity concept lines accurately', () => {
    expect(getConceptDisplayParts(sampleInvoice.concepts[0])).toEqual({
      regularText: 'Descripción del servicio o producto de ejemplo, ',
      boldText: 'total $380.000',
    });

    expect(
      getConceptDisplayParts({
        id: 'c2',
        description: 'Servicio adicional',
        quantity: 2,
        unitPrice: 75000,
      })
    ).toEqual({
      regularText: 'Servicio adicional (2 × $75.000), ',
      boldText: 'total $150.000',
    });
  });

  it('generates a valid PDF binary for Letter and A4 formats', () => {
    const letterDoc = generateInvoicePdf(sampleInvoice);
    const letterOutput = letterDoc.output('datauristring');
    expect(letterOutput.startsWith('data:application/pdf;filename=generated.pdf;base64,')).toBe(
      true
    );
    expect(letterDoc.getNumberOfPages()).toBe(1);

    const a4Doc = generateInvoicePdf({ ...sampleInvoice, pageSize: 'a4' });
    expect(a4Doc.getNumberOfPages()).toBe(1);
    expect(a4Doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });

  it('handles multiple concepts cleanly without errors', () => {
    const multiConcepts = Array.from({ length: 12 }, (_, i) => ({
      id: `item-${i}`,
      description: `Servicio profesional de prueba número ${i + 1} con materiales incluidos`,
      quantity: 1,
      unitPrice: 120000,
    }));

    const doc = generateInvoicePdf({
      ...sampleInvoice,
      concepts: multiConcepts,
    });
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1500);
  });
});
