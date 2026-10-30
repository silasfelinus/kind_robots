import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chanceFrom, tileAt } from '../everyVillainTactics/combat'
import { createStory } from '../everyVillainTactics/firstBellStory'
import {
  canonicalJson,
  createSave,
  loadSave,
  saveChecksum,
  type EvtSave,
} from '../everyVillainTactics/saves'
import {
  incomingSpawns,
  ruleProblems,
  rulesFor,
  victoryLine,
} from '../everyVillainTactics/stageRules'
import {
  MAX_DRAFTS,
  emptyLibrary,
  exportStage,
  importStage,
  removeDraft,
  sanitizeLibrary,
  upsertDraft,
} from '../everyVillainTactics/stageShare'
import {
  STAGE_PRESETS,
  clonePreset,
  paintStage,
  setBoss,
  setVictory,
  setWave,
  stageProblems,
  type StageDraft,
} from '../everyVillainTactics/studio'
import {
  endTurn,
  fireSelected,
  rescueSelected,
  trainingState,
  type TrainingState,
  type Unit,
} from '../everyVillainTactics/training'

const unit = (state: TrainingState, id: string) =>
  state.units.find((u) => u.id === id)!
const place = (u: Unit, x: number, y: number) => {
  u.x = x
  u.y = y
}
/** Keep the squad standing so hazard and objective checks are isolated. */
function healSquad(state: TrainingState) {
  for (const u of state.units)
    if (u.team === 'squad') u.hp = Math.max(u.hp, u.maxHp)
}
function oneShotSave(stage: StageDraft, state: TrainingState): EvtSave {
  return createSave({
    slot: 'slot-1',
    perspective: 'hero',
    leadSignature: 'accident-fire',
    stage,
    state,
    story: { ...createStory(), current: null },
    savedAt: '2026-10-30T16:00:00.000Z',
  })
}
function forge(save: EvtSave, edit: (s: EvtSave) => void): string {
  const copy = structuredClone(save)
  edit(copy)
  const { checksum: _old, ...payload } = copy
  return JSON.stringify({ ...payload, checksum: saveChecksum(payload) })
}
const roundTrips = (stage: StageDraft, state: TrainingState) => {
  const loaded = loadSave(JSON.stringify(oneShotSave(stage, state)))
  assert.ok(loaded.ok, loaded.ok ? '' : loaded.reason)
  assert.equal(
    canonicalJson(loaded.save.state),
    canonicalJson(JSON.parse(JSON.stringify(state))),
  )
  return loaded
}

// Stages without live rules keep the exact original battle shape.
for (const id of ['first-bell', 'college-quad', 'picnic-plaza']) {
  const plain = trainingState(9, clonePreset(id))
  assert.equal(plain.rules, undefined, id)
  assert.equal(plain.field, undefined, id)
}

// ---- Destructible props ---------------------------------------------------
const boiler = clonePreset('boiler-room')
assert.deepEqual(stageProblems(boiler), [])
let s = trainingState(0x51, boiler)
assert.equal(s.rules!.victory.kind, 'survive')
assert.ok(boiler.map.tiles['2,2'] === undefined, 'the draft map is untouched')
assert.deepEqual(tileAt(s.map, { x: 2, y: 2 }).cover, {
  north: 'half',
  south: 'half',
  east: 'half',
  west: 'half',
})
const shooter = unit(s, 'backdraft')
const crateTarget = unit(s, 'pip')
place(shooter, 0, 2)
place(unit(s, 'hattie'), 0, 0)
place(crateTarget, 2, 2)
assert.equal(chanceFrom(s.map, shooter, crateTarget).cover, 20)
let shots = 0
while (s.field!.props[0]!.hp > 0 && crateTarget.hp > 0 && shots < 4) {
  shooter.ap = 2
  shooter.fired = false
  assert.ok(fireSelected(s, crateTarget))
  shots++
}
assert.equal(shots, 2, 'a 2-HP crate breaks after two shots, hit or miss')
assert.equal(s.field!.props[0]!.hp, 0)
assert.equal(tileAt(s.map, { x: 2, y: 2 }).cover, undefined)
assert.ok(s.events.some((e) => e.includes('shatters')))
if (crateTarget.hp > 0)
  assert.equal(chanceFrom(s.map, shooter, crateTarget).cover, 0)
