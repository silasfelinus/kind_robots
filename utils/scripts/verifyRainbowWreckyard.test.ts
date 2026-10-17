import assert from 'node:assert/strict'
import { actCheckpoints, resumeTick } from '../arcade/games/rainbowCheckpoints'
import { formationMembers } from '../arcade/games/rainbowFormations'
import {
  createRainbowGuardian,
  stepRainbowGuardian,
} from '../arcade/games/rainbowGuardian'
import { rainbowBossHp } from '../arcade/games/rainbowPinkwakeBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { ROSEFIN } from '../arcade/games/rainbowRosefin'
import {
  SAWTOOTH,
  SAWTOOTH_MAX_HP,
  createSawtoothBoss,
  sawtoothChargeWarning,
  sawtoothExposed,
  sawtoothWarning,
  stepSawtoothBoss,
} from '../arcade/games/rainbowSawtooth'
import {
  WRECK,
  WRECK_ALL_WAVES,
  WRECK_ARMORY_WAVES,
  WRECK_DEPOT_WAVES,
  WRECK_FORK,
  WRECK_GUARDIAN,
  WRECK_SECTIONS,
  WRECK_WAVES,
  WRECK_WAVE_SIZES,
  wreckDialogue,
  wreckPodFrames,
  wreckRouteFor,
  wreckScene,
  wreckSpawns,
  wreckStage,
  wreckWaveRoute,
  type WreckRoute,
  type WreckSceneId,
} from '../arcade/games/rainbowWreckyard'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-008: Act V, the Blossom Wreckyard. The authored director, its three new craft and the
// scrap field (cutters that bait a lane and charge it, hammerheads whose fin pods can be shot off, salvagers
// that grab pickups unless jammed, slabs that soak shots), the forty-second depot-or-armory choice, B05
// Sawtooth Regent's telegraphed phases, and the seamless run from Act IV into Act V.

// The director.
assert.equal(wreckStage(0, null), 'opening')
assert.equal(wreckStage(WRECK.openingEnds, null), 'waves')
assert.equal(wreckStage(WRECK.turnStarts, null), 'turn')
assert.equal(wreckStage(WRECK.bossStarts, null), 'boss')
assert.equal(wreckStage(100, 50), 'aftermath')
assert.deepEqual(wreckSpawns(100, null), [], 'the opening comms are safe')
assert.deepEqual(wreckSpawns(WRECK.turnStarts + 10, 'depot'), [])
assert.equal(WRECK_SECTIONS[0]!.from, WRECK.openingEnds)
assert.equal(WRECK_SECTIONS.at(-1)!.to, WRECK.turnStarts)
const firstKind: Record<string, string> = {
  'Cutter lanes': 'cutter',
  'Hammerhead pods': 'hammerhead',
  'Salvager arms': 'salvager',
  'Scrap field': 'scrap',
}
for (const [i, section] of WRECK_SECTIONS.entries()) {
  if (i > 0) assert.equal(section.from, WRECK_SECTIONS[i - 1]!.to)
  const waves = WRECK_WAVES.filter(
    (w) => w.at >= section.from && w.at < section.to,
  )
  // The guardian holds its section alone; the fork's section flies only its route's waves.
  const branch = section.from === WRECK_FORK.decideAt
  assert.equal(
    waves.length > 0,
    section.name !== WRECK_GUARDIAN.name && !branch,
    `${section.name} waves`,
  )
  if (firstKind[section.name])
    assert.equal(waves[0]!.kind, firstKind[section.name], section.name)
}
for (const entry of WRECK_ALL_WAVES)
  for (const member of formationMembers(entry))
    assert.ok(member.at < WRECK.turnStarts, 'every craft enters before TURN')
const craft = WRECK_WAVE_SIZES.reduce((sum, size) => sum + size, 0)
assert.ok(craft >= 120, `Act V authors ${craft} craft`)
// The fork: a forty-second branch on section boundaries, comms with no fresh wave under them.
assert.equal(WRECK_FORK.rejoinAt - WRECK_FORK.decideAt, 40 * 60)
assert.ok(WRECK_SECTIONS.some((s) => s.from === WRECK_FORK.decideAt))
assert.ok(WRECK_SECTIONS.some((s) => s.from === WRECK_FORK.rejoinAt))
assert.ok(
  WRECK_WAVES.every(
    (w) => w.at < WRECK_FORK.markFrom || w.at >= WRECK_FORK.rejoinAt,
  ),
  'no shared wave starts under the fork comms or inside the branch',
)
for (const [list, route] of [
  [WRECK_DEPOT_WAVES, 'depot'],
  [WRECK_ARMORY_WAVES, 'armory'],
] as const)
  for (const w of list)
    assert.ok(
      w.at >= WRECK_FORK.decideAt && w.at < WRECK_FORK.rejoinAt,
      `${route} waves stay in the branch`,
    )
