// /utils/wonderlab/reviewerAffinity.ts
export type WonderLabReviewerKind = 'BOT' | 'CHARACTER'

export type WonderLabReviewerCandidate = {
  id: number
  kind: WonderLabReviewerKind
  name: string
  slug?: string | null
  subtitle?: string | null
  description?: string | null
  personality?: string | null
  voice?: string | null
  sampleResponse?: string | null
  prompt?: string | null
  modules?: string | null
  tags?: string[] | null
  isActive?: boolean | null
  isPublic?: boolean | null
  isMature?: boolean | null
}

export type WonderLabExhibitProfile = {
  id: number
  componentName: string
  folderName: string
  sourcePath?: string | null
  title?: string | null
  description?: string | null
  notes?: string | null
  category?: string | null
  tags?: string[] | null
}

export type WonderLabReviewerOverride = {
  reviewerKey: string
  excluded?: boolean
  boost?: number
  reason?: string
}

export type WonderLabReviewerAffinity = {
  reviewer: WonderLabReviewerCandidate
  reviewerKey: string
  score: number
  voiceReady: boolean
  reasons: string[]
}

export type RankWonderLabReviewersOptions = {
  limit?: number
  includeMature?: boolean
  includeInactive?: boolean
  requirePublic?: boolean
  minimumScore?: number
  overrides?: WonderLabReviewerOverride[]
}

const DEFAULT_LIMIT = 6
const DEFAULT_MINIMUM_SCORE = 1

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'component',
  'components',
  'for',
  'from',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'the',
  'this',
  'to',
  'with',
])

const DOTTI_NAMES = new Set(['dotti', 'dottib0t', 'dottibot'])
const CATBOT_NAMES = new Set(['catbot', 'cat-bot', 'cat bot'])

const DOTTI_COMPONENT_TERMS = new Set([
  'agent',
  'bot',
  'bots',
  'builder',
  'chatbot',
  'manager',
  'model',
  'narrator',
  'persona',
  'prompt',
  'robot',
  'thread',
])

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function reviewerNameKey(candidate: WonderLabReviewerCandidate): string {
  return normalize(candidate.slug || candidate.name)
}

export function wonderLabReviewerKey(
  candidate: Pick<WonderLabReviewerCandidate, 'id' | 'kind' | 'name' | 'slug'>,
): string {
  return `${candidate.kind.toLowerCase()}:${reviewerNameKey(candidate)}:${candidate.id}`
}

function textParts(values: Array<string | null | undefined>): string {
  return values.filter((value): value is string => Boolean(value?.trim())).join(' ')
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split('-')
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  )
}

function candidateText(candidate: WonderLabReviewerCandidate): string {
  return textParts([
    candidate.name,
    candidate.slug,
    candidate.subtitle,
    candidate.description,
    candidate.personality,
    candidate.voice,
    candidate.sampleResponse,
    candidate.prompt,
    candidate.modules,
    ...(candidate.tags || []),
  ])
}

function exhibitText(exhibit: WonderLabExhibitProfile): string {
  return textParts([
    exhibit.componentName,
    exhibit.folderName,
    exhibit.sourcePath,
    exhibit.title,
    exhibit.description,
    exhibit.notes,
    exhibit.category,
    ...(exhibit.tags || []),
  ])
}

function overlap(
  reviewerTokens: Set<string>,
  exhibitTokens: Set<string>,
): string[] {
  return [...reviewerTokens]
    .filter((token) => exhibitTokens.has(token))
    .sort((left, right) => left.localeCompare(right, 'en'))
}

function isDotti(candidate: WonderLabReviewerCandidate): boolean {
  const normalized = normalize(candidate.name).replace(/-/g, '')
  const slug = normalize(candidate.slug || '').replace(/-/g, '')
  return DOTTI_NAMES.has(normalized) || DOTTI_NAMES.has(slug)
}

function isCatbot(candidate: WonderLabReviewerCandidate): boolean {
  const normalizedName = normalize(candidate.name)
  const normalizedSlug = normalize(candidate.slug || '')
  return CATBOT_NAMES.has(normalizedName) || CATBOT_NAMES.has(normalizedSlug)
}

export function isWonderLabReviewerVoiceReady(
  candidate: WonderLabReviewerCandidate,
): boolean {
  return Boolean(candidate.voice?.trim() || candidate.sampleResponse?.trim())
}

