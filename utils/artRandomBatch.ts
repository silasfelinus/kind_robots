// /utils/artRandomBatch.ts
//
// The wire shape of a randomized art batch, shared by the endpoint that rolls
// it and the store that spends it. The ceiling lives here rather than in the
// route so the UI cannot offer a batch the server will refuse.

import type { LoraCategory } from '@/utils/loraCategory'

export const MAX_RANDOM_BATCH = 25

export type ArtRandomSource = 'lora' | 'facet' | 'object'

export type ArtRandomPick = {
  value: string
  kind?: string
  sourceId?: number
  label?: string
  loraResourceId?: number
  loraStrength?: number
}

export type ArtRandomPoolReport = {
  key: string
  source: ArtRandomSource | null
  /** The LoRA category or Facet taxonomy this key resolved to. */
  bucket: string | null
  size: number
}

export type ArtRandomVariant = {
  variantKey: string
  promptString: string
  loraResourceIds: number[]
  loras: Array<{ resourceId: number; strength: number }>
  selections: Record<string, ArtRandomPick>
  /** Placeholders with no pool behind them, left in the prompt as written. */
  unresolvedKeys: string[]
}

export type ArtRandomBatchPlan = {
  seed: number
  engine: string
  /** False on a lane that cannot load LoRAs, so no LoRA pool was consulted. */
  supportsLora: boolean
  checkpointFamily: string
  placeholders: string[]
  pools: ArtRandomPoolReport[]
  known: Array<{ placeholder: string; source: ArtRandomSource; hint: string }>
  variants: ArtRandomVariant[]
}

export type ArtRandomBatchResult = {
  success: boolean
  message: string
  jobIds: number[]
  plan?: ArtRandomBatchPlan
}

/**
 * The pools a batch asked for but could not fill.
 *
 * An empty pool is the expected failure here, not an exotic one: a category
 * nobody has classified any LoRA into yet resolves to nothing, and the prompt
 * comes back with `{clothing}` still in it. Naming those keys is the whole
 * difference between "the randomizer is broken" and "go classify some
 * clothing LoRAs".
 */
export function emptyRandomPools(
  plan: Pick<ArtRandomBatchPlan, 'pools'>,
): ArtRandomPoolReport[] {
  return plan.pools.filter((pool) => pool.size === 0)
}

export type { LoraCategory }
