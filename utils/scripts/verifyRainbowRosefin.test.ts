import assert from 'node:assert/strict'
import { actCheckpoints, resumeTick } from '../arcade/games/rainbowCheckpoints'
import {
  DELPHION,
  DELPHION_MAX_HP,
  createDelphionBoss,
  delphionExposed,
  delphionLeapLanes,
  delphionWarning,
  stepDelphionBoss,
} from '../arcade/games/rainbowDelphion'
import { formationMembers } from '../arcade/games/rainbowFormations'
import {
  RAINBOW_GUARDIAN,
  createRainbowGuardian,
  stepRainbowGuardian,
} from '../arcade/games/rainbowGuardian'
import { rainbowBossHp } from '../arcade/games/rainbowPinkwakeBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import {
  ROSEFIN,
  ROSEFIN_ESCORT,
  ROSEFIN_GUARDIAN,
  ROSEFIN_SECTIONS,
  ROSEFIN_SURGES,
  ROSEFIN_WAVES,
  ROSEFIN_WAVE_SIZES,
  rosefinDialogue,
  rosefinScene,
  rosefinSpawns,
  rosefinSpeed,
  rosefinStage,
  type RosefinSceneId,
} from '../arcade/games/rainbowRosefin'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-008: Act IV, the Rosefin Express. The authored director, its three new craft (dolphin
// pairs that beacon, cross and stagger; couriers that flicker, dash and drop a cargo mine; eels whose
// barrier only takes damage at its bright ends), the courier escort, B04 Delphion's telegraphed phases,
// and the salvage-dock intermission that carries the crew from Act III into Act IV.

// The director.
assert.equal(rosefinStage(0, null), 'opening')
assert.equal(rosefinStage(ROSEFIN.openingEnds, null), 'waves')
assert.equal(rosefinStage(ROSEFIN.turnStarts, null), 'turn')
assert.equal(rosefinStage(ROSEFIN.bossStarts, null), 'boss')
assert.equal(rosefinStage(100, 50), 'aftermath')
assert.deepEqual(rosefinSpawns(100), [], 'the opening comms are a safe ride')
assert.deepEqual(rosefinSpawns(ROSEFIN.turnStarts + 10), [])
assert.equal(ROSEFIN_SECTIONS[0]!.from, ROSEFIN.openingEnds)
assert.equal(ROSEFIN_SECTIONS.at(-1)!.to, ROSEFIN.turnStarts)
const firstKind: Record<string, string> = {
  'Express launch': 'dolphin',
  'Dolphin pairs': 'dolphin',
  'Courier lanes': 'courier',
  'Eel gates': 'eel',
}
for (const [i, section] of ROSEFIN_SECTIONS.entries()) {
  if (i > 0) assert.equal(section.from, ROSEFIN_SECTIONS[i - 1]!.to)
  const waves = ROSEFIN_WAVES.filter(
    (w) => w.at >= section.from && w.at < section.to,
  )
  assert.equal(
    waves.length > 0,
    section.name !== ROSEFIN_GUARDIAN.name,
    `${section.name} waves`,
  )
  if (firstKind[section.name])
    assert.equal(waves[0]!.kind, firstKind[section.name], section.name)
}
for (const entry of ROSEFIN_WAVES) {
  for (const member of formationMembers(entry))
    assert.ok(member.at < ROSEFIN.turnStarts, 'every craft enters before TURN')
  // Dolphins fly in mirrored pairs (or alone), so their dives always cross a partner's.
  if (entry.kind === 'dolphin')
    assert.ok(['pair', 'single'].includes(entry.formation))
}
const craft = ROSEFIN_WAVE_SIZES.reduce((sum, size) => sum + size, 0)
assert.ok(craft >= 150, `Act IV authors ${craft} craft`)
// The express surges: cruise speed outside a surge, its peak inside, eased at both ends.
assert.equal(rosefinSpeed(ROSEFIN_GUARDIAN.from + 10), 1)
for (const surge of ROSEFIN_SURGES) {
  assert.equal(rosefinSpeed(surge.from), 1)
  assert.equal(
    rosefinSpeed(Math.round((surge.from + surge.to) / 2)),
    surge.peak,
  )
  assert.ok(rosefinSpeed(surge.to - 1) < 1.01)
}
// Four scenes (the escort has two lines, the rest three), every line inside its window for every crew size.
const windows: Record<RosefinSceneId, number> = {
  'A04.OPEN': ROSEFIN.openingEnds,
  'A04.ESCORT': ROSEFIN_GUARDIAN.to - ROSEFIN_ESCORT.commsFrom,
  'A04.TURN': ROSEFIN.bossStarts - ROSEFIN.turnStarts,
  'A04.AFTER': ROSEFIN.aftermathFrames,
}
for (const players of [1, 2, 3, 4]) {
  for (const [id, frames] of Object.entries(windows) as Array<
    [RosefinSceneId, number]
  >) {
    const lines = id === 'A04.ESCORT' ? 2 : 3
    for (let line = 0; line < lines; line++) {
      const said = rosefinDialogue(id, line * ROSEFIN.lineFrames, players)
      assert.ok(said && said.speaker && said.text, `${id} line ${line + 1}`)
    }
    assert.equal(rosefinDialogue(id, lines * ROSEFIN.lineFrames, players), null)
    assert.ok(lines * ROSEFIN.lineFrames <= frames, `${id} fits its window`)
  }
}
assert.notEqual(
  rosefinDialogue('A04.AFTER', ROSEFIN.lineFrames, 1, true)!.text,
  rosefinDialogue('A04.AFTER', ROSEFIN.lineFrames, 1, false)!.text,
  "the aftermath acknowledges the courier's fate",
)
assert.equal(rosefinScene(0, null)?.id, 'A04.OPEN')
assert.equal(rosefinScene(ROSEFIN_ESCORT.commsFrom, null)?.id, 'A04.ESCORT')
assert.equal(rosefinScene(ROSEFIN_GUARDIAN.to, null), null)
assert.equal(rosefinScene(ROSEFIN.turnStarts, null)?.id, 'A04.TURN')
assert.equal(rosefinScene(9000, 9000)?.id, 'A04.AFTER')
// The escort comms wait until the guardian has stopped firing to escape; the pod sets off after them.
assert.ok(
  ROSEFIN_ESCORT.commsFrom >= ROSEFIN_GUARDIAN.to - RAINBOW_GUARDIAN.escapeLead,
)
assert.ok(ROSEFIN_ESCORT.podAppears > ROSEFIN_GUARDIAN.to)
assert.equal(resumeTick({ act: 4, frame: 1800 }, 100, 5000, 9000), 10799)

// The Courier guardian lobs cargo mines that burst into rings.
{
  const guardian = createRainbowGuardian('courier', 1)
  let mines = 0
  for (let i = 0; i < 400; i++) {
    for (const shot of stepRainbowGuardian(
      guardian,
      [{ x: 80, y: 135, lives: 1 }],
      false,
    )) {
      assert.equal(shot.burst, 'ring')
      assert.ok(shot.fuse && shot.fuse > 0)
      mines++
    }
  }
  assert.ok(mines >= 6, `the courier guardian lobs mines (${mines})`)
}

// B04 Delphion: a full warning before every attack. Phase 1 swaps the twins through the middle; phase 2
// fires down the lanes its warning marked, then leaps onto them; phase 3 exposes the link core after a ring.
assert.equal(rainbowBossHp(DELPHION_MAX_HP, 1), 488)
{
  const targets = [{ x: 80, y: 60, lives: 1 }]
  const boss = createDelphionBoss(300)
  let warned = 0
  let crossings = 0
  for (let i = 0; i < 600; i++) {
    if (delphionWarning(boss)) warned++
    const gapBefore = boss.gap
    const shots = stepDelphionBoss(boss, targets)
    if (shots.length) {
      assert.ok(warned >= DELPHION.warningFrames, 'the beacons warned in full')
      warned = 0
      assert.equal(shots.length, 6, 'two three-pellet fans')
      crossings++
      for (let k = 0; k < DELPHION.crossFrames; k++)
        stepDelphionBoss(boss, targets)
      i += DELPHION.crossFrames
      assert.ok(
        Math.sign(boss.gap) === -Math.sign(gapBefore),
        'the twins swap sides',
      )
    }
  }
  assert.ok(crossings >= 3)

  boss.hp = 190
  let leaps = 0
  let marked: number[] | null = null
  for (let i = 0; i < 600; i++) {
    stepDelphionBoss(boss, targets)
    if (boss.phase !== 2) continue
    if (delphionWarning(boss) && marked === null)
      marked = delphionLeapLanes(boss)
    if (boss.frame + 1 === boss.nextVolley) {
      const lanes = delphionLeapLanes(boss)
      const shots = stepDelphionBoss(boss, targets)
      assert.deepEqual(
        shots.filter((s) => s.vy === 0).map((s) => s.y),
        lanes,
        'the bolts fly down the marked lanes',
      )
      assert.deepEqual(
        lanes,
        marked,
        'the marks never moved during the warning',
      )
      marked = null
      leaps++
      for (let k = 0; k < DELPHION.leapFrames; k++)
        stepDelphionBoss(boss, targets)
      assert.ok(
        Math.abs(boss.y - boss.aimY) < 1e-9,
        'the pair lands on the lane it marked',
      )
    }
  }
  assert.ok(leaps >= 3)

  boss.hp = 90
  let rings = 0
  for (let i = 0; i < 700; i++) {
    const shots = stepDelphionBoss(boss, targets)
    if (boss.phase === 3 && shots.length) {
      rings++
      assert.equal(shots.length, 11, 'a 14-pellet ring with a 3-pellet gap')
      assert.ok(delphionExposed(boss), 'the link core opens after the ring')
    }
  }
  assert.ok(rings >= 3)
  assert.equal(Math.abs(boss.gap), DELPHION.wideGap, 'phase 3 spreads wide')
}

// The run: Act III's salvage dock carries the crew into Act IV (a solo crew waits out the dock, a full
// crew presses A), every new craft does what it promises, the escort resolves and Delphion falls.
const ACT_FOUR_CHECKPOINTS = actCheckpoints(
  ROSEFIN_SECTIONS,
  ROSEFIN.bossStarts,
)
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
for (const players of [1, 4]) {
  const a = create(players)
  const b = create(players)
  const seen = { stagger: 0, cross: 0, dash: 0, mine: 0, live: 0, endHit: 0 }
  const checkpoints: number[] = []
  const phases = new Set<number>()
  let docked: number | null = null
  let entered: number | null = null
  let podAt: number | null = null
  let cleared: number | null = null
  let bossFrames = 0
  let before = a.snapshot
  let dockedSnapshot = before
  for (let frame = 0; frame < 200000 && cleared === null; frame++) {
    const input = emptyInput()
    // A full crew launches from the dock as soon as it may; a solo crew lets the dock launch itself.
    input.pressed.a =
      players === 4 && before.docked === ROSEFIN.dockMinFrames - 1
    a.update(input)
    b.update(input)
    const after = a.snapshot
    if (after.docked !== null) {
      if (docked === null) docked = frame
      dockedSnapshot = after
      assert.equal(after.act, 'S03')
    }
    if (after.act === 'S04') {
      if (entered === null) {
        entered = frame
        assert.equal(after.actFourFrame, 0)
        assert.equal(
          before.docked,
          players === 4 ? ROSEFIN.dockMinFrames - 1 : ROSEFIN.dockMaxFrames - 1,
          'the dock launches on A after its minimum, or by itself at its maximum',
        )
        assert.deepEqual(
          after.ships.map(({ lives, power, shield }) => ({
            lives,
            power,
            shield,
          })),
          dockedSnapshot.ships.map(({ lives, power, shield }) => ({
            lives,
            power,
            shield: Math.min(3, shield + 1),
          })),
          'lives and power carry into Act IV, with one bounded shield repair',
        )
        assert.equal(after.score, before.score)
        assert.equal(a.level, 4)
      }
      if (
        after.checkpoint.act === 4 &&
        checkpoints.at(-1) !== after.checkpoint.frame
      )
        checkpoints.push(after.checkpoint.frame)
      for (const reef of after.enemies) {
        const was = before.enemies.find(
          (e) =>
            e.kind === reef.kind &&
            e.wave === reef.wave &&
            e.x > reef.x &&
            e.x - reef.x < 4 &&
            Math.abs(e.y - reef.y) < 8,
        )
        if (reef.kind === 'dolphin' && reef.dive !== undefined) {
          if (reef.dive === 0) {
            assert.equal(was?.charge, 1, 'the beacons showed until the dive')
            seen.cross++
          }
          if (reef.dive === 31) seen.stagger++
          // A finished dive ends on the far side of the middle from where it began.
          if (reef.dive === 107)
            assert.ok(
              Math.sign(reef.y - 135) === -Math.sign(reef.homeY! - 135),
              'the dive crosses the middle',
            )
        }
        if (reef.kind === 'courier' && reef.fired && was && !was.fired) {
          assert.equal(
            reef.charge,
            0,
            'the cargo light flickered before the dash',
          )
          seen.dash++
          assert.ok(
            after.enemyShots.some(
              (s) => s.burst === 'ring' && Math.abs(s.y - reef.y) < 1e-9,
            ),
            'the dash drops a cargo mine',
          )
          seen.mine++
        }
        if (reef.kind === 'eel' && reef.charge === 0) seen.live++
        // An eel only loses health to a shot that reached one of its bright ends.
        if (reef.kind === 'eel' && was && reef.health < was.health) {
          assert.ok(
            before.shots.some(
              (s) =>
                Math.abs(s.x + s.vx - was.x + 0.8) < 12 &&
                Math.abs(s.y + s.vy - was.y) >= 30 - 10,
            ),
            'only the bright ends take damage',
          )
          seen.endHit++
        }
      }
      if (after.escort && podAt === null) {
        podAt = after.actFourFrame
        assert.equal(podAt, ROSEFIN_ESCORT.podAppears)
      }
      if (before.escort && !after.escort) {
        assert.equal(after.rescuedCourier, before.escort.x < 0)
        if (after.rescuedCourier)
          assert.ok(after.score >= before.score + ROSEFIN_ESCORT.rescueScore)
      }
      if (after.delphion) {
        phases.add(after.delphion.phase)
        bossFrames++
        assert.equal(
          after.delphion.maxHp,
          rainbowBossHp(DELPHION_MAX_HP, players),
        )
      }
      if (after.stage === 'aftermath') {
        assert.equal(after.delphion, null)
        assert.equal(after.enemyShots.length, 0, 'the defeat clears its shots')
        assert.equal(after.sceneId, 'A04.AFTER')
        assert.equal(after.checkpoint.rescuedCourier, after.rescuedCourier)
        cleared = frame
      }
      if (frame % 500 === 0)
        assert.deepEqual(after, b.snapshot, `desync at ${frame}`)
    }
    before = after
  }
  assert.ok(docked !== null, `${players} pilots dock after Act III`)
  assert.ok(entered !== null, `${players} pilots reach the Rosefin Express`)
  assert.ok(cleared !== null, `${players} pilots defeat Delphion`)
  assert.ok(podAt !== null, 'the courier pod runs the rails')
  assert.deepEqual(checkpoints, ACT_FOUR_CHECKPOINTS, 'every Act IV checkpoint')
  assert.deepEqual([...phases].sort(), [1, 2, 3], 'every Delphion phase')
  const minutes = (cleared - entered + 1 + ROSEFIN.aftermathFrames) / 3600
  if (players === 1) {
    for (const [what, count] of Object.entries(seen))
      assert.ok(count > 0, `the solo run saw a ${what}`)
    // A clean solo run, excluding retries, lands in the world bible's 10-15 minute window.
    assert.ok(
      minutes >= 3 && minutes <= 15, // 10-15 before Silas's 2026-10-17 playtest cut the Acts
      `a clean solo Act IV takes ${minutes.toFixed(2)} minutes`,
    )
    assert.ok(bossFrames >= 30 * 60, 'Delphion is a real fight')
  }
  summary.push(
    `${players}p ${minutes.toFixed(2)} min, B04 ${(bossFrames / 60).toFixed(0)}s, courier ${a.snapshot.rescuedCourier ? 'safe' : 'lost'}`,
  )
  console.log(`  ${players}p: ${JSON.stringify(seen)}`)
}

console.log(
  `rainbow Rosefin Express: ok (${summary.join('; ')}; director, craft, escort, Delphion telegraphs, dock)`,
)
