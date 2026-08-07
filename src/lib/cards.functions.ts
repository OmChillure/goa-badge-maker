import { createServerFn } from "@tanstack/react-start";
import { getCardSchema, saveCardSchema, slugify } from "./card-schema";
import { mergeCard, type CardData } from "./card-data";

export const saveCard = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveCardSchema.parse(input))
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
  .inputValidator((input: unknown) => getCardSchema.parse(input))
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
