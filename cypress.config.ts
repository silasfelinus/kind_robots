import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'cypress'
import {
  clearCypressApiSeed,
  ensureCypressApiSeed,
  isSeedUserId,
} from './cypress/support/cypress-seed/api-seed-node'

type TimingSpecSummary = {
  relative: string
  name: string
  durationMs: number
  wallClockDurationMs?: number
  tests: number
  passes: number
  failures: number
  pending: number
  skipped: number
}

type SeedUser = {
  id: number
}

type CleanupRequest = {
  label: string
  method?: 'DELETE' | 'POST' | 'PATCH'
  url: string
  headers?: Record<string, string>
  body?: unknown
  expectedStatuses?: number[]
}

type RunStatsSummary = {
  totalDurationMs: number
  totalTests: number
  totalPassed: number
  totalFailed: number
  totalPending: number
  totalSkipped: number
}

const timingDir = path.resolve('.cypress-cache')
const timingLatestFile = path.join(timingDir, 'timing-latest.json')
const seedCleanupLatestFile = path.join(timingDir, 'seed-cleanup-latest.json')
const apiKeyHeaderName = ['x', 'api', 'key'].join('-')

const formatMs = (ms: number) => {
  if (!Number.isFinite(ms)) return 'n/a'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const readNumber = (value: unknown, fallback = 0) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

const readRunStats = (results: unknown): RunStatsSummary | null => {
  if (!results || typeof results !== 'object') return null

  const record = results as Record<string, unknown>
  const totalDuration = record.totalDuration

  if (typeof totalDuration !== 'number') return null

  return {
    totalDurationMs: totalDuration,
    totalTests: readNumber(record.totalTests),
    totalPassed: readNumber(record.totalPassed),
    totalFailed: readNumber(record.totalFailed),
    totalPending: readNumber(record.totalPending),
    totalSkipped: readNumber(record.totalSkipped),
  }
}

const countTestsByState = (tests: unknown[], state: string) =>
  tests.filter((test) => {
    const record = test as { state?: string; attempts?: Array<{ state?: string }> }
    const lastAttempt = record.attempts?.[record.attempts.length - 1]
    return record.state === state || lastAttempt?.state === state
  }).length

const keepSeedAfterRun = (env: Record<string, unknown>) =>
  process.env.CYPRESS_KEEP_SEED === '1' ||
  env.CYPRESS_KEEP_SEED === '1' ||
  env.CYPRESS_KEEP_SEED === true

const parseResponseBody = async (response: Response) => {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : null
  } catch {
    return text
  }
}

