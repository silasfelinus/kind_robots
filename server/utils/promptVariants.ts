// /server/utils/promptVariants.ts

export type PromptVariant = {
  variantKey: string
  promptUsed: string
  randomSelections: Record<string, string>
}

export type VariantPoolProvider = (key: string) => string[] | undefined

/**
 * One rolled value, with whatever the caller needs to act on it beyond
 * substituting text.
 *
 * A Facet roll is finished once its title is in the prompt. A LoRA roll is
 * not: the weights have to be attached to the job too, and the text that goes
 * into the prompt is the LoRA's trigger word rather than its name. Carrying
 * that on the pick is what lets one engine serve both without the caller
 * having to re-look-up what it just rolled.
 */
export type VariantPick = {
  /** The text substituted into the prompt. */
  value: string
  /** What produced this pick: 'text', 'facet', 'lora', 'character', ... */
  kind?: string
  /** The record this came from, when it came from one. */
  sourceId?: number
  /** Human-facing name, when `value` is a trigger word nobody would recognise. */
  label?: string
  loraResourceId?: number
  loraStrength?: number
}

export type StructuredVariantPoolProvider = (
  key: string,
) => VariantPick[] | undefined

export type StructuredPromptVariant = {
  variantKey: string
  promptUsed: string
  picks: Record<string, VariantPick>
  /** Every LoRA rolled for this variant, in placeholder order. */
  loraPicks: Array<{ resourceId: number; strength: number }>
  /** Placeholders that matched no pool and were left in the prompt verbatim. */
  unresolvedKeys: string[]
}

const DOUBLE_BRACE_PATTERN = /\{\{\s*([a-zA-Z0-9_:-]+)\s*\}\}/g
// Single-brace placeholders are how Silas actually writes them ("{character}
// running in {style}"). They are opt-in because A1111 prompt syntax uses
// braces for its own dynamic prompts, so a challenge-center prompt containing
// `{a|b}` must not suddenly become a failed placeholder lookup. The inner
// pattern excludes `|` for the same reason.
const SINGLE_BRACE_PATTERN = /\{\s*([a-zA-Z0-9_:-]+)\s*\}/g

export type PlaceholderOptions = {
  /** Also treat `{key}` as a placeholder, not only `{{key}}`. */
  allowSingleBrace?: boolean
}

/** Normalizes a placeholder key or a random-list title for matching: lowercase, letters/digits only. */
export function normalizeVariantKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:]+/g, '')
}

/**
 * Splits an optional `kind:` prefix off a placeholder key.
 *
 * `{style}` means "roll a style from wherever styles come from"; `{lora:style}`
 * means "roll one from the LoRA catalog specifically". The prefix exists
 * because the same word legitimately names two different pools -- there are
 * character LoRAs and there are Character records -- and a caller who knows
 * which one it wants should be able to say so without the resolver guessing.
 */
export function parseVariantKey(value: string): {
  kind: string | null
  key: string
} {
  const normalized = normalizeVariantKey(value)
  const separator = normalized.indexOf(':')
  if (separator <= 0) return { kind: null, key: normalized }
  return {
    kind: normalized.slice(0, separator),
    key: normalized.slice(separator + 1),
  }
}

/** Extracts the distinct placeholder keys from a base prompt, normalized and de-duplicated. */
export function extractPlaceholderKeys(
  basePrompt: string,
  options: PlaceholderOptions = {},
): string[] {
  const keys = new Set<string>()
  for (const match of basePrompt.matchAll(DOUBLE_BRACE_PATTERN)) {
    keys.add(normalizeVariantKey(match[1]!))
  }
  if (options.allowSingleBrace) {
    for (const match of basePrompt.matchAll(SINGLE_BRACE_PATTERN)) {
      keys.add(normalizeVariantKey(match[1]!))
    }
  }
  return [...keys]
}

function defaultPickRandom<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)]!
}

/**
 * Replaces every placeholder the resolver has a value for, in one pass.
 *
 * Matching happens on the NORMALIZED key rather than by rebuilding a regex
 * from it, because the two are not the same string: `{{ Sci-Fi_Weapons }}`
 * normalizes to `scifiweapons`, and a regex built from the normalized form
 * matches nothing in the original prompt. Rebuilding the pattern left that
 * placeholder rolled but never substituted -- silently emitting the literal
 * `{{ Sci-Fi_Weapons }}` to the renderer.
 */
function substituteAll(
  prompt: string,
  resolve: (normalizedKey: string) => string | undefined,
  options: PlaceholderOptions,
): string {
  const replaceIn = (text: string, pattern: RegExp): string =>
    text.replace(pattern, (whole, raw: string) => {
      const value = resolve(normalizeVariantKey(raw))
      return value === undefined ? whole : value
    })

  const substituted = replaceIn(prompt, DOUBLE_BRACE_PATTERN)
  return options.allowSingleBrace
    ? replaceIn(substituted, SINGLE_BRACE_PATTERN)
    : substituted
}

