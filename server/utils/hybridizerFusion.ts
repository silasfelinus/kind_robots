import { createHash } from 'node:crypto'
import catalog from '../../utils/hybridizer/starterCatalog.json'

export const HYBRIDIZER_RECIPE_VERSION = 'v1'
export const HYBRIDIZER_MAX_DEPTH = 4
const starterByKey = new Map(catalog.entries.map((entry) => [entry.key, entry]))
const FUSION_ID_PATTERN = /^fusion:([a-f0-9]{64})$/

export function normalizedIngredientKey(value: unknown): string {
  if (typeof value !== 'string')
    throw new Error('Invalid Hybridizer ingredient.')
  const key = value.trim()
  if (key.startsWith('starter:') && starterByKey.has(key.slice(8))) return key
  if (starterByKey.has(key)) return 'starter:' + key
  if (FUSION_ID_PATTERN.test(key)) return key
  throw new Error('Unknown Hybridizer ingredient.')
}

export function starterForIdentity(key: string) {
  return key.startsWith('starter:')
    ? (starterByKey.get(key.slice(8)) ?? null)
    : null
}

export function fusionIdForIdentity(key: string): string | null {
  return FUSION_ID_PATTERN.exec(key)?.[1] ?? null
}

export function canonicalFusionPair(first: string, second: string) {
  const left = normalizedIngredientKey(first)
  const right = normalizedIngredientKey(second)
  if (left === right) throw new Error('Choose two different ingredients.')
  const leftKey = left < right ? left : right
  const rightKey = left < right ? right : left
  const id = createHash('sha256')
    .update(
      JSON.stringify([
        'hybridizer',
        HYBRIDIZER_RECIPE_VERSION,
        leftKey,
        rightKey,
      ]),
    )
    .digest('hex')
  return { id, leftKey, rightKey, recipeVersion: HYBRIDIZER_RECIPE_VERSION }
}

export function fusionDisplayTitle(left: string, right: string): string {
  const names = [left, right]
  if (names.includes('Banana') && names.includes('Cat')) return 'Bananacat'
  if (names.includes('Vampire') && names.includes('Bananacat'))
    return 'Vampire Bananacat'
  return names.sort((a, b) => a.localeCompare(b)).join('–') + ' Hybrid'
}

export function clientIngredientKey(key: string): string {
  return key.startsWith('starter:') ? key.slice(8) : key
}
