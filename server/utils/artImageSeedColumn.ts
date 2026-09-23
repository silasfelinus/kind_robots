// /server/utils/artImageSeedColumn.ts
//
// What ArtImage.seed can hold, now that it is UNSIGNED.
//
// A1111 seeds are unsigned 32-bit (0 .. 4,294,967,295). The column was a
// SIGNED Int, so roughly half of every A1111 image ever made carried a seed it
// could not store -- 908 of the first 2,000 archive files aborted their whole
// insert on it, and after that was made non-fatal, 98-156 of every 250 simply
// lost their seed (art-archive/t-041, 2026-09-23). Live evidence settled the
// range: the largest seeds seen were 4,286,545,361 / 4,263,410,656 /
// 4,253,715,645 -- all just under 2^32, none anywhere near 64-bit. So UNSIGNED
// INT fits the data exactly, and Prisma keeps the TypeScript type as `number`,
// which BigInt would not (seed is read in 911 places).
//
// THE -1 SENTINEL
// ---------------
// The old column defaulted to -1, A1111's "pick a seed for me". An unsigned
// column cannot store that, and `null` already says it better: unknown.
//
// The catch is that -1 is written in ~19 places and MOST OF THEM MUST KEEP
// WRITING IT -- they are ComfyUI/A1111 *request payloads* (server/api/comfy/**,
// artStore's generate body), where -1 genuinely means "randomise". Editing call
// sites one by one would mean deciding, nineteen times, whether each -1 is
// heading for the database or the generator, and being wrong once means a
// runtime insert failure exactly like the one this is fixing.
//
// So the conversion happens at the database boundary instead (the artImage
// write extension in prisma.ts). Generator payloads keep their -1 untouched;
// anything actually being stored is normalised here, whatever produced it, now
// or later.

export const UINT32_MAX = 4_294_967_295

/**
 * The value to store, or null when the column cannot hold it. Never clamped or
 * wrapped: a wrong seed still looks usable and would regenerate the wrong
 * image, which is worse than an absent one.
 */
export function seedColumnOrNull(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (!Number.isInteger(value)) return null
  // -1 ("randomise") and any other negative are not seeds, they are the absence
  // of one.
  if (value < 0 || value > UINT32_MAX) return null
  return value
}

/** True when `data` carries a seed the column would reject as-is. */
export function seedNeedsNormalising(seed: unknown): boolean {
  if (seed === null || seed === undefined) return false
  if (typeof seed !== 'number') return false
  return seedColumnOrNull(seed) === null
}