const brokenSave = oneShotSave(boiler, s)
roundTrips(boiler, s)
assert.equal(
  loadSave(
    forge(brokenSave, (f) => {
      f.state.field!.props[0]!.hp = 2
    }),
  ).ok,
  false,
  'restoring a broken crate without its cover is rejected',
)
assert.equal(
  loadSave(
    forge(brokenSave, (f) => {
      f.state.field!.props[1]!.hp = 9
    }),
  ).ok,
  false,
  'prop HP cannot exceed its authored maximum',
)
assert.equal(
  loadSave(
    forge(brokenSave, (f) => {
      f.state.rules!.props[0]!.hp = 3
    }),
  ).ok,
  false,
  'rules cannot drift from the stage',
)

// ---- Ticking hazards ------------------------------------------------------
// Without the wave, so the round's hazard notes stay in the 6-line log.
const hazardStage = clonePreset('boiler-room')
delete hazardStage.waves
s = trainingState(0x77, hazardStage)
assert.deepEqual(s.field!.fire, [{ x: 4, y: 2 }])
assert.deepEqual(s.field!.fireNext, { x: 5, y: 2 }, 'spread is telegraphed')
const burner = unit(s, 'hattie')
const wader = unit(s, 'backdraft')
place(burner, 4, 2)
place(wader, 2, 0)
// Each round the marked tile either catches fire or, if someone is standing
// on it when the round ends, the spread is stamped out.
let spreads = 0
let stamps = 0
for (let round = 1; round <= 2; round++) {
  healSquad(s)
  const target = s.field!.fireNext!
  const burning = s.field!.fire.length
  endTurn(s)
  const standing = s.units.some(
    (u) => u.hp > 0 && u.x === target.x && u.y === target.y,
  )
  if (standing) {
    stamps++
    assert.equal(s.field!.fire.length, burning)
    assert.ok(s.events.some((e) => e.includes('stamps out')))
  } else {
    spreads++
    assert.ok(s.field!.fire.some((p) => p.x === target.x && p.y === target.y))
  }
  if (round === 1) {
    assert.ok(s.events.some((e) => e.includes('caught in the fire')))
    assert.ok(
      !s.events.some((e) => e.includes('live water')),
      'water is calm on odd rounds',
    )
  } else assert.ok(s.events.some((e) => e.includes('live water')))
}
assert.equal(spreads + stamps, 2)
healSquad(s)
// Weak floor (4,3) gives way at the end of round 3 and shoves its occupant.
const faller = unit(s, 'hattie')
place(faller, 4, 3)
assert.ok(!s.field!.collapsed.includes('floor-1'))
const hpBeforeFall = faller.hp
endTurn(s)
assert.ok(s.field!.collapsed.includes('floor-1'))
assert.equal(tileAt(s.map, { x: 4, y: 3 }).wall, true)
assert.ok(!(faller.x === 4 && faller.y === 3), 'the occupant is shoved off')
assert.ok(faller.hp < hpBeforeFall || faller.hp === 0)
assert.ok(s.events.some((e) => e.includes('gives way')))
healSquad(s)
roundTrips(hazardStage, s)
const hazardSave = oneShotSave(hazardStage, s)
assert.equal(
  loadSave(
    forge(hazardSave, (f) => {
      f.state.field!.collapsed = []
    }),
  ).ok,
  false,
  'a fallen floor cannot be un-collapsed',
)
assert.equal(
  loadSave(
    forge(hazardSave, (f) => {
      f.state.field!.fire = f.state.field!.fire.slice(1)
    }),
  ).ok,
  false,
  'authored fire origins never go out',
)

