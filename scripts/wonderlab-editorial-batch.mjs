import { mkdir, readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

const configPath =
  process.env.WONDERLAB_EDITORIAL_BATCH_CONFIG ||
  'config/wonderlab-editorial-batch.json'
const outputDir =
  process.env.WONDERLAB_EDITORIAL_BATCH_OUTPUT ||
  'wonderlab-editorial-batch-artifacts'
const baseUrl = String(
  process.env.WONDERLAB_BASE_URL || 'https://kind-robots.vercel.app',
).replace(/\/$/, '')
const adminToken = String(
  process.env.WONDERLAB_ADMIN_TOKEN ||
    process.env.CYPRESS_BETA_ADMIN_TOKEN ||
    process.env.CYPRESS_API_KEY ||
    '',
).trim()
const validateOnly = process.env.WONDERLAB_EDITORIAL_BATCH_VALIDATE_ONLY === '1'
const executeAllowed = process.env.WONDERLAB_EDITORIAL_BATCH_ALLOW_EXECUTE === '1'

const MAX_COMPONENTS = 10
const MAX_TARGETS = 20
const MAX_GENERATION_ATTEMPTS = 2
const EDITORIAL_DRAFT_STATUSES = new Set(['PROPOSED', 'FAILED'])

function assertCondition(condition, message) {
  if (!condition) throw new Error(message)
}

function positiveInteger(value, label) {
  const parsed = Number(value)
  assertCondition(Number.isInteger(parsed) && parsed > 0, `${label} must be a positive integer.`)
  return parsed
}

function boundedNumber(value, label, minimum, maximum) {
  const parsed = Number(value)
  assertCondition(
    Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum,
    `${label} must be from ${minimum} to ${maximum}.`,
  )
  return parsed
}

function boundedString(value, label, maximum = 200) {
  assertCondition(typeof value === 'string' && value.trim(), `${label} is required.`)
  const trimmed = value.trim()
  assertCondition(trimmed.length <= maximum, `${label} must be at most ${maximum} characters.`)
  return trimmed
}

function uniquePositiveIds(value, label) {
  assertCondition(Array.isArray(value), `${label} must be an array.`)
  const ids = value.map((entry, index) => positiveInteger(entry, `${label}[${index}]`))
  assertCondition(new Set(ids).size === ids.length, `${label} must not contain duplicates.`)
  assertCondition(ids.length <= MAX_COMPONENTS, `${label} may contain at most ${MAX_COMPONENTS} IDs.`)
  return ids
}

function validateExpectedTarget(value, index) {
  assertCondition(value && typeof value === 'object' && !Array.isArray(value), `expectedTargets[${index}] must be an object.`)
  assertCondition(value.kind === 'BOT' || value.kind === 'CHARACTER', `expectedTargets[${index}].kind must be BOT or CHARACTER.`)
  return {
    componentId: positiveInteger(value.componentId, `expectedTargets[${index}].componentId`),
    kind: value.kind,
    id: positiveInteger(value.id, `expectedTargets[${index}].id`),
  }
}

function validateConfig(value) {
  assertCondition(value && typeof value === 'object' && !Array.isArray(value), 'Editorial batch config must be an object.')
  assertCondition(value.version === 1, 'Editorial batch config version must be 1.')
  assertCondition(typeof value.execute === 'boolean', 'execute must be boolean.')

  const componentIds = uniquePositiveIds(value.componentIds, 'componentIds')
  const expectedTargets = Array.isArray(value.expectedTargets)
    ? value.expectedTargets.map(validateExpectedTarget)
    : (() => {
        throw new Error('expectedTargets must be an array.')
      })()
  assertCondition(expectedTargets.length <= MAX_TARGETS, `expectedTargets may contain at most ${MAX_TARGETS} entries.`)
  assertCondition(
    new Set(expectedTargets.map((target) => `${target.componentId}:${target.kind}:${target.id}`)).size === expectedTargets.length,
    'expectedTargets must not contain duplicates.',
  )

  const config = {
    version: 1,
    batchId: boundedString(value.batchId, 'batchId', 120),
    execute: value.execute,
    minimumProductionCommit: boundedString(value.minimumProductionCommit, 'minimumProductionCommit', 40),
    componentIds,
    limit: positiveInteger(value.limit, 'limit'),
    reviewersPerComponent: positiveInteger(value.reviewersPerComponent, 'reviewersPerComponent'),
    minimumScore: boundedNumber(value.minimumScore, 'minimumScore', -100, 500),
    model: boundedString(value.model, 'model', 100),
    regenerate: value.regenerate === true,
    expectedTargets,
  }

  assertCondition(/^[0-9a-f]{40}$/.test(config.minimumProductionCommit), 'minimumProductionCommit must be a full lowercase commit SHA.')
  assertCondition(config.limit <= MAX_COMPONENTS, `limit may not exceed ${MAX_COMPONENTS}.`)
  assertCondition(config.reviewersPerComponent >= 1 && config.reviewersPerComponent <= 2, 'reviewersPerComponent must be 1 or 2.')
  assertCondition(/^[a-zA-Z0-9._:-]+$/.test(config.model), 'model contains invalid characters.')

  if (config.execute) {
    assertCondition(config.componentIds.length > 0, 'Execution requires explicit componentIds from a reviewed dry run.')
    assertCondition(config.expectedTargets.length > 0, 'Execution requires explicit expectedTargets from a reviewed dry run.')
    assertCondition(executeAllowed, 'Execution requires WONDERLAB_EDITORIAL_BATCH_ALLOW_EXECUTE=1.')
  } else {
    assertCondition(config.expectedTargets.length === 0, 'Dry-run manifests must not contain expectedTargets.')
  }

  return config
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
  return requestJson(path, { headers: { accept: 'application/json' } })
}

async function adminRequest(path, options = {}) {
  assertCondition(adminToken, 'WONDERLAB_ADMIN_TOKEN (or the existing Cypress admin secret) is required.')
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

function responseDataObject(payload, label) {
  const data = payload && typeof payload === 'object' ? payload.data : null
  assertCondition(data && typeof data === 'object' && !Array.isArray(data), `${label} did not return a data object.`)
  return data
}

function responseDataArray(payload, label) {
  const data = payload && typeof payload === 'object' ? payload.data : null
  assertCondition(Array.isArray(data), `${label} did not return a data array.`)
  return data
}

function normalizedTargets(data) {
  const targets = Array.isArray(data?.targets) ? data.targets : []
  return targets.map((target, index) => {
    const author = target?.reviewer?.author
    assertCondition(author?.kind === 'BOT' || author?.kind === 'CHARACTER', `targets[${index}] has an invalid author kind.`)
    return {
      componentId: positiveInteger(target.componentId, `targets[${index}].componentId`),
      componentName: String(target.componentName || ''),
      kind: author.kind,
      id: positiveInteger(author.id, `targets[${index}].author.id`),
      reviewerName: String(target.reviewer?.name || ''),
      score: Number(target.reviewer?.score) || 0,
      reasons: Array.isArray(target.reviewer?.reasons) ? target.reviewer.reasons : [],
      coverage: String(target.reviewer?.coverage || ''),
    }
  })
}

function targetIdentity(target) {
  return {
    componentId: target.componentId,
    kind: target.kind,
    id: target.id,
  }
}

function shouldRetry(error) {
  const status = Number(error?.status || 0)
  return !status || status === 502 || status === 503 || status === 504 || status >= 500
}

function generationPayload(target, config) {
  return {
    componentId: target.componentId,
    ...(target.kind === 'BOT'
      ? { authorBotId: target.id }
      : { authorCharacterId: target.id }),
    model: config.model,
    regenerate: config.regenerate,
  }
}

function validateGeneratedTarget(data, target) {
  const draft = data?.draft
  assertCondition(draft && typeof draft === 'object', `${target.reviewerName} generation returned no draft.`)
  assertCondition(Number(draft.componentId) === target.componentId, `${target.reviewerName} draft belongs to the wrong Component.`)
  assertCondition(draft.author?.kind === target.kind, `${target.reviewerName} draft has the wrong author kind.`)
  assertCondition(Number(draft.author?.id) === target.id, `${target.reviewerName} draft has the wrong author ID.`)
  assertCondition(EDITORIAL_DRAFT_STATUSES.has(draft.status), `${target.reviewerName} draft crossed the editorial boundary with status ${draft.status}.`)
  return draft
}

async function generateTarget(target, config) {
  let lastError = null
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const payload = await adminRequest('/api/admin/wonderlab/review-drafts/generate', {
        method: 'POST',
        body: JSON.stringify(generationPayload(target, config)),
      })
      const data = responseDataObject(payload, `${target.reviewerName} generation`)
      const draft = validateGeneratedTarget(data, target)
      return {
        componentId: target.componentId,
        reviewer: { kind: target.kind, id: target.id, name: target.reviewerName },
        success: true,
        attempt,
        draftId: draft.id,
        status: draft.status,
        generated: data.generated === true,
        reused: data.reused === true,
        confidence: data.confidence ?? null,
        observations: Array.isArray(data.observations) ? data.observations : [],
        message: data.reused === true ? 'Existing draft reused.' : 'Editorial draft generated.',
      }
    } catch (error) {
      lastError = error
      if (attempt < MAX_GENERATION_ATTEMPTS && shouldRetry(error)) {
        await new Promise((resolve) => setTimeout(resolve, 2_000))
        continue
      }
      break
    }
  }

  return {
    componentId: target.componentId,
    reviewer: { kind: target.kind, id: target.id, name: target.reviewerName },
    success: false,
    attempt: MAX_GENERATION_ATTEMPTS,
    draftId: null,
    status: null,
    generated: false,
    reused: false,
    confidence: null,
    observations: [],
    message: lastError instanceof Error ? lastError.message : 'Generation failed.',
    errorStatus: lastError?.status || null,
  }
}

