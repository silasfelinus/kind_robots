import type {
  CommentSpeakerCandidate,
  CommentSpeakerKind,
  CommentTargetType,
} from '@/utils/comments/commentCasting'
import {
  speakerKey,
  voiceEvidenceScore,
  voiceEvidenceTier,
  type LiveVoiceFields,
  type SpeakerRef,
  type SpeakerVoiceEvidence,
} from '@/utils/comments/voiceEvidence'

/**
 * The four signals `rankCommentSpeakers` consumes, computed from real object and
 * speaker data.
 *
 * Object-first: every signal is a question about the target in front of us and
 * this speaker's relationship to it. There is deliberately no input here for
 * historical WonderLab pairings, and no way to supply one — a speaker who
 * reviewed a component alongside another speaker gains nothing from that fact
 * (kind_robots#1769).
 *
 * Pure: no `prisma`, no `fetch`. Callers pass plain records so this stays
 * unit-testable and the ranking stays inspectable.
 */

export type SignalTargetProfile = {
  type: CommentTargetType
  id: number
  title: string
  description?: string | null
  flavorText?: string | null
  effect?: string | null
  examples?: string | null
  category?: string | null
  tags?: string[]
  /** Facet ids this target carries, e.g. a Reward's RewardFacet links. */
  facetIds?: number[]
  /** Character ids explicitly linked to this target (Reward.Characters). */
  linkedCharacterIds?: number[]
  /** Bot ids explicitly linked to this target, when such a link exists. */
  linkedBotIds?: number[]
  /** Facet ids one FacetRelation hop from this target. */
  relatedFacetIds?: number[]
}

export type SignalSpeakerProfile = SpeakerRef & {
  name: string
  personality?: string | null
  voice?: string | null
  sampleResponse?: string | null
  botIntro?: string | null
  narrativeVoice?: string | null
  quirks?: string | null
  tagline?: string | null
  subtitle?: string | null
  description?: string | null
  drive?: string | null
  backstory?: string | null
  role?: string | null
  title?: string | null
  alignment?: string | null
  characterClass?: string | null
  species?: string | null
  genre?: string | null
  botType?: string | null
  /** Facet ids linked to this speaker via CharacterFacet / BotFacet. */
  facetIds?: number[]
}

export type CastingContext = {
  evidence: Map<string, SpeakerVoiceEvidence>
  /** How many times each speaker is already cast in this batch. */
  castCounts?: Map<string, number>
}

/**
 * A curator's stated reason for casting someone the signals would not pick.
 *
 * This is deliberately not a signal. Novelty carries a weight of 0.05, so even a
 * full-marks novelty score moves a total by five points — far less than the
 * spread between candidates. A "deliberate contrast" implemented as a score
 * nudge would therefore never actually cast anyone, while looking like it might.
 * Making it an explicit post-ranking override keeps the scoring policy from
 * #1765 untouched and forces the reason into the record.
 */
export type ContrastDirective = {
  /** `BOT:12` / `CHARACTER:241` — see `speakerKey`. */
  speakerKey: string
  /** Why this speaker, against the signals. Required, and never empty. */
  note: string
  /** Which slot to take. Defaults to the last one. */
  slot?: number
}

export type SpeakerSignals = CommentSpeakerCandidate & {
  kind: CommentSpeakerKind
  id: number
  name: string
  relationshipScore: number
  targetAffinityScore: number
  voiceEvidenceScore: number
  noveltyScore: number
  /** Human-readable why, kept alongside the numbers for the calibration record. */
  signalNotes: string[]
}

const STOP_WORDS = new Set([
  'a', 'about', 'all', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'but',
  'by', 'can', 'do', 'for', 'from', 'has', 'have', 'her', 'his', 'in', 'into',
  'is', 'it', 'its', 'just', 'like', 'more', 'no', 'not', 'of', 'off', 'on',
  'one', 'only', 'or', 'out', 'own', 'she', 'so', 'some', 'that', 'the', 'their',
  'them', 'then', 'there', 'they', 'this', 'to', 'too', 'up', 'was', 'were',
  'what', 'when', 'which', 'who', 'will', 'with', 'you', 'your',
])

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split('-')
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  )
}

