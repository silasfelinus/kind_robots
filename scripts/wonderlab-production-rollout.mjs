// /scripts/wonderlab-production-rollout.mjs
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
const applyChanges = process.env.WONDERLAB_ROLLOUT_APPLY === '1'
const cleanupFixtures = process.env.WONDERLAB_CLEANUP_FIXTURES !== '0'
const outputDir = process.env.WONDERLAB_ROLLOUT_OUTPUT || 'wonderlab-rollout-artifacts'

if (!adminToken) {
  throw new Error(
    'WONDERLAB_ADMIN_TOKEN (or the existing Cypress admin secret) is required.',
  )
}

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

function responseDataArray(payload, label) {
  const data = payload && typeof payload === 'object' ? payload.data : null
  if (!Array.isArray(data)) {
    throw new Error(`${label} did not return a data array.`)
  }
  return data
}

function manifestEntries(manifest) {
  if (
    !manifest ||
    typeof manifest !== 'object' ||
    !Array.isArray(manifest.entries) ||
    !Number.isInteger(manifest.count) ||
    manifest.count !== manifest.entries.length
  ) {
    throw new Error('Production WonderLab manifest is invalid or internally inconsistent.')
  }
  return manifest.entries
}

function exactCypressComponentFixtures(records) {
  return records.filter((record) => {
    if (!record || typeof record !== 'object') return false
    const folder = String(record.folderName || '')
    const name = String(record.componentName || '')
    const title = String(record.title || '')
    const reviewCount = Number(record.reviewCount || 0)
    const exactFixtureShape =
      /^test-folder(?:-|$)/i.test(folder) &&
      /^TestComponent(?:_|-|$)/.test(name) &&
      title === 'Test Component'

    return (
      exactFixtureShape &&
      !record.sourceKey &&
      !record.sourcePath &&
      record.isDiscovered !== true &&
      reviewCount === 0
    )
  })
}

function verifyCanonicalCoverage(manifest, records) {
  const bySourceKey = new Map()
  const duplicateSourceKeys = new Map()

  for (const record of records) {
    if (!record || typeof record !== 'object' || !record.sourceKey) continue
    if (bySourceKey.has(record.sourceKey)) {
      duplicateSourceKeys.set(record.sourceKey, [
        ...(duplicateSourceKeys.get(record.sourceKey) || [bySourceKey.get(record.sourceKey)]),
        record,
      ])
      continue
    }
    bySourceKey.set(record.sourceKey, record)
  }

  const missing = []
  const mismatched = []
  for (const entry of manifestEntries(manifest)) {
    const record = bySourceKey.get(entry.sourceKey)
    if (!record) {
      missing.push({ sourceKey: entry.sourceKey, sourcePath: entry.sourcePath })
      continue
    }

    const differences = {}
    for (const field of [
      'sourcePath',
      'sourceHash',
      'componentName',
      'folderName',
      'slug',
    ]) {
      if (record[field] !== entry[field]) {
        differences[field] = { expected: entry[field], actual: record[field] }
      }
    }
    if (record.isDiscovered !== true) {
      differences.isDiscovered = { expected: true, actual: record.isDiscovered }
    }
    if (Object.keys(differences).length) {
      mismatched.push({ id: record.id, sourceKey: entry.sourceKey, differences })
    }
  }

  const report = {
    manifestCount: manifest.entries.length,
    recordCount: records.length,
    canonicalRecordCount: bySourceKey.size,
    missingCount: missing.length,
    mismatchCount: mismatched.length,
    duplicateSourceKeyCount: duplicateSourceKeys.size,
    missing,
    mismatched,
    duplicateSourceKeys: [...duplicateSourceKeys.entries()].map(([sourceKey, rows]) => ({
      sourceKey,
      ids: rows.map((row) => row.id),
    })),
  }

  if (
    report.missingCount ||
    report.mismatchCount ||
    report.duplicateSourceKeyCount
  ) {
    const error = new Error(
      `Canonical registry verification failed: ${report.missingCount} missing, ${report.mismatchCount} mismatched, ${report.duplicateSourceKeyCount} duplicate source keys.`,
    )
    error.report = report
    throw error
  }

  return report
}

console.log(`[wonderlab-rollout] Base URL: ${baseUrl}`)
console.log(`[wonderlab-rollout] Mode: ${applyChanges ? 'apply' : 'dry-run only'}`)

