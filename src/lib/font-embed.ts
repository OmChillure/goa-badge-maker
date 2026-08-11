const FONT_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Space+Mono:wght@400;700&family=Parisienne&family=Noto+Sans+Devanagari:wght@600;700&family=Imbue:opsz,wght@10..100,400;10..100,700;10..100,900&family=Victor+Mono:wght@400;700&display=swap";

let cached: Promise<string> | null = null;

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * html-to-image cannot read cross-origin stylesheet rules, so we fetch the
 * Google Fonts CSS ourselves and inline every font file as a data URL.
 */
export function getFontEmbedCss(): Promise<string> {
  if (!cached) {
    cached = (async () => {
      const css = await fetch(FONT_CSS_URL, {
        headers: {
          // ask for woff2 with a modern UA-ish accept so the CSS stays small
          Accept: "text/css,*/*;q=0.1",
        },
      }).then((r) => r.text());

      const urls = Array.from(new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) ?? []));
      const pairs = await Promise.all(
        urls.map(async (u) => {
          try {
            return [u, await toDataUrl(u)] as const;
          } catch {
            return [u, u] as const;
          }
        }),
      );
      let out = css;
      for (const [u, d] of pairs) out = out.split(u).join(d);
      return out;
    })().catch(() => "");
  }
  return cached;
}
