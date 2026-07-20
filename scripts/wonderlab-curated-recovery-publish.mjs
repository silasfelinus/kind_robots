// /scripts/wonderlab-curated-recovery-publish.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

const baseUrl = String(
  process.env.WONDERLAB_BASE_URL || 'https://kind-robots.vercel.app',
).replace(/\/$/, '')
const adminToken = String(
  process.env.WONDERLAB_ADMIN_TOKEN ||
    process.env.CYPRESS_BETA_ADMIN_TOKEN ||
    process.env.CYPRESS_API_KEY ||
    '',
).trim()
const configPath =
  process.env.WONDERLAB_CURATED_RECOVERY_CONFIG ||
  'config/wonderlab-curated-recovery-publish.json'
const outputDir =
  process.env.WONDERLAB_CURATED_RECOVERY_OUTPUT ||
  'wonderlab-curated-recovery-artifacts'
const validateOnly = process.env.WONDERLAB_CURATED_RECOVERY_VALIDATE_ONLY === '1'

const MAX_PUBLICATIONS = 20
const allowedExpectedStatuses = new Set(['PROPOSED', 'FAILED', 'REJECTED', 'APPROVED'])
const allowedReactionTypes = new Set(['LOVED', 'CLAPPED', 'NEUTRAL', 'BOOED'])
const terminalStatuses = new Set(['PUBLISHED', 'SUPERSEDED'])

await mkdir(outputDir, { recursive: true })

function assertCondition(condition, message) {
  if (!condition) throw new Error(message)
}

function positiveInteger(value, label) {
  const parsed = Number(value)
  assertCondition(
    Number.isInteger(parsed) && parsed > 0,
    `${label} must be a positive integer.`,
  )
  return parsed
}

function boundedString(value, label, maximum = 200) {
  assertCondition(
    typeof value === 'string' && value.trim(),
    `${label} is required.`,
  )
  const trimmed = value.trim()
  assertCondition(
    trimmed.length <= maximum,
    `${label} must be at most ${maximum} characters.`,
  )
  return trimmed
}

function wordCount(value) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function reviewerKey(reviewer) {
  return `${reviewer.kind}:${reviewer.id}`
}

function validateReviewer(value, label) {
  assertCondition(
    value && typeof value === 'object' && !Array.isArray(value),
    `${label} must be an object.`,
  )
  assertCondition(
    value.kind === 'BOT' || value.kind === 'CHARACTER',
    `${label}.kind must be BOT or CHARACTER.`,
  )
  return {
    kind: value.kind,
    id: positiveInteger(value.id, `${label}.id`),
    name: boundedString(value.name, `${label}.name`, 120),
    slug: boundedString(value.slug, `${label}.slug`, 120),
  }
}

function validatePublication(value, index) {
  const label = `publications[${index}]`
  assertCondition(
    value && typeof value === 'object' && !Array.isArray(value),
    `${label} must be an object.`,
  )
  const editedComment = boundedString(
    value.editedComment,
    `${label}.editedComment`,
    2400,
  )
  const words = wordCount(editedComment)
  assertCondition(
    words >= 20 && words <= 160,
    `${label}.editedComment must contain 20-160 words.`,
  )
  const rating = Number(value.rating)
  assertCondition(
    Number.isInteger(rating) && rating >= 1 && rating <= 5,
    `${label}.rating must be an integer from 1 to 5.`,
  )
  assertCondition(
    allowedReactionTypes.has(value.reactionType),
    `${label}.reactionType is invalid.`,
  )
  assertCondition(
    allowedExpectedStatuses.has(value.expectedStatus),
    `${label}.expectedStatus is invalid.`,
  )
  return {
    draftId: positiveInteger(value.draftId, `${label}.draftId`),
    componentId: positiveInteger(value.componentId, `${label}.componentId`),
    sourceKey: boundedString(value.sourceKey, `${label}.sourceKey`, 500),
    expectedStatus: value.expectedStatus,
    reviewer: validateReviewer(value.reviewer, `${label}.reviewer`),
    editedComment,
    rating,
    reactionType: value.reactionType,
  }
}