const deleteSeedUser = async (apiBase: string, adminKey: string, user: SeedUser) => {
  const response = await fetch(`${apiBase}/users/${user.id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      [apiKeyHeaderName]: adminKey,
    },
  })

  return {
    label: `seed user ${user.id}`,
    userId: user.id,
    status: response.status,
    ok: [200, 202, 204, 401, 403, 404].includes(response.status),
    body: await parseResponseBody(response),
  }
}

const cleanupKey = (request: CleanupRequest) =>
  `${request.method || 'DELETE'} ${request.url} ${request.label}`

const runCleanupRequest = async (request: CleanupRequest) => {
  const response = await fetch(request.url, {
    method: request.method || 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(request.headers || {}),
    },
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
  })
  const expectedStatuses = request.expectedStatuses || [200, 202, 204, 401, 403, 404]

  return {
    label: request.label,
    method: request.method || 'DELETE',
    url: request.url,
    status: response.status,
    ok: expectedStatuses.includes(response.status),
    body: await parseResponseBody(response),
  }
}

export default defineConfig({
  e2e: {
    baseUrl: 'https://kind-robots.vercel.app',
    setupNodeEvents(on, config) {
      const timingEnabled =
        process.env.CYPRESS_TIMING_LOG === '1' ||
        config.env.CYPRESS_TIMING_LOG === '1' ||
        config.env.TIMING_LOG === true ||
        config.env.TIMING_LOG === 'true'

      const runStartedAt = Date.now()
      const specStarts = new Map<string, number>()
      const specSummaries: TimingSpecSummary[] = []
      const timingEvents: Array<{ label: string; durationMs: number; at: string }> = []
      const cleanupRequests: CleanupRequest[] = []

      const timingLog = (message: string) => {
        if (timingEnabled) console.log(`[cypress:timing] ${message}`)
      }

      const recordEvent = (label: string, startMs: number) => {
        const durationMs = Date.now() - startMs
        timingEvents.push({ label, durationMs, at: new Date().toISOString() })
        timingLog(`${label}: ${formatMs(durationMs)}`)
        return durationMs
      }

      on('before:run', async () => {
        fs.mkdirSync(timingDir, { recursive: true })

        const seedStart = Date.now()
        timingLog('test world setup: start')
        await ensureCypressApiSeed(config.env as Record<string, unknown>)
        recordEvent('test world setup', seedStart)
      })

      on('before:spec', (spec) => {
        specStarts.set(spec.relative, Date.now())
        timingLog(`spec start: ${spec.relative}`)
      })

      on('after:spec', (spec, results) => {
        const elapsed = Date.now() - (specStarts.get(spec.relative) || Date.now())
        const stats = results?.stats
        const tests = Array.isArray(results?.tests) ? results.tests : []

        const summary: TimingSpecSummary = {
          relative: spec.relative,
          name: spec.name,
          durationMs: elapsed,
          wallClockDurationMs: stats?.duration ?? elapsed,
          tests: stats?.tests ?? tests.length,
          passes: stats?.passes ?? countTestsByState(tests, 'passed'),
          failures: stats?.failures ?? countTestsByState(tests, 'failed'),
          pending: stats?.pending ?? countTestsByState(tests, 'pending'),
          skipped: stats?.skipped ?? countTestsByState(tests, 'skipped'),
        }

        specSummaries.push(summary)

        timingLog(
          `spec done: ${summary.relative} ${formatMs(summary.durationMs)} ` +
            `tests=${summary.tests} pass=${summary.passes} fail=${summary.failures} pending=${summary.pending}`,
        )
      })

      on('after:run', async (results) => {
        const totalMs = Date.now() - runStartedAt
        const sortedSpecs = [...specSummaries].sort((a, b) => b.durationMs - a.durationMs)
        const cleanupStartedAt = Date.now()
        const env = config.env as Record<string, unknown>
        const cleanupResults: unknown[] = []
        const cypressStats = readRunStats(results)

        for (const request of [...cleanupRequests].reverse()) {
          try {
            cleanupResults.push(await runCleanupRequest(request))
          } catch (error) {
            cleanupResults.push({
              label: request.label,
              method: request.method || 'DELETE',
              url: request.url,
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        }

        if (!keepSeedAfterRun(env)) {
          try {
            const seed = await ensureCypressApiSeed(env)

            for (const user of [seed.thirdUser, seed.secondUser, seed.user]) {
              cleanupResults.push(await deleteSeedUser(seed.apiBase, seed.adminKey, user))
            }

            clearCypressApiSeed()
          } catch (error) {
            cleanupResults.push({
              label: 'seed users',
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        } else {
          cleanupResults.push({ label: 'seed users', ok: true, kept: true })
        }

        recordEvent('test world cleanup', cleanupStartedAt)

        const report = {
          createdAt: new Date().toISOString(),
          totalMs,
          totalFormatted: formatMs(totalMs),
          cypressStats,
          events: timingEvents,
          specs: sortedSpecs,
        }

        fs.mkdirSync(timingDir, { recursive: true })
        fs.writeFileSync(timingLatestFile, `${JSON.stringify(report, null, 2)}\n`)
        fs.writeFileSync(seedCleanupLatestFile, `${JSON.stringify(cleanupResults, null, 2)}\n`)
        fs.writeFileSync(path.join(timingDir, `timing-${Date.now()}.json`), `${JSON.stringify(report, null, 2)}\n`)

        if (timingEnabled) {
          console.log(`[cypress:timing] run total: ${formatMs(totalMs)}`)
          console.log('[cypress:timing] slowest specs:')
          for (const spec of sortedSpecs.slice(0, 10)) {
            console.log(
              `[cypress:timing]   ${formatMs(spec.durationMs).padStart(8)}  ${spec.relative} ` +
                `(tests=${spec.tests}, fail=${spec.failures}, pending=${spec.pending})`,
            )
          }
          console.log(`[cypress:timing] wrote ${timingLatestFile}`)
          console.log(`[cypress:timing] wrote ${seedCleanupLatestFile}`)
        }
      })

      on('task', {
        async 'cypressSeed:get'() {
          const start = Date.now()
          const seed = await ensureCypressApiSeed(config.env as Record<string, unknown>)
          recordEvent('task cypressSeed:get', start)
          return seed
        },

        async 'cypressSeed:isSeedUser'(userId: number) {
          const start = Date.now()
          const result = await isSeedUserId(config.env as Record<string, unknown>, userId)
          recordEvent('task cypressSeed:isSeedUser', start)
          return result
        },

        'cypressCleanup:register'(request: CleanupRequest) {
          const start = Date.now()
          const key = cleanupKey(request)
          if (!cleanupRequests.some((item) => cleanupKey(item) === key)) {
            cleanupRequests.push({
              method: 'DELETE',
              expectedStatuses: [200, 202, 204, 401, 403, 404],
              ...request,
            })
          }
          recordEvent('task cypressCleanup:register', start)
          return cleanupRequests.length
        },

        'cypressSeed:clear'() {
          const start = Date.now()
          clearCypressApiSeed()
          cleanupRequests.length = 0
          recordEvent('task cypressSeed:clear', start)
          return null
        },
      })

      return config
    },
  },

  projectId: 'm98sgq',

  allowCypressEnv: false,

  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
  },
})
