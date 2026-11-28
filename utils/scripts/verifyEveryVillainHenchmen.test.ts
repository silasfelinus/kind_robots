// One-hit henchmen and Picnic Panic encounter timing, adversarially
// playtested. Seeded bots (stand-still, shooter, rescuer, balanced and a
// random fuzzer that also fires signature powers) play the real engine for
// every canonical lead; every round must keep sane state, round-trip through
// a validated save, and finish. Victory and defeat must both be reachable,
// and every seeded start must be winnable by at least one plan.
import {
  CREW_TELEGRAPH_MEDIA_DIMENSIONS,
  matchesCrewTelegraphDimensions,
} from '../everyVillainTactics/crewTelegraphMedia'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import {
  CREW_COMBAT_ART,
  CREW_COMBAT_POSES,
  crewCombatReceipt,
} from '../everyVillainTactics/crewCombatArt'
import {
  CREW_TELL_ART,
  CREW_TELL_BEATS,
  crewCaptainArtReceipt,
  crewTellReceipt,
  crewUnitArtReceipt,
  isCrewTellKind,
  type CrewTellKind,
} from '../everyVillainTactics/crewTelegraphArt'
import {
  gridDistance,
  reachableCells,
  resolveAttack,
  resolveOverwatch,
  tileAt,
} from '../everyVillainTactics/combat'
import { createStory } from '../everyVillainTactics/firstBellStory'
import {
  dismissPicnicScene,
  pendingPicnicScene,
  picnicCounts,
} from '../everyVillainTactics/picnicPanic'
import {
  createSave,
  loadSave,
  serializeSave,
} from '../everyVillainTactics/saves'
import { incomingSpawns } from '../everyVillainTactics/stageRules'
import { clonePreset, stageProblems } from '../everyVillainTactics/studio'
import {
  HENCHMAN_TELLS,
  endTurn,
  fireSelected,
  henchmanTell,
  hunkerSelected,
  overwatchSelected,
  moveSelected,
  previewShot,
  rescueSelected,
  rescueTargets,
  selectedPowerTargets,
  trainingState,
  useSelectedPower,
  waveUnit,
  type TrainingState,
  type Unit,
} from '../everyVillainTactics/training'

const picnic = clonePreset('picnic-plaza')
assert.deepEqual(stageProblems(picnic), [])
assert.equal(picnic.turnLimit, 7)
assert.deepEqual(
  picnic.waves?.map((wave) => [wave.round, wave.spawns.length]),
  [
    [3, 2],
    [5, 2],
  ],
  'two timed shifts after the opening crew',
)
assert.match(picnic.objective, /rounds 3 and 5/)

// ---- One-hit tiers read distinctly on the card ------------------------------
const crests = Object.values(HENCHMAN_TELLS).map((tell) => tell.crest)
assert.deepEqual(Object.keys(HENCHMAN_TELLS).sort(), [
  'burrow',
  'cinder',
  'drytap',
  'hush',
  'phase',
  'windup',
])
assert.equal(new Set(crests).size, 6, 'each tier has its own crest')
assert.ok(!crests.includes('✦') && !crests.includes('◆'), 'never hero/boss')
for (const tell of Object.values(HENCHMAN_TELLS))
  assert.match(
    tell.tell,
    /stand on|step away|leave the tile/i,
    'every tier names its counter',
  )

const crewStages: Array<[string, Unit['henchmanType']]> = [
  ['picnic-plaza', 'burrow'],
  ['quad-portal-watch', 'phase'],
  ['lab-mascot-recall', 'windup'],
  ['quarry-lieutenant', 'burrow'],
]
const allHenchmen: Unit[] = []
for (const [id, type] of crewStages) {
  const stage = clonePreset(id)
  const state = trainingState(11, stage)
  const crew = state.units.filter((u) => u.henchmanType)
  assert.ok(crew.length >= 2, id + ' fields a crew')
  for (const unit of crew) {
    assert.equal(unit.henchmanType, type)
    assert.equal(unit.maxHp, 1, unit.henchmanName + ' is one-hit')
    assert.equal(henchmanTell(unit)?.type, type)
  }
  for (const unit of state.units.filter((u) => !u.henchmanType))
    assert.equal(henchmanTell(unit), null, 'heroes and lieutenants are not')
  allHenchmen.push(...crew)
  // Timed reinforcements are the same one-hit tier as the opening crew.
  for (const [w, wave] of (state.rules?.waves ?? []).entries())
    for (const [s] of wave.spawns.entries()) {
      const unit = waveUnit(state.rules!, 'wave' + (w + 1) + '-' + (s + 1))!
      assert.equal(unit.maxHp, 1)
      assert.ok(henchmanTell(unit), unit.id + ' shows the one-hit tag')
      allHenchmen.push(unit)
    }
}
const mags = trainingState(11, clonePreset('quarry-lieutenant')).units.find(
  (u) => u.lieutenantName,
)!
assert.ok(mags.maxHp > 1 && henchmanTell(mags) === null, 'named elite')