function overrideFor(
  candidate: WonderLabReviewerCandidate,
  overrides: WonderLabReviewerOverride[],
): WonderLabReviewerOverride | undefined {
  const fullKey = wonderLabReviewerKey(candidate)
  const nameKey = reviewerNameKey(candidate)

  return overrides.find((override) => {
    const key = normalize(override.reviewerKey)
    return (
      override.reviewerKey === fullKey ||
      key === nameKey ||
      key === normalize(candidate.name)
    )
  })
}

function specialistScore(
  candidate: WonderLabReviewerCandidate,
  exhibit: WonderLabExhibitProfile,
): { score: number; reasons: string[] } {
  const reviewerTokens = tokenize(candidateText(candidate))
  const exhibitTokens = tokenize(exhibitText(exhibit))
  const shared = overlap(reviewerTokens, exhibitTokens)
  const reasons: string[] = []
  let score = 0

  if (shared.length) {
    const displayed = shared.slice(0, 5)
    score += displayed.length * 4
    reasons.push(`shared expertise: ${displayed.join(', ')}`)
  }

  const folderToken = normalize(exhibit.folderName)
  if (folderToken && reviewerTokens.has(folderToken)) {
    score += 5
    reasons.push(`folder affinity: ${exhibit.folderName}`)
  }

  return { score, reasons }
}

function firstPartyRules(
  candidate: WonderLabReviewerCandidate,
  exhibit: WonderLabExhibitProfile,
): { score: number; reasons: string[] } {
  const exhibitTokens = tokenize(exhibitText(exhibit))
  const reasons: string[] = []
  let score = 0

  if (isDotti(candidate)) {
    const matches = [...DOTTI_COMPONENT_TERMS]
      .filter((token) => exhibitTokens.has(token))
      .sort((left, right) => left.localeCompare(right, 'en'))

    if (matches.length) {
      score += 24 + Math.min(matches.length, 4) * 3
      reasons.push(`Dotti bot-building affinity: ${matches.slice(0, 4).join(', ')}`)
    }
  }

  if (isCatbot(candidate)) {
    score += 3
    reasons.push('Catbot broad museum eligibility')

    if (
      exhibitTokens.has('cat') ||
      exhibitTokens.has('animal') ||
      exhibitTokens.has('pet')
    ) {
      score += 8
      reasons.push('Catbot subject affinity')
    }
  }

  return { score, reasons }
}

export function rankWonderLabReviewers(
  exhibit: WonderLabExhibitProfile,
  candidates: WonderLabReviewerCandidate[],
  options: RankWonderLabReviewersOptions = {},
): WonderLabReviewerAffinity[] {
  const limit = Math.max(0, Math.floor(options.limit ?? DEFAULT_LIMIT))
  const minimumScore = options.minimumScore ?? DEFAULT_MINIMUM_SCORE
  const overrides = options.overrides || []

  return candidates
    .filter((candidate) => {
      if (!options.includeInactive && candidate.isActive === false) return false
      if (!options.includeMature && candidate.isMature === true) return false
      if (options.requirePublic !== false && candidate.isPublic === false) return false
      return true
    })
    .map((candidate): WonderLabReviewerAffinity | null => {
      const override = overrideFor(candidate, overrides)
      if (override?.excluded) return null

      const specialist = specialistScore(candidate, exhibit)
      const firstParty = firstPartyRules(candidate, exhibit)
      const reasons = [...firstParty.reasons, ...specialist.reasons]
      let score = firstParty.score + specialist.score

      if (override?.boost) {
        score += override.boost
        reasons.push(
          override.reason || `curator affinity adjustment: ${override.boost}`,
        )
      } else if (override?.reason) {
        reasons.push(override.reason)
      }

      const voiceReady = isWonderLabReviewerVoiceReady(candidate)
      if (!voiceReady) reasons.push('voice data incomplete')

      return {
        reviewer: candidate,
        reviewerKey: wonderLabReviewerKey(candidate),
        score,
        voiceReady,
        reasons,
      }
    })
    .filter(
      (entry): entry is WonderLabReviewerAffinity =>
        entry !== null && entry.score >= minimumScore,
    )
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      if (left.reviewer.kind !== right.reviewer.kind) {
        return left.reviewer.kind.localeCompare(right.reviewer.kind, 'en')
      }
      const nameOrder = left.reviewer.name.localeCompare(
        right.reviewer.name,
        'en',
      )
      return nameOrder || left.reviewer.id - right.reviewer.id
    })
    .slice(0, limit)
}
