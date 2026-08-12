// /server/utils/commentBackfillAnthropicPackLight.ts
// Bulk drafting version: canonical voice + one archived sample per speaker.
// The production release validator still checks the full archived corpus.
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

type DraftComment = { authorKind: 'BOT' | 'CHARACTER'; authorId: number; comment: string }
type PackedItem = { key: string; comments: DraftComment[] }
type AnthropicResponse = { content?: Array<{ type?: string; text?: string }>; error?: { message?: string } }

function words(value: string): string[] {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
}
function shingles(value: string, size = 8): Set<string> {
  const list = words(value)
  const result = new Set<string>()
  for (let i = 0; i + size <= list.length; i += 1) result.add(list.slice(i, i + size).join(' '))
  return result
}
function overlap(a: string, b: string): string | null {
  const left = shingles(a)
  for (const candidate of shingles(b)) if (left.has(candidate)) return candidate
  return null
}
function stripFence(value: string): string {
  return value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

function speakerEvidence(item: ManualBackfillPlan['items'][number]): CommentVoiceEvidence[] {
  return item.speakers.map((speaker) => {
    const evidence = voiceIndex.get(speakerKey({ kind: speaker.kind, id: speaker.id }))
    return {
      kind: speaker.kind,
      id: speaker.id,
      name: speaker.name,
      canonicalVoice: speaker.voice,
      sampleResponse: speaker.sampleResponse,
      archivedVoiceSamples: selectVoiceSamples(evidence, 1).map((sample) => sample.text),
    }
  })
}

function renderItem(item: ManualBackfillPlan['items'][number], index: number): string {
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
    speakerEvidence(item),
    { shape: item.shape, maxSpeakers: item.shape === 'TRIO' ? 3 : 2 },
  )
  return [`=== ITEM ${index + 1}: ${item.key} ===`, prompt.user].join('\n')
}

function validate(planItem: ManualBackfillPlan['items'][number], packed: PackedItem): string | null {
  if (packed.key !== planItem.key) return `Key drift: ${packed.key}`
  if (!Array.isArray(packed.comments) || packed.comments.length !== planItem.speakers.length) {
    return `Expected ${planItem.speakers.length} comments; got ${packed.comments?.length || 0}`
  }
  for (const [index, comment] of packed.comments.entries()) {
    const expected = planItem.speakers[index]
    if (!expected) return `Missing speaker ${index + 1}`
    if (comment.authorKind !== expected.kind || comment.authorId !== expected.id) return `Author drift at ${index + 1}`
    const value = String(comment.comment || '').trim()
    const count = words(value).length
    if (value.length < 2 || value.length > 1200 || count < 4 || count > 120) return `${expected.name}: invalid length`
    if (BANNED.test(value)) return `${expected.name}: reviewer/museum language`
    const key = speakerKey({ kind: expected.kind, id: expected.id })
    for (const sample of voiceIndex.get(key)?.samples || []) {
      const hit = overlap(value, sample.text)
      if (hit) return `${expected.name}: archived overlap “${hit}”`
    }
    if (expected.sampleResponse) {
      const hit = overlap(value, expected.sampleResponse)
      if (hit) return `${expected.name}: canonical overlap “${hit}”`
    }
  }
  return null
}

export async function draftLightPackedCommentBackfillSlice(options: {
  start?: number
  limit?: number
  model?: string
}) {
  const limit = Math.min(18, Math.max(1, Math.floor(options.limit || 12)))
  const plan = await planManualCommentBackfillSlice({ start: options.start, limit })
  const model = options.model || DEFAULT_MODEL
  const apiKey = String(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '').trim()
  if (!apiKey) throw new Error('Anthropic API key is not configured.')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 7000,
      temperature: 0.8,
      system: [
        'Write fresh, object-first Kind Robots comments for independent objects.',
        'Each item gives the authoritative object and exact speakers. Preserve author order and identity.',
        'Voice samples teach character only. Never continue their situation or copy wording.',
        'Do not invent named history, relationships, ownership, or capabilities unsupported by the item.',
        'Vary sentence length, rhythm, seriousness, and joke density. Avoid universal polished aphorisms.',
        'Return JSON only.',
      ].join(' '),
      messages: [{
        role: 'user',
        content: [
          ...plan.items.map(renderItem),
          'Return exactly {"items":[{"key":"TYPE:ID","comments":[{"authorKind":"BOT_OR_CHARACTER","authorId":123,"comment":"..."}]}]}. Include every item once, in order.',
        ].join('\n\n'),
      }],
    }),
  })

  const body = (await response.json()) as AnthropicResponse
  if (!response.ok) throw new Error(`Anthropic ${response.status}: ${body.error?.message || response.statusText}`)
  const raw = body.content?.filter((block) => block.type === 'text').map((block) => block.text || '').join('').trim()
  if (!raw) throw new Error('Anthropic returned no text.')

  let parsed: unknown
  try { parsed = JSON.parse(stripFence(raw)) } catch { throw new Error('Anthropic returned invalid packed JSON.') }
  const packedItems = (parsed as { items?: PackedItem[] })?.items
  if (!Array.isArray(packedItems)) throw new Error('Packed response missing items.')

  const items: Array<{
    key: string
    title: string
    shape: ManualBackfillPlan['items'][number]['shape']
    speakers: Array<{ kind: 'BOT' | 'CHARACTER'; id: number; name: string; comment: string }>
  }> = []
  const failures: Array<{ key: string; title: string; error: string }> = []

  for (const [index, planItem] of plan.items.entries()) {
    const packed = packedItems[index]
    if (!packed) {
      failures.push({ key: planItem.key, title: planItem.title, error: 'Missing packed item.' })
      continue
    }
    const error = validate(planItem, packed)
    if (error) {
      failures.push({ key: planItem.key, title: planItem.title, error })
      continue
    }
    items.push({
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

  return { start: plan.start, limit: plan.limit, eligibleTargets: plan.eligibleTargets, model, items, failures }
}
