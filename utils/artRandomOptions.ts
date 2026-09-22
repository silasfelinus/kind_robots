// /utils/artRandomOptions.ts
//
// Client/server-shared vocabulary for the art generator's "Random batch"
// object choices. LoRA categories and Facet taxonomies already own their own
// canonical lists; this file owns the third source: Kind Robots records.
//
// Keep these tokens source-explicit in the UI. A bare {character} intentionally
// preserves the old fallback order (LoRA -> Facet -> object), while
// {object:character} means exactly what the button says and cannot quietly turn
// into a LoRA when that catalog happens to be populated.

export const ART_RANDOM_OBJECT_TYPES = [
  'character',
  'scenario',
  'reward',
  'dream',
  'bot',
  'project',
] as const

export type ArtRandomObjectType = (typeof ART_RANDOM_OBJECT_TYPES)[number]

export type ArtRandomObjectOption = {
  type: ArtRandomObjectType
  placeholder: string
  label: string
  hint: string
}

export const ART_RANDOM_OBJECT_OPTIONS: readonly ArtRandomObjectOption[] = [
  {
    type: 'character',
    placeholder: 'object:character',
    label: 'Character',
    hint: 'A visible Character, using a compact version of its art prompt.',
  },
  {
    type: 'scenario',
    placeholder: 'object:scenario',
    label: 'Scenario',
    hint: 'A visible Scenario, using a compact version of its art prompt.',
  },
  {
    type: 'reward',
    placeholder: 'object:reward',
    label: 'Reward',
    hint: 'A visible Reward, using a compact version of its art prompt.',
  },
  {
    type: 'dream',
    placeholder: 'object:dream',
    label: 'Dream',
    hint: 'A visible Dream, using a compact version of its art prompt.',
  },
  {
    type: 'bot',
    placeholder: 'object:bot',
    label: 'Bot',
    hint: 'A visible Bot, using a compact version of its art prompt.',
  },
  {
    type: 'project',
    placeholder: 'object:project',
    label: 'Project',
    hint: 'A visible Project, using a compact version of its art prompt.',
  },
]

export function isArtRandomObjectType(
  value: string | null | undefined,
): value is ArtRandomObjectType {
  return ART_RANDOM_OBJECT_TYPES.includes(value as ArtRandomObjectType)
}

/**
 * Turn a potentially essay-sized persisted artPrompt into one useful visual
 * clause for a random image prompt.
 *
 * We deliberately reuse the existing field rather than adding six "short art
 * prompt" columns. Randomization needs enough visual identity to render the
 * object, not the whole object record. 280 characters is roughly a sentence or
 * two and keeps a batch of several random objects from becoming a token vacuum.
 */
export function compactRandomObjectPrompt(
  label: string | null | undefined,
  artPrompt: string | null | undefined,
  maxChars = 280,
): string {
  const cleanLabel = String(label ?? '').replace(/\s+/g, ' ').trim()
  const cleanPrompt = String(artPrompt ?? '').replace(/\s+/g, ' ').trim()
  if (!cleanPrompt) return cleanLabel

  const prefix = cleanLabel ? `${cleanLabel}: ` : ''
  const limit = Math.max(96, Math.trunc(maxChars))
  const promptBudget = Math.max(48, limit - prefix.length)

  let compact = cleanPrompt
  if (compact.length > promptBudget) {
    const candidate = compact.slice(0, promptBudget + 1)
    const sentenceCut = Math.max(
      candidate.lastIndexOf('. '),
      candidate.lastIndexOf('! '),
      candidate.lastIndexOf('? '),
    )
    const wordCut = candidate.lastIndexOf(' ')
    const cut =
      sentenceCut >= Math.floor(promptBudget * 0.55)
        ? sentenceCut + 1
        : wordCut >= Math.floor(promptBudget * 0.7)
          ? wordCut
          : promptBudget
    compact = `${candidate.slice(0, cut).trim().replace(/[,:;\-]+$/, '')}…`
  }

  return `${prefix}${compact}`.slice(0, limit).trim()
}
