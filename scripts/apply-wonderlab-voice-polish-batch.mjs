#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseUrl = String(
  process.env.WONDERLAB_BASE_URL || 'https://kind-robots.vercel.app',
).replace(/\/$/, '')
const token = String(process.env.WONDERLAB_ADMIN_TOKEN || '').trim()
const manifestPath = resolve(
  process.env.WONDERLAB_VOICE_POLISH_MANIFEST ||
    'config/wonderlab-voice-polish-batch-001.json',
)
const outputDir = resolve(
  process.env.WONDERLAB_VOICE_POLISH_OUTPUT ||
    'wonderlab-voice-polish-apply-artifacts',
)

if (!token) throw new Error('WONDERLAB_ADMIN_TOKEN is required.')

function sha256(value) {
  return createHash('sha256').update(String(value ?? '')).digest('hex')
}

function adminHeaders() {
  return {
    accept: 'application/json',
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'x-beta-admin-token': token,
    'x-admin-token': token,
    'x-api-key': token,
  }
}

async function request(path, { method = 'GET', body, admin = false } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: admin
      ? adminHeaders()
      : { accept: 'application/json', 'cache-control': 'no-store' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(
      payload?.message || payload?.statusMessage || `${method} ${path} returned ${response.status}.`,
    )
  }
  return payload?.data ?? payload
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`)
  }
}

function validateManifest(manifest) {
  if (manifest?.version !== 1) throw new Error('Unsupported voice-polish manifest version.')
  if (!manifest.batchId || typeof manifest.batchId !== 'string') {
    throw new Error('batchId is required.')
  }
  if (!/^[0-9a-f]{40}$/.test(String(manifest.minimumProductionCommit || ''))) {
    throw new Error('minimumProductionCommit must be a full commit SHA.')
  }
  if (!Array.isArray(manifest.revisions) || !manifest.revisions.length) {
    throw new Error('At least one revision is required.')
  }
  if (manifest.revisions.length > 20) {
    throw new Error('Voice-polish batches are limited to 20 reviews.')
  }

  const components = new Set()
  const draftIds = new Set()
  const reactionIds = new Set()
  for (const revision of manifest.revisions) {
    assertPositiveInteger(revision.draftId, 'draftId')
    assertPositiveInteger(revision.reactionId, 'reactionId')
    assertPositiveInteger(revision.componentId, 'componentId')
    assertPositiveInteger(revision.author?.id, 'author.id')
    if (!['BOT', 'CHARACTER'].includes(revision.author?.kind)) {
      throw new Error(`Draft ${revision.draftId} has an invalid author kind.`)
    }
    if (!/^[0-9a-f]{64}$/.test(String(revision.expectedCurrentCommentHash || ''))) {
      throw new Error(`Draft ${revision.draftId} has an invalid current-comment hash.`)
    }
    if (!String(revision.sourceKey || '').endsWith('.vue')) {
      throw new Error(`Draft ${revision.draftId} is missing a Vue source lock.`)
    }
    const editedComment = String(revision.editedComment || '').trim()
    if (!editedComment.length || editedComment.length > 2_000) {
      throw new Error(`Draft ${revision.draftId} revised flavor must be 1–2000 characters.`)
    }
    if (draftIds.has(revision.draftId) || reactionIds.has(revision.reactionId)) {
      throw new Error(`Duplicate draft or Reaction lock in manifest at draft ${revision.draftId}.`)
    }
    draftIds.add(revision.draftId)
    reactionIds.add(revision.reactionId)
    components.add(revision.componentId)
  }
  if (components.size > 10) {
    throw new Error('Voice-polish batches are limited to 10 Components.')
  }
}

function authorMatches(actual, expected) {
  return actual?.kind === expected.kind && Number(actual?.id) === expected.id
}

function findPublicReaction(reviews, reactionId) {
  return reviews.find((review) => Number(review.id) === reactionId)
}

function assertPublicLock(review, revision, publisherUserId) {
  if (!review) throw new Error(`Reaction ${revision.reactionId} is not publicly projected.`)
  if (Number(review.componentId) !== revision.componentId) {
    throw new Error(`Reaction ${revision.reactionId} Component lock changed.`)
  }
  if (Number(review.userId) !== publisherUserId) {
    throw new Error(`Reaction ${revision.reactionId} publisher lock changed.`)
  }
  if (!authorMatches(review.Author, revision.author)) {
    throw new Error(`Reaction ${revision.reactionId} author lock changed.`)
  }
  if (Number(review.rating) !== revision.expectedRating) {
    throw new Error(`Reaction ${revision.reactionId} rating changed.`)
  }
  if (review.reactionType !== revision.expectedReactionType) {
    throw new Error(`Reaction ${revision.reactionId} reaction type changed.`)
  }
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
validateManifest(manifest)
const version = await request('/api/version')
const results = []

for (const revision of manifest.revisions) {
  const beforeDraft = await request(
    `/api/admin/wonderlab/review-drafts/${revision.draftId}`,
    { admin: true },
  )
  if (beforeDraft.status !== 'PUBLISHED') {
    throw new Error(`Draft ${revision.draftId} is no longer PUBLISHED.`)
  }
  if (
    Number(beforeDraft.componentId) !== revision.componentId ||
    Number(beforeDraft.publishedReactionId) !== revision.reactionId ||
    !authorMatches(beforeDraft.author, revision.author)
  ) {
    throw new Error(`Draft ${revision.draftId} assignment lock changed.`)
  }
  if (beforeDraft.promptPayload?.provenance?.exhibitSourcePath !== revision.sourceKey) {
    throw new Error(`Draft ${revision.draftId} source lock changed.`)
  }
  if (Number(beforeDraft.rating) !== revision.expectedRating) {
    throw new Error(`Draft ${revision.draftId} rating lock changed.`)
  }
  if (beforeDraft.reactionType !== revision.expectedReactionType) {
    throw new Error(`Draft ${revision.draftId} reaction type lock changed.`)
  }

  const beforeReviews = await request(
    `/api/reactions/component/${revision.componentId}?voicePolish=${Date.now()}`,
  )
  const beforeReaction = findPublicReaction(beforeReviews, revision.reactionId)
  const publisherUserId = Number(beforeDraft.publisherUserId)
  assertPositiveInteger(publisherUserId, 'publisherUserId')
  assertPublicLock(beforeReaction, revision, publisherUserId)
  const publicCommentHash = sha256(beforeReaction.comment)
  const revisedCommentHash = sha256(revision.editedComment)
  if (publicCommentHash === revisedCommentHash) {
    if (beforeDraft.editedComment !== revision.editedComment) {
      throw new Error(`Draft ${revision.draftId} and its Reaction disagree after a prior revision.`)
    }
    results.push({
      draftId: revision.draftId,
      reactionId: revision.reactionId,
      componentId: revision.componentId,
      sourceKey: revision.sourceKey,
      author: revision.author,
      publisherUserId,
      rating: revision.expectedRating,
      reactionType: revision.expectedReactionType,
      previousCommentHash: revision.expectedCurrentCommentHash,
      revisedCommentHash,
      flavorLength: revision.editedComment.length,
      outcome: 'ALREADY_APPLIED',
    })
    console.log(
      `Already revised draft #${revision.draftId} / Reaction #${revision.reactionId} as ${revision.author.name}.`,
    )
    continue
  }
  if (publicCommentHash !== revision.expectedCurrentCommentHash) {
    throw new Error(`Reaction ${revision.reactionId} comment changed after curation.`)
  }

  const response = await request(
    `/api/admin/wonderlab/review-drafts/${revision.draftId}/revise`,
    {
      admin: true,
      method: 'PATCH',
      body: {
        editedComment: revision.editedComment,
        expectedComponentId: revision.componentId,
        expectedReactionId: revision.reactionId,
        expectedAuthorKind: revision.author.kind,
        expectedAuthorId: revision.author.id,
        expectedCurrentCommentHash: revision.expectedCurrentCommentHash,
      },
    },
  )

  const afterDraft = await request(
    `/api/admin/wonderlab/review-drafts/${revision.draftId}`,
    { admin: true },
  )
  const afterReviews = await request(
    `/api/reactions/component/${revision.componentId}?voicePolish=${Date.now()}-${revision.draftId}`,
  )
  const afterReaction = findPublicReaction(afterReviews, revision.reactionId)
  assertPublicLock(afterReaction, revision, publisherUserId)

  if (afterDraft.status !== 'PUBLISHED') {
    throw new Error(`Draft ${revision.draftId} publication state changed during revision.`)
  }
  if (afterDraft.editedComment !== revision.editedComment) {
    throw new Error(`Draft ${revision.draftId} did not retain the revised commentary.`)
  }
  if (afterReaction.comment !== revision.editedComment) {
    throw new Error(`Reaction ${revision.reactionId} did not project the revised commentary.`)
  }

  results.push({
    draftId: revision.draftId,
    reactionId: revision.reactionId,
    componentId: revision.componentId,
    sourceKey: revision.sourceKey,
    author: revision.author,
    publisherUserId,
    rating: revision.expectedRating,
    reactionType: revision.expectedReactionType,
    previousCommentHash: revision.expectedCurrentCommentHash,
    revisedCommentHash,
    flavorLength: revision.editedComment.length,
    outcome: 'REVISED',
    endpointResult: {
      reactionId: response.reactionId,
      previousCommentHash: response.previousCommentHash,
      revisedCommentHash: response.revisedCommentHash,
    },
  })
  console.log(
    `Revised draft #${revision.draftId} / Reaction #${revision.reactionId} as ${revision.author.name}.`,
  )
}

