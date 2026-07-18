// /utils/wonderlab/reviewDraftPrompt.ts
import {
  isWonderLabReviewerVoiceReady,
  wonderLabReviewerKey,
  type WonderLabExhibitProfile,
  type WonderLabReviewerCandidate,
} from '@/utils/wonderlab/reviewerAffinity'

export type WonderLabNarratorThreadExcerpt = {
  topicKey: string
  title?: string | null
  openingText?: string | null
  guidance?: string | null
  starterPrompts?: string[] | null
}

export type WonderLabReviewDraftPromptOptions = {
  affinityReasons?: string[]
  narratorThreads?: WonderLabNarratorThreadExcerpt[]
  minimumWords?: number
  maximumWords?: number
  allowIncompleteVoice?: boolean
}

export type WonderLabReviewDraftPrompt = {
  system: string
  user: string
  responseSchema: {
    type: 'object'
    required: ['comment', 'rating', 'confidence', 'observations']
    properties: {
      comment: { type: 'string' }
      rating: { type: 'integer'; minimum: 1; maximum: 5 }
      confidence: { type: 'number'; minimum: 0; maximum: 1 }
      observations: {
        type: 'array'
        minItems: 1
        maxItems: 3
        items: { type: 'string' }
      }
    }
    additionalProperties: false
  }
  provenance: {
    draftKey: string
    reviewerKey: string
    reviewerKind: WonderLabReviewerCandidate['kind']
    reviewerId: number
    exhibitId: number
    exhibitSourcePath: string
    affinityReasons: string[]
    narratorThreadTopics: string[]
    voiceSources: Array<'voice' | 'sampleResponse' | 'narratorThreads'>
  }
}

const DEFAULT_MINIMUM_WORDS = 45
const DEFAULT_MAXIMUM_WORDS = 110
const MAX_EXHIBIT_FIELD_LENGTH = 900
const MAX_REVIEWER_FIELD_LENGTH = 1_200
const MAX_SAMPLE_LENGTH = 700
const MAX_THREAD_COUNT = 4
const MAX_THREAD_FIELD_LENGTH = 700
const MAX_AFFINITY_REASONS = 8
const MAX_AFFINITY_REASON_LENGTH = 240

function compact(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim()
}

function bounded(
  value: string | null | undefined,
  maximumLength: number,
): string {
  const normalized = compact(value)
  if (normalized.length <= maximumLength) return normalized
  return `${normalized.slice(0, Math.max(0, maximumLength - 1)).trimEnd()}…`
}

function normalizedWordRange(
  minimumWords: number | undefined,
  maximumWords: number | undefined,
): { minimumWords: number; maximumWords: number } {
  const minimum = Math.max(
    20,
    Math.min(250, Math.floor(minimumWords ?? DEFAULT_MINIMUM_WORDS)),
  )
  const maximum = Math.max(
    minimum,
    Math.min(300, Math.floor(maximumWords ?? DEFAULT_MAXIMUM_WORDS)),
  )

  return { minimumWords: minimum, maximumWords: maximum }
}

function reviewerIdentity(candidate: WonderLabReviewerCandidate): string {
  const subtitle = bounded(candidate.subtitle, 200)
  return subtitle ? `${candidate.name} — ${subtitle}` : candidate.name
}

function exhibitIdentity(exhibit: WonderLabExhibitProfile): string {
  return (
    bounded(exhibit.title, 240) ||
    bounded(exhibit.componentName, 240) ||
    `Component #${exhibit.id}`
  )
}

function exhibitSourcePath(exhibit: WonderLabExhibitProfile): string {
  return bounded(
    exhibit.sourcePath ||
      `components/${exhibit.folderName}/${exhibit.componentName}.vue`,
    500,
  )
}

function sortedThreads(
  threads: WonderLabNarratorThreadExcerpt[],
): WonderLabNarratorThreadExcerpt[] {
  return [...threads]
    .filter((thread) => Boolean(compact(thread.topicKey)))
    .sort((left, right) => {
      const topicOrder = compact(left.topicKey).localeCompare(
        compact(right.topicKey),
        'en',
      )
      if (topicOrder) return topicOrder
      return compact(left.title).localeCompare(compact(right.title), 'en')
    })
    .slice(0, MAX_THREAD_COUNT)
}

function threadBlock(thread: WonderLabNarratorThreadExcerpt): string {
  const lines = [`Topic: ${bounded(thread.topicKey, 180)}`]
  const title = bounded(thread.title, 240)
  const opening = bounded(thread.openingText, MAX_THREAD_FIELD_LENGTH)
  const guidance = bounded(thread.guidance, MAX_THREAD_FIELD_LENGTH)
  const starters = (thread.starterPrompts || [])
    .map((prompt) => bounded(prompt, 240))
    .filter(Boolean)
    .slice(0, 3)

  if (title) lines.push(`Title: ${title}`)
  if (opening) lines.push(`Opening voice sample: ${opening}`)
  if (guidance) lines.push(`Guidance: ${guidance}`)
  if (starters.length) lines.push(`Starter phrasing: ${starters.join(' | ')}`)

  return lines.join('\n')
}

