import assert from 'node:assert/strict'
import { actCheckpoints, resumeTick } from '../arcade/games/rainbowCheckpoints'
import {
  CROWN_REEF,
  CROWN_REEF_ALL_WAVES,
  CROWN_REEF_FORK,
  CROWN_REEF_GUARDIAN,
  CROWN_REEF_PYLONS,
  CROWN_REEF_SECTIONS,
  CROWN_REEF_WAVES,
  CROWN_REEF_WAVE_SIZES,
  reefDialogue,
  reefRouteFor,
  reefScene,
  reefSpawns,
  reefStage,
  reefWaveRoute,
  type ReefRoute,
  type ReefSceneId,
} from '../arcade/games/rainbowCrownReef'
import { formationMembers } from '../arcade/games/rainbowFormations'
import {
  RAINBOW_GUARDIAN,
  createRainbowGuardian,
  stepRainbowGuardian,
} from '../arcade/games/rainbowGuardian'
import {
  LANTERN_RAY,
  LANTERN_RAY_MAX_HP,
  createLanternRayBoss,
  lanternRayExposed,
  lanternRayWarning,
  stepLanternRayBoss,
} from '../arcade/games/rainbowLanternRay'
import { rainbowBossHp } from '../arcade/games/rainbowPinkwakeBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { WRECK } from '../arcade/games/rainbowWreckyard'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-009: Act VI, the Crown Reef. The authored director, its three new craft and the reef
// gates (broodships that launch drones, turrets whose stems break first, bulwarks armoured until their
// window opens), Lilt's revelation, the relay-or-cache choice, B06 Lantern Ray's telegraphed phases, and
// Act V's memorial, the second quiet intermission, carrying the crew into Act VI.

// The director.
assert.equal(reefStage(0, null), 'opening')
assert.equal(reefStage(CROWN_REEF.openingEnds, null), 'waves')
assert.equal(reefStage(CROWN_REEF.turnStarts, null), 'turn')
assert.equal(reefStage(CROWN_REEF.bossStarts, null), 'boss')
assert.equal(reefStage(100, 50), 'aftermath')
assert.deepEqual(reefSpawns(100, null), [], 'the opening comms are safe')
assert.equal(CROWN_REEF_SECTIONS[0]!.from, CROWN_REEF.openingEnds)
assert.equal(CROWN_REEF_SECTIONS.at(-1)!.to, CROWN_REEF.turnStarts)
const firstKind: Record<string, string> = {
  'Brood wings': 'brood',
  'Petal turrets': 'turret',
  'Bulwark shells': 'bulwark',
  'Reef gate': 'gate',
}
for (const [i, section] of CROWN_REEF_SECTIONS.entries()) {
  if (i > 0) assert.equal(section.from, CROWN_REEF_SECTIONS[i - 1]!.to)
  const waves = CROWN_REEF_WAVES.filter(
    (w) => w.at >= section.from && w.at < section.to,
  )
  assert.equal(
    waves.length > 0,
    section.name !== CROWN_REEF_GUARDIAN.name &&
      section.from !== CROWN_REEF_FORK.decideAt,
    `${section.name} waves`,
  )
  if (firstKind[section.name])
    assert.equal(waves[0]!.kind, firstKind[section.name], section.name)
}
for (const entry of CROWN_REEF_ALL_WAVES)
  for (const member of formationMembers(entry))
    assert.ok(
      member.at < CROWN_REEF.turnStarts,
      'every craft enters before TURN',
    )
