import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import { getFontEmbedCss } from "@/lib/font-embed";
import { toast } from "sonner";
import { Copy, Download, Loader2, RefreshCw, Share2, Sparkles, Upload, X } from "lucide-react";
import { HackerCard, CARD_H, CARD_W } from "@/components/card/HackerCard";
import { PortraitCropper } from "@/components/card/PortraitCropper";
import {
  ACCENTS,
  ACCENT_LABELS,
  BASES,
  BASE_LABELS,
  buildTheme,
  defaultCard,
  defaultCrop,
  detectAccent,
  detectBase,
  mergeCard,
  themePresets,
  type CardData,
} from "@/lib/card-data";
import { encodeShare, shareCaption, tweetIntentUrl } from "@/lib/share-link";
import { uploadCardImage } from "@/lib/upload-card";

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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card"
      />
    </div>
  );
}

/** X's current logo — lucide still ships the retired bird. */
function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.9 2.3h3.3l-7.2 8.2 8.5 11.2h-6.7l-5.2-6.8-6 6.8H2.3l7.7-8.8L1.9 2.3h6.8l4.7 6.2zm-1.2 17.5h1.8L7.4 4.1H5.4z" />
    </svg>
  );
}

function EditorPage() {
  const [card, setCard] = useState<CardData>(defaultCard);
  const [busy, setBusy] = useState<null | "png" | "share" | "ai" | "x">(null);
  const [aiPrompt, setAiPrompt] = useState(
    "A confident Indian woman founder with long dark hair and sunglasses",
  );
  const [aiPreview, setAiPreview] = useState<{ url: string; final: boolean } | null>(null);
  const [scale, setScale] = useState(0.5);

  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Rendering the same unchanged card twice (download, then share) is pure
  // waste, and the export is the slowest thing the app does. Cache the last
  // PNG against the card state that produced it; any edit clears it via `set`.
  const pngCache = useRef<{ key: string; opaque: boolean; blob: Blob } | null>(null);

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
    pngCache.current = null;
    setCard((c) => ({ ...c, [key]: value }));
  };

  async function handleUpload(file: File) {
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      setShareLink(null);
      pngCache.current = null;
      // A new photo has nothing to do with how the last one was framed, so
      // reset to the auto "cover" fit in the same update.
      setCard((c) => ({ ...c, portrait: dataUrl, crop: defaultCrop }));
      setAiPreview(null);
      toast.success("Portrait added — drag it to reframe");
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
          void dataUrlToDownscaled(prev.url).then((small) => {
            setShareLink(null);
            pngCache.current = null;
            setCard((c) => ({ ...c, portrait: small, crop: defaultCrop }));
          });
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
  async function cropToStrap(dataUrl: string, backgroundColor?: string): Promise<Blob> {
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
    if (!ctx) return await (await fetch(dataUrl)).blob();

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

    // toBlob avoids the base64 detour toDataURL forces on a ~3 MB image.
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Could not encode the card"))),
        "image/png",
      ),
    );
  }

  async function renderBlob(backgroundColor?: string): Promise<Blob> {
    const key = JSON.stringify(card);
    const opaque = !!backgroundColor;
    const hit = pngCache.current;
    if (hit && hit.key === key && hit.opaque === opaque) return hit.blob;

    if (!cardRef.current) throw new Error("Card not ready");
    // `cacheBust` re-downloads every image on each export, which on a phone is
    // seconds of needless network. The portrait is already an inline data URL
    // and the artwork is a bundled asset, so there is nothing stale to bust.
    await document.fonts.ready;
    const fontEmbedCSS = await getFontEmbedCss();
    const raw = await toPng(cardRef.current, {
      pixelRatio: 2,
      width: CARD_W,
      height: CARD_H,
      fontEmbedCSS,
    });
    const blob = await cropToStrap(raw, backgroundColor);
    pngCache.current = { key, opaque, blob };
    return blob;
  }

  function triggerDownload(blob: Blob) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName();
    a.rel = "noopener";
    a.click();
    // Revoke on the next tick — immediately would race the download starting.
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  }

  async function handleDownload() {
    setBusy("png");
    try {
      const blob = await renderBlob();
      // iOS Safari ignores the `download` attribute, so a click there navigates
      // away instead of saving. Hand the file to the share sheet, where "Save
      // to Photos" is one tap — that is the real download on a phone.
      const file = new File([blob], fileName(), { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          // Anything else: fall through to the classic download.
        }
      }
      triggerDownload(blob);
      toast.success("Card downloaded");
    } catch {
      toast.error("Export failed — try again");
    } finally {
      setBusy(null);
    }
  }

  // There is no database: the badge is flattened to a PNG, uploaded, and the
  // resulting CDN URL is wrapped in a /c/ link. Editing and re-sharing mints a
  // new URL rather than updating the old one.
  async function uploadForLink(): Promise<string> {
    // Flatten onto the paper colour: a transparent PNG renders on a black
    // backdrop in most chat apps.
    const blob = await renderBlob(card.theme.paper);
    const url = await uploadCardImage(new File([blob], fileName(), { type: "image/png" }));

    // Link to the /c/ page rather than the raw PNG — it is the only one of the
    // two that carries og:image, so the preview shows the badge.
    const link = `${window.location.origin}/c/${encodeShare({ url, name: card.name })}`;
    setShareLink(link);
    return link;
  }

  async function handleShare() {
    setBusy("share");
    try {
      const blob = await renderBlob(card.theme.paper);
      const file = new File([blob], fileName(), { type: "image/png" });
      const caption = shareCaption(card.name);

      // Attaching the actual image beats any link preview, so try it first.
      // Instagram and most gallery-style targets only accept files this way.
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: caption });
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          // Target refused files — fall through to the link route.
        }
      }

      const link = await uploadForLink();

      if (navigator.share) {
        try {
          await navigator.share({ text: caption, url: link });
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
        }
      }
      await navigator.clipboard?.writeText(`${caption} ${link}`).catch(() => {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not share the card");
    } finally {
      setBusy(null);
    }
  }

  // X cannot take an image attachment through the web intent, so the tweet
  // picture comes from the /c/ page's og:image. That means we must upload
  // first — but the popup has to be opened synchronously inside the click or
  // the blocker eats it, so open it now and point it at the URL once we have it.
  async function handleShareToX() {
    // No `noopener` here: it makes window.open return null by design, and we
    // need the handle to redirect this window once the upload resolves.
    // Safe because we null out `opener` ourselves before navigating to X.
    const popup = window.open("about:blank", "_blank", "width=600,height=700");
    setBusy("x");
    try {
      const link = shareLink ?? (await uploadForLink());
      const intent = tweetIntentUrl(shareCaption(card.name), link);
      if (popup && !popup.closed) {
        // Drop the back-reference before handing the tab to X, which is what
        // `noopener` would have done for us.
        popup.opener = null;
        popup.location.replace(intent);
      } else {
        // Blocked anyway — a normal navigation still gets them there.
        window.open(intent, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      popup?.close();
      toast.error(e instanceof Error ? e.message : "Could not open X");
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
          {/* On a phone these live in the sticky bottom bar instead, where a
              thumb can reach them without scrolling back up. */}
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              variant="outline"
              onClick={() => {
                setShareLink(null);
                pngCache.current = null;
                setCard(defaultCard);
              }}
            >
              <RefreshCw className="size-4" /> Reset
            </Button>
            <Button variant="outline" disabled={busy === "x"} onClick={handleShareToX}>
              {busy === "x" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XLogo className="size-3.5" />
              )}
              Share to X
            </Button>
            <Button variant="secondary" disabled={busy === "share"} onClick={handleShare}>
              {busy === "share" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Share2 className="size-4" />
              )}
              Share card
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
              Caption and link are copied to your clipboard — paste them anywhere. The preview will
              show your badge.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Caption
            </Label>
            <Textarea
              readOnly
              rows={2}
              className="resize-none text-sm"
              value={shareCaption(card.name)}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <div className="flex items-center gap-2">
            <Input readOnly value={shareLink ?? ""} onFocus={(e) => e.currentTarget.select()} />
            <Button
              variant="secondary"
              onClick={() => {
                if (!shareLink) return;
                void navigator.clipboard?.writeText(`${shareCaption(card.name)} ${shareLink}`);
                toast.success("Caption + link copied");
              }}
            >
              <Copy className="size-4" /> Copy
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            This link points at a snapshot of the card. Edit it and share again to get a new link —
            the old one keeps the old design.
          </p>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" asChild>
              <a href={shareLink ?? "#"} target="_blank" rel="noreferrer">
                Open
              </a>
            </Button>
            <Button variant="secondary" asChild>
              {/* The link already exists here, so this is a plain anchor — no
                  upload to await, and nothing for a popup blocker to catch. */}
              <a
                href={shareLink ? tweetIntentUrl(shareCaption(card.name), shareLink) : "#"}
                target="_blank"
                rel="noreferrer"
              >
                <XLogo className="size-3.5" /> Post to X
              </a>
            </Button>
            <Button onClick={() => setShareLink(null)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="mx-auto grid max-w-[1500px] gap-6 p-5 pb-28 sm:pb-5 lg:grid-cols-[420px_1fr]">
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
                {card.portrait ? "Choose a different photo" : "Upload a portrait"}
                <span className="text-[11px]">Any shape — you can reframe it after</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload(f);
                    // Let the same file be picked again after a reset.
                    e.target.value = "";
                  }}
                />
              </label>

              {card.portrait ? (
                <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Reframe
                    </Label>
                    <button
                      onClick={() => set("crop", defaultCrop)}
                      className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </button>
                  </div>
                  <PortraitCropper
                    src={card.portrait}
                    crop={card.crop}
                    onChange={(c) => set("crop", c)}
                  />
                </div>
              ) : null}

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
                <Field
                  label="Title line 1"
                  value={card.titleLine1}
                  onChange={(v) => set("titleLine1", v)}
                />
                <Field
                  label="Title line 2"
                  value={card.titleLine2}
                  onChange={(v) => set("titleLine2", v)}
                />
              </div>
              <Field
                label="Sticker text"
                value={card.stickerText}
                onChange={(v) => set("stickerText", v)}
              />
              <Field label="Tagline" value={card.tagline} onChange={(v) => set("tagline", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Time" value={card.time} onChange={(v) => set("time", v)} />
                <Field label="Room" value={card.room} onChange={(v) => set("room", v)} />
              </div>
              <Field label="Location" value={card.location} onChange={(v) => set("location", v)} />
              <Field label="Dates" value={card.dates} onChange={(v) => set("dates", v)} />
              <Field
                label="Hype label"
                value={card.hypeLabel}
                onChange={(v) => set("hypeLabel", v)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Stamp top"
                  value={card.stampTop}
                  onChange={(v) => set("stampTop", v)}
                />
                <Field
                  label="Stamp bottom"
                  value={card.stampBottom}
                  onChange={(v) => set("stampBottom", v)}
                />
              </div>
              <Field
                label="Footer line 1"
                value={card.footerLine1}
                onChange={(v) => set("footerLine1", v)}
              />
              <Field
                label="Footer line 2"
                value={card.footerLine2}
                onChange={(v) => set("footerLine2", v)}
              />
              <Field label="Hashtag" value={card.hashtag} onChange={(v) => set("hashtag", v)} />
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

              {/* The header Reset is hidden on phones; keep one reachable. */}
              <Button
                variant="outline"
                className="w-full sm:hidden"
                onClick={() => {
                  setShareLink(null);
                  pngCache.current = null;
                  setCard(defaultCard);
                }}
              >
                <RefreshCw className="size-4" /> Reset card
              </Button>
            </TabsContent>
          </Tabs>
        </section>

        {/* preview */}
        <section className="order-1 lg:order-2">
          <div
            ref={stageRef}
            className="sticky top-5 flex h-[56vh] items-center justify-center overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_60%)] sm:h-[70vh] lg:h-[calc(100vh-7rem)]"
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

      {/* Mobile action bar — the two things anyone actually came here to do,
          pinned above the home indicator. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-card/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        {/* Icon-only so three actions still fit a narrow phone. */}
        <Button
          variant="outline"
          className="h-12 w-12 shrink-0"
          disabled={busy === "x"}
          onClick={handleShareToX}
          aria-label="Share to X"
        >
          {busy === "x" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <XLogo className="size-4" />
          )}
        </Button>
        <Button
          variant="secondary"
          className="h-12 flex-1"
          disabled={busy === "share"}
          onClick={handleShare}
        >
          {busy === "share" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Share2 className="size-4" />
          )}
          Share
        </Button>
        <Button className="h-12 flex-1" disabled={busy === "png"} onClick={handleDownload}>
          {busy === "png" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Save image
        </Button>
      </div>
    </div>
  );
}
