// /server/utils/signedMediaCapability.ts
//
// One implementation of the signed-media capability, used by every route that
// needs a plain <img> to load bytes it cannot authenticate for.
//
// WHY THIS EXISTS
// ---------------
// Kind Robots authenticates with Authorization/x-api-key headers, and an <img>
// tag cannot send either. Two surfaces hit that same wall within a day of each
// other -- the Gallery rendering archive-backed ArtImages (#3007) and the admin
// archive grid rendering ArchiveEntry thumbnails (#3006) -- and each grew its
// own HMAC sign/verify. Two implementations of one security primitive is twice
// the surface to review and twice the place for a fix to be applied to only
// one of them, so the crypto lives here once.
//
// WHAT IS *NOT* SHARED, DELIBERATELY
// ----------------------------------
// The KEY LABEL. Each capability domain derives its own key from the same
// secret under its own label, so a signature minted for one route cannot be
// replayed against the other even though the algorithm is identical. That
// separation is a security property, not an accident of having two files -- the
// Gallery gate (owner visibility over ArtImage) and the archive gate (admin +
// mature over ArchiveEntry) are different authorizations and must not be
// interchangeable.
//
// The URL shape, the TTL and the authorization gate also stay with their own
// route. This module only answers "is this signature real, unexpired, and for
// exactly these parts".

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Derives a per-domain signing key from the configured secret.
 *
 * The secret is never used raw: learning a signing key must not hand over the
 * admin token it came from. With nothing configured the key is random per
 * process, so links stop working on restart -- fail-safe, not fail-open.
 */
export function deriveMediaSigningKey(label: string): Buffer {
  const base = (
    process.env.ARCHIVE_MEDIA_SECRET ||
    process.env.BETA_ADMIN_TOKEN ||
    process.env.ADMIN_TOKEN ||
    ''
  ).trim()

  return base
    ? createHmac('sha256', label).update(base).digest()
    : randomBytes(32)
}

/** base64url so the signature survives a query string unescaped. */
export function signMediaCapability(key: Buffer, parts: string): string {
  return createHmac('sha256', key).update(parts).digest('base64url')
}

export function verifyMediaCapability(
  key: Buffer,
  parts: string,
  expiresAt: unknown,
  signature: unknown,
  now: number,
  ttlCeilingMs: number,
): boolean {
  const expiry = Number(expiresAt)
  if (!Number.isFinite(expiry) || expiry <= now) return false
  // A caller-chosen expiry is never trusted past the domain's own TTL, so a URL
  // minted with an over-long life by some future code path is still bounded.
  if (expiry - now > ttlCeilingMs) return false
  if (typeof signature !== 'string' || !signature) return false

  const expected = Buffer.from(signMediaCapability(key, parts), 'utf8')
  const provided = Buffer.from(signature, 'utf8')
  // Length is checked first because timingSafeEqual throws on a mismatch, and
  // the throw would itself leak the length.
  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}