// Any landed hit drops any henchman: a plain shot, the weakest 1-damage
// shot, and a 1-damage overwatch reaction.
const shooter = trainingState(3).units[0]!
for (const henchman of allHenchmen)
  for (const kind of ['shot', 'graze', 'overwatch'] as const) {
    let landed = false
    for (let seed = 1; seed < 400 && !landed; seed++) {
      const target = structuredClone(henchman)
      const attacker = {
        ...structuredClone(shooter),
        x: target.x === 0 ? 1 : target.x - 1,
        y: target.y,
        ap: 2,
        fired: false,
        overwatch: kind === 'overwatch',
      }
      const rng = { seed }
      const result =
        kind === 'overwatch'
          ? resolveOverwatch(rng, picnic.map, attacker, target)
          : resolveAttack(
              rng,
              picnic.map,
              attacker,
              target,
              kind === 'shot' ? 2 : 1,
            )
      assert.ok(result, 'adjacent shot resolves')
      if (!result.hit) continue
      landed = true
      assert.equal(target.hp, 0, henchman.id + ' survived a ' + kind)
    }
    assert.ok(landed)
  }

// ---- Burrowers go for the picnic, with a full turn of warning ---------------
const opening = trainingState(21, picnic)
dismissPicnicScene(opening, 'picnic:opening')
endTurn(opening)
const rings = opening.units.filter((u) => u.burrowTarget)
assert.equal(rings.length, 3)
const families = opening.civilians!.filter((c) => c.status === 'waiting')
const swallow = rings.filter((u) =>
  families.some((c) => gridDistance(c, u.burrowTarget!) === 1),
)
assert.ok(swallow.length >= 2, 'most rings threaten families first')
const cleared = trainingState(21, picnic)
for (const civilian of cleared.civilians!) civilian.status = 'rescued'
endTurn(cleared)
for (const unit of cleared.units.filter((u) => u.burrowTarget))
  assert.ok(
    cleared.units.some(
      (hero) =>
        hero.team === 'squad' && gridDistance(hero, unit.burrowTarget!) === 1,
    ),
    'with the lawn clear, rings land beside heroes',
  )
assert.match(opening.log, /dust rings/, 'live rings own the status line')
assert.ok(opening.events.some((e) => e.includes('Reinforcements arrive')))

// ---- Encounter timing: whistled shifts, molehills, sealing ------------------
assert.ok(opening.fired!.includes('picnic:shift-change'), 'whistle on round 2')
assert.equal(opening.turn, 2)
assert.equal(incomingSpawns(opening.rules!, opening.turn).length, 2)
dismissPicnicScene(opening, 'picnic:first-emergence')
const whistle = pendingPicnicScene(opening)!
assert.equal(whistle.id, 'picnic:shift-change')
assert.ok(whistle.lines.some((l) => l.text.includes('two fresh molehills')))
assert.ok(whistle.lines.some((l) => l.text.includes('walk the families')))
const timing = structuredClone(opening) as TrainingState
const hatch = timing.rules!.waves[0]!.spawns[0]!
const sealer = timing.units.find((u) => u.team === 'squad')!
sealer.x = hatch.x
sealer.y = hatch.y
endTurn(timing)
assert.equal(timing.turn, 3)
assert.deepEqual(timing.field!.sealed, ['wave1-1'], 'a boot caves it in')
assert.deepEqual(timing.field!.reinforced, ['wave1-2'])
assert.ok(
  timing.events.some((e) => e.includes('pops out of the molehill')),
  'the Wreckers tunnel in rather than use a hatch',
)
// A Wrecker squatting on a molehill crowds out its own reinforcement, and
// the log says who was in the way.
const crowded = structuredClone(opening) as TrainingState
const squatter = crowded.units.find((u) => u.henchmanType && u.hp > 0)!
const hill = crowded.rules!.waves[0]!.spawns[1]!
Object.assign(squatter, { x: hill.x, y: hill.y, burrowTarget: null })
endTurn(crowded)
assert.ok(crowded.field!.sealed.includes('wave1-2'))
assert.ok(
  crowded.events.some((e) => e.includes('is in the way of the molehill')),
)
/** Plays rounds without combat: the squad stays healthy, families safe. */
function whistles(stage: typeof picnic, rounds: number) {
  const s = trainingState(21, stage)
  for (const civilian of s.civilians!) civilian.status = 'rescued'
  const heard: Array<[number, string]> = []
  for (let round = 1; round < rounds && s.phase === 'active'; round++) {
    for (const u of s.units) if (u.team === 'squad') u.hp = u.maxHp
    endTurn(s)
    for (const id of ['picnic:shift-change', 'picnic:overtime'])
      if (s.fired!.includes(id) && !heard.some(([, h]) => h === id))
        heard.push([s.turn, id])
  }
  return heard
}
assert.deepEqual(whistles(picnic, 5), [
  [2, 'picnic:shift-change'],
  [4, 'picnic:overtime'],
])
// A studio remix with a third shift saves "overtime" for the real last one.
const remix = clonePreset('picnic-plaza')
remix.waves!.push({
  round: 7,
  crew: 'warren-wreckers',
  spawns: [{ x: 4, y: 5 }],
})
assert.deepEqual(stageProblems(remix), [])
assert.deepEqual(whistles(remix, 7), [
  [2, 'picnic:shift-change'],
  [6, 'picnic:overtime'],
])
const empty = trainingState(21, picnic)
for (const civilian of empty.civilians!) civilian.status = 'rescued'
empty.fired!.push('picnic:shift-change', 'seen:picnic:opening')
const quiet = pendingPicnicScene(empty)!
assert.equal(quiet.id, 'picnic:shift-change')
assert.ok(quiet.lines.some((l) => l.text.includes('crossfire')))

