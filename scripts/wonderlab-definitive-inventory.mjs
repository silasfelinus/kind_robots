#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseUrl = String(process.env.WONDERLAB_BASE_URL || 'https://kind-robots.vercel.app').replace(/\/$/, '')
const token = String(process.env.WONDERLAB_ADMIN_TOKEN || '').trim()
const outputDir = resolve(process.env.WONDERLAB_DEFINITIVE_OUTPUT || 'wonderlab-definitive-artifacts')
const concurrency = Math.min(20, Math.max(1, Number(process.env.WONDERLAB_DEFINITIVE_CONCURRENCY || 12)))
const chunkSize = Math.min(100, Math.max(1, Number(process.env.WONDERLAB_DEFINITIVE_CHUNK_SIZE || 20)))

if (!token) throw new Error('WONDERLAB_ADMIN_TOKEN is required.')

function sha256(value) {
  return createHash('sha256').update(String(value ?? '')).digest('hex')
}

async function request(path, { admin = false, allowNotFound = false } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: admin
      ? { accept: 'application/json', 'x-beta-admin-token': token, 'x-admin-token': token, 'x-api-key': token }
      : { accept: 'application/json' },
  })
  if (allowNotFound && response.status === 404) return null
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.message || `${path} returned ${response.status}.`)
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

function authorProfilePath(author) {
  return author.kind === 'BOT' ? `/api/bots/${author.id}` : `/api/characters/${author.id}`
}

const [version, components, corpusStats] = await Promise.all([
  request('/api/version'),
  request('/api/components'),
  request('/api/admin/wonderlab/review-drafts/stats?status=PUBLISHED', { admin: true }),
])

const highestDraftId = Number(corpusStats?.highestDraftId) || 0
const expectedPublishedReviews = Number(corpusStats?.reviewDrafts) || 0
if (!highestDraftId || !expectedPublishedReviews) {
  throw new Error('No published WonderLab ReviewDrafts were found.')
}

const draftIds = Array.from({ length: highestDraftId }, (_, index) => index + 1)
const scanned = await mapConcurrent(
  draftIds,
  (id) => request(`/api/admin/wonderlab/review-drafts/${id}`, { admin: true, allowNotFound: true }),
  concurrency,
)

const publishedDrafts = scanned
  .filter((draft) => draft?.status === 'PUBLISHED' && Number(draft?.publishedReactionId) > 0)
  .sort((left, right) => Number(left.id) - Number(right.id))

if (publishedDrafts.length !== expectedPublishedReviews) {
  throw new Error(
    `Published ReviewDraft scan was incomplete: stats reported ${expectedPublishedReviews}, but the ID scan captured ${publishedDrafts.length}.`,
  )
}

const componentMap = new Map(components.map((component) => [Number(component.id), component]))
const authors = Array.from(new Map(publishedDrafts.map((draft) => [`${draft.author.kind}:${draft.author.id}`, draft.author])).values())
const authorProfiles = new Map()
await mapConcurrent(authors, async (author) => {
  authorProfiles.set(`${author.kind}:${author.id}`, await request(authorProfilePath(author)))
}, concurrency)

const inventory = publishedDrafts.map((draft) => {
  const component = componentMap.get(Number(draft.componentId)) || {}
  const currentComment = String(draft.finalComment || draft.editedComment || draft.generatedComment || '')
  return {
    draftId: Number(draft.id),
    publishedReactionId: Number(draft.publishedReactionId),
    componentId: Number(draft.componentId),
    componentName: component.componentName || draft.componentName || '',
    componentTitle: component.title || draft.componentTitle || null,
    sourceKey: component.sourceKey || draft.promptPayload?.provenance?.exhibitSourcePath || '',
    author: draft.author,
    authorProfile: authorProfiles.get(`${draft.author.kind}:${draft.author.id}`) || null,
    rating: Number(draft.rating),
    reactionType: draft.reactionType,
    currentComment,
    currentCommentHash: sha256(currentComment),
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    publishedAt: draft.publishedAt,
    publisherUserId: Number(draft.publisherUserId),
    provenance: draft.promptPayload?.provenance || null,
  }
})

const generatedAt = new Date().toISOString()
const report = {
  generatedAt,
  production: version,
  scan: {
    highestDraftId,
    publishedReviews: inventory.length,
    expectedPublishedReviews,
    firstDraftId: inventory[0]?.draftId ?? null,
    lastDraftId: inventory.at(-1)?.draftId ?? null,
  },
  inventory,
}

const chunks = Array.from({ length: Math.ceil(inventory.length / chunkSize) }, (_, index) => {
  const start = index * chunkSize
  const entries = inventory.slice(start, start + chunkSize)
  return {
    generatedAt,
    production: version,
    chunk: {
      index: index + 1,
      fileName: `wonderlab-definitive-inventory-chunk-${String(index + 1).padStart(3, '0')}.json`,
      chunkSize,
      canonicalStart: start + 1,
      canonicalEnd: start + entries.length,
      publishedReviews: entries.length,
      firstDraftId: entries[0]?.draftId ?? null,
      lastDraftId: entries.at(-1)?.draftId ?? null,
    },
    inventory: entries,
  }
})

const chunkIndex = {
  generatedAt,
  production: version,
  scan: report.scan,
  chunkSize,
  chunks: chunks.map(({ chunk }) => chunk),
}

const markdown = [
  '## WonderLab definitive commentary inventory',
  '',
  `- **Production:** \`${version.commit || 'unknown'}\` · deployment \`${version.deploymentId || 'unknown'}\``,
  `- **Published reviews captured:** ${inventory.length} / ${expectedPublishedReviews}`,
  `- **Draft range:** #${report.scan.firstDraftId ?? '?'}–#${report.scan.lastDraftId ?? '?'}`,
  `- **Highest draft ID scanned:** #${highestDraftId}`,
  `- **Chronological chunk files:** ${chunks.length} × up to ${chunkSize} reviews`,
  '- **Boundary:** read-only; no ReviewDraft or Reaction was edited',
  '',
  'The full JSON artifact contains the exact current comments and hashes, stars, reaction IDs, reviewer assignments and voice profiles required for guarded in-place rewrite batches.',
  'The index and chronological chunk files expose the same data in reviewable 20-entry slices.',
  '',
].join('\n')

await mkdir(outputDir, { recursive: true })
await Promise.all([
  writeFile(resolve(outputDir, 'wonderlab-definitive-inventory.json'), `${JSON.stringify(report, null, 2)}\n`),
  writeFile(resolve(outputDir, 'wonderlab-definitive-inventory-index.json'), `${JSON.stringify(chunkIndex, null, 2)}\n`),
  writeFile(resolve(outputDir, 'wonderlab-definitive-inventory.md'), markdown),
  ...chunks.map((chunk) =>
    writeFile(resolve(outputDir, chunk.chunk.fileName), `${JSON.stringify(chunk, null, 2)}\n`),
  ),
])
console.log(markdown)
