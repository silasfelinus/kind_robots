import assert from 'node:assert/strict'
import { actCheckpoints, resumeTick } from '../arcade/games/rainbowCheckpoints'
import {
  CLAWBURST,
  CLAWBURST_MAX_HP,
  clawburstExposed,
  clawburstWarning,
  createClawburstBoss,
  stepClawburstBoss,
} from '../arcade/games/rainbowClawburst'
import { formationMembers } from '../arcade/games/rainbowFormations'
import { rainbowBossHp } from '../arcade/games/rainbowPinkwakeBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import {
  TRENCH,
  TRENCH_GUARDIAN,
  TRENCH_SECTIONS,
  TRENCH_WAVES,
  TRENCH_WAVE_SIZES,
  trenchDialogue,
  trenchScene,
  trenchSpawns,
  trenchStage,
  type TrenchSceneId,
} from '../arcade/games/rainbowTrench'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-008: Act III, the Chromatic Trench. The authored director, its four new craft
// (clawstrike lane bolts, pistol bubble rings, angler lure crosses, skate wall glances), B03 Clawburst's
// telegraphed phases, and the seamless run from Act II into Act III with the crew's state intact.

// The director.
assert.equal(trenchStage(0, null), 'opening')
assert.equal(trenchStage(TRENCH.openingEnds, null), 'waves')
assert.equal(trenchStage(TRENCH.turnStarts, null), 'turn')
assert.equal(trenchStage(TRENCH.bossStarts, null), 'boss')
assert.equal(trenchStage(100, 50), 'aftermath')
assert.deepEqual(trenchSpawns(100), [], 'the opening comms are a safe corridor')
assert.deepEqual(trenchSpawns(TRENCH.turnStarts + 10), [])
assert.equal(TRENCH_SECTIONS[0]!.from, TRENCH.openingEnds)
assert.equal(TRENCH_SECTIONS.at(-1)!.to, TRENCH.turnStarts)
const firstKind: Record<string, string> = {
  'Sniper ridge': 'clawstrike',
  'Bubble pockets': 'pistol',
  'Angler lights': 'angler',
  'Glass skates': 'skate',
}
for (const [i, section] of TRENCH_SECTIONS.entries()) {
  if (i > 0) assert.equal(section.from, TRENCH_SECTIONS[i - 1]!.to)
  const waves = TRENCH_WAVES.filter(
    (w) => w.at >= section.from && w.at < section.to,
  )
  // The guardian holds its section alone; every other section is authored waves.
  assert.equal(
    waves.length > 0,
    section.name !== TRENCH_GUARDIAN.name,
    `${section.name} waves`,
  )
  // Each lesson section opens with the craft it teaches.
  if (firstKind[section.name])
    assert.equal(waves[0]!.kind, firstKind[section.name], section.name)
}
for (const entry of TRENCH_WAVES) {
  for (const member of formationMembers(entry))
    assert.ok(
      member.at < TRENCH.turnStarts,
      'every craft enters before the TURN',
    )
}
const craft = TRENCH_WAVE_SIZES.reduce((sum, size) => sum + size, 0)
assert.ok(craft >= 80, `Act III authors ${craft} craft`)
for (const kind of ['clawstrike', 'pistol', 'angler', 'skate'])
  assert.ok(
    TRENCH_WAVES.some((w) => w.kind === kind),
    `${kind} flies`,
  )
