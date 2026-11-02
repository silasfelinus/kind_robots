// /utils/scripts/auditWorkflowBudget.mjs
//
// CI runner budget audit for .github/workflows (2026-11-02 essentialization).
//
// Every workflow that fires on a PR push costs a fresh runner, a checkout and
// usually an `npm ci` (~60-90s) before it does any work, and the account's
// concurrent-runner limit is shared with hourly crons and production lanes. On
// 2026-11-02 one five-push PR queued ~85 workflow runs; nine of the per-PR
// workflows did ~17s of real checking between them. See
// docs/ci-test-lifecycle.md for the policy this script enforces.
//
//   node utils/scripts/auditWorkflowBudget.mjs           # advisory weekly report
//   node utils/scripts/auditWorkflowBudget.mjs --check   # CI guard (fails on rules)
//   node utils/scripts/auditWorkflowBudget.mjs --json    # machine-readable report
//
// --check FAILS ON (cheap to comply with, expensive to forget):
//   1. A pull_request workflow without a top-level `concurrency:` block. Agents
//      push fix-up commits in quick succession; without it every superseded
//      push keeps running to completion.
//   2. A schedule more frequent than daily that is not in FREQUENT_SCHEDULES.
//
// The report (no flag) is ADVISORY and is the input to the weekly review:
//   - one-shot candidates: dispatch-only or non-main-branch-push workflows, and
//     files whose comments say one-shot / temporary / delete after
//   - push-to-main reruns of pure PR contract workflows
//   - PR path filters broad enough to fire on almost every PR (fold candidates)
//   - npm ci without CYPRESS_INSTALL_BINARY=0 in workflows that never run Cypress
//   - estimated scheduled runs per day
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const workflowsDir = join(root, '.github/workflows')

// Schedules allowed to run more than once a day. Each needs a reason.
export const FREQUENT_SCHEDULES = {
  // Independent outage detector; opening an issue is what pages Silas.
  'kindrobots-health-monitor.yml': 'real-time production outage alerting',
  // Tiny git-only job that deletes merged branches; keeps `main` the only branch.
  'branch-janitor.yml': 'merged-branch cleanup',
}

// Top-level directories whose wholesale `dir/**` filter means "nearly every PR".
const BROAD_DIRS = [
  'components',
  'pages',
  'server',
  'stores',
  'utils',
  'content',
]
// Matched against `#` comment lines only, so step names like "one-shot scenes"
// do not read as a lifecycle marker.
const ONE_SHOT_MARKER =
  /\b(one[- ]shot (workflow|lane|production|run)|temporary (workflow|helper|lane)|delete (this workflow|after)|remove (this workflow|after))\b/i

// Advisories reviewed and deliberately kept. A reason is required; the weekly
// review should re-read these rather than rubber-stamp them.
export const REVIEWED_KEEP = {
  'cleanup-test-users.yml':
    'recurring dry-run-first operator tool for leaked Cypress users',
  'cypress.yml':
    'manual E2E lane while test traffic shares the production database',
  'game-soak-acceptance.yml':
    'manual acceptance soaks (docs/ci-test-lifecycle.md)',
  'contract-tests.yml':
    'push-to-main run is the post-merge signal for merge skew; Silas tests on main',
  'typecheck.yml':
    'push-to-main run is the post-merge signal for merge skew; Silas tests on main',
}

function triggers(doc) {
  const on = doc.on ?? doc[true] ?? {}
  if (typeof on === 'string') return { [on]: {} }
  if (Array.isArray(on)) return Object.fromEntries(on.map((k) => [k, {}]))
  return Object.fromEntries(Object.entries(on).map(([k, v]) => [k, v ?? {}]))
}

// Runs per day for a 5-field cron (minute/hour fields only; day/week fields
// reduce the count, so treating them as `*` over-estimates, never under).
export function cronRunsPerDay(cron) {
  const [minute, hour, dom, , dow] = cron.trim().split(/\s+/)
  const count = (field, size) => {
    if (field === '*') return size
    return field.split(',').reduce((sum, part) => {
      const step = part.match(/^(\*|\d+-\d+)\/(\d+)$/)
      if (step) {
        const [lo, hi] =
          step[1] === '*' ? [0, size - 1] : step[1].split('-').map(Number)
        return sum + Math.floor((hi - lo) / Number(step[2])) + 1
      }
      const range = part.match(/^(\d+)-(\d+)$/)
      if (range) return sum + Number(range[2]) - Number(range[1]) + 1
      return sum + 1
    }, 0)
  }
  const perDay = count(minute, 60) * count(hour, 24)
  const weekly = dow !== '*' ? count(dow, 7) / 7 : 1
  const monthly = dom !== '*' ? count(dom, 31) / 30 : 1
  return perDay * weekly * monthly
}

