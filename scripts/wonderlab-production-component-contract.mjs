// /scripts/wonderlab-production-component-contract.mjs
import { mkdir, writeFile } from 'node:fs/promises'

const baseUrl = String(
  process.env.WONDERLAB_BASE_URL ||
    process.env.BASE_URL ||
    'https://kind-robots.vercel.app',
).replace(/\/$/, '')
const outputDir =
  process.env.WONDERLAB_ROLLOUT_OUTPUT ||
  process.env.OUTPUT_DIR ||
  'wonderlab-rollout-artifacts'

const canonicalStatuses = new Set([
  'UNREVIEWED',
  'WORKING',
  'NEEDS_CONTEXT',
  'UNDER_CONSTRUCTION',
  'BROKEN',
  'RETIRED',
  'PREVIEW_UNSUPPORTED',
])
const retiredFields = ['isWorking', 'underConstruction', 'isBroken']

await mkdir(outputDir, { recursive: true })

const response = await fetch(`${baseUrl}/api/components`, {
  headers: { accept: 'application/json' },
  redirect: 'follow',
  signal: AbortSignal.timeout(30_000),
})
const text = await response.text()
let payload
try {
  payload = text ? JSON.parse(text) : null
} catch {
  payload = { raw: text }
}

if (!response.ok) {
  throw new Error(`GET /api/components returned ${response.status}.`)
}
if (!payload?.success || !Array.isArray(payload.data)) {
  throw new Error('Production Component API did not return a successful data array.')
}

const statusCounts = Object.fromEntries(
  [...canonicalStatuses].map((status) => [status, 0]),
)
const invalidStatusRows = []
const retiredFieldRows = []
const incompleteDiscoveredRows = []
let discoveredCount = 0

for (const record of payload.data) {
  const id = Number(record?.id)
  const status = record?.status

  if (!canonicalStatuses.has(status)) {
    invalidStatusRows.push({ id, status: status ?? null })
  } else {
    statusCounts[status] += 1
  }

  const exposedRetiredFields = retiredFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(record, field),
  )
  if (exposedRetiredFields.length) {
    retiredFieldRows.push({ id, fields: exposedRetiredFields })
  }

  if (record?.isDiscovered === true) {
    discoveredCount += 1
    const missing = ['sourceKey', 'sourcePath', 'sourceHash'].filter(
      (field) => typeof record[field] !== 'string' || record[field].trim() === '',
    )
    if (missing.length) incompleteDiscoveredRows.push({ id, missing })
  }
}

const report = {
  contractVersion: 1,
  baseUrl,
  checkedAt: new Date().toISOString(),
  recordCount: payload.data.length,
  discoveredCount,
  databaseOnlyCount: payload.data.length - discoveredCount,
  statusCounts,
  invalidStatusCount: invalidStatusRows.length,
  retiredFieldExposureCount: retiredFieldRows.length,
  incompleteDiscoveredCount: incompleteDiscoveredRows.length,
  invalidStatusRows,
  retiredFieldRows,
  incompleteDiscoveredRows,
}

await writeFile(
  `${outputDir}/component-contract-verification.json`,
  `${JSON.stringify(report, null, 2)}\n`,
)

if (
  report.invalidStatusCount ||
  report.retiredFieldExposureCount ||
  report.incompleteDiscoveredCount
) {
  throw new Error(
    `Production Component contract failed: ${report.invalidStatusCount} invalid statuses, ${report.retiredFieldExposureCount} retired-field exposures, ${report.incompleteDiscoveredCount} incomplete discovered identities.`,
  )
}

console.log('[wonderlab-component-contract] Verified:', report)
