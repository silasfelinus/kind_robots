// /server/utils/commentBackfillAnthropic.ts
// Read-only drafting lane for kind_robots#1769. Claude produces candidate prose
// from the exact approved prompt-builder/cast; production publication remains a
// separate GitHub Actions write lane with full corpus validation.
import { archivedVoiceRecords } from '@/utils/comments/archivedVoiceCorpus'
import {
  buildVoiceEvidenceIndex,
  selectVoiceSamples,
  speakerKey,
} from '@/utils/comments/voiceEvidence'
import {
  buildCommentDraftPrompt,
  type CommentVoiceEvidence,
} from '@/utils/comments/commentDraftPrompt'
import {
  planManualCommentBackfillSlice,
  type ManualBackfillPlan,
} from './commentBackfillGeneration'

const DEFAULT_MODEL = 'claude-sonnet-4-6'
const BANNED_REVIEW_LANGUAGE =
  /\b(component|wonderlab|museum|exhibit|star rating|rating|review|implementation|usability)\b/i
const voiceIndex = buildVoiceEvidenceIndex(archivedVoiceRecords)

type DraftComment = {
  authorKind: 'BOT' | 'CHARACTER'
  authorId: number
  comment: string
}

type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string }>
  error?: { message?: string }
}

export type AnthropicDraftSlice = {
  start: number
  limit: number
  eligibleTargets: number
  model: string
  items: Array<{
    key: string
    title: string
    shape: 'SOLO' | 'DUET' | 'DUET_REPLY' | 'TRIO'
    speakers: Array<{
      kind: 'BOT' | 'CHARACTER'
      id: number
      name: string
      comment: string
    }>
  }>
  failures: Array<{ key: string; title: string; error: string }>
}

function normalizeWords(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function shingles(value: string, size = 8): Set<string> {
  const words = normalizeWords(value)
  const result = new Set<string>()
  for (let index = 0; index + size <= words.length; index += 1) {
    result.add(words.slice(index, index + size).join(' '))
  }
  return result
}

function sharedShingle(left: string, right: string): string | null {
  const leftSet = shingles(left)
  for (const candidate of shingles(right)) {
    if (leftSet.has(candidate)) return candidate
  }
  return null
}

function stripJsonFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function promptSpeakersFor(item: ManualBackfillPlan['items'][number]): CommentVoiceEvidence[] {
  return item.speakers.map((speaker) => {
    const evidence = voiceIndex.get(
      speakerKey({ kind: speaker.kind, id: speaker.id }),
    )
    return {
      kind: speaker.kind,
      id: speaker.id,
      name: speaker.name,
      canonicalVoice: speaker.voice,
      sampleResponse: speaker.sampleResponse,
      archivedVoiceSamples: selectVoiceSamples(evidence, 4).map(
        (sample) => sample.text,
      ),
    }
  })
}

function validateDraft(
  item: ManualBackfillPlan['items'][number],
  comments: DraftComment[],
): void {
  if (comments.length !== item.speakers.length) {
    throw new Error(
      `Expected ${item.speakers.length} comments; received ${comments.length}.`,
    )
  }

  for (const [index, comment] of comments.entries()) {
    const expected = item.speakers[index]
    if (!expected) throw new Error(`Missing planned speaker ${index + 1}.`)
    if (
      comment.authorKind !== expected.kind ||
      comment.authorId !== expected.id
    ) {
      throw new Error(
        `Author drift at ${index + 1}: expected ${expected.kind}:${expected.id}, got ${comment.authorKind}:${comment.authorId}.`,
      )
    }
    const value = String(comment.comment || '').trim()
    const words = normalizeWords(value)
    if (value.length < 2 || value.length > 1200) {
      throw new Error(`${expected.name}: invalid comment length.`)
    }
    if (words.length < 4 || words.length > 120) {
      throw new Error(`${expected.name}: ${words.length} words outside 4–120.`)
    }
    if (BANNED_REVIEW_LANGUAGE.test(value)) {
      throw new Error(`${expected.name}: slipped into reviewer/museum language.`)
    }

    const key = speakerKey({ kind: expected.kind, id: expected.id })
    for (const sample of voiceIndex.get(key)?.samples || []) {
      const overlap = sharedShingle(value, sample.text)
      if (overlap) {
        throw new Error(
          `${expected.name}: reused archived phrase "${overlap}".`,
        )
      }
    }
    if (expected.sampleResponse) {
      const overlap = sharedShingle(value, expected.sampleResponse)
      if (overlap) {
        throw new Error(
          `${expected.name}: reused canonical phrase "${overlap}".`,
        )
      }
    }
  }
}

async function callAnthropic(
  item: ManualBackfillPlan['items'][number],
  model: string,
  retryNote?: string,
): Promise<DraftComment[]> {
  const apiKey = String(
    process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
  ).trim()
  if (!apiKey) throw new Error('Anthropic API key is not configured.')

  const prompt = buildCommentDraftPrompt(
    {
      type: item.type,
      id: Number(item.key.split(':')[1]),
      title: item.title,
      description: item.description,
      flavorText: item.flavorText,
      category: item.category,
      tags: item.tags,
    },
    promptSpeakersFor(item),
    {
      shape: item.shape,
      maxSpeakers: item.shape === 'TRIO' ? 3 : 2,
    },
  )

  const system = retryNote
    ? `${prompt.system}\n\nAUTOMATED VALIDATION NOTE: ${retryNote} Replace the problematic wording with genuinely fresh prose while preserving author order and shape.`
    : prompt.system

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      temperature: 0.8,
      system,
      messages: [
        {
          role: 'user',
          content:
            `${prompt.user}\n\nReturn ONLY JSON in this exact envelope: ` +
            `{"comments":[{"authorKind":"CHARACTER_OR_BOT","authorId":123,"comment":"..."}]}. ` +
            `Use the actual supplied authorKind and authorId values, in supplied order.`,
        },
      ],
    }),
  })

  const body = (await response.json()) as AnthropicResponse
  if (!response.ok) {
    throw new Error(
      `Anthropic ${response.status}: ${body.error?.message || response.statusText}`,
    )
  }
  const raw = body.content
    ?.filter((block) => block.type === 'text')
    .map((block) => block.text || '')
    .join('')
    .trim()
  if (!raw) throw new Error('Anthropic returned no text.')

  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonFence(raw))
  } catch {
    throw new Error('Anthropic returned invalid JSON.')
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as { comments?: unknown }).comments)
  ) {
    throw new Error('Anthropic response is missing comments array.')
  }
  return (parsed as { comments: DraftComment[] }).comments
}

