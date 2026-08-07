import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import { getFontEmbedCss } from "@/lib/font-embed";
import { toast } from "sonner";
import { Download, Link2, Loader2, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import { HackerCard, CARD_H, CARD_W } from "@/components/card/HackerCard";
import { defaultCard, mergeCard, themePresets, type CardData } from "@/lib/card-data";
import { fileToDownscaledDataUrl, dataUrlToDownscaled } from "@/lib/image-utils";
import { streamImage } from "@/lib/streamImage";
import { saveCard } from "@/lib/cards.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hacker House Goa — Build Your Event ID Card" },
      {
        name: "description",
        content:
          "Design a luxury tropical Hacker House Goa event badge with your name, role and stack. Upload or generate a portrait, download a high-res PNG, and share a live link.",
      },
      { property: "og:title", content: "Hacker House Goa — Build Your Event ID Card" },
      {
        property: "og:description",
        content:
          "Design a luxury tropical Hacker House Goa event badge, download it in high resolution and share it with one link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorPage,
});

const STORAGE_KEY = "hhg-card-v1";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card"
      />
    </div>
  );
}

function EditorPage() {
  const [card, setCard] = useState<CardData>(defaultCard);
  const [slug, setSlug] = useState<string | null>(null);
  const [editToken, setEditToken] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "png" | "share" | "ai">(null);
  const [aiPrompt, setAiPrompt] = useState("A confident Indian woman founder with long dark hair and sunglasses");
  const [aiPreview, setAiPreview] = useState<{ url: string; final: boolean } | null>(null);
  const [scale, setScale] = useState(0.5);

  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { card?: unknown; slug?: string; editToken?: string };
        if (parsed.card) setCard(mergeCard(parsed.card));
        if (parsed.slug) setSlug(parsed.slug);
        if (parsed.editToken) setEditToken(parsed.editToken);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ card, slug, editToken }));
    } catch {
      /* quota — ignore */
    }
  }, [card, slug, editToken]);

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

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://hackerhouse.goa";
    return slug ? `${window.location.origin}/c/${slug}` : window.location.origin;
  }, [slug]);

  const set = <K extends keyof CardData>(key: K, value: CardData[K]) =>
    setCard((c) => ({ ...c, [key]: value }));

  async function handleUpload(file: File) {
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
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
          void dataUrlToDownscaled(prev.url).then((small) => set("portrait", small));
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

  async function handleDownload() {
    if (!cardRef.current) return;
    setBusy("png");
    try {
      await document.fonts.ready;
    const fontEmbedCSS = await getFontEmbedCss();
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        width: CARD_W,
        height: CARD_H,
        cacheBust: true,
        fontEmbedCSS,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${card.name.replace(/\s+/g, "-").toLowerCase() || "hacker-house"}-id-card.png`;
      a.click();
      toast.success("Card downloaded");
    } catch {
      toast.error("Export failed — try again");
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy("share");
    try {
      const res = await saveCard({ data: { card, slug, editToken } });
      setSlug(res.slug);
      setEditToken(res.editToken);
      const url = `${window.location.origin}/c/${res.slug}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: `${card.name} — Hacker House Goa`, url });
        } catch {
          /* cancelled */
        }
      }
      await navigator.clipboard?.writeText(url).catch(() => {});
      toast.success("Share link copied", { description: url });
    } catch {
      toast.error("Could not create share link");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/60 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl leading-none tracking-tight text-foreground">
              Hacker House <span className="text-primary">Goa</span>
            </h1>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              ID card studio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCard(defaultCard)}>
              <RefreshCw className="size-4" /> Reset
            </Button>
            <Button variant="secondary" disabled={busy === "share"} onClick={handleShare}>
              {busy === "share" ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Share link
            </Button>
            <Button disabled={busy === "png"} onClick={handleDownload}>
              {busy === "png" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Download PNG
            </Button>
          </div>
        </div>
      </header>

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
              <Field label="ID number" value={card.idNumber} onChange={(v) => set("idNumber", v)} />
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
                      onClick={() => set("stack", card.stack.filter((_, j) => j !== i))}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider hover:border-destructive hover:text-destructive"
                    >
                      {s} <X className="size-3" />
                    </button>
                  ))}
                </div>
              </div>
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
              <div className="grid grid-cols-2 gap-3">
                <Field label="Title line 1" value={card.titleLine1} onChange={(v) => set("titleLine1", v)} />
                <Field label="Title line 2" value={card.titleLine2} onChange={(v) => set("titleLine2", v)} />
              </div>
              <Field label="Sticker text" value={card.stickerText} onChange={(v) => set("stickerText", v)} />
              <Field label="Tagline" value={card.tagline} onChange={(v) => set("tagline", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Time" value={card.time} onChange={(v) => set("time", v)} />
                <Field label="Room" value={card.room} onChange={(v) => set("room", v)} />
              </div>
              <Field label="Location" value={card.location} onChange={(v) => set("location", v)} />
              <Field label="Dates" value={card.dates} onChange={(v) => set("dates", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Hype label" value={card.hypeLabel} onChange={(v) => set("hypeLabel", v)} />
                <Field label="Apply label" value={card.applyLabel} onChange={(v) => set("applyLabel", v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stamp top" value={card.stampTop} onChange={(v) => set("stampTop", v)} />
                <Field label="Stamp bottom" value={card.stampBottom} onChange={(v) => set("stampBottom", v)} />
              </div>
              <Field label="Footer line 1" value={card.footerLine1} onChange={(v) => set("footerLine1", v)} />
              <Field label="Footer line 2" value={card.footerLine2} onChange={(v) => set("footerLine2", v)} />
              <Field label="Hashtag" value={card.hashtag} onChange={(v) => set("hashtag", v)} />
            </TabsContent>

            <TabsContent value="style" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-2">
                {themePresets.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => set("theme", p.theme)}
                    className="rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary"
                  >
                    <div className="flex gap-1">
                      {[p.theme.emerald, p.theme.gold, p.theme.pink, p.theme.paper].map((c) => (
                        <span
                          key={c}
                          className="size-5 rounded-full border border-border"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-wider">{p.name}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["Paper", "paper"],
                    ["Emerald", "emerald"],
                    ["Gold", "gold"],
                    ["Pink", "pink"],
                    ["Ink", "ink"],
                  ] as const
                ).map(([lbl, key]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {lbl}
                    </Label>
                    <input
                      type="color"
                      value={card.theme[key]}
                      onChange={(e) => set("theme", { ...card.theme, [key]: e.target.value })}
                      className="h-10 w-full cursor-pointer rounded-md border border-border bg-card"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* preview */}
        <section className="order-1 lg:order-2">
          <div
            ref={stageRef}
            className="sticky top-5 flex h-[70vh] items-center justify-center overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_60%)] lg:h-[calc(100vh-7rem)]"
          >
            <div
              style={{
                width: CARD_W * scale,
                height: CARD_H * scale,
                position: "relative",
              }}
            >
              <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <HackerCard ref={cardRef} data={card} shareUrl={shareUrl} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