function joinText(values: Array<string | null | undefined>): string {
  return values.filter((value): value is string => Boolean(value?.trim())).join(' ')
}

export function targetText(target: SignalTargetProfile): string {
  return joinText([
    target.title,
    target.description,
    target.flavorText,
    target.effect,
    target.examples,
    target.category,
    ...(target.tags || []),
  ])
}

export function speakerText(speaker: SignalSpeakerProfile): string {
  return joinText([
    speaker.name,
    speaker.personality,
    speaker.voice,
    speaker.quirks,
    speaker.drive,
    speaker.backstory,
    speaker.role,
    speaker.title,
    speaker.alignment,
    speaker.characterClass,
    speaker.species,
    speaker.genre,
    speaker.botType,
    speaker.subtitle,
    speaker.description,
    speaker.tagline,
    speaker.narrativeVoice,
  ])
}

function overlapTokens(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((token) => right.has(token)).sort()
}

/**
 * Does a real, recorded link exist between this object and this speaker? 0–100.
 *
 * Tiers, strongest first:
 *   100  Reward.Characters names this character outright, or the target Facet
 *        is one of this speaker's own CharacterFacet / BotFacet facets.
 *   30-80 shared facets — the object and the speaker are described with some of
 *        the same concepts. Scales with how many they share.
 *   45   the target Facet is one FacetRelation hop from a facet the speaker carries.
 *    0   no recorded relationship. Common, and fine: affinity does the work.
 */
export function relationshipScore(
  target: SignalTargetProfile,
  speaker: SignalSpeakerProfile,
): { score: number; notes: string[] } {
  const notes: string[] = []

  const directlyLinked =
    (speaker.kind === 'CHARACTER' && (target.linkedCharacterIds || []).includes(speaker.id)) ||
    (speaker.kind === 'BOT' && (target.linkedBotIds || []).includes(speaker.id))
  if (directlyLinked) {
    notes.push('explicitly linked to this object')
    return { score: 100, notes }
  }

  const speakerFacets = new Set(speaker.facetIds || [])
  if (target.type === 'FACET' && speakerFacets.has(target.id)) {
    notes.push('carries this facet')
    return { score: 100, notes }
  }

  const shared = (target.facetIds || []).filter((facetId) => speakerFacets.has(facetId))
  if (shared.length) {
    const score = Math.min(80, 30 + (shared.length - 1) * 25)
    notes.push(`${shared.length} shared facet${shared.length === 1 ? '' : 's'}`)
    return { score, notes }
  }

  if (target.type === 'FACET') {
    const nearby = (target.relatedFacetIds || []).some((facetId) => speakerFacets.has(facetId))
    if (nearby) {
      notes.push('carries a neighbouring facet')
      return { score: 45, notes }
    }
  }

  return { score: 0, notes }
}

/**
 * Does this speaker sound like someone who would have something to say about
 * this object? 0–100, from vocabulary overlap between the object's text and the
 * speaker's own characterization.
 *
 * Crude on purpose. It is a prior for a human or a writer to overrule, not a
 * verdict, and a crude signal that can be read off the token list beats a
 * sophisticated one nobody can audit.
 */
export function targetAffinityScore(
  target: SignalTargetProfile,
  speaker: SignalSpeakerProfile,
): { score: number; notes: string[]; shared: string[] } {
  const targetTokens = tokenize(targetText(target))
  const speakerTokens = tokenize(speakerText(speaker))
  if (!targetTokens.size || !speakerTokens.size) {
    return { score: 0, notes: [], shared: [] }
  }

  const shared = overlapTokens(targetTokens, speakerTokens)
  if (!shared.length) return { score: 0, notes: [], shared }

  // Normalize by the smaller vocabulary: a speaker with a long backstory should
  // not out-score a terse one just by owning more words.
  const coverage = shared.length / Math.min(targetTokens.size, speakerTokens.size)
  const score = Math.min(100, Math.round(coverage * 140 + shared.length * 6))

  return {
    score,
    notes: [`shares ${shared.slice(0, 6).join(', ')}`],
    shared,
  }
}