// Three scenes, three lines each, every line inside its scene window for every crew size.
const windows: Record<TrenchSceneId, number> = {
  'A03.OPEN': TRENCH.openingEnds,
  'A03.TURN': TRENCH.bossStarts - TRENCH.turnStarts,
  'A03.AFTER': TRENCH.aftermathFrames,
}
for (const players of [1, 2, 3, 4]) {
  for (const [id, frames] of Object.entries(windows) as Array<
    [TrenchSceneId, number]
  >) {
    for (let line = 0; line < 3; line++) {
      const said = trenchDialogue(id, line * TRENCH.lineFrames, players)
      assert.ok(said && said.speaker && said.text, `${id} line ${line + 1}`)
    }
    assert.ok(3 * TRENCH.lineFrames <= frames, `${id} fits its window`)
  }
}
assert.equal(trenchScene(0, null)?.id, 'A03.OPEN')
assert.equal(trenchScene(TRENCH.turnStarts, null)?.id, 'A03.TURN')
assert.equal(trenchScene(TRENCH.openingEnds + 10, null), null)
assert.equal(trenchScene(9000, 9000)?.id, 'A03.AFTER')
assert.equal(resumeTick({ act: 3, frame: 1800 }, 100, 5000), 6799)

// B03 Clawburst: a full warning before every attack, the marked lane is the lane fired, a fresh warning
// on every phase change, and the cracked cannon after the punch.
assert.equal(rainbowBossHp(CLAWBURST_MAX_HP, 1), 450)
for (const phase of [1, 2, 3] as const) {
  const boss = createClawburstBoss(450)
  boss.hp = phase === 1 ? 450 : phase === 2 ? 250 : 100
  const pilot = { x: 80, y: 60, lives: 3 }
  let cue = 0
  let volleys = 0
  let marked = boss.aimY
  for (let frame = 0; frame < 1200; frame++) {
    // The pilot keeps moving, so a locked aim is visible as a difference.
    pilot.y = 60 + (frame % 300) * 0.5
    const shots = stepClawburstBoss(boss, [pilot])
    if (shots.length) {
      volleys++
      const lead =
        boss.phase === 3
          ? CLAWBURST.punchWarningFrames
          : CLAWBURST.warningFrames
      assert.ok(
        cue >= lead,
        `phase ${phase} volley ${volleys} followed ${cue} warning frames`,
      )
      if (boss.phase !== 2) {
        // The fastest shot flies down the lane the warning marked, not where the pilot is now.
        const bolt = shots.reduce((a, b) =>
          Math.hypot(a.vx, a.vy) > Math.hypot(b.vx, b.vy) ? a : b,
        )
        const landing = bolt.y + ((80 - bolt.x) / bolt.vx) * bolt.vy
        assert.ok(
          Math.abs(landing - marked) < 0.5,
          `the lane marked when the warning began fires (${landing.toFixed(1)} vs ${marked.toFixed(1)})`,
        )
      }
      if (boss.phase === 3) {
        assert.equal(clawburstExposed(boss), true)
        let open = 0
        const probe = { ...boss }
        while (clawburstExposed(probe)) {
          probe.frame++
          open++
        }
        assert.equal(open, CLAWBURST.exposedFrames, 'the cannon stays open')
      }
    }
    const warning = clawburstWarning(boss)
    // The lane shown when the cue first lights is the lane that must fire.
    if (warning && cue === 0) marked = boss.aimY
    cue = warning ? cue + 1 : 0
  }
  assert.ok(volleys >= 6, `phase ${phase} fired ${volleys} volleys`)
}
{
  // A phase change mid-warning restarts the warning from scratch.
  const boss = createClawburstBoss(450)
  while (!clawburstWarning(boss)) stepClawburstBoss(boss, [])
  for (let i = 0; i < 20; i++) stepClawburstBoss(boss, [])
  boss.hp = 100
  stepClawburstBoss(boss, [])
  assert.equal(boss.phase, 3)
  assert.ok(
    boss.nextVolley - boss.frame > CLAWBURST.punchWarningFrames,
    'the punch shows its full charge',
  )
}

