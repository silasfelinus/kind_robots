import assert from 'node:assert/strict'
import {
  MOONJELLY,
  moonjellyDialogue,
  MOONJELLY_GUARDIAN,
  MOONJELLY_SECTIONS,
  MOONJELLY_WAVES,
  MOONJELLY_WAVE_SIZES,
  moonjellyScene,
  moonjellySpawns,
  moonjellyStage,
} from '../arcade/games/rainbowMoonjelly'
import { laneY } from '../arcade/games/rainbowFormations'
import {
  AURELIA_MAX_HP,
  createMoonjellyBoss,
  moonjellyBossWarning,
  stepMoonjellyBoss,
} from '../arcade/games/rainbowMoonjellyBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

assert.equal(moonjellyStage(0, null), 'opening')
assert.equal(moonjellyStage(300, null), 'waves')
assert.equal(moonjellyStage(MOONJELLY.turnStarts, null), 'turn')
assert.equal(moonjellyStage(MOONJELLY.turnEnds, null), 'remix')
assert.equal(moonjellyStage(MOONJELLY.approachStarts, null), 'approach')
assert.equal(moonjellyStage(MOONJELLY.bossStarts, null), 'boss')
assert.equal(moonjellyStage(5000, 4900), 'aftermath')
assert.deepEqual(moonjellySpawns(260), [], 'opening comms are a safe corridor')
assert.deepEqual(
  moonjellySpawns(330).map((spawn) => [spawn.kind, spawn.y]),
  [['lantern', laneY(0.5)]],
  'the gap lesson opens with one lantern',
)
assert.equal(moonjellySpawns(1560)[0]?.kind, 'relay')
assert.equal(moonjellySpawns(2760)[0]?.kind, 'skimmer')
assert.equal(moonjellySpawns(4260)[0]?.kind, 'coral')
assert.ok(
  moonjellySpawns(330)[0]!.wave >= MOONJELLY.waveBase,
  'Act II formations never share a school id with Act I',
)
assert.deepEqual(moonjellySpawns(MOONJELLY.turnStarts), [])
assert.deepEqual(moonjellySpawns(MOONJELLY.approachStarts), [])

// Authored formations: craft enter only in waves and remix, on the playfield, inside a section.
let actTwoCraft = 0
for (let frame = 0; frame < MOONJELLY.bossStarts + 600; frame++) {
  for (const spawn of moonjellySpawns(frame)) {
    actTwoCraft++
    const stage = moonjellyStage(frame, null)
    assert.ok(stage === 'waves' || stage === 'remix', `frame ${frame}`)
    assert.ok(spawn.y >= laneY(0) && spawn.y <= laneY(1))
    assert.ok(
      MOONJELLY_SECTIONS.some((s) => frame >= s.from && frame < s.to),
      `frame ${frame} sits in a section`,
    )
  }
}
assert.equal(
  actTwoCraft,
  MOONJELLY_WAVE_SIZES.reduce((sum, size) => sum + size, 0),
  'every Act II formation member spawns',
)
assert.ok(actTwoCraft >= 180, `Act II authors ${actTwoCraft} craft`)
for (const section of MOONJELLY_SECTIONS) {
  // The guardian holds its section alone; every other section is authored waves.
  assert.equal(
    MOONJELLY_WAVES.some((w) => w.at >= section.from && w.at < section.to),
    section.name !== MOONJELLY_GUARDIAN.name,
    `${section.name} ${section.name === MOONJELLY_GUARDIAN.name ? 'has no' : 'has'} waves`,
  )
}
// Nemi drifts in through a lane no formation crosses while she is on screen.
for (
  let frame = MOONJELLY.nemiAppears - 60;
  frame <= MOONJELLY.nemiAppears + 60;
  frame++
) {
  for (const spawn of moonjellySpawns(frame)) {
    assert.ok(Math.abs(spawn.y - 158) >= 30, `Nemi's lane clear at ${frame}`)
  }
}
assert.equal(moonjellyScene(0, null)?.id, 'A02.OPEN')
assert.equal(moonjellyScene(1500, null), null)
assert.equal(moonjellyScene(MOONJELLY.turnStarts, null)?.id, 'A02.TURN')
assert.equal(moonjellyScene(MOONJELLY.bossStarts, null), null)
assert.equal(moonjellyScene(5100, 5100)?.id, 'A02.AFTER')
assert.equal(moonjellyScene(5100 + MOONJELLY.aftermathFrames, 5100), null)