const flavorLengths = results.map((entry) => entry.flavorLength)
const report = {
  generatedAt: new Date().toISOString(),
  batchId: manifest.batchId,
  production: version,
  minimumProductionCommit: manifest.minimumProductionCommit,
  revisedReviews: results.length,
  revisedComponents: new Set(results.map((entry) => entry.componentId)).size,
  shortestFlavor: Math.min(...flavorLengths),
  longestFlavor: Math.max(...flavorLengths),
  results,
}
const markdown = [
  `## WonderLab voice-polish batch ${manifest.batchId}`,
  '',
  `- **Production:** \`${version.commit || 'unknown'}\` · deployment \`${version.deploymentId || 'unknown'}\``,
  `- **Published reviews revised in place:** ${report.revisedReviews}`,
  `- **Components covered:** ${report.revisedComponents}`,
  `- **Flavor length range:** ${report.shortestFlavor}–${report.longestFlavor} characters`,
  '- **Assignments changed:** 0',
  '- **Ratings / reaction types changed:** 0',
  '- **Publisher or publication links changed:** 0',
  '',
  '### Revised voices',
  '',
  ...results.map(
    (entry) =>
      `- Draft #${entry.draftId} / Reaction #${entry.reactionId} · Component #${entry.componentId} · **${entry.author.name}** (${entry.author.kind}) · ${entry.flavorLength} chars`,
  ),
  '',
].join('\n')

await mkdir(outputDir, { recursive: true })
await Promise.all([
  writeFile(
    resolve(outputDir, 'wonderlab-voice-polish-apply.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  ),
  writeFile(resolve(outputDir, 'wonderlab-voice-polish-apply.md'), markdown),
])
console.log(markdown)
