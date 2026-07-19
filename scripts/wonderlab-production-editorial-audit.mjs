import { mkdir, writeFile } from 'node:fs/promises'
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
const outputDir =
  process.env.WONDERLAB_EDITORIAL_AUDIT_OUTPUT || 'wonderlab-editorial-audit-artifacts'

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

function chunk(values, size) {
  const groups = []
  for (let index = 0; index < values.length; index += size) {
    groups.push(values.slice(index, index + size))
  }
  return groups
}

function percentage(numerator, denominator) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount)
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

async function adminRequest(path) {
  assertCondition(adminToken, 'WONDERLAB_ADMIN_TOKEN (or the existing Cypress admin secret) is required.')
  return requestJson(path, { headers: adminHeaders })
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

function reviewerKey(reviewer) {
  return `${reviewer.author.kind}:${reviewer.author.id}`
}

function summarizeReviewerUsage(exhibits) {
  const usage = new Map()

  for (const exhibit of exhibits) {
    for (const reviewer of exhibit.reviewers || []) {
      const key = reviewerKey(reviewer)
      const current = usage.get(key) || {
        key,
        kind: reviewer.author.kind,
        id: reviewer.author.id,
        name: reviewer.name,
        slug: reviewer.slug || null,
        assigned: 0,
        missing: 0,
        drafted: 0,
        published: 0,
        scoreTotal: 0,
      }
      current.assigned += 1
      current.scoreTotal += Number(reviewer.score) || 0
      if (reviewer.coverage === 'MISSING') current.missing += 1
      if (reviewer.coverage === 'DRAFTED') current.drafted += 1
      if (reviewer.coverage === 'PUBLISHED') current.published += 1
      usage.set(key, current)
    }
  }

  return [...usage.values()]
    .map((entry) => ({
      ...entry,
      averageScore: entry.assigned
        ? Math.round((entry.scoreTotal / entry.assigned) * 10) / 10
        : 0,
    }))
    .sort((left, right) =>
      right.assigned - left.assigned ||
      right.published - left.published ||
      left.name.localeCompare(right.name),
    )
}

await mkdir(outputDir, { recursive: true })

const [versionPayload, componentsPayload, rolloutPayload] = await Promise.all([
  publicRequest('/api/version'),
  publicRequest('/api/components'),
  adminRequest('/api/admin/wonderlab/review-rollout'),
])

const version = responseDataObject(versionPayload, 'Production version')
const components = responseDataArray(componentsPayload, 'Component registry')
const rollout = responseDataObject(rolloutPayload, 'WonderLab rollout audit')
const blockedChecks = Array.isArray(rollout.checks)
  ? rollout.checks.filter((check) => check?.ok !== true).map((check) => check?.key || 'unknown')
  : ['checks-unavailable']
assertCondition(
  rollout.ready === true && blockedChecks.length === 0,
  `WonderLab rollout audit is blocked: ${blockedChecks.join(', ')}`,
)

const discovered = components
  .filter((component) => component?.isDiscovered === true)
  .sort((left, right) => Number(left.id) - Number(right.id))
const discoveredIds = discovered.map((component) => Number(component.id))
assertCondition(
  discoveredIds.every((id) => Number.isInteger(id) && id > 0),
  'The public Component registry returned an invalid discovered Component ID.',
)

const planExhibits = []
for (const ids of chunk(discoveredIds, 100)) {
  const query = new URLSearchParams({
    componentIds: ids.join(','),
    limit: String(ids.length),
    reviewersPerComponent: '2',
    minimumScore: '0',
  })
  const payload = await adminRequest(`/api/admin/wonderlab/review-plan?${query.toString()}`)
  const plan = responseDataObject(payload, 'WonderLab review plan')
  assertCondition(Array.isArray(plan.exhibits), 'WonderLab review plan did not return exhibits.')
  planExhibits.push(...plan.exhibits)
}

const returnedIds = planExhibits.map((exhibit) => Number(exhibit.componentId))
const returnedSet = new Set(returnedIds)
const duplicatePlanIds = returnedIds.filter((id, index) => returnedIds.indexOf(id) !== index)
const missingPlanIds = discoveredIds.filter((id) => !returnedSet.has(id))
assertCondition(duplicatePlanIds.length === 0, `Planner returned duplicate Components: ${duplicatePlanIds.join(', ')}`)
assertCondition(missingPlanIds.length === 0, `Planner omitted Components: ${missingPlanIds.join(', ')}`)

const statusCounts = new Map()
for (const component of discovered) increment(statusCounts, component.status || 'UNKNOWN')

const exhibitCoverage = planExhibits.map((exhibit) => {
  const reviewers = Array.isArray(exhibit.reviewers) ? exhibit.reviewers : []
  const publishedSlots = reviewers.filter((reviewer) => reviewer.coverage === 'PUBLISHED').length
  const draftedSlots = reviewers.filter((reviewer) => reviewer.coverage === 'DRAFTED').length
  const missingSlots = reviewers.filter((reviewer) => reviewer.coverage === 'MISSING').length
  return {
    componentId: Number(exhibit.componentId),
    componentName: exhibit.componentName,
    title: exhibit.title || null,
    folderName: exhibit.folderName,
    sourcePath: exhibit.sourcePath || null,
    status: exhibit.status,
    reviewerSlots: reviewers.length,
    publishedSlots,
    draftedSlots,
    missingSlots,
    reviewers,
  }
})

const reviewerUsage = summarizeReviewerUsage(exhibitCoverage)
const reviewerSlots = exhibitCoverage.reduce((total, exhibit) => total + exhibit.reviewerSlots, 0)
const publishedSlots = exhibitCoverage.reduce((total, exhibit) => total + exhibit.publishedSlots, 0)
const draftedSlots = exhibitCoverage.reduce((total, exhibit) => total + exhibit.draftedSlots, 0)
const missingSlots = exhibitCoverage.reduce((total, exhibit) => total + exhibit.missingSlots, 0)
const noEligibleReviewer = exhibitCoverage.filter((exhibit) => exhibit.reviewerSlots === 0)
const withPublished = exhibitCoverage.filter((exhibit) => exhibit.publishedSlots > 0)
const fullyPublished = exhibitCoverage.filter(
  (exhibit) => exhibit.reviewerSlots > 0 && exhibit.publishedSlots === exhibit.reviewerSlots,
)
const withDraft = exhibitCoverage.filter((exhibit) => exhibit.draftedSlots > 0)
const withoutPublished = exhibitCoverage.filter((exhibit) => exhibit.publishedSlots === 0)
const assignedBots = reviewerUsage.filter((reviewer) => reviewer.kind === 'BOT')
const assignedCharacters = reviewerUsage.filter((reviewer) => reviewer.kind === 'CHARACTER')
const publishedBots = assignedBots.filter((reviewer) => reviewer.published > 0)
const publishedCharacters = assignedCharacters.filter((reviewer) => reviewer.published > 0)

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  production: {
    commit: version.commit || null,
    deploymentId: version.deploymentId || null,
  },
  rolloutReady: true,
  scope: {
    discoveredComponents: discovered.length,
    plannedComponents: exhibitCoverage.length,
    reviewersPerComponent: 2,
    minimumAffinity: 0,
    note: 'Coverage is measured against the planner-selected reviewer slots. Existing first-party reviews by reviewers outside the current top-two assignment are not represented by this endpoint.',
  },
  componentStatuses: Object.fromEntries([...statusCounts.entries()].sort()),
  coverage: {
    reviewerSlots,
    publishedSlots,
    draftedSlots,
    missingSlots,
    publishedSlotRate: percentage(publishedSlots, reviewerSlots),
    exhibitsWithPublishedReview: withPublished.length,
    exhibitsWithPublishedReviewRate: percentage(withPublished.length, exhibitCoverage.length),
    exhibitsFullyPublished: fullyPublished.length,
    exhibitsWithDraft: withDraft.length,
    exhibitsWithoutPublishedReview: withoutPublished.length,
    exhibitsWithoutEligibleReviewer: noEligibleReviewer.length,
  },
  diversity: {
    assignedBots: assignedBots.length,
    assignedCharacters: assignedCharacters.length,
    publishedBots: publishedBots.length,
    publishedCharacters: publishedCharacters.length,
  },
  reviewerUsage,
  priorityMissingAssignments: exhibitCoverage
    .flatMap((exhibit) =>
      exhibit.reviewers
        .filter((reviewer) => reviewer.coverage === 'MISSING')
        .map((reviewer) => ({
          componentId: exhibit.componentId,
          componentName: exhibit.componentName,
          title: exhibit.title,
          folderName: exhibit.folderName,
          sourcePath: exhibit.sourcePath,
          reviewer: {
            ...reviewer.author,
            name: reviewer.name,
            slug: reviewer.slug,
            score: reviewer.score,
            reasons: reviewer.reasons,
          },
        })),
    )
    .sort((left, right) =>
      Number(right.reviewer.score) - Number(left.reviewer.score) ||
      left.folderName.localeCompare(right.folderName) ||
      left.componentName.localeCompare(right.componentName),
    )
    .slice(0, 50),
  noEligibleReviewer: noEligibleReviewer.map((exhibit) => ({
    componentId: exhibit.componentId,
    componentName: exhibit.componentName,
    title: exhibit.title,
    folderName: exhibit.folderName,
    sourcePath: exhibit.sourcePath,
  })),
}

await writeFile(
  `${outputDir}/editorial-coverage-audit.json`,
  `${JSON.stringify(report, null, 2)}\n`,
)

console.log(
  `WonderLab editorial audit: ${publishedSlots}/${reviewerSlots} planned slots published (${report.coverage.publishedSlotRate}%).`,
)
console.log(
  `Published reviewer diversity: ${publishedBots.length} Bot(s), ${publishedCharacters.length} Character(s).`,
)
console.log(
  `Remaining: ${missingSlots} missing slot(s), ${draftedSlots} drafted slot(s), ${noEligibleReviewer.length} exhibit(s) without an eligible reviewer.`,
)