// The run: Act II flows into Act III with the crew's state, every new craft does what it promises,
// and the deterministic demo clears Clawburst with one pilot and with four.
const ACT_THREE_CHECKPOINTS = actCheckpoints(TRENCH_SECTIONS, TRENCH.bossStarts)
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
for (const players of [1, 4]) {
  const a = create(players)
  const b = create(players)
  const seen = { bolt: 0, ring: 0, cross: 0, glance: 0, marks: 0 }
  const checkpoints: number[] = []
  let entered: number | null = null
  let cleared = false
  let before = a.snapshot
  for (let frame = 0; frame < 110000 && !cleared; frame++) {
    a.update(emptyInput())
    b.update(emptyInput())
    const after = a.snapshot
    if (after.act === 'S03') {
      if (entered === null) {
        entered = frame
        assert.equal(before.act, 'S02')
        assert.equal(after.actThreeFrame, 0)
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
          'lives, shields and power carry into Act III',
        )
        assert.equal(after.score, before.score)
        assert.equal(a.level, 3)
      }
      if (
        after.checkpoint.act === 3 &&
        checkpoints.at(-1) !== after.checkpoint.frame
      )
        checkpoints.push(after.checkpoint.frame)
      // Clawstrike: a 36-frame lane mark that holds still, then a straight bolt down that lane.
      for (const reef of after.enemies) {
        if (reef.kind !== 'clawstrike' || reef.charge === undefined) continue
        const was = before.enemies.find(
          (e) =>
            e.kind === 'clawstrike' && e.wave === reef.wave && e.y === reef.y,
        )
        if (was?.charge === undefined && reef.charge > 0) {
          assert.equal(reef.charge, 36, 'a fresh lane mark shows 36 frames')
          seen.marks++
        }
      }
      for (const reef of before.enemies) {
        if (reef.kind !== 'clawstrike' || reef.charge !== 1) continue
        const still = after.enemies.some(
          (e) => e.kind === 'clawstrike' && e.y === reef.y && e.charge === 0,
        )
        if (!still) continue
        assert.ok(
          after.enemyShots.some(
            (s) => s.vy === 0 && s.vx === -4.4 && Math.abs(s.y - reef.y) < 1e-9,
          ),
          'the bolt flies down the marked lane',
        )
        seen.bolt++
      }
      // Bubbles and lures burst where they ripened; skate glass glances once.
      for (const shot of before.enemyShots) {
        if (shot.fuse === 1) {
          const at = { x: shot.x + shot.vx, y: shot.y + shot.vy }
          const pellets = after.enemyShots.filter(
            (s) => Math.hypot(s.x - at.x, s.y - at.y) < 1e-6 && !s.fuse,
          ).length
          if (shot.burst === 'ring') {
            assert.ok(pellets >= 7, `a bubble bursts into a ring (${pellets})`)
            seen.ring++
          } else {
            assert.ok(pellets >= 3, `a lure bursts into a cross (${pellets})`)
            seen.cross++
          }
        }
        if (shot.bounces === 1) {
          const glanced = after.enemyShots.find(
            (s) => s.bounces === 0 && s.vx === shot.vx && s.vy === -shot.vy,
          )
          if (glanced) {
            assert.ok(
              glanced.y >= 34 && glanced.y <= 252,
              'it glances off a wall',
            )
            seen.glance++
          }
        }
      }
      if (after.stage === 'aftermath') {
        assert.equal(after.clawBoss, null)
        assert.equal(after.enemyShots.length, 0, 'the defeat clears its shots')
        assert.equal(after.sceneId, 'A03.AFTER')
        cleared = true
      }
      if (frame % 500 === 0)
        assert.deepEqual(after, b.snapshot, `desync at ${frame}`)
    }
    before = after
  }
  assert.ok(entered !== null, `${players} pilots reach the Chromatic Trench`)
  assert.ok(cleared, `${players} pilots defeat Clawburst`)
  assert.deepEqual(
    checkpoints,
    ACT_THREE_CHECKPOINTS,
    'every Act III checkpoint',
  )
  if (players === 1) {
    for (const [what, count] of Object.entries(seen))
      assert.ok(count > 0, `the solo run saw a ${what}`)
  }
  console.log(`  ${players}p: ${JSON.stringify(seen)}`)
}

console.log(
  'rainbow Chromatic Trench: ok (director, craft mechanics, Clawburst telegraphs, Act II to III continuity)',
)