// The gym's round-three fire alarm belongs to First Bell, not the plaza.
const plaza = trainingState(4, picnic)
const bell = trainingState(4)
for (let i = 0; i < 2; i++) {
  for (const unit of plaza.units) if (unit.team === 'squad') unit.hp = 9
  endTurn(plaza)
  endTurn(bell)
}
assert.equal(plaza.turn, 3)
assert.ok(!plaza.fired!.includes('fire-alarm'))
assert.ok(!plaza.events.some((e) => e.includes('fire alarm')))
if (bell.phase === 'active') assert.ok(bell.fired!.includes('fire-alarm'))

// ---- Seeded adversarial playtest --------------------------------------------
type Policy = 'stand' | 'shooter' | 'rescuer' | 'balanced' | 'random'
const POLICIES: Policy[] = ['stand', 'shooter', 'rescuer', 'balanced', 'random']
const leads = IDENTITY_ARCS.map((arc) => arc.signature)
assert.equal(leads.length, 48)

function lcg(seed: number) {
  let s = seed >>> 0 || 1
  return (n: number) => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s % n
  }
}
const living = (s: TrainingState, team: string) =>
  s.units.filter((u) => u.team === team && u.hp > 0)
const freeCell = (s: TrainingState, c: { x: number; y: number }) =>
  !s.units.some((u) => u.hp > 0 && u.x === c.x && u.y === c.y)