for (const players of [1, 2, 3, 4]) {
  for (const id of ['A02.OPEN', 'A02.TURN', 'A02.AFTER'] as const) {
    for (const saved of [false, true]) {
      for (const elapsed of [0, 96, 192]) {
        const line = moonjellyDialogue(id, elapsed, players, saved)
        assert.ok(line)
        assert.ok(line.text)
        assert.ok(
          line.speaker === 'Lilt-7' ||
            ['Maribel', 'Azure', 'Solenne', 'Vivi']
              .slice(0, players)
              .includes(line.speaker),
        )
      }
      assert.equal(moonjellyDialogue(id, 288, players, saved), null)
    }
  }
}

const boss = createMoonjellyBoss()
assert.equal(boss.hp, AURELIA_MAX_HP)
let warnedFrames = 0
let fired = 0
let attacksBeforeTelegraph = 0
let lastWarning = 0
for (let t = 0; t < 500; t++) {
  if (t === 180) boss.hp = 135
  if (t === 325) boss.hp = 65
  if (moonjellyBossWarning(boss)) {
    warnedFrames++
    lastWarning++
  }
  const next = stepMoonjellyBoss(boss, [{ x: 67, y: 136, lives: 2 }])
  if (next.length) {
    fired += next.length
    if (lastWarning < 36) attacksBeforeTelegraph++
    lastWarning = 0
    assert.ok(
      next.every((shot) => shot.vx < 0 && Math.hypot(shot.vx, shot.vy) <= 2.21),
    )
  }
}
assert.equal(boss.phase, 3)
assert.ok(warnedFrames > 70)
assert.ok(fired >= 12)
assert.equal(
  attacksBeforeTelegraph,
  0,
  'every boss volley has a 36-frame warning',
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
for (const players of [1, 4]) {
  const a = create(players)
  const b = create(players)
  const idle = emptyInput()
  let enteredTwo = false
  let sawMoonBoss = false
  let reachedClear = false
  let startingLives = 0
  // The demo clears both bosses near frame 72,500 with one pilot and 69,400 with four.
  for (let frame = 0; frame < 84000; frame++) {
    a.update(idle)
    b.update(idle)
    const snapshot = a.snapshot
    if (frame === 100) startingLives = a.lives
    if (snapshot.act === 'S02') enteredTwo = true
    if (snapshot.moonBoss) sawMoonBoss = true
    if (snapshot.act === 'S02' && snapshot.stage === 'aftermath')
      reachedClear = true
    if (frame % 200 === 0 || (reachedClear && frame % 50 === 0)) {
      assert.deepEqual(
        snapshot,
        b.snapshot,
        `desync with ${players} pilots at ${frame}`,
      )
    }
    assert.equal(
      a.lives,
      startingLives || a.lives,
      'autoplay cannot exhaust the crew',
    )
    if (reachedClear) break
  }
  assert.ok(
    enteredTwo,
    `${players} pilots reach Moonjelly without resetting lives`,
  )
  assert.ok(sawMoonBoss, `${players} pilots reach the Aurelia Array`)
  assert.ok(reachedClear, `${players} pilots can clear the second boss`)
  assert.equal(a.level, 2)
  assert.equal(a.snapshot.act, 'S02')
  assert.equal(a.snapshot.moonBoss, null)
  assert.ok(
    a.snapshot.defeatedAt !== null,
    'Pearl Seahorse remains marked defeated',
  )
  assert.equal(a.lives, players * 3)
}
console.log(
  'Rainbow Moonjelly two-Act transitions, boss telegraphs and replay passed',
)
