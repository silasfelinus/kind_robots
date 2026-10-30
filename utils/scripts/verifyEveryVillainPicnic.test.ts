import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gridDistance } from '../everyVillainTactics/combat'
import { createStory } from '../everyVillainTactics/firstBellStory'
import {
  dismissPicnicScene,
  pendingPicnicScene,
  picnicCounts,
} from '../everyVillainTactics/picnicPanic'
import {
  createSave,
  loadSave,
  saveChecksum,
  serializeSave,
  type EvtSave,
} from '../everyVillainTactics/saves'
import { clonePreset, stageProblems } from '../everyVillainTactics/studio'
import {
  endTurn,
  rescueSelected,
  rescueTargets,
  trainingState,
  type TrainingState,
} from '../everyVillainTactics/training'

const picnic = clonePreset('picnic-plaza')
assert.deepEqual(stageProblems(picnic), [])
assert.equal(picnic.civilians?.length, 3)
const broken = clonePreset('picnic-plaza')
broken.civilians![0] = { ...broken.civilians![0]!, x: 0, y: 4 }
assert.ok(
  stageProblems(broken).includes('A civilian cannot share a spawn tile.'),
)

// Opening scene plays once, before anything else, from trigger history.
const run = trainingState(99, picnic)
assert.deepEqual(run.fired, ['picnic:opening'])
assert.ok(run.civilians!.every((c) => c.status === 'waiting'))
assert.equal(pendingPicnicScene(run)?.id, 'picnic:opening')
assert.ok(pendingPicnicScene(run)!.lines.length >= 3)
assert.equal(dismissPicnicScene(run, 'picnic:victory'), false)
assert.ok(dismissPicnicScene(run, 'picnic:opening'))
assert.equal(pendingPicnicScene(run), null)
assert.equal(pendingPicnicScene(trainingState(99)), null, 'First Bell has none')

// Evacuation is a real 1-AP action from an adjacent tile.
const rescue = structuredClone(run) as TrainingState
const lead = rescue.units[0]!
assert.deepEqual(rescueTargets(rescue), [])
assert.equal(rescueSelected(rescue), false)
const gran = rescue.civilians!.find((c) => c.id === 'lemonade')!
lead.x = gran.x - 1
lead.y = gran.y
assert.equal(rescueTargets(rescue)[0]?.id, 'lemonade')
assert.ok(rescueSelected(rescue))
assert.equal(gran.status, 'rescued')
assert.equal(lead.ap, 1)
for (const civilian of rescue.civilians!) civilian.status = 'rescued'
gran.status = 'waiting'
assert.ok(rescueSelected(rescue))
assert.ok(rescue.fired!.includes('picnic:all-rescued'))

// Burrowers aim dust rings beside waiting families; surfacing there drags
// that family under. The ring is shown a full player turn earlier.
const threat = structuredClone(run) as TrainingState
endTurn(threat)
const rings = threat.units
  .filter((u) => u.burrowTarget)
  .map((u) => ({ id: u.id, ...u.burrowTarget! }))
assert.equal(rings.length, 3)
const atRisk = threat.civilians!.filter((c) =>
  rings.some((ring) => gridDistance(ring, c) <= 1),
)
assert.ok(atRisk.length > 0, 'the crew goes after the picnic, not just heroes')
const replay = structuredClone(run) as TrainingState
endTurn(replay)
assert.deepEqual(replay.units, threat.units, 'burrow plans are seed-stable')
const before = structuredClone(threat) as TrainingState
endTurn(threat)
for (const civilian of before.civilians!) {
  const surfaced = threat.units.filter(
    (u) =>
      u.henchmanType === 'burrow' &&
      u.hp > 0 &&
      rings.some((r) => r.id === u.id && r.x === u.x && r.y === u.y),
  )
  const dragged = surfaced.some((u) => gridDistance(u, civilian) <= 1)
  assert.equal(
    threat.civilians!.find((c) => c.id === civilian.id)!.status,
    dragged ? 'lost' : 'waiting',
    civilian.id + ' fate follows the shown ring',
  )
}
assert.ok(threat.fired!.includes('picnic:first-emergence'))
assert.equal(pendingPicnicScene(threat)?.id, 'picnic:first-emergence')
dismissPicnicScene(threat, 'picnic:first-emergence')
if (picnicCounts(threat).lost) {
  assert.equal(pendingPicnicScene(threat)?.id, 'picnic:civilian-lost')
  dismissPicnicScene(threat, 'picnic:civilian-lost')
}

// Save mid-picnic: civilians and scene progress survive; forgeries fail.
const save = createSave({
  slot: 'slot-2',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: picnic,
  state: threat,
  story: { ...createStory(), current: null },
})
const loaded = loadSave(serializeSave(save))
assert.ok(loaded.ok, loaded.ok ? '' : loaded.reason)
assert.deepEqual(loaded.save.state.civilians, threat.civilians)
assert.deepEqual(loaded.save.state.fired, threat.fired)
function forge(mutate: (save: EvtSave) => void) {
  const copy = structuredClone(save)
  mutate(copy)
  const { checksum: _drop, ...payload } = copy
  copy.checksum = saveChecksum(payload)
  return loadSave(serializeSave(copy))
}
assert.equal(forge((s) => (s.state.civilians![0]!.x = 8)).ok, false)
assert.equal(
  forge((s) => (s.state.civilians![0]!.status = 'teleported' as never)).ok,
  false,
)
assert.equal(forge((s) => s.state.civilians!.pop()).ok, false)
const bell = createSave({
  slot: 'slot-3',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: null,
  state: trainingState(3),
  story: createStory(),
})
const bellForged = structuredClone(bell)
bellForged.state.fired!.push('picnic:victory')
const { checksum: _b, ...bellPayload } = bellForged
bellForged.checksum = saveChecksum(bellPayload)
assert.equal(loadSave(serializeSave(bellForged)).ok, false)

// Losing every family ends the one-shot; finales report the count.
const lost = structuredClone(run) as TrainingState
lost.civilians![1]!.status = 'lost'
lost.civilians![2]!.status = 'lost'
for (let turn = 0; turn < 3 && lost.phase === 'active'; turn++) endTurn(lost)
assert.ok(lost.civilians!.every((c) => c.status === 'lost'))
assert.equal(lost.phase, 'defeat', 'losing every family ends the one-shot')
dismissPicnicScene(lost, 'picnic:first-emergence')
dismissPicnicScene(lost, 'picnic:civilian-lost')
assert.equal(pendingPicnicScene(lost)?.id, 'picnic:defeat')
assert.ok(dismissPicnicScene(lost, 'picnic:defeat'))
assert.ok(lost.fired!.includes('picnic:defeat'))
assert.equal(pendingPicnicScene(lost), null)
const won = structuredClone(run) as TrainingState
won.civilians![0]!.status = 'rescued'
won.civilians![1]!.status = 'lost'
won.phase = 'victory'
const finale = pendingPicnicScene(won)!
assert.equal(finale.id, 'picnic:victory')
assert.ok(
  finale.lines.some((l) => l.text.includes('1 of 3 families evacuated')),
  'field report counts real outcomes',
)

const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
assert.match(page, /data-testid="tactics-oneshot-scene"/)
assert.match(page, /data-testid="tactics-rescue"/)
assert.match(page, /data-testid="tactics-civilian"/)
console.log(
  'Picnic Panic: authored opening/triggered/final scenes from trigger history, 1-AP evacuation, telegraphed tunnel abductions, loss state, saves and forgery checks verified.',
)
