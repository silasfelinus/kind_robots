# UI surface standards — viewport-first, art-first, console-first

> Moved verbatim from `AGENTS.md` on 2026-11-01 PT (token-essentialization pass). `AGENTS.md`
> keeps the condensed rule; this file holds the full text and history. If they disagree, `AGENTS.md`
> wins — fix this file. Read before building or reshaping any game, gallery or creative tool surface.

## Viewport-first interface and complete gallery rule (Silas, 2026-10-13)

Design interactive pages for **one visible screen by default** at phone, tablet, and
desktop widths. Use the shell's available content height, not a new `100vh`
wrapper. Keep primary interaction, the active artwork/map/game stage, and a
compact control/navigation row visible. Put secondary content in switchable
panes or disclosed panels. When a pane contains more content than fits,
**scroll inside that bounded content area** (prefer `.kr-scroll`) rather than
turning the whole page into a tall document. An intentionally long article
or tutorial is an explicit exception, not the default for games and tools.

**Gallery completion is a reachability contract:** every item must be reachable
by scrolling the gallery's own bounded area or by clear, working pagination.
Never silently clip the bottom rows with `overflow-hidden` or a fixed-height
gallery without an overflow owner. Preserve the gallery's contents, loading
states, item interactions, keyboard access and visible scroll affordance.

Put how-to paragraphs, prototype caveats, policy explanations, and detailed
reference text in the existing tutorial / help sidebar. Leave only short
contextual labels, essential status, and narrative content that is itself
part of play on the active screen. Do not solve the problem by shrinking
art and controls into illegibility, piling more nested scrolling containers
on a page, or creating a second persistent header. When changing an existing
surface, check 390px / 768px / 1440px widths for no shell scrolling, reachable
last gallery item, visible primary actions, and safe keyboard navigation.
The Emperor of Dust court is the first concrete retrofit; apply this rule
incrementally to existing games, galleries, and tools as they are touched.

## Art-first interface standard

Kind Robots is an **art-focused website**. Outside settings, administration, diagnostics,
and similarly utilitarian screens, a feature is not finished merely because every field,
button, or data object is technically reachable.

- Prefer image-led cards, galleries, canvases, stages, decks, maps, timelines, and other
  visual interaction surfaces over text-and-button control panels.
- When a user chooses a Character, Dream, Scenario, Facet, Reward, artwork, or other entity
  that has art, the art is a primary part of the choice. Do not reduce it to a tiny thumbnail
  beside a form row unless dense utility UI genuinely requires that treatment.
- Creative setup flows should feel open and compositional. Avoid wizard/tab proliferation
  when the choices can coexist coherently on one visual surface.
- Empty art is a product problem, not permission to design a permanently text-first card.
  Use the shared art fallback while preserving an image-shaped slot, and wire real entity art
  whenever the model provides it.
- Settings-style UI is appropriate for settings. A creative product surface should look and
  feel designed before it is sent to Silas for visual acceptance.

## Console-first, space-filling creative surfaces (Silas, 2026-10-20 PT)

The default visual metaphor for creative tools and games is a **console**, not a
stacked web form. Artwork, maps, video, and playable stages get the strongest
visual hierarchy and first use of available space. Controls should feel like
a compact command deck around the stage; long settings and explanatory text
belong in details panels or the tutorial sidebar.

- On large displays, use the available **container** width and height instead of
  trapping creative content in a narrow centered reading column. Responsive
  columns in shared components use container queries or intrinsic grids rather
  than viewport-only breakpoints.
- Prioritize real, large image previews and image-led choices over text-heavy
  cards, tiny thumbnails, and empty decorative gutters. When artwork is missing,
  preserve an image-sized fallback instead of collapsing the visual stage.
- On small displays, collapse supporting controls before shrinking the stage into
  illegibility. Keep the primary action visible, with each gallery and option
  browser owning its bounded scrolling so the last item stays reachable.
- Apply this incrementally to existing surfaces. Do not globally widen
  long-form reading content, invent nested scroll panes, or claim visual
  acceptance without rendered phone, tablet, desktop and XL checks.
