import assert from 'node:assert/strict'
import { resumeTick } from '../arcade/games/rainbowCheckpoints'
import {
  ECLIPSE_CROWN,
  ECLIPSE_CROWN_MAX_HP,
  ECLIPSE_ESCAPE,
  createEclipseCrownBoss,
  eclipseCrownSpokes,
  eclipseCrownWarning,
  eclipseEscapeGapHalf,
  eclipseEscapeGapY,
  eclipseEscapeWall,
  stepEclipseCrownBoss,
} from '../arcade/games/rainbowEclipseCrown'
import {
  FINALE,
  FINALE_ENDING_FRAMES,
  FINALE_LANES,
  finaleChoiceFor,
  finaleCredits,
  finaleDialogue,
  finaleRescues,
  finaleScene,
  finaleStage,
  type FinaleChoice,
  type FinaleFlags,
  type FinaleSceneId,
} from '../arcade/games/rainbowEclipseFinale'
import { PALACE } from '../arcade/games/rainbowEclipsePalace'
import { rainbowBossHp } from '../arcade/games/rainbowPinkwakeBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-009: the finale, the Eclipse Crown (S09). B09's two fighting phases (spokes marked for
// the full warning with wide wedges, then the drifting heart), the final choice flown by the crew, the escape
// through narrowing prism corridors (always passable), the composed ending from the choice and the six rescue
// flags, the credits that name the rescued, THE END, and a whole campaign played from Act I to the last card.

// The director.
assert.equal(finaleStage(0, null, null, null), 'opening')
assert.equal(finaleStage(FINALE.openingEnds, null, null, null), 'halo')
assert.equal(finaleStage(FINALE.bossStarts, null, null, null), 'boss')
assert.equal(finaleStage(5000, 10, null, null), 'choice')
assert.equal(finaleStage(5000, null, 10, null), 'escape')
assert.equal(finaleStage(5000, null, null, 10), 'ending')
assert.equal(
  finaleStage(5000, null, null, FINALE_ENDING_FRAMES + 10),
  'credits',
)
assert.equal(
  finaleStage(5000, null, null, FINALE_ENDING_FRAMES + FINALE.creditFrames),
  'end',
)
assert.equal(finaleChoiceFor([FINALE_LANES.restore]), 'restore')
assert.equal(finaleChoiceFor([FINALE_LANES.evacuate]), 'evacuate')
assert.equal(finaleChoiceFor([FINALE_LANES.sever]), 'sever')
assert.equal(finaleChoiceFor([60, 200, 200]), 'sever', 'most pilots win')
assert.equal(finaleChoiceFor([60, 200]), 'restore', 'a tie goes to the lead')
assert.equal(finaleChoiceFor([200, 135, 60]), 'sever')
const none: FinaleFlags = {
  rescuedNemi: false,
  securedSalvage: false,
  rescuedCourier: false,
  freedDepot: false,
  stoppedRelay: false,
  rescuedNavigator: false,
  captivesFreed: 0,
}
const every: FinaleFlags = {
  rescuedNemi: true,
  securedSalvage: true,
  rescuedCourier: true,
  freedDepot: true,
  stoppedRelay: true,
  rescuedNavigator: true,
  captivesFreed: 20,
}
assert.equal(finaleRescues(none), 0)
assert.equal(finaleRescues(every), 6)
// COMMS bible S09: the Crown's voice and Lilt's answer open the finale.
assert.equal(finaleDialogue('A09.OPEN', 0, 1)!.speaker, 'Crown Voice')
assert.match(finaleDialogue('A09.OPEN', 0, 1)!.text, /keep them safe/)
assert.equal(
  finaleDialogue('A09.OPEN', FINALE.lineFrames, 1)!.text,
  'Yes. Not to keep them still.',
)
// Every crew and every choice resolves every scene line, with no absent speaker.
const lineCounts: Record<FinaleSceneId, number> = {
  'A09.OPEN': 3,
  'A09.TURN': 3,
  'A09.ESCAPE': 2,
  'A09.AFTER': 5,
}
const endings = new Set<string>()
for (const players of [1, 2, 3, 4])
  for (const flags of [none, every])
    for (const choice of ['restore', 'evacuate', 'sever'] as FinaleChoice[])
      for (const [id, lines] of Object.entries(lineCounts) as Array<
        [FinaleSceneId, number]
      >) {
        const frames =
          id === 'A09.AFTER' ? FINALE.endingLineFrames : FINALE.lineFrames
        for (let line = 0; line < lines; line++) {
          const said = finaleDialogue(id, line * frames, players, flags, choice)
          assert.ok(said && said.speaker && said.text, `${id} line ${line + 1}`)
          assert.ok(
            !['Maribel', 'Azure', 'Solenne', 'Vivi']
              .slice(players)
              .includes(said.speaker),
            `${id}: no absent pilot speaks`,
          )
          if (id === 'A09.AFTER') endings.add(said.text)
        }
        assert.equal(
          finaleDialogue(id, lines * frames, players, flags, choice),
          null,
        )
      }
// Three world consequences, the rescue lines, Lilt, four crew epilogues and the send-off.
assert.ok(endings.size >= 11, `${endings.size} distinct ending lines`)
assert.equal(finaleScene(FINALE.bossStarts + 10, 0, null, null)?.id, 'A09.TURN')
assert.equal(finaleScene(9000, null, 0, null)?.id, 'A09.ESCAPE')
assert.equal(finaleScene(9000, null, null, 0)?.id, 'A09.AFTER')
assert.ok(FINALE.choiceFrames >= 3 * FINALE.lineFrames + 120)
// The credits name the crew and the rescued, and anonymous rescuers too.
const credits = finaleCredits(every, 4, 'restore')
for (const name of [
  'MARIBEL',
  'AZURE',
  'SOLENNE',
  'VIVI',
  'The Lost Navigator',
])
  assert.ok(credits.includes(name), name)
assert.ok(credits.includes('Every rescuer who was never named'))
assert.ok(credits.includes('THE CHOICE: RESTORE'))
assert.ok(!finaleCredits(none, 1, 'sever').includes('AZURE'))
assert.equal(
  resumeTick(
    { act: 9, frame: 600 },
    100,
    5000,
    9000,
    20000,
    30000,
    40000,
    50000,
    60000,
  ),
  60599,
)

// B09: spokes marked for the full warning with wide wedges; below half, the heart drifts free.
{
  const target = { x: 80, y: 135, lives: 1 }
  const boss = createEclipseCrownBoss(400)
  let warned = 0
  let volleys = 0
  let lastAngle: number | null = null
  for (let i = 0; i < 700; i++) {
    if (eclipseCrownWarning(boss)) warned++
    const spokes = eclipseCrownSpokes(boss)
    const shots = stepEclipseCrownBoss(boss, [target])
    if (!shots.length) continue
    assert.ok(warned >= ECLIPSE_CROWN.warningFrames, 'a full warning')
    warned = 0
    volleys++
    for (const shot of shots) {
      const angle = Math.atan2(shot.vy, shot.vx)
      assert.ok(
        spokes.some(
          (spoke) =>
            Math.abs(
              Math.atan2(Math.sin(angle - spoke), Math.cos(angle - spoke)),
            ) < 1e-6,
        ),
        'every pellet flies a marked spoke',
      )
    }
    if (lastAngle !== null)
      assert.notEqual(boss.spokeAngle, lastAngle, 'the spokes turn')
    lastAngle = boss.spokeAngle
  }
  assert.ok(volleys >= 4)
  assert.ok((Math.PI * 2) / ECLIPSE_CROWN.spokes >= Math.PI / 3, 'wide wedges')
  boss.hp = 150
  let moved = 0
  let fired = 0
  warned = 0
  for (let i = 0; i < 700; i++) {
    const was = { x: boss.heartX, y: boss.heartY }
    if (eclipseCrownWarning(boss)) warned++
    const shots = stepEclipseCrownBoss(boss, [target])
    if (Math.hypot(boss.heartX - was.x, boss.heartY - was.y) > 0.1) moved++
    if (shots.length) {
      assert.ok(warned >= ECLIPSE_CROWN.warningFrames)
      warned = 0
      fired++
    }
  }
  assert.equal(boss.phase, 2)
  assert.ok(moved > 600, 'the heart keeps drifting')
  assert.ok(fired >= 4)
  assert.ok(
    Math.hypot(boss.heartX - boss.x, boss.heartY - boss.y) > 20,
    'the heart has left the crown',
  )
}

// The escape: every prism wall leaves one gap a ship fits through, the gaps narrow, and consecutive gaps
// are close enough to fly between.
{
  let walls = 0
  let lastGap: number | null = null
  for (let f = 0; f < ECLIPSE_ESCAPE.frames; f++) {
    const wall = eclipseEscapeWall(f)
    if (!wall.length) continue
    walls++
    const gap = eclipseEscapeGapY(f)
    const half = eclipseEscapeGapHalf(f)
    assert.ok(half >= ECLIPSE_ESCAPE.minGapHalf)
    assert.ok(gap - half >= 34 && gap + half <= 250, 'the gap is on screen')
    assert.ok(
      wall.every((shot) => Math.abs(shot.y - gap) >= half),
      'the gap is open',
    )
    if (lastGap !== null)
      assert.ok(
        Math.abs(gap - lastGap) <=
          (ECLIPSE_ESCAPE.wallEvery / ECLIPSE_ESCAPE.wallSpeed) * 2.5,
        'a ship can reach the next gap in time',
      )
    lastGap = gap
  }
  assert.ok(walls >= 25)
  assert.ok(
    eclipseEscapeGapHalf(ECLIPSE_ESCAPE.frames) < eclipseEscapeGapHalf(0) - 15,
    'the corridors narrow',
  )
}

// The whole campaign: the demo plays from Act I to THE END for one, two and three pilots, the Crown falls,
// each crew makes its own choice, the escape is flown, and the run closes on the last card.
function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const summary: string[] = []
for (const [players, expected] of [
  [1, 'restore'],
  [2, 'evacuate'],
  [3, 'sever'],
] as const) {
  const game = createRainbowPrincessPreview({
    players,
    demo: true,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
  })
  let before = game.snapshot
  let entered: number | null = null
  let subdued: number | null = null
  let ended: number | null = null
  let creditsSeen = false
  let escapeHits = 0
  for (let frame = 0; frame < 420000 && !game.over; frame++) {
    game.update(emptyInput())
    const after = game.snapshot
    if (after.act === 'S09') {
      if (entered === null) {
        entered = frame
        assert.equal(before.act, 'S08')
        assert.ok(before.actEightFrame >= PALACE.bossStarts)
        assert.equal(game.level, 9)
      }
      if (after.crown)
        assert.equal(
          after.crown.maxHp,
          rainbowBossHp(ECLIPSE_CROWN_MAX_HP, players),
        )
      if (after.choiceFrame !== null && subdued === null) {
        subdued = frame
        assert.equal(after.crown, null)
        assert.equal(after.enemyShots.length, 0, 'the Crown falls silent')
      }
      if (after.choiceFrame !== null)
        for (const ship of after.ships.slice(0, players))
          assert.ok(
            ship.invulnerable > 0,
            'nothing can hurt the crew mid-choice',
          )
      if (after.escapeFrame !== null) {
        assert.equal(after.finalChoice, expected)
        for (const [seat, ship] of after.ships.slice(0, players).entries())
          if (
            ship.shield < before.ships[seat]!.shield ||
            ship.lives < before.ships[seat]!.lives
          )
            escapeHits++
      }
      if (after.stage === 'credits') creditsSeen = true
      if (after.endingFrame !== null && ended === null) {
        ended = frame
        assert.equal(after.sceneId, 'A09.AFTER')
      }
    }
    before = after
  }
  assert.ok(game.over, `${players} pilots reach THE END`)
  assert.ok(entered !== null && subdued !== null && ended !== null)
  assert.ok(creditsSeen, 'the credits roll')
  assert.equal(game.snapshot.stage, 'end')
  assert.equal(game.snapshot.finalChoice, expected)
  const fight = (subdued - entered) / 3600
  assert.ok(
    fight >= 2 && fight <= 8,
    `the Crown fight takes ${fight.toFixed(2)} min`,
  )
  summary.push(
    `${players}p ${expected}: Crown ${fight.toFixed(2)} min, escape hits ${escapeHits}`,
  )
}

console.log(
  `rainbow finale: ok (${summary.join('; ')}; spokes, heart, choice, escape corridors, endings, credits, THE END)`,
)
