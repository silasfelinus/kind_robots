import assert from 'node:assert/strict'
import { actCheckpoints, resumeTick } from '../arcade/games/rainbowCheckpoints'
import { CROWN_REEF } from '../arcade/games/rainbowCrownReef'
import { formationMembers } from '../arcade/games/rainbowFormations'
import {
  GLASS,
  GLASS_GUARDIAN,
  GLASS_NAVIGATOR,
  GLASS_SECTIONS,
  GLASS_WAVES,
  GLASS_WAVE_SIZES,
  glassDialogue,
  glassNavigatorY,
  glassScene,
  glassSpawns,
  glassStage,
  type GlassSceneId,
} from '../arcade/games/rainbowGlassCurrent'
import {
  GLASS_EEL,
  GLASS_EEL_MAX_HP,
  createGlassEelBoss,
  glassEelExposed,
  glassEelWarning,
  stepGlassEelBoss,
} from '../arcade/games/rainbowGlassEel'
import {
  RAINBOW_GUARDIAN,
  createRainbowGuardian,
  stepRainbowGuardian,
} from '../arcade/games/rainbowGuardian'
import { rainbowBossHp } from '../arcade/games/rainbowPinkwakeBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-009: Act VII, the Glass Current. The authored director, its four new craft (mirror
// eels with phantom copies, crystal squids whose pellets split, harbingers that remix old patterns, prism
// pylons), the Mirror guardian, the machine echo, the optional Lost Navigator rescue, B07 Glass Eel's
// telegraphed phases (only the outlined eel is solid), and the continuous hand-off from Act VI.

// The director.
assert.equal(glassStage(0, null), 'opening')
assert.equal(glassStage(GLASS.openingEnds, null), 'waves')
assert.equal(glassStage(GLASS.turnStarts, null), 'turn')
assert.equal(glassStage(GLASS.bossStarts, null), 'boss')
assert.equal(glassStage(100, 50), 'aftermath')
assert.deepEqual(glassSpawns(100), [], 'the opening comms are safe')
assert.equal(GLASS_SECTIONS[0]!.from, GLASS.openingEnds)
assert.equal(GLASS_SECTIONS.at(-1)!.to, GLASS.turnStarts)
const firstKind: Record<string, string> = {
  'Mirror canyon': 'mirror',
  'Split lenses': 'squid',
  'Harbinger glass': 'harbinger',
  'Prism pylons': 'prism',
}
for (const [i, section] of GLASS_SECTIONS.entries()) {
  if (i > 0) assert.equal(section.from, GLASS_SECTIONS[i - 1]!.to)
  const waves = GLASS_WAVES.filter(
    (w) => w.at >= section.from && w.at < section.to,
  )
  assert.equal(
    waves.length > 0,
    section.name !== GLASS_GUARDIAN.name,
    `${section.name} waves`,
  )
  if (firstKind[section.name])
    assert.equal(waves[0]!.kind, firstKind[section.name], section.name)
}
for (const entry of GLASS_WAVES)
  for (const member of formationMembers(entry))
    assert.ok(member.at < GLASS.turnStarts, 'every craft enters before TURN')
const craft = GLASS_WAVE_SIZES.reduce((sum, size) => sum + size, 0)
assert.ok(craft >= 140, `Act VII authors ${craft} craft`)
// The machine echo opens after the guardian, with no wave under its three lines; the navigator's
// comms open its own section, two lines before the pod appears.
assert.equal(GLASS.echoAt, GLASS_GUARDIAN.to)
for (const [from, lines] of [
  [GLASS.echoAt, 3],
  [GLASS_NAVIGATOR.commsFrom, 2],
] as const)
  assert.ok(
    GLASS_WAVES.every(
      (w) => w.at < from || w.at >= from + lines * GLASS.lineFrames,
    ),
    'no wave flies in under the comms',
  )
