import { jsPDF } from 'jspdf';
import type { ConceptItem, InvoiceData } from '../types/invoice';
import {
  calculateConceptSubtotal,
  calculateInvoiceTotal,
  formatCOP,
  formatDocumentDisplay,
} from '../utils/currency';
import { buildPdfFilename } from '../utils/dateFormat';
import { numberToSpanishPesos } from '../utils/numberToSpanishWords';

export interface ConceptDisplayParts {
  regularText: string;
  boldText: string;
}

export function getConceptDisplayParts(item: ConceptItem): ConceptDisplayParts {
  const subtotal = calculateConceptSubtotal(item);
  const rawDesc = item.description.trim().replace(/[,\s]+$/, '');
  const qty = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;

  let regularText = '';
  if (rawDesc && qty > 1) {
    regularText = `${rawDesc} (${qty} × ${formatCOP(item.unitPrice)}), `;
  } else if (rawDesc) {
    regularText = `${rawDesc}, `;
  } else if (qty > 1) {
    regularText = `${qty} unidades × ${formatCOP(item.unitPrice)}, `;
  }

  return {
    regularText,
    boldText: `total ${formatCOP(subtotal)}`,
  };
}

interface TextToken {
  text: string;
  bold: boolean;
}

/**
 * Renders mixed regular + bold text with word wrapping and automatic page breaks.
 * Returns the Y position after the last rendered line.
 */
function renderWrappedMixedText(
  doc: jsPDF,
  regularText: string,
  boldText: string,
  startX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  bottomLimitY: number,
  topMarginY: number
): number {
  const tokens: TextToken[] = [];

  const pushTokens = (segment: string, bold: boolean) => {
    if (!segment) return;
    // Split keeping spaces attached to words for exact measurement
    const words = segment.match(/\S+\s*|\s+/g) ?? [];
    for (const word of words) {
      tokens.push({ text: word, bold });
    }
  };

  pushTokens(regularText, false);
  pushTokens(boldText, true);

  let cursorX = startX;
  let cursorY = startY;

  for (const token of tokens) {
    doc.setFont('helvetica', token.bold ? 'bold' : 'normal');
    const tokenWidth = doc.getTextWidth(token.text);
    const trimmedWidth = doc.getTextWidth(token.text.trimEnd());

    // Wrap to next line if token overflows and we're not at the beginning of the line
    if (cursorX > startX && cursorX + trimmedWidth > startX + maxWidth) {
      cursorX = startX;
      cursorY += lineHeight;

      if (cursorY > bottomLimitY) {
        doc.addPage();
        cursorY = topMarginY;
      }

      // Skip leading whitespace on a fresh line
      if (/^\s+$/.test(token.text)) {
        continue;
      }
    }

    // Handle a single extra-long word wider than maxWidth
    if (cursorX === startX && trimmedWidth > maxWidth) {
      const splitChunks = doc.splitTextToSize(token.text.trim(), maxWidth) as string[];
      splitChunks.forEach((chunk, idx) => {
        if (idx > 0) {
          cursorY += lineHeight;
          if (cursorY > bottomLimitY) {
            doc.addPage();
            cursorY = topMarginY;
          }
        }
        doc.text(chunk, startX, cursorY);
        cursorX = startX + doc.getTextWidth(chunk);
      });
      if (/\s$/.test(token.text)) {
        cursorX += doc.getTextWidth(' ');
      }
      continue;
    }

    doc.text(token.text, cursorX, cursorY);
    cursorX += tokenWidth;
  }

  return cursorY;
}

