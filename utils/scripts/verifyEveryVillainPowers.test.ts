import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import type { SignaturePowerId } from '../cometAcademy/specialPowers'
import {
  chanceFrom,
  moveAP,
  type TacticalMap,
} from '../everyVillainTactics/combat'
import {
  ROLE_LABELS,
  SIGNATURE_TACTICS,
  applyTacticalProfile,
  bestPowerPlay,
  powerBlocker,
  powerTargets,
  previewPower,
  roleProfileFor,
  tickPowerCooldowns,
  usePower,
  type PowerEffect,
  type PowerState,
} from '../everyVillainTactics/powers'
import {
  endTurn,
  previewSelectedPower,
  selectedPowerTargets,
  trainingState,
  useSelectedPower,
  type Unit,
} from '../everyVillainTactics/training'

// 48/48 canonical heroes own one authored or grid-generated signature active.
assert.equal(SIGNATURE_TACTICS.length, 48)
assert.deepEqual(
  SIGNATURE_TACTICS.map((power) => power.id).sort(),
  IDENTITY_ARCS.map((arc) => arc.signature).sort(),
)
for (const power of SIGNATURE_TACTICS) {
  const arc = IDENTITY_ARCS.find((entry) => entry.signature === power.id)!
  assert.equal(power.hero, arc.hero.alias, 'power keeps the permanent codename')
  assert.ok(power.rules.includes('Never harms allies'))
  assert.ok(power.ap >= 1 && power.ap <= 2, power.id + ' AP cost')
  assert.ok(power.cooldown >= 0 && power.cooldown <= 3, power.id + ' recharge')
}
assert.equal(new Set(SIGNATURE_TACTICS.map((p) => p.name)).size, 48)
const fingerprint = (p: (typeof SIGNATURE_TACTICS)[number]) =>
  JSON.stringify([
    p.family,
    p.ap,
    p.cooldown,
    p.range,
    p.radius,
    p.aimBonus,
    p.ignoresLos,
    p.enemy,
    p.ally,
    p.self,
  ])
assert.equal(
  new Set(SIGNATURE_TACTICS.map(fingerprint)).size,
  48,
  'every hero power is mechanically distinct, not a renamed duplicate',
)
assert.deepEqual(
  SIGNATURE_TACTICS.filter((p) => p.authored)
    .map((p) => p.hero)
    .sort(),
  [
    'Backdraft',
    'Curtain Call',
    'Dr. Frog',
    'Groundswell',
    'Skyline',
    'Torchlight',
  ],
  'the First Bell cast have hand-authored powers',
)

// Roles: eight distinct battlefield jobs with sane stat ranges.
const roles = new Set<string>()
for (const arc of IDENTITY_ARCS) {
  const profile = roleProfileFor(arc.signature)
  roles.add(profile.role)
  assert.ok(profile.hp >= 3 && profile.hp <= 6, arc.signature + ' hp')
  assert.ok(profile.aim >= 80 && profile.aim <= 95, arc.signature + ' aim')
  assert.ok(profile.mobility >= 2 && profile.mobility <= 4)
  assert.ok(profile.defense >= 0 && profile.defense <= 10)
}
assert.deepEqual([...roles].sort(), Object.keys(ROLE_LABELS).sort())
assert.equal(moveAP(4, 4), 1, 'skirmishers walk four tiles for 1 AP')
assert.equal(moveAP(3, 2), 2, 'tanks need both AP to cover three tiles')
assert.equal(moveAP(5, 2), Infinity)

// A long-range sniper beats a short-range brawler at distance and the
// reverse holds point-blank; tanks are harder to remove than skirmishers.
const range: TacticalMap = { width: 10, height: 3, tiles: {} }
const sniper = roleProfileFor('accident-genius')
const brawler = roleProfileFor('accident-discipline')
const at = (x: number) => ({ x, y: 1, statuses: [] })
assert.ok(
  chanceFrom(range, { ...at(0), ...sniper }, at(7)).hit >
    chanceFrom(range, { ...at(0), ...brawler }, at(7)).hit,
)
assert.equal(chanceFrom(range, { ...at(0), ...brawler }, at(7)).hit, 0)
assert.ok(
  chanceFrom(range, { ...at(0), ...brawler }, at(1)).hit >
    chanceFrom(range, { ...at(0), ...sniper }, at(1)).hit,
)
assert.ok(roleProfileFor('mutant-earth').hp > roleProfileFor('accident-air').hp)
assert.equal(
  chanceFrom(range, at(0), { ...at(3), ...roleProfileFor('psychic-air') })
    .defense,
  10,
)

