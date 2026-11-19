const SPANISH_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/**
 * Returns today's local date in YYYY-MM-DD format (avoids UTC day shift).
 */
export function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts YYYY-MM-DD into "DD - Mes - AAAA" (matching "05 - Noviembre - 2026").
 */
export function formatDateToDisplay(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return isoDate;
  const [, year, monthStr, dayStr] = match;
  const monthIndex = Number.parseInt(monthStr, 10) - 1;
  const monthName = SPANISH_MONTHS[monthIndex];
  if (!monthName) return isoDate;
  return `${dayStr} - ${monthName} - ${year}`;
}

/**
 * Increments the trailing number inside a consecutive string while preserving zero-padding.
 * Example: "Cuenta de cobro 001" -> "Cuenta de cobro 002"
 */
export function incrementConsecutive(current: string): string {
  const match = /^(.*?)(\d+)(\s*)$/.exec(current);
  if (!match) {
    return `${current.trim()} 001`.trim();
  }
  const [, prefix, numStr, suffix] = match;
  const nextNum = Number.parseInt(numStr, 10) + 1;
  const padded = String(nextNum).padStart(numStr.length, '0');
  return `${prefix}${padded}${suffix}`;
}

/**
 * Builds a clean PDF filename from the consecutive text.
 * Example: "Cuenta de cobro 001" -> "Cuenta_de_cobro_001.pdf"
 */
export function buildPdfFilename(consecutive: string): string {
  const sanitized = consecutive
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${sanitized || 'Cuenta_de_cobro'}.pdf`;
}
