// /server/utils/promptVariants.ts

export type PromptVariant = {
  variantKey: string
  promptUsed: string
  randomSelections: Record<string, string>
}

export type VariantPoolProvider = (key: string) => string[] | undefined

const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g

/** Normalizes a placeholder key or a random-list title for matching: lowercase, letters/digits only. */
export function normalizeVariantKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

/** Extracts the distinct `{{key}}` placeholder keys from a base prompt, normalized and de-duplicated. */
export function extractPlaceholderKeys(basePrompt: string): string[] {
  const keys = new Set<string>()
  for (const match of basePrompt.matchAll(PLACEHOLDER_PATTERN)) {
    keys.add(normalizeVariantKey(match[1]!))
  }
  return [...keys]
}

function defaultPickRandom(values: string[]): string {
  return values[Math.floor(Math.random() * values.length)]!
}

function substitutePlaceholder(
  prompt: string,
  key: string,
  value: string,
): string {
  const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi')
  return prompt.replace(pattern, value)
}

/**
 * Generates `count` concrete prompt variants from a base prompt containing `{{key}}`
 * placeholders, substituting each occurrence from the pool `getPool(key)` returns.
 * Every variant records its `randomSelections` map so the roll is auditable and
 * reproducible, not a mystery substitution (challenge-center/t-014).
 */
export function generatePromptVariants(
  basePrompt: string,
  count: number,
  getPool: VariantPoolProvider,
  pickRandom: (values: string[]) => string = defaultPickRandom,
): PromptVariant[] {
  const trimmed = basePrompt.trim()
  if (!trimmed) {
    throw new Error('basePrompt must be a non-empty string.')
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('count must be a positive integer.')
  }

  const keys = extractPlaceholderKeys(trimmed)
  if (keys.length === 0) {
    throw new Error('basePrompt must contain at least one {{placeholder}}.')
  }

  const pools = new Map<string, string[]>()
  for (const key of keys) {
    const values = getPool(key)
    if (!values || values.length === 0) {
      throw new Error(`No random pool found for placeholder "${key}".`)
    }
    pools.set(key, values)
  }

  const variants: PromptVariant[] = []
  for (let i = 1; i <= count; i++) {
    const randomSelections: Record<string, string> = {}
    let promptUsed = trimmed
    for (const key of keys) {
      const value = pickRandom(pools.get(key)!)
      randomSelections[key] = value
      promptUsed = substitutePlaceholder(promptUsed, key, value)
    }
    variants.push({ variantKey: `random-${i}`, promptUsed, randomSelections })
  }

  return variants
}