/**
 * A small seeded generator, so a batch can be replayed exactly.
 *
 * "Ten different characters" is a claim someone will eventually want to check,
 * and an unrecorded Math.random() roll cannot be checked at all. The algorithm
 * is mulberry32 -- not cryptographic, and it does not need to be; it needs to
 * be the same sequence on two machines given the same seed.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Deals `count` values from `pool` WITHOUT replacement, reshuffling once the
 * pool is exhausted.
 *
 * This is the difference between what Silas asked for and what a naive
 * implementation gives him. Rolling each of ten variants independently from a
 * twelve-LoRA pool repeats a value more often than not (~65% of the time), so
 * "ten different characters" quietly becomes "ten characters, some of them
 * twice". Dealing instead guarantees distinctness up to the pool size, and
 * degrades to even cycling past it rather than to clumping.
 */
export function dealWithoutReplacement<T>(
  pool: T[],
  count: number,
  random: () => number,
): T[] {
  const dealt: T[] = []
  let remaining: T[] = []

  for (let i = 0; i < count; i++) {
    if (!remaining.length) {
      remaining = [...pool]
      for (let j = remaining.length - 1; j > 0; j--) {
        const k = Math.floor(random() * (j + 1))
        ;[remaining[j], remaining[k]] = [remaining[k]!, remaining[j]!]
      }
    }
    dealt.push(remaining.pop()!)
  }

  return dealt
}

export type VariantDealer = (
  pool: VariantPick[],
  count: number,
  random: () => number,
) => VariantPick[]

export type StructuredVariantOptions = PlaceholderOptions & {
  /** Leave a placeholder with no pool in the prompt instead of throwing. */
  lenient?: boolean
  /** Replay seed. Omit for a fresh roll. */
  seed?: number
  /**
   * How one placeholder's `count` values are chosen. Defaults to dealing
   * without replacement; the challenge center passes its own independent-roll
   * dealer so its long-standing behaviour and its injected `pickRandom` hook
   * survive this file becoming shared.
   */
  deal?: VariantDealer
}

/**
 * Rolls `count` concrete variants of a base prompt, dealing each placeholder's
 * pool without replacement so a batch varies instead of repeating.
 */
export function generateStructuredPromptVariants(
  basePrompt: string,
  count: number,
  getPool: StructuredVariantPoolProvider,
  options: StructuredVariantOptions = {},
): StructuredPromptVariant[] {
  const trimmed = basePrompt.trim()
  if (!trimmed) {
    throw new Error('basePrompt must be a non-empty string.')
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('count must be a positive integer.')
  }

  const keys = extractPlaceholderKeys(trimmed, options)
  if (keys.length === 0 && !options.lenient) {
    throw new Error('basePrompt must contain at least one {{placeholder}}.')
  }

  const random =
    typeof options.seed === 'number' ? seededRandom(options.seed) : Math.random

  const deals = new Map<string, VariantPick[]>()
  const unresolvedKeys: string[] = []

  for (const key of keys) {
    const pool = getPool(key)
    if (!pool || pool.length === 0) {
      if (!options.lenient) {
        throw new Error(`No random pool found for placeholder "${key}".`)
      }
      unresolvedKeys.push(key)
      continue
    }
    deals.set(
      key,
      (options.deal ?? dealWithoutReplacement)(pool, count, random),
    )
  }

  const variants: StructuredPromptVariant[] = []
  for (let i = 0; i < count; i++) {
    const picks: Record<string, VariantPick> = {}
    const loraPicks: Array<{ resourceId: number; strength: number }> = []

    for (const key of keys) {
      const pick = deals.get(key)?.[i]
      if (!pick) continue
      picks[key] = pick
      if (typeof pick.loraResourceId === 'number') {
        loraPicks.push({
          resourceId: pick.loraResourceId,
          strength: pick.loraStrength ?? 1,
        })
      }
    }

    const promptUsed = substituteAll(
      trimmed,
      (normalizedKey) => picks[normalizedKey]?.value,
      options,
    )

    variants.push({
      variantKey: `random-${i + 1}`,
      promptUsed,
      picks,
      loraPicks,
      unresolvedKeys: [...unresolvedKeys],
    })
  }

  return variants
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
  const deal: VariantDealer = (pool, dealCount) =>
    Array.from({ length: dealCount }, () => {
      const value = pickRandom(pool.map((pick) => pick.value))
      return pool.find((pick) => pick.value === value) ?? { value }
    })

  return generateStructuredPromptVariants(
    basePrompt,
    count,
    (key) => getPool(key)?.map((value) => ({ value, kind: 'text' })),
    { deal },
  ).map((variant) => ({
    variantKey: variant.variantKey,
    promptUsed: variant.promptUsed,
    randomSelections: Object.fromEntries(
      Object.entries(variant.picks).map(([key, pick]) => [key, pick.value]),
    ),
  }))
}
