/** Dimensions of the twelve authenticated, byte-verified crew telegraphs.
 * Source: Conductor ONE-HIT-CREW-TELEGRAPHS-2026-11-20.yaml.
 * Matching dimensions are a technical check, not artistic approval.
 */
export const CREW_TELEGRAPH_MEDIA_DIMENSIONS: Readonly<
  Record<number, readonly [number, number]>
> = {
  277786: [768, 768],
  277787: [1344, 768],
  277788: [1344, 768],
  277789: [768, 1024],
  277790: [768, 768],
  277791: [1344, 768],
  277792: [1344, 768],
  277793: [768, 1024],
  277794: [768, 768],
  277795: [1344, 768],
  277796: [1344, 768],
  277797: [768, 1024],
}

export function matchesCrewTelegraphDimensions(
  imageId: number,
  width: number,
  height: number,
): boolean {
  const expected = CREW_TELEGRAPH_MEDIA_DIMENSIONS[imageId]
  return !expected || (width === expected[0] && height === expected[1])
}
