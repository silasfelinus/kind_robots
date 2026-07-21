#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseUrl = String(
  process.env.WONDERLAB_BASE_URL || 'https://kind-robots.vercel.app',
).replace(/\/$/, '')
const token = String(process.env.WONDERLAB_ADMIN_TOKEN || '').trim()
const outputDir = resolve(
  process.env.WONDERLAB_VOICE_POLISH_OUTPUT || 'wonderlab-voice-polish-artifacts',
)
const reviewLimit = positiveInteger(process.env.WONDERLAB_VOICE_POLISH_LIMIT, 120)
const maxDraftId = positiveInteger(process.env.WONDERLAB_VOICE_POLISH_MAX_DRAFT_ID, 260)
const concurrency = Math.min(
  20,
  positiveInteger(process.env.WONDERLAB_VOICE_POLISH_CONCURRENCY, 12),
)

if (!token) throw new Error('WONDERLAB_ADMIN_TOKEN is required.')

function positiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function sha256(value) {
  return createHash('sha256').update(String(value ?? '')).digest('hex')
}

async function request(path, { admin = false, allowNotFound = false } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: admin
      ? {
          accept: 'application/json',
          'x-beta-admin-token': token,
          'x-admin-token': token,
          'x-api-key': token,
        }
      : { accept: 'application/json' },
  })

  if (allowNotFound && response.status === 404) return null
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || `${path} returned ${response.status}.`)
  }
  return body?.data ?? body
}