// A reef gate always leaves one gap a ship fits through.
for (const gate of CROWN_REEF_ALL_WAVES.filter((w) => w.kind === 'gate')) {
  const ys = formationMembers(gate)
    .map((m) => m.lane)
    .sort((a, b) => a - b)
  const gaps = ys.slice(1).map((y, i) => y - ys[i]!)
  assert.ok(Math.max(...gaps) >= 0.3, 'a gate has an open gap')
}
const craft = CROWN_REEF_WAVE_SIZES.reduce((sum, size) => sum + size, 0)
assert.ok(craft >= 150, `Act VI authors ${craft} craft`)
assert.equal(CROWN_REEF_PYLONS, 3)
// Lilt's revelation opens after the guardian has escaped, with no wave under its three lines.
assert.equal(CROWN_REEF.revealAt, CROWN_REEF_GUARDIAN.to)
assert.ok(
  CROWN_REEF_WAVES.every(
    (w) =>
      w.at < CROWN_REEF.revealAt ||
      w.at >= CROWN_REEF.revealAt + 3 * CROWN_REEF.lineFrames,
  ),
  'no wave flies in under the revelation',
)
assert.ok(
  CROWN_REEF_WAVES.every(
    (w) => w.at < CROWN_REEF_FORK.markFrom || w.at >= CROWN_REEF_FORK.rejoinAt,
  ),
  'no shared wave under the fork comms or inside the branch',
)
const routeCraft: Record<ReefRoute, number> = { relay: 0, cache: 0 }
for (const route of ['relay', 'cache'] as const)
  for (let f = CROWN_REEF_FORK.decideAt; f < CROWN_REEF_FORK.rejoinAt; f++)
    for (const spawn of reefSpawns(f, route)) {
      assert.equal(reefWaveRoute(spawn.wave - CROWN_REEF.waveBase), route)
      routeCraft[route]++
    }
assert.ok(
  routeCraft.cache * 2 <= routeCraft.relay,
  `the cache is light (${routeCraft.cache}), the relay guarded (${routeCraft.relay})`,
)
assert.equal(reefRouteFor([60]), 'relay')
assert.equal(reefRouteFor([200]), 'cache')
assert.equal(reefRouteFor([60, 200]), 'relay')
assert.equal(reefRouteFor([200, 60]), 'cache')
const windows: Record<ReefSceneId, [number, number]> = {
  'A06.OPEN': [3, CROWN_REEF.openingEnds],
  'A06.REVEAL': [3, 3 * CROWN_REEF.lineFrames],
  'A06.FORK': [2, CROWN_REEF_FORK.decideAt - CROWN_REEF_FORK.markFrom],
  'A06.TURN': [3, CROWN_REEF.bossStarts - CROWN_REEF.turnStarts],
  'A06.AFTER': [3, CROWN_REEF.aftermathFrames],
}
for (const players of [1, 2, 3, 4]) {
  for (const [id, [lines, frames]] of Object.entries(windows) as Array<
    [ReefSceneId, [number, number]]
  >) {
    for (let line = 0; line < lines; line++) {
      const said = reefDialogue(id, line * CROWN_REEF.lineFrames, players)
      assert.ok(said && said.speaker && said.text, `${id} line ${line + 1}`)
    }
    assert.equal(reefDialogue(id, lines * CROWN_REEF.lineFrames, players), null)
    assert.ok(lines * CROWN_REEF.lineFrames <= frames, `${id} fits its window`)
  }
}
// COMMS bible S06: each pilot answers the revelation in their own words.
const replies = new Set(
  [1, 2, 3, 4].map(
    (players) =>
      reefDialogue('A06.REVEAL', CROWN_REEF.lineFrames, players)!.text,
  ),
)
assert.equal(replies.size, 4, 'four distinct replies')
assert.match(
  reefDialogue('A06.REVEAL', 0, 1)!.text,
  /kept the word protect and erased the word ask/,
)
assert.equal(reefScene(CROWN_REEF.revealAt, null)?.id, 'A06.REVEAL')
assert.equal(reefScene(CROWN_REEF_FORK.markFrom, null)?.id, 'A06.FORK')
assert.equal(reefScene(CROWN_REEF.turnStarts, null)?.id, 'A06.TURN')
assert.equal(
  resumeTick({ act: 6, frame: 1800 }, 100, 5000, 9000, 20000, 30000),
  31799,
)
assert.ok(
  CROWN_REEF_GUARDIAN.to - RAINBOW_GUARDIAN.escapeLead >
    CROWN_REEF_GUARDIAN.from,
)

// The Bulwark guardian sweeps a fan one way, then back.
{
  const guardian = createRainbowGuardian('bulwark', 1)
  const fans: number[] = []
  for (let i = 0; i < 500; i++) {
    const shots = stepRainbowGuardian(
      guardian,
      [{ x: 80, y: 135, lives: 1 }],
      false,
    )
    if (shots.length) fans.push(shots[0]!.vy - shots.at(-1)!.vy)
  }
  assert.ok(fans.length >= 3)
  assert.ok(Math.sign(fans[0]!) === -Math.sign(fans[1]!), 'the sweep reverses')
}