async function generateItem(
  item: ManualBackfillPlan['items'][number],
  model: string,
) {
  let lastError = ''
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const comments = await callAnthropic(
        item,
        model,
        attempt === 2 ? lastError : undefined,
      )
      validateDraft(item, comments)
      return comments
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown draft failure.'
      if (attempt === 2) throw error
    }
  }
  throw new Error('Draft generation exhausted retries.')
}

export async function draftCommentBackfillSlice(options: {
  start?: number
  limit?: number
  model?: string
}): Promise<AnthropicDraftSlice> {
  const plan = await planManualCommentBackfillSlice({
    start: options.start,
    limit: Math.min(24, Math.max(1, options.limit || 12)),
  })
  const model = options.model || DEFAULT_MODEL
  const items: AnthropicDraftSlice['items'] = []
  const failures: AnthropicDraftSlice['failures'] = []
  const concurrency = 4

  for (let offset = 0; offset < plan.items.length; offset += concurrency) {
    const group = plan.items.slice(offset, offset + concurrency)
    const generated = await Promise.all(
      group.map(async (item) => {
        try {
          return { item, comments: await generateItem(item, model), error: null }
        } catch (error) {
          return {
            item,
            comments: null,
            error: error instanceof Error ? error.message : 'Draft failed.',
          }
        }
      }),
    )

    for (const result of generated) {
      if (!result.comments) {
        failures.push({
          key: result.item.key,
          title: result.item.title,
          error: result.error || 'Draft failed.',
        })
        continue
      }
      items.push({
        key: result.item.key,
        title: result.item.title,
        shape: result.item.shape,
        speakers: result.item.speakers.map((speaker, index) => ({
          kind: speaker.kind,
          id: speaker.id,
          name: speaker.name,
          comment: result.comments![index]!.comment.trim(),
        })),
      })
    }
  }

  return {
    start: plan.start,
    limit: plan.limit,
    eligibleTargets: plan.eligibleTargets,
    model,
    items,
    failures,
  }
}
