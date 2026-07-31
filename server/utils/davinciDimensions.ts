// /server/utils/davinciDimensions.ts
//
// The ten Da Vinci life dimensions and the pure outcome math over them.
//
// Split out of server/utils/davinci.ts so callers that need the vocabulary but
// not the database can import it without pulling in `./prisma` — which throws
// at module load when DATABASE_URL is unset, as it is in the contract-tests
// job. davinci.ts re-exports everything here, so existing importers are
// unaffected.
//
// Bit order matches conductor's projects/davinci/data/ending-dimensions.yaml
// and scripts/generate_davinci_endings.py: outcomeKey[i] is DIMENSIONS[i],
// '1' = pass. Do not reorder without migrating the seeded endings.

export const DAVINCI_DIMENSIONS = [
  'legacy',
  'wealth',
  'love',
  'wisdom',
  'health',
  'freedom',
  'fame',
  'creation',
  'community',
  'mystery',
] as const

export type DaVinciDimension = (typeof DAVINCI_DIMENSIONS)[number]

// A dimension passes when its stat value meets this threshold
// (ending-dimensions.yaml threshold.default_pass_value). Missing stats fail.
export const DAVINCI_PASS_VALUE = 1

export function resolveOutcomeKey(
  stats: Partial<Record<string, number>>,
  passValue: number = DAVINCI_PASS_VALUE,
): string {
  return DAVINCI_DIMENSIONS.map((key) =>
    (stats[key] ?? 0) >= passValue ? '1' : '0',
  ).join('')
}
