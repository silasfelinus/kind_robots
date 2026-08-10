// /utils/galleryVocabulary.ts
//
// One vocabulary for galleries.
//
// Before this module the app had eight overlapping ways to say the same thing:
// ArtVariant, kr-gallery's GalleryMode, a second GalleryMode re-declared inside
// conductor-page, ProjectArtVariant in conductor-art-gallery, kr-art-plate's
// `shape`, a narrower `shape` re-declared in kr-entity-card-body, and
// dream-gallery's private grid/row/reel/hero/swipe. Silas, looking at the
// controls: "I see titles of layouts that don't match our type ... this is
// excessive and not vetted."
//
// The confusion is that TWO axes were wearing one name:
//
//   VARIANT — which stored image do I load? card / hero / icon. This is the
//     anchor, because it is the only one the database agrees with: ArtImage
//     carries cardPath / heroPath / iconPath columns and nothing else. There
//     will only ever be three unless the schema gains a fourth.
//
//   SHAPE — what aspect box do I draw it in? A hero image can legitimately sit
//     in a card-shaped plate, which is exactly why this cannot be folded into
//     variant.
//
//   MODE — what is the gallery showing? The three variants, plus `list`, which
//     is a layout rather than a variant and is the one honest exception here.
//
// New presentation ideas belong on one of these axes. Inventing a fourth
// vocabulary is how five values became eight.

// Imported for use in the maps below, but deliberately NOT re-exported:
// artImageSrc.ts is the canonical home, and a second auto-importable
// declaration makes Nuxt pick a winner and warn about the one it dropped.
import type { ArtVariant } from './artImageSrc'

/**
 * What a gallery is currently showing: exactly the plural of ArtVariant, one
 * mode per stored image, and nothing else.
 *
 * There used to be a fourth, `list`. Silas killed it 2026-08-03 after seeing
 * it live: "List is the odd duck out ... the current List page is a GIGANTIC
 * display of individual images, with each dream taking up more than a page ...
 * confirmed that on small, the line and hero displays look identical. kill
 * line." Both observations follow from what it was — a layout wearing a mode's
 * clothes. It loaded hero art (so it WAS heroes once a phone dropped its
 * two-column grid) at a 12rem row that a full card overflowed. A mode that is
 * a layout rather than an image cannot stay in lockstep with the schema, which
 * is the whole point of this vocabulary.
 *
 * `list` is deliberately NOT re-added as an alias. IS_GALLERY_MODE rejects the
 * stored string and callers fall back to `cards`, which is the migration.
 *
 * These strings are persisted to localStorage and to the gallery-preference
 * store, so renaming a value is a data migration, not a rename.
 */
export type GalleryMode = 'cards' | 'heroes' | 'icons'

export interface GalleryModeOption {
  value: GalleryMode
  label: string
  abbr: string
  /**
   * The glyph the mode bar draws below `lg`, where there is no room for words.
   *
   * MONOCHROME ONLY. Most of assets/icons is multicolour (card.svg, gallery.svg
   * and picture.svg all hardcode fills), and the active mode button is
   * `btn-primary` — a fixed-palette glyph on a primary fill reads as a sticker
   * sitting on the button rather than part of it. These three are
   * `currentColor`, so they take the button's own text colour in both states.
   *
   * The shapes describe the LAYOUT each mode produces, not the word:
   *   cards   2x2 grid   — the card grid
   *   heroes  wide bars  — full-width 16:9 art, stacked
   *   icons   thin rules — the text-forward row with a small square intro
   */
  icon: string
}

/** The canonical mode list. Any gallery offering mode buttons reuses this. */
export const GALLERY_MODES: readonly GalleryModeOption[] = [
  { value: 'cards', label: 'Cards', abbr: 'C', icon: 'kind-icon:view-grid' },
  { value: 'heroes', label: 'Heroes', abbr: 'H', icon: 'kind-icon:triple-row' },
  { value: 'icons', label: 'Icons', abbr: 'I', icon: 'kind-icon:list' },
]

/**
 * Use when reading a mode back from localStorage or the preference store —
 * persisted values are untrusted input, and a bare cast lets a stale or
 * hand-edited string through as a valid mode.
 */
export const IS_GALLERY_MODE = (value: string): value is GalleryMode =>
  GALLERY_MODES.some((mode) => mode.value === value)

/** Which stored art a given mode loads. One mode, one column, no exceptions. */
export const MODE_VARIANT: Record<GalleryMode, ArtVariant> = {
  cards: 'card',
  heroes: 'hero',
  icons: 'icon',
}

/**
 * THE SHAPE EACH VARIANT IS DRAWN AT. This is the missing link that made
 * "consistent look" keep slipping.
 *
 * `variant` picks WHICH image loads; `shape` picks the BOX it goes in. They were
 * independent props with nothing tying them together, and kr-entity-card-body
 * defaulted shape to `wide` (4:3 horizontal) no matter the variant. So choosing
 * Cards loaded the VERTICAL card art and then drew it in a HORIZONTAL box —
 * letterboxed and small — while `icon` had no case in the aspect map at all and
 * fell through to 3:2. Silas, 2026-08-04: "Hero view is good both times. Card
 * and icon are wack, yo. Small images, terrible layout, cramped displays."
 *
 * His spec, which had never been written down anywhere and is why this kept
 * being rediscovered:
 *
 *   imagePath  SQUARE      — the default, the plain stored image
 *   hero       HORIZONTAL  — 16:9
 *   card       VERTICAL    — 2:3
 *   icon       SQUARE      — but as a small intro piece to a TEXT-FORWARD
 *                            layout, not a big art box (see kr-entity-card-body)
 *
 * Derive from this map rather than passing `shape` alongside `variant` by hand:
 * two hand-passed props are two chances to disagree, which is the whole bug.
 */
