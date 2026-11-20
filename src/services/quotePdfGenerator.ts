import { jsPDF } from 'jspdf';
import type { QuoteColumn, QuoteData, QuoteRow } from '../types/quote';
import { formatCOP } from '../utils/currency';
import { buildQuotePdfFilename } from '../utils/dateFormat';
import {
  calculateQuoteRowTotal,
  calculateQuoteTotals,
  computeQuoteColumnWidths,
  parseBulletLines,
} from '../utils/quoteStorage';
import type { ShareResult } from './pdfGenerator';

const BG_PAPER: [number, number, number] = [243, 242, 239];
const ROW_ZEBRA: [number, number, number] = [227, 225, 221];
const CHARCOAL: [number, number, number] = [62, 59, 57];
const TEXT_DARK: [number, number, number] = [44, 41, 39];
const TEXT_MUTED: [number, number, number] = [98, 94, 90];
const WHITE: [number, number, number] = [255, 255, 255];

function paintPageBackground(doc: jsPDF, pageWidth: number, pageHeight: number): void {
  doc.setFillColor(...BG_PAPER);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
}

/**
 * Draws centered uppercase text with subtle letter-spacing (tracking),
 * wrapping cleanly if the title exceeds maxWidth.
 */
function drawCenteredTrackedText(
  doc: jsPDF,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  charSpaceMm: number,
  lineHeight: number
): number {
  const clean = text.trim();
  if (!clean) return startY;

  const measureTracked = (line: string): number => {
    const baseWidth = doc.getTextWidth(line);
    const extraSpacing = Math.max(0, line.length - 1) * charSpaceMm;
    return baseWidth + extraSpacing;
  };

  // Word-wrap respecting tracked width
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && measureTracked(candidate) > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) lines.push(currentLine);

  let y = startY;
  for (const line of lines) {
    const totalW = measureTracked(line);
    const startX = centerX - totalW / 2;
    doc.text(line, startX, y, { charSpace: charSpaceMm });
    y += lineHeight;
  }

  return y;
}

/**
 * Draws a crisp vector phone icon (white circle with dark charcoal handset silhouette).
 */
function drawPhoneIcon(doc: jsPDF, cx: number, cy: number): void {
  const r = 2.6;
  doc.setFillColor(...WHITE);
  doc.circle(cx, cy, r, 'F');

  // Handset arc inside circle using charcoal strokes/dots
  doc.setDrawColor(...CHARCOAL);
  doc.setFillColor(...CHARCOAL);
  doc.setLineWidth(0.55);
  // Diagonal curved handset body
  doc.line(cx - 0.85, cy - 0.85, cx - 0.35, cy - 0.35);
  doc.line(cx - 0.35, cy - 0.35, cx + 0.35, cy + 0.35);
  doc.line(cx + 0.35, cy + 0.35, cx + 0.85, cy + 0.85);
  // Earpiece and mouthpiece caps
  doc.circle(cx - 0.85, cy - 0.75, 0.45, 'F');
  doc.circle(cx + 0.75, cy + 0.85, 0.45, 'F');
}

/**
 * Draws a crisp vector map-pin icon (white pin with charcoal inner dot).
 */
function drawLocationPinIcon(doc: jsPDF, cx: number, cy: number): void {
  doc.setFillColor(...WHITE);
  // Upper round head of pin
  doc.circle(cx, cy - 0.65, 1.9, 'F');
  // Pointed bottom tip of pin
  doc.triangle(cx - 1.65, cy - 0.1, cx + 1.65, cy - 0.1, cx, cy + 2.65, 'F');
  // Inner charcoal hole
  doc.setFillColor(...CHARCOAL);
  doc.circle(cx, cy - 0.65, 0.75, 'F');
}

