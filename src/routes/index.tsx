import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Download, Palette, Share2, Sparkles } from "lucide-react";
import { HackerCard, CARD_H, CARD_W } from "@/components/card/HackerCard";
import { buildTheme, defaultCard, mergeCard, type CardData } from "@/lib/card-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hacker House Goa — Make Your Own ID Card" },
      {
        name: "description",
        content:
          "Four days, 500 builders, one beach. Make the badge before you make the thing — design your Hacker House Goa ID card and share it.",
      },
      { property: "og:title", content: "Hacker House Goa — Make Your Own ID Card" },
      {
        property: "og:description",
        content:
          "Four days, 500 builders, one beach. Design your Hacker House Goa ID card and share it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const STORAGE_KEY = "hhg-card-v1";

/* hhgoa.com's palette, kept literal here — this page is deliberately outside
   the app's semantic theme so it reads as the event, not as the editor UI. */
const GREEN = "#0b6839";
const SUN = "#fee101";
const CREAM = "#fffbe8";

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")";

function Noise({ opacity = 0.13 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 mix-blend-overlay"
      style={{ backgroundImage: NOISE, opacity }}
    />
  );
}

function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{ background: `${GREEN}f2`, borderColor: "#ffffff1f" }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3.5">
        <a href="/" className="flex items-baseline gap-2">
          <span
            className="text-2xl leading-none font-black tracking-tight"
            style={{ fontFamily: "var(--font-imbue)", color: CREAM }}
          >
            HACKER HOUSE
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.25em]"
            style={{ fontFamily: "var(--font-victor)", color: SUN }}
          >
            Goa
          </span>
        </a>

        <div className="flex items-center gap-2">
          <a
            href="/themes"
            className="hidden rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition hover:opacity-80 sm:block"
            style={{ fontFamily: "var(--font-victor)", color: CREAM }}
          >
            Themes
          </a>
          <a
            href="/studio"
            className="rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition hover:brightness-95"
            style={{ fontFamily: "var(--font-victor)", background: SUN, color: GREEN }}
          >
            Make your own card
          </a>
        </div>
      </div>
    </nav>
  );
}

/** A live badge at an arbitrary scale — the real card, never a mockup. */
function CardPreview({ card, scale }: { card: CardData; scale: number }) {
  return (
    <div
      style={{ width: CARD_W * scale, height: CARD_H * scale, position: "relative" }}
      className="shrink-0"
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        <HackerCard data={card} shareUrl="https://hhgoa.com/" />
      </div>
    </div>
  );
}

