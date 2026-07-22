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
  process.env.WONDERLAB_VOICE_POLISH_PREFLIGHT_OUTPUT ||
    'wonderlab-voice-polish-preflight-artifacts',
)
const timeoutMs = Math.max(
  5_000,
  Number(process.env.WONDERLAB_VOICE_POLISH_PREFLIGHT_TIMEOUT_MS || 20_000),
)
const attempts = Math.max(
  1,
  Number(process.env.WONDERLAB_VOICE_POLISH_PREFLIGHT_ATTEMPTS || 2),
)

if (!token) throw new Error('WONDERLAB_ADMIN_TOKEN is required.')

function sha256(value) {
  return createHash('sha256').update(String(value ?? '')).digest('hex')
}

function adminHeaders() {
  return {
    accept: 'application/json',
    'cache-control': 'no-store',
    'x-beta-admin-token': token,
    'x-admin-token': token,
    'x-api-key': token,
  }
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}

async function request(path) {
  let lastError = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: adminHeaders(),
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.statusMessage || `${path} returned ${response.status}.`,
        )
      }
      if (!payload || typeof payload !== 'object') {
        throw new Error(`${path} returned a non-JSON response.`)
      }
      return payload?.data ?? payload
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error
      if (attempt < attempts) await sleep(attempt * 1_000)
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to read ${path}.`)
}

function authorRef(value) {
  if (!value || typeof value !== 'object') return null
  return {
    kind: value.kind ?? null,
    id: Number(value.id) || null,
  }
}

function authorMatches(actual, expected) {
  return actual?.kind === expected.kind && Number(actual?.id) === expected.id
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const version = await request('/api/version')
const results = []

for (const revision of manifest.revisions) {
  const entry = {
    canonicalOrder: revision.canonicalOrder,
    draftId: revision.draftId,
    expected: {
      status: 'PUBLISHED',
      componentId: revision.componentId,
      reactionId: revision.reactionId,
      author: authorRef(revision.author),
      sourceKey: revision.sourceKey,
      rating: revision.expectedRating,
      reactionType: revision.expectedReactionType,
      currentCommentHash: revision.expectedCurrentCommentHash,
    },
    actual: null,
    checks: null,
    error: null,
  }

  try {
    const draft = await request(
      `/api/admin/wonderlab/review-drafts/${revision.draftId}`,
    )
    const reaction = await request(
      `/api/admin/wonderlab/reactions/${revision.reactionId}`,
    )
    const sourceKey =
      draft?.promptPayload?.provenance?.exhibitSourcePath ?? null
    const actual = {
      status: draft?.status ?? null,
      componentId: Number(draft?.componentId) || null,
      reactionId: Number(draft?.publishedReactionId) || null,
      author: authorRef(draft?.author),
      sourceKey,
      rating: Number(draft?.rating),
      reactionType: draft?.reactionType ?? null,
      publisherUserId: Number(draft?.publisherUserId) || null,
      draftCommentHash: sha256(
        draft?.finalComment ?? draft?.editedComment ?? draft?.generatedComment ?? '',
      ),
      publicReactionId: Number(reaction?.id) || null,
      publicComponentId: Number(reaction?.componentId) || null,
      publicAuthor: authorRef(reaction?.Author),
      publicPublisherUserId: Number(reaction?.userId) || null,
      publicRating: Number(reaction?.rating),
      publicReactionType: reaction?.reactionType ?? null,
      publicCommentHash: sha256(reaction?.comment ?? ''),
    }
    const checks = {
      publicationState: actual.status === 'PUBLISHED',
      componentAssignment: actual.componentId === revision.componentId,
      reactionAssignment: actual.reactionId === revision.reactionId,
      reviewerAssignment: authorMatches(actual.author, revision.author),
      sourceLock: actual.sourceKey === revision.sourceKey,
      ratingLock: actual.rating === revision.expectedRating,
      reactionTypeLock:
        actual.reactionType === revision.expectedReactionType,
      publicReactionIdentity: actual.publicReactionId === revision.reactionId,
      publicComponentLock:
        actual.publicComponentId === revision.componentId,
      publicReviewerLock:
        authorMatches(actual.publicAuthor, revision.author),
      publicPublisherLock:
        actual.publicPublisherUserId === actual.publisherUserId,
      publicRatingLock:
        actual.publicRating === revision.expectedRating,
      publicReactionTypeLock:
        actual.publicReactionType === revision.expectedReactionType,
      draftProjectionAgreement:
        actual.draftCommentHash === actual.publicCommentHash,
      expectedCurrentHash:
        actual.publicCommentHash === revision.expectedCurrentCommentHash,
      alreadyApplied:
        actual.publicCommentHash === sha256(revision.editedComment),
    }
    entry.actual = actual
    entry.checks = checks
  } catch (error) {
    entry.error = error instanceof Error ? error.message : String(error)
  }

  results.push(entry)
}

const blockers = results.filter((entry) => {
  if (entry.error) return true
  const checks = entry.checks || {}
  const invariantChecks = Object.entries(checks).filter(
    ([name]) => name !== 'expectedCurrentHash' && name !== 'alreadyApplied',
  )
  if (invariantChecks.some(([, passed]) => passed !== true)) return true
  return checks.alreadyApplied !== true && checks.expectedCurrentHash !== true
})

const report = {
  generatedAt: new Date().toISOString(),
  batchId: manifest.batchId,
  manifestPath,
  production: version,
  revisions: results.length,
  blockers: blockers.length,
  results,
}

const markdown = [
  `## WonderLab voice-polish preflight ${manifest.batchId}`,
  '',
  `- **Production:** \`${version.commit || 'unknown'}\` · deployment \`${version.deploymentId || 'unknown'}\``,
  `- **Revisions inspected:** ${results.length}`,
  `- **Blocking lock mismatches or read errors:** ${blockers.length}`,
  '- **Mutation boundary:** read-only; no ReviewDraft or Reaction was edited',
  '',
  ...blockers.map((entry) => {
    const failed = entry.error
      ? entry.error
      : Object.entries(entry.checks || {})
          .filter(([name, passed]) =>
            !['expectedCurrentHash', 'alreadyApplied'].includes(name) && passed !== true,
          )
          .map(([name]) => name)
          .join(', ') || 'comment hash differs from both expected and revised text'
    return `- Draft #${entry.draftId} / Reaction #${entry.expected.reactionId}: ${failed}`
  }),
  '',
].join('\n')

await mkdir(outputDir, { recursive: true })
await Promise.all([
  writeFile(
    resolve(outputDir, 'wonderlab-voice-polish-preflight.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  ),
  writeFile(
    resolve(outputDir, 'wonderlab-voice-polish-preflight.md'),
    markdown,
  ),
])

console.log(markdown)
if (blockers.length) process.exitCode = 1