// Per-hero arena: every power resolves for every legal target, the preview
// matches the result exactly, allies are never harmed, and only strikes roll.
const arena: TacticalMap = {
  width: 9,
  height: 7,
  tiles: { '6,1': { elevation: 0, wall: true } },
}
function unit(
  id: string,
  team: 'squad' | 'rival',
  x: number,
  y: number,
  identity: SignaturePowerId,
): Unit {
  const u: Unit = {
    id,
    identity,
    team,
    x,
    y,
    hp: 3,
    maxHp: 3,
    ap: 2,
    moved: false,
    fired: false,
    overwatch: false,
    statuses: [],
  }
  applyTacticalProfile(u)
  return u
}
function arenaFor(signature: SignaturePowerId, seed = 4242): PowerState {
  const hero = unit('hero', 'squad', 4, 3, signature)
  const hurt = unit('hurt', 'squad', 3, 3, 'tech-earth')
  hurt.hp -= 2
  hurt.statuses.push('suppressed')
  const flank = unit('flank', 'squad', 4, 4, 'magic-water')
  return {
    map: arena,
    seed,
    units: [
      hero,
      hurt,
      flank,
      unit('close', 'rival', 5, 3, 'alien-fire'),
      unit('north', 'rival', 4, 1, 'mutant-air'),
      unit('lane', 'rival', 7, 3, 'psychic-water'),
      unit('far', 'rival', 8, 6, 'tech-social'),
    ],
  }
}
const clone = (state: PowerState): PowerState => structuredClone(state)
let resolved = 0
let rolled = 0
for (const power of SIGNATURE_TACTICS) {
  const base = arenaFor(power.id)
  const hero = base.units[0]!
  assert.equal(powerBlocker(hero), null, power.id + ' starts ready')
  const targets = powerTargets(base, hero)
  assert.ok(targets.length > 0, power.id + ' has a legal target')
  for (const target of targets) {
    const state = clone(base)
    const user = state.units[0]!
    const preview = previewPower(state, user, target)
    assert.ok(preview, power.id + ' previews every legal target')
    assert.ok(preview.cells.length > 0 || power.targeting !== 'line')
    const before = clone(state)
    const result = usePower(state, user, target)!
    assert.ok(result)
    resolved++
    if (preview.chance === null) {
      assert.equal(state.seed, before.seed, 'unrolled powers never use RNG')
      assert.equal(result.hit, true)
    } else {
      rolled++
      assert.notEqual(state.seed, before.seed)
      assert.equal(result.hit, result.roll! < preview.chance * 100)
      const victim = before.units.find(
        (u) => u.x === target.x && u.y === target.y,
      )!
      assert.equal(
        preview.chance,
        chanceFrom(before.map, before.units[0]!, victim, {
          aimBonus: power.aimBonus,
          maxRange: power.range,
          ignoreLos: power.ignoresLos,
        }).hit,
        'strike odds are the displayed shot formula plus its aim bonus',
      )
    }
    for (const was of before.units) {
      const now = state.units.find((u) => u.id === was.id)!
      const found: PowerEffect | undefined = preview.effects.find(
        (e) => e.id === was.id,
      )
      const effect: PowerEffect | null =
        found && (found.side !== 'enemy' || result.hit) ? found : null
      if (was.team === 'squad')
        assert.ok(now.hp >= was.hp, power.id + ' never harms an ally')
      const expectedHp: number = effect
        ? Math.min(was.maxHp, was.hp - effect.damage + effect.heal)
        : was.hp
      assert.equal(now.hp, expectedHp, power.id + ' hp matches preview')
      const expectedAp: number =
        was.ap + (effect ? effect.ap : 0) - (was.id === 'hero' ? power.ap : 0)
      assert.equal(now.ap, expectedAp, power.id + ' AP matches preview')
      const to: { x: number; y: number } = effect?.moveTo ?? was
      assert.deepEqual({ x: now.x, y: now.y }, { x: to.x, y: to.y })
      if (effect) {
        for (const status of effect.statuses)
          assert.ok(now.statuses.includes(status), power.id + ' ' + status)
        if (effect.cleanse) assert.ok(!now.statuses.includes('suppressed'))
      } else
        assert.deepEqual(now.statuses, was.statuses, power.id + ' untouched')
    }
    // Spent or recharging powers cannot be reused this turn.
    assert.notEqual(powerBlocker(user), null)
    assert.deepEqual(powerTargets(state, user), [])
  }
}
assert.ok(resolved > 48 && rolled > 0)