export function auditWorkflows(files) {
  const failures = []
  const advisories = []
  let scheduledRunsPerDay = 0
  let everyPrWorkflows = 0

  for (const [file, text] of files) {
    let doc
    try {
      doc = parse(text)
    } catch (error) {
      failures.push(`${file}: YAML does not parse (${error.message})`)
      continue
    }
    const on = triggers(doc ?? {})
    const pr = on.pull_request
    const prPaths = pr?.paths ?? null
    const isPrWorkflow =
      pr !== undefined && !(pr.types?.length === 1 && pr.types[0] === 'closed')
    const runsCypress =
      /cypress run|npx cypress|cypress-io\/github-action/.test(text)
    const writesOrSecrets =
      /secrets\.|contents: write|issues: write|git push/.test(text)

    if (isPrWorkflow && !doc.concurrency) {
      failures.push(
        `${file}: pull_request workflow has no top-level concurrency block. Add:\n` +
          '    concurrency:\n' +
          '      group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.run_id }}\n' +
          '      cancel-in-progress: true',
      )
    }
    if (isPrWorkflow && !prPaths && !pr['paths-ignore']) everyPrWorkflows += 1

    for (const { cron } of on.schedule ?? []) {
      const perDay = cronRunsPerDay(cron)
      scheduledRunsPerDay += perDay
      if (perDay > 1 && !FREQUENT_SCHEDULES[file]) {
        failures.push(
          `${file}: schedule '${cron}' runs ~${Math.round(perDay)}x/day. Scheduled work should be daily ` +
            'or rarer unless listed (with a reason) in FREQUENT_SCHEDULES in this script.',
        )
      }
    }

    const keys = Object.keys(on)
    if (keys.length === 1 && keys[0] === 'workflow_dispatch') {
      advisories.push(
        `one-shot? ${file}: dispatch-only; retire it if its job is done (git history keeps it)`,
      )
    }
    const pushBranches = on.push?.branches ?? []
    if (pushBranches.some((b) => b !== 'main')) {
      advisories.push(
        `one-shot? ${file}: pushes to non-main branch(es) ${pushBranches.join(', ')}; delete once that branch is gone`,
      )
    }
    const comments = text
      .split('\n')
      .filter((line) => line.trim().startsWith('#'))
      .join('\n')
    if (ONE_SHOT_MARKER.test(comments)) {
      advisories.push(`one-shot? ${file}: comments call it one-shot/temporary`)
    }
    if (
      on.push &&
      pushBranches.includes('main') &&
      isPrWorkflow &&
      !writesOrSecrets &&
      !on.schedule
    ) {
      advisories.push(
        `duplicate? ${file}: reruns on push to main after the PR run already passed`,
      )
    }
    const broad = (prPaths ?? []).filter((p) =>
      BROAD_DIRS.some((dir) => p === `${dir}/**`),
    )
    if (broad.length >= 2) {
      advisories.push(
        `fold? ${file}: paths ${broad.join(', ')} fire on nearly every PR; consider a contract shard step`,
      )
    }
    const installs = /^\s*(-\s*)?run:\s*npm ci(?! --ignore-scripts)/m.test(text)
    if (installs && !/CYPRESS_INSTALL_BINARY/.test(text) && !runsCypress) {
      advisories.push(
        `cypress? ${file}: npm ci downloads the Cypress binary; set CYPRESS_INSTALL_BINARY: '0'`,
      )
    }
  }

  const kept = advisories.filter(
    (line) => REVIEWED_KEEP[line.split(' ')[1].replace(/:$/, '')],
  )
  return {
    workflows: files.length,
    reviewedKeep: kept.length,
    everyPrWorkflows,
    scheduledRunsPerDay: Math.round(scheduledRunsPerDay),
    failures,
    advisories: advisories.filter((line) => !kept.includes(line)),
  }
}

function readWorkflowFiles() {
  return readdirSync(workflowsDir)
    .filter((name) => /\.ya?ml$/.test(name))
    .sort()
    .map((name) => [name, readFileSync(join(workflowsDir, name), 'utf8')])
}

function selfTest() {
  const ok = (cond, msg) => {
    if (!cond) throw new Error(`self-test: ${msg}`)
  }
  ok(cronRunsPerDay('*/10 * * * *') === 144, '*/10 is 144/day')
  ok(cronRunsPerDay('41 * * * *') === 24, 'hourly is 24/day')
  ok(cronRunsPerDay('41 12 * * *') === 1, 'daily is 1/day')
  ok(Math.abs(cronRunsPerDay('41 10 * * 1') - 1 / 7) < 1e-9, 'weekly is 1/7')
  const result = auditWorkflows([
    ['a.yml', 'on:\n  pull_request:\njobs: {}\n'],
    ['b.yml', "on:\n  schedule:\n    - cron: '0 * * * *'\njobs: {}\n"],
    [
      'c.yml',
      'on:\n  pull_request:\nconcurrency:\n  group: x\n  cancel-in-progress: true\njobs: {}\n',
    ],
    ['d.yml', 'on:\n  pull_request:\n    types: [closed]\njobs: {}\n'],
    ['e.yml', 'on:\n  workflow_dispatch:\njobs: {}\n'],
  ])
  ok(
    result.failures.some((f) => f.startsWith('a.yml')),
    'PR workflow without concurrency fails',
  )
  ok(
    result.failures.some((f) => f.startsWith('b.yml')),
    'hourly schedule fails',
  )
  ok(
    !result.failures.some((f) => /^[cde]\.yml/.test(f)),
    'compliant workflows pass',
  )
  ok(
    result.advisories.some((a) => a.includes('e.yml')),
    'dispatch-only is flagged as one-shot candidate',
  )
  console.log('auditWorkflowBudget self-test passed')
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const args = new Set(process.argv.slice(2))
  if (args.has('--self-test')) {
    selfTest()
    process.exit(0)
  }
  const result = auditWorkflows(readWorkflowFiles())
  if (args.has('--json')) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(
      `Workflows: ${result.workflows} | unfiltered on every PR: ${result.everyPrWorkflows} | ` +
        `scheduled runs/day: ~${result.scheduledRunsPerDay}`,
    )
    if (!args.has('--check')) {
      console.log(
        `\nAdvisories (${result.advisories.length}, plus ${result.reviewedKeep} in REVIEWED_KEEP) -- ` +
          'review weekly, act on what is really dead:',
      )
      for (const line of result.advisories) console.log(`  - ${line}`)
    }
    if (result.failures.length) {
      console.log(`\nFailures (${result.failures.length}):`)
      for (const line of result.failures) console.log(`  - ${line}`)
    }
  }
  if (args.has('--check') && result.failures.length) process.exit(1)
}
