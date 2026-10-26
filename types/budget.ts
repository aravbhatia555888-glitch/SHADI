export interface BudgetExpense {
  id: string;
  name: string;
  amount: number;
  date: string;
  paid: boolean;
  vendor?: string;
  notes?: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  estimated: number;
  spent: number;
  items: BudgetExpense[];
}