const routeCraft: Record<WreckRoute, number> = { depot: 0, armory: 0 }
for (const route of ['depot', 'armory'] as const)
  for (let frame = WRECK_FORK.decideAt; frame < WRECK_FORK.rejoinAt; frame++)
    for (const spawn of wreckSpawns(frame, route)) {
      assert.equal(wreckWaveRoute(spawn.wave - WRECK.waveBase), route)
      routeCraft[route]++
    }
assert.ok(
  routeCraft.depot * 3 <= routeCraft.armory,
  `the depot run is light (${routeCraft.depot}) and the armory raid heavy (${routeCraft.armory})`,
)
assert.equal(wreckPodFrames().length, WRECK_FORK.pods)
assert.ok(wreckPodFrames().every((f) => f < WRECK_FORK.rejoinAt - 300))
assert.equal(wreckRouteFor([60]), 'depot')
assert.equal(wreckRouteFor([200]), 'armory')
assert.equal(wreckRouteFor([200, 60, 70]), 'depot')
assert.equal(wreckRouteFor([60, 200]), 'depot')
assert.equal(wreckRouteFor([200, 60]), 'armory')
// Four scenes, three lines each, every line inside its window for every crew size.
const windows: Record<WreckSceneId, number> = {
  'A05.OPEN': WRECK.openingEnds,
  'A05.FORK': WRECK_FORK.decideAt - WRECK_FORK.markFrom,
  'A05.TURN': WRECK.bossStarts - WRECK.turnStarts,
  'A05.AFTER': WRECK.aftermathFrames,
}
for (const players of [1, 2, 3, 4]) {
  for (const [id, frames] of Object.entries(windows) as Array<
    [WreckSceneId, number]
  >) {
    for (let line = 0; line < 3; line++) {
      const said = wreckDialogue(id, line * WRECK.lineFrames, players)
      assert.ok(said && said.speaker && said.text, `${id} line ${line + 1}`)
    }
    assert.ok(3 * WRECK.lineFrames <= frames, `${id} fits its window`)
  }
}
// CAST-BIBLE S05: Solenne sets the boundary and Vivi speaks for the recordings when they fly.
assert.equal(wreckDialogue('A05.FORK', WRECK.lineFrames, 3)!.speaker, 'Solenne')
assert.equal(
  wreckDialogue('A05.FORK', 2 * WRECK.lineFrames, 4)!.speaker,
  'Vivi',
)
assert.equal(
  wreckDialogue('A05.FORK', 2 * WRECK.lineFrames, 1)!.speaker,
  'Lilt-7',
)
const turns = new Set(
  [
    ['depot', true],
    ['depot', false],
    ['armory', false],
  ].map(
    ([route, freed]) =>
      wreckDialogue('A05.TURN', 0, 1, route as WreckRoute, freed as boolean)!
        .text,
  ),
)
assert.equal(turns.size, 3, 'the TURN remembers the route and its outcome')
assert.equal(wreckScene(0, null)?.id, 'A05.OPEN')
assert.equal(wreckScene(WRECK_FORK.markFrom, null)?.id, 'A05.FORK')
assert.equal(wreckScene(WRECK_FORK.decideAt, null), null)
assert.equal(wreckScene(WRECK.turnStarts, null)?.id, 'A05.TURN')
assert.equal(wreckScene(9000, 9000)?.id, 'A05.AFTER')
assert.equal(resumeTick({ act: 5, frame: 1800 }, 100, 5000, 9000, 20000), 21799)

// The Salvager guardian throws its arms: four lines of three, eight when enraged.
{
  const guardian = createRainbowGuardian('salvager', 1)
  const sizes = new Set<number>()
  for (let i = 0; i < 700; i++) {
    if (i === 350) guardian.hp = guardian.maxHp / 2
    const shots = stepRainbowGuardian(
      guardian,
      [{ x: 80, y: 135, lives: 1 }],
      false,
    )
    if (shots.length) sizes.add(shots.length)
  }
  assert.deepEqual(
    [...sizes].sort((a, b) => a - b),
    [12, 24],
  )
}

