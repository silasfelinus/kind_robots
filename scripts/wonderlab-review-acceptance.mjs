// /scripts/wonderlab-review-acceptance.mjs
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
  process.env.WONDERLAB_REVIEW_CONFIG ||
  'config/wonderlab-review-acceptance.json'
const outputDir =
  process.env.WONDERLAB_REVIEW_OUTPUT || 'wonderlab-review-acceptance-artifacts'
const requestedStage = String(process.env.WONDERLAB_REVIEW_ACTION || '').trim()
const validateOnly = process.env.WONDERLAB_REVIEW_VALIDATE_ONLY === '1'

const allowedStages = new Set(['generate', 'publish', 'audit'])
const allowedReactionTypes = new Set(['LOVED', 'CLAPPED', 'NEUTRAL', 'BOOED'])
const terminalDraftStatuses = new Set(['PUBLISHED', 'SUPERSEDED'])

await mkdir(outputDir, { recursive: true })

const jsonHeaders = {
  accept: 'application/json',
  'content-type': 'application/json',
}
const adminHeaders = {
  ...jsonHeaders,
  'x-beta-admin-token': adminToken,
  'x-admin-token': adminToken,
  'x-api-key': adminToken,
}

function assertCondition(condition, message) {
  if (!condition) throw new Error(message)
}

function positiveInteger(value, label) {
  const parsed = Number(value)
  assertCondition(Number.isInteger(parsed) && parsed > 0, `${label} must be a positive integer.`)
  return parsed
}

function boundedString(value, label, maximum = 200) {
  assertCondition(typeof value === 'string' && value.trim(), `${label} is required.`)
  const trimmed = value.trim()
  assertCondition(trimmed.length <= maximum, `${label} must be at most ${maximum} characters.`)
  return trimmed
}

function wordCount(value) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function authorKey(author) {
  return `${author.kind}:${author.id}`
}

function draftAuthor(draft) {
  if (draft?.authorBotId && !draft?.authorCharacterId) {
    return { kind: 'BOT', id: Number(draft.authorBotId) }
  }
  if (draft?.authorCharacterId && !draft?.authorBotId) {
    return { kind: 'CHARACTER', id: Number(draft.authorCharacterId) }
  }
  return null
}

function validateReviewer(value, index) {
  assertCondition(value && typeof value === 'object' && !Array.isArray(value), `reviewers[${index}] must be an object.`)
  assertCondition(value.kind === 'BOT' || value.kind === 'CHARACTER', `reviewers[${index}].kind must be BOT or CHARACTER.`)
  return {
    kind: value.kind,
    id: positiveInteger(value.id, `reviewers[${index}].id`),
    name: boundedString(value.name, `reviewers[${index}].name`, 120),
    slug: boundedString(value.slug, `reviewers[${index}].slug`, 120),
  }
}

function validatePublication(value, index, reviewers) {
  assertCondition(value && typeof value === 'object' && !Array.isArray(value), `publications[${index}] must be an object.`)
  const reviewer = validateReviewer(value.reviewer, index)
  assertCondition(
    reviewers.some((candidate) => authorKey(candidate) === authorKey(reviewer)),
    `publications[${index}] references a reviewer outside the acceptance manifest.`,
  )
  const editedComment = boundedString(
    value.editedComment,
    `publications[${index}].editedComment`,
    2400,
  )
  const words = wordCount(editedComment)
  assertCondition(
    words >= 20 && words <= 160,
    `publications[${index}].editedComment must contain 20-160 words.`,
  )
  const rating = Number(value.rating)
  assertCondition(
    Number.isInteger(rating) && rating >= 1 && rating <= 5,
    `publications[${index}].rating must be an integer from 1 to 5.`,
  )
  assertCondition(
    allowedReactionTypes.has(value.reactionType),
    `publications[${index}].reactionType is invalid.`,
  )
  return {
    draftId: positiveInteger(value.draftId, `publications[${index}].draftId`),
    reviewer,
    editedComment,
    rating,
    reactionType: value.reactionType,
  }
}