// B06 Lantern Ray: shadows marked for the whole warning and fired down exactly; nurseries launch drones
// until shot off; the beacon opens after each ring.
{
  const target = { x: 80, y: 90, lives: 1 }
  const boss = createLanternRayBoss(400)
  let warned = 0
  let walls = 0
  for (let i = 0; i < 700; i++) {
    if (lanternRayWarning(boss)) warned++
    const lanes = [...boss.lanes]
    const shots = stepLanternRayBoss(boss, [target])
    if (shots.length) {
      assert.ok(warned >= LANTERN_RAY.warningFrames)
      warned = 0
      walls++
      for (const shot of shots)
        assert.ok(
          lanes.some((lane) => Math.abs(shot.y - lane) <= LANTERN_RAY.laneHalf),
          'every pellet races down a marked shadow',
        )
      assert.ok(
        Math.abs(lanes[0]! - lanes[1]!) >= 80,
        'two lanes, light between',
      )
    }
  }
  assert.ok(walls >= 4)
  boss.hp = 250
  let launches = 0
  for (let i = 0; i < 400; i++) {
    stepLanternRayBoss(boss, [target])
    launches += boss.launches.length
  }
  assert.ok(launches >= 4, 'both nurseries launch drones')
  boss.nurseries = [0, 0]
  for (let i = 0; i < 400; i++) {
    stepLanternRayBoss(boss, [target])
    assert.equal(boss.launches.length, 0, 'a nursery shot off launches nothing')
  }
  boss.hp = 100
  let opened = 0
  for (let i = 0; i < 900; i++) {
    const was = lanternRayExposed(boss)
    stepLanternRayBoss(boss, [target])
    if (!was && lanternRayExposed(boss)) opened++
  }
  assert.ok(opened >= 4)
}