// B05 Sawtooth Regent: a full warning before every attack, the charge runs down the lane it marked and
// never warns mid-charge, phase 2 fires its fins and calls two escorts, phase 3 leaves the jaw open.
assert.equal(rainbowBossHp(SAWTOOTH_MAX_HP, 1), 513)
{
  const target = { x: 80, y: 60, lives: 1 }
  const boss = createSawtoothBoss(300)
  let warned = 0
  let charges = 0
  let marked: number | null = null
  for (let i = 0; i < 1200; i++) {
    if (sawtoothWarning(boss)) {
      warned++
      assert.equal(boss.charge, null, 'no warning while charging')
    }
    if (sawtoothChargeWarning(boss) && marked === null) marked = boss.aimY
    const was = boss.charge
    stepSawtoothBoss(boss, [target])
    if (was === null && boss.charge === 'out') {
      assert.ok(
        warned >= SAWTOOTH.chargeWarningFrames,
        'the jaw warned in full',
      )
      assert.equal(boss.y, marked, 'the charge runs down the marked lane')
      warned = 0
      marked = null
      charges++
    }
    if (boss.charge === 'out') assert.equal(boss.y, boss.aimY)
  }
  assert.ok(charges >= 4, `phase 1 charges (${charges})`)

  boss.hp = 190
  let finVolleys = 0
  for (let i = 0; i < 900; i++) {
    const shots = stepSawtoothBoss(boss, [target])
    if (boss.phase === 2 && boss.summon) {
      finVolleys++
      assert.equal(boss.summon, 2, 'two hammerhead escorts')
      assert.equal(shots.length, 4, 'two missiles from each fin')
    }
  }
  assert.ok(finVolleys >= 3)

  boss.hp = 90
  let opened = 0
  for (let i = 0; i < 1500; i++) {
    const was = sawtoothExposed(boss)
    stepSawtoothBoss(boss, [target])
    if (boss.phase === 3 && !was && sawtoothExposed(boss)) opened++
  }
  assert.ok(opened >= 4, `phase 3 opens the jaw (${opened})`)
}

// The run: Act IV's aftermath flows straight into Act V with the crew's state, the new craft do what they
// promise, a solo crew frees the depot and a pair raids the armory, and the Regent falls.
const ACT_FIVE_CHECKPOINTS = actCheckpoints(WRECK_SECTIONS, WRECK.bossStarts)
function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const create = (players: number) =>
  createRainbowPrincessPreview({
    players,
    demo: true,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
  })
