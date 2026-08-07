import { z } from "zod";

const themeSchema = z.object({
  paper: z.string().max(32),
  emerald: z.string().max(32),
  gold: z.string().max(32),
  pink: z.string().max(32),
  ink: z.string().max(32),
});

export const cardSchema = z.object({
  titleLine1: z.string().trim().max(24),
  titleLine2: z.string().trim().max(24),
  stickerText: z.string().trim().max(16),
  tagline: z.string().trim().max(80),
  time: z.string().trim().max(24),
  room: z.string().trim().max(32),
  location: z.string().trim().max(48),
  dates: z.string().trim().max(48),
  applyLabel: z.string().trim().max(20),
  hypeLabel: z.string().trim().max(24),
  stampTop: z.string().trim().max(24),
  stampBottom: z.string().trim().max(16),
  name: z.string().trim().min(1).max(48),
  role: z.string().trim().max(24),
  idNumber: z.string().trim().max(32),
  stack: z.array(z.string().trim().max(24)).max(24),
  portrait: z.string().max(4_000_000).nullable(),
  footerLine1: z.string().trim().max(80),
  footerLine2: z.string().trim().max(80),
  hashtag: z.string().trim().max(48),
  theme: themeSchema,
});

export const saveCardSchema = z.object({
  card: cardSchema,
  slug: z.string().max(64).nullable(),
  editToken: z.string().max(96).nullable(),
});

export const getCardSchema = z.object({ slug: z.string().max(64) });

export function slugify(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "card";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