function bestShot(s: TrainingState, unit: Unit) {
  if (unit.fired) return null
  return (
    living(s, 'rival')
      .map((target) => ({ target, shot: previewShot(unit, target, s.map) }))
      .filter((option) => option.shot.clear && option.shot.hit > 0)
      .sort(
        (a, b) =>
          b.shot.hit - a.shot.hit || a.target.id.localeCompare(b.target.id),
      )[0] ?? null
  )
}
function act(s: TrainingState, policy: Policy, roll: (n: number) => number) {
  if (policy === 'stand') return
  for (const unit of living(s, 'squad')) {
    s.selected = unit.id
    for (let step = 0; step < 4; step++) {
      if (s.phase !== 'active' || unit.hp <= 0 || unit.ap <= 0) break
      if (policy === 'random') {
        const options: Array<() => boolean> = [
          () => rescueSelected(s),
          () => overwatchSelected(s),
          () => hunkerSelected(s),
          () => {
            const target = living(s, 'rival')[roll(9)]
            return !!target && fireSelected(s, target)
          },
          () => {
            const cells = reachableCells(s.map, s.units, unit).filter((c) =>
              freeCell(s, c),
            )
            const cell = cells[roll(cells.length || 1)]
            return !!cell && moveSelected(s, cell)
          },
          () => {
            const cells = selectedPowerTargets(s)
            const cell = cells[roll(cells.length || 1)]
            return !!cell && useSelectedPower(s, cell)
          },
        ]
        if (!options[roll(options.length)]!()) continue
        continue
      }
      if (policy !== 'shooter' && rescueTargets(s).length && rescueSelected(s))
        continue
      const shot = bestShot(s, unit)
      const eager = policy === 'shooter' ? 0 : policy === 'balanced' ? 55 : 101
      if (shot && shot.shot.hit >= eager && fireSelected(s, shot.target))
        continue
      if (!unit.moved && policy !== 'shooter') {
        const waiting = s.civilians!.filter((c) => c.status === 'waiting')
        const marks = [
          ...s.units
            .filter((u) => u.hp > 0 && u.burrowTarget)
            .map((u) => u.burrowTarget!),
          ...incomingSpawns(s.rules!, s.turn),
        ]
        // Balanced play also hunts: the best shot it would have from there.
        const hunt = !unit.fired && policy === 'balanced'
        const huntWeight = waiting.length ? 0.3 : 1
        const score = (c: { x: number; y: number; cost: number }) => {
          const near = Math.min(99, ...waiting.map((w) => gridDistance(w, c)))
          const aim = hunt
            ? Math.max(
                0,
                ...living(s, 'rival').map(
                  (r) => previewShot({ ...unit, x: c.x, y: c.y }, r, s.map).hit,
                ),
              )
            : 0
          return (
            (marks.some((m) => m.x === c.x && m.y === c.y) ? 50 : 0) +
            (near <= 1 ? 40 - c.cost * 5 : -near * 3) +
            aim * huntWeight
          )
        }
        const best = reachableCells(s.map, s.units, unit)
          .filter(
            (c) =>
              freeCell(s, c) &&
              !waiting.some((w) => w.x === c.x && w.y === c.y),
          )
          .sort((a, b) => score(b) - score(a) || a.y - b.y || a.x - b.x)[0]
        if (best && (best.x !== unit.x || best.y !== unit.y))
          if (moveSelected(s, best)) continue
      }
      if (shot && fireSelected(s, shot.target)) continue
      if (!unit.moved && policy === 'shooter') {
        const rivals = living(s, 'rival')
        const step = reachableCells(s.map, s.units, unit)
          .filter((c) => c.cost === 1 && freeCell(s, c))
          .map((c) => ({
            c,
            d: Math.min(99, ...rivals.map((r) => gridDistance(r, c))),
          }))
          .sort((a, b) => a.d - b.d || a.c.y - b.c.y || a.c.x - b.c.x)[0]
        if (step && moveSelected(s, step.c)) continue
      }
      break
    }
  }
}

function sane(s: TrainingState, tag: string) {
  const seen = new Set<string>()
  for (const u of s.units) {
    assert.ok(Number.isInteger(u.hp) && u.hp >= 0 && u.hp <= u.maxHp, tag)
    assert.ok(Number.isInteger(u.ap) && u.ap >= 0 && u.ap <= 2, tag + ' ap')
    if (u.henchmanType && !u.lieutenantName) assert.equal(u.maxHp, 1, tag)
    if (u.hp <= 0) continue
    assert.ok(u.x >= 0 && u.y >= 0 && u.x < 9 && u.y < 6, tag + ' on board')
    assert.ok(!tileAt(s.map, u).wall, tag + ' not in a wall')
    assert.ok(!seen.has(u.x + ',' + u.y), tag + ' no stacked fighters')
    seen.add(u.x + ',' + u.y)
  }
  const counts = picnicCounts(s)
  assert.equal(counts.rescued + counts.lost + counts.waiting, counts.total)
  assert.ok(s.turn >= 1 && s.turn <= picnic.turnLimit! + 1, tag + ' turn')
  assert.ok(Number.isInteger(s.seed) && s.seed > 0, tag + ' rng')
  assert.ok(!/NaN|undefined/.test(s.log + s.events.join()), tag + ' prose')
}
function watchScenes(s: TrainingState) {
  for (let guard = 0; guard < 12; guard++) {
    const scene = pendingPicnicScene(s)
    if (!scene) return
    assert.ok(scene.lines.length >= 2)
    assert.ok(!/NaN|undefined/.test(scene.lines.map((l) => l.text).join()))
    assert.ok(dismissPicnicScene(s, scene.id), scene.id + ' dismisses')
  }
  assert.fail('scene queue never drains')
}