const summary: string[] = []
for (const players of [1, 2]) {
  const a = create(players)
  const b = create(players)
  const seen = { charge: 0, pod: 0, missile: 0, arms: 0, soak: 0, survivor: 0 }
  const checkpoints: number[] = []
  const phases = new Set<number>()
  let entered: number | null = null
  let cleared: number | null = null
  let route: WreckRoute | null = null
  let bossFrames = 0
  let before = a.snapshot
  for (let frame = 0; frame < 260000 && cleared === null; frame++) {
    a.update(emptyInput())
    b.update(emptyInput())
    const after = a.snapshot
    if (after.act === 'S05') {
      if (entered === null) {
        entered = frame
        assert.equal(before.act, 'S04')
        assert.equal(after.actFiveFrame, 0)
        assert.ok(
          before.actFourFrame >= ROSEFIN.bossStarts,
          'Act V follows Act IV with no dock between them',
        )
        assert.deepEqual(
          after.ships.map(({ lives, shield, power }) => ({
            lives,
            shield,
            power,
          })),
          before.ships.map(({ lives, shield, power }) => ({
            lives,
            shield,
            power,
          })),
          'lives, shields and power carry into Act V',
        )
        assert.equal(after.score, before.score)
        assert.equal(a.level, 5)
      }
      if (
        after.checkpoint.act === 5 &&
        checkpoints.at(-1) !== after.checkpoint.frame
      )
        checkpoints.push(after.checkpoint.frame)
      for (const reef of after.enemies) {
        const was = before.enemies.find(
          (e) =>
            e.kind === reef.kind &&
            e.wave === reef.wave &&
            e.x >= reef.x &&
            e.x - reef.x < 8 &&
            Math.abs(e.y - reef.y) < 12,
        )
        if (
          reef.kind === 'cutter' &&
          reef.dive === 0 &&
          was &&
          was.dive === undefined
        ) {
          assert.equal(was?.charge, 1, 'the jaws warned in full')
          assert.equal(reef.y, reef.homeY, 'it charges down the locked lane')
          seen.charge++
        }
        if (reef.kind === 'hammerhead' && was?.charge === 1) {
          const pods = reef.pods ?? 3
          const fired = after.enemyShots.filter(
            (s) => Math.abs(s.x - (reef.x - 6) - s.vx) < 3,
          ).length
          assert.ok(fired >= (pods & 1) + ((pods >> 1) & 1))
          seen.missile++
        }
        if (
          reef.kind === 'hammerhead' &&
          was &&
          (reef.pods ?? 3) < (was.pods ?? 3)
        )
          seen.pod++
        if (reef.kind === 'salvager' && was?.charge === 1) seen.arms++
        if (reef.kind === 'scrap' && was) {
          assert.equal(reef.health, was.health, 'scrap soaks every shot')
          if (
            before.shots.some(
              (s) =>
                Math.abs(s.x + s.vx - reef.x) < 14 &&
                Math.abs(s.y - reef.y) < 20,
            )
          )
            seen.soak++
        }
      }
      if (after.actFiveFrame < WRECK_FORK.decideAt)
        assert.equal(after.wreckRoute, null)
      else if (after.actFiveFrame === WRECK_FORK.decideAt) {
        route = wreckRouteFor(
          after.ships.filter((s) => s.lives > 0).map((s) => s.y),
        )
        assert.equal(after.wreckRoute, route)
      } else assert.equal(after.wreckRoute, route)
      if (after.survivors.length)
        assert.equal(route, 'depot', 'pods only drift out on the depot run')
      if (after.podsSaved > before.podsSaved) seen.survivor++
      if (after.actFiveFrame === WRECK_FORK.rejoinAt) {
        assert.ok(after.checkpoint.wreckSettled)
        assert.equal(
          after.freedDepot,
          route === 'depot' && after.podsSaved >= WRECK_FORK.podsToFree,
        )
        if (route === 'armory')
          assert.ok(after.score >= before.score + WRECK_FORK.armoryScore)
        else
          assert.ok(
            after.score >= before.score + after.podsSaved * WRECK_FORK.podScore,
          )
      }
      if (after.sawtooth) {
        phases.add(after.sawtooth.phase)
        bossFrames++
        assert.equal(
          after.sawtooth.maxHp,
          rainbowBossHp(SAWTOOTH_MAX_HP, players),
        )
      }
      if (after.stage === 'aftermath') {
        assert.equal(after.sawtooth, null)
        assert.equal(after.enemyShots.length, 0, 'the defeat clears its shots')
        assert.equal(after.sceneId, 'A05.AFTER')
        cleared = frame
      }
      if (frame % 500 === 0)
        assert.deepEqual(after, b.snapshot, `desync at ${frame}`)
    }
    before = after
  }
  assert.ok(entered !== null, `${players} pilots reach the Blossom Wreckyard`)
  assert.ok(cleared !== null, `${players} pilots disable the Sawtooth Regent`)
  assert.deepEqual(checkpoints, ACT_FIVE_CHECKPOINTS, 'every Act V checkpoint')
  assert.deepEqual([...phases].sort(), [1, 2, 3], 'every Regent phase')
  // The attract demo shows both: odd crews free the depot, even crews raid the armory.
  assert.equal(route, players % 2 === 1 ? 'depot' : 'armory')
  const minutes = (cleared - entered + 1 + WRECK.aftermathFrames) / 3600
  if (players === 1) {
    for (const [what, count] of Object.entries(seen))
      assert.ok(count > 0, `the solo run saw a ${what}`)
    assert.ok(a.snapshot.freedDepot, 'the solo demo frees the depot')
    assert.ok(
      minutes >= 3 && minutes <= 15, // 10-15 before Silas's 2026-10-17 playtest cut the Acts
      `a clean solo Act V takes ${minutes.toFixed(2)} minutes`,
    )
    assert.ok(bossFrames >= 30 * 60, 'the Regent is a real fight')
  }
  summary.push(
    `${players}p ${route} ${minutes.toFixed(2)} min, B05 ${(bossFrames / 60).toFixed(0)}s`,
  )
  console.log(`  ${players}p: ${JSON.stringify(seen)}`)
}

console.log(
  `rainbow Blossom Wreckyard: ok (${summary.join('; ')}; director, craft, fork, Regent telegraphs)`,
)