function validateConfig(value) {
  assertCondition(value && typeof value === 'object' && !Array.isArray(value), 'Acceptance config must be an object.')
  assertCondition(value.version === 1, 'Acceptance config version must be 1.')
  assertCondition(allowedStages.has(value.stage), 'Acceptance config stage must be generate, publish, or audit.')
  assertCondition(value.component && typeof value.component === 'object', 'Acceptance component is required.')

  const component = {
    id: positiveInteger(value.component.id, 'component.id'),
    sourceKey: boundedString(value.component.sourceKey, 'component.sourceKey', 500),
    title: boundedString(value.component.title, 'component.title', 200),
  }
  assertCondition(Array.isArray(value.reviewers) && value.reviewers.length === 2, 'Acceptance requires exactly two representative reviewers.')
  const reviewers = value.reviewers.map(validateReviewer)
  assertCondition(new Set(reviewers.map(authorKey)).size === reviewers.length, 'Acceptance reviewers must be unique.')

  const generation = value.generation && typeof value.generation === 'object'
    ? {
        model: boundedString(value.generation.model || 'gpt-4o-mini', 'generation.model', 100),
        regenerate: value.generation.regenerate === true,
      }
    : { model: 'gpt-4o-mini', regenerate: false }
  assertCondition(/^[a-zA-Z0-9._:-]+$/.test(generation.model), 'generation.model contains invalid characters.')

  const publicationRows = Array.isArray(value.publications) ? value.publications : []
  const publications = publicationRows.map((entry, index) =>
    validatePublication(entry, index, reviewers),
  )
  if (value.stage === 'publish') {
    assertCondition(publications.length === reviewers.length, 'Publish stage requires one curated publication per reviewer.')
    assertCondition(new Set(publications.map((entry) => entry.draftId)).size === publications.length, 'Publication draft IDs must be unique.')
    assertCondition(new Set(publications.map((entry) => authorKey(entry.reviewer))).size === reviewers.length, 'Publish stage must cover every representative reviewer exactly once.')
  } else {
    assertCondition(publications.length === 0, `${value.stage} stage must not contain publication instructions.`)
  }

  return {
    version: value.version,
    stage: value.stage,
    component,
    reviewers,
    generation,
    publications,
  }
}

