import fs from 'node:fs'
import path from 'node:path'

const apiBase = String(
  process.env.CYPRESS_BASE_API_URL ||
    process.env.BASE_API_URL ||
    'https://kind-robots.vercel.app/api',
).replace(/\/+$/, '')

const adminToken = String(
  process.env.CYPRESS_ADMIN_TOKEN ||
    process.env.CYPRESS_BETA_ADMIN_TOKEN ||
    process.env.CYPRESS_API_KEY ||
    process.env.ADMIN_TOKEN ||
    process.env.BETA_ADMIN_TOKEN ||
    process.env.API_KEY ||
    '',
).trim()

const phase = String(process.env.CYPRESS_CLEANUP_PHASE || 'manual')
  .trim()
  .replace(/[^a-z0-9_-]+/gi, '-')
  .toLowerCase()
const maxBatches = 100
const reportDir = path.resolve('.cypress-cache')
const reportFile = path.join(reportDir, `user-cleanup-${phase}.json`)
const attempts = []

const report = {
  createdAt: new Date().toISOString(),
  phase,
  apiBase,
  ok: false,
  deleted: 0,
  remaining: null,
  attempts,
}

const writeReport = () => {
  fs.mkdirSync(reportDir, { recursive: true })
  fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`)
}

try {
  if (!adminToken) {
    throw new Error(
      'Cypress user cleanup requires CYPRESS_BETA_ADMIN_TOKEN or CYPRESS_API_KEY.',
    )
  }

  for (let batch = 1; batch <= maxBatches; batch += 1) {
    const response = await fetch(`${apiBase}/users/cypress-cleanup`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': adminToken,
        'x-admin-token': adminToken,
        'x-beta-admin-token': adminToken,
      },
      body: JSON.stringify({ maxAgeMs: 0, limit: 10 }),
    })

    const text = await response.text()
    let body
    try {
      body = text ? JSON.parse(text) : {}
    } catch {
      body = { success: false, message: text }
    }

    const deleted = Array.isArray(body?.data?.deleted) ? body.data.deleted : []
    const failed = Array.isArray(body?.data?.failed) ? body.data.failed : []
    const remaining = Number(body?.data?.remaining)

    attempts.push({
      batch,
      status: response.status,
      success: body?.success,
      deleted,
      failed,
      remaining: Number.isFinite(remaining) ? remaining : null,
      message: body?.message,
    })
    report.deleted += deleted.length
    report.remaining = Number.isFinite(remaining) ? remaining : null

    if (![200, 207].includes(response.status) || body?.success === false) {
      throw new Error(
        `Cypress cleanup batch ${batch} failed: HTTP ${response.status} ${JSON.stringify(body)}`,
      )
    }

    if (failed.length > 0) {
      throw new Error(
        `Cypress cleanup batch ${batch} could not delete ${failed.length} user(s): ${JSON.stringify(failed)}`,
      )
    }

    if (!Number.isFinite(remaining)) {
      throw new Error(
        `Cypress cleanup batch ${batch} returned no remaining-user count: ${JSON.stringify(body)}`,
      )
    }

    if (remaining === 0) {
      report.ok = true
      console.log(
        `Cypress user cleanup (${phase}) removed ${report.deleted} user(s); none remain.`,
      )
      break
    }

    if (deleted.length === 0) {
      throw new Error(
        `Cypress cleanup made no progress with ${remaining} user(s) remaining.`,
      )
    }
  }

  if (!report.ok) {
    throw new Error(
      `Cypress cleanup exceeded ${maxBatches} batches with ${report.remaining ?? 'unknown'} user(s) remaining.`,
    )
  }
} catch (error) {
  report.error = error instanceof Error ? error.message : String(error)
  console.error(report.error)
  process.exitCode = 1
} finally {
  writeReport()
  console.log(`Cypress cleanup report: ${reportFile}`)
}