export function generateInvoicePdf(invoice: InvoiceData): jsPDF {
  const isA4 = invoice.pageSize === 'a4';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA4 ? 'a4' : 'letter',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 25.4; // 1 inch
  const topMargin = 25.4;
  const bottomMargin = 24;
  const contentWidth = pageWidth - marginX * 2;
  const centerX = pageWidth / 2;
  const lineHeight = 5.4;

  doc.setTextColor(17, 17, 17);

  // 1. Top-left Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  if (invoice.dateDisplay.trim()) {
    doc.text(invoice.dateDisplay.trim(), marginX, topMargin + 2);
  }

  // 2. Top-right Consecutive
  if (invoice.consecutive.trim()) {
    doc.text(invoice.consecutive.trim(), pageWidth - marginX, topMargin + 15, {
      align: 'right',
    });
  }

  // 3. Centered Client Block
  let y = topMargin + 48;
  const clientName = invoice.client.name.trim();
  const clientDocument = formatDocumentDisplay(
    invoice.client.documentType,
    invoice.client.documentNumber
  );
  const clientAddress = invoice.client.address.trim();

  if (clientName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const wrappedName = doc.splitTextToSize(clientName, contentWidth) as string[];
    doc.text(wrappedName, centerX, y, { align: 'center' });
    y += wrappedName.length * 6.2;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  if (clientDocument) {
    const wrappedDoc = doc.splitTextToSize(clientDocument, contentWidth) as string[];
    doc.text(wrappedDoc, centerX, y, { align: 'center' });
    y += wrappedDoc.length * lineHeight;
  }
  if (clientAddress) {
    const wrappedAddress = doc.splitTextToSize(clientAddress, contentWidth) as string[];
    doc.text(wrappedAddress, centerX, y, { align: 'center' });
    y += wrappedAddress.length * lineHeight;
  }

  // Keep consistent vertical balance even if client fields are blank
  if (!clientName && !clientDocument && !clientAddress) {
    y += 14;
  }

  // 4. Centered Creditor Block ("DEBE A:")
  y = Math.max(y + 18, topMargin + 84);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DEBE A:', centerX, y, { align: 'center' });
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  const creditorName = invoice.creditor.fullName.trim();
  const creditorId = formatDocumentDisplay(
    invoice.creditor.documentType,
    invoice.creditor.documentNumber
  );

  if (creditorName) {
    doc.text(creditorName, centerX, y, { align: 'center' });
    y += lineHeight;
  }
  if (creditorId) {
    doc.text(creditorId, centerX, y, { align: 'center' });
    y += lineHeight;
  }

  // 5. Centered "LA SUMA DE:"
  y += 17;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('LA SUMA DE:', centerX, y, { align: 'center' });

  // 6. Centered Total in Spanish Words + COP Currency
  y += 18;
  const totalAmount = calculateInvoiceTotal(invoice.concepts);
  const totalWords = numberToSpanishPesos(totalAmount);
  const totalLine = `${totalWords} (${formatCOP(totalAmount)})`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const wrappedTotal = doc.splitTextToSize(totalLine, contentWidth) as string[];
  doc.text(wrappedTotal, centerX, y, { align: 'center' });
  y += wrappedTotal.length * lineHeight;

  // 7. Left-aligned "Por concepto:" + Dynamic Numbered List
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Por concepto:', marginX, y);
  y += lineHeight + 1;

  const activeConcepts = invoice.concepts.filter(
    (item) => item.description.trim() !== '' || item.unitPrice > 0
  );
  const conceptsToRender =
    activeConcepts.length > 0 ? activeConcepts : invoice.concepts.slice(0, 1);

  const numberIndentX = marginX + 6;
  const textIndentX = marginX + 14;
  const itemTextWidth = contentWidth - 14;
  const bottomLimitY = pageHeight - bottomMargin;

  conceptsToRender.forEach((item, index) => {
    if (y > bottomLimitY) {
      doc.addPage();
      y = topMargin;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`${index + 1}.`, numberIndentX, y);

    const { regularText, boldText } = getConceptDisplayParts(item);
    y = renderWrappedMixedText(
      doc,
      regularText,
      boldText,
      textIndentX,
      y,
      itemTextWidth,
      lineHeight,
      bottomLimitY,
      topMargin
    );

    y += lineHeight + 1.5;
  });

  // 8. Signature Block ("Cordialmente,") anchored toward the bottom like the reference
  const signatureLines = [
    'Cordialmente,',
    creditorName,
    creditorId,
    invoice.creditor.phone.trim(),
  ].filter(Boolean);

  const signatureHeight = signatureLines.length * lineHeight;
  const idealSignatureStartY = pageHeight - bottomMargin - signatureHeight;

  let signatureY: number;
  if (y + 12 <= idealSignatureStartY) {
    signatureY = idealSignatureStartY;
  } else if (y + 12 + signatureHeight <= pageHeight - bottomMargin + 4) {
    signatureY = y + 12;
  } else {
    doc.addPage();
    signatureY = topMargin + 8;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  signatureLines.forEach((line, idx) => {
    doc.text(line, marginX, signatureY + idx * lineHeight);
  });

  return doc;
}

export function downloadInvoicePdf(invoice: InvoiceData): string {
  const doc = generateInvoicePdf(invoice);
  const filename = buildPdfFilename(invoice.consecutive);
  doc.save(filename);
  return filename;
}

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

export async function shareInvoicePdf(invoice: InvoiceData): Promise<{
  status: ShareResult;
  filename: string;
}> {
  const doc = generateInvoicePdf(invoice);
  const filename = buildPdfFilename(invoice.consecutive);
  const pdfBlob = doc.output('blob');
  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

  const canNativeShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [pdfFile] });

  if (canNativeShare) {
    try {
      await navigator.share({
        title: invoice.consecutive.trim() || 'Cuenta de cobro',
        text: `Adjunto ${invoice.consecutive.trim() || 'Cuenta de cobro'}.`,
        files: [pdfFile],
      });
      return { status: 'shared', filename };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { status: 'cancelled', filename };
      }
      // Fall through to direct download if sharing fails on the device
    }
  }

  doc.save(filename);
  return { status: 'downloaded', filename };
}
