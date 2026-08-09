# Hacker House Goa — ID Card Studio

Build a luxury tropical event ID badge for Hacker House Goa: fill in your
details, drop in a photo, and share it or save it as a high-res PNG.

The badge is a vertical laminated conference card on a green lanyard —
off-white textured paper, deep emerald panels, gold foil edging, a pink Devanagari
sticker, palm-leaf shadows, a QR code and an illustrated Goa beach village.

## Development

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
cp .env.example .env   # then fill in the values
npm run dev
```

## Environment

Copy `.env.example` to `.env`. Never commit `.env` — it is gitignored.

| Variable | Required for | Notes |
| --- | --- | --- |
| `UPLOADTHING_TOKEN` | Share links | Server-side only. The rendered PNG is uploaded and the CDN URL backs the share page. Without it, sharing falls back to attaching the image file directly. |
| `AI_GATEWAY_API_KEY` | AI portrait generation | Server-side only. Used by `src/routes/api/generate-portrait.ts`. |
| `AI_GATEWAY_URL` | — | Optional. Any OpenAI-compatible image endpoint. |
| `AI_IMAGE_MODEL` | — | Optional. Defaults to a Gemini flash image model. |

Everything works without the AI key except the "Generate portrait" button —
you can always upload your own photo.

## Architecture

There is no database. Card details never leave the browser; only the flattened
PNG is uploaded, and only when you press Share.

- **TanStack Start** (React 19, file-based routes in `src/routes`) on Vite.
- **`/`** — the card editor. Card state lives in React and persists to
  `localStorage` under `hhg-card-v1`; portraits are stored inline as downscaled
  data URLs.
- **`/c/$id`** — the public view of a shared badge. The badge's CDN URL and name
  are encoded into the path itself, so the page resolves its `og:image` during
  SSR with no database behind it. This route exists because a bare CDN PNG has
  no OG tags and would preview as a blank thumbnail.
- **PNG export** — rendered client-side with `html-to-image`, then re-drawn onto
  a canvas that trims the empty flanks either side of the lanyard. The last
  render is cached against the card state, so sharing right after downloading
  reuses it instead of rendering twice.
- **Sharing** — attaches the actual PNG through the Web Share API where the
  target accepts files (best on phones), and otherwise uploads it and shares a
  `/c/$id` link. Both carry a pre-filled caption ending in `#FrameInGoa`.
- **Portrait framing** — uploads auto-fill the frame with a `cover` fit; drag
  and pinch/slider adjust it. The crop is stored normalised (`x`/`y` as
  fractions of the overflow, `zoom` relative to the fit) so it means the same
  thing on screen and at export resolution.
- **`/api/generate-portrait`** — proxies a prompt to an AI image gateway and
  streams the result back, so the API key stays off the client. Nothing is
  persisted.
- **`/api/upload-card`** — validates and re-wraps the PNG server-side, then
  uploads it. Only the image is stored.
