export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

export interface ChecklistCategory {
  id: string;
  name: string;
  items: ChecklistItem[];
}