// The run: Act V's memorial launches Act VI (by A for a full crew, by itself for a solo one), the reef
// craft keep their rules, a solo crew breaks the relay and a pair takes the cache, and the Lantern Ray falls.
const ACT_SIX_CHECKPOINTS = actCheckpoints(
  CROWN_REEF_SECTIONS,
  CROWN_REEF.bossStarts,
)
function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const summary: string[] = []
for (const players of [1, 2]) {
  const create = () =>
    createRainbowPrincessPreview({
      players,
      demo: true,
      rng: seeded(),
      sound: { play() {} },
      hiScore: 0,
    })
  const a = create()
  const b = create()
  const seen = { drone: 0, open: 0, stem: 0, soak: 0, nursery: 0 }
  const checkpoints: number[] = []
  const phases = new Set<number>()
  let rested: number | null = null
  let entered: number | null = null
  let cleared: number | null = null
  let route: ReefRoute | null = null
  let bossFrames = 0
  let before = a.snapshot
  let restSnapshot = before
  for (let frame = 0; frame < 320000 && cleared === null; frame++) {
    const input = emptyInput()
    input.pressed.a =
      players === 2 && before.resting === CROWN_REEF.restMinFrames - 1
    a.update(input)
    b.update(input)
    const after = a.snapshot
    if (after.resting !== null) {
      rested ??= frame
      restSnapshot = after
      assert.equal(after.act, 'S05')
    }
    if (after.act === 'S06') {
      if (entered === null) {
        entered = frame
        assert.ok(rested !== null, 'the memorial comes first')
        assert.equal(
          before.resting,
          players === 2
            ? CROWN_REEF.restMinFrames - 1
            : CROWN_REEF.restMaxFrames - 1,
          'the memorial launches on A after its minimum, or by itself',
        )
        assert.ok(before.actFiveFrame >= WRECK.bossStarts)
        assert.deepEqual(
          after.ships.map(({ lives, power, shield }) => ({
            lives,
            power,
            shield,
          })),
          restSnapshot.ships.map(({ lives, power, shield }) => ({
            lives,
            power,
            shield: Math.min(3, shield + 1),
          })),
          'lives and power carry into Act VI, with one bounded shield repair',
        )
        assert.equal(a.level, 6)
      }
      if (
        after.checkpoint.act === 6 &&
        checkpoints.at(-1) !== after.checkpoint.frame
      )
        checkpoints.push(after.checkpoint.frame)
      for (const reef of after.enemies) {
        const was = before.enemies.find(
          (e) =>
            e.kind === reef.kind &&
            e.wave === reef.wave &&
            e.x >= reef.x &&
            e.x - reef.x < 3 &&
            Math.abs(e.y - reef.y) < 3,
        )
        if (!was) continue
        if (reef.kind === 'drone' && reef.wave === null) seen.drone++
        if (reef.kind === 'bulwark' && reef.health < was.health) {
          assert.ok(
            reef.dive! % 150 >= 90 || was.dive! % 150 >= 90,
            'a bulwark only takes damage with its window open',
          )
          seen.open++
        }
        if (reef.kind === 'turret' && was.health - reef.health >= 2) seen.stem++
        if (reef.kind === 'gate') {
          assert.equal(reef.health, was.health, 'reef gates soak every shot')
          if (
            before.shots.some(
              (s) =>
                Math.abs(s.x + s.vx - reef.x) < 14 &&
                Math.abs(s.y - reef.y) < 13,
            )
          )
            seen.soak++
        }
      }
      if (after.actSixFrame < CROWN_REEF_FORK.decideAt)
        assert.equal(after.reefRoute, null)
      else if (after.actSixFrame === CROWN_REEF_FORK.decideAt) {
        route = reefRouteFor(
          after.ships.filter((s) => s.lives > 0).map((s) => s.y),
        )
        assert.equal(after.reefRoute, route)
      } else assert.equal(after.reefRoute, route)
      if (after.enemies.some((e) => e.kind === 'pylon'))
        assert.equal(route, 'relay', 'pylons only stand on the relay route')
      if (after.actSixFrame === CROWN_REEF_FORK.rejoinAt) {
        assert.equal(
          after.stoppedRelay,
          route === 'relay' && after.pylonsDown >= CROWN_REEF_PYLONS,
        )
        if (route === 'cache')
          for (const ship of after.ships.filter((s) => s.lives > 0))
            assert.equal(ship.shield, 3, 'the cache refills every shield')
      }
      if (after.lanternRay) {
        phases.add(after.lanternRay.phase)
        bossFrames++
        assert.equal(
          after.lanternRay.maxHp,
          rainbowBossHp(LANTERN_RAY_MAX_HP, players),
        )
        if (after.lanternRay.nurseries.some((n) => n === 0)) seen.nursery++
      }
      if (after.stage === 'aftermath') {
        assert.equal(after.lanternRay, null)
        assert.equal(after.enemyShots.length, 0)
        assert.equal(after.sceneId, 'A06.AFTER')
        cleared = frame
      }
      if (frame % 500 === 0)
        assert.deepEqual(after, b.snapshot, `desync at ${frame}`)
    }
    before = after
  }
  assert.ok(entered !== null, `${players} pilots reach the Crown Reef`)
  assert.ok(
    cleared !== null,
    `${players} pilots free the Lantern Ray's nursery`,
  )
  assert.deepEqual(checkpoints, ACT_SIX_CHECKPOINTS, 'every Act VI checkpoint')
  assert.deepEqual([...phases].sort(), [1, 2, 3], 'every Lantern Ray phase')
  assert.equal(route, players % 2 === 1 ? 'relay' : 'cache')
  const minutes = (cleared - entered + 1 + CROWN_REEF.aftermathFrames) / 3600
  if (players === 1) {
    for (const [what, count] of Object.entries(seen))
      assert.ok(count > 0, `the solo run saw a ${what}`)
    assert.ok(a.snapshot.stoppedRelay, 'the solo demo stops the relay')
    assert.ok(
      minutes >= 3.5 && minutes <= 7, // t-023's recut aims at 4-6 (10-15 before Silas's 2026-10-17 playtest)
      `a clean solo Act VI takes ${minutes.toFixed(2)} minutes`,
    )
    assert.ok(bossFrames >= 30 * 60, 'the Lantern Ray is a real fight')
  }
  summary.push(
    `${players}p ${route} ${minutes.toFixed(2)} min, B06 ${(bossFrames / 60).toFixed(0)}s`,
  )
  console.log(`  ${players}p: ${JSON.stringify(seen)}`)
}

console.log(
  `rainbow Crown Reef: ok (${summary.join('; ')}; director, craft, revelation, fork, Lantern Ray telegraphs, memorial)`,
)
