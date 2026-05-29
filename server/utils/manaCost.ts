// /server/utils/manaCost.ts

// Rough USD estimates. Refine against real invoices over time.
export function estimateArtCostUsd(opts: {
  engine: string // 'openai' | 'comfy' | 'flux' | 'a1111' | 'kontext'
  steps?: number | null
  width?: number | null
  height?: number | null
}): number {
  if (opts.engine === 'openai') return 0.04 // gpt-image, per image ballpark
  // Self-hosted comfy/flux/a1111: electricity + amortized GPU. Token-cheap.
  const steps = opts.steps ?? 25
  return 0.002 + steps * 0.00008
}

export function estimateTextCostUsd(opts: {
  model: string
  maxTokens?: number | null
}): number {
  const m = opts.model.toLowerCase()
  const out = opts.maxTokens ?? 2048
  // per-token output rates (USD), conservative
  let rate = 0.0000006 // gpt-4o-mini-ish
  if (m.includes('gpt-4o') && !m.includes('mini')) rate = 0.00001
  if (m.includes('claude') && m.includes('opus')) rate = 0.000075
  if (m.includes('claude') && m.includes('sonnet')) rate = 0.000015
  if (m.includes('claude') && m.includes('haiku')) rate = 0.000004
  return Math.max(0.0005, out * rate)
}
