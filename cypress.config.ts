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

const timingDir = path.resolve('.cypress-cache')
const timingLatestFile = path.join(timingDir, 'timing-latest.json')

const formatMs = (ms: number) => {
  if (!Number.isFinite(ms)) return 'n/a'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const countTestsByState = (tests: unknown[], state: string) =>
  tests.filter((test) => {
    const record = test as { state?: string; attempts?: Array<{ state?: string }> }
    const lastAttempt = record.attempts?.[record.attempts.length - 1]
    return record.state === state || lastAttempt?.state === state
  }).length

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

        if (
          process.env.CYPRESS_EAGER_SEED === '1' ||
          config.env.CYPRESS_EAGER_SEED === '1'
        ) {
          const seedStart = Date.now()
          timingLog('seed ensure: start')
          await ensureCypressApiSeed(config.env as Record<string, unknown>)
          recordEvent('seed ensure', seedStart)
        } else {
          timingLog('seed ensure: lazy')
        }
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
          wallClockDurationMs: stats?.wallClockDuration,
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

      on('after:run', (results) => {
        const totalMs = Date.now() - runStartedAt
        const sortedSpecs = [...specSummaries].sort((a, b) => b.durationMs - a.durationMs)
        const report = {
          createdAt: new Date().toISOString(),
          totalMs,
          totalFormatted: formatMs(totalMs),
          cypressStats: results?.totalDuration
            ? {
                totalDurationMs: results.totalDuration,
                totalTests: results.totalTests,
                totalPassed: results.totalPassed,
                totalFailed: results.totalFailed,
                totalPending: results.totalPending,
                totalSkipped: results.totalSkipped,
              }
            : null,
          events: timingEvents,
          specs: sortedSpecs,
        }

        fs.mkdirSync(timingDir, { recursive: true })
        fs.writeFileSync(timingLatestFile, `${JSON.stringify(report, null, 2)}\n`)
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

        'cypressSeed:clear'() {
          const start = Date.now()
          clearCypressApiSeed()
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