// Recharge and once-per-battle limits survive turn refreshes.
for (const power of SIGNATURE_TACTICS) {
  const state = arenaFor(power.id)
  const hero = state.units[0]!
  usePower(state, hero, powerTargets(state, hero)[0]!)
  for (let turn = 1; turn <= 4; turn++) {
    hero.ap = 2
    hero.moved = false
    hero.fired = false
    tickPowerCooldowns(state.units, 'squad')
    const ready = powerBlocker(hero) === null
    assert.equal(
      ready,
      power.cooldown > 0 && turn >= power.cooldown,
      power.id + ' turn ' + turn,
    )
  }
}

// AI parity: every hero can command the rival squad without stalling and
// with seed-stable results; at least some rivals choose their powers.
let aiPowers = 0
for (const arc of IDENTITY_ARCS) {
  const run = () => {
    const state = trainingState(77)
    for (const rival of state.units.filter((u) => u.team === 'rival')) {
      rival.identity = arc.signature
      applyTacticalProfile(rival)
    }
    let used = false
    for (let turn = 0; turn < 3 && state.phase === 'active'; turn++) {
      endTurn(state)
      used ||= state.units.some(
        (u) => u.team === 'rival' && (u.powerSpent || u.powerCooldown),
      )
    }
    return { state, used }
  }
  const a = run()
  const b = run()
  assert.deepEqual(
    a.state.units,
    b.state.units,
    arc.signature + ' AI is deterministic',
  )
  assert.equal(a.state.seed, b.state.seed)
  assert.ok(
    a.state.units.some(
      (u) => u.team === 'rival' && (u.moved || u.fired || u.hp <= 0),
    ) || a.used,
    arc.signature + ' rivals still act',
  )
  if (a.used) aiPowers++
}
assert.ok(
  aiPowers >= 12,
  'rival AI actually uses signature powers: ' + aiPowers,
)
const aiState = arenaFor('accident-fire')
for (const u of aiState.units) u.team = u.team === 'squad' ? 'rival' : 'squad'
const aiHero = aiState.units[0]!
const play = bestPowerPlay(aiState, aiHero)!
assert.ok(play, 'a rival Backdraft sees a line through the squad')
const aiPreview = previewPower(aiState, aiHero, play.target)!
assert.ok(
  aiPreview.effects.every((e) => e.side !== 'ally' || e.damage === 0),
  'AI powers never hit their own side',
)

// First Bell integration: the console applies roles, Prom opts out.
const bell = trainingState(5)
const backdraft = bell.units.find((u) => u.id === 'backdraft')!
assert.equal(backdraft.power, 'accident-fire')
assert.equal(backdraft.role, 'striker')
assert.equal(bell.units.find((u) => u.id === 'hattie')!.maxHp, 6)
const lineTargets = selectedPowerTargets(bell)
assert.ok(lineTargets.length > 0)
assert.equal(previewSelectedPower(bell, { x: 0, y: 0 }), null)
assert.ok(useSelectedPower(bell, lineTargets[0]!))
assert.equal(backdraft.powerSpent, true)
assert.equal(useSelectedPower(bell, lineTargets[0]!), false)
const prom = trainingState(5, undefined, { roles: false })
assert.ok(prom.units.every((u) => !u.power && !u.role && u.aim === undefined))
assert.equal(prom.units.find((u) => u.id === 'hattie')!.maxHp, 5)
const zuzu = trainingState(5, undefined, { lead: 'alien-discipline' })
assert.equal(zuzu.units[0]!.power, 'alien-discipline')
assert.equal(zuzu.units[0]!.role, 'duelist')
assert.equal(
  trainingState(5, undefined, { lead: 'not-a-hero' }).units[0]!.identity,
  'accident-fire',
)

const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
assert.match(page, /data-testid="tactics-power"/)
assert.match(page, /data-testid="tactics-power-preview"/)
assert.match(page, /data-testid="tactics-role"/)
assert.match(page, /store\.setMode\('power'\)/)
console.log(
  `Every Villain powers: 48/48 distinct signature actives, 8 roles, ${resolved} previewed resolutions (${rolled} rolled), recharge limits, no friendly fire and ${aiPowers} AI-driven rosters verified.`,
)