export function getQuoteCellDisplayText(
  row: QuoteRow,
  col: QuoteColumn,
  rowIndex: number
): string {
  switch (col.kind) {
    case 'index':
      return String(rowIndex + 1);
    case 'description':
      return row.description.trim();
    case 'quantity':
      return String(
        Number.isFinite(row.quantity) && row.quantity > 0 ? Math.round(row.quantity) : 1
      );
    case 'unitPrice':
      return formatCOP(row.unitPrice);
    case 'rowTotal':
      return formatCOP(calculateQuoteRowTotal(row));
    case 'custom':
    default:
      return (row.customValues[col.id] ?? '').trim();
  }
}

export function formatClientIdLabel(label: string): string {
  const clean = label.trim().replace(/:+$/, '');
  return `${(clean || 'RUT').toUpperCase()}:`;
}

export function generateQuotePdf(quote: QuoteData): jsPDF {
  const isA4 = quote.pageSize === 'a4';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA4 ? 'a4' : 'letter',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 22;
  const topMargin = 24;
  const contentWidth = pageWidth - marginX * 2;
  const centerX = pageWidth / 2;

  // Paint warm light neutral background on page 1
  paintPageBackground(doc, pageWidth, pageHeight);

  // 1. Centered Company Header (Uppercase tracked title + NIT underneath)
  let y = topMargin + 3;
  const companyName = quote.issuer.companyName.trim().toUpperCase();
  const companyNit = quote.issuer.companyNit.trim();

  if (companyName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...TEXT_DARK);
    y = drawCenteredTrackedText(doc, companyName, centerX, y, contentWidth, 1.35, 7.2);
  }

  if (companyNit) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11.5);
    doc.setTextColor(...TEXT_MUTED);
    const wrappedNit = doc.splitTextToSize(companyNit, contentWidth) as string[];
    doc.text(wrappedNit, centerX, y + 1.5, { align: 'center' });
    y += wrappedNit.length * 5.2 + 2;
  }

  if (!companyName && !companyNit) {
    y += 10;
  }

  // 2. Right-aligned Metadata Block (FECHA / ASUNTO / CLIENTE / RUT-NIT-CC)
  y += 11;
  const metaValueX = pageWidth - marginX - 48;
  const metaLabelRightX = metaValueX - 3;
  const metaValueMaxWidth = pageWidth - marginX - metaValueX;
  const metaLineHeight = 4.9;

  const metaEntries: Array<{ label: string; value: string }> = [
    { label: 'FECHA:', value: quote.dateDisplay.trim() },
    { label: 'ASUNTO:', value: quote.subject.trim() || 'Cotización' },
    { label: 'CLIENTE:', value: quote.clientName.trim() },
    {
      label: formatClientIdLabel(quote.clientIdLabel),
      value: quote.clientIdNumber.trim(),
    },
  ];

  doc.setFontSize(9.5);
  for (const entry of metaEntries) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_DARK);
    doc.text(entry.label, metaLabelRightX, y, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    const displayVal = entry.value || '—';
    const wrappedVal = doc.splitTextToSize(displayVal, metaValueMaxWidth) as string[];
    doc.text(wrappedVal, metaValueX, y);
    y += Math.max(1, wrappedVal.length) * metaLineHeight;
  }

  // Helper to render an optional bulleted text block ("Descripción:" or "Notas:") with pagination
  const renderOptionalBulletBlock = (
    heading: string,
    bullets: string[],
    startY: number,
    bottomLimit: number
  ): number => {
    if (bullets.length === 0) return startY;

    const bulletLineH = 4.6;
    const headingH = 5.4;
    const bulletDotX = marginX + 2.4;
    const bulletTextX = marginX + 5.8;
    const bulletMaxW = contentWidth - 5.8;

    let cursorY = startY;
    if (cursorY + headingH + bulletLineH > bottomLimit) {
      doc.addPage();
      paintPageBackground(doc, pageWidth, pageHeight);
      cursorY = topMargin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text(heading, marginX, cursorY);
    cursorY += headingH;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);

    for (const item of bullets) {
      const wrapped = doc.splitTextToSize(item, bulletMaxW) as string[];
      const blockH = wrapped.length * bulletLineH;

      if (cursorY + blockH > bottomLimit) {
        doc.addPage();
        paintPageBackground(doc, pageWidth, pageHeight);
        cursorY = topMargin;
      }

      // Crisp filled bullet dot aligned with first line
      doc.setFillColor(...TEXT_DARK);
      doc.circle(bulletDotX, cursorY - 1.15, 0.55, 'F');

      doc.setTextColor(...TEXT_MUTED);
      wrapped.forEach((line, idx) => {
        doc.text(line, bulletTextX, cursorY + idx * bulletLineH);
      });

      cursorY += blockH + 1.2;
    }

    return cursorY;
  };

  const normalPageBottomLimit = pageHeight - 20;

  // 2.5 Optional "Descripción:" bulleted block above the table
  const introBullets = parseBulletLines(quote.introDescription);
  if (introBullets.length > 0) {
    y += 7;
    y = renderOptionalBulletBlock('Descripción:', introBullets, y, normalPageBottomLimit);
    y += 3;
  } else {
    y += 9;
  }

  // 3. Dynamic Table (Variable Columns & Rows)
  const columns = quote.columns;
  const colPercents = computeQuoteColumnWidths(columns);
  const colWidths = colPercents.map((pct) => (pct / 100) * contentWidth);
  const tableX = marginX;
  const tableRightX = tableX + contentWidth;

  const tableFontSize = columns.length > 6 ? 8.2 : 9.2;
  const cellLineHeight = columns.length > 6 ? 4.0 : 4.4;

  const drawTableHeader = (startY: number): number => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(tableFontSize);

    const headerCells = columns.map((col, idx) => {
      const pad = col.kind === 'description' ? 5 : 3;
      const maxTextW = Math.max(8, colWidths[idx] - pad);
      return doc.splitTextToSize(col.label.trim() || 'Columna', maxTextW) as string[];
    });

    const maxHeaderLines = Math.max(1, ...headerCells.map((lines) => lines.length));
    const headerH = Math.max(10.5, maxHeaderLines * cellLineHeight + 5);

    doc.setFillColor(...CHARCOAL);
    doc.rect(tableX, startY, contentWidth, headerH, 'F');

    doc.setTextColor(...WHITE);
    let colX = tableX;
    headerCells.forEach((lines, idx) => {
      const col = columns[idx];
      const colW = colWidths[idx];
      const textBlockH = lines.length * cellLineHeight;
      const firstLineY =
        startY + (headerH - textBlockH) / 2 + cellLineHeight * 0.72;
      lines.forEach((line, lineIdx) => {
        if (col.kind === 'description') {
          doc.text(line, colX + 3.5, firstLineY + lineIdx * cellLineHeight);
        } else {
          doc.text(line, colX + colW / 2, firstLineY + lineIdx * cellLineHeight, {
            align: 'center',
          });
        }
      });
      colX += colW;
    });

    return startY + headerH;
  };

  y = drawTableHeader(y);

  const activeRows = quote.rows.filter(
    (r) =>
      r.description.trim() !== '' ||
      r.unitPrice > 0 ||
      r.quantity > 1 ||
      Object.values(r.customValues).some((v) => v.trim() !== '')
  );
  const rowsToRender = activeRows.length > 0 ? activeRows : quote.rows.slice(0, 1);

  rowsToRender.forEach((row, rowIndex) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(tableFontSize);

    const cellLines = columns.map((col, colIdx) => {
      const text = getQuoteCellDisplayText(row, col, rowIndex);
      const pad = col.kind === 'description' ? 5.5 : 3.5;
      const maxTextW = Math.max(8, colWidths[colIdx] - pad);
      return text ? (doc.splitTextToSize(text, maxTextW) as string[]) : [''];
    });

    const maxLines = Math.max(1, ...cellLines.map((l) => l.length));
    const rowH = Math.max(11.5, maxLines * cellLineHeight + 5.5);

    // Page break cleanly before drawing row if it exceeds page body limit
    if (y + rowH > normalPageBottomLimit) {
      doc.addPage();
      paintPageBackground(doc, pageWidth, pageHeight);
      y = drawTableHeader(topMargin);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(tableFontSize);
    }

    // Alternating zebra-striped row fill (no grid borders)
    const isZebra = rowIndex % 2 === 1;
    doc.setFillColor(...(isZebra ? ROW_ZEBRA : BG_PAPER));
    doc.rect(tableX, y, contentWidth, rowH, 'F');

    let colX = tableX;
    doc.setTextColor(...TEXT_DARK);

    cellLines.forEach((lines, colIdx) => {
      const col = columns[colIdx];
      const colW = colWidths[colIdx];
      const textBlockH = lines.length * cellLineHeight;
      const firstLineY = y + (rowH - textBlockH) / 2 + cellLineHeight * 0.72;
      lines.forEach((line, lineIdx) => {
        if (!line) return;
        if (col.kind === 'description') {
          doc.text(line, colX + 3.5, firstLineY + lineIdx * cellLineHeight);
        } else {
          doc.text(line, colX + colW / 2, firstLineY + lineIdx * cellLineHeight, {
            align: 'center',
          });
        }
      });

      colX += colW;
    });

    y += rowH;
  });

  // 4. Optional Right-aligned Totals Summary (borderless SUBTOTAL / optional DESCUENTO + dark TOTAL bar)
  if (quote.showTotals) {
    const { subtotal, discount: safeDiscount, total } = calculateQuoteTotals(
      rowsToRender,
      quote.discount
    );
    const formattedSubtotal = formatCOP(subtotal);
    const formattedDiscount = formatCOP(safeDiscount);
    const formattedTotal = formatCOP(total);

    const lastTwoWidths =
      colWidths.length >= 2
        ? colWidths[colWidths.length - 2] + colWidths[colWidths.length - 1]
        : contentWidth * 0.44;
    const totalsTotalW = Math.min(contentWidth * 0.58, Math.max(70, lastTwoWidths));
    const totalsStartX = tableRightX - totalsTotalW;
    const padX = 3.5;

    const summaryGapY = 6.5;
    const lineStepH = 6.2;
    const totalBarGapY = 2.5;
    const totalBarH = 10.5;
    const extraLinesCount = safeDiscount > 0 ? 2 : 1;
    const totalSummaryHeight =
      extraLinesCount * lineStepH + totalBarGapY + totalBarH;

    if (y + summaryGapY + totalSummaryHeight > normalPageBottomLimit) {
      doc.addPage();
      paintPageBackground(doc, pageWidth, pageHeight);
      y = topMargin;
    } else {
      y += summaryGapY;
    }

    // Borderless SUBTOTAL line
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text('SUBTOTAL:', totalsStartX + padX, y + 3.5);
    doc.text(formattedSubtotal, tableRightX - padX, y + 3.5, { align: 'right' });
    y += lineStepH;

    // Optional borderless DESCUENTO line (only if discount > 0, no percentage)
    if (safeDiscount > 0) {
      doc.text('DESCUENTO:', totalsStartX + padX, y + 3.5);
      doc.text(`-${formattedDiscount}`, tableRightX - padX, y + 3.5, {
        align: 'right',
      });
      y += lineStepH;
    }

    // Solid dark charcoal TOTAL bar
    const totalBarY = y + totalBarGapY;
    doc.setFillColor(...CHARCOAL);
    doc.rect(totalsStartX, totalBarY, totalsTotalW, totalBarH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...WHITE);
    doc.text('TOTAL:', totalsStartX + padX, totalBarY + totalBarH / 2 + 1.35);
    doc.text(formattedTotal, tableRightX - padX, totalBarY + totalBarH / 2 + 1.35, {
      align: 'right',
    });

    y = totalBarY + totalBarH;
  }

  // 4.5 Optional "Notas:" bulleted block below the table / totals
  const noteBullets = parseBulletLines(quote.notes);
  if (noteBullets.length > 0) {
    y += 8;
    y = renderOptionalBulletBlock('Notas:', noteBullets, y, normalPageBottomLimit);
  }

  // 5. Fixed Bottom Footer (Signer + Full-Bleed Dark Strip) — ALWAYS anchored at bottom of LAST page only
  const signerName = quote.issuer.signerName.trim();
  const signerRole = quote.issuer.signerRole.trim();
  const phone = quote.issuer.phone.trim();
  const address = quote.issuer.address.trim();

  const hasSigner = Boolean(signerName || signerRole);
  const footerStripHeight = 27;
  const signerBlockSpace = hasSigner ? 20 : 6;
  const footerSafeTopY = pageHeight - footerStripHeight - signerBlockSpace - 4;

  // If table + totals ran too close to the footer zone, push footer cleanly to a new final page
  if (y > footerSafeTopY) {
    doc.addPage();
    paintPageBackground(doc, pageWidth, pageHeight);
  }

  const footerStripTopY = pageHeight - footerStripHeight;

  // Signer block centered right above the dark footer strip
  if (hasSigner) {
    const roleY = footerStripTopY - 6.5;
    const nameY = signerRole ? roleY - 4.4 : footerStripTopY - 8.5;

    if (signerName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.2);
      doc.setTextColor(...TEXT_DARK);
      doc.text(signerName, centerX, nameY, { align: 'center' });
    }

    if (signerRole) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(signerRole, centerX, roleY, { align: 'center' });
    }
  }

  // Full-bleed dark charcoal bottom strip
  doc.setFillColor(...CHARCOAL);
  doc.rect(0, footerStripTopY, pageWidth, footerStripHeight, 'F');

  const leftColCenterX = pageWidth * 0.28;
  const rightColCenterX = pageWidth * 0.72;
  const iconY = footerStripTopY + 9.2;
  const footerTextStartY = footerStripTopY + 16.5;
  const footerColMaxW = pageWidth * 0.38;

  // Left: Phone icon + number
  if (phone) {
    drawPhoneIcon(doc, leftColCenterX, iconY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    const wrappedPhone = doc.splitTextToSize(phone, footerColMaxW) as string[];
    doc.text(wrappedPhone, leftColCenterX, footerTextStartY, { align: 'center' });
  }

  // Right: Location pin icon + address (preserves explicit newlines if entered)
  if (address) {
    drawLocationPinIcon(doc, rightColCenterX, iconY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    const rawLines = address
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const wrappedAddress: string[] = [];
    for (const rawLine of rawLines) {
      const split = doc.splitTextToSize(rawLine, footerColMaxW) as string[];
      wrappedAddress.push(...split);
    }
    const maxAddressLines = wrappedAddress.slice(0, 3);
    maxAddressLines.forEach((line, idx) => {
      doc.text(line, rightColCenterX, footerTextStartY + idx * 3.6, { align: 'center' });
    });
  }

  return doc;
}

export function downloadQuotePdf(quote: QuoteData): string {
  const doc = generateQuotePdf(quote);
  const filename = buildQuotePdfFilename(quote.subject, quote.clientName);
  doc.save(filename);
  return filename;
}

export async function shareQuotePdf(quote: QuoteData): Promise<{
  status: ShareResult;
  filename: string;
}> {
  const doc = generateQuotePdf(quote);
  const filename = buildQuotePdfFilename(quote.subject, quote.clientName);
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
        title: quote.subject.trim() || 'Cotización',
        text: `Adjunto ${quote.subject.trim() || 'Cotización'}.`,
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
