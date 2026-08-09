# Goa ID Creator

Refer this image and prompt



{

  "prompt": "Design a premium luxury vertical event ID card for 'Hacker House Goa' in an elegant tropical vintage aesthetic. The card should look like a real laminated conference badge hanging from a dark green fabric lanyard with golden metal clip. Use an off-white textured paper background with deep emerald green accents, gold foil details, soft pink highlights, palm leaf shadows and a luxurious editorial feel.\n\nAt the top, place huge serif typography reading 'HACKER HOUSE' with a small pink Hindi sticker saying 'गोवा' overlapping between the words. Below it write 'CODE. CREATE. COLLABORATE.' in elegant spaced typography.\n\nTop left contains:\n• Time: 2:47PM\n• STUDIO\n• GOA, INDIA\n• 28–31 OCT 2026\n\nTop right contains:\n• CHECK HYPE\n• APPLY button\n• Circular Hacker House Goa stamp with palm tree illustration.\n\nMain section:\nA large rounded portrait frame with thin gold border containing a stylish founder portrait looking sideways during golden hour on a Goa beach. Soft sunset lighting, premium fashion photography, cinematic color grading.\n\nTo the right place handwritten luxury script for the name.\nBelow the name place a dark emerald badge with gold border reading 'FOUNDER'.\n\nBelow that add a stack section:\nPYTHON • FASTAPI • REACT\nNEXT.JS • TAILWIND • FIGMA\nFIREBASE • POSTGRESQL • AWS\nDOCKER • GIT • VERCEL\n\nBottom information panel:\nDark emerald background with gold separators.\nLeft:\nID NUMBER\nHHG-2026-0007\n\nCenter:\nLuxury QR code with HH logo.\n\nRight:\nVALID DATES\n28–31 OCT 2026\nLOCATION\nGOA, INDIA\n\nBottom artwork:\nA detailed illustrated Goa beach village with palm trees, cottages, surfboards, sunset, ocean waves, Hacker House café, warm lighting and retro travel poster style.\n\nFooter:\nCODE. CREATE. COLLABORATE.\nBUILT DIFFERENT. SHIP ANYWAY.\n#HACKERHOUSEGOA\nSmall gold globe icon on the right.\n\nOverall design should feel like Apple + Stripe + luxury conference branding + tropical Goa + premium magazine editorial. Use gold foil effects, subtle shadows, realistic lamination, rounded corners, premium typography hierarchy, soft grain texture, depth, reflections, modern UI design, high contrast, ultra detailed, luxury branding, photorealistic print quality.",

  "negative_prompt": "low quality, blurry, watermark, logo distortion, bad typography, extra hands, extra people, duplicated elements, cartoon, oversaturated colors, noisy image, poor composition, stretched text, broken QR code, cluttered layout",

  "size": "1024x1536",

  "style": "photorealistic",

  "quality": "ultra",

  "lighting": "golden hour cinematic",

  "camera": "85mm portrait",

  "render": "premium print quality",

  "aspect_ratio": "2:3"

}





And make.me.a site which take the user info and make this extract same id card for the user which he can actually share with user just make sure it can edit the info and make it work proper and i need 120% id card just detailed will change

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
| `LOVABLE_API_KEY` | AI portrait generation | Server-side only. Used by `src/routes/api/generate-portrait.ts` |

It is the only variable. Without it everything works except the
"Generate portrait" button — you can still upload your own photo.

## Architecture

There is no database and no user data leaves the browser.

- **TanStack Start** (React 19, file-based routes in `src/routes`) on Vite.
- **`/`** — the card editor, the app's only page. Card state lives in React and
  persists to `localStorage` under `hhg-card-v1`; portraits are stored inline as
  downscaled data URLs.
- **PNG export** — rendered client-side with `html-to-image`. "Share card" hands
  that PNG to the OS share sheet via the Web Share API, falling back to a
  download where file sharing is unsupported.
- **`/api/generate-portrait`** — the one server route. It proxies a prompt to an
  AI image gateway and streams the result back, so the API key stays off the
  client. Nothing is persisted.
