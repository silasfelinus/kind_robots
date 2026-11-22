/**
 * Visual identity audit of actual committed WebP bytes, not ledger statuses.
 * Each sha is the source GitHub blob verified by fetching the image itself,
 * then comparing the painted subject against identityArcs.json.
 *
 * These candidates are quarantined from in-game identity displays, not
 * deleted, renamed, or incorrectly declared as ArtJob failures.
 * Review is limited to canon identity; replacements still need real art QA.
 */
export const REJECTED_IDENTITY_ART = {
  'identities/tech-genius/outcomes/hero': {
    blobSha: 'c0127590f91babf7cec1debcf4b80126ca211cb6',
    reason:
      'Paints a black-haired girl in a purple hoodie, not Lionel Marsh in green frog leap gear.',
  },
  'identities/tech-genius/outcomes/villain': {
    blobSha: 'bdbd7139bada08fb991807fc518feb880e2f0dae',
    reason:
      'Paints the same girl with a cable suit, not the canonical transformed Dr. Frog.',
  },
  'identities/tech-genius/outcomes/betrayal': {
    blobSha: 'c1820265fbcaccf9a97992c94bbdd2ee01ca1e83',
    reason: 'Paints the same girl with a purple hoodie, not Lionel Marsh.',
  },
  'identities/tech-genius/outcomes/partner': {
    blobSha: '86f47aea2dc1be92444dbd48614bba5f29bbd3d9',
    reason: 'Paints the same girl in a family scene, not Lionel Marsh.',
  },
  'identities/alien-discipline/outcomes/hero': {
    blobSha: '790ed54d4bf1300af1334a616685d9ed9ce7b2ff',
    reason:
      'Two human-sized armored reptilian figures, not Zuzu the short koala assassin.',
  },
  'identities/alien-discipline/outcomes/villain': {
    blobSha: 'e6eb9815caf8e9b117d9acd84c06a5907330aa7b',
    reason: 'Tall green reptilian commander, not the koala assassin Zuzu.',
  },
  'identities/magic-earth/outcomes/hero': {
    blobSha: '9e0b1de1d8a1faae9ecc837cdc69b66c5412511d',
    reason:
      'Shows a child with a leafy mantle, not the canonical elderly Mavis Mayhew / Granny Mayhem; the verified student painting depicts her correct age and magic bus.',
  },
  'identities/magic-earth/outcomes/villain': {
    blobSha: '51de02cf69ae90da0bbc6f61524a61c1bd33de03',
    reason:
      'Shows the same child leading walking trees, not the elderly Mavis Mayhew who knits entire city blocks into a monstrous quilt.',
  },
  'identities/mutant-discipline/outcomes/hero': {
    blobSha: '9fe7f31615b0106d2e9afc46a00ce2f2e4763b54',
    reason:
      'Depicts Asha Venkataraman as an ordinary two-armed dancer, losing her defining natural four-arm mutation; the verified student portrait has all four arms.',
  },
  'identities/mutant-earth/student': {
    blobSha: 'ddc43298b2f6b2a515bcd13815034558b3493f2e',
    reason:
      'Class photo centers a normal-height male student, not Hattie Nkemelu with mineral-plated skin.',
  },
  'identities/mutant-earth/outcomes/hero': {
    blobSha: 'e4b50e4ad270ab3a6b1922bbd0f3780d620c70db',
    reason: 'Public celebration centers an adult male, not Hattie Nkemelu.',
  },
  'identities/mutant-earth/outcomes/villain': {
    blobSha: 'ea9abc0e9af77cd8877c60b4ac83020f8fc9df92',
    reason: 'Dark-armored male figure rather than Hattie Nkemelu.',
  },
} as const satisfies Record<string, { blobSha: string; reason: string }>

export function isRejectedIdentityArt(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(REJECTED_IDENTITY_ART, key)
}

/** A reviewed candidate may still be a shipped file but is not usable canon art. */
export const usableIdentityArtKey = (key: string): string | null =>
  isRejectedIdentityArt(key) ? null : key

/**
 * The correct, existing student illustrations for Lionel Marsh and Zuzu
 * and Mavis Mayhew are preferable to wrong-person hero/villain outcome paintings.\n * The existing four-armed Asha and library-student Mei Lin paintings similarly\n * supply canon-safe fallbacks instead of noncanonical or absent outcome art.
 * Never create a fabricated new canonical identity or alter save keys.
 */
export const CANON_STUDENT_FALLBACK = new Set<string>([
  'tech-genius',
  'alien-discipline',
  'magic-earth',
  'mutant-discipline',
  'psychic-discipline',
])
