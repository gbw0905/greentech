export interface SummaryRow {
  label: string;
  sub?: string | undefined;
  value: number;
  price?: number | undefined;
  changePct?: number | undefined;
}

export interface SummaryRequest {
  panel: string;
  measureLabel: string;
  unit: string;
  filterLabel: string;
  shown: number;
  total: number;
  rows: SummaryRow[];
}
