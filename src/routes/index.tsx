import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Download, Palette, Share2, Sparkles } from "lucide-react";
import { HackerCard, CARD_H, CARD_W } from "@/components/card/HackerCard";
import { buildTheme, defaultCard, mergeCard, type CardData } from "@/lib/card-data";
import { toPng } from "html-to-image";
import { getFontEmbedCss } from "@/lib/font-embed";
import { toast } from "sonner";
import { Copy, Download, Loader2, Lock, RefreshCw, Share2, Sparkles, Upload, X } from "lucide-react";
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
  themePresets,
  type CardData,
} from "@/lib/card-data";

import { fileToPortraitDataUrl, dataUrlToPortrait } from "@/lib/image-utils";
import { streamImage } from "@/lib/streamImage";
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
function Field({
  label,
  value,
  onChange,
  placeholder,
  locked,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  locked?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
        {locked ? <Lock className="size-3" /> : null}
      </Label>
      <Input
        value={value}
        placeholder={placeholder}
        readOnly={locked}
        tabIndex={locked ? -1 : undefined}
        onChange={(e) => onChange?.(e.target.value)}
        className={locked ? "bg-muted/60 text-muted-foreground cursor-not-allowed" : "bg-card"}
      />
    </div>
  );
}


function EditorPage() {
  const [card, setCard] = useState<CardData>(defaultCard);
  const [busy, setBusy] = useState<null | "png" | "share" | "ai">(null);
  const [aiPrompt, setAiPrompt] = useState(
    "A confident Indian woman founder with long dark hair and sunglasses",
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
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ card }));
    } catch {
      /* quota — ignore */
    }
  }, [card]);

  // The ID number is derived from the name so every attendee gets a stable,
  // unique-looking badge number without being able to edit it.
  useEffect(() => {
    let h = 0;
    for (const ch of card.name.trim().toUpperCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const serial = String(h % 10000).padStart(4, "0");
    const next = `HHG-2026-${serial}`;
    setCard((c) => (c.idNumber === next ? c : { ...c, idNumber: next }));
  }, [card.name]);


  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setScale(Math.min(w / CARD_W, h / CARD_H, 1));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [shareUrl, setShareUrl] = useState("https://hhgoa.com/");
  useEffect(() => setShareUrl(window.location.origin), []);

  // The uploaded CDN link for the current card, once it has been shared.
  const [shareLink, setShareLink] = useState<string | null>(null);

  // A share link is a snapshot of the PNG at upload time, so any edit makes the
  // existing one stale — drop it and let the user re-share.
  const set = <K extends keyof CardData>(key: K, value: CardData[K]) => {
    setShareLink(null);
    setCard((c) => ({ ...c, [key]: value }));
  };

  async function handleUpload(file: File) {
    try {
      const dataUrl = await fileToPortraitDataUrl(file);
      set("portrait", dataUrl);
      setAiPreview(null);
      toast.success("Portrait added");
    } catch {
      toast.error("Could not read that image");
    }
  }

  async function handleGenerate() {
    if (!aiPrompt.trim()) return;
    setBusy("ai");
    setAiPreview(null);
    try {
      await streamImage("/api/generate-portrait", aiPrompt.trim(), (url, final) => {
        setAiPreview({ url, final });
      });
      setAiPreview((prev) => {
        if (prev) {
          void dataUrlToPortrait(prev.url).then((small) => set("portrait", small));
        }
        return prev;
      });
      toast.success("Portrait generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(null);
    }
  }

  const fileName = () =>
    `${card.name.replace(/\s+/g, "-").toLowerCase() || "hacker-house"}-id-card.png`;

  // The badge body starts at y=150; above it sits only the lanyard and its
  // 300px clip, so the full-width canvas leaves a wide empty band either side
  // of the strap. Re-draw onto a canvas that keeps full width from the body
  // down but only strap width above it, so the export hugs the artwork.
  async function cropToStrap(dataUrl: string, backgroundColor?: string) {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();

    const s = img.width / CARD_W; // device pixel ratio baked in by toPng
    const bodyTop = 150 * s;
    const strapW = 300 * s;
    const strapX = (img.width - strapW) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;

    if (backgroundColor) {
      // Paint only where artwork actually is, leaving the flanks transparent.
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(strapX, 0, strapW, bodyTop);
      ctx.fillRect(0, bodyTop, img.width, img.height - bodyTop);
    }

    ctx.drawImage(img, strapX, 0, strapW, bodyTop, strapX, 0, strapW, bodyTop);
    ctx.drawImage(
      img,
      0,
      bodyTop,
      img.width,
      img.height - bodyTop,
      0,
      bodyTop,
      img.width,
      img.height - bodyTop,
    );

    return canvas.toDataURL("image/png");
  }

  async function renderPng(backgroundColor?: string) {
    if (!cardRef.current) throw new Error("Card not ready");
    await document.fonts.ready;
    const fontEmbedCSS = await getFontEmbedCss();
    const raw = await toPng(cardRef.current, {
      pixelRatio: 2,
      width: CARD_W,
      height: CARD_H,
      cacheBust: true,
      fontEmbedCSS,
    });
    return cropToStrap(raw, backgroundColor);
  }

  async function handleDownload() {
    setBusy("png");
    try {
      const a = document.createElement("a");
      a.href = await renderPng();
      a.download = fileName();
      a.click();
      toast.success("Card downloaded");
    } catch {
      toast.error("Export failed — try again");
    } finally {
      setBusy(null);
    }
  }

  // There is no database: the badge is flattened to a PNG, uploaded, and the
  // resulting CDN URL *is* the share link. Editing and re-sharing mints a new
  // URL rather than updating the old one.
  async function handleShare() {
    setBusy("share");
    try {
      const blob = await (await fetch(await renderPng(card.theme.paper))).blob();

      const form = new FormData();
      form.append("file", new File([blob], fileName(), { type: "image/png" }));
      form.append("name", card.name);

      const res = await fetch("/api/upload-card", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.text()) || "Upload failed");
      const { url } = (await res.json()) as { url: string };

      setShareLink(url);
      await navigator.clipboard?.writeText(url).catch(() => {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not share the card");
    } finally {
      setBusy(null);
    }
  }

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
        </DialogContent>
      </Dialog>

      <main className="mx-auto grid max-w-[1500px] gap-6 p-5 lg:grid-cols-[420px_1fr]">
        {/* editor */}
        <section className="order-2 lg:order-1">
          <Tabs defaultValue="you">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="you">You</TabsTrigger>
              <TabsTrigger value="photo">Photo</TabsTrigger>
              <TabsTrigger value="event">Event</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
            </TabsList>

            <TabsContent value="you" className="space-y-4 pt-4">
              <Field label="Name" value={card.name} onChange={(v) => set("name", v)} />
              <Field label="Role badge" value={card.role} onChange={(v) => set("role", v)} />
              <Field label="ID number (auto)" value={card.idNumber} locked />
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Stack (comma separated)
                </Label>
                <Textarea
                  rows={4}
                  className="bg-card font-mono text-xs"
                  value={card.stack.join(", ")}
                  onChange={(e) =>
                    set(
                      "stack",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim().toUpperCase())
                        .filter(Boolean)
                        .slice(0, 24),
                    )
                  }
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {card.stack.map((s, i) => (
                    <button
                      key={`${s}-${i}`}
                      onClick={() =>
                        set(
                          "stack",
                          card.stack.filter((_, j) => j !== i),
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider hover:border-destructive hover:text-destructive"
                    >
                      {s} <X className="size-3" />
                    </button>
                  ))}
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
            </TabsContent>

            <TabsContent value="photo" className="space-y-4 pt-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground hover:border-primary">
                <Upload className="size-5" />
                Upload a portrait
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload(f);
                  }}
                />
              </label>

              <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Or generate one with AI
                </Label>
                <Textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the person: hair, outfit, mood…"
                />
                <Button className="w-full" disabled={busy === "ai"} onClick={handleGenerate}>
                  {busy === "ai" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Generate golden-hour portrait
                </Button>
                {aiPreview ? (
                  <img
                    src={aiPreview.url}
                    alt="Generated portrait preview"
                    className={`mt-2 w-full rounded-md transition-[filter] duration-500 ${
                      aiPreview.final ? "blur-0" : "blur-2xl"
                    }`}
                  />
                ) : null}
              </div>

              {card.portrait ? (
                <Button variant="outline" className="w-full" onClick={() => set("portrait", null)}>
                  <X className="size-4" /> Remove portrait
                </Button>
              ) : null}
            </TabsContent>

            <TabsContent value="event" className="space-y-4 pt-4">
              <p className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                <Lock className="size-3.5 shrink-0" />
                Event details are fixed for Hacker House Goa and can't be edited.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Title line 1" value={card.titleLine1} locked />
                <Field label="Title line 2" value={card.titleLine2} locked />
              </div>
              <Field label="Sticker text" value={card.stickerText} locked />
              <Field label="Tagline" value={card.tagline} locked />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Time" value={card.time} locked />
                <Field label="Room" value={card.room} locked />
              </div>
              <Field label="Location" value={card.location} locked />
              <Field label="Dates" value={card.dates} locked />
              <Field label="Hype label" value={card.hypeLabel} locked />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Stamp top" value={card.stampTop} locked />
                <Field label="Stamp bottom" value={card.stampBottom} locked />
              </div>
              <Field label="Footer line 1" value={card.footerLine1} locked />
              <Field label="Footer line 2" value={card.footerLine2} locked />
              <Field label="Hashtag" value={card.hashtag} locked />
            </TabsContent>


            <TabsContent value="style" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Accent
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(ACCENTS) as (keyof typeof ACCENTS)[]).map((a) => (
                    <button
                      key={a}
                      onClick={() => set("theme", buildTheme(detectBase(card.theme), a))}
                      className={`flex items-center gap-2 rounded-lg border p-2 font-mono text-[10px] uppercase tracking-wider transition ${
                        detectAccent(card.theme) === a ? "border-primary" : "border-border"
                      }`}
                    >
                      <span
                        className="size-4 shrink-0 rounded-full border border-border"
                        style={{ background: ACCENTS[a] }}
                      />
                      {ACCENT_LABELS[a]}
                    </button>
                  ))}
                </div>
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
