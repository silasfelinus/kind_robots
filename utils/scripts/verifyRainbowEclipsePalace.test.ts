import assert from 'node:assert/strict'
import { actCheckpoints, resumeTick } from '../arcade/games/rainbowCheckpoints'
import {
  PALACE,
  PALACE_CAPTIVE,
  PALACE_CAPTIVES,
  PALACE_GUARDIAN,
  PALACE_SECTIONS,
  PALACE_WAVES,
  PALACE_WAVE_SIZES,
  palaceAllies,
  palaceDialogue,
  palaceScene,
  palaceSpawns,
  palaceStage,
  type PalaceFlags,
  type PalaceSceneId,
} from '../arcade/games/rainbowEclipsePalace'
import { formationMembers } from '../arcade/games/rainbowFormations'
import { GLASS } from '../arcade/games/rainbowGlassCurrent'
import {
  RAINBOW_GUARDIAN,
  createRainbowGuardian,
  rainbowGuardianMarksLanes,
  stepRainbowGuardian,
} from '../arcade/games/rainbowGuardian'
import { rainbowBossHp } from '../arcade/games/rainbowPinkwakeBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import {
  PRISM_LEVIATHAN,
  PRISM_LEVIATHAN_MAX_HP,
  createPrismLeviathanBoss,
  prismLeviathanExposed,
  prismLeviathanTidal,
  prismLeviathanWarning,
  stepPrismLeviathanBoss,
} from '../arcade/games/rainbowPrismLeviathan'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-009: Act VIII, the Eclipse Palace. The authored director (legacy families from every
// earlier Act in elite formations), the captive armada (only the collar takes damage, so a captive is never
// harmed), the Herald guardian, the council that earlier rescues answer, B08 Prism Leviathan's telegraphed
// phases, and the continuous hand-off from Act VII.

// The director.
assert.equal(palaceStage(0, null), 'opening')
assert.equal(palaceStage(PALACE.openingEnds, null), 'waves')
assert.equal(palaceStage(PALACE.turnStarts, null), 'turn')
assert.equal(palaceStage(PALACE.bossStarts, null), 'boss')
assert.equal(palaceStage(100, 50), 'aftermath')
assert.deepEqual(palaceSpawns(100), [], 'the opening comms are safe')
assert.equal(PALACE_SECTIONS[0]!.from, PALACE.openingEnds)
assert.equal(PALACE_SECTIONS.at(-1)!.to, PALACE.turnStarts)
const firstKind: Record<string, string> = {
  'Corona gate': 'harbinger',
  'Captive armada': 'captive',
}
for (const [i, section] of PALACE_SECTIONS.entries()) {
  if (i > 0) assert.equal(section.from, PALACE_SECTIONS[i - 1]!.to)
  const waves = PALACE_WAVES.filter(
    (w) => w.at >= section.from && w.at < section.to,
  )
  assert.equal(
    waves.length > 0,
    section.name !== PALACE_GUARDIAN.name,
    `${section.name} waves`,
  )
  if (firstKind[section.name])
    assert.equal(waves[0]!.kind, firstKind[section.name], section.name)
}
for (const entry of PALACE_WAVES)
  for (const member of formationMembers(entry))
    assert.ok(member.at < PALACE.turnStarts, 'every craft enters before CORE')
const craft = PALACE_WAVE_SIZES.reduce((sum, size) => sum + size, 0)
assert.ok(craft >= 140, `Act VIII authors ${craft} craft`)
// The t-023 recut kept the captive armada, the council and the last captives (25 before it).
assert.ok(PALACE_CAPTIVES >= 12, `${PALACE_CAPTIVES} captives to free`)
// Recognizable legacy motifs: craft from every earlier Act's family return.
const families = [
  ['spiral'],
  ['lantern'],
  ['clawstrike', 'pistol', 'skate'],
  ['dolphin'],
  ['cutter', 'hammerhead', 'salvager'],
  ['turret', 'bulwark', 'brood'],
  ['mirror', 'squid', 'harbinger', 'prism'],
]
for (const family of families)
  assert.ok(
    PALACE_WAVES.some((w) => family.includes(w.kind)),
    `${family[0]} returns`,
  )
// The council opens after the guardian, with no wave under its three lines.
assert.equal(PALACE.councilAt, PALACE_GUARDIAN.to)
assert.ok(
  PALACE_WAVES.every(
    (w) =>
      w.at < PALACE.councilAt ||
      w.at >= PALACE.councilAt + 3 * PALACE.lineFrames,
  ),
  'no wave flies in under the council',
)
const none: PalaceFlags = {
  rescuedNemi: false,
  rescuedCourier: false,
  freedDepot: false,
  stoppedRelay: false,
  rescuedNavigator: false,
  captivesFreed: 0,
}
const every: PalaceFlags = {
  rescuedNemi: true,
  rescuedCourier: true,
  freedDepot: true,
  stoppedRelay: true,
  rescuedNavigator: true,
  captivesFreed: 12,
}
assert.deepEqual(palaceAllies(none), [])
assert.deepEqual(palaceAllies(every), [
  'Navigator',
  'Nemi',
  'Courier',
  'Survivors',
  'Relay',
])
const windows: Record<PalaceSceneId, [number, number]> = {
  'A08.OPEN': [3, PALACE.openingEnds],
  'A08.TURN': [3, 3 * PALACE.lineFrames],
  'A08.CORE': [3, PALACE.bossStarts - PALACE.turnStarts],
  'A08.AFTER': [3, PALACE.aftermathFrames],
}
for (const players of [1, 2, 3, 4])
  for (const flags of [none, every])
    for (const [id, [lines, frames]] of Object.entries(windows) as Array<
      [PalaceSceneId, [number, number]]
    >) {
      for (let line = 0; line < lines; line++) {
        const said = palaceDialogue(
          id,
          line * PALACE.lineFrames,
          players,
          flags,
        )
        assert.ok(said && said.speaker && said.text, `${id} line ${line + 1}`)
      }
      assert.equal(
        palaceDialogue(id, lines * PALACE.lineFrames, players, flags),
        null,
      )
      assert.ok(lines * PALACE.lineFrames <= frames, `${id} fits its window`)
    }
// The council answers in the voice of the first ally earlier rescues earned.
assert.equal(
  palaceDialogue('A08.TURN', PALACE.lineFrames, 1, every)!.speaker,
  'Navigator',
)
assert.equal(
  palaceDialogue('A08.TURN', PALACE.lineFrames, 1, {
    ...none,
    rescuedNemi: true,
  })!.speaker,
  'Nemi',
)
assert.equal(
  palaceDialogue('A08.TURN', PALACE.lineFrames, 1, none)!.speaker,
  'Maribel',
)
assert.equal(
  palaceDialogue('A08.TURN', 2 * PALACE.lineFrames, 2, none)!.speaker,
  'Azure',
)
assert.match(
  palaceDialogue('A08.AFTER', PALACE.lineFrames, 1, every)!.text,
  /freed 12 captives/,
)
assert.equal(palaceScene(PALACE.councilAt, null)?.id, 'A08.TURN')
assert.equal(palaceScene(PALACE.turnStarts, null)?.id, 'A08.CORE')
assert.equal(
  resumeTick(
    { act: 8, frame: 1800 },
    100,
    5000,
    9000,
    20000,
    30000,
    40000,
    50000,
  ),
  51799,
)
assert.ok(
  PALACE_GUARDIAN.to - RAINBOW_GUARDIAN.escapeLead > PALACE_GUARDIAN.from,
)

// The Herald guardian alternates two old lessons: bolts down the lanes it marked, then a gapped ring.
{
  const guardian = createRainbowGuardian('herald', 1)
  const kinds: string[] = []
  for (let i = 0; i < 700; i++) {
    const marking = rainbowGuardianMarksLanes(guardian)
    const lanes = [...guardian.lanes]
    const shots = stepRainbowGuardian(
      guardian,
      [{ x: 80, y: 135, lives: 1 }],
      false,
    )
    if (!shots.length) continue
    if (shots.every((s) => s.vy === 0 && s.vx === -4.2)) {
      assert.ok(marking, 'a lane volley was marked')
      assert.deepEqual(
        shots.map((s) => s.y),
        lanes,
        'every bolt flies a marked lane',
      )
      kinds.push('lanes')
    } else {
      assert.ok(shots.length >= 9, 'a ring')
      kinds.push('ring')
    }
  }
  assert.ok(kinds.length >= 4)
  for (let i = 1; i < kinds.length; i++)
    assert.notEqual(kinds[i], kinds[i - 1], 'the herald alternates')
}

// B08 Prism Leviathan: every wall follows its full warning and leaves its marked gap open; the spire locks
// fire until shot off, and with all four gone the wall returns; the gem opens after each pair of rings.
{
  const target = { x: 80, y: 135, lives: 1 }
  const boss = createPrismLeviathanBoss(400)
  let warned = 0
  let walls = 0
  for (let i = 0; i < 700; i++) {
    if (prismLeviathanWarning(boss)) warned++
    const shots = stepPrismLeviathanBoss(boss, [target])
    if (shots.length) {
      assert.ok(warned >= PRISM_LEVIATHAN.warningFrames)
      warned = 0
      walls++
      assert.ok(
        shots.every(
          (s) => Math.abs(s.y - boss.gapY) >= PRISM_LEVIATHAN.gapHalf,
        ),
        'the marked gap stays open',
      )
      assert.ok(
        Math.abs(boss.gapY - target.y) >= 40,
        'the gap asks the pilot to move',
      )
    }
  }
  assert.ok(walls >= 4)
  boss.hp = 250
  let aimed = 0
  for (let i = 0; i < 300; i++) {
    const shots = stepPrismLeviathanBoss(boss, [target])
    if (shots.length) {
      assert.equal(shots.length, 4, 'one pellet per spire lock')
      aimed++
    }
  }
  assert.ok(aimed >= 3)
  boss.locks = [0, 0, 0, 3]
  for (let i = 0; i < 200 && !prismLeviathanWarning(boss); i++)
    stepPrismLeviathanBoss(boss, [target])
  // The last lock falls mid-charge: the wall restarts its full warning.
  for (let i = 0; i < 10; i++) stepPrismLeviathanBoss(boss, [target])
  boss.locks = [0, 0, 0, 0]
  assert.ok(prismLeviathanTidal(boss))
  warned = 0
  for (let i = 0; i < 300; i++) {
    if (prismLeviathanWarning(boss)) warned++
    const shots = stepPrismLeviathanBoss(boss, [target])
    if (shots.length) {
      assert.ok(
        warned >= PRISM_LEVIATHAN.warningFrames,
        'a full warning before the wall',
      )
      assert.ok(shots.length >= 10, 'the tidal wall returns')
      break
    }
  }
  boss.hp = 100
  let opened = 0
  for (let i = 0; i < 900; i++) {
    const was = prismLeviathanExposed(boss)
    stepPrismLeviathanBoss(boss, [target])
    if (!was && prismLeviathanExposed(boss)) opened++
  }
  assert.ok(opened >= 4)
}

// The run: Act VII's aftermath runs straight into Act VIII, captives are never harmed, the council pays
// out for earlier rescues, a solo crew frees most of the armada, and the Leviathan falls.
const ACT_EIGHT_CHECKPOINTS = actCheckpoints(PALACE_SECTIONS, PALACE.bossStarts)
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
  const seen = { collarHit: 0, hullSoak: 0, freedFlight: 0, council: 0 }
  const checkpoints: number[] = []
  const phases = new Set<number>()
  let entered: number | null = null
  let cleared: number | null = null
  let bossFrames = 0
  let before = a.snapshot
  for (let frame = 0; frame < 460000 && cleared === null; frame++) {
    a.update(emptyInput())
    b.update(emptyInput())
    const after = a.snapshot
    if (after.act === 'S08') {
      if (entered === null) {
        entered = frame
        assert.equal(before.act, 'S07')
        assert.equal(before.stage, 'aftermath')
        assert.ok(before.actSevenFrame >= GLASS.bossStarts)
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
          'lives, power and shields carry straight into Act VIII',
        )
        assert.equal(a.level, 8)
      }
      if (
        after.checkpoint.act === 8 &&
        checkpoints.at(-1) !== after.checkpoint.frame
      )
        checkpoints.push(after.checkpoint.frame)
      assert.ok(after.captivesFreed >= before.captivesFreed)
      for (const captive of after.enemies) {
        if (captive.kind !== 'captive') continue
        const was = before.enemies.find(
          (e) =>
            e.kind === 'captive' &&
            Math.abs(e.x - captive.x) < 2 &&
            Math.abs(e.y - captive.y) < 2,
        )
        if (!was) continue
        if (captive.freed) {
          if (was.freed)
            assert.ok(captive.y < was.y, 'a freed captive lifts away')
          seen.freedFlight++
          continue
        }
        if (captive.health < was.health) {
          seen.collarHit++
          continue
        }
        // A shot that reaches the hull is spent there, and the captive is no worse for it.
        const soaked = before.shots.find(
          (s) =>
            Math.abs(s.y - was.y) < PALACE_CAPTIVE.hullHalfHeight - 2 &&
            Math.abs(s.x + s.vx - was.x) < PALACE_CAPTIVE.hullHalfWidth - 4,
        )
        if (soaked) {
          assert.ok(
            !after.shots.some(
              (s) =>
                s.seat === soaked.seat &&
                s.x === soaked.x + soaked.vx &&
                s.y === soaked.y + soaked.vy,
            ),
            'the hull stops the shot',
          )
          assert.equal(captive.health, was.health, 'the hull is never harmed')
          seen.hullSoak++
        }
      }
      if (after.actEightFrame === PALACE.councilAt && after.allies.length) {
        for (const ship of after.ships.filter((s) => s.lives > 0))
          assert.ok(ship.shield >= 1, 'allies add support at the council')
        seen.council++
      }
      if (after.leviathan) {
        phases.add(after.leviathan.phase)
        bossFrames++
        assert.equal(
          after.leviathan.maxHp,
          rainbowBossHp(PRISM_LEVIATHAN_MAX_HP, players),
        )
      }
      if (after.stage === 'aftermath') {
        assert.equal(after.leviathan, null)
        assert.equal(after.enemyShots.length, 0)
        assert.equal(after.sceneId, 'A08.AFTER')
        cleared = frame
      }
      if (frame % 500 === 0)
        assert.deepEqual(after, b.snapshot, `desync at ${frame}`)
    }
    before = after
  }
  assert.ok(entered !== null, `${players} pilots reach the Eclipse Palace`)
  assert.ok(cleared !== null, `${players} pilots free the Prism Leviathan`)
  assert.deepEqual(
    checkpoints,
    ACT_EIGHT_CHECKPOINTS,
    'every Act VIII checkpoint',
  )
  assert.deepEqual([...phases].sort(), [1, 2, 3], 'every Leviathan phase')
  assert.equal(a.snapshot.guardians[8], 'defeated')
  const minutes = (cleared - entered + 1 + PALACE.aftermathFrames) / 3600
  if (players === 1) {
    for (const [what, count] of Object.entries(seen))
      assert.ok(count > 0, `the solo run saw a ${what}`)
    assert.ok(
      a.snapshot.captivesFreed >= PALACE_CAPTIVES / 2,
      `the solo demo frees ${a.snapshot.captivesFreed} of ${PALACE_CAPTIVES} captives`,
    )
    assert.ok(
      minutes >= 3.5 && minutes <= 7, // t-023's recut aims at 4-6 (10-15 before Silas's 2026-10-17 playtest)
      `a clean solo Act VIII takes ${minutes.toFixed(2)} minutes`,
    )
    assert.ok(bossFrames >= 30 * 60, 'the Leviathan is a real fight')
  }
  summary.push(
    `${players}p ${a.snapshot.captivesFreed}/${PALACE_CAPTIVES} freed, allies ${a.snapshot.allies.length}, ${minutes.toFixed(2)} min, B08 ${(bossFrames / 60).toFixed(0)}s`,
  )
  console.log(`  ${players}p: ${JSON.stringify(seen)}`)
}

console.log(
  `rainbow Eclipse Palace: ok (${summary.join('; ')}; director, legacy motifs, captives, council, Herald, Leviathan telegraphs)`,
)