assert.ok(
  GLASS_NAVIGATOR.podAppears >=
    GLASS_NAVIGATOR.commsFrom + 2 * GLASS.lineFrames,
)
for (let f = GLASS_NAVIGATOR.podAppears; f < GLASS.turnStarts; f += 7) {
  const y = glassNavigatorY(f)
  assert.ok(y >= 60 && y <= 210, 'the pod weaves inside the canyon')
}
const windows: Record<GlassSceneId, [number, number]> = {
  'A07.OPEN': [3, GLASS.openingEnds],
  'A07.ECHO': [3, 3 * GLASS.lineFrames],
  'A07.SIGNAL': [2, GLASS_NAVIGATOR.podAppears - GLASS_NAVIGATOR.commsFrom],
  'A07.TURN': [3, GLASS.bossStarts - GLASS.turnStarts],
  'A07.AFTER': [3, GLASS.aftermathFrames],
}
for (const players of [1, 2, 3, 4]) {
  for (const [id, [lines, frames]] of Object.entries(windows) as Array<
    [GlassSceneId, [number, number]]
  >) {
    for (let line = 0; line < lines; line++) {
      const said = glassDialogue(id, line * GLASS.lineFrames, players)
      assert.ok(said && said.speaker && said.text, `${id} line ${line + 1}`)
    }
    assert.equal(glassDialogue(id, lines * GLASS.lineFrames, players), null)
    assert.ok(lines * GLASS.lineFrames <= frames, `${id} fits its window`)
  }
}
// CAST-BIBLE S07: the Crown calls Azure by an outdated chart designation, and she answers it herself.
assert.equal(glassDialogue('A07.ECHO', 0, 1)!.speaker, 'Crown Echo')
assert.match(glassDialogue('A07.ECHO', 0, 1)!.text, /AZ-7/)
assert.equal(glassDialogue('A07.ECHO', GLASS.lineFrames, 2)!.speaker, 'Azure')
assert.equal(glassDialogue('A07.ECHO', GLASS.lineFrames, 1)!.speaker, 'Lilt-7')
assert.notEqual(
  glassDialogue('A07.TURN', 0, 1, true)!.text,
  glassDialogue('A07.TURN', 0, 1, false)!.text,
  'the rescue changes what the crew learns',
)
assert.equal(glassScene(GLASS.echoAt, null)?.id, 'A07.ECHO')
assert.equal(glassScene(GLASS_NAVIGATOR.commsFrom, null)?.id, 'A07.SIGNAL')
assert.equal(glassScene(GLASS.turnStarts, null)?.id, 'A07.TURN')
assert.equal(
  resumeTick({ act: 7, frame: 1800 }, 100, 5000, 9000, 20000, 30000, 40000),
  41799,
)
assert.ok(GLASS_GUARDIAN.to - RAINBOW_GUARDIAN.escapeLead > GLASS_GUARDIAN.from)

// The Mirror guardian: half of every fan is phantom light, alternating which half from volley to volley.
{
  const guardian = createRainbowGuardian('mirror', 1)
  const volleys: boolean[][] = []
  for (let i = 0; i < 600; i++) {
    const shots = stepRainbowGuardian(
      guardian,
      [{ x: 80, y: 135, lives: 1 }],
      false,
    )
    if (shots.length) volleys.push(shots.map((s) => s.ghost === true))
  }
  assert.ok(volleys.length >= 3)
  for (const volley of volleys) {
    assert.ok(volley.some((g) => g) && volley.some((g) => !g))
    for (let i = 1; i < volley.length; i++)
      assert.notEqual(volley[i], volley[i - 1], 'solid and phantom alternate')
  }
  assert.notEqual(volleys[0]![0], volleys[1]![0], 'the solid half swaps')
}

// B07 Glass Eel: every volley follows its full warning; a ghost copy fires only phantom pellets and trades
// places; ricochets glance once and split; the true core opens after each ring and is never a ghost.
{
  const target = { x: 80, y: 135, lives: 1 }
  const boss = createGlassEelBoss(400)
  let warned = 0
  let swaps = 0
  for (let i = 0; i < 700; i++) {
    if (glassEelWarning(boss)) warned++
    const real = boss.y
    const ghost = boss.ghosts[0]!
    const shots = stepGlassEelBoss(boss, [target])
    if (shots.length) {
      assert.ok(warned >= GLASS_EEL.warningFrames)
      warned = 0
      const solid = shots.filter((s) => !s.ghost)
      const phantom = shots.filter((s) => s.ghost)
      assert.ok(solid.length === 5 && phantom.length === 5)
      assert.ok(solid.every((s) => s.y === real))
      assert.ok(phantom.every((s) => s.y === ghost))
      swaps++
    }
  }
  assert.ok(swaps >= 4)
  assert.ok(Math.abs(boss.y - boss.ghosts[0]!) > 40, 'the copy sits apart')
  boss.hp = 250
  let ricochets = 0
  for (let i = 0; i < 500; i++) {
    for (const shot of stepGlassEelBoss(boss, [target])) {
      assert.equal(shot.ghost, undefined, 'phase 2 has no phantoms')
      assert.equal(shot.bounces, 1)
      assert.equal(shot.burst, 'split')
      ricochets++
    }
  }
  assert.ok(ricochets >= 8)
  boss.hp = 100
  let opened = 0
  for (let i = 0; i < 900; i++) {
    const was = glassEelExposed(boss)
    const shots = stepGlassEelBoss(boss, [target])
    if (shots.length) {
      assert.ok(shots.some((s) => !s.ghost) && shots.some((s) => s.ghost))
      assert.equal(boss.ghosts.length, 2)
      assert.ok(
        !boss.ghosts.includes(boss.y),
        'an afterimage never overlaps the eel',
      )
      assert.ok(GLASS_EEL.slots.includes(boss.y))
    }
    if (!was && glassEelExposed(boss)) opened++
  }
  assert.ok(opened >= 4)
}

