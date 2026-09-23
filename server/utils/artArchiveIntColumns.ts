// /server/utils/artArchiveIntColumns.ts
//
// What an `Int?` column can actually hold.
//
// ArtImage.seed, .cfg and .steps are all `Int?`, which MySQL stores as a signed
// 32-bit INT: max 2,147,483,647. Writing a value it cannot hold aborts the whole
// insert:
//
//   Value out of range for the type: Out of range value for column 'seed'
//
// which failed 908 of the first 2,000 production files (art-archive/t-041,
// 2026-09-23). The seeds in those filenames -- 3832090215, 4273445571 -- are
// ordinary seeds, not corruption.
//
// TWO DIFFERENT FAULTS land here and must not be reported as one. A value can be
// unusable because it is too big (an unsigned-32-bit A1111 seed, or a 64-bit
// ComfyUI one) or because it is not a whole number at all (`CFG scale: 7.5`
// parses through parseFloat, and `cfg` is an Int column -- arguably the real bug
// there is the column's type). Calling a fractional CFG "too large" is simply
// false, and a report that says so teaches the reader the wrong thing about
// their own archive. classifyIntColumnValue names which fault occurred.
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

export type IntColumnFault = 'out-of-range' | 'not-an-integer'

/**
 * Why a present value could not be stored, or null when it stores fine or was
 * never there. An absent field is not a loss and never reported as one.
 */
export function classifyIntColumnValue(value: unknown): IntColumnFault | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (!Number.isInteger(value)) return 'not-an-integer'
  if (value < INT32_MIN || value > INT32_MAX) return 'out-of-range'
  return null
}