/**
 * Keep the batch from collapsing onto the handful of speakers with the deepest
 * archives. 0–100.
 *
 * Starts high and decays with each casting already made in this batch, so a
 * fresh voice edges out a repeat when everything else is close. Weighted at
 * only 0.05 in `rankCommentSpeakers` — it breaks ties, it does not pick winners.
 * For casting against the signals on purpose, see `ContrastDirective`.
 */
export function noveltyScore(
  speaker: SpeakerRef,
  context: CastingContext,
): { score: number; notes: string[] } {
  const timesCast = context.castCounts?.get(speakerKey(speaker)) || 0
  return {
    score: Math.max(0, 100 - timesCast * 35),
    notes: timesCast ? [`already cast ${timesCast}x in this batch`] : ['unused in this batch'],
  }
}

/**
 * Force named speakers into a cast after ranking, recording why.
 *
 * Inspectable by construction: a directive names exactly one speaker, carries a
 * mandatory human note, appends its own reason string, and cannot fire
 * implicitly. A surprising casting stays possible; an unexplained one does not.
 */
export function applyContrastDirectives<
  T extends { kind: CommentSpeakerKind; id: number; reasons: string[] },
>(ranked: T[], pool: T[], directives: ContrastDirective[] = []): T[] {
  const result = [...ranked]

  for (const directive of directives) {
    if (!directive.note?.trim()) {
      throw new Error(`Contrast directive for ${directive.speakerKey} needs a note.`)
    }
    const chosen = pool.find((candidate) => speakerKey(candidate) === directive.speakerKey)
    if (!chosen) continue

    const slot = Math.min(
      Math.max(1, directive.slot || result.length),
      Math.max(1, result.length),
    )
    const alreadyCast = result.findIndex(
      (candidate) => speakerKey(candidate) === directive.speakerKey,
    )
    if (alreadyCast > -1) result.splice(alreadyCast, 1)

    result.splice(slot - 1, alreadyCast > -1 ? 0 : 1, {
      ...chosen,
      reasons: [...chosen.reasons, `deliberate contrast: ${directive.note.trim()}`],
    })
  }

  return result
}

/** Compute all four signals for one candidate against one target. */
export function scoreSpeaker(
  target: SignalTargetProfile,
  speaker: SignalSpeakerProfile,
  context: CastingContext,
): SpeakerSignals {
  const relationship = relationshipScore(target, speaker)
  const affinity = targetAffinityScore(target, speaker)
  const evidence = context.evidence.get(speakerKey(speaker))
  const live: LiveVoiceFields = speaker
  const voice = voiceEvidenceScore(evidence, live)
  const novelty = noveltyScore(speaker, context)

  return {
    kind: speaker.kind,
    id: speaker.id,
    name: speaker.name,
    relationshipScore: relationship.score,
    targetAffinityScore: affinity.score,
    voiceEvidenceScore: voice,
    noveltyScore: novelty.score,
    signalNotes: [
      ...relationship.notes,
      ...affinity.notes,
      `voice evidence ${voiceEvidenceTier(evidence).toLowerCase()}`,
      ...novelty.notes,
    ],
  }
}

/**
 * Score a whole candidate pool for one target, dropping speakers we cannot
 * write. A speaker with no archived samples and no live voice text is not a
 * casting option — we do not invent a voice to fill a slot.
 */
export function scoreSpeakerPool(
  target: SignalTargetProfile,
  speakers: SignalSpeakerProfile[],
  context: CastingContext,
): SpeakerSignals[] {
  return speakers
    .map((speaker) => scoreSpeaker(target, speaker, context))
    .filter((signals) => signals.voiceEvidenceScore > 0)
}