async function writeJson(name, value) {
  await writeFile(`${outputDir}/${name}`, `${JSON.stringify(value, null, 2)}\n`)
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

async function publicRequest(path) {
  return requestJson(path, { headers: jsonHeaders })
}

async function adminRequest(path, options = {}) {
  assertCondition(adminToken, 'WONDERLAB_ADMIN_TOKEN (or the existing Cypress admin secret) is required.')
  return requestJson(path, {
    ...options,
    headers: adminHeaders,
  })
}

function responseDataArray(payload, label) {
  const data = payload && typeof payload === 'object' ? payload.data : null
  assertCondition(Array.isArray(data), `${label} did not return a data array.`)
  return data
}

function responseDataObject(payload, label) {
  const data = payload && typeof payload === 'object' ? payload.data : null
  assertCondition(data && typeof data === 'object' && !Array.isArray(data), `${label} did not return a data object.`)
  return data
}

function assertAuditReady(payload, label) {
  const data = responseDataObject(payload, label)
  const blocked = Array.isArray(data.checks)
    ? data.checks.filter((check) => check?.ok !== true).map((check) => check?.key || 'unknown')
    : ['checks-unavailable']
  assertCondition(data.ready === true && blocked.length === 0, `${label} is blocked: ${blocked.join(', ')}`)
  return data
}

function validateDraftIdentity(draft, config, reviewer, label) {
  assertCondition(draft && typeof draft === 'object', `${label} draft is missing.`)
  assertCondition(Number(draft.componentId) === config.component.id, `${label} draft belongs to Component ${draft.componentId}, expected ${config.component.id}.`)
  const author = draftAuthor(draft)
  assertCondition(author && authorKey(author) === authorKey(reviewer), `${label} draft author does not match ${reviewer.name}.`)
}

async function loadAcceptanceContext(config) {
  const [versionPayload, componentsPayload, auditPayload] = await Promise.all([
    publicRequest('/api/version'),
    publicRequest('/api/components'),
    adminRequest('/api/admin/wonderlab/review-rollout'),
  ])
  const version = responseDataObject(versionPayload, 'Production version')
  const components = responseDataArray(componentsPayload, 'Component registry')
  const audit = assertAuditReady(auditPayload, 'WonderLab rollout audit')
  const component = components.find((entry) => Number(entry?.id) === config.component.id)
  assertCondition(component, `Component ${config.component.id} is missing from production.`)
  assertCondition(component.sourceKey === config.component.sourceKey, `Component ${config.component.id} source identity changed.`)
  assertCondition(component.isDiscovered === true, `Component ${config.component.id} is no longer discovered.`)

  return { version, components, component, audit, auditPayload }
}

async function generateDrafts(config, context) {
  const generated = []
  for (const reviewer of config.reviewers) {
    const authorField = reviewer.kind === 'BOT' ? 'authorBotId' : 'authorCharacterId'
    const payload = await adminRequest('/api/admin/wonderlab/review-drafts/generate', {
      method: 'POST',
      body: JSON.stringify({
        componentId: config.component.id,
        [authorField]: reviewer.id,
        model: config.generation.model,
        regenerate: config.generation.regenerate,
      }),
    })
    const result = responseDataObject(payload, `${reviewer.name} generation`)
    validateDraftIdentity(result.draft, config, reviewer, reviewer.name)
    assertCondition(
      !terminalDraftStatuses.has(result.draft.status) && result.draft.status !== 'APPROVED',
      `${reviewer.name} generation crossed the editorial boundary with status ${result.draft.status}.`,
    )
    generated.push({ reviewer, payload, result })
    await writeJson(`generated-${reviewer.slug}.json`, payload)
  }

  const draftsPayload = await adminRequest(
    `/api/admin/wonderlab/review-drafts?componentId=${config.component.id}&limit=200`,
  )
  const drafts = responseDataArray(draftsPayload, 'Generated draft listing')
  for (const entry of generated) {
    const listed = drafts.find((draft) => Number(draft?.id) === Number(entry.result.draft.id))
    validateDraftIdentity(listed, config, entry.reviewer, `${entry.reviewer.name} listed`)
  }
  await writeJson('drafts-after-generation.json', draftsPayload)

  const summary = {
    stage: 'generate',
    baseUrl,
    production: context.version,
    component: {
      id: context.component.id,
      title: context.component.title,
      sourceKey: context.component.sourceKey,
      status: context.component.status,
      reviewCount: context.component.reviewCount,
    },
    generated: generated.map((entry) => ({
      reviewer: entry.reviewer,
      draftId: entry.result.draft.id,
      status: entry.result.draft.status,
      generated: entry.result.generated,
      reused: entry.result.reused,
      confidence: entry.result.confidence,
      observations: entry.result.observations,
      comment: entry.result.draft.editedComment || entry.result.draft.generatedComment,
      rating: entry.result.draft.rating,
      reactionType: entry.result.draft.reactionType,
    })),
    editorialBoundary: {
      approved: 0,
      published: 0,
    },
  }
  await writeJson('acceptance-summary.json', summary)
  return summary
}

async function publishDrafts(config, context) {
  const beforePayload = await adminRequest(
    `/api/admin/wonderlab/review-drafts?componentId=${config.component.id}&limit=200`,
  )
  const beforeDrafts = responseDataArray(beforePayload, 'Pre-publication draft listing')
  await writeJson('drafts-before-publication.json', beforePayload)

  const published = []
  for (const instruction of config.publications) {
    const existing = beforeDrafts.find((draft) => Number(draft?.id) === instruction.draftId)
    validateDraftIdentity(existing, config, instruction.reviewer, instruction.reviewer.name)
    assertCondition(!terminalDraftStatuses.has(existing.status), `Draft ${instruction.draftId} is already terminal (${existing.status}).`)

    const approvedPayload = await adminRequest(
      `/api/admin/wonderlab/review-drafts/${instruction.draftId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          editedComment: instruction.editedComment,
          rating: instruction.rating,
          reactionType: instruction.reactionType,
          status: 'APPROVED',
        }),
      },
    )
    const approvedDraft = responseDataObject(approvedPayload, `${instruction.reviewer.name} approval`)
    validateDraftIdentity(approvedDraft, config, instruction.reviewer, `${instruction.reviewer.name} approved`)
    assertCondition(approvedDraft.status === 'APPROVED', `Draft ${instruction.draftId} did not enter APPROVED state.`)
    await writeJson(`approved-${instruction.reviewer.slug}.json`, approvedPayload)

    const publishedPayload = await adminRequest(
      `/api/admin/wonderlab/review-drafts/${instruction.draftId}/publish`,
      { method: 'POST', body: '{}' },
    )
    const result = responseDataObject(publishedPayload, `${instruction.reviewer.name} publication`)
    validateDraftIdentity(result.draft, config, instruction.reviewer, `${instruction.reviewer.name} published`)
    assertCondition(result.draft.status === 'PUBLISHED', `Draft ${instruction.draftId} did not enter PUBLISHED state.`)
    assertCondition(positiveInteger(result.reactionId, `${instruction.reviewer.name} reactionId`), 'Published Reaction ID is required.')
    published.push({ instruction, approvedDraft, result })
    await writeJson(`published-${instruction.reviewer.slug}.json`, publishedPayload)
  }

  assertCondition(new Set(published.map((entry) => Number(entry.result.reactionId))).size === published.length, 'Representative publications must resolve to distinct Reactions.')

  const [auditAfterPayload, componentsAfterPayload, draftsAfterPayload] = await Promise.all([
    adminRequest('/api/admin/wonderlab/review-rollout'),
    publicRequest('/api/components'),
    adminRequest(`/api/admin/wonderlab/review-drafts?componentId=${config.component.id}&limit=200`),
  ])
  const auditAfter = assertAuditReady(auditAfterPayload, 'Post-publication WonderLab rollout audit')
  const componentsAfter = responseDataArray(componentsAfterPayload, 'Post-publication Component registry')
  const componentAfter = componentsAfter.find((entry) => Number(entry?.id) === config.component.id)
  assertCondition(componentAfter, `Component ${config.component.id} disappeared after publication.`)
  assertCondition(Number(componentAfter.reviewCount || 0) >= config.reviewers.length, `Component ${config.component.id} does not expose both published reviews.`)
  assertCondition(Number(auditAfter.metrics?.firstPartyComponentReviews || 0) >= config.reviewers.length, 'Post-publication audit does not count both first-party reviews.')
  assertCondition(Number(auditAfter.metrics?.publishedDrafts || 0) >= config.reviewers.length, 'Post-publication audit does not count both published drafts.')
  assertCondition(Number(auditAfter.metrics?.duplicateFirstPartyReviews || 0) === 0, 'Duplicate first-party review groups appeared after publication.')
  assertCondition(Number(auditAfter.metrics?.unsafeFirstPartyReviews || 0) === 0, 'Unsafe first-party review rows appeared after publication.')
  assertCondition(Number(auditAfter.metrics?.publishedDraftMismatches || 0) === 0, 'Published draft links are mismatched after publication.')

  await writeJson('review-rollout-audit-after.json', auditAfterPayload)
  await writeJson('components-after-publication.json', componentsAfterPayload)
  await writeJson('drafts-after-publication.json', draftsAfterPayload)

  const summary = {
    stage: 'publish',
    baseUrl,
    production: context.version,
    component: {
      id: componentAfter.id,
      title: componentAfter.title,
      sourceKey: componentAfter.sourceKey,
      status: componentAfter.status,
      reviewCount: componentAfter.reviewCount,
      ratingCount: componentAfter.ratingCount,
    },
    published: published.map((entry) => ({
      reviewer: entry.instruction.reviewer,
      draftId: entry.instruction.draftId,
      reactionId: entry.result.reactionId,
      created: entry.result.created,
      comment: entry.instruction.editedComment,
      rating: entry.instruction.rating,
      reactionType: entry.instruction.reactionType,
    })),
    audit: {
      ready: auditAfter.ready,
      metrics: auditAfter.metrics,
    },
  }
  await writeJson('acceptance-summary.json', summary)
  return summary
}

async function run() {
  const rawConfig = JSON.parse(await readFile(configPath, 'utf8'))
  const config = validateConfig(rawConfig)
  await writeJson('validated-config.json', config)

  if (requestedStage) {
    assertCondition(allowedStages.has(requestedStage), 'WONDERLAB_REVIEW_ACTION must be generate, publish, or audit.')
    assertCondition(requestedStage === config.stage, `Requested stage ${requestedStage} does not match config stage ${config.stage}.`)
  }

  if (validateOnly) {
    const summary = {
      valid: true,
      stage: config.stage,
      component: config.component,
      reviewers: config.reviewers,
      publicationCount: config.publications.length,
    }
    await writeJson('validation-summary.json', summary)
    console.log(`WonderLab review acceptance config is valid for ${config.stage}.`)
    return summary
  }

  const context = await loadAcceptanceContext(config)
  await writeJson('production-version.json', { success: true, data: context.version })
  await writeJson('component-before.json', context.component)
  await writeJson('review-rollout-audit-before.json', context.auditPayload)

  if (config.stage === 'generate') return generateDrafts(config, context)
  if (config.stage === 'publish') return publishDrafts(config, context)

  const summary = {
    stage: 'audit',
    baseUrl,
    production: context.version,
    component: context.component,
    audit: context.audit,
  }
  await writeJson('acceptance-summary.json', summary)
  return summary
}

try {
  const summary = await run()
  console.log(JSON.stringify(summary, null, 2))
} catch (error) {
  const failure = {
    stage: requestedStage || null,
    message: error instanceof Error ? error.message : String(error),
    status: error && typeof error === 'object' && 'status' in error ? error.status : null,
    body: error && typeof error === 'object' && 'body' in error ? error.body : null,
  }
  await writeJson('failure.json', failure)
  console.error(failure.message)
  process.exitCode = 1
}
