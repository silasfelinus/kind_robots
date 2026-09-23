// /server/utils/artArchiveIntColumns.ts
//
// What an `Int?` column can actually hold.
//
// ArtImage.seed, .cfg and .steps are all `Int?`, which MySQL stores as a signed
// 32-bit INT: max 2,147,483,647. A1111 seeds are UNSIGNED 32-bit, so roughly
// half of every A1111 image ever made carries a seed this column cannot store.
// Writing one aborts the whole insert:
//
//   Value out of range for the type: Out of range value for column 'seed'
//
// which failed 908 of the first 2,000 production files (art-archive/t-041,
// 2026-09-23). The seeds in those filenames -- 3832090215, 4273445571 -- are
// ordinary seeds, not corruption.
//
// The value is DROPPED, never clamped, wrapped or masked. A wrong seed is worse
// than a missing one: it still looks usable and would silently regenerate the
// wrong image. Nothing is truly lost either way, because the file's real
// metadata is stored verbatim on the ArchiveEntry in `extractedMetadata`, so a
// later migration that widens the column can backfill from it.
//
// Kept free of prisma on purpose, so the rule can be tested without a database.

export const INT32_MIN = -2_147_483_648
export const INT32_MAX = 2_147_483_647

export function intColumnOrNull(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (!Number.isInteger(value)) return null
  if (value < INT32_MIN || value > INT32_MAX) return null
  return value
}

/** True when a value was genuinely present but genuinely unusable. */
export function isOutOfRangeNumber(value: unknown): boolean {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    intColumnOrNull(value) === null
  )
}
