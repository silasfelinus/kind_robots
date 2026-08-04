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
}

/** The canonical mode list. Any gallery offering mode buttons reuses this. */
export const GALLERY_MODES: readonly GalleryModeOption[] = [
  { value: 'cards', label: 'Cards', abbr: 'C' },
  { value: 'heroes', label: 'Heroes', abbr: 'H' },
  { value: 'icons', label: 'Icons', abbr: 'I' },
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
  icons:
    'grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(7rem,100%),1fr))]',
}

/**
 * The aspect a frame is drawn at — NOT which image is loaded (that is
 * ArtVariant). `plate` is the 3:2 mockup shape the aesthetic is named for and
 * is kr-art-plate's default; `wide` is 4:3 and is kr-entity-card-body's.
 */
export type ArtPlateShape = 'card' | 'hero' | 'wide' | 'plate'
