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

function reviewerKey(kind, id) {
  return `${kind}:${id}`
}

function summarizeSelectedReviewerUsage(exhibits) {
  const usage = new Map()

  for (const exhibit of exhibits) {
    for (const reviewer of exhibit.reviewers || []) {
      const key = reviewerKey(reviewer.author.kind, reviewer.author.id)
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

  return [...usage.values()].map((entry) => ({
    ...entry,
    averageScore: entry.assigned
      ? Math.round((entry.scoreTotal / entry.assigned) * 10) / 10
      : 0,
  }))
}

function mergeReviewerUsage(selectedUsage, portfolioUsage) {
  const selected = new Map(selectedUsage.map((entry) => [entry.key, entry]))
  const source = Array.isArray(portfolioUsage) ? portfolioUsage : []
  const rows = source.map((entry) => {
    const key = reviewerKey(entry.kind, entry.id)
    const details = selected.get(key)
    return {
      key,
      kind: entry.kind,
      id: Number(entry.id),
      name: entry.name,
      slug: details?.slug || null,
      assigned: Number(entry.count) || 0,
      missing: details?.missing || 0,
      drafted: details?.drafted || 0,
      published: details?.published || 0,
      averageScore: details?.averageScore || 0,
    }
  })

  for (const entry of selectedUsage) {
    if (!rows.some((row) => row.key === entry.key)) rows.push(entry)
  }

  return rows.sort((left, right) =>
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

const portfolioQuery = new URLSearchParams({
  limit: '500',
  reviewersPerComponent: '2',
  minimumScore: '0',
  diversityPenalty: '4',
  minimumAssignmentsPerReviewer: '2',
  representationMinimumScore: '1',
})
const portfolioPayload = await adminRequest(
  `/api/admin/wonderlab/review-portfolio?${portfolioQuery.toString()}`,
)
const portfolioPlan = responseDataObject(portfolioPayload, 'WonderLab review portfolio')
assertCondition(
  portfolioPlan.assignmentMode === 'PORTFOLIO_DIVERSE',
  'WonderLab review portfolio did not use the portfolio-diverse assignment mode.',
)
assertCondition(
  Array.isArray(portfolioPlan.exhibits),
  'WonderLab review portfolio did not return exhibits.',
)
assertCondition(
  portfolioPlan.representation && typeof portfolioPlan.representation === 'object',
  'WonderLab review portfolio did not return cast representation evidence.',
)
const planExhibits = portfolioPlan.exhibits

const returnedIds = planExhibits.map((exhibit) => Number(exhibit.componentId))
const returnedSet = new Set(returnedIds)
const duplicatePlanIds = returnedIds.filter((id, index) => returnedIds.indexOf(id) !== index)
const missingPlanIds = discoveredIds.filter((id) => !returnedSet.has(id))
assertCondition(duplicatePlanIds.length === 0, `Planner returned duplicate Components: ${duplicatePlanIds.join(', ')}`)
assertCondition(missingPlanIds.length === 0, `Planner omitted Components: ${missingPlanIds.join(', ')}`)
assertCondition(returnedIds.length === discoveredIds.length, 'Planner returned an unexpected Component count.')

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

const selectedReviewerUsage = summarizeSelectedReviewerUsage(exhibitCoverage)
const reviewerUsage = mergeReviewerUsage(selectedReviewerUsage, portfolioPlan.reviewerUsage)
const reviewerSlots = exhibitCoverage.reduce((total, exhibit) => total + exhibit.reviewerSlots, 0)
const publishedSlots = exhibitCoverage.reduce((total, exhibit) => total + exhibit.publishedSlots, 0)
const draftedSlots = exhibitCoverage.reduce((total, exhibit) => total + exhibit.draftedSlots, 0)
const missingSlots = exhibitCoverage.reduce((total, exhibit) => total + exhibit.missingSlots, 0)
const noEligibleReviewer = exhibitCoverage.filter((exhibit) => exhibit.reviewerSlots === 0)
const incompleteAssignments = exhibitCoverage.filter((exhibit) => exhibit.reviewerSlots < 2)
const targetReviewerSlots = exhibitCoverage.length * 2
const withPublished = exhibitCoverage.filter((exhibit) => exhibit.publishedSlots > 0)
const fullyPublished = exhibitCoverage.filter(
  (exhibit) => exhibit.reviewerSlots > 0 && exhibit.publishedSlots === exhibit.reviewerSlots,
)
const withDraft = exhibitCoverage.filter((exhibit) => exhibit.draftedSlots > 0)
const withoutPublished = exhibitCoverage.filter((exhibit) => exhibit.publishedSlots === 0)
const eligibleBots = reviewerUsage.filter((reviewer) => reviewer.kind === 'BOT')
const eligibleCharacters = reviewerUsage.filter((reviewer) => reviewer.kind === 'CHARACTER')
const assignedBots = eligibleBots.filter((reviewer) => reviewer.assigned > 0)
const assignedCharacters = eligibleCharacters.filter((reviewer) => reviewer.assigned > 0)
const publishedBots = eligibleBots.filter((reviewer) => reviewer.published > 0)
const publishedCharacters = eligibleCharacters.filter((reviewer) => reviewer.published > 0)
const largestAssignmentCount = reviewerUsage[0]?.assigned || 0
const largestAssignmentShare = percentage(largestAssignmentCount, reviewerSlots)
const representation = portfolioPlan.representation
const underrepresentedReviewers = Array.isArray(representation.underrepresentedReviewers)
  ? representation.underrepresentedReviewers
  : []

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
    assignmentMode: portfolioPlan.assignmentMode,
    reviewersPerComponent: 2,
    minimumAffinity: 0,
    diversityPenalty: Number(portfolioPlan.diversityPenalty) || 4,
    representationTarget: Number(representation.targetPerReviewer) || 0,
    representationMinimumScore: Number(representation.minimumScore) || 0,
    note: 'Coverage is measured against deterministic portfolio-selected reviewer slots. Existing published or drafted assignments remain pinned; responsible cast representation floors reserve each eligible voice\'s best grounded placements before repeat-use balancing fills the remaining slots.',
  },
  componentStatuses: Object.fromEntries([...statusCounts.entries()].sort()),
  coverage: {
    targetReviewerSlots,
    reviewerSlots,
    assignmentShortfall: targetReviewerSlots - reviewerSlots,
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
    exhibitsWithIncompleteAssignment: incompleteAssignments.length,
  },
  diversity: {
    eligibleBots: eligibleBots.length,
    eligibleCharacters: eligibleCharacters.length,
    assignedBots: assignedBots.length,
    assignedCharacters: assignedCharacters.length,
    publishedBots: publishedBots.length,
    publishedCharacters: publishedCharacters.length,
    largestAssignmentCount,
    largestAssignmentShare,
  },
  representation: {
    targetPerReviewer: Number(representation.targetPerReviewer) || 0,
    minimumScore: Number(representation.minimumScore) || 0,
    eligibleReviewers: Number(representation.eligibleReviewers) || 0,
    representedReviewers: Number(representation.representedReviewers) || 0,
    meetingTargetReviewers: Number(representation.meetingTargetReviewers) || 0,
    underrepresentedReviewerCount: underrepresentedReviewers.length,
  },
  reviewerUsage,
  underrepresentedReviewers,
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
  incompleteAssignments: incompleteAssignments.map((exhibit) => ({
    componentId: exhibit.componentId,
    componentName: exhibit.componentName,
    title: exhibit.title,
    folderName: exhibit.folderName,
    sourcePath: exhibit.sourcePath,
    reviewerSlots: exhibit.reviewerSlots,
  })),
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
  `Cast representation: ${report.representation.meetingTargetReviewers}/${report.representation.eligibleReviewers} eligible reviewers meet the target of ${report.representation.targetPerReviewer}.`,
)
console.log(
  `Remaining: ${missingSlots} missing slot(s), ${draftedSlots} drafted slot(s), ${incompleteAssignments.length} exhibit(s) with incomplete assignments, ${underrepresentedReviewers.length} underrepresented reviewer(s).`,
)
