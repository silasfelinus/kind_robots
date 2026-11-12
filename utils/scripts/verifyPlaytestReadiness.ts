import { playtestReadinessErrors } from '../../server/utils/playtestReadiness'
import type { ConductorTask } from '../../server/utils/conductorRoadmap'

const task = (
  id: string,
  overrides: Partial<ConductorTask> = {},
): ConductorTask => ({
  id,
  title: id,
  milestone: 'm1',
  status: 'done',
  owner: null,
  passes: 0,
  gateHuman: false,
  softGate: false,
  ...overrides,
})
const gate = task('human', {
  status: 'needs-human',
  gateHuman: true,
  gateReason: 'subjective-acceptance',
})
function assert(name: string, passes: boolean) {
  if (!passes) throw new Error(name)
  console.log('PASS', name)
}
assert(
  'completed game can await human',
  playtestReadinessErrors([task('built'), gate]).length === 0,
)
assert(
  'unfinished writing blocks playtest',
  playtestReadinessErrors([task('writing', { status: 'ready' }), gate]).length >
    0,
)
assert(
  'queued art blocks playtest',
  playtestReadinessErrors([task('art', { status: 'waiting' }), gate]).length >
    0,
)
assert(
  'recurring polish remains allowed',
  playtestReadinessErrors([
    task('polish', { status: 'ready', recurring: true }),
    gate,
  ]).length === 0,
)
assert(
  'newly scoped playtest iteration can remain ready',
  playtestReadinessErrors([
    task('polish', { status: 'ready', playtestIteration: true }),
    gate,
  ]).length === 0,
)
assert(
  'unfinished human-blocked art prevents playtest',
  playtestReadinessErrors([
    task('art', { status: 'waiting', gateHuman: true, gateReason: 'creative-approval' }),
    gate,
  ]).length > 0,
)
assert(
  'unresolved legal gate prevents playtest',
  playtestReadinessErrors([
    task('legal', { status: 'needs-human', gateHuman: true, gateReason: 'legal' }),
    gate,
  ]).length > 0,
)
assert(
  'missing human gate blocks playtest',
  playtestReadinessErrors([task('built')]).length > 0,
)
assert(
  'unapproved human gate required',
  playtestReadinessErrors([task('built'), { ...gate, approvedByHuman: true }])
    .length > 0,
)
assert(
  'publication gate does not count as playtest acceptance',
  playtestReadinessErrors([task('built'), { ...gate, gateReason: 'publish' }])
    .length > 0,
)
