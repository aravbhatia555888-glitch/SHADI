import { BudgetItem } from '@/types/budget';

export const budgetItems: BudgetItem[] = [
  {
    id: "b1",
    category: "Venue",
    estimated: 250000,
    spent: 275000,
    items: [
      {
        id: "e1",
        name: "Royal Palace Banquet",
        amount: 275000,
        date: "2023-11-15",
        paid: true,
        vendor: "Royal Palace Banquet",
        notes: "Includes basic decoration and sound system"
      }
    ]
  },
  {
    id: "b2",
    category: "Catering",
    estimated: 350000,
    spent: 320000,
    items: [
      {
        id: "e2",
        name: "Wedding dinner - 200 guests",
        amount: 200000,
        date: "2023-11-20",
        paid: true,
        vendor: "Spice Delight Catering",
        notes: "North Indian menu with 3 starters, 6 main courses, and 4 desserts"
      },
      {
        id: "e3",
        name: "Cocktail party - 150 guests",
        amount: 120000,
        date: "2023-11-20",
        paid: true,
        vendor: "Spice Delight Catering",
        notes: "Includes bar setup and bartenders"
      }
    ]
  },
  {
    id: "b3",
    category: "Photography",
    estimated: 150000,
    spent: 160000,
    items: [
      {
        id: "e4",
        name: "Wedding photography package",
        amount: 120000,
        date: "2023-11-25",
        paid: true,
        vendor: "Glamour Shots Photography",
        notes: "Includes pre-wedding shoot, wedding day coverage, and photo album"
      },
      {
        id: "e5",
        name: "Drone coverage",
        amount: 40000,
        date: "2023-11-25",
        paid: true,
        vendor: "Glamour Shots Photography",
        notes: "Aerial shots of venue and ceremony"
      }
    ]
  },
  {
    id: "b4",
    category: "Decoration",
    estimated: 200000,
    spent: 150000,
    items: [
      {
        id: "e6",
        name: "Mandap decoration",
        amount: 80000,
        date: "2023-12-01",
        paid: true,
        vendor: "Elegant Decor Solutions",
        notes: "Traditional floral mandap with contemporary elements"
      },
      {
        id: "e7",
        name: "Reception stage",
        amount: 50000,
        date: "2023-12-01",
        paid: true,
        vendor: "Elegant Decor Solutions",
        notes: "Elegant backdrop with lighting"
      },
      {
        id: "e8",
        name: "Table centerpieces",
        amount: 20000,
        date: "2023-12-01",
        paid: false,
        vendor: "Elegant Decor Solutions",
        notes: "Floral arrangements for 20 tables"
      }
    ]
  },
  {
    id: "b5",
    category: "Attire",
    estimated: 150000,
    spent: 180000,
    items: [
      {
        id: "e9",
        name: "Bridal lehenga",
        amount: 120000,
        date: "2023-12-05",
        paid: true,
        vendor: "Bridal Couture by Neeta",
        notes: "Red and gold designer lehenga with custom embroidery"
      },
      {
        id: "e10",
        name: "Groom's sherwani",
        amount: 45000,
        date: "2023-12-05",
        paid: true,
        vendor: "Bridal Couture by Neeta",
        notes: "Ivory sherwani with gold embroidery"
      },
      {
        id: "e11",
        name: "Bridal jewelry",
        amount: 15000,
        date: "2023-12-10",
        paid: false,
        vendor: "Jewels & Gems",
        notes: "Earrings and tikka set"
      }
    ]
  },
  {
    id: "b6",
    category: "Beauty",
    estimated: 50000,
    spent: 35000,
    items: [
      {
        id: "e12",
        name: "Bridal makeup",
        amount: 20000,
        date: "2023-12-15",
        paid: true,
        vendor: "Glam Studio",
        notes: "Includes hair styling and makeup for wedding day"
      },
      {
        id: "e13",
        name: "Mehendi artist",
        amount: 15000,
        date: "2023-12-15",
        paid: false,
        vendor: "Mehendi Magic by Priya",
        notes: "Bridal mehendi and family designs"
      }
    ]
  }
];