// ---- Reinforcement waves --------------------------------------------------
s = trainingState(0x33, boiler)
assert.deepEqual(incomingSpawns(s.rules!, 1), [])
endTurn(s)
healSquad(s)
assert.deepEqual(incomingSpawns(s.rules!, s.turn), boiler.waves![0]!.spawns)
assert.ok(s.events.some((e) => e.includes('Reinforcements arrive next round')))
const blocker = unit(s, 'hattie')
place(blocker, 8, 5)
endTurn(s)
assert.equal(s.turn, 3)
assert.deepEqual(s.field!.reinforced, ['wave1-1'])
assert.deepEqual(s.field!.sealed, ['wave1-2'])
const arrived = unit(s, 'wave1-1')
assert.equal(arrived.team, 'rival')
assert.equal(arrived.hp, 1, 'reinforcements are one-hit SPECIES crew')
assert.equal(arrived.henchmanType, 'burrow')
const waveSave = oneShotSave(boiler, s)
roundTrips(boiler, s)
assert.equal(
  loadSave(
    forge(waveSave, (f) => {
      f.state.units = f.state.units.filter((u) => u.id !== 'wave1-1')
    }),
  ).ok,
  false,
  'an arrived reinforcement cannot be deleted',
)
assert.equal(
  loadSave(
    forge(waveSave, (f) => {
      f.state.field!.sealed = []
    }),
  ).ok,
  false,
  'a due wave must be resolved',
)
assert.equal(
  loadSave(
    forge(waveSave, (f) => {
      f.state.units.find((u) => u.id === 'wave1-1')!.hp = 4
    }),
  ).ok,
  false,
  'reinforcement HP cannot be inflated',
)

// ---- Victory and failure conditions ---------------------------------------
// Survive: winning by lasting the authored rounds, not by clearing the map.
s = trainingState(0x91, boiler)
for (let round = 1; round <= 6 && s.phase === 'active'; round++) {
  healSquad(s)
  endTurn(s)
}
assert.equal(s.phase, 'victory')
assert.equal(s.turn, 6)
assert.ok(s.events.some((e) => e.includes('6 rounds survived')))
roundTrips(boiler, s)

// Hold the zone for three rounds.
const fountain = clonePreset('fountain-hold')
assert.deepEqual(stageProblems(fountain), [])
s = trainingState(0x45, fountain)
for (let round = 1; round <= 5 && s.phase === 'active'; round++) {
  healSquad(s)
  place(unit(s, 'backdraft'), 3, 2)
  place(unit(s, 'hattie'), 3, 3)
  endTurn(s)
}
assert.equal(s.phase, 'victory')
assert.equal(s.field!.held, 3)
assert.equal(
  victoryLine(s.rules, s.field, s.turn),
  'Hold the zone: 3 / 3 rounds',
)
roundTrips(fountain, s)

// Defeat the boss: the other rivals can still be standing.
const bossStage = setBoss(
  setVictory(clonePreset('college-quad'), 'defeat-boss'),
  'vee',
)
assert.deepEqual(stageProblems(bossStage), [])
s = trainingState(0x12, bossStage)
const boss = unit(s, 'vee')
const hunter = unit(s, 'backdraft')
place(hunter, 7, 3)
for (let i = 0; i < 30 && boss.hp > 0; i++) {
  hunter.ap = 2
  hunter.fired = false
  fireSelected(s, boss)
}
assert.equal(boss.hp, 0)
assert.equal(s.phase, 'victory')
assert.ok(unit(s, 'pip').hp > 0 && unit(s, 'remy').hp > 0)

