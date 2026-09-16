export function loraStackCfgCeiling(
  familyCfg: number,
  recommendedCfgs: Array<number | null | undefined>,
): number {
  const finite = recommendedCfgs.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0,
  )
  return finite.length ? Math.min(familyCfg, ...finite) : familyCfg
}
