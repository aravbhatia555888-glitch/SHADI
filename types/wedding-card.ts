export interface WeddingCardTemplate {
  id: string;
  name: string;
  style:
    | "traditional"
    | "modern"
    | "floral"
    | "minimalist"
    | "royal"
    | "rustic";
  backgroundImage?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
    accent: string;
  };
  layout: "portrait" | "square";
  elements: {
    showBorder: boolean;
    showPattern: boolean;
    showMandala: boolean;
    showCoupleIcon: boolean;
    showFloralCorner: boolean;
  };
}

export interface WeddingCardData {
  groomName: string;
  brideName: string;
  date: string;
  time: string;
  venue: string;
  venueAddress: string;
  message: string;
  parentNames?: {
    groomParents: string;
    brideParents: string;
  };
  rsvpContact: string;
  rsvpDate: string;
  templateId: string;
  customColor?: string;
}

export const DEFAULT_CARD_DATA: WeddingCardData = {
  groomName: "Rahul",
  brideName: "Priya",
  date: "15th December 2026",
  time: "7:00 PM onwards",
  venue: "The Grand Palace",
  venueAddress: "123 Wedding Lane, Jaipur",
  message:
    "Together with our families, we invite you to celebrate our wedding.",
  parentNames: {
    groomParents: "Mr. & Mrs. Sharma",
    brideParents: "Mr. & Mrs. Gupta",
  },
  rsvpContact: "+91 98765 43210",
  rsvpDate: "1st December 2026",
  templateId: "traditional-red",
};

export const WEDDING_CARD_TEMPLATES: WeddingCardTemplate[] = [
  {
    id: "traditional-red",
    name: "Traditional Red",
    style: "traditional",
    colors: {
      primary: "#8B0000",
      secondary: "#FFD700",
      accent: "#FF6B6B",
      text: "#FFFFFF",
      background: "#8B0000",
    },
    fonts: { heading: "serif", body: "sans-serif", accent: "serif" },
    layout: "portrait",
    elements: {
      showBorder: true,
      showPattern: true,
      showMandala: true,
      showCoupleIcon: false,
      showFloralCorner: true,
    },
  },
  {
    id: "royal-gold",
    name: "Royal Gold",
    style: "royal",
    colors: {
      primary: "#1a1a2e",
      secondary: "#d4af37",
      accent: "#f4e4c1",
      text: "#d4af37",
      background: "#1a1a2e",
    },
    fonts: { heading: "serif", body: "serif", accent: "serif" },
    layout: "portrait",
    elements: {
      showBorder: true,
      showPattern: true,
      showMandala: true,
      showCoupleIcon: true,
      showFloralCorner: false,
    },
  },
  {
    id: "floral-pastel",
    name: "Floral Pastel",
    style: "floral",
    colors: {
      primary: "#f8e1e7",
      secondary: "#d4a5a5",
      accent: "#ff8fa3",
      text: "#5d4e6d",
      background: "#fdf2f4",
    },
    fonts: { heading: "serif", body: "sans-serif", accent: "serif" },
    layout: "portrait",
    elements: {
      showBorder: false,
      showPattern: false,
      showMandala: false,
      showCoupleIcon: false,
      showFloralCorner: true,
    },
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    style: "minimalist",
    colors: {
      primary: "#ffffff",
      secondary: "#2c3e50",
      accent: "#e74c3c",
      text: "#2c3e50",
      background: "#f8f9fa",
    },
    fonts: { heading: "sans-serif", body: "sans-serif", accent: "sans-serif" },
    layout: "square",
    elements: {
      showBorder: true,
      showPattern: false,
      showMandala: false,
      showCoupleIcon: false,
      showFloralCorner: false,
    },
  },
  {
    id: "rustic-elegant",
    name: "Rustic Elegant",
    style: "rustic",
    colors: {
      primary: "#f5f5dc",
      secondary: "#8b4513",
      accent: "#d2691e",
      text: "#5d4037",
      background: "#faf0e6",
    },
    fonts: { heading: "serif", body: "serif", accent: "serif" },
    layout: "portrait",
    elements: {
      showBorder: true,
      showPattern: false,
      showMandala: false,
      showCoupleIcon: false,
      showFloralCorner: true,
    },
  },
  {
    id: "peacock-blue",
    name: "Peacock Blue",
    style: "traditional",
    colors: {
      primary: "#006666",
      secondary: "#ffd700",
      accent: "#40e0d0",
      text: "#ffffff",
      background: "#004d4d",
    },
    fonts: { heading: "serif", body: "sans-serif", accent: "serif" },
    layout: "portrait",
    elements: {
      showBorder: true,
      showPattern: true,
      showMandala: true,
      showCoupleIcon: true,
      showFloralCorner: true,
    },
  },
];