export const VARIANT_SHAPE: Record<ArtVariant, ArtPlateShape> = {
  card: 'card',
  hero: 'hero',
  icon: 'square',
}

/**
 * The grid each mode lays its items out in. Lifted verbatim from kr-gallery so
 * a gallery that cannot yet adopt the whole shell still lays out identically
 * to one that has.
 *
 * Every entry is a GRID. That is not incidental: the one entry that was not
 * (`list`, a flex column) is the one that had to be removed, because a mode
 * whose identity is its layout rather than its image duplicates whichever grid
 * happens to collapse to one column at that width.
 */
/*
 * CONTAINER-responsive, deliberately — no sm:/lg:/xl: breakpoints.
 *
 * These grids were `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
 * and similar, which key off the VIEWPORT. Galleries here are mounted inside
 * manager panels, not at full page width, so on a wide screen `xl:grid-cols-4`
 * fired while the actual container was narrow — four columns crammed into a
 * panel. Silas, 2026-08-04, on scenario-gallery: "the individual scenarios are
 * appearing but with formatting that is awkward (small card, excessive
 * padding, no different layouts)."
 *
 * scenario-gallery's own pre-adoption CSS had this right:
 * `repeat(auto-fill, minmax(min(180px, 100%), 1fr))`. auto-fill + minmax needs
 * no breakpoints at all — it fills whatever width it is actually given and
 * degrades to a single column when that width is below the minimum, which is
 * what `min(..., 100%)` guarantees. Adopting the shared shell must not cost a
 * gallery the sizing it already had.
 */
export const MODE_GRID_CLASS: Record<GalleryMode, string> = {
  cards:
    'grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(11rem,100%),1fr))]',
  heroes:
    'grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(20rem,100%),1fr))]',
  // A ROW (square art + title + subtitle), so it needs a row's width. At the
  // old 7rem the art alone took half the column and every title truncated to
  // "The Soun..." -- Silas: "cramped displays".
  icons:
    'grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(16rem,100%),1fr))]',
}

/**
 * HOW BIG THE TILES ARE — a fourth axis, added deliberately and closed.
 *
 * The module header warns that "inventing a fourth vocabulary is how five
 * values became eight," so this needs its justification written down.
 *
 * art-gallery has carried a four-step xs/sm/md/lg size picker since long before
 * kr-gallery existed. It is genuinely NOT mode: mode says which stored image
 * loads (card/hero/icon) and each mode happens to bundle a density with it,
 * but art-gallery wants density while staying on one variant, and it also
 * feeds the same value to `compact`, `showPrompt` and `showMeta` on the card.
 * Folding it into mode would mean either deleting a working control or leaving
 * the largest gallery in the app off the shared shell.
 *
 * What makes this safe rather than a fifth overlapping name:
 *
 *   - It is a CLOSED enum, not a free-form class string. An escape-hatch prop
 *     taking arbitrary Tailwind is the version of this that quietly lets every
 *     gallery keep its own bespoke grid.
 *   - It is ORTHOGONAL to mode, not a rival spelling of it. Density answers
 *     "how many per row", mode answers "which image". Both can be set.
 *   - It replaces a hand-rolled switch rather than sitting beside one:
 *     art-gallery's own imageGridClass was VIEWPORT-keyed
 *     (`md:grid-cols-3 xl:grid-cols-4`), the exact breakpoint bug the
 *     MODE_GRID_CLASS note above documents. Moving it here fixes it, and
 *     verifyGalleryConsistency holds both maps to the same rule.
 *
 * A gallery that does not pass `density` is unaffected — mode still picks the
 * grid, which is why this is additive.
 */
export type GalleryDensity = 'xs' | 'sm' | 'md' | 'lg'

export interface GalleryDensityOption {
  value: GalleryDensity
  label: string
}

/** Labels are art-gallery's shipped wording, kept so the control reads the same. */
export const GALLERY_DENSITIES: readonly GalleryDensityOption[] = [
  { value: 'xs', label: 'Extra compact' },
  { value: 'sm', label: 'Compact' },
  { value: 'md', label: 'Normal' },
  { value: 'lg', label: 'Large' },
]

/** Persisted to localStorage by art-gallery, so treat reads as untrusted. */
export const IS_GALLERY_DENSITY = (value: string): value is GalleryDensity =>
  GALLERY_DENSITIES.some((density) => density.value === value)

/**
 * Container-responsive for the same reason MODE_GRID_CLASS is: these are
 * auto-fill grids that fill the width they are actually given. The literals
 * are enumerated rather than composed because Tailwind's JIT only compiles
 * arbitrary values it can see whole in the source.
 */
export const DENSITY_GRID_CLASS: Record<GalleryDensity, string> = {
  xs: 'grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(9rem,100%),1fr))]',
  sm: 'grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(12rem,100%),1fr))]',
  md: 'grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(18rem,100%),1fr))]',
  lg: 'grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(28rem,100%),1fr))]',
}

/**
 * The aspect a frame is drawn at — NOT which image is loaded (that is
 * ArtVariant). `plate` is the 3:2 mockup shape the aesthetic is named for and
 * is kr-art-plate's default; `wide` is 4:3 and is kr-entity-card-body's.
 */
export type ArtPlateShape = 'card' | 'hero' | 'square' | 'wide' | 'plate'
