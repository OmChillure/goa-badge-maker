# Hacker House Goa — ID Card Generator

A single-page app that renders a pixel-faithful recreation of the tropical-luxury Hacker House Goa badge as live HTML/CSS, with an editor panel that updates every detail in real time. Users can upload or AI-generate their portrait, download the card as a high-res PNG, and publish a public share link.

## The card (recreated in code, not an image)

Vertical badge, ~1000x1500, with laminated-plastic look: rounded corners, gold rim, soft grain texture, palm-frond shadows over off-white paper.

Sections top to bottom:
- Dark green lanyard tab with "HH / GOA" and gold metal clip
- Top-left meta: time, room label, city, date range
- Top-right: "CHECK HYPE" + barcode + APPLY pill + circular palm-tree stamp
- Giant serif "HACKER HOUSE" with pink Hindi sticker overlapping between words
- Tagline in wide-tracked caps
- Arched gold-bordered portrait frame
- Script name in gold, pink heart, underline
- Emerald "FOUNDER" role badge with gold border
- STACK list, dot-separated, wraps by row
- Emerald info strip: ID number, generated QR code with HH center mark, valid dates, location
- Illustrated Goa beach village artwork band
- Footer: two tagline lines + hashtag + gold globe icon

## Editor

Left panel (drawer on mobile) with grouped, validated fields — everything editable:
- Identity: name, role badge text, ID number, stack items (add/remove chips)
- Event: event title lines, Hindi sticker text, tagline, time, room, location, date range
- Footer: both footer lines, hashtag
- Theme: emerald / gold / pink accent tweaks, and a couple of preset palettes
- Live preview scales to fit; reset-to-default button

## Portrait

Two paths in one control:
- Upload: file picker, client-side crop/zoom into the arch frame, stored in Cloud storage
- Generate: short description field, AI generates a golden-hour Goa portrait, streamed with a blurred preview while rendering, then saved to storage

## Share

- Download PNG: renders the card DOM to a high-res image (2x) client-side
- Share link: saves the card to Cloud and gives a public `/c/<id>` URL that renders the same card read-only, with correct social preview tags. Copy-link button and native share sheet on mobile.

## Technical notes

- Lovable Cloud enabled for: `cards` table (all card fields as JSON + owner, public slug) and a public `card-images` storage bucket for portraits.
- Public read policy on cards so `/c/<id>` renders without login; writes restricted to the creating session/owner. Sign-in optional — anonymous creation supported via a returned edit token, so "make + share" works with zero friction.
- Card is one `<CardBadge>` component driven by a typed `CardData` object, rendered identically in the editor, the share route, and the export.
- PNG export via `html-to-image` on the card node at 2x scale; fonts preloaded via `<link>` in the root head so exports don't lose typography.
- QR code generated client-side from the share URL, with the HH mark overlaid.
- AI portrait via the image-generation server route with streaming preview.
- Beach-village artwork band, palm-shadow overlay, paper grain, and the circular stamp are generated as project image assets once and reused (not re-generated per card).
- Fonts: a high-contrast display serif for the wordmark, a wide-tracked mono/sans for labels, and a script face for the name — loaded via Google Fonts link in `__root.tsx`; all colors as semantic tokens in `src/styles.css`.
- Routes: `/` (editor + preview), `/c/$slug` (public card), each with its own head metadata.