async function loadDraftInventory(componentIds) {
  const inventory = []
  for (const componentId of componentIds) {
    const payload = await adminRequest(
      `/api/admin/wonderlab/review-drafts?componentId=${componentId}&limit=100`,
    )
    inventory.push({
      componentId,
      drafts: responseDataArray(payload, `Component ${componentId} draft inventory`),
    })
  }
  return inventory
}

function targetedDrafts(inventory, targets) {
  return targets.map((target) => {
    const drafts = inventory.find((entry) => entry.componentId === target.componentId)?.drafts || []
    const draft = drafts.find(
      (entry) =>
        entry?.author?.kind === target.kind &&
        Number(entry?.author?.id) === target.id,
    )
    return {
      target: targetIdentity(target),
      reviewerName: target.reviewerName,
      draft: draft
        ? {
            id: draft.id,
            status: draft.status,
            componentId: draft.componentId,
            componentName: draft.componentName,
            componentTitle: draft.componentTitle,
            author: draft.author,
            generatedComment: draft.generatedComment,
            editedComment: draft.editedComment,
            finalComment: draft.finalComment,
            rating: draft.rating,
            reactionType: draft.reactionType,
            generationModel: draft.generationModel,
            generationProvider: draft.generationProvider,
            generationAttempt: draft.generationAttempt,
            promptPayload: draft.promptPayload,
            failureReason: draft.failureReason,
            publishedReactionId: draft.publishedReactionId,
          }
        : null,
    }
  })
}

