export function loraStackCfgCeiling(
  familyCfg: number,
  recommendedCfgs: Array<number | null | undefined>,
): number {
  const finite = recommendedCfgs.filter(
    (value): value is number =>
      typeof value === 'number' && Number.isFinite(value) && value > 0,
  )
  return finite.length ? Math.min(familyCfg, ...finite) : familyCfg
}

export const PONY_CFG_CLIPPING_CURVE = [
  { cfg: 3, clippedFraction: 0.0011 },
  { cfg: 7, clippedFraction: 0.0203 },
  { cfg: 9, clippedFraction: 0.0343 },
  { cfg: 10, clippedFraction: 0.0348 },
  { cfg: 11, clippedFraction: 0.0487 },
  { cfg: 13, clippedFraction: 0.0539 },
] as const

export function ponyCfgFromClipping(clippedFraction: number): number | null {
  if (!Number.isFinite(clippedFraction) || clippedFraction < 0) return null

  const first = PONY_CFG_CLIPPING_CURVE[0]
  const last = PONY_CFG_CLIPPING_CURVE[PONY_CFG_CLIPPING_CURVE.length - 1]
  if (clippedFraction <= first.clippedFraction) return first.cfg
  if (clippedFraction >= last.clippedFraction) return last.cfg

  for (let index = 1; index < PONY_CFG_CLIPPING_CURVE.length; index += 1) {
    const upper = PONY_CFG_CLIPPING_CURVE[index]
    const lower = PONY_CFG_CLIPPING_CURVE[index - 1]
    if (clippedFraction > upper.clippedFraction) continue

    const fraction =
      (clippedFraction - lower.clippedFraction) /
      (upper.clippedFraction - lower.clippedFraction)
    return lower.cfg + fraction * (upper.cfg - lower.cfg)
  }

  return last.cfg
}
