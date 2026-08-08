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
  paper: "#f7f2e8",
  emerald: "#123b2e",
  gold: "#c9a227",
  pink: "#e0466e",
  ink: "#173328",
};

export type CardBase = "warm" | "green";
export type CardAccent = "pink" | "blue";

export const ACCENTS: Record<CardAccent, string> = {
  pink: "#e0466e",
  blue: "#2f6fd0",
};

export const BASES: Record<CardBase, Omit<CardTheme, "pink">> = {
  warm: { paper: "#f7f2e8", emerald: "#123b2e", gold: "#c9a227", ink: "#173328" },
  green: { paper: "#0f3a2c", emerald: "#f2e8d4", gold: "#d8b455", ink: "#f2e8d4" },
};

export function buildTheme(base: CardBase, accent: CardAccent): CardTheme {
  return { ...BASES[base], pink: ACCENTS[accent] };
}

export function detectBase(theme: CardTheme): CardBase {
  return theme.paper.toLowerCase() === BASES.green.paper ? "green" : "warm";
}

export function detectAccent(theme: CardTheme): CardAccent {
  return theme.pink.toLowerCase() === ACCENTS.blue ? "blue" : "pink";
}

export const themePresets: { name: string; theme: CardTheme }[] = [
  { name: "Warm Ivory · Pink", theme: buildTheme("warm", "pink") },
  { name: "Warm Ivory · Blue", theme: buildTheme("warm", "blue") },
  { name: "Dark Green · Pink", theme: buildTheme("green", "pink") },
  { name: "Dark Green · Blue", theme: buildTheme("green", "blue") },
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