// Rescue: win at the authored count, lose once it becomes impossible.
const rescueStage = setVictory(clonePreset('picnic-plaza'), 'rescue', 2)
assert.deepEqual(stageProblems(rescueStage), [])
function evacuate(state: TrainingState, index: number) {
  const civilian = state.civilians![index]!
  const hero = unit(state, state.selected)
  place(hero, civilian.x === 0 ? 1 : civilian.x - 1, civilian.y)
  hero.ap = 2
  assert.ok(rescueSelected(state))
}
s = trainingState(0x5, rescueStage)
evacuate(s, 0)
assert.equal(s.phase, 'active')
evacuate(s, 1)
assert.equal(s.phase, 'victory')
assert.ok(unit(s, 'pip').hp > 0, 'rescue wins without clearing the rivals')
s = trainingState(0x5, setVictory(clonePreset('picnic-plaza'), 'rescue', 3))
s.civilians![2]!.status = 'lost'
evacuate(s, 0)
assert.equal(s.phase, 'defeat')
assert.ok(s.events.some((e) => e.includes('Too many civilians')))

// Defeat all with a wave pending: clearing the board early is not a win.
const pendingStage = setVictory(clonePreset('boiler-room'), 'defeat-all')
assert.equal(pendingStage.victory, undefined)
s = trainingState(0x8, pendingStage)
for (const id of ['pip', 'vee', 'remy']) unit(s, id).hp = 0
endTurn(s)
assert.equal(s.phase, 'active', 'reinforcements are still due')
healSquad(s)
endTurn(s)
assert.equal(s.turn, 3)
assert.equal(s.field!.reinforced.length, 2)
for (const id of s.field!.reinforced) unit(s, id).hp = 0
endTurn(s)
assert.equal(s.phase, 'victory')

// ---- Determinism ------------------------------------------------------------
function scripted(seed: number) {
  const run = trainingState(seed, boiler)
  for (let round = 0; round < 5 && run.phase === 'active'; round++) {
    const hero = unit(run, 'backdraft')
    const target = run.units.find((u) => u.team === 'rival' && u.hp > 0)
    if (target) fireSelected(run, target)
    hero.ap = 2
    endTurn(run)
  }
  return canonicalJson(run)
}
assert.equal(scripted(0xabc), scripted(0xabc))

// ---- Studio painting and validation -------------------------------------
let draft = clonePreset('college-quad')
draft = paintStage(draft, { x: 1, y: 1 }, 'prop')
assert.deepEqual(draft.props, [
  { id: 'prop-1', x: 1, y: 1, cover: 'half', hp: 2 },
])
draft = paintStage(draft, { x: 1, y: 1 }, 'prop')
assert.equal(draft.props![0]!.cover, 'full')
assert.equal(draft.props![0]!.hp, 3)
draft = paintStage(draft, { x: 1, y: 1 }, 'prop')
assert.equal(draft.props, undefined)
draft = paintStage(draft, { x: 2, y: 1 }, 'fire')
draft = paintStage(draft, { x: 3, y: 1 }, 'water')
draft = paintStage(draft, { x: 3, y: 4 }, 'collapse')
assert.deepEqual(
  draft.activeHazards!.map((h) => h.kind),
  ['fire', 'water', 'collapse'],
)
assert.equal(draft.activeHazards![2]!.round, 3)
assert.equal(
  paintStage(draft, { x: 0, y: 4 }, 'fire'),
  draft,
  'fire cannot start under a spawn',
)
draft = paintStage(draft, { x: 2, y: 1 }, 'water')
assert.equal(draft.activeHazards![2]!.kind, 'water', 'a brush swaps kinds')
draft = paintStage(draft, { x: 8, y: 0 }, 'reinforce')
draft = paintStage(draft, { x: 8, y: 5 }, 'reinforce')
assert.equal(draft.waves![0]!.spawns.length, 2)
assert.equal(draft.waves![0]!.crew, 'warren-wreckers')
draft = setWave(draft, { round: 4, crew: 'wombat-ronin' })
assert.equal(draft.waves![0]!.round, 4)
draft = paintStage(draft, { x: 1, y: 1 }, 'zone')
assert.equal(draft.victory!.kind, 'hold-zone')
draft = setVictory(draft, 'hold-zone', 2)
assert.deepEqual(stageProblems(draft), [])
assert.ok(rulesFor(draft))
draft = paintStage(draft, { x: 8, y: 5 }, 'wall')
assert.deepEqual(draft.waves![0]!.spawns, [{ x: 8, y: 0 }])
draft = paintStage(draft, { x: 1, y: 1 }, 'wall')
assert.deepEqual(draft.victory, { kind: 'defeat-all' })
draft = paintStage(draft, { x: 3, y: 4 }, 'wall')
assert.ok(!draft.activeHazards!.some((h) => h.x === 3 && h.y === 4))
// Live battle from a painted draft uses the same engine.
const painted = trainingState(4, draft)
assert.equal(painted.field!.fire.length, 0, 'the painted fire became water')

