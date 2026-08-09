import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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

import { fileToDownscaledDataUrl, dataUrlToDownscaled } from "@/lib/image-utils";
import { streamImage } from "@/lib/streamImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hacker House Goa — Build Your Event ID Card" },
      {
        name: "description",
        content:
          "Design a luxury tropical Hacker House Goa event badge with your name, role and stack. Upload or generate a portrait and download a high-res PNG.",
      },
      { property: "og:title", content: "Hacker House Goa — Build Your Event ID Card" },
      {
        property: "og:description",
        content:
          "Design a luxury tropical Hacker House Goa event badge and download it in high resolution.",
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
  const [aiPreview, setAiPreview] = useState<{ url: string; final: boolean } | null>(null);
  const [scale, setScale] = useState(0.5);

  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ card }));
    } catch {
      /* quota — ignore */
    }
  }, [card]);

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
            <Button
              variant="outline"
              onClick={() => {
                setShareLink(null);
                setCard(defaultCard);
              }}
            >
              <RefreshCw className="size-4" /> Reset
            </Button>
            <Button variant="secondary" disabled={busy === "share"} onClick={handleShare}>
              {busy === "share" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Share2 className="size-4" />
              )}
              Get share link
            </Button>
            <Button disabled={busy === "png"} onClick={handleDownload}>
              {busy === "png" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Download PNG
            </Button>
          </div>
        </div>

      </header>

      <Dialog open={!!shareLink} onOpenChange={(o) => !o && setShareLink(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Your card is live</DialogTitle>
            <DialogDescription>
              The link is already copied to your clipboard. Anyone with it can view your
              card.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Input readOnly value={shareLink ?? ""} onFocus={(e) => e.currentTarget.select()} />
            <Button
              variant="secondary"
              onClick={() => {
                if (!shareLink) return;
                void navigator.clipboard?.writeText(shareLink);
                toast.success("Link copied");
              }}
            >
              <Copy className="size-4" /> Copy
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            This link points at a snapshot of the card. Edit it and share again to get a
            new link — the old one keeps the old design.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <a href={shareLink ?? "#"} target="_blank" rel="noreferrer">
                Open
              </a>
            </Button>
            <Button onClick={() => setShareLink(null)}>Done</Button>
          </div>
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
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Card base
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(BASES) as (keyof typeof BASES)[]).map((b) => (
                    <button
                      key={b}
                      onClick={() => set("theme", buildTheme(b, detectAccent(card.theme)))}
                      className={`flex items-center gap-2 rounded-lg border p-2 font-mono text-[10px] uppercase tracking-wider transition ${
                        detectBase(card.theme) === b ? "border-primary" : "border-border"
                      }`}
                    >
                      <span
                        className="size-4 shrink-0 rounded-full border border-border"
                        style={{ background: BASES[b].paper }}
                      />
                      {BASE_LABELS[b]}
                    </button>
                  ))}
                </div>
              </div>
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
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-wider">
                      {p.name}
                    </div>
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
