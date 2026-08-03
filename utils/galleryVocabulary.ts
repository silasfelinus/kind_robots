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

import type { ArtVariant } from './artImageSrc'

export type { ArtVariant }

/**
 * What a gallery is currently showing. The first three are the plural of
 * ArtVariant and MUST stay in lockstep with it; `list` is a layout.
 *
 * These strings are persisted to localStorage and to the gallery-preference
 * store, so renaming a value is a data migration, not a rename.
 */
export type GalleryMode = 'cards' | 'heroes' | 'icons' | 'list'

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
  { value: 'list', label: 'List', abbr: 'L' },
]

/**
 * Use when reading a mode back from localStorage or the preference store —
 * persisted values are untrusted input, and a bare cast lets a stale or
 * hand-edited string through as a valid mode.
 */
export const IS_GALLERY_MODE = (value: string): value is GalleryMode =>
  GALLERY_MODES.some((mode) => mode.value === value)

/** The variant a given mode should ask kr-art-plate to load. */
export const MODE_VARIANT: Record<GalleryMode, ArtVariant> = {
  cards: 'card',
  heroes: 'hero',
  icons: 'icon',
  list: 'card',
}

/**
 * The aspect a frame is drawn at — NOT which image is loaded (that is
 * ArtVariant). `plate` is the 3:2 mockup shape the aesthetic is named for and
 * is kr-art-plate's default; `wide` is 4:3 and is kr-entity-card-body's.
 */
export type ArtPlateShape = 'card' | 'hero' | 'wide' | 'plate'