// 48 seeds give every canonical lead one start (7 and 48 are coprime).
// EVT_PLAYTEST_SEEDS=480 runs a deeper sweep locally.
const SEEDS = Math.max(48, Number(process.env.EVT_PLAYTEST_SEEDS) || 48)
const leadsUsed = new Set<string>()
const wins = new Map<number, Policy[]>()
const tally: Record<Policy, { victory: number; defeat: number }> = {
  stand: { victory: 0, defeat: 0 },
  shooter: { victory: 0, defeat: 0 },
  rescuer: { victory: 0, defeat: 0 },
  balanced: { victory: 0, defeat: 0 },
  random: { victory: 0, defeat: 0 },
}
const finales = new Set<string>()
const scenesSeen = new Set<string>()
let sealedRuns = 0
for (let seed = 1; seed <= SEEDS; seed++)
  for (const policy of POLICIES) {
    const lead = leads[(seed * 7) % leads.length]!
    const s = trainingState(seed * 7919, picnic, { lead })
    const roll = lcg(seed * 31 + POLICIES.indexOf(policy))
    const tag = policy + ' seed ' + seed + ' (' + lead + ')'
    leadsUsed.add(lead)
    for (let round = 0; round < 20 && s.phase === 'active'; round++) {
      watchScenes(s)
      act(s, policy, roll)
      sane(s, tag)
      endTurn(s)
      sane(s, tag)
      // Every round survives a real save/load, including waves and scenes.
      const loaded = loadSave(
        serializeSave(
          createSave({
            slot: 'auto',
            perspective: 'hero',
            leadSignature: lead,
            stage: picnic,
            state: s,
            story: { ...createStory(), current: null },
          }),
        ),
      )
      assert.ok(loaded.ok, tag + ': ' + (loaded.ok ? '' : loaded.reason))
      assert.deepEqual(loaded.save.state, s)
    }
    assert.notEqual(s.phase, 'active', tag + ' never finishes')
    for (const id of s.fired!) if (id.startsWith('seen:')) scenesSeen.add(id)
    watchScenes(s)
    const final = s.phase === 'victory' ? 'picnic:victory' : 'picnic:defeat'
    assert.ok(s.fired!.includes('seen:' + final), tag + ' finale shown')
    finales.add(final)
    if (s.field!.sealed.length) sealedRuns++
    tally[policy][s.phase === 'victory' ? 'victory' : 'defeat']++
    if (s.phase === 'victory') {
      assert.ok(living(s, 'rival').length === 0, 'won with the lawn clear')
      assert.ok(s.turn >= 5, 'the overtime shift must be faced')
      wins.set(seed, [...(wins.get(seed) ?? []), policy])
    }
  }

assert.equal(leadsUsed.size, 48, 'every canonical lead plays the picnic')
assert.deepEqual([...finales].sort(), ['picnic:defeat', 'picnic:victory'])
assert.equal(tally.stand.defeat, SEEDS, 'doing nothing loses the picnic')
assert.ok(tally.balanced.victory >= SEEDS * 0.9, JSON.stringify(tally))
for (let seed = 1; seed <= SEEDS; seed++)
  assert.ok(wins.get(seed)?.length, 'seed ' + seed + ' has a winning plan')
for (const id of [
  'picnic:opening',
  'picnic:first-emergence',
  'picnic:civilian-lost',
  'picnic:all-rescued',
  'picnic:shift-change',
  'picnic:overtime',
])
  assert.ok(scenesSeen.has('seen:' + id), id + ' is reachable in play')
assert.ok(sealedRuns > 0, 'somebody caved in a molehill')

// ---- Finales say what actually happened -------------------------------------
const timedOut = trainingState(5, picnic)
for (const civilian of timedOut.civilians!) civilian.status = 'rescued'
timedOut.phase = 'defeat'
timedOut.fired!.push('seen:picnic:opening')
const closed = pendingPicnicScene(timedOut)!
assert.equal(closed.id, 'picnic:defeat')
const closedText = closed.lines.map((l) => l.text).join(' ')
assert.match(closedText, /3 of 3 families evacuated, none lost/)
assert.match(closedText, /families are safe/)
assert.doesNotMatch(closedText, /bring everyone home/)
const wiped = structuredClone(timedOut) as TrainingState
wiped.civilians![0]!.status = 'lost'
for (const unit of wiped.units) if (unit.team === 'squad') unit.hp = 0
const wipedText = pendingPicnicScene(wiped)!
  .lines.map((l) => l.text)
  .join(' ')
assert.match(wipedText, /potato salad/)
assert.match(wipedText, /bring everyone home/)

