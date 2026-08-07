import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mergeCard, type CardData } from "./card-data";

const themeSchema = z.object({
  paper: z.string().max(32),
  emerald: z.string().max(32),
  gold: z.string().max(32),
  pink: z.string().max(32),
  ink: z.string().max(32),
});

const cardSchema = z.object({
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

function slugify(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "card";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

export const saveCard = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ card: cardSchema, slug: z.string().max(64).nullable(), editToken: z.string().max(96).nullable() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.slug && data.editToken) {
      const { data: existing } = await supabaseAdmin
        .from("cards")
        .select("id, edit_token")
        .eq("slug", data.slug)
        .maybeSingle();
      if (existing && existing.edit_token === data.editToken) {
        const { error } = await supabaseAdmin
          .from("cards")
          .update({ data: data.card, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw new Error("Could not update card");
        return { slug: data.slug, editToken: data.editToken };
      }
    }

    const slug = slugify(data.card.name);
    const { data: row, error } = await supabaseAdmin
      .from("cards")
      .insert({ slug, data: data.card })
      .select("slug, edit_token")
      .single();
    if (error || !row) throw new Error("Could not save card");
    return { slug: row.slug, editToken: row.edit_token };
  });

export const getCard = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(64) }).parse(input))
  .handler(async ({ data }): Promise<{ card: CardData } | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("cards")
      .select("data")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!row) return null;
    return { card: mergeCard(row.data) };
  });
