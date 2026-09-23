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
// Derived under THIS domain's own label by signedMediaCapability.ts, which also
// holds the HMAC shared with the Gallery's archive route (#3007). The labels
// differ on purpose: the Gallery gate is owner visibility over an ArtImage,
// this one is admin + mature over an ArchiveEntry, and a signature for one must
// not be replayable against the other.

import {
  deriveMediaSigningKey,
  signMediaCapability,
  verifyMediaCapability,
} from './signedMediaCapability'

/** Long enough to browse a session, short enough that a copied URL rots. */
export const SIGNED_MEDIA_TTL_MS = 6 * 60 * 60 * 1000

const KEY_LABEL = 'kind-robots/art-archive-media/v1'

let cachedKey: Buffer | null = null

function signingKey(): Buffer {
  if (!cachedKey) cachedKey = deriveMediaSigningKey(KEY_LABEL)
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
  return signMediaCapability(signingKey(), `${entryId}:${variant}:${expiresAt}`)
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
  return verifyMediaCapability(
    signingKey(),
    `${entryId}:${variant}:${Number(expiresAt)}`,
    expiresAt,
    signature,
    now,
    SIGNED_MEDIA_TTL_MS,
  )
}