// ---- The board shows it -----------------------------------------------------
const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
// All twelve unique real Krea 2 job and image receipts must be exposed through
// the existing authenticated art store, not treated as public URLs.
const kinds: CrewTellKind[] = ['burrow', 'phase', 'windup']
const tellImages = kinds.flatMap((kind) =>
  CREW_TELL_BEATS.map((beat) => crewTellReceipt(kind, beat)!),
)
assert.equal(tellImages.length, 12)
assert.equal(new Set(tellImages.map((r) => r.imageId)).size, 12)
assert.deepEqual(
  tellImages.map((r) => r.jobId),
  Array.from({ length: 12 }, (_, i) => 74393 + i),
)
assert.deepEqual(
  tellImages.map((r) => r.imageId),
  Array.from({ length: 12 }, (_, i) => 277786 + i),
)
for (const [kind, imageId] of [
  ['burrow', 277787],
  ['phase', 277791],
  ['windup', 277795],
] as const) {
  const receipt = crewUnitArtReceipt({ henchmanType: kind, maxHp: 1 })
  assert.equal(receipt?.imageId, imageId)
  assert.equal(receipt?.imageId, crewTellReceipt(kind, 'action')?.imageId)
  assert.ok(receipt?.artKey.startsWith('every-villain-tactics/henchmen/'))
}
assert.equal(crewUnitArtReceipt({ henchmanType: 'burrow', maxHp: 4 }), null)
assert.equal(
  crewUnitArtReceipt({
    henchmanType: 'phase',
    maxHp: 1,
    lieutenantName: 'Lieutenant Teakettle',
  }),
  null,
)
for (const unknown of ['__proto__', 'constructor', 'other']) {
  assert.equal(crewUnitArtReceipt({ henchmanType: unknown, maxHp: 1 }), null)
}
assert.equal(crewUnitArtReceipt({ maxHp: 1 }), null)

// Commissioned captain plates must resolve on the exact named SPECIES unit,
// never a random one-hit grunt, heroic identity, or multi-hit lieutenant.
const originalCaptains = [
  ['burrow', 'Foreman Thumpkin', 74396, 277789],
  ['phase', 'Lieutenant Teakettle', 74400, 277793],
  ['windup', 'Sir Cap-Permission', 74404, 277797],
] as const
for (const [kind, name, jobId, imageId] of originalCaptains) {
  const unit = {
    id: 'captain-' + kind,
    hp: 1,
    maxHp: 1,
    henchmanType: kind,
    henchmanName: name,
  }
  assert.deepEqual(
    crewCaptainArtReceipt(unit),
    CREW_TELL_ART[kind].beats.captain,
  )
  assert.equal(crewCaptainArtReceipt(unit)?.jobId, jobId)
  assert.equal(crewUnitArtReceipt(unit)?.imageId, imageId)
  assert.equal(
    crewCombatReceipt(unit)?.imageId,
    imageId,
    'the captain closeup appears at rest',
  )
  assert.equal(
    crewCombatReceipt(unit, { attacker: unit.id })?.imageId,
    CREW_COMBAT_ART[kind].strike.imageId,
  )
  assert.equal(
    crewCombatReceipt(unit, { target: unit.id, hit: true })?.imageId,
    CREW_COMBAT_ART[kind].hit.imageId,
  )
  assert.equal(
    crewCombatReceipt({ ...unit, hp: 0 })?.imageId,
    CREW_COMBAT_ART[kind].defeat.imageId,
  )
  assert.equal(
    crewCaptainArtReceipt({ ...unit, henchmanName: 'Impostor' }),
    null,
  )
  assert.equal(crewCaptainArtReceipt({ ...unit, maxHp: 4 }), null)
  assert.equal(
    crewCaptainArtReceipt({ ...unit, lieutenantName: 'Named elite' }),
    null,
  )
  assert.equal(
    crewUnitArtReceipt({ ...unit, henchmanName: 'One-hit minion' })?.imageId,
    CREW_TELL_ART[kind].beats.action.imageId,
    'minions keep the crew action art, not their captain face',
  )
}
// Proof against the real authored stage units, not only synthetic fixtures:
// each mission's actual captain must carry the intended commissioned plate.
for (const [stageId, kind] of crewStages) {
  const captainCase = originalCaptains.find(([type]) => type === kind)
  assert.ok(captainCase, stageId + ' has a known painted captain type')
  const [, name, , expectedImageId] = captainCase!
  const battle = trainingState(11, clonePreset(stageId))
  const actual = battle.units.filter(
    (unit) => unit.henchmanType === kind && unit.henchmanName === name,
  )
  assert.equal(actual.length, 1, stageId + ' seeds its named captain')
  assert.equal(
    crewCombatReceipt(actual[0]!)?.imageId,
    expectedImageId,
    stageId + ' attaches the captain closeup to the real battle unit',
  )
}

