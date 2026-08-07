import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, PenLine } from "lucide-react";
import { HackerCard, CARD_H, CARD_W } from "@/components/card/HackerCard";
import { getCard } from "@/lib/cards.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/c/$slug")({
  loader: async ({ params }) => {
    const res = await getCard({ data: { slug: params.slug } });
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Card not found — Hacker House Goa" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.card.name} — ${loaderData.card.titleLine1} ${loaderData.card.titleLine2}`;
    const description = `${loaderData.card.role} · ${loaderData.card.location} · ${loaderData.card.dates}. A Hacker House Goa event ID card.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: SharedCard,
});

function SharedCard() {
  const { card } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(`${window.location.origin}/c/${slug}`);
  }, [slug]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / CARD_W, el.clientHeight / CARD_H, 1));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  async function download() {
    if (!cardRef.current) return;
    await document.fonts.ready;
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 2,
      width: CARD_W,
      height: CARD_H,
      cacheBust: true,
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${card.name.replace(/\s+/g, "-").toLowerCase()}-id-card.png`;
    a.click();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[900px] flex-col items-center gap-5 p-5">
        <div
          ref={stageRef}
          className="flex h-[78vh] w-full items-center justify-center overflow-hidden"
        >
          <div style={{ width: CARD_W * scale, height: CARD_H * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <HackerCard ref={cardRef} data={card} shareUrl={shareUrl} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={download}>
            <Download className="size-4" /> Download PNG
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">
              <PenLine className="size-4" /> Make your own
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
