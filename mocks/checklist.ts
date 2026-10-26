import { ChecklistItem } from '@/types/checklist';

export const checklistItems: ChecklistItem[] = [
  {
    id: "c1",
    title: "Book wedding venue",
    description: "Research and visit potential venues, compare prices, and book the perfect location for your ceremony and reception.",
    category: "Venue",
    dueDate: "2023-12-15",
    completed: false,
    priority: "high"
  },
  {
    id: "c2",
    title: "Hire photographer",
    description: "Find a photographer whose style matches your vision. Review portfolios and packages.",
    category: "Photography",
    dueDate: "2023-12-20",
    completed: false,
    priority: "high"
  },
  {
    id: "c3",
    title: "Book catering service",
    description: "Decide on menu options, arrange for tastings, and finalize the catering service for your wedding.",
    category: "Food & Drinks",
    dueDate: "2023-12-25",
    completed: false,
    priority: "high"
  },
  {
    id: "c4",
    title: "Choose bridal lehenga",
    description: "Visit bridal boutiques, try on different styles, and select your dream wedding outfit.",
    category: "Attire",
    dueDate: "2024-01-10",
    completed: false,
    priority: "high"
  },
  {
    id: "c5",
    title: "Select groom's sherwani",
    description: "Choose the perfect sherwani or suit for the groom that complements the bride's outfit.",
    category: "Attire",
    dueDate: "2024-01-15",
    completed: false,
    priority: "medium"
  },
  {
    id: "c6",
    title: "Finalize guest list",
    description: "Create a comprehensive list of all guests to invite to your wedding.",
    category: "Planning",
    dueDate: "2023-12-10",
    completed: true,
    priority: "high"
  },
  {
    id: "c7",
    title: "Order wedding invitations",
    description: "Design and order wedding invitations, including RSVP cards and information inserts.",
    category: "Stationery",
    dueDate: "2023-12-30",
    completed: false,
    priority: "medium"
  },
  {
    id: "c8",
    title: "Book mehendi artist",
    description: "Find an experienced mehendi artist for the bride and bridal party.",
    category: "Beauty",
    dueDate: "2024-01-05",
    completed: false,
    priority: "medium"
  },
  {
    id: "c9",
    title: "Arrange transportation",
    description: "Book vehicles for the wedding party and consider transportation options for guests.",
    category: "Logistics",
    dueDate: "2024-01-20",
    completed: false,
    priority: "medium"
  },
  {
    id: "c10",
    title: "Book makeup artist",
    description: "Schedule trials and book a professional makeup artist for the bride and bridal party.",
    category: "Beauty",
    dueDate: "2024-01-05",
    completed: false,
    priority: "medium"
  },
  {
    id: "c11",
    title: "Arrange accommodation for out-of-town guests",
    description: "Reserve hotel room blocks for guests traveling from out of town.",
    category: "Logistics",
    dueDate: "2024-01-25",
    completed: false,
    priority: "medium"
  },
  {
    id: "c12",
    title: "Plan honeymoon",
    description: "Research destinations, book flights and accommodations, and plan activities for your honeymoon.",
    category: "Honeymoon",
    dueDate: "2024-02-01",
    completed: false,
    priority: "medium"
  }
];

export const checklistCategories = [
  {
    id: "cat1",
    name: "Venue",
    items: checklistItems.filter(item => item.category === "Venue")
  },
  {
    id: "cat2",
    name: "Photography",
    items: checklistItems.filter(item => item.category === "Photography")
  },
  {
    id: "cat3",
    name: "Food & Drinks",
    items: checklistItems.filter(item => item.category === "Food & Drinks")
  },
  {
    id: "cat4",
    name: "Attire",
    items: checklistItems.filter(item => item.category === "Attire")
  },
  {
    id: "cat5",
    name: "Planning",
    items: checklistItems.filter(item => item.category === "Planning")
  },
  {
    id: "cat6",
    name: "Stationery",
    items: checklistItems.filter(item => item.category === "Stationery")
  },
  {
    id: "cat7",
    name: "Beauty",
    items: checklistItems.filter(item => item.category === "Beauty")
  },
  {
    id: "cat8",
    name: "Logistics",
    items: checklistItems.filter(item => item.category === "Logistics")
  },
  {
    id: "cat9",
    name: "Honeymoon",
    items: checklistItems.filter(item => item.category === "Honeymoon")
  }
];