function LandingPage() {
  // Show the visitor's own card once they have one — coming back to the
  // landing page then feels like their card, not a stranger's.
  const [card, setCard] = useState<CardData>({
    ...defaultCard,
    theme: buildTheme("hhgoa", "sun"),
  });

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

  const steps = [
    {
      icon: Sparkles,
      title: "Fill in who you are",
      body: "Name, role, your stack. Upload a photo or let AI paint you a golden-hour portrait.",
    },
    {
      icon: Palette,
      title: "Pick your colourway",
      body: "Fourteen themes, previewed on a real badge — starting with HH Goa green and sun.",
    },
    {
      icon: Download,
      title: "Save it or ship it",
      body: "Export a high-res PNG, or share a link that unfurls your badge in the preview.",
    },
  ];

  return (
    <div style={{ background: CREAM }}>
      <Nav />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <header className="relative overflow-hidden" style={{ background: GREEN }}>
        <Noise />
        <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-16 lg:grid-cols-[1.1fr_auto] lg:py-24">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.3em]"
              style={{ fontFamily: "var(--font-victor)", color: SUN }}
            >
              28 – 31 Oct 2026 · Goa, India
            </p>

            <h1
              className="mt-5 text-[clamp(3.2rem,12vw,9.5rem)] font-black leading-[0.8] tracking-tight"
              style={{ fontFamily: "var(--font-imbue)", color: CREAM }}
            >
              MAKE THE BADGE
              <br />
              <span style={{ color: SUN }}>BEFORE YOU MAKE</span>
              <br />
              THE THING.
            </h1>

            <p
              className="mt-7 max-w-xl text-base leading-relaxed"
              style={{ fontFamily: "var(--font-victor)", color: "#fffbe8cc" }}
            >
              Four days. Five hundred builders. One beach house with the wifi turned all the way
              up. Your ID card is the first thing you ship — so make it look like you mean it.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="/studio"
                className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] transition hover:brightness-95"
                style={{ fontFamily: "var(--font-victor)", background: SUN, color: GREEN }}
              >
                Make your own card <ArrowRight className="size-4" />
              </a>
              <a
                href="/themes"
                className="inline-flex items-center gap-2 rounded-full border px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] transition hover:bg-white/10"
                style={{
                  fontFamily: "var(--font-victor)",
                  borderColor: "#fffbe855",
                  color: CREAM,
                }}
              >
                <Palette className="size-4" /> See the themes
              </a>
            </div>
          </div>

          {/* The product, shown rather than described. Tilted so it reads as an
              object on the page instead of a screenshot of one. */}
          <div className="hidden justify-center lg:flex">
            <div
              className="transition-transform duration-500 hover:rotate-0"
              style={{ transform: "rotate(3deg)", filter: "drop-shadow(0 30px 60px #00000055)" }}
            >
              <CardPreview card={card} scale={0.34} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Marquee ────────────────────────────────────────────── */}
      <div className="overflow-hidden border-y py-3" style={{ background: SUN, borderColor: GREEN }}>
        <div className="flex gap-8 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex shrink-0 gap-8 text-[11px] font-bold uppercase tracking-[0.25em]"
              style={{ fontFamily: "var(--font-victor)", color: GREEN }}
            >
              {[
                "Code. Create. Collaborate.",
                "Ship or ship",
                "Less noise, more signal",
                "#FrameInGoa",
                "Heads down",
              ].map((t) => (
                <span key={t}>{t} ✳</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── The story ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <h2
              className="text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.85] tracking-tight"
              style={{ fontFamily: "var(--font-imbue)", color: GREEN }}
            >
              A LAMINATED
              <br />
              PIECE OF
              <br />
              EVIDENCE.
            </h2>
          </div>
          <div
            className="space-y-5 text-[15px] leading-relaxed"
            style={{ fontFamily: "var(--font-victor)", color: "#0b6839cc" }}
          >
            <p>
              Every hackathon hands you a lanyard. Most of them you throw away on the flight home.
              This one is a vertical conference badge on a green strap — textured paper, deep
              emerald panels, gold foil edging, a pink Devanagari sticker, palm shadows falling
              across the whole thing.
            </p>
            <p>
              You put your name on it, your role, the stack you actually reach for. A portrait you
              upload, or one the machine paints for you in the last of the afternoon light. A QR
              code that goes somewhere real.
            </p>
            <p style={{ color: GREEN, fontWeight: 700 }}>
              Then you export it at 2000×3520 and it goes wherever you go.
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: GREEN }}>
        <Noise opacity={0.1} />
        <div className="relative mx-auto max-w-[1400px] px-5 py-20">
          <p
            className="text-[11px] uppercase tracking-[0.3em]"
            style={{ fontFamily: "var(--font-victor)", color: SUN }}
          >
            Three steps
          </p>
          <h2
            className="mt-4 text-[clamp(2.5rem,7vw,5.5rem)] font-black leading-[0.85] tracking-tight"
            style={{ fontFamily: "var(--font-imbue)", color: CREAM }}
          >
            TAKES ABOUT A MINUTE.
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="rounded-2xl border p-6"
                style={{ borderColor: "#fffbe833", background: "#ffffff0a" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-9 place-items-center rounded-full text-xs font-bold"
                    style={{ fontFamily: "var(--font-victor)", background: SUN, color: GREEN }}
                  >
                    {i + 1}
                  </span>
                  <s.icon className="size-4" style={{ color: SUN }} />
                </div>
                <h3
                  className="mt-5 text-2xl font-black leading-none tracking-tight"
                  style={{ fontFamily: "var(--font-imbue)", color: CREAM }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ fontFamily: "var(--font-victor)", color: "#fffbe8aa" }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Theme strip ────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-[1400px] px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                className="text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.85] tracking-tight"
                style={{ fontFamily: "var(--font-imbue)", color: GREEN }}
              >
                FOURTEEN
                <br />
                COLOURWAYS.
              </h2>
              <p
                className="mt-4 text-sm"
                style={{ fontFamily: "var(--font-victor)", color: "#0b6839aa" }}
              >
                Official green-and-sun, or something entirely your own.
              </p>
            </div>
            <a
              href="/themes"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] transition hover:brightness-95"
              style={{ fontFamily: "var(--font-victor)", background: GREEN, color: SUN }}
            >
              Browse all themes <ArrowRight className="size-4" />
            </a>
          </div>
        </div>

        {/* Horizontal scroller — wide content must never scroll the page body. */}
        <div className="mt-10 overflow-x-auto pb-4">
          <div className="flex gap-6 px-5" style={{ width: "max-content" }}>
            {(
              [
                ["hhgoa", "sun"],
                ["green", "sun"],
                ["noir", "sun"],
                ["warm", "pink"],
                ["midnight", "violet"],
                ["clay", "amber"],
                ["ocean", "teal"],
              ] as const
            ).map(([base, accent]) => (
              <div
                key={`${base}-${accent}`}
                className="rounded-2xl p-3"
                style={{ background: buildTheme(base, accent).paper, border: `1px solid ${GREEN}22` }}
              >
                <CardPreview card={{ ...card, theme: buildTheme(base, accent) }} scale={0.16} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: GREEN }}>
        <Noise />
        <div className="relative mx-auto max-w-[1400px] px-5 py-24 text-center">
          <h2
            className="text-[clamp(3rem,10vw,8rem)] font-black leading-[0.8] tracking-tight"
            style={{ fontFamily: "var(--font-imbue)", color: CREAM }}
          >
            YOUR NAME,
            <br />
            <span style={{ color: SUN }}>ON THE LANYARD.</span>
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href="/studio"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-xs font-bold uppercase tracking-[0.16em] transition hover:brightness-95"
              style={{ fontFamily: "var(--font-victor)", background: SUN, color: GREEN }}
            >
              Make your own card <ArrowRight className="size-4" />
            </a>
          </div>
          <p
            className="mt-8 text-[11px] uppercase tracking-[0.25em]"
            style={{ fontFamily: "var(--font-victor)", color: "#fffbe877" }}
          >
            <Share2 className="mr-1.5 inline size-3" /> #FrameInGoa
          </p>
        </div>
      </section>

      <footer className="py-10 text-center" style={{ background: CREAM }}>
        <p
          className="text-[10px] uppercase tracking-[0.25em]"
          style={{ fontFamily: "var(--font-victor)", color: "#0b683988" }}
        >
          A fan-made card studio · Not affiliated with the event
        </p>
      </footer>
    </div>
  );
}
