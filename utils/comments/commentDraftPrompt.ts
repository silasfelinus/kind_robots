import type {
  CommentSpeakerKind,
  CommentTargetProfile,
} from '@/utils/comments/commentCasting'

export type CommentVoiceEvidence = {
  kind: CommentSpeakerKind
  id: number
  name: string
  personality?: string | null
  canonicalVoice?: string | null
  sampleResponse?: string | null
  archivedVoiceSamples?: string[]
}

export type CommentDraftPrompt = {
  system: string
  user: string
  responseSchema: Record<string, unknown>
}

/**
 * Not every object wants the same scene. A one-line Facet can carry a single
 * observation; a Reward with an odd effect can carry two people disagreeing
 * about it. Uniform output is the failure mode the museum corpus already
 * avoided — 353 exchanges that all sounded like the same meeting.
 */
export type CommentExchangeShape = 'SOLO' | 'DUET' | 'DUET_REPLY' | 'TRIO'

export type CommentDraftPromptOptions = {
  shape?: CommentExchangeShape
  /** Opt in to a third speaker. Two remains the default everywhere. */
  maxSpeakers?: 2 | 3
}

const shapeInstruction: Record<CommentExchangeShape, string> = {
  SOLO: 'Write one standalone observation. There is nobody to answer and nothing to set up — make the single comment carry its own weight.',
  DUET: 'Write one comment for each supplied speaker, in the same order. They are looking at the same thing and need not acknowledge each other.',
  DUET_REPLY:
    'Write one comment for each supplied speaker, in the same order. The second speaker is answering the first directly — agreeing, undercutting, correcting, or missing the point entirely. The reply must not work as a standalone comment.',
  TRIO: 'Write one comment for each supplied speaker, in the same order. Three voices on one object crowds quickly: give each a distinct job, and let at least one of them be brief.',
}

function compact(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim()
}

function bounded(value: string | null | undefined, maximum = 900): string {
  const normalized = compact(value)
  return normalized.length <= maximum
    ? normalized
    : `${normalized.slice(0, maximum - 1).trimEnd()}…`
}

function targetBlock(target: CommentTargetProfile): string {
  return [
    `Type: ${target.type}`,
    `ID: ${target.id}`,
    `Title: ${bounded(target.title, 240)}`,
    `Description: ${bounded(target.description) || 'Not provided'}`,
    `Flavor: ${bounded(target.flavorText) || 'Not provided'}`,
    `Category: ${bounded(target.category, 200) || 'Not provided'}`,
    `Tags: ${(target.tags || []).map((tag) => bounded(tag, 100)).filter(Boolean).slice(0, 16).join(', ') || 'None'}`,
  ].join('\n')
}

function speakerBlock(speaker: CommentVoiceEvidence): string {
  const archived = (speaker.archivedVoiceSamples || [])
    .map((sample) => bounded(sample, 600))
    .filter(Boolean)
    .slice(0, 4)

  return [
    `Speaker: ${speaker.name}`,
    `Kind: ${speaker.kind}`,
    `ID: ${speaker.id}`,
    `Personality: ${bounded(speaker.personality) || 'Not provided'}`,
    `Canonical voice: ${bounded(speaker.canonicalVoice) || 'Not provided'}`,
    `Canonical sample: ${bounded(speaker.sampleResponse, 700) || 'Not provided'}`,
    archived.length
      ? `Archived voice evidence:\n${archived.map((sample) => `- ${sample}`).join('\n')}`
      : 'Archived voice evidence: none selected',
  ].join('\n')
}

/**
 * Build a prompt for a brand-new exchange about a real object. Archived
 * WonderLab comments are examples of how a speaker sounds, never text to
 * rewrite and never evidence that two speakers belong together.
 */
export function buildCommentDraftPrompt(
  target: CommentTargetProfile,
  speakers: CommentVoiceEvidence[],
  options: CommentDraftPromptOptions = {},
): CommentDraftPrompt {
  if (target.type !== 'RESOURCE' && target.type !== 'REWARD' && target.type !== 'FACET') {
    throw new Error(`Transition comments do not support ${target.type}.`)
  }
  const maxSpeakers = options.maxSpeakers === 3 ? 3 : 2
  if (speakers.length < 1 || speakers.length > maxSpeakers) {
    throw new Error(
      maxSpeakers === 3
        ? 'A transition comment exchange needs one to three speakers.'
        : 'A transition comment exchange needs one or two speakers.',
    )
  }
  const shape: CommentExchangeShape =
    options.shape || (speakers.length === 1 ? 'SOLO' : speakers.length === 3 ? 'TRIO' : 'DUET')
  if (shape === 'SOLO' && speakers.length !== 1) {
    throw new Error('A SOLO exchange takes exactly one speaker.')
  }
  if ((shape === 'DUET' || shape === 'DUET_REPLY') && speakers.length !== 2) {
    throw new Error('A duet exchange takes exactly two speakers.')
  }
  if (shape === 'TRIO' && speakers.length !== 3) {
    throw new Error('A TRIO exchange takes exactly three speakers.')
  }
  const authorKeys = speakers.map((speaker) => `${speaker.kind}:${speaker.id}`)
  if (new Set(authorKeys).size !== authorKeys.length) {
    throw new Error('A speaker may appear only once in an exchange.')
  }

  const system = [
    'Write a tiny first-party interaction in the Kind Robots world.',
    'The object is the reason this moment exists. Write from the object outward rather than forcing a pre-existing routine onto it.',
    'These are COMMENTS, not product reviews. Do not discuss star ratings, implementation quality, usability, completeness, or whether something deserves approval.',
    'Preserve each supplied speaker as a distinct person: cadence, vocabulary, emotional habits, eloquence, brevity, stage directions, and worldview may differ sharply.',
    'Archived voice evidence is characterization evidence only. Never paraphrase an archived line, continue its museum situation, mention a Component, or assume two speakers have history merely because archived samples exist.',
    'One speaker may set up and another may answer, undercut, misunderstand, escalate, soften, or simply react. Do not force a joke. A strong serious, quiet, strange, or nonverbal beat is equally valid.',
    'Prefer concrete interaction with the target over exposition about it.',
    'Keep each comment concise unless that specific speaker is canonically verbose. Most comments should be one to three sentences.',
    'Do not invent major lore, relationships, ownership, past events, or capabilities not supported by the supplied target and speaker context.',
    'Return only JSON matching the supplied schema.',
  ].join('\n')

  const user = [
    'TARGET OBJECT',
    targetBlock(target),
    ...speakers.flatMap((speaker, index) => [
      '',
      `SPEAKER ${index + 1}`,
      speakerBlock(speaker),
    ]),
    '',
    shapeInstruction[shape],
    'The object must remain the anchor whatever the shape.',
  ].join('\n')

  return {
    system,
    user,
    responseSchema: {
      type: 'object',
      required: ['comments'],
      properties: {
        comments: {
          type: 'array',
          minItems: speakers.length,
          maxItems: speakers.length,
          items: {
            type: 'object',
            required: ['authorKind', 'authorId', 'comment'],
            properties: {
              authorKind: { type: 'string', enum: ['BOT', 'CHARACTER'] },
              authorId: { type: 'integer', minimum: 1 },
              comment: { type: 'string', minLength: 1, maxLength: 1200 },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
  }
}