await mkdir(outputDir, { recursive: true })

try {
  const config = validateConfig(JSON.parse(await readFile(configPath, 'utf8')))
  await writeJson('validated-config.json', config)

  if (validateOnly) {
    console.log(`WonderLab editorial batch config validated: ${config.batchId} (${config.execute ? 'execute' : 'dry run'}).`)
    process.exit(0)
  }

  const [versionPayload, auditPayload] = await Promise.all([
    publicRequest('/api/version'),
    adminRequest('/api/admin/wonderlab/review-rollout'),
  ])
  const version = responseDataObject(versionPayload, 'Production version')
  const audit = responseDataObject(auditPayload, 'WonderLab rollout audit')
  const blocked = Array.isArray(audit.checks)
    ? audit.checks.filter((check) => check?.ok !== true).map((check) => check?.key || 'unknown')
    : ['checks-unavailable']
  assertCondition(audit.ready === true && blocked.length === 0, `WonderLab rollout audit is blocked: ${blocked.join(', ')}`)

  const requestBody = {
    componentIds: config.componentIds.length ? config.componentIds : undefined,
    limit: config.limit,
    reviewersPerComponent: config.reviewersPerComponent,
    minimumScore: config.minimumScore,
    model: config.model,
    regenerate: config.regenerate,
    dryRun: true,
  }
  const dryRunPayload = await adminRequest('/api/admin/wonderlab/review-drafts/generate-batch', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  })
  const dryRunData = responseDataObject(dryRunPayload, 'Editorial batch dry run')
  assertCondition(dryRunData.dryRun === true, 'Editorial batch preview did not remain a dry run.')
  const targets = normalizedTargets(dryRunData)
  assertCondition(targets.length <= MAX_TARGETS, `Dry run returned more than ${MAX_TARGETS} targets.`)
  await writeJson('batch-dry-run.json', dryRunPayload)

  if (config.execute) {
    assertCondition(
      JSON.stringify(targets.map(targetIdentity)) === JSON.stringify(config.expectedTargets),
      'The global portfolio targets changed after review; execution was stopped.',
    )
  }

  const generated = []
  if (config.execute) {
    for (const target of targets) {
      generated.push(await generateTarget(target, config))
      await writeJson('batch-execution.json', { targets, generated })
    }
  }

  const inventoryIds = config.componentIds.length
    ? config.componentIds
    : [...new Set(targets.map((target) => target.componentId))]
  const inventory = await loadDraftInventory(inventoryIds)
  await writeJson('drafts-after-batch.json', inventory)
  const drafts = targetedDrafts(inventory, targets)

  const summary = {
    batchId: config.batchId,
    stage: config.execute ? 'EXECUTED' : 'DRY_RUN',
    baseUrl,
    production: {
      commit: version.commit || null,
      deploymentId: version.deploymentId || null,
    },
    rolloutReady: true,
    request: {
      componentIds: config.componentIds,
      limit: config.limit,
      reviewersPerComponent: config.reviewersPerComponent,
      minimumScore: config.minimumScore,
      model: config.model,
      regenerate: config.regenerate,
    },
    portfolio: dryRunData.plan?.portfolio || null,
    targetCount: targets.length,
    targets,
    generated,
    drafts,
    editorialBoundary: {
      approved: 0,
      published: 0,
    },
  }
  await writeJson('batch-summary.json', summary)

  const failures = generated.filter((entry) => !entry.success)
  console.log(
    `WonderLab editorial batch ${config.batchId}: ${summary.stage}; ${targets.length} target(s); ${generated.filter((entry) => entry.success).length} successful; ${failures.length} failed.`,
  )
  if (failures.length) process.exitCode = 1
} catch (error) {
  const failure = {
    message: error instanceof Error ? error.message : String(error),
    status: error?.status || null,
    body: error?.body || null,
  }
  await writeJson('failure.json', failure)
  console.error(failure.message)
  process.exitCode = 1
}