const manifest = await requestJson('/wonderlab-components.json', {
  headers: jsonHeaders,
})
manifestEntries(manifest)
await writeJson('manifest-summary.json', {
  version: manifest.version,
  generatedAt: manifest.generatedAt,
  count: manifest.count,
})

const dryRun = await requestJson('/api/components/reconcile', {
  method: 'POST',
  headers: adminHeaders,
  body: JSON.stringify({ mode: 'dry-run', manifest }),
})
await writeJson('reconcile-dry-run.json', dryRun)

if (!dryRun?.success || !dryRun?.data?.summary) {
  throw new Error('Component reconciliation dry run returned an invalid response.')
}

const drySummary = dryRun.data.summary
console.log('[wonderlab-rollout] Dry-run summary:', drySummary)
if (Number(drySummary.conflicts || 0) !== 0) {
  throw new Error(
    `Refusing production reconciliation with ${drySummary.conflicts} identity conflict(s).`,
  )
}

let applyResult = null
let cleanupReport = { attempted: false, candidates: [], results: [] }
let verification = null

if (applyChanges) {
  applyResult = await requestJson('/api/components/reconcile', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ mode: 'apply', manifest }),
  })
  await writeJson('reconcile-apply.json', applyResult)
  if (!applyResult?.success || applyResult?.data?.applied !== true) {
    throw new Error('Component reconciliation apply did not report success.')
  }

  let componentPayload = await requestJson('/api/components', {
    headers: adminHeaders,
  })
  let records = responseDataArray(componentPayload, 'Component API')
  const candidates = cleanupFixtures ? exactCypressComponentFixtures(records) : []
  cleanupReport = {
    attempted: cleanupFixtures,
    candidates: candidates.map((record) => ({
      id: record.id,
      folderName: record.folderName,
      componentName: record.componentName,
      title: record.title,
    })),
    results: [],
  }

  for (const candidate of candidates) {
    try {
      const response = await requestJson(`/api/components/${candidate.id}`, {
        method: 'DELETE',
        headers: adminHeaders,
      })
      cleanupReport.results.push({ id: candidate.id, ok: true, response })
    } catch (error) {
      if (error?.status === 404) {
        cleanupReport.results.push({ id: candidate.id, ok: true, status: 404 })
      } else {
        cleanupReport.results.push({
          id: candidate.id,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }
  await writeJson('fixture-cleanup.json', cleanupReport)
  const cleanupFailures = cleanupReport.results.filter((entry) => !entry.ok)
  if (cleanupFailures.length) {
    throw new Error(`${cleanupFailures.length} exact Cypress Component fixture cleanup(s) failed.`)
  }

  componentPayload = await requestJson('/api/components', {
    headers: adminHeaders,
  })
  records = responseDataArray(componentPayload, 'Component API')
  await writeJson('components-after.json', componentPayload)

  try {
    verification = verifyCanonicalCoverage(manifest, records)
  } catch (error) {
    if (error?.report) await writeJson('canonical-verification.json', error.report)
    throw error
  }
  await writeJson('canonical-verification.json', verification)
  console.log('[wonderlab-rollout] Canonical verification:', verification)
}

const auditResponse = await requestJson('/api/admin/wonderlab/review-rollout', {
  headers: adminHeaders,
})
await writeJson('review-rollout-audit.json', auditResponse)
if (!auditResponse?.success || !auditResponse?.data) {
  throw new Error('WonderLab rollout audit returned an invalid response.')
}
if (applyChanges && auditResponse.data.ready !== true) {
  const blocked = (auditResponse.data.checks || [])
    .filter((entry) => !entry.ok)
    .map((entry) => entry.key)
  throw new Error(`WonderLab rollout audit is blocked: ${blocked.join(', ') || 'unknown check'}.`)
}

const result = {
  baseUrl,
  applied: applyChanges,
  manifestCount: manifest.count,
  reconciliation: drySummary,
  cleanup: cleanupReport,
  canonicalVerification: verification,
  auditReady: auditResponse.data.ready,
  auditMetrics: auditResponse.data.metrics,
  completedAt: new Date().toISOString(),
}
await writeJson('rollout-summary.json', result)
console.log('[wonderlab-rollout] Complete:', result)
