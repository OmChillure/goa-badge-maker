export type CardTheme = {
  paper: string;
  emerald: string;
  gold: string;
  pink: string;
  ink: string;
  /**
   * Which typeface pairing the badge renders in. Omitted on every theme that
   * predates the field, so `undefined` has to keep meaning "the original
   * Playfair/Space Mono badge" — saved cards in localStorage carry no `font`.
   */
  font?: CardFont;
};

/**
 * `hhgoa` is the pairing hhgoa.com itself uses: Imbue, a very tall condensed
 * display serif, over Victor Mono for the small caps and labels.
 */
export type CardFont = "classic" | "hhgoa";

export const FONT_STACKS: Record<CardFont, { display: string; mono: string }> = {
  classic: {
    display: "'Playfair Display', serif",
    mono: "'Space Mono', monospace",
  },
  hhgoa: {
    display: "'Imbue', 'Playfair Display', serif",
    mono: "'Victor Mono', 'Space Mono', monospace",
  },
};

export function fontsOf(theme: CardTheme) {
  return FONT_STACKS[theme.font ?? "classic"];
}

/**
 * How the portrait sits inside the badge's frame. `zoom` is relative to the
 * "cover" fit (1 = exactly fills the frame), and `x`/`y` are the offsets from
 * centre in fractions of the *overflow* — so ±0.5 walks the image to either
 * edge regardless of how much bigger than the frame it happens to be. Keeping
 * them normalised means the same crop survives a re-upload at a different
 * resolution, and clamping is a single expression.
 */
export type PortraitCrop = { x: number; y: number; zoom: number };

export const defaultCrop: PortraitCrop = { x: 0, y: 0, zoom: 1 };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function clampCrop(crop: PortraitCrop): PortraitCrop {
  return {
    zoom: clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM),
    x: clamp(crop.x, -0.5, 0.5),
    y: clamp(crop.y, -0.5, 0.5),
  };
}

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
  crop: PortraitCrop;
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

export type CardBase = "warm" | "green" | "midnight" | "clay" | "noir" | "ocean" | "hhgoa";
export type CardAccent = "pink" | "blue" | "amber" | "teal" | "violet" | "coral" | "sun";

export const ACCENTS: Record<CardAccent, string> = {
  pink: "#e0466e",
  blue: "#2f6fd0",
  amber: "#e08a1e",
  teal: "#12a594",
  violet: "#7c5cd6",
  coral: "#f2603c",
  sun: "#fee101",
};

export const ACCENT_LABELS: Record<CardAccent, string> = {
  pink: "Pink",
  blue: "Blue",
  amber: "Amber",
  teal: "Teal",
  violet: "Violet",
  coral: "Coral",
  sun: "HH Sun",
};

export const BASES: Record<CardBase, Omit<CardTheme, "pink">> = {
  warm: { paper: "#f7f2e8", emerald: "#123b2e", gold: "#c9a227", ink: "#173328" },
  green: { paper: "#0f3a2c", emerald: "#f2e8d4", gold: "#d8b455", ink: "#f2e8d4" },
  midnight: { paper: "#0d1330", emerald: "#e6ecff", gold: "#9fb4ff", ink: "#e6ecff" },
  clay: { paper: "#f4e6dc", emerald: "#6b3a2a", gold: "#b3702f", ink: "#4a2a20" },
  noir: { paper: "#111111", emerald: "#f0e6cf", gold: "#c9a84c", ink: "#f0e6cf" },
  ocean: { paper: "#eaf3f7", emerald: "#0c2340", gold: "#2d8a9e", ink: "#0c2340" },
  // Straight off hhgoa.com: their cream page, forest green ink and sun yellow.
  hhgoa: { paper: "#fffbe8", emerald: "#0b6839", gold: "#edd723", ink: "#0b6839", font: "hhgoa" },
};

export const BASE_LABELS: Record<CardBase, string> = {
  warm: "Warm ivory",
  green: "Dark green",
  midnight: "Midnight",
  clay: "Terracotta",
  noir: "Noir gold",
  ocean: "Ocean",
  hhgoa: "HH Goa",
};

export function buildTheme(base: CardBase, accent: CardAccent): CardTheme {
  return { ...BASES[base], pink: ACCENTS[accent] };
}

export function detectBase(theme: CardTheme): CardBase {
  const paper = theme.paper.toLowerCase();
  const found = (Object.keys(BASES) as CardBase[]).find((b) => BASES[b].paper === paper);
  return found ?? "warm";
}

export function detectAccent(theme: CardTheme): CardAccent {
  const pink = theme.pink.toLowerCase();
  const found = (Object.keys(ACCENTS) as CardAccent[]).find((a) => ACCENTS[a] === pink);
  return found ?? "pink";
}

export const themePresets: { name: string; theme: CardTheme }[] = [
  { name: "HH Goa · Official", theme: buildTheme("hhgoa", "sun") },
  { name: "HH Goa · Pink", theme: buildTheme("hhgoa", "pink") },
  { name: "Dark Green · Sun", theme: buildTheme("green", "sun") },
  { name: "Noir · Sun", theme: buildTheme("noir", "sun") },
  { name: "Warm Ivory · Pink", theme: buildTheme("warm", "pink") },
  { name: "Warm Ivory · Blue", theme: buildTheme("warm", "blue") },
  { name: "Dark Green · Pink", theme: buildTheme("green", "pink") },
  { name: "Dark Green · Blue", theme: buildTheme("green", "blue") },
  { name: "Midnight · Violet", theme: buildTheme("midnight", "violet") },
  { name: "Midnight · Teal", theme: buildTheme("midnight", "teal") },
  { name: "Terracotta · Amber", theme: buildTheme("clay", "amber") },
  { name: "Terracotta · Coral", theme: buildTheme("clay", "coral") },
  { name: "Noir Gold · Amber", theme: buildTheme("noir", "amber") },
  { name: "Noir Gold · Pink", theme: buildTheme("noir", "pink") },
  { name: "Ocean · Teal", theme: buildTheme("ocean", "teal") },
  { name: "Ocean · Coral", theme: buildTheme("ocean", "coral") },
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
  crop: defaultCrop,
  footerLine1: "CODE. CREATE. COLLABORATE.",
  footerLine2: "BUILT DIFFERENT. SHIP ANYWAY.",
  hashtag: "#FRAMEINGOA",
  theme: defaultTheme,
};

export function mergeCard(input: unknown): CardData {
  const raw = (input ?? {}) as Partial<CardData>;
  return {
    ...defaultCard,
    ...raw,
    stack: Array.isArray(raw.stack) ? raw.stack.filter(Boolean).slice(0, 24) : defaultCard.stack,
    crop: clampCrop({ ...defaultCrop, ...(raw.crop ?? {}) }),
    theme: { ...defaultTheme, ...(raw.theme ?? {}) },
  };
}
