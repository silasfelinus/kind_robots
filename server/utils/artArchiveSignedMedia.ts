// /server/utils/artArchiveSignedMedia.ts
//
// Letting a plain <img> load private archive bytes.
//
// THE PROBLEM
// -----------
// Archive files are served only by entries/[id]/file.get.ts, which is gated by
// requireAdminApiUser -- and getOptionalApiUser reads ONLY the `authorization`
// and `x-api-key` headers. An <img> tag cannot send either: it sends cookies,
// which that guard never looks at. So every archive thumbnail bound into the
// grid was a guaranteed 401 ("Invalid or expired token." in the container log),
// the card's load handler fired, and the UI fell back to backtree.webp. Art
// that had imported perfectly was invisible (art-archive/t-041, 2026-09-23).
//
// THE FIX
// -------
// The URL carries its own short-lived capability. An already-authenticated
// admin asks the entries API for a listing; the API mints a signature for each
// image it is about to reference, and the browser then loads that URL with no
// credentials of its own. The guard is untouched, ordinary browser caching
// still works, and a URL that escapes stops working on its own.
//
// WHAT THE SIGNATURE BINDS
// ------------------------
// The entry id AND the variant AND the expiry, all three. Binding the variant
// matters: without it a thumbnail URL -- the cheap, widely-embedded one -- would
// also fetch the full-resolution original, which is not what handing someone a
// thumbnail link is understood to grant.
//
// THE KEY
// -------
// Derived, never used raw. ARCHIVE_MEDIA_SECRET if set; otherwise derived from
// the admin token via HMAC under a fixed label, so the signing key is not the
// admin credential itself and learning one does not hand over the other. With
// neither configured the key is random per process, which is fail-safe rather
// than fail-open: links simply stop working when the app restarts.

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/** Long enough to browse a session, short enough that a copied URL rots. */
export const SIGNED_MEDIA_TTL_MS = 6 * 60 * 60 * 1000

const KEY_LABEL = 'kind-robots/art-archive-media/v1'

let cachedKey: Buffer | null = null

function signingKey(): Buffer {
  if (cachedKey) return cachedKey
  const base = (
    process.env.ARCHIVE_MEDIA_SECRET ||
    process.env.BETA_ADMIN_TOKEN ||
    process.env.ADMIN_TOKEN ||
    ''
  ).trim()
  cachedKey = base
    ? createHmac('sha256', KEY_LABEL).update(base).digest()
    : randomBytes(32)
  return cachedKey
}

/** Test seam: forget a key derived from a since-changed environment. */
export function resetArchiveMediaKey(): void {
  cachedKey = null
}

export type ArchiveMediaVariant = 'full' | 'thumbnail' | 'medium'

export function signArchiveMedia(
  entryId: number,
  variant: ArchiveMediaVariant,
  expiresAt: number,
): string {
  return createHmac('sha256', signingKey())
    .update(`${entryId}:${variant}:${expiresAt}`)
    .digest('base64url')
}

/** The `?exp=&sig=` a freshly-minted URL carries. */
export function archiveMediaQuery(
  entryId: number,
  variant: ArchiveMediaVariant,
  now: number = Date.now(),
): string {
  const expiresAt = now + SIGNED_MEDIA_TTL_MS
  const signature = signArchiveMedia(entryId, variant, expiresAt)
  return `exp=${expiresAt}&sig=${signature}`
}

/** A ready-to-embed URL for one entry and variant. */
export function archiveMediaUrl(
  entryId: number,
  variant: ArchiveMediaVariant,
  now: number = Date.now(),
): string {
  const base = `/api/admin/art-archive/entries/${entryId}/file`
  const query = archiveMediaQuery(entryId, variant, now)
  return variant === 'full'
    ? `${base}?${query}`
    : `${base}?variant=${variant}&${query}`
}

export function verifyArchiveMedia(
  entryId: number,
  variant: ArchiveMediaVariant,
  expiresAt: unknown,
  signature: unknown,
  now: number = Date.now(),
): boolean {
  const expiry = Number(expiresAt)
  if (!Number.isFinite(expiry) || expiry <= now) return false
  if (typeof signature !== 'string' || !signature) return false

  const expected = Buffer.from(
    signArchiveMedia(entryId, variant, expiry),
    'utf8',
  )
  const provided = Buffer.from(signature, 'utf8')
  // Compared in constant time, and only once the lengths match -- timingSafeEqual
  // throws on a length mismatch, which would itself leak the length.
  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}
