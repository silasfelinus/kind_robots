import {
  conductorPriorityToProjectPriority,
  conductorStatusToProjectStatus,
  parseConductorProjectOverrides,
  projectPriorityToConductorPriority,
  projectStatusToConductorStatus,
  updateConductorProjectOverride,
} from '../../server/utils/conductorProjectRegistry'

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
    liveUrl: /active
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
check('unrelated placement survives', updated.includes('liveUrl: /active'))
check('registry remains one overrides document', (updated.match(/^overrides:/gm) ?? []).length === 1)

const appended = updateConductorProjectOverride(fixture, 'new-project', {
  status: 'paused',
  priority: 'normal',
})
check('missing project can be appended', appended.includes('  - slug: new-project'))
check('appended lifecycle is explicit', /slug: new-project\n    status: paused\n    priority: normal/.test(appended))

console.log('')
if (failures) {
  console.error(`Project registry contract: ${failures} check(s) FAILED`)
  process.exit(1)
}
console.log('Project registry contract: all checks passed')
