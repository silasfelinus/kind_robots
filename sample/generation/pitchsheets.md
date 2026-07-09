# Generating PitchSheets

Model: `PitchSheet` — exactly one per Dream (`dreamId` unique, cascade
delete). Endpoints: `POST /api/sheets`, `POST /api/sheets/batch`,
`GET /api/sheets/by-dream/…`.

A PitchSheet is the presentation layer for a dream — the one-screen
sales card with a hook, three highlights, three detail blocks, and an
**artist mockup**. Every PROJECT dream (and any pitch going to Silas)
deserves one.

## Field spec

Required: `dreamId`, `title`.

| Field | Fill with |
| --- | --- |
| `layoutKey` | `'pitch-card'` (default) unless a new layout exists |
| `title`, `subtitle` | Usually the dream's title + a positioning line |
| `hook` | One irresistible sentence (≤512) |
| `pitch` | The full pitch paragraph(s) |
| `highlight{1..3}Label/Value/Icon` | Three stat-style selling points — short label, short value, `kind-icon:*` icon |
| `detail{1..3}Label/Body` | Three expandable sections (e.g. The Idea / Why It Works / First Steps) |
| `imagePath` / `artImageId` | **The artist mockup** — see below |
| `icon`, `colorTheme` | `kind-icon:*` + a DaisyUI theme name matching the vibe |
| `extraData` | Json overflow for layout-specific extras |
| `userId`, `designer`, flags | README rules 4–5 |

## The artist mockup

Every generated PitchSheet includes one mockup image: a "what this would
feel like shipped" illustration — key screen, poster, or product shot
energy, NOT a UI wireframe with readable text (house rule: no readable
text in generated art).

| Asset | Path | Notes |
| --- | --- | --- |
| Mockup | `public/images/sheets/{dream-slug}-mockup.webp` (1280×720) | referenced by `imagePath` |
| Mockup variants | `public/images/{dream-slug}/{dream-slug}-inspiration-{n}.webp` | candidate takes; promote one |

(`images/sheets/` is the prescribed convention for new mockups; existing
sheets sometimes point elsewhere via `imagePath` — the field, not the
folder, is authoritative.)

## Checklist

1. Confirm the dream exists and has no sheet (`dreamId` is unique —
   batch upserts by it).
2. Write the sheet: hook + 3 highlights + 3 details, all in-voice.
3. Generate the mockup from a prompt anchored to the dream's `artPrompt`
   and set `imagePath`.
4. Verify: the sheet renders in the pitch layout with icons, theme, and
   mockup resolving.
