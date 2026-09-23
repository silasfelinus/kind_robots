// /server/utils/artArchiveMediaPaths.ts
//
// Making an archive-backed ArtImage renderable on the ordinary art surfaces.
//
// An archive import writes ArtImage.path = the file's path RELATIVE TO THE
// PRIVATE ARCHIVE ROOT, e.g. `art_gallery/cafe_fred/....png`. That is not a
// URL. The gallery card resolves a row's src straight from that field
// (image-card.vue createImagePathUrl), so it built a link to a file the web
// server has never served, the load failed, and the card swapped in
// backtree.webp -- the rainbow-bush placeholder Silas kept seeing in place of
// his art (art-archive/t-041, 2026-09-23).
//
// Generated art does not hit this because its bytes are written into the
// public media root and served at /images/... with no auth at all
// (artImageOffload.ts). Archive bytes deliberately are not: they stay outside
// the web root, which is the whole point of a private archive.
//
// #3007 already built the answer for the Gallery: /api/art/image/archive/:id,
// reached by a short-lived signed URL. This reuses it rather than adding a
// second way in -- /api/art/image and /api/art/image/:id were simply never
// wired to it, which is why the Selected Image panel still showed the
// placeholder after the collection endpoints were fixed.
//
// THE GATE
// --------
// A signed URL is a capability, so it is only minted for a row the caller has
// already been allowed to see. Both callers establish that before reaching
// here -- the list endpoint through buildArtImageWhere(), the detail endpoint
// through canReadArtImage() -- which is the same gate the byte route itself
// falls back to when no signature is presented. Nothing is widened by handing
// the browser a URL for a row it was already served.

import { galleryArchiveMediaUrl } from './artGalleryArchiveMedia'

type ArchiveBackedRow = {
  id?: number | null
  path?: string | null
  imagePath?: string | null
  imageData?: string | null
  designer?: string | null
}

/** What the importer stamps on every row it creates. */
const ARCHIVE_DESIGNER = 'art-archive'

function needsArchiveUrl(row: ArchiveBackedRow): boolean {
  if (!row || typeof row.id !== 'number') return false
  // A row that already has a real URL or inline bytes renders fine as-is.
  if (row.imagePath?.trim()) return false
  if (row.imageData?.trim()) return false
  if (!row.path?.trim()) return false
  return row.designer === ARCHIVE_DESIGNER
}

/**
 * Fills `imagePath` with a signed archive URL for any archive-backed row.
 * Mutates and returns the same rows, so callers can drop it in front of their
 * response without reshaping anything. No query: the URL is keyed on the
 * ArtImage id the caller already holds.
 */
export function attachArchiveMediaPaths<T extends ArchiveBackedRow>(
  rows: T[],
): T[] {
  for (const row of rows) {
    if (!needsArchiveUrl(row)) continue
    // The medium preview, not the original: these render in cards and panels,
    // and a 349GB archive should not ship full-resolution PNGs to do it.
    row.imagePath = galleryArchiveMediaUrl(row.id as number, 'medium')
  }
  return rows
}