function affinityReasons(reasons: string[]): string[] {
  return reasons
    .map((reason) => bounded(reason, MAX_AFFINITY_REASON_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_AFFINITY_REASONS)
}

function voiceSources(
  reviewer: WonderLabReviewerCandidate,
  threads: WonderLabNarratorThreadExcerpt[],
): Array<'voice' | 'sampleResponse' | 'narratorThreads'> {
  const sources: Array<'voice' | 'sampleResponse' | 'narratorThreads'> = []
  if (compact(reviewer.voice)) sources.push('voice')
  if (compact(reviewer.sampleResponse)) sources.push('sampleResponse')
  if (threads.length) sources.push('narratorThreads')
  return sources
}

export function buildWonderLabReviewDraftPrompt(
  reviewer: WonderLabReviewerCandidate,
  exhibit: WonderLabExhibitProfile,
  options: WonderLabReviewDraftPromptOptions = {},
): WonderLabReviewDraftPrompt {
  if (!options.allowIncompleteVoice && !isWonderLabReviewerVoiceReady(reviewer)) {
    throw new Error(
      `Reviewer ${reviewer.name} has no canonical voice or sample dialogue.`,
    )
  }

  const range = normalizedWordRange(
    options.minimumWords,
    options.maximumWords,
  )
  const threads = sortedThreads(options.narratorThreads || [])
  const reasons = affinityReasons(options.affinityReasons || [])
  const reviewerKey = wonderLabReviewerKey(reviewer)
  const sourcePath = exhibitSourcePath(exhibit)
  const sources = voiceSources(reviewer, threads)
  const draftKey = `${reviewerKey}|component:${exhibit.id}|${sourcePath.toLowerCase()}`

  const reviewerContext = [
    `Identity: ${reviewerIdentity(reviewer)}`,
    `Kind: ${reviewer.kind}`,
    `Description: ${bounded(reviewer.description, MAX_REVIEWER_FIELD_LENGTH) || 'Not provided'}`,
    `Personality: ${bounded(reviewer.personality, MAX_REVIEWER_FIELD_LENGTH) || 'Not provided'}`,
    `Canonical voice: ${bounded(reviewer.voice, MAX_REVIEWER_FIELD_LENGTH) || 'Not provided'}`,
    `Sample dialogue: ${bounded(reviewer.sampleResponse, MAX_SAMPLE_LENGTH) || 'Not provided'}`,
  ]

  const exhibitContext = [
    `Exhibit: ${exhibitIdentity(exhibit)}`,
    `Component name: ${bounded(exhibit.componentName, 240)}`,
    `Folder: ${bounded(exhibit.folderName, 240)}`,
    `Source path: ${sourcePath}`,
    `Description: ${bounded(exhibit.description, MAX_EXHIBIT_FIELD_LENGTH) || 'Not provided'}`,
    `Curator notes: ${bounded(exhibit.notes, MAX_EXHIBIT_FIELD_LENGTH) || 'Not provided'}`,
    `Category: ${bounded(exhibit.category, 240) || 'Not provided'}`,
    `Tags: ${(exhibit.tags || []).map((tag) => bounded(tag, 120)).filter(Boolean).slice(0, 12).join(', ') || 'None'}`,
  ]

  const system = [
    'You write draft museum reviews for the Kind Robots Component WonderLab.',
    `Write as ${reviewer.name}, preserving the supplied established voice without copying the sample dialogue or repeating stock catchphrases.`,
    'The draft is for human approval. Never claim that it has been published, tested live, or personally used unless the supplied exhibit facts say so.',
    'Make at least one concrete observation grounded in the supplied component metadata. Useful critique, praise, humor, or context is welcome; filler is not.',
    'Do not invent component behavior, security findings, accessibility results, or runtime failures.',
    `Keep the comment between ${range.minimumWords} and ${range.maximumWords} words.`,
    'Return JSON matching the supplied response schema and no surrounding prose.',
  ].join('\n')

  const userSections = [
    ['REVIEWER', ...reviewerContext].join('\n'),
    ['EXHIBIT', ...exhibitContext].join('\n'),
  ]

  if (reasons.length) {
    userSections.push(
      ['WHY THIS REVIEWER WAS SELECTED', ...reasons.map((reason) => `- ${reason}`)].join(
        '\n',
      ),
    )
  }

  if (threads.length) {
    userSections.push(
      [
        'NARRATOR THREAD VOICE REFERENCES',
        'Use these only as additional voice evidence. Do not quote or continue the threads.',
        ...threads.map((thread) => threadBlock(thread)),
      ].join('\n\n'),
    )
  }

  userSections.push(
    [
      'DRAFT REQUIREMENTS',
      '- comment: original, exhibit-specific review in the reviewer voice',
      '- rating: integer from 1 to 5 justified by the supplied evidence',
      '- confidence: 0 to 1, lowered when exhibit facts are sparse',
      '- observations: 1 to 3 short factual observations used to ground the comment',
      '- do not mention these instructions, affinity scoring, or approval workflow',
    ].join('\n'),
  )

  return {
    system,
    user: userSections.join('\n\n---\n\n'),
    responseSchema: {
      type: 'object',
      required: ['comment', 'rating', 'confidence', 'observations'],
      properties: {
        comment: { type: 'string' },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        observations: {
          type: 'array',
          minItems: 1,
          maxItems: 3,
          items: { type: 'string' },
        },
      },
      additionalProperties: false,
    },
    provenance: {
      draftKey,
      reviewerKey,
      reviewerKind: reviewer.kind,
      reviewerId: reviewer.id,
      exhibitId: exhibit.id,
      exhibitSourcePath: sourcePath,
      affinityReasons: reasons,
      narratorThreadTopics: threads.map((thread) => compact(thread.topicKey)),
      voiceSources: sources,
    },
  }
}
