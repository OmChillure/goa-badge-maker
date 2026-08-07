export type CardTheme = {
  paper: string;
  emerald: string;
  gold: string;
  pink: string;
  ink: string;
};

export type CardData = {
  // event / branding
  titleLine1: string;
  titleLine2: string;
  stickerText: string;
  tagline: string;
  time: string;
  room: string;
  location: string;
  dates: string;
  applyLabel: string;
  hypeLabel: string;
  stampTop: string;
  stampBottom: string;
  // person
  name: string;
  role: string;
  idNumber: string;
  stack: string[];
  portrait: string | null;
  // footer
  footerLine1: string;
  footerLine2: string;
  hashtag: string;
  theme: CardTheme;
};

export const defaultTheme: CardTheme = {
  paper: "#f4efe2",
  emerald: "#0d3b2e",
  gold: "#c9a227",
  pink: "#e0466e",
  ink: "#123024",
};

export const themePresets: { name: string; theme: CardTheme }[] = [
  { name: "Goa Emerald", theme: defaultTheme },
  {
    name: "Midnight Indigo",
    theme: {
      paper: "#f2f0ea",
      emerald: "#16204a",
      gold: "#c8a04a",
      pink: "#e05a86",
      ink: "#1a2242",
    },
  },
  {
    name: "Terracotta Sun",
    theme: {
      paper: "#f7efe3",
      emerald: "#5c2317",
      gold: "#d09a3c",
      pink: "#d94f45",
      ink: "#4a2117",
    },
  },
  {
    name: "Ink & Rose",
    theme: {
      paper: "#f5f2ee",
      emerald: "#1d1d1f",
      gold: "#b99457",
      pink: "#d6456a",
      ink: "#26262a",
    },
  },
];

export const defaultCard: CardData = {
  titleLine1: "HACKER",
  titleLine2: "HOUSE",
  stickerText: "गोवा",
  tagline: "CODE. CREATE. COLLABORATE.",
  time: "2:47PM",
  room: "STUDIO",
  location: "GOA, INDIA",
  dates: "28 – 31 OCT 2026",
  applyLabel: "APPLY",
  hypeLabel: "CHECK HYPE",
  stampTop: "HACKER HOUSE",
  stampBottom: "GOA",
  name: "Ananya Sharma",
  role: "FOUNDER",
  idNumber: "HHG-2026-0007",
  stack: [
    "PYTHON",
    "FASTAPI",
    "REACT",
    "NEXT.JS",
    "TAILWIND",
    "FIGMA",
    "FIREBASE",
    "POSTGRESQL",
    "AWS",
    "DOCKER",
    "GIT",
    "VERCEL",
  ],
  portrait: null,
  footerLine1: "CODE. CREATE. COLLABORATE.",
  footerLine2: "BUILT DIFFERENT. SHIP ANYWAY.",
  hashtag: "#HACKERHOUSEGOA",
  theme: defaultTheme,
};

export function mergeCard(input: unknown): CardData {
  const raw = (input ?? {}) as Partial<CardData>;
  return {
    ...defaultCard,
    ...raw,
    stack: Array.isArray(raw.stack) ? raw.stack.filter(Boolean).slice(0, 24) : defaultCard.stack,
    theme: { ...defaultTheme, ...(raw.theme ?? {}) },
  };
}