function validateConfig(value) {
  assertCondition(
    value && typeof value === 'object' && !Array.isArray(value),
    'Curated recovery config must be an object.',
  )
  assertCondition(value.version === 1, 'Curated recovery config version must be 1.')
  const minimumProductionCommit = boundedString(
    value.minimumProductionCommit,
    'minimumProductionCommit',
    40,
  )
  assertCondition(
    /^[0-9a-f]{40}$/.test(minimumProductionCommit),
    'minimumProductionCommit must be a full lowercase commit SHA.',
  )
  assertCondition(
    Array.isArray(value.publications) && value.publications.length > 0,
    'publications must contain at least one explicit curated draft.',
  )
  assertCondition(
    value.publications.length <= MAX_PUBLICATIONS,
    `publications may contain at most ${MAX_PUBLICATIONS} entries.`,
  )
  const publications = value.publications.map(validatePublication)
  assertCondition(
    new Set(publications.map((entry) => entry.draftId)).size === publications.length,
    'Publication draft IDs must be unique.',
  )
  assertCondition(
    new Set(
      publications.map(
        (entry) => `${entry.componentId}:${reviewerKey(entry.reviewer)}`,
      ),
    ).size === publications.length,
    'Each Component/reviewer pair may appear only once.',
  )
  return {
    version: 1,
    batchId: boundedString(value.batchId, 'batchId', 120),
    minimumProductionCommit,
    publications,
  }
}

async function writeJson(name, value) {
  await writeFile(
    `${outputDir}/${name}`,
    `${JSON.stringify(value, null, 2)}\n`,
  )
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'follow',
    ...options,
  })
  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { raw: text }
  }
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && typeof body.message === 'string'
        ? body.message
        : `${options.method || 'GET'} ${path} returned ${response.status}.`
    const error = new Error(message)
    error.status = response.status
    error.body = body
    throw error
  }
  return body
}

async function adminRequest(path, options = {}) {
  assertCondition(
    adminToken,
    'WONDERLAB_ADMIN_TOKEN (or the existing Cypress admin secret) is required.',
  )
  return requestJson(path, {
    ...options,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-beta-admin-token': adminToken,
      'x-admin-token': adminToken,
      'x-api-key': adminToken,
    },
  })
}

function responseDataArray(payload, label) {
  const data = payload && typeof payload === 'object' ? payload.data : null
  assertCondition(Array.isArray(data), `${label} did not return a data array.`)
  return data
}

function responseDataObject(payload, label) {
  const data = payload && typeof payload === 'object' ? payload.data : null
  assertCondition(
    data && typeof data === 'object' && !Array.isArray(data),
    `${label} did not return a data object.`,
  )
  return data
}

function assertDraftIdentity(draft, instruction, label) {
  assertCondition(draft && typeof draft === 'object', `${label} draft is missing.`)
  assertCondition(
    Number(draft.id) === instruction.draftId,
    `${label} returned the wrong draft ID.`,
  )
  assertCondition(
    Number(draft.componentId) === instruction.componentId,
    `${label} belongs to the wrong Component.`,
  )
  assertCondition(
    draft.author?.kind === instruction.reviewer.kind &&
      Number(draft.author?.id) === instruction.reviewer.id,
    `${label} has the wrong first-party author.`,
  )
}

async function loadDraft(instruction) {
  const payload = await adminRequest(
    `/api/admin/wonderlab/review-drafts?componentId=${instruction.componentId}&limit=200`,
  )
  const drafts = responseDataArray(payload, `Component ${instruction.componentId} drafts`)
  const draft = drafts.find((entry) => Number(entry?.id) === instruction.draftId)
  assertDraftIdentity(draft, instruction, `Draft ${instruction.draftId}`)
  return { payload, draft }
}

