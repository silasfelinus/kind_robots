# Page backdrops and surface tokens

Rails for Stage 3 ("make it pretty"). This document is for whoever is doing the bespoke design work —
it describes the mechanism, and deliberately makes no aesthetic decisions.

Silas, 2026-08-05:

> "Make it work (pretty much done), make it consistent (…80% done), and then **Make it pretty**, the
> step that is largely unfinished, where we make these pages truly bespoke and not just a sparse shell
> of text boxes and text. […] I think a background image for each page, adjusted for mobile, tablet, or
> desktop layout, will help A LOT, and we're starting with that."

## Giving a page a backdrop

Three optional frontmatter keys, in any `content/*.md`:

```yaml
backgroundMobile: /api/art/backdrop/taskmaster-mobile
backgroundTablet: /api/art/backdrop/taskmaster-tablet
backgroundDesktop: /api/art/backdrop/taskmaster-desktop
```

**Written once, up front — before the art exists.** That route derives
`page-backdrop-<page>-<variant>`, the same requestId
`enqueuePageBackdropArt` writes, finds the completed job, and redirects to its
image. So art appears on its own the moment generation finishes: nothing to
run, nothing to write back here.

Until a job completes the route 404s and the page renders exactly as it did
before, which is the degradation path working rather than a failure.

That is the whole integration. No page component changes, no props to thread — `app.vue` mounts
`kr-page-backdrop` once and `pageStore` carries the values to it.

**All three are optional and independently so.** A page with only `backgroundDesktop` shows it at every
size rather than nothing; a page with none renders no backdrop at all. Since art is still being
generated, most pages will ship one variant long before three — that is the expected state, not a
half-finished one.

### Moving bytes to the media share (optional)

A file served straight from nginx is cheaper than the resolver route — no
function, no database read — so `npm run export:page-backdrops` writes finished
art to `$IMAGES_PATH` and sets `ArtImage.imagePath`. That is an optimisation,
**not a prerequisite**: pages show their art either way. Run it at leisure, on
a host where `IMAGES_PATH` reaches the share (Vercel cannot write to it).

`backgroundMobile` is not the same thing as `image:`. `image:` is the **thumbnail** — nav tabs and the
workspace sheet render it at chip size. These are full-bleed art.

## Breakpoints

| variant | width | matches |
|---|---|---|
| `backgroundMobile` | `< 768px` | Tailwind base |
| `backgroundTablet` | `768–1023px` | `md:` |
| `backgroundDesktop` | `≥ 1024px` | `lg:` |

## The two knobs Stage 3 owns

### Scrim

Art is chosen for mood, not for contrast against body text, so a wash guarantees legibility.
`kr-page-backdrop` takes `scrim="none" | "soft" | "medium" | "strong"`, defaulting to `soft`. The right
value depends on the artwork; pick per page.

### Surface translucency

`assets/css/tailwind.css` defines four tokens:

```css
:root {
  --kr-surface:        var(--color-base-200);  /* card / panel ground */
  --kr-surface-raised: var(--color-base-100);
  --kr-surface-sunken: var(--color-base-300);
  --kr-surface-border: var(--color-base-300);
}
[data-kr-backdrop] { /* …the same four, color-mix'd toward transparent */ }
```

`app.vue` puts `data-kr-backdrop` on `<main>` **only** when the page declares art. The shared kit
(`kr-gallery`, `kr-entity-card-body`, `kr-chat-window`, `kr-choice-list`, `reactable-card`) reads
`bg-(--kr-surface)` instead of `bg-base-200`, so panels go glass automatically.

**To retune the whole app's glass, edit the four values under `[data-kr-backdrop]` and nothing else.**
Opacity, and any blur you want to add, live there.

Not every surface converted, on purpose: skeletons, the progress track, avatar rings and the floating
karma/action chips stay opaque. They are not panels sitting over artwork, and the mockups show chips
reading as solid.

## Two slots, matching the mockups

```vue
<kr-page-backdrop :mobile="…" :tablet="…" :desktop="…" scrim="medium">
  <template #overlay>  <!-- butterflies, sparkles, compass roses --> </template>
  <template #character><!-- the transparent Serendipity PNG        --> </template>
</kr-page-backdrop>
```

Both render above the scrim and are `pointer-events-none`. They are separate because the character is
*anchored* (bottom-right on desktop in the Taskmaster mockup) while overlay elements are scattered —
you will want to move or hide the character per breakpoint without touching the sparkles.

## Two things not to undo

**The variant is chosen in CSS, never in JavaScript.** Reading `window.innerWidth` renders one variant
on the server and swaps on the client: a hydration mismatch plus a visible flash on every page load.
Inline styles cannot carry media queries, so the component sets only the custom properties it has and
`.kr-backdrop`'s media queries resolve which wins. This also means exactly one image is fetched, not
three. `verifyPageBackdrop.ts` fails if JS breakpoint detection appears in the component.

**Unset is not the same as empty.** `var(--a, var(--b))` reaches for `--b` only when `--a` is *unset*.
An empty string is a set value and resolves to nothing, painting no art while another variant sat
available — so absent variants must produce no custom property at all.

## Verification

- `npm run test:page-backdrop` — static contract: all three keys wired through all four sites
  (`content.config.ts`, `WorkspacePage`, the `meta` computed, the flat re-exports), no
  case-insensitive schema collision, fallback chains intact, tokens defaulting to theme colours, kit
  on tokens, backdrop mounted before `fx-region`. Every assertion is mutation-tested.
- `npm run audit:responsive` — behavioural: drives Chromium at 390 / 820 / 1440 and fails if a route's
  declared variants collapse into fewer distinct URLs than it declared. No static check can see which
  variant a browser picks.

### Why the schema-collision check exists

`content.config.ts` warns in prose that SQLite column names are case-insensitive. A key that collides
case-insensitively with an existing one makes the content collection's `CREATE TABLE` fail, which
leaves the content tables uncreated and **500s every page**. That is the worst failure available in
this area and it was guarded only by a comment. It is now a test.