const bad: StageDraft = {
  ...clonePreset('college-quad'),
  props: [{ id: 'p', x: 4, y: 2, cover: 'half', hp: 4 }],
  activeHazards: [
    { id: 'f', kind: 'fire', x: 0, y: 4 },
    { id: 'c', kind: 'collapse', x: 1, y: 1, round: 0 },
  ],
  waves: [{ round: 1, crew: 'warren-wreckers', spawns: [{ x: 4, y: 3 }] }],
  victory: { kind: 'rescue', count: 1 },
}
const problems = ruleProblems(bad)
for (const expected of [
  'Props must stand on walkable ground.',
  'Props have 1 to 3 hit points.',
  'Fire and weak floors cannot start under a unit.',
  'A weak floor gives way on round 1 to 40.',
  'Reinforcements arrive on round 2 to 40.',
  'Reinforcements must arrive on safe walkable ground.',
  'A rescue objective needs civilians.',
])
  assert.ok(problems.includes(expected), expected + ' in ' + problems)
assert.ok(
  ruleProblems({
    ...clonePreset('college-quad'),
    victory: { kind: 'defeat-boss', unit: 'backdraft' },
  }).includes('The boss must be one of the three rival spawns.'),
)

// Warren Wreckers outside Picnic Panic never fire its scene triggers, so a
// quarry save after an emergence still loads.
const quarry = clonePreset('quarry-lieutenant')
s = trainingState(0x21, quarry)
for (let round = 0; round < 4 && s.phase === 'active'; round++) {
  healSquad(s)
  endTurn(s)
}
assert.ok(s.events.length > 0)
assert.ok(!s.fired!.some((id) => id.startsWith('picnic:')))
roundTrips(quarry, s)