// The run: Act VI's aftermath runs straight into Act VII, the glass craft keep their rules, phantom
// pellets never hit, a solo crew reaches the navigator while a pair leaves it, and the Glass Eel falls.
const ACT_SEVEN_CHECKPOINTS = actCheckpoints(GLASS_SECTIONS, GLASS.bossStarts)
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
  const seen = { phantom: 0, split: 0, bolt: 0, bubble: 0, prismFan: 0 }
  const checkpoints: number[] = []
  const phases = new Set<number>()
  let entered: number | null = null
  let cleared: number | null = null
  let bossFrames = 0
  let before = a.snapshot
  for (let frame = 0; frame < 380000 && cleared === null; frame++) {
    a.update(emptyInput())
    b.update(emptyInput())
    const after = a.snapshot
    if (after.act === 'S07') {
      if (entered === null) {
        entered = frame
        assert.equal(before.act, 'S06')
        assert.equal(before.stage, 'aftermath')
        assert.ok(before.actSixFrame >= CROWN_REEF.bossStarts)
        assert.deepEqual(
          after.ships.map(({ lives, power, shield }) => ({
            lives,
            power,
            shield,
          })),
          before.ships.map(({ lives, power, shield }) => ({
            lives,
            power,
            shield,
          })),
          'lives, power and shields carry straight into Act VII',
        )
        assert.equal(a.level, 7)
      }
      if (
        after.checkpoint.act === 7 &&
        checkpoints.at(-1) !== after.checkpoint.frame
      )
        checkpoints.push(after.checkpoint.frame)
      // A phantom pellet that reaches a pilot's core passes straight through: no hit, no shield lost.
      for (const [seat, ship] of after.ships.slice(0, players).entries()) {
        const was = before.ships[seat]!
        if (was.invulnerable > 0 || ship.lives <= 0) continue
        const onPhantom = before.enemyShots.some(
          (s) =>
            s.ghost && Math.hypot(s.x + s.vx - ship.x, s.y + s.vy - ship.y) < 7,
        )
        const nearSolid = before.enemyShots.some(
          (s) => !s.ghost && Math.hypot(s.x - ship.x, s.y - ship.y) < 16,
        )
        if (onPhantom && !nearSolid) {
          assert.equal(ship.shield, was.shield, 'phantoms never hit')
          assert.equal(ship.lives, was.lives, 'phantoms never hit')
          seen.phantom++
        }
      }
      for (const shot of after.enemyShots) {
        if (shot.burst === 'split') seen.split++
        if (shot.burst === 'ring') seen.bubble++
        if (shot.vx === -4.4) seen.bolt++
      }
      for (const reef of after.enemies) {
        if (reef.kind !== 'prism') continue
        if (reef.dive !== undefined && reef.dive % 140 === 0) seen.prismFan++
      }
      if (after.actSevenFrame < GLASS_NAVIGATOR.podAppears)
        assert.equal(after.navigator, null)
      if (after.navigator)
        assert.equal(
          after.navigator.y,
          glassNavigatorY(after.actSevenFrame),
          'the pod follows its weave',
        )
      if (after.actSevenFrame >= GLASS.turnStarts)
        assert.equal(after.navigator, null, 'the pod is gone by the turn')
      if (after.glassEel) {
        phases.add(after.glassEel.phase)
        bossFrames++
        assert.equal(
          after.glassEel.maxHp,
          rainbowBossHp(GLASS_EEL_MAX_HP, players),
        )
      }
      if (after.stage === 'aftermath') {
        assert.equal(after.glassEel, null)
        assert.equal(after.enemyShots.length, 0)
        assert.equal(after.sceneId, 'A07.AFTER')
        cleared = frame
      }
      if (frame % 500 === 0)
        assert.deepEqual(after, b.snapshot, `desync at ${frame}`)
    }
    before = after
  }
  assert.ok(entered !== null, `${players} pilots reach the Glass Current`)
  assert.ok(cleared !== null, `${players} pilots free the Glass Eel`)
  assert.deepEqual(
    checkpoints,
    ACT_SEVEN_CHECKPOINTS,
    'every Act VII checkpoint',
  )
  assert.deepEqual([...phases].sort(), [1, 2, 3], 'every Glass Eel phase')
  assert.equal(
    a.snapshot.rescuedNavigator,
    players % 2 === 1,
    'the solo demo reaches the navigator; the pair leaves it',
  )
  assert.equal(a.snapshot.guardians[7], 'defeated')
  const minutes = (cleared - entered + 1 + GLASS.aftermathFrames) / 3600
  if (players === 1) {
    for (const [what, count] of Object.entries(seen))
      assert.ok(count > 0, `the solo run saw a ${what}`)
    assert.ok(
      minutes >= 10 && minutes <= 15,
      `a clean solo Act VII takes ${minutes.toFixed(2)} minutes`,
    )
    assert.ok(bossFrames >= 30 * 60, 'the Glass Eel is a real fight')
  }
  summary.push(
    `${players}p ${a.snapshot.rescuedNavigator ? 'navigator' : 'no navigator'} ${minutes.toFixed(2)} min, B07 ${(bossFrames / 60).toFixed(0)}s`,
  )
  console.log(`  ${players}p: ${JSON.stringify(seen)}`)
}

console.log(
  `rainbow Glass Current: ok (${summary.join('; ')}; director, craft, echo, navigator, Glass Eel telegraphs, phantoms)`,
)