async function mapConcurrent(values, worker, limit) {
  const output = new Array(values.length)
  let cursor = 0

  async function consume() {
    while (cursor < values.length) {
      const index = cursor++
      output[index] = await worker(values[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, consume))
  return output
}

const technicalPatterns = [
  ['component-summary', /\b(?:the\s+)?component\b/gi, 2],
  ['template-language', /\btemplate(?:\s+composes|\s+uses|\s+declares)?\b/gi, 3],
  ['function-inventory', /\b(?:function|functions|source-defined functions)\b/gi, 3],
  ['implementation-tokens', /\b(?:props?|emits?|imports?|computed|watchers?|v-model|store|endpoint|api)\b/gi, 2],
  ['source-audit-language', /\b(?:native elements|static interface text|source facts?|source-defined)\b/gi, 4],
  ['generic-review-language', /\b(?:structured approach|functionality|utilizes|implements|presents a structured|gets the job done)\b/gi, 2],
  ['identifier-heavy', /`[^`]{2,80}`/g, 1],
]

function technicalSignals(comment) {
  const signals = []
  let score = 0
  for (const [name, pattern, weight] of technicalPatterns) {
    const matches = comment.match(pattern) || []
    if (!matches.length) continue
    signals.push({ name, count: matches.length, weight })
    score += matches.length * weight
  }
  return { score, signals }
}

function authorProfilePath(author) {
  return author.kind === 'BOT'
    ? `/api/bots/${author.id}`
    : `/api/characters/${author.id}`
}

function publicVoiceProfile(author, profile) {
  if (author.kind === 'BOT') {
    return {
      id: author.id,
      kind: author.kind,
      name: profile?.name || author.name,
      slug: profile?.slug || null,
      personality: profile?.personality || null,
      narrativeVoice: profile?.narrativeVoice || null,
      sampleResponse: profile?.sampleResponse || null,
      tagline: profile?.tagline || null,
      description: profile?.description || null,
      botIntro: profile?.botIntro || null,
    }
  }

  return {
    id: author.id,
    kind: author.kind,
    name: profile?.name || author.name,
    slug: profile?.slug || null,
    personality: profile?.personality || null,
    voice: profile?.voice || null,
    sampleResponse: profile?.sampleResponse || null,
    drive: profile?.drive || null,
    quirks: profile?.quirks || null,
    backstory: profile?.backstory || null,
  }
}

const [version, components] = await Promise.all([
  request('/api/version'),
  request('/api/components'),
])
const componentMap = new Map(
  components.map((component) => [Number(component.id), component]),
)

const draftIds = Array.from({ length: maxDraftId }, (_, index) => index + 1)
const scannedDrafts = await mapConcurrent(
  draftIds,
  (id) =>
    request(`/api/admin/wonderlab/review-drafts/${id}`, {
      admin: true,
      allowNotFound: true,
    }),
  concurrency,
)

const publishedDrafts = scannedDrafts
  .filter(
    (draft) =>
      draft?.status === 'PUBLISHED' &&
      Number.isInteger(Number(draft?.publishedReactionId)) &&
      Number(draft.publishedReactionId) > 0,
  )
  .sort((left, right) => Number(left.id) - Number(right.id))
  .slice(0, reviewLimit)

if (publishedDrafts.length < reviewLimit) {
  throw new Error(
    `Only ${publishedDrafts.length} published drafts were found through ReviewDraft #${maxDraftId}; expected ${reviewLimit}.`,
  )
}

const authorKeys = Array.from(
  new Map(
    publishedDrafts.map((draft) => [
      `${draft.author.kind}:${draft.author.id}`,
      draft.author,
    ]),
  ).values(),
)
const authorProfiles = new Map()
await mapConcurrent(
  authorKeys,
  async (author) => {
    const profile = await request(authorProfilePath(author))
    authorProfiles.set(`${author.kind}:${author.id}`, publicVoiceProfile(author, profile))
  },
  concurrency,
)

const inventory = publishedDrafts.map((draft) => {
  const component = componentMap.get(Number(draft.componentId)) || {}
  const comment = String(draft.finalComment || draft.editedComment || draft.generatedComment || '')
  const analysis = technicalSignals(comment)
  const provenance = draft.promptPayload?.provenance || null

  return {
    draft: {
      id: Number(draft.id),
      status: draft.status,
      publishedReactionId: Number(draft.publishedReactionId),
      publisherUserId: Number(draft.publisherUserId),
      publishedAt: draft.publishedAt,
      updatedAt: draft.updatedAt,
      rating: Number(draft.rating),
      reactionType: draft.reactionType,
      generatedComment: draft.generatedComment,
      editedComment: draft.editedComment,
      currentComment: comment,
      currentCommentHash: sha256(comment),
    },
    component: {
      id: Number(draft.componentId),
      name: component.componentName || draft.componentName || '',
      title: component.title || draft.componentTitle || null,
      sourceKey: component.sourceKey || provenance?.exhibitSourcePath || '',
      category: component.category || null,
      tags: component.tags || null,
    },
    author: authorProfiles.get(`${draft.author.kind}:${draft.author.id}`),
    provenance,
    technicalScore: analysis.score,
    technicalSignals: analysis.signals,
  }
})

const ranked = [...inventory].sort(
  (left, right) =>
    right.technicalScore - left.technicalScore || left.draft.id - right.draft.id,
)
const flagged = ranked.filter((entry) => entry.technicalScore >= 4)
const report = {
  generatedAt: new Date().toISOString(),
  production: version,
  scan: {
    requestedPublishedReviews: reviewLimit,
    scannedDraftIds: maxDraftId,
    firstDraftId: inventory[0]?.draft.id ?? null,
    lastDraftId: inventory.at(-1)?.draft.id ?? null,
    flaggedTechnicalReviews: flagged.length,
  },
  inventory,
  rankedTechnicalCandidates: ranked,
}

const markdown = [
  '## WonderLab early-review voice-polish inventory',
  '',
  `- **Production:** \`${version.commit || 'unknown'}\` · deployment \`${version.deploymentId || 'unknown'}\``,
  `- **Oldest published reviews inventoried:** ${inventory.length}`,
  `- **Draft range:** #${report.scan.firstDraftId}–#${report.scan.lastDraftId}`,
  `- **Technical/template-heavy candidates:** ${flagged.length}`,
  '- **Boundary:** read-only; no ReviewDraft or Reaction was edited',
  '',
  '### Highest-priority voice rewrites',
  '',
  ...ranked.slice(0, 25).map(
    (entry) =>
      `- Draft #${entry.draft.id} / Reaction #${entry.draft.publishedReactionId} · Component #${entry.component.id} **${entry.component.name}** · **${entry.author.name}** (${entry.author.kind}) · technical score ${entry.technicalScore}`,
  ),
  '',
  'The JSON artifact contains the exact current-comment hashes, original assignments, Component/source provenance, and canonical public voice profiles needed for guarded in-place revision.',
  '',
].join('\n')

await mkdir(outputDir, { recursive: true })
await Promise.all([
  writeFile(
    resolve(outputDir, 'wonderlab-voice-polish-inventory.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  ),
  writeFile(resolve(outputDir, 'wonderlab-voice-polish-comment.md'), markdown),
])

console.log(markdown)