async function patchDraft(instruction, body, label) {
  const payload = await adminRequest(
    `/api/admin/wonderlab/review-drafts/${instruction.draftId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  )
  const draft = responseDataObject(payload, label)
  assertDraftIdentity(draft, instruction, label)
  return { payload, draft }
}

async function curateAndPublish(instruction) {
  const loaded = await loadDraft(instruction)
  let draft = loaded.draft
  assertCondition(
    !terminalStatuses.has(draft.status),
    `Draft ${instruction.draftId} is already terminal (${draft.status}).`,
  )
  assertCondition(
    draft.status === instruction.expectedStatus,
    `Draft ${instruction.draftId} status changed from reviewed ${instruction.expectedStatus} to ${draft.status}.`,
  )

  const edit = {
    editedComment: instruction.editedComment,
    rating: instruction.rating,
    reactionType: instruction.reactionType,
  }

  let recoveryPayload = null
  if (draft.status === 'FAILED' || draft.status === 'REJECTED') {
    const recovered = await patchDraft(
      instruction,
      { ...edit, status: 'PROPOSED' },
      `${instruction.reviewer.name} recovery`,
    )
    assertCondition(
      recovered.draft.status === 'PROPOSED',
      `Draft ${instruction.draftId} did not recover to PROPOSED.`,
    )
    recoveryPayload = recovered.payload
    draft = recovered.draft
  }

  if (draft.status === 'PROPOSED') {
    const approved = await patchDraft(
      instruction,
      { ...edit, status: 'APPROVED' },
      `${instruction.reviewer.name} approval`,
    )
    assertCondition(
      approved.draft.status === 'APPROVED',
      `Draft ${instruction.draftId} did not enter APPROVED state.`,
    )
    draft = approved.draft
    await writeJson(`approved-${instruction.draftId}.json`, approved.payload)
  } else {
    assertCondition(
      draft.status === 'APPROVED',
      `Draft ${instruction.draftId} cannot be published from ${draft.status}.`,
    )
  }

  const publishedPayload = await adminRequest(
    `/api/admin/wonderlab/review-drafts/${instruction.draftId}/publish`,
    { method: 'POST', body: '{}' },
  )
  const result = responseDataObject(
    publishedPayload,
    `${instruction.reviewer.name} publication`,
  )
  assertDraftIdentity(
    result.draft,
    instruction,
    `${instruction.reviewer.name} published`,
  )
  assertCondition(
    result.draft.status === 'PUBLISHED',
    `Draft ${instruction.draftId} did not enter PUBLISHED state.`,
  )
  positiveInteger(result.reactionId, `${instruction.reviewer.name} reactionId`)
  await writeJson(`published-${instruction.draftId}.json`, publishedPayload)

  return {
    instruction,
    previousStatus: loaded.draft.status,
    recovered: Boolean(recoveryPayload),
    reactionId: result.reactionId,
    created: result.created === true,
    draft: result.draft,
  }
}

async function run() {
  const config = validateConfig(JSON.parse(await readFile(configPath, 'utf8')))
  await writeJson('validated-config.json', config)

  if (validateOnly) {
    const summary = {
      valid: true,
      batchId: config.batchId,
      publicationCount: config.publications.length,
      draftIds: config.publications.map((entry) => entry.draftId),
    }
    await writeJson('validation-summary.json', summary)
    console.log(`Curated WonderLab recovery config is valid: ${config.batchId}.`)
    return summary
  }

  const published = []
  for (const instruction of config.publications) {
    published.push(await curateAndPublish(instruction))
    await writeJson('publication-progress.json', {
      batchId: config.batchId,
      published,
    })
  }

  assertCondition(
    new Set(published.map((entry) => Number(entry.reactionId))).size ===
      published.length,
    'Curated publications must resolve to distinct Reactions.',
  )

  const auditPayload = await adminRequest('/api/admin/wonderlab/review-rollout')
  const audit = responseDataObject(auditPayload, 'Post-publication rollout audit')
  assertCondition(audit.ready === true, 'Post-publication rollout audit is blocked.')
  assertCondition(
    Number(audit.metrics?.duplicateFirstPartyReviews || 0) === 0,
    'Duplicate first-party review groups appeared after publication.',
  )
  assertCondition(
    Number(audit.metrics?.unsafeFirstPartyReviews || 0) === 0,
    'Unsafe first-party review rows appeared after publication.',
  )
  assertCondition(
    Number(audit.metrics?.publishedDraftMismatches || 0) === 0,
    'Published draft links are mismatched after publication.',
  )
  await writeJson('review-rollout-audit-after.json', auditPayload)

  const summary = {
    stage: 'curated-recovery-publish',
    batchId: config.batchId,
    baseUrl,
    published: published.map((entry) => ({
      draftId: entry.instruction.draftId,
      componentId: entry.instruction.componentId,
      reviewer: entry.instruction.reviewer,
      previousStatus: entry.previousStatus,
      recovered: entry.recovered,
      reactionId: entry.reactionId,
      created: entry.created,
      comment: entry.instruction.editedComment,
      rating: entry.instruction.rating,
      reactionType: entry.instruction.reactionType,
    })),
    audit: {
      ready: audit.ready,
      metrics: audit.metrics,
    },
  }
  await writeJson('curated-recovery-summary.json', summary)
  console.log(JSON.stringify(summary, null, 2))
  return summary
}

try {
  await run()
} catch (error) {
  const failure = {
    message: error instanceof Error ? error.message : String(error),
    status:
      error && typeof error === 'object' && 'status' in error
        ? error.status
        : null,
    body:
      error && typeof error === 'object' && 'body' in error ? error.body : null,
  }
  await writeJson('failure.json', failure)
  console.error(failure.message)
  process.exitCode = 1
}
