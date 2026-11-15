export const ARCADE_BLURB_MAX = 170

export function shortArcadeBlurb(blurb: string): string {
  if (blurb.length <= ARCADE_BLURB_MAX) return blurb
  const prefix = blurb.slice(0, ARCADE_BLURB_MAX - 1)
  const breakAt = prefix.lastIndexOf(' ')
  const end = breakAt > 120 ? breakAt : prefix.length
  return prefix.slice(0, end).trimEnd() + '…'
}
