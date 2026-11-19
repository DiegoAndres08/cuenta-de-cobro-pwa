export type PageSize = 'letter' | 'a4';

export interface ConceptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ClientInfo {
  name: string;
  documentType: string;
  documentNumber: string;
  address: string;
}

export interface CreditorInfo {
  fullName: string;
  documentType: string;
  documentNumber: string;
  phone: string;
}

export interface InvoiceData {
  dateIso: string;
  dateDisplay: string;
  consecutive: string;
  client: ClientInfo;
  creditor: CreditorInfo;
  concepts: ConceptItem[];
  pageSize: PageSize;
}
