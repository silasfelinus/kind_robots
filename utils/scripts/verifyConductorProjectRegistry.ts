import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  conductorPriorityToProjectPriority,
  conductorStatusToProjectStatus,
  parseConductorProjectOverrides,
  projectPriorityToConductorPriority,
  projectStatusToConductorStatus,
  updateConductorProjectOverride,
} from '../../server/utils/conductorProjectRegistry'
import {
  assertConductorProjectionSnapshot,
  buildConductorData,
  type ConductorProjectionSnapshot,
} from '../../server/utils/conductorProjection'

let failures = 0

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const fixture = `# Human-managed project overrides.
overrides:
  - slug: active-project
    status: active
    priority: high
    kind: software
    liveUrl: /legacy-active
    channelKey: legacy-channel
    tabKey: legacy-tab
  - slug: paused-project
    status: paused # tabled by Silas
    priority: low
  - slug: completed-project
    status: finished
    priority: urgent
  - slug: retired-project
    status: retired # historical record
    priority: normal
`

console.log('Conductor registry parsing')
const parsed = parseConductorProjectOverrides(fixture)
check('all lifecycle entries are parsed', parsed.length === 4, String(parsed.length))
check('active maps to ACTIVE', conductorStatusToProjectStatus(parsed[0]!.status) === 'ACTIVE')
check('paused maps to PAUSED', conductorStatusToProjectStatus(parsed[1]!.status) === 'PAUSED')
check('finished maps to DONE', conductorStatusToProjectStatus(parsed[2]!.status) === 'DONE')
check('retired maps to ARCHIVED', conductorStatusToProjectStatus(parsed[3]!.status) === 'ARCHIVED')
check('urgent maps to HIGH', conductorPriorityToProjectPriority(parsed[2]!.priority) === 'HIGH')
check('ACTIVE maps back to active', projectStatusToConductorStatus('ACTIVE') === 'active')
check('DONE maps back to finished', projectStatusToConductorStatus('DONE') === 'finished')
check('BRAINSTORM stays database-only', projectStatusToConductorStatus('BRAINSTORM') === null)
check('HIGH maps back to high', projectPriorityToConductorPriority('HIGH') === 'high')

console.log('Conductor registry updates')
const updated = updateConductorProjectOverride(fixture, 'paused-project', {
  status: 'active',
  priority: 'urgent',
})
check('status is replaced', /slug: paused-project[\s\S]*status: active # tabled by Silas/.test(updated))
check('priority is replaced', /slug: paused-project[\s\S]*priority: urgent/.test(updated))
check('inline human note is preserved', updated.includes('# tabled by Silas'))
check('unrelated placement survives', updated.includes('liveUrl: /legacy-active'))
check('registry remains one overrides document', (updated.match(/^overrides:/gm) ?? []).length === 1)

const appended = updateConductorProjectOverride(fixture, 'new-project', {
  status: 'paused',
  priority: 'normal',
})
check('missing project can be appended', appended.includes('  - slug: new-project'))
check('appended lifecycle is explicit', /slug: new-project\n    status: paused\n    priority: normal/.test(appended))

console.log('Conductor materialized projection')
const snapshot: ConductorProjectionSnapshot = {
  version: 1,
  sourceRepo: 'silasfelinus/conductor',
  sourceRef: 'main',
  sourceCommitSha: 'a'.repeat(40),
  generatedAt: '2026-08-03T11:30:00Z',
  registryYaml: fixture,
  roadmaps: {
    'active-project': `project: Roadmap title
kind: software
goal: Ship the coordination layer
milestones:
  - id: m1
    title: Coordination
    weight: 100
    status: in-progress
tasks:
  - id: t-001
    milestone: m1
    title: Await decision
    status: needs-human
    gate_human: true
`,
  },
  pitches: {
    '2026-08-03-projection.md': `# Pitch: Projection contract
status: awaiting-silas
project-target: conductor
## The idea
Use one-way authority.
## Why do it
Avoid split-brain state.
## Rough effort
Small
`,
  },
  imageVersions: {
    'active-project-card.webp': 'b'.repeat(64),
  },
}
assertConductorProjectionSnapshot(snapshot)
const data = buildConductorData(
  snapshot,
  new Map([
    [
      'active-project',
      {
        title: 'Kind Robots title',
        liveUrl: '/projects/active',
        channelKey: 'plan',
        tabKey: 'projects',
        cardPath: '/media/projects/active-card.webp',
      },
    ],
  ]),
  '2026-08-03T11:31:00Z',
)
const active = data.projects.find((project) => project.slug === 'active-project')!
check('coordination status comes from Conductor', active.conductorStatus === 'active')
check('coordination priority comes from Conductor', active.conductorPriority === 'high')
check('roadmap task state comes from Conductor', active.tasks[0]?.status === 'needs-human')
check('Kind Robots title wins over roadmap title', active.name === 'Kind Robots title')
check('Kind Robots route wins over legacy registry route', active.liveUrl === '/projects/active')
check('Kind Robots placement wins over legacy registry placement', active.channelKey === 'plan' && active.tabKey === 'projects')
check('Kind Robots artwork wins over projected fallback', active.cardPath === '/media/projects/active-card.webp')
check('projection carries exact source SHA', data.projection.sourceCommitSha === 'a'.repeat(40))
check('pitches are projected', data.pitches[0]?.title === 'Projection contract')

let invalidSourceRejected = false
try {
  assertConductorProjectionSnapshot({ ...snapshot, sourceRef: 'feature-branch' })
} catch {
  invalidSourceRejected = true
}
check('non-main projections are rejected', invalidSourceRejected)

console.log('Projection wiring')
const syncRoute = readFileSync(resolve('server/api/conductor/sync.post.ts'), 'utf8')
const readRoute = readFileSync(resolve('server/api/conductor/projects.get.ts'), 'utf8')
const migration = readFileSync(
  resolve('prisma/migrations/20260803113000_add_conductor_projection/migration.sql'),
  'utf8',
)
const agents = readFileSync(resolve('AGENTS.md'), 'utf8')
check('sync route requires an admin API user', syncRoute.includes('requireAdminApiUser(event)'))
check('sync route preserves existing presentation fields', !/project\.update\([\s\S]*channelKey: project\.channelKey/.test(syncRoute))
check('read route uses local projection storage', readRoute.includes('readConductorProjection()'))
check('read route no longer fetches GitHub content', !readRoute.includes('api.github.com'))
check('projection table migration is additive', migration.includes('CREATE TABLE `ConductorProjection`'))
check('agent contract names one-way projection authority', agents.includes('commit-stamped materialized read projection'))

console.log('')
if (failures) {
  console.error(`Project registry contract: ${failures} check(s) FAILED`)
  process.exit(1)
}
console.log('Project registry contract: all checks passed')
