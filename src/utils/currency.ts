import type { ConceptItem } from '../types/invoice';

/**
 * Formats an integer amount in Colombian pesos using dot thousands separators.
 * Example: 380000 -> "$380.000"
 */
export function formatCOP(amount: number): string {
  const safeValue = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  const formatted = safeValue
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${formatted}`;
}

/**
 * Formats a raw integer string with dot separators for clean numeric input display.
 * Example: 380000 -> "380.000", 0 -> ""
 */
export function formatNumberInput(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '';
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parses a user-entered currency string into a non-negative integer.
 * Example: "$380.000" -> 380000
 */
export function parseCurrencyInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  // Cap at 999 billion to keep precision and wording clean
  return Math.min(parsed, 999_999_999_999);
}

export function calculateConceptSubtotal(item: Pick<ConceptItem, 'quantity' | 'unitPrice'>): number {
  const qty = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;
  const price = Number.isFinite(item.unitPrice) && item.unitPrice > 0 ? item.unitPrice : 0;
  return Math.round(qty * price);
}

export function calculateInvoiceTotal(concepts: ConceptItem[]): number {
  return concepts.reduce((acc, item) => acc + calculateConceptSubtotal(item), 0);
}

/**
 * Combines free-text document type and number cleanly for both client and creditor.
 * Examples:
 *  - ("NIT.", "900000000-1") -> "NIT. 900000000-1"
 *  - ("C.C.", "12345678")    -> "C.C. 12345678"
 *  - ("", "12345678")        -> "12345678"
 *  - ("NIT.", "")            -> ""
 */
export function formatDocumentDisplay(documentType: string, documentNumber: string): string {
  const type = documentType.trim();
  const number = documentNumber.trim();
  if (!number) return '';
  return type ? `${type} ${number}` : number;
}
