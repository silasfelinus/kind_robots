import type { CommentSpeakerKind } from '@/utils/comments/commentCasting'

/**
 * The archived WonderLab corpus, read strictly as evidence of how a speaker
 * sounds.
 *
 * `config/wonderlab-voice-polish-batch-001.json` … `-039.json` hold 706 unique
 * polished comments. This module turns them into per-speaker voice evidence and
 * nothing else. It does not record which speakers shared a component, does not
 * expose co-occurrence, and does not rank anything: pairing history carries zero
 * casting weight (kind_robots#1769), and the cheapest way to keep it at zero is
 * to never compute it.
 *
 * Pure by design — no `fs`, no `prisma`. Callers hand it parsed records.
 */

export type ArchivedVoiceRecord = {
  draftId: number
  batchFile?: string
  author: {
    kind: CommentSpeakerKind
    id: number
    name: string
  }
  editedComment: string
  expectedRating?: number | null
  expectedReactionType?: string | null
  canonicalOrder?: number | null
}

export type ArchivedVoiceSample = {
  draftId: number
  text: string
  words: number
}

export type SpeakerVoiceEvidence = {
  kind: CommentSpeakerKind
  id: number
  name: string
  samples: ArchivedVoiceSample[]
  medianWords: number
}

/** Live voice fields, used when the archive has little or nothing for a speaker. */
export type LiveVoiceFields = {
  personality?: string | null
  voice?: string | null
  sampleResponse?: string | null
  botIntro?: string | null
  narrativeVoice?: string | null
  quirks?: string | null
  tagline?: string | null
}

export type VoiceEvidenceTier = 'RICH' | 'THIN' | 'SPARSE' | 'NONE'

export type SpeakerRef = { kind: CommentSpeakerKind; id: number }

export function speakerKey(speaker: SpeakerRef): string {
  return `${speaker.kind}:${speaker.id}`
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]!
    : Math.round((sorted[middle - 1]! + sorted[middle]!) / 2)
}

/**
 * Index parsed manifest rows by speaker.
 *
 * 52 of the 758 rows are re-polishes of a draft that appeared in an earlier
 * batch, so records are deduped by `draftId` with the last occurrence winning.
 *
 * Callers must pass records in batch-file order — the zero-padded filenames sort
 * lexicographically, so a plain sorted `readdirSync` is enough. Do not order by
 * `batchId`: files 001-003 use `wonderlab-voice-polish-00N` and 004-039 use
 * `wonderlab-definitive-0NN`, which sorts the superseded batch *last* and
 * resurrects all 52 stale drafts.
 *
 * Cross-check for callers: the 706 survivors are exactly the records carrying
 * `canonicalOrder`, and those form a complete 1..706 permutation.
 */
export function buildVoiceEvidenceIndex(
  records: ArchivedVoiceRecord[],
): Map<string, SpeakerVoiceEvidence> {
  const latestByDraft = new Map<number, ArchivedVoiceRecord>()
  for (const record of records) {
    if (!record?.author || !record.editedComment?.trim()) continue
    latestByDraft.set(record.draftId, record)
  }

  const index = new Map<string, SpeakerVoiceEvidence>()
  for (const record of latestByDraft.values()) {
    const key = speakerKey(record.author)
    const existing = index.get(key)
    const entry: SpeakerVoiceEvidence = existing || {
      kind: record.author.kind,
      id: record.author.id,
      name: record.author.name,
      samples: [],
      medianWords: 0,
    }
    entry.samples.push({
      draftId: record.draftId,
      text: record.editedComment.trim(),
      words: wordCount(record.editedComment),
    })
    index.set(key, entry)
  }

  for (const entry of index.values()) {
    entry.samples.sort((left, right) => left.draftId - right.draftId)
    entry.medianWords = median(entry.samples.map((sample) => sample.words))
  }

  return index
}

export function voiceEvidenceTier(
  evidence: SpeakerVoiceEvidence | undefined | null,
): VoiceEvidenceTier {
  const count = evidence?.samples.length || 0
  if (count >= 4) return 'RICH'
  if (count >= 2) return 'THIN'
  if (count === 1) return 'SPARSE'
  return 'NONE'
}

function liveVoiceLength(live: LiveVoiceFields | undefined | null): number {
  if (!live) return 0
  return [
    live.personality,
    live.voice,
    live.sampleResponse,
    live.botIntro,
    live.narrativeVoice,
    live.quirks,
    live.tagline,
  ]
    .map((value) => (value || '').trim())
    .filter(Boolean)
    .join(' ').length
}

/**
 * How confidently can we write in this speaker's voice? 0–100.
 *
 * Archived samples are the strong evidence — they are finished prose in the
 * speaker's own register. Live `personality`/`voice`/`sampleResponse` text is
 * the principled fallback for the ~17 live Bots and Characters the museum never
 * cast: real authored characterization, but a description of a voice rather than
 * a demonstration of one, so it is capped below SPARSE and can never reach the
 * archived tiers.
 *
 * A speaker with neither scores 0 and must not be cast. Inventing a historical
 * voice for a silent character is the one failure mode this whole system exists
 * to avoid.
 */
export function voiceEvidenceScore(
  evidence: SpeakerVoiceEvidence | undefined | null,
  live?: LiveVoiceFields | null,
): number {
  const tier = voiceEvidenceTier(evidence)
  const liveLength = liveVoiceLength(live)
  const liveBonus = Math.min(10, Math.round(liveLength / 120))

  // The bands are separated on purpose, and RICH is the only one that clears
  // 60. `rankCommentSpeakers` prints 'strong voice evidence' at 60: if THIN
  // scored above that, 171 of 278 speakers would carry the phrase and it would
  // stop meaning anything. Everyone below RICH gets 'usable voice evidence',
  // which is the honest description of two samples.
  if (tier === 'RICH') {
    const depth = Math.min(10, (evidence?.samples.length || 4) - 4)
    return Math.min(100, 85 + depth + liveBonus)
  }
  if (tier === 'THIN') return Math.min(58, 50 + liveBonus)
  if (tier === 'SPARSE') return Math.min(42, 32 + liveBonus)
  if (liveLength === 0) return 0
  // Live-only: a description of a voice, never a demonstration of one. Capped
  // below SPARSE so one real sample always beats a well-written bio.
  return Math.min(30, 8 + Math.round(liveLength / 40))
}

/**
 * The samples to hand a writer for one exchange.
 *
 * Longest-first, because a longer sample carries more rhythm and syntax than a
 * one-liner does, and the prompt builder only keeps four.
 */
export function selectVoiceSamples(
  evidence: SpeakerVoiceEvidence | undefined | null,
  limit = 4,
): ArchivedVoiceSample[] {
  if (!evidence) return []
  return [...evidence.samples]
    .sort((left, right) => right.words - left.words || left.draftId - right.draftId)
    .slice(0, Math.max(0, limit))
}
