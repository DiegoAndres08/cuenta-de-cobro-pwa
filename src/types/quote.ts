import type { PageSize } from './invoice';

export type DocumentTab = 'invoice' | 'quote';

export type QuoteColumnKind =
  | 'index'
  | 'description'
  | 'quantity'
  | 'unitPrice'
  | 'rowTotal'
  | 'custom';

export interface QuoteColumn {
  id: string;
  label: string;
  kind: QuoteColumnKind;
}

export interface QuoteRow {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  customValues: Record<string, string>;
}

export interface QuoteIssuerProfile {
  companyName: string;
  companyNit: string;
  signerName: string;
  signerRole: string;
  phone: string;
  address: string;
}

export interface QuoteData {
  dateIso: string;
  dateDisplay: string;
  subject: string;
  clientName: string;
  clientIdLabel: string;
  clientIdNumber: string;
  introDescription: string;
  notes: string;
  showTotals: boolean;
  discount: number;
  issuer: QuoteIssuerProfile;
  columns: QuoteColumn[];
  rows: QuoteRow[];
  pageSize: PageSize;
}
