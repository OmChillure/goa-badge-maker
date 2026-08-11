import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Palette, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { HackerCard, CARD_H, CARD_W } from "@/components/card/HackerCard";
import {
  ACCENTS,
  ACCENT_LABELS,
  BASES,
  BASE_LABELS,
  buildTheme,
  defaultCard,
  detectAccent,
  detectBase,
  mergeCard,
  type CardAccent,
  type CardBase,
  type CardData,
  type CardTheme,
} from "@/lib/card-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/themes")({
  head: () => ({
    meta: [
      { title: "Themes — Hacker House Goa ID Card Studio" },
      {
        name: "description",
        content:
          "Browse every Hacker House Goa badge colourway — including the official green-and-sun HH Goa theme — and apply one to your card in a click.",
      },
      { property: "og:title", content: "Themes — Hacker House Goa ID Card Studio" },
      {
        property: "og:description",
        content: "Every badge colourway, previewed on a real card. Pick one and make it yours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThemesPage,
});

const STORAGE_KEY = "hhg-card-v1";

/** The badge is 1000×1760; a gallery tile shows it at this fraction. */
const TILE_SCALE = 0.196;

type Combo = { base: CardBase; accent: CardAccent };

/**
 * The gallery is deliberately curated rather than the full 7×7 grid — 49 tiles
 * is a wall of noise, and most of the cross products are muddy. These are the
 * pairings that actually hold together, official one first.
 */
const FEATURED: Combo[] = [
  { base: "hhgoa", accent: "sun" },
  { base: "hhgoa", accent: "pink" },
  { base: "green", accent: "sun" },
  { base: "noir", accent: "sun" },
  { base: "warm", accent: "pink" },
  { base: "warm", accent: "blue" },
  { base: "green", accent: "pink" },
  { base: "midnight", accent: "violet" },
  { base: "midnight", accent: "teal" },
  { base: "clay", accent: "amber" },
  { base: "clay", accent: "coral" },
  { base: "noir", accent: "amber" },
  { base: "ocean", accent: "teal" },
  { base: "ocean", accent: "coral" },
];

function comboName(c: Combo) {
  return `${BASE_LABELS[c.base]} · ${ACCENT_LABELS[c.accent]}`;
}

/**
 * A live badge at gallery size. This is the real `HackerCard`, not a mock, so
 * a tile can never drift from what the editor will actually render — the cost
 * is that each tile mounts a full card, hence the curated list above.
 */
function ThemeTile({
  card,
  theme,
  name,
  active,
  official,
  onApply,
}: {
  card: CardData;
  theme: CardTheme;
  name: string;
  active: boolean;
  official?: boolean;
  onApply: () => void;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-card transition ${
        active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/60"
      }`}
    >
      {official ? (
        <span
          className="absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.15em]"
          style={{ background: "#0b6839", color: "#fee101" }}
        >
          Official
        </span>
      ) : null}

      <div
        className="flex justify-center overflow-hidden px-4 pt-4"
        style={{ background: theme.paper }}
      >
        {/* The badge's own transparent flanks would show the tile background
            through them, so the swatch colour sits behind the whole preview. */}
        <div
          style={{
            width: CARD_W * TILE_SCALE,
            height: CARD_H * TILE_SCALE,
            position: "relative",
          }}
        >
          <div
            style={{
              transform: `scale(${TILE_SCALE})`,
              transformOrigin: "top left",
              pointerEvents: "none",
            }}
          >
            <HackerCard data={{ ...card, theme }} shareUrl="https://hhgoa.com/" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border p-3">
        <div className="min-w-0">
          <div className="truncate font-mono text-[10px] uppercase tracking-[0.14em]">{name}</div>
          <div className="mt-1.5 flex gap-1">
            {[theme.paper, theme.emerald, theme.gold, theme.pink].map((c, i) => (
              <span
                key={`${c}-${i}`}
                className="size-3.5 rounded-full border border-border"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <Button size="sm" variant={active ? "secondary" : "default"} onClick={onApply}>
          {active ? <Check className="size-3.5" /> : null}
          {active ? "Applied" : "Use"}
        </Button>
      </div>
    </div>
  );
}

function ThemesPage() {
  // Preview the user's own card where there is one, so the gallery shows their
  // name and photo rather than the placeholder's.
  const [card, setCard] = useState<CardData>(defaultCard);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { card?: unknown };
        if (parsed.card) setCard(mergeCard(parsed.card));
      }
    } catch {
      /* ignore */
    }
  }, []);

  function apply(theme: CardTheme) {
    const next = { ...card, theme };
    setCard(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ card: next }));
    } catch {
      /* quota — ignore */
    }
    toast.success("Theme applied — open the studio to finish your card");
  }

  const activeBase = detectBase(card.theme);
  const activeAccent = detectAccent(card.theme);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero, in hhgoa.com's own green-and-sun palette. */}
      <header className="relative overflow-hidden" style={{ background: "#0b6839" }}>
        {/* The site's noise texture, inlined as an SVG turbulence filter. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.13] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative mx-auto max-w-[1500px] px-5 py-14 sm:py-20">
          <a
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.25em]"
            style={{ color: "#fee101" }}
          >
            ← Hacker House Goa
          </a>
          <h1
            className="mt-6 text-[clamp(3rem,11vw,8rem)] font-black leading-[0.82] tracking-tight"
            style={{ fontFamily: "var(--font-imbue)", color: "#fffbe8" }}
          >
            PICK YOUR
            <br />
            THEME
          </h1>
          <p
            className="mt-6 max-w-xl font-mono text-sm leading-relaxed"
            style={{ fontFamily: "var(--font-victor)", color: "#fffbe8bb" }}
          >
            Every colourway on a real badge — no mockups. Tap{" "}
            <span style={{ color: "#fee101" }}>Use</span> and your card carries it straight back
            into the studio.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-10">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-tight">Curated colourways</h2>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {FEATURED.length} themes · live previews
              </p>
            </div>
            <Button variant="outline" asChild>
              {/* A plain anchor, not <Link>: the studio reads the card from
                  localStorage on mount, and only a real navigation guarantees
                  it remounts and picks up the theme just applied here. */}
              <a href="/studio">
                <Wand2 className="size-4" /> Open the studio
              </a>
            </Button>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {FEATURED.map((c) => {
              const theme = buildTheme(c.base, c.accent);
              return (
                <ThemeTile
                  key={`${c.base}-${c.accent}`}
                  card={card}
                  theme={theme}
                  name={comboName(c)}
                  official={c.base === "hhgoa" && c.accent === "sun"}
                  active={activeBase === c.base && activeAccent === c.accent}
                  onApply={() => apply(theme)}
                />
              );
            })}
          </div>
        </section>
      </main>

      {/* Sticky CTA — applying a theme here is only useful once you go back. */}
      <div className="sticky bottom-0 border-t border-border bg-card/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {comboName({ base: activeBase, accent: activeAccent })}
          </span>
          <Button asChild>
            <a href="/studio">
              <Wand2 className="size-4" /> Back to the studio
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
