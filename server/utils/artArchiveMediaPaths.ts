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
// the web root, which is the whole point of a private archive. So instead of
// copying 349GB into public space, the row is handed a short-lived signed URL
// to the admin byte route (artArchiveSignedMedia.ts).
//
// THE GATE
// --------
// A signed URL is a capability: minting one for a caller who could not
// otherwise read the file would be an escalation dressed up as a convenience.
// So this only ever runs for a viewer who already passes admin + mature, and
// every other caller keeps the unusable raw path they get today. Failing that
// check leaves art invisible, which is the correct direction to fail.

import prisma from './prisma'
import { archiveMediaUrl } from './artArchiveSignedMedia'

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
 * Fills `imagePath` with a signed archive URL for any archive-backed row in
 * `rows`, in one query regardless of how many rows there are. Mutates and
 * returns the same rows, so callers can drop it in front of their response
 * without reshaping anything.
 */
export async function attachArchiveMediaPaths<T extends ArchiveBackedRow>(
  rows: T[],
  viewer: { isAdmin: boolean; showMature: boolean },
): Promise<T[]> {
  if (!viewer.isAdmin || !viewer.showMature) return rows

  const pending = rows.filter(needsArchiveUrl)
  if (!pending.length) return rows

  const entries = await prisma.archiveEntry.findMany({
    where: { artImageId: { in: pending.map((row) => row.id as number) } },
    select: { id: true, artImageId: true },
  })

  const entryByImageId = new Map<number, number>()
  for (const entry of entries) {
    if (entry.artImageId) entryByImageId.set(entry.artImageId, entry.id)
  }

  for (const row of pending) {
    const entryId = entryByImageId.get(row.id as number)
    // The medium preview, not the original: these render in cards and panels,
    // and a 349GB archive should not ship full-resolution PNGs to do it.
    if (entryId) row.imagePath = archiveMediaUrl(entryId, 'medium')
  }

  return rows
}
