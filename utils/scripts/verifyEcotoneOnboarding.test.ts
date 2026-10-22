import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRun, restoreRun, chooseBeat, findCard } from '../ecotone/engine'
import {
  PLAYER_AVATARS,
  PLAYER_PERSONALITIES,
  normalizePlayerIdentity,
} from '../ecotone/playerIdentity'
import {
  visibleOpeningChoices,
  localTemptation,
} from '../ecotone/openingExperience'
import { EVENTS } from '../ecotone/story'

assert.ok(PLAYER_AVATARS.length >= 10)
assert.ok(PLAYER_PERSONALITIES.length >= 5)
assert.equal(
  new Set(PLAYER_AVATARS.map((p) => p.id)).size,
  PLAYER_AVATARS.length,
)
assert.equal(
  new Set(PLAYER_PERSONALITIES.map((p) => p.id)).size,
  PLAYER_PERSONALITIES.length,
)

const identity = normalizePlayerIdentity({
  playerName: '   River   Rabbit   ',
  avatarId: 'elder',
  personalityId: 'skeptical',
})
assert.equal(identity.playerName, 'River Rabbit')
assert.equal(identity.avatarId, 'elder')
assert.equal(identity.personalityId, 'skeptical')
assert.equal(
  normalizePlayerIdentity({ playerName: '   ', avatarId: 'not-real' })
    .playerName,
  'Wanderer',
)
assert.equal(
  normalizePlayerIdentity({ avatarId: 'not-real' }).avatarId,
  'glitter',
)
assert.equal(
  normalizePlayerIdentity({ playerName: 'z'.repeat(200) }).playerName.length,
  32,
)
const current = createRun(2026, 'mechanic', identity)
assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(current))), current)
const old = { ...createRun(2026, 'mechanic') }
delete old.playerName
delete old.avatarId
delete old.personalityId
assert.equal(
  restoreRun(old)?.playerName,
  'Wanderer',
  'legacy version-4 runs gain non-destructive defaults',
)
assert.deepEqual(
  restoreRun(old)?.skills,
  current.skills,
  'identity does not change skills',
)

for (const [event, expected] of [
  ['KN-2', ['sober', 'tipsy', 'race-stoned']],
  ['GR-2', ['sober', 'fair-tipsy', 'stoned']],
  ['QW-2', ['sober', 'stoned']],
] as const) {
  const card = findCard(event)!
  const options = visibleOpeningChoices(card)
  assert.deepEqual(
    options.map((o) => o.id),
    expected,
    `${event} is no longer a seven-substance screen`,
  )
  assert.ok(
    options.every(
      (o) =>
        !/meth|cocaine|mdma|fast track|everybody loves everybody/i.test(
          o.label,
        ),
    ),
  )
  for (const option of options) {
    const run = {
      ...current,
      event: EVENTS[0]!.id,
      phase: 'beat' as const,
      step: 1,
      day: 1,
      card: event,
    }
    const resolved = chooseBeat(run, option.id)
    assert.notEqual(
      resolved,
      run,
      `${event}/${option.id} is still a playable legacy choice`,
    )
    assert.equal(resolved.openingState, option.lens)
    assert.equal(
      restoreRun(JSON.parse(JSON.stringify(resolved)))?.openingState,
      option.lens,
    )
  }
}

assert.equal(localTemptation('KN-2'), null)
assert.equal(localTemptation('GR-2'), null)
assert.equal(localTemptation('QW-2'), null)
for (const id of ['GR-4', 'QW-4', 'KN-6']) {
  const offer = localTemptation(id)
  assert.ok(offer)
  assert.equal(offer?.offers.length, 2, `${id} has two contextual offers only`)
  assert.ok(offer?.intro.length)
}
assert.equal(
  localTemptation('WH-121'),
  null,
  'excluded cultural scene is never used for offers',
)

const store = readFileSync('stores/ecotoneStore.ts', 'utf8')
const board = readFileSync('components/ecotone-board.vue', 'utf8')
assert.match(store, /UNDO_KEY/)
assert.match(store, /undoSnapshot/)
assert.match(store, /function undo\(/)
assert.match(store, /function saveSlot\(/)
assert.match(store, /function loadSlot\(/)
assert.match(store, /function exportSave\(/)
assert.match(store, /function importSave\(/)
assert.match(store, /restoreRun\(payload\.run\)/)
assert.match(board, /Confirm your decision/)
assert.match(board, /Change my mind/)
assert.match(board, /Undo last decision/)
assert.match(board, /tab === 'settings'/)
assert.match(board, /Text reveal speed/)
assert.match(board, /Text size/)
assert.match(board, /Export save as JSON/)
assert.match(board, /Import saved journey/)
assert.match(board, /prefers-reduced-motion/)
assert.match(board, /:style="\{ '--eco-text-scale': displayScale \}"/)
assert.match(board, /visibleOpeningChoices\(card\)/)
assert.match(board, /v-for="\(paragraph, index\) in revealedBody"/)
assert.ok(
  !board.includes('@4xl:overflow-hidden'),
  'large text must not be clipped at desktop width',
)

console.log(
  'Ecotone first impressions: 12 avatars, personal runs, fewer opening temptations, undo and settings contract passed',
)
