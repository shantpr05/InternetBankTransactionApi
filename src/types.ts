export type Classification =
  | "Household"
  | "Transport"
  | "Food"
  | "Entertainment";

export interface ClassificationEntry {
  recipient: string;
  classification: Classification;
}

export interface Transaction {
  id: number;
  date: string;
  recipient: string;
  amount: number;
  classification: Classification;
}

export interface CreateTransaction {
  date: string;
  recipient: string;
  amount: number;
}

export interface UpdateTransaction {
  date?: string;
  recipient?: string;
  amount?: number;
}
