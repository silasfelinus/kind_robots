import assert from 'node:assert/strict'
import {
  CROWN_PLEA,
  ECLIPSE_CROWN,
  MOTHERLAND_FLAGSHIP,
  createEclipseCrownBoss,
  eclipseCrownWarning,
  stepEclipseCrownBoss,
} from '../arcade/games/rainbowEclipseCrown'
import {
  FINALE_ENDINGS,
  finaleEndingTitle,
  type FinaleChoice,
} from '../arcade/games/rainbowEclipseFinale'
import { existsSync } from 'node:fs'
import { RAINBOW_FLAGSHIP_ART } from '../arcade/games/rainbowGameArt'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-061 (PLOT-MOTHERLAND.md "Finale target"): the rebel road fights the Motherland flagship that
// holds the Eclipse Crown; the loyal road fights the Crown itself, with a late chance to stand down. Distinct fights,
// not retitled ones, and all six road endings reached by flown lanes.

const target = [{ x: 80, y: 135, lives: 1 }]

// The flagship's paintings, intact and battered (t-064), ship in both looks.
for (const look of ['', 'doodle/'])
  for (const path of [
    RAINBOW_FLAGSHIP_ART.path,
    RAINBOW_FLAGSHIP_ART.phase2.path,
  ])
    assert.ok(
      existsSync(
        new URL(
          `../../public/rainbow-princess-art/${look}${path}.webp`,
          import.meta.url,
        ),
      ),
      `${path} painting (${look || 'classic'})`,
    )
// Both paintings put their Crown near the prow, so it stays on the ring when they swap.
for (const art of [RAINBOW_FLAGSHIP_ART, RAINBOW_FLAGSHIP_ART.phase2]) {
  assert.ok(art.crownX > 0 && art.crownX < 0.12, `${art.path} Crown x`)
  assert.ok(art.crownY > 0.15 && art.crownY < 0.35, `${art.path} Crown y`)
}

// The flagship marks its lanes for the whole warning, then fires lances only down them; drones launch every other
// phase-1 volley; below half the clamps open and the clamp core drifts free.
{
  const boss = createEclipseCrownBoss(400, 'flagship')
  assert.equal(boss.target, 'flagship')
  assert.equal(boss.pleads, false, 'the flagship never pleads')
  let volleys = 0
  let launches = 0
  let warned = 0
  for (let i = 0; i < 1200; i++) {
    const shots = stepEclipseCrownBoss(boss, target)
    if (eclipseCrownWarning(boss)) warned++
    if (boss.launches.length) {
      launches++
      assert.equal(boss.launches.length, 2)
    }
    if (shots.length) {
      volleys++
      assert.ok(boss.lanes.length === 2)
      for (const shot of shots) {
        assert.ok(
          boss.lanes.includes(shot.y),
          'lances fly only down marked lanes',
        )
        assert.ok(shot.vx < 0 && shot.vy === 0)
      }
      assert.equal(
        new Set(shots.map((s) => s.y)).size,
        2,
        'two lanes, three stay clear',
      )
    }
  }
  assert.ok(
    volleys >= 8 && launches >= 4,
    `volleys ${volleys}, launches ${launches}`,
  )
  assert.ok(
    warned >= volleys * (ECLIPSE_CROWN.warningFrames - 1),
    'every volley is marked for its warning',
  )
  assert.ok(
    boss.heartX > boss.x,
    'the bridge tower sits aft of the clamped Crown',
  )
  boss.hp = boss.maxHp * ECLIPSE_CROWN.heartBreaksAt
  let fans = 0
  for (let i = 0; i < 900; i++) {
    const shots = stepEclipseCrownBoss(boss, target)
    if (shots.some((s) => s.vy !== 0)) fans++
  }
  assert.equal(boss.phase, 2)
  assert.ok(fans >= 4, 'phase 2 adds the aimed fan')
  assert.ok(MOTHERLAND_FLAGSHIP.lanes.length === 5)
}

// The loyal Crown pleads once, the moment its heart breaks loose: it holds fire for the whole plea, flags the frame
// the plea ends, and never pleads again. The unsworn Crown never pleads.
{
  const boss = createEclipseCrownBoss(400, 'crown', true)
  for (let i = 0; i < 400; i++) stepEclipseCrownBoss(boss, target)
  boss.hp = boss.maxHp * ECLIPSE_CROWN.heartBreaksAt
  let pleaFrames = 0
  let ended = 0
  for (let i = 0; i < CROWN_PLEA.frames + 400; i++) {
    const before = boss.plea
    const shots = stepEclipseCrownBoss(boss, target)
    if (before > 0 || boss.plea > 0) {
      pleaFrames++
      assert.equal(shots.length, 0, 'nothing fires while the Crown pleads')
    }
    if (boss.pleaEnded) ended++
  }
  assert.equal(ended, 1)
  assert.ok(pleaFrames >= CROWN_PLEA.frames)
  const unsworn = createEclipseCrownBoss(400, 'crown', false)
  unsworn.hp = unsworn.maxHp * ECLIPSE_CROWN.heartBreaksAt
  for (let i = 0; i < 200; i++) stepEclipseCrownBoss(unsworn, target)
  assert.equal(unsworn.plea, 0)
}