// ---- Local drafts and share codes ------------------------------------------
for (const preset of STAGE_PRESETS) {
  const imported = importStage(exportStage(preset))
  assert.ok(imported.ok, preset.id + (imported.ok ? '' : imported.reason))
  assert.equal(canonicalJson(imported.stage), canonicalJson(preset), preset.id)
}
const imported = importStage(exportStage(boiler))
assert.ok(imported.ok)
assert.equal(
  canonicalJson(trainingState(0x51, imported.stage)),
  canonicalJson(trainingState(0x51, boiler)),
  'an imported stage plays exactly like the original',
)
const code = JSON.parse(exportStage(boiler))
const refuse = (text: string, why: string) => {
  const result = importStage(text)
  assert.equal(result.ok, false, why)
  return result.ok ? '' : result.reason
}
refuse('', 'empty')
refuse('{not json', 'unreadable')
refuse('x'.repeat(30_000), 'oversized')
refuse(JSON.stringify({ ...code, kind: 'other-game' }), 'wrong kind')
refuse(JSON.stringify({ ...code, version: 2 }), 'future version')
refuse(
  JSON.stringify({ ...code, stage: { ...code.stage, encounter: 'dragons' } }),
  'unknown encounter',
)
refuse(
  JSON.stringify({ ...code, stage: { ...code.stage, id: '<script>' } }),
  'unsafe id',
)
refuse(
  JSON.stringify({
    ...code,
    stage: { ...code.stage, title: 'x'.repeat(200) },
  }),
  'long title',
)
refuse(
  JSON.stringify({
    ...code,
    stage: {
      ...code.stage,
      map: {
        ...code.stage.map,
        tiles: { '0,4': { elevation: 0, wall: true } },
      },
    },
  }),
  'a spawn inside a wall fails studio validation',
)
refuse(
  JSON.stringify({
    ...code,
    stage: {
      ...code.stage,
      activeHazards: [{ id: 'f', kind: 'lava', x: 1, y: 1 }],
    },
  }),
  'unknown hazard',
)
// Unknown keys are dropped rather than carried into the game.
const sneaky = importStage(
  '{"kind":"every-villain-tactics-stage","version":1,"stage":' +
    JSON.stringify({
      ...code.stage,
      onload: 'alert(1)',
      extra: { a: 1 },
    }).replace(/^\{/, '{"__proto__":{"polluted":true},') +
    '}',
)
assert.ok(sneaky.ok)
assert.equal(
  (sneaky.stage as unknown as Record<string, unknown>).onload,
  undefined,
)
assert.equal(({} as Record<string, unknown>).polluted, undefined)

let shelf = emptyLibrary()
const saved = upsertDraft(shelf, '  Boiler v1 ', boiler, '2026-10-30T16:00:00Z')
assert.ok(saved.ok)
shelf = saved.library
assert.equal(shelf.drafts[0]!.name, 'Boiler v1')
const replaced = upsertDraft(
  shelf,
  'Boiler v1',
  fountain,
  '2026-10-30T16:05:00Z',
)
assert.ok(replaced.ok && replaced.library.drafts.length === 1)
assert.equal(
  replaced.ok && replaced.library.drafts[0]!.stage.id,
  'fountain-hold',
)
assert.equal(upsertDraft(shelf, '', boiler, '2026-10-30T16:00:00Z').ok, false)
assert.equal(
  upsertDraft(shelf, 'Broken', bad, '2026-10-30T16:00:00Z').ok,
  false,
  'an invalid stage cannot be saved as a draft',
)
for (let n = 1; n < MAX_DRAFTS; n++) {
  const next = upsertDraft(shelf, 'Draft ' + n, boiler, '2026-10-30T16:00:00Z')
  assert.ok(next.ok)
  shelf = next.library
}
assert.equal(shelf.drafts.length, MAX_DRAFTS)
assert.equal(
  upsertDraft(shelf, 'One too many', boiler, '2026-10-30T16:00:00Z').ok,
  false,
)
assert.equal(removeDraft(shelf, 'Draft 1').drafts.length, MAX_DRAFTS - 1)
const stored = sanitizeLibrary(
  JSON.stringify({
    version: 1,
    drafts: [
      shelf.drafts[0],
      shelf.drafts[0],
      { name: 'Bad map', savedAt: '2026-10-30T16:00:00Z', stage: bad },
      { name: 'No date', savedAt: 'soon', stage: boiler },
      { name: 'Garbage', savedAt: '2026-10-30T16:00:00Z', stage: 42 },
    ],
  }),
)
assert.deepEqual(
  stored.drafts.map((d) => d.name),
  [shelf.drafts[0]!.name],
)
assert.deepEqual(sanitizeLibrary('nope'), emptyLibrary())

// UI contracts: board markers, rule line, studio rule controls and drafts.
const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
for (const id of [
  'tactics-field-mark',
  'tactics-rule-line',
  'studio-victory',
  'studio-drafts',
  'studio-export',
  'studio-import',
  'studio-rule-mark',
])
  assert.match(page, new RegExp('data-testid="' + id + '"'))
assert.match(page, /value: 'reinforce', label: 'Wave hatch'/)
assert.doesNotMatch(page, /localStorage/, 'the store owns storage')

console.log(
  'Every Villain stage rules: breakable props, fire/live-water/weak-floor ticks, telegraphed waves with sealing, survive/hold/boss/rescue/defeat-all outcomes, studio brushes and save forgery checks, local drafts and share-code import guards verified.',
)
