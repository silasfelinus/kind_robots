// /utils/scripts/verifyArtArchiveSignedMedia.test.ts
//
// A signed URL is a capability, so the ways it must NOT work matter more than
// the way it must. Archive art was invisible because an <img> cannot send the
// header the admin guard reads (art-archive/t-041, 2026-09-23); the fix hands
// the browser a short-lived, narrowly-scoped token instead, and this pins the
// scope.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

process.env.ARCHIVE_MEDIA_SECRET = 'test-secret-for-the-contract'

const {
  archiveMediaQuery,
  archiveMediaUrl,
  resetArchiveMediaKey,
  signArchiveMedia,
  verifyArchiveMedia,
  SIGNED_MEDIA_TTL_MS,
} = await import('../../server/utils/artArchiveSignedMedia')

resetArchiveMediaKey()

const NOW = 1_700_000_000_000
const later = NOW + 60_000

// ---- the happy path ------------------------------------------------------
const sig = signArchiveMedia(42, 'thumbnail', later)
assert.equal(
  verifyArchiveMedia(42, 'thumbnail', later, sig, NOW),
  true,
  'a signature this server minted must verify',
)

// ---- bound to the ENTRY --------------------------------------------------
assert.equal(
  verifyArchiveMedia(43, 'thumbnail', later, sig, NOW),
  false,
  'a signature for entry 42 must not open entry 43',
)

// ---- bound to the VARIANT ------------------------------------------------
// The thumbnail URL is the one embedded everywhere, so it is the one most
// likely to be copied out. It must not also yield the full-resolution file.
assert.equal(
  verifyArchiveMedia(42, 'full', later, sig, NOW),
  false,
  'a thumbnail signature must NOT also fetch the full-size original',
)
assert.equal(
  verifyArchiveMedia(42, 'medium', later, sig, NOW),
  false,
  'a thumbnail signature must not fetch the medium preview either',
)

// ---- bound to the EXPIRY, and actually expires ---------------------------
assert.equal(
  verifyArchiveMedia(42, 'thumbnail', later, sig, later + 1),
  false,
  'a signature must stop working once its expiry passes',
)
assert.equal(
  verifyArchiveMedia(42, 'thumbnail', later + 1, sig, NOW),
  false,
  'moving the expiry out must invalidate the signature, not extend it',
)

// ---- nothing is accepted without a real signature ------------------------
for (const forged of [
  '',
  'x',
  sig.slice(0, -1),
  `${sig}x`,
  sig.toUpperCase(),
]) {
  assert.equal(
    verifyArchiveMedia(42, 'thumbnail', later, forged, NOW),
    false,
    `a forged signature (${JSON.stringify(forged)}) must be refused`,
  )
}
for (const notAString of [null, undefined, 42, {}, []]) {
  assert.equal(
    verifyArchiveMedia(42, 'thumbnail', later, notAString, NOW),
    false,
    'a non-string signature must be refused, not coerced',
  )
}
for (const badExpiry of [null, undefined, 'soon', Number.NaN, Infinity]) {
  assert.equal(
    verifyArchiveMedia(42, 'thumbnail', badExpiry, sig, NOW),
    false,
    'an unusable expiry must be refused, never treated as open-ended',
  )
}

// ---- the key is DERIVED, never the admin token itself --------------------
// Learning the signing key must not hand over the admin credential.
resetArchiveMediaKey()
delete process.env.ARCHIVE_MEDIA_SECRET
process.env.BETA_ADMIN_TOKEN = 'super-secret-admin-token'
const derivedSig = signArchiveMedia(1, 'full', later)
assert.ok(
  !derivedSig.includes('super-secret-admin-token'),
  'the signature must not contain the admin token',
)
assert.notEqual(
  derivedSig,
  signArchiveMedia(1, 'full', later + 1),
  'the signature must actually depend on the expiry',
)

const source = readFileSync('server/utils/artArchiveSignedMedia.ts', 'utf8')
assert.match(
  source,
  /createHmac\('sha256', KEY_LABEL\)\.update\(base\)/,
  'the key must be DERIVED from the admin token under a label, not used raw',
)
assert.match(
  source,
  /timingSafeEqual/,
  'signatures must be compared in constant time',
)
assert.match(
  source,
  /randomBytes\(32\)/,
  'with no secret configured the key must be random (fail-safe), never a ' +
    'constant or empty string (fail-open)',
)

// ---- the minted URL carries what the route reads -------------------------
resetArchiveMediaKey()
process.env.ARCHIVE_MEDIA_SECRET = 'test-secret-for-the-contract'
const url = archiveMediaUrl(7, 'thumbnail', NOW)
assert.match(
  url,
  /^\/api\/admin\/art-archive\/entries\/7\/file\?/,
  'route shape',
)
assert.match(url, /variant=thumbnail/, 'the variant must be in the URL')
assert.match(url, /[?&]exp=\d+/, 'the expiry must be in the URL')
assert.match(url, /[?&]sig=[A-Za-z0-9_-]+/, 'the signature must be in the URL')
assert.ok(
  !/\+|\/|=$/.test(new URL(url, 'http://x').searchParams.get('sig') ?? ''),
  'base64url, so the signature survives a query string unescaped',
)

const query = archiveMediaQuery(7, 'thumbnail', NOW)
const exp = Number(new URLSearchParams(query).get('exp'))
assert.equal(exp, NOW + SIGNED_MEDIA_TTL_MS, 'the TTL must be applied to now')

// ---- the route must actually consult all of it ---------------------------
const route = readFileSync(
  'server/api/admin/art-archive/entries/[id]/file.get.ts',
  'utf8',
)
assert.match(
  route,
  /verifyArchiveMedia\(id, variant, query\.exp, query\.sig\)/,
  'the route must verify the signature against the id AND the variant it is ' +
    'about to serve -- not against whatever the caller claims',
)
assert.match(
  route,
  /requireAdminApiUser\(event\)/,
  'an unsigned request must still fall back to the admin guard',
)

console.log(
  'Art Archive signed-media contract verified: a signature is bound to its ' +
    'entry, its variant and its expiry, expires, refuses forgeries and ' +
    'non-strings in constant time, derives its key from the admin token ' +
    'rather than using it raw, fails safe when unconfigured, and the byte ' +
    'route still falls back to the admin guard when no signature is present.',
)
