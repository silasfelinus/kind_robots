// /server/utils/commentBackfillAnthropicPack.ts
// Packs several fully-rendered object-comment prompts into one read-only
// Anthropic request. Production validation/publication remains separate.
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
const voiceIndex = buildVoiceEvidenceIndex(archivedVoiceRecords)
const BANNED = /\b(component|wonderlab|museum|exhibit|star rating|rating|review|implementation|usability)\b/i

type DraftComment = {
  authorKind: 'BOT' | 'CHARACTER'
  authorId: number
  comment: string
}

type PackedItem = {
  key: string
  comments: DraftComment[]
}

type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string }>
  error?: { message?: string }
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
  for (let i = 0; i + size <= words.length; i += 1) {
    result.add(words.slice(i, i + size).join(' '))
  }
  return result
}

function sharedShingle(a: string, b: string): string | null {
  const aSet = shingles(a)
  for (const candidate of shingles(b)) {
    if (aSet.has(candidate)) return candidate
  }
  return null
}

function stripFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function promptSpeakers(item: ManualBackfillPlan['items'][number]): CommentVoiceEvidence[] {
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

function renderItem(item: ManualBackfillPlan['items'][number], index: number) {
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
    promptSpeakers(item),
    {
      shape: item.shape,
      maxSpeakers: item.shape === 'TRIO' ? 3 : 2,
    },
  )

  return [
    `=== ITEM ${index + 1}: ${item.key} ===`,
    prompt.user,
    `For this item return ${item.speakers.length} comment(s), preserving the exact supplied author kind/id order.`,
  ].join('\n')
}

function validateItem(
  planItem: ManualBackfillPlan['items'][number],
  packed: PackedItem,
): string | null {
  if (packed.key !== planItem.key) return `Key drift: expected ${planItem.key}, got ${packed.key}.`
  if (!Array.isArray(packed.comments) || packed.comments.length !== planItem.speakers.length) {
    return `Expected ${planItem.speakers.length} comments; received ${packed.comments?.length || 0}.`
  }

  for (const [index, comment] of packed.comments.entries()) {
    const expected = planItem.speakers[index]
    if (!expected) return `Missing expected speaker ${index + 1}.`
    if (comment.authorKind !== expected.kind || comment.authorId !== expected.id) {
      return `Author drift at slot ${index + 1}.`
    }
    const value = String(comment.comment || '').trim()
    const words = normalizeWords(value)
    if (value.length < 2 || value.length > 1200) return `${expected.name}: invalid length.`
    if (words.length < 4 || words.length > 120) return `${expected.name}: ${words.length} words outside 4–120.`
    if (BANNED.test(value)) return `${expected.name}: reviewer/museum language.`

    const key = speakerKey({ kind: expected.kind, id: expected.id })
    for (const sample of voiceIndex.get(key)?.samples || []) {
      const overlap = sharedShingle(value, sample.text)
      if (overlap) return `${expected.name}: archived overlap “${overlap}”.`
    }
    if (expected.sampleResponse) {
      const overlap = sharedShingle(value, expected.sampleResponse)
      if (overlap) return `${expected.name}: canonical overlap “${overlap}”.`
    }
  }
  return null
}

export async function draftPackedCommentBackfillSlice(options: {
  start?: number
  limit?: number
  model?: string
}) {
  const limit = Math.min(12, Math.max(1, Math.floor(options.limit || 8)))
  const plan = await planManualCommentBackfillSlice({
    start: options.start,
    limit,
  })
  const model = options.model || DEFAULT_MODEL
  const apiKey = String(
    process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
  ).trim()
  if (!apiKey) throw new Error('Anthropic API key is not configured.')

  const rendered = plan.items.map(renderItem).join('\n\n')
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 6000,
      temperature: 0.8,
      system: [
        'Write fresh, object-first Kind Robots comments for multiple independent objects.',
        'The supplied per-item prompts are authoritative. Archived samples are voice evidence only, never wording to copy or situations to continue.',
        'Do not invent major lore, named historical events, ownership, relationships, or capabilities unsupported by each object and speaker context.',
        'Vary length and rhythm naturally. Avoid making every voice a polished aphorism.',
        'Return only valid JSON.',
      ].join(' '),
      messages: [
        {
          role: 'user',
          content: [
            rendered,
            '',
            'Return exactly this envelope:',
            '{"items":[{"key":"REWARD:123","comments":[{"authorKind":"CHARACTER","authorId":123,"comment":"..."}]}]}',
            'Include every supplied item exactly once and preserve item order, author kind/id, and speaker order.',
          ].join('\n'),
        },
      ],
    }),
  })

  const body = (await response.json()) as AnthropicResponse
  if (!response.ok) {
    throw new Error(`Anthropic ${response.status}: ${body.error?.message || response.statusText}`)
  }
  const raw = body.content
    ?.filter((block) => block.type === 'text')
    .map((block) => block.text || '')
    .join('')
    .trim()
  if (!raw) throw new Error('Anthropic returned no text.')

  let parsed: unknown
  try {
    parsed = JSON.parse(stripFence(raw))
  } catch {
    throw new Error('Anthropic returned invalid packed JSON.')
  }
  const packedItems = (parsed as { items?: PackedItem[] })?.items
  if (!Array.isArray(packedItems)) throw new Error('Packed response is missing items array.')

  const resultItems: Array<{
    key: string
    title: string
    shape: ManualBackfillPlan['items'][number]['shape']
    speakers: Array<{
      kind: 'BOT' | 'CHARACTER'
      id: number
      name: string
      comment: string
    }>
  }> = []
  const failures: Array<{ key: string; title: string; error: string }> = []

  for (const [index, planItem] of plan.items.entries()) {
    const packed = packedItems[index]
    if (!packed) {
      failures.push({ key: planItem.key, title: planItem.title, error: 'Missing packed item.' })
      continue
    }
    const error = validateItem(planItem, packed)
    if (error) {
      failures.push({ key: planItem.key, title: planItem.title, error })
      continue
    }
    resultItems.push({
      key: planItem.key,
      title: planItem.title,
      shape: planItem.shape,
      speakers: planItem.speakers.map((speaker, speakerIndex) => ({
        kind: speaker.kind,
        id: speaker.id,
        name: speaker.name,
        comment: packed.comments[speakerIndex]!.comment.trim(),
      })),
    })
  }

  return {
    start: plan.start,
    limit: plan.limit,
    eligibleTargets: plan.eligibleTargets,
    model,
    items: resultItems,
    failures,
  }
}