assert.equal(
  crewCaptainArtReceipt({
    henchmanType: '__proto__',
    henchmanName: 'Foreman Thumpkin',
    maxHp: 1,
  }),
  null,
)

assert.equal(crewTellReceipt(null, 'warning'), null)
for (const unknown of ['other', 'prototype', '__proto__', 'constructor', '']) {
  assert.equal(isCrewTellKind(unknown), false)
  assert.equal(crewTellReceipt(unknown, 'warning'), null)
}
assert.equal(isCrewTellKind(undefined), false)
assert.equal(isCrewTellKind('burrow'), true)
assert.equal(isCrewTellKind('phase'), true)
assert.equal(isCrewTellKind('windup'), true)
assert.match(page, /isCrewTellKind\(unit\.henchmanType\)/)
for (const kind of kinds) {
  assert.ok(CREW_TELL_ART[kind].name.length)
  for (const beat of CREW_TELL_BEATS) {
    const receipt = crewTellReceipt(kind, beat)!
    assert.match(receipt.artKey, /^every-villain-tactics\/henchmen\//)
    assert.ok(receipt.title.length > 8)
  }
}
assert.match(page, /data-testid="tactics-crew-art-gallery"/)
assert.match(page, /data-testid="tactics-crew-counterplay-strip"/)
assert.match(page, /data-testid="tactics-crew-beat-loaded"/)
assert.match(page, /v-for="beat in CREW_TELL_BEATS"/)
assert.match(page, /:data-art-image-id="crewBeatImageId\(beat\)"/)
assert.match(page, /crewBeatImage\(beat\)/)
assert.match(page, /crewBeatTitle\(beat\)/)
assert.match(page, /void paintedArt\.retry\(crewBeatImageId\(beat\)\)/)
assert.match(page, /data-testid="tactics-painted-burrow-warning"/)
assert.match(page, /data-testid="tactics-painted-phase-warning"/)
assert.match(page, /crewWarningImage\('burrow'\)/)
assert.match(page, /crewWarningImage\('phase'\)/)
assert.match(page, /crewUnitArtReceipt\(unit\)/)
assert.match(page, /paintedArt\.images\[crew\.imageId\]\?\.src/)
assert.match(
  page,
  /paintedArt\.ensure\(CREW_TELL_ART\[kind\]\.beats\.action\.imageId\)/,
)
assert.match(
  page,
  /paintedArt\.ensure\(CREW_TELL_ART\[kind\]\.beats\.captain\.imageId\)/,
)

assert.match(
  page,
  /paintedArt\.ensure\(crewTellReceipt\(kind, beat\)\?\.imageId \?\? null\)/,
)
assert.match(page, /if \(isCrewTellKind\(unit\.henchmanType\)\)/)
assert.doesNotMatch(page, /unit\.hp > 0 && isCrewTellKind/)
assert.match(page, /v-if="encounteredCrewKinds\.length"/)
assert.match(page, /const encounteredCrewKinds = computed/)
assert.match(page, /data-testid="tactics-crew-view-counterplay"/)
assert.match(page, /data-testid="tactics-crew-view-combat"/)
assert.match(page, /data-testid="tactics-crew-combat-strip"/)
assert.match(page, /data-testid="tactics-crew-pose-loaded"/)
assert.match(page, /v-for="pose in CREW_COMBAT_POSES"/)
assert.match(page, /:data-art-image-id="crewPoseImageId\(pose\)"/)
assert.match(page, /CREW_COMBAT_ART\[galleryCrew\.value\]\[pose\]\.imageId/)
assert.match(page, /paintedArt\.images\[id\]\?\.src/)
assert.match(page, /void paintedArt\.retry\(crewPoseImageId\(pose\)\)/)

const paintedLoader = readFileSync(
  new URL('../../stores/everyVillainTacticsArtStore.ts', import.meta.url),
  'utf8',
)
// Keep private-media failures recoverable without leaking JWTs into URLs or
// retrying permanent auth denials. The rail must not claim loading as delivery.
assert.match(paintedLoader, /RETRYABLE_MEDIA_STATUSES/)
assert.match(paintedLoader, /429, 500, 502, 503, 504/)
assert.match(
  paintedLoader,
  /!RETRYABLE_MEDIA_STATUSES\.has\(response\.status\)/,
)
assert.match(paintedLoader, /requestGeneration !== generation/)
assert.match(paintedLoader, /blob\.size < 24/)
assert.match(paintedLoader, /await image\.decode\(\)/)
assert.match(paintedLoader, /image\.naturalWidth <= 0/)
assert.match(paintedLoader, /URL\.revokeObjectURL\(src\)/)
assert.match(paintedLoader, /async function retry\(id: number \| null\)/)
assert.match(paintedLoader, /Authorization: `Bearer \$\{token\}`/)
assert.match(page, /Private art unavailable/)
assert.match(page, /RETRY ART/)

assert.match(page, /data-testid="tactics-one-hit"/)
assert.match(page, /henchmanTell\(/)
assert.match(page, /One-hit ' \+ tell\.label/)

console.log(
  'Henchmen and Picnic Panic: four one-hit tiers with distinct crests and counters; original crews drop to any landed hit; burrowers target the picnic with a full-turn telegraph; shifts arrive on rounds 3 and 5 via whistled molehills that a boot seals; ' +
    SEEDS * POLICIES.length +
    ' seeded runs across canonical leads kept sane state, saved and loaded every round, and finished (' +
    JSON.stringify(tally) +
    ').',
)

const galleryPoseImageIds = new Set(
  (['burrow', 'phase', 'windup'] as const).flatMap((kind) =>
    CREW_COMBAT_POSES.map((pose) => CREW_COMBAT_ART[kind][pose].imageId),
  ),
)
assert.equal(galleryPoseImageIds.size, 12)

const combatGroups = [
  ['burrow', 76658, 278823],
  ['phase', 76662, 278827],
  ['windup', 76666, 278831],
] as const
assert.equal(CREW_COMBAT_POSES.length, 4)
for (const [kind, firstJob, firstImage] of combatGroups) {
  for (const [index, pose] of CREW_COMBAT_POSES.entries()) {
    const receipt = CREW_COMBAT_ART[kind][pose]
    assert.equal(receipt.jobId, firstJob + index)
    assert.equal(receipt.imageId, firstImage + index)
    assert.match(receipt.artKey, new RegExp('/combat/' + pose + '$'))
  }
  const unit = { id: kind, hp: 1, maxHp: 1, henchmanType: kind }
  assert.equal(
    crewCombatReceipt(unit)?.imageId,
    CREW_COMBAT_ART[kind].idle.imageId,
  )
  assert.equal(
    crewCombatReceipt(unit, { attacker: kind })?.imageId,
    CREW_COMBAT_ART[kind].strike.imageId,
  )
  assert.equal(
    crewCombatReceipt(unit, { target: kind, hit: true })?.imageId,
    CREW_COMBAT_ART[kind].hit.imageId,
  )
  assert.equal(
    crewCombatReceipt({ ...unit, hp: 0 })?.imageId,
    CREW_COMBAT_ART[kind].defeat.imageId,
  )
  assert.equal(crewCombatReceipt({ ...unit, maxHp: 4 }), null)
  assert.equal(crewCombatReceipt({ ...unit, lieutenantName: 'Boss' }), null)
}
assert.equal(
  crewCombatReceipt({ id: 'x', hp: 1, maxHp: 1, henchmanType: '__proto__' }),
  null,
)
assert.match(page, /crewCombatReceipt\(unit, store\.state\.impact\)/)
assert.match(
  page,
  /paintedArt\.ensure\(CREW_COMBAT_ART\[kind\]\[pose\]\.imageId\)/,
)

const expectedTelegraphDimensions = [
  [768, 768],
  [1344, 768],
  [1344, 768],
  [768, 1024],
] as const
assert.equal(Object.keys(CREW_TELEGRAPH_MEDIA_DIMENSIONS).length, 12)
for (const kind of ['burrow', 'phase', 'windup'] as const) {
  for (const [index, beat] of CREW_TELL_BEATS.entries()) {
    const id = CREW_TELL_ART[kind].beats[beat].imageId
    const dimensions = expectedTelegraphDimensions[index]
    assert.ok(dimensions)
    const [width, height] = dimensions
    assert.deepEqual(CREW_TELEGRAPH_MEDIA_DIMENSIONS[id], [width, height])
    assert.equal(matchesCrewTelegraphDimensions(id, width, height), true)
    assert.equal(matchesCrewTelegraphDimensions(id, width + 1, height), false)
    assert.equal(matchesCrewTelegraphDimensions(id, width, height + 1), false)
  }
}
assert.equal(matchesCrewTelegraphDimensions(278823, 512, 512), true)
assert.match(paintedLoader, /matchesCrewTelegraphDimensions\(/)
assert.match(paintedLoader, /await decodeImage\(id, blob\)/)
