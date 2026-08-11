import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decodeShare, SHARE_HASHTAG, shareCaption } from "@/lib/share-link";

/**
 * The public view of a shared badge. Its whole reason for existing is the OG
 * tags: a bare CDN PNG has none, so pasting one into WhatsApp or X yields a
 * blank thumbnail. Everything here is resolved in `loader` (i.e. on the server
 * during SSR) because crawlers never run the client bundle.
 */
export const Route = createFileRoute("/c/$id")({
  loader: ({ params }) => {
    const payload = decodeShare(params.id);
    if (!payload) throw notFound();
    return payload;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { url, name } = loaderData;
    const title = name ? `${name} — Hacker House Goa ID card` : "My Hacker House Goa ID card";
    const description = shareCaption(name);

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: url },
        // WhatsApp and some crawlers only render a preview when the image
        // dimensions are declared up front.
        { property: "og:image:width", content: "2000" },
        { property: "og:image:height", content: "3520" },
        { property: "og:image:alt", content: title },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: url },
      ],
    };
  },
  component: SharedCardPage,
});

function SharedCardPage() {
  const { url, name } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="font-display text-2xl tracking-tight text-foreground">
            {name ? `${name} is going to` : "Going to"}{" "}
            <span className="text-primary">Hacker House Goa</span>
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            {SHARE_HASHTAG}
          </p>
        </div>

        <img
          src={url}
          alt={name ? `${name}'s Hacker House Goa ID card` : "Hacker House Goa ID card"}
          className="w-full rounded-xl shadow-2xl"
        />

        <div className="flex w-full flex-col gap-2 sm:flex-row">
          {/* `download` is same-origin-only, so point at the CDN file directly
              and let the browser save it; a plain link still works everywhere. */}
          <Button asChild className="flex-1">
            <a href={url} download="hacker-house-goa-id-card.png" target="_blank" rel="noreferrer">
              <Download className="size-4" /> Download image
            </a>
          </Button>
          <Button asChild variant="secondary" className="flex-1">
            <Link to="/studio">
              <Sparkles className="size-4" /> Make your own
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