// Flown: real saves at Act IX, one per road, from the attract demo (one pilot turns on the empire, two stay the
// course), then flown again from that checkpoint by crews of one, two and three: the demo flies the fight and the
// lane of its crew size (one restores, two evacuate, three sever). A four-pilot loyal crew stands down.
function seeded(seed = 7) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const saves: Record<'rebel' | 'loyal', unknown> = { rebel: null, loyal: null }
for (const [players, road] of [
  [1, 'rebel'],
  [2, 'loyal'],
] as const) {
  const game = createRainbowPrincessPreview({
    players,
    demo: true,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
  })
  for (let frame = 0; frame < 400000 && game.snapshot.act !== 'S09'; frame++)
    game.update(emptyInput())
  for (
    let i = 0;
    i < 900 &&
    (game.save as { checkpoint?: { act?: number } } | undefined)?.checkpoint
      ?.act !== 9;
    i++
  )
    game.update(emptyInput())
  const save = JSON.parse(JSON.stringify(game.save)) as {
    checkpoint: { act: number; allegiance: string }
  }
  assert.equal(save.checkpoint.act, 9)
  assert.equal(save.checkpoint.allegiance, road)
  saves[road] = save
}

const CHOICES: FinaleChoice[] = ['restore', 'evacuate', 'sever']
const reached: string[] = []
for (const road of ['rebel', 'loyal'] as const)
  for (const players of [1, 2, 3, 4]) {
    if (road === 'rebel' && players === 4) continue
    const game = createRainbowPrincessPreview({
      players,
      demo: true,
      rng: seeded(11),
      sound: { play() {} },
      hiScore: 0,
      resume: saves[road],
      rainbowDemoResume: true,
    })
    for (let i = 0; i < 25; i++) game.update(emptyInput())
    const press = emptyInput()
    press.pressed.a = true
    game.update(press)
    assert.equal(game.snapshot.act, 'S09')
    assert.equal(game.snapshot.allegiance, road)
    let fought: string | null = null
    let pleaded = false
    let drones = 0
    for (let frame = 0; frame < 120000 && !game.over; frame++) {
      game.update(emptyInput())
      const s = game.snapshot
      if (s.crown) {
        fought ??= s.crown.target
        if (s.crown.plea > 0) pleaded = true
      }
      if (frame % 20 === 0)
        drones += s.enemies.filter((e) => e.kind === 'motherdrone').length
    }
    const s = game.snapshot
    const expected = CHOICES[(players - 1) % 3]!
    assert.ok(game.over, `${road} ${players}p reaches THE END`)
    assert.equal(s.stage, 'end')
    assert.equal(s.finalChoice, expected)
    if (road === 'rebel') {
      assert.equal(
        fought,
        'flagship',
        'the rebel road fights the Motherland flagship',
      )
      assert.ok(drones > 0, 'the flagship launches Motherland drones')
      assert.equal(pleaded, false)
      assert.equal(s.stoodDown, false)
    } else {
      assert.equal(fought, 'crown', 'the loyal road fights the Crown itself')
      assert.ok(pleaded, 'the Crown pleads on the loyal road')
      assert.equal(drones, 0)
      assert.equal(
        s.stoodDown,
        players === 4,
        'only a crew that flies high stands down',
      )
    }
    const endingRoad = s.stoodDown ? 'rebel' : road
    assert.equal(s.allegiance, endingRoad)
    assert.equal(
      finaleEndingTitle(expected, s.allegiance),
      FINALE_ENDINGS[endingRoad][expected].title,
    )
    reached.push(
      `${road}${s.stoodDown ? '→stood down' : ''} ${players}p ${expected}: ${FINALE_ENDINGS[endingRoad][expected].title}`,
    )
  }

// All six road endings were reached by flown lanes.
for (const road of ['rebel', 'loyal'] as const)
  for (const choice of CHOICES)
    assert.ok(
      reached.some((line) =>
        line.endsWith(`: ${FINALE_ENDINGS[road][choice].title}`),
      ),
      `${road} ${choice} reached`,
    )
console.log(reached.join('\n'))
console.log('rainbow finale roads: ok')
