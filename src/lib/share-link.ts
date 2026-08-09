export const SHARE_HASHTAG = "#FrameInGoa";

/** The caption pre-filled into every share sheet and copy-link action. */
export function shareCaption(name: string) {
  const who = name.trim();
  return who
    ? `${who} is going to Hacker House Goa. Make your own badge ${SHARE_HASHTAG}`
    : `Just made my Hacker House Goa badge ${SHARE_HASHTAG}`;
}

/**
 * X's web intent. It cannot attach an image — the tweet's picture has to come
 * from the link's own OG tags, which is exactly what /c/$id serves. The
 * hashtag rides inside the caption rather than the `hashtags` param so it
 * reads as a sentence instead of being appended after the URL.
 */
export function tweetIntentUrl(caption: string, link: string) {
  const params = new URLSearchParams({ text: caption, url: link });
  return `https://x.com/intent/tweet?${params.toString()}`;
}

/**
 * Share links carry their own payload — the badge's CDN URL plus the name for
 * the OG title — so /c/$id resolves with no database behind it. base64url keeps
 * it path-safe; the `v1.` prefix leaves room to change the encoding later
 * without breaking links already out in the wild.
 */
export type SharePayload = { url: string; name: string };

function toBase64Url(s: string) {
  const b64 = typeof btoa === "function" ? btoa(s) : Buffer.from(s, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return typeof atob === "function"
    ? atob(padded)
    : Buffer.from(padded, "base64").toString("binary");
}

export function encodeShare(payload: SharePayload): string {
  // encodeURIComponent first so non-Latin names survive the binary-safe base64.
  return `v1.${toBase64Url(encodeURIComponent(JSON.stringify(payload)))}`;
}

export function decodeShare(id: string): SharePayload | null {
  try {
    if (!id.startsWith("v1.")) return null;
    const parsed = JSON.parse(decodeURIComponent(fromBase64Url(id.slice(3)))) as SharePayload;
    // Only ever hand back an https image URL — this string is interpolated into
    // og:image and an <img src>, and it arrives from the path.
    if (typeof parsed?.url !== "string") return null;
    const u = new URL(parsed.url);
    if (u.protocol !== "https:") return null;
    return { url: u.toString(), name: typeof parsed.name === "string" ? parsed.name : "" };
  } catch {
    return null;
  }
}
