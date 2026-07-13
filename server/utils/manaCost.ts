// /server/utils/manaCost.ts

// Rough USD estimates per generation. Refine against real invoices over time.
// These feed usdToMana() in the gate, so they only need to be roughly
// proportional to actual cost — the peg converts to whole mana.
export function estimateArtCostUsd(opts: {
  engine: string // 'a1111' | 'comfy' | 'flux' | 'kontext' | 'openai' | 'charsheet' | 'hunyuan' | 'ltx' | 'wan'
  steps?: number | null
  width?: number | null
  height?: number | null
  frames?: number | null // video engines only
}): number {
  // Hosted API image — fixed per-image ballpark.
  if (opts.engine === 'openai') return 0.04

  // Self-hosted GPU work (your homelab/Comfy): cost is electricity + amortized
  // GPU time, scaled loosely by steps and pixel count.
  const steps = opts.steps ?? 25
  const w = opts.width ?? 1024
  const h = opts.height ?? 1024
  const megapixels = (w * h) / 1_000_000

  // Video (ltx/wan): every frame is roughly a diffusion pass, so bill by frame
  // count × per-frame GPU cost, scaled by resolution. A 6s clip is far heavier
  // than a single still, so it should cost far more mana.
  if (opts.engine === 'ltx' || opts.engine === 'wan') {
    const frames = Math.max(1, opts.frames ?? 120)
    return 0.01 + frames * megapixels * 0.0004 + steps * 0.0002
  }

  // 3D mesh generation is much heavier than a 2D image.
  if (opts.engine === 'hunyuan') {
    return 0.02 + steps * 0.0004 + megapixels * 0.002
  }

  // Base 2D image cost (a1111, comfy, flux, kontext, charsheet).
  return 0.002 + steps * 0.00008 + megapixels * 0.0005
}

export function estimateTextCostUsd(opts: {
  model: string
  maxTokens?: number | null
}): number {
  const m = opts.model.toLowerCase()
  const out = opts.maxTokens ?? 2048

  // Per-output-token USD rates, conservative.
  let rate = 0.0000006 // gpt-4o-mini-ish
  if (m.includes('gpt-4o') && !m.includes('mini')) rate = 0.00001
  if (m.includes('claude') && m.includes('opus')) rate = 0.000075
  if (m.includes('claude') && m.includes('sonnet')) rate = 0.000015
  if (m.includes('claude') && m.includes('haiku')) rate = 0.000004

  return Math.max(0.0005, out * rate)
}
