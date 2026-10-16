import assert from 'node:assert/strict'
import { MOONJELLY } from '../arcade/games/rainbowMoonjelly'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput, type InputFrame } from '../arcade/types'

// Conductor rainbow t-021: Nemi's rescue and missed beacon, earned through ordinary input. Pilots fly
// Act I and into Act II with real inputs (no demo immortality, no snapshot edits), spending continues
// where they fall. Nemi and the A02.TURN branch line are observed through the real renderer. Only a
// living, seated pilot can bring Nemi aboard: a fallen pilot lying in her lane or a benched seat parked
// there lets her drift past. This is isolated engine and renderer evidence, not cabinet or device proof.

const NEMI_LANE = 158
const NEMI_SPEED = 0.95
const NEMI_LIFETIME = Math.ceil((480 + 16 + 16) / NEMI_SPEED)
const RESCUED_LINE = 'Nemi is aboard.'
const MISSED_LINE = 'We lost the Nemi beacon.'

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function recordingCanvas() {
  const texts: string[] = []
  const g = new Proxy({} as Record<string | symbol, unknown>, {
    get(target, key) {
      if (key === 'fillText')
        return (text: string) => {
          texts.push(String(text))
        }
      if (key === 'measureText')
        return (text: string) => ({ width: String(text).length * 5 })
      if (key in target) return target[key]
      return () => ({ addColorStop() {} })
    },
    set(target, key, value) {
      target[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { g, texts }
}

type Game = ReturnType<typeof createRainbowPrincessPreview>
type Snapshot = Game['snapshot']

function steer(
  input: InputFrame,
  ship: { x: number; y: number },
  x: number,
  y: number,
) {
  input.held.up = ship.y > y + 2
  input.held.down = ship.y < y - 2
  input.held.left = ship.x > x + 2
  input.held.right = ship.x < x - 2
}

const inNemiWindow = (s: Snapshot) =>
  s.act === 'S02' &&
  s.actTwoFrame >= MOONJELLY.nemiAppears - 60 &&
  s.actTwoFrame < MOONJELLY.nemiAppears + NEMI_LIFETIME + 60

/** Fly firing lanes; at a boss hold its line and slip aside before a volley. `avoid` keeps off Nemi's lane. */
function lanes(s: Snapshot, seat: number, frame: number, avoid: boolean) {
  const input = emptyInput()
  const ship = s.ships[seat]
  if (!ship) return input
  input.held.a = true
  const boss = s.boss ?? s.moonBoss
  if (boss) {
    const next = 'nextVolleyAt' in boss ? boss.nextVolleyAt : boss.nextVolley
    const due = next - boss.frame
    steer(input, ship, 110, boss.y + (due < 30 ? (seat % 2 ? 46 : -46) : 0))
  } else {
    const options = avoid ? [206, 236] : [70, 140, 210]
    steer(
      input,
      ship,
      90,
      options[(Math.floor(frame / 240) + seat) % options.length]!,
    )
  }
  return input
}

/** Outside boss fights, steer for the lane farthest from the hazards about to arrive. */
function dodge(s: Snapshot, seat: number, avoid: boolean) {
  const ship = s.ships[seat]
  if (!ship || s.boss || s.moonBoss) return lanes(s, seat, 0, avoid)
  const input = emptyInput()
  input.held.a = true
  const ahead = [...s.enemies, ...s.enemyShots].filter(
    (hazard) => hazard.x > ship.x - 16 && hazard.x < ship.x + 110,
  )
  let best = ship.y
  let bestScore = -Infinity
  for (let y = 50; y <= 236; y += 8) {
    // Keep to the side of Nemi's lane the ship is on, so it never crosses her path.
    if (avoid && (ship.y < NEMI_LANE ? y > NEMI_LANE - 40 : y < NEMI_LANE + 40))
      continue
    const room = Math.min(60, ...ahead.map((hazard) => Math.abs(hazard.y - y)))
    const score = room - Math.abs(y - ship.y) * 0.05
    if (score > bestScore) {
      bestScore = score
      best = y
    }
  }
  steer(input, ship, 60, best)
  return input
}

type Watch = {
  /** Act II frames on which the renderer drew Nemi, per pass through her window. */
  nemiDrawn: number[]
  rescueFrame: number | null
  turnLines: Set<string>
}

function fly(
  players: number,
  policy: (s: Snapshot, frame: number) => InputFrame[],
  onFrame: (
    game: Game,
    before: Snapshot,
    after: Snapshot,
    watch: Watch,
  ) => boolean,
) {
  const game = createRainbowPrincessPreview({
    players,
    demo: false,
    rng: seeded(1234),
    sound: { play() {} },
    hiScore: 0,
  })
  const { g, texts } = recordingCanvas()
  const watch: Watch = {
    nemiDrawn: [],
    rescueFrame: null,
    turnLines: new Set(),
  }
  for (let frame = 0; frame < 90000; frame++) {
    const before = game.snapshot
    if (before.continueLeft > 0) {
      const input = emptyInput()
      input.pressed.a = before.continueLeft < 500
      game.update(input)
      continue
    }
    const inputs = policy(before, frame)
    game.update(inputs[0]!, inputs)
    const after = game.snapshot
    texts.length = 0
    game.render(g)
    if (after.act === 'S02') {
      if (texts.includes('NEMI')) watch.nemiDrawn.push(after.actTwoFrame)
      if (after.sceneId === 'A02.TURN') {
        for (const line of [RESCUED_LINE, MISSED_LINE]) {
          if (texts.some((text) => text.includes(line)))
            watch.turnLines.add(line)
        }
      }
    }
    if (!before.rescuedNemi && after.rescuedNemi) {
      watch.rescueFrame = after.actTwoFrame
      assert.ok(!texts.includes('NEMI'), 'Nemi leaves the field once aboard')
      assert.ok(after.score >= before.score + 750, 'the rescue scores 750')
      for (const [seat, ship] of after.ships.entries()) {
        assert.ok(
          ship.charge >= Math.min(100, before.ships[seat]!.charge + 20),
          `seat ${seat + 1} gains the rescue charge`,
        )
      }
    }
    if (onFrame(game, before, after, watch)) return { game, watch }
  }
  assert.fail(`${players}-pilot Nemi scenario did not finish`)
}

const turnDone = (s: Snapshot) =>
  s.act === 'S02' && s.actTwoFrame >= MOONJELLY.turnStarts + 100

// 1. Rescue: a living pilot waits on Nemi's lane; her charge reward reaches the crew and the turn
// comms say she is aboard.
{
  const { game, watch } = fly(
    1,
    (s, frame) => {
      if (!inNemiWindow(s)) return [lanes(s, 0, frame, false)]
      const input = emptyInput()
      input.held.a = true
      steer(input, s.ships[0]!, 90, NEMI_LANE)
      return [input]
    },
    (_game, _before, after) => turnDone(after),
  )
  assert.ok(watch.rescueFrame !== null, 'the pilot brought Nemi aboard')
  assert.ok(watch.rescueFrame >= MOONJELLY.nemiAppears)
  assert.equal(game.snapshot.rescuedNemi, true)
  assert.ok(watch.turnLines.has(RESCUED_LINE))
  assert.ok(!watch.turnLines.has(MISSED_LINE))
}

// 2. Missed beacon: the pilot keeps off Nemi's lane; she drifts the whole width and expires, no reward
// lands, and the turn comms mourn the beacon.
{
  const { game, watch } = fly(
    1,
    (s, frame) => [lanes(s, 0, frame, inNemiWindow(s))],
    (_game, _before, after) => turnDone(after),
  )
  assert.equal(watch.rescueFrame, null)
  assert.equal(game.snapshot.rescuedNemi, false)
  assert.ok(
    watch.nemiDrawn.length >= NEMI_LIFETIME - 2,
    `Nemi crossed the field (${watch.nemiDrawn.length} drawn frames)`,
  )
  assert.ok(watch.turnLines.has(MISSED_LINE))
  assert.ok(!watch.turnLines.has(RESCUED_LINE))
}

// 3. A fallen pilot in Nemi's lane cannot rescue her. Pilot 2 rams craft and shots in Act II until one hit
// is left, then holds her lane and meets whatever crosses it for the last; pilot 1 dodges clear so the crew
// never needs a continue. Nemi drifts over the wreck.
{
  let wreck: { x: number; y: number } | null = null
  let missedOverWreck = false
  fly(
    2,
    (s, frame) => {
      const inputs = [dodge(s, 0, inNemiWindow(s)), lanes(s, 1, frame, false)]
      if (s.act === 'S02' && s.actTwoFrame >= 300 && s.ships[1]!.lives > 0) {
        const ram = emptyInput()
        const ship = s.ships[1]!
        const prey = [...s.enemies, ...s.enemyShots]
          .filter((hazard) => hazard.x > 40 && hazard.x < 300)
          .sort((a, b) => a.x - b.x)[0]
        if (!(ship.lives === 1 && ship.shield === 1) && prey)
          steer(ram, ship, prey.x, prey.y)
        else {
          // One hit left: hold Nemi's lane and meet whatever crosses it, so the last hit lands there.
          const crossing = [...s.enemies, ...s.enemyShots]
            .filter((hazard) => Math.abs(hazard.y - NEMI_LANE) < 20)
            .sort((a, b) => a.x - b.x)[0]
          steer(ram, ship, crossing ? Math.max(40, crossing.x) : 140, NEMI_LANE)
        }
        inputs[1] = ram
      }
      return inputs
    },
    (_game, before, after, watch) => {
      if (
        after.act === 'S02' &&
        after.actTwoFrame === MOONJELLY.nemiAppears &&
        after.ships[1]!.lives <= 0
      ) {
        wreck = { x: after.ships[1]!.x, y: after.ships[1]!.y }
        watch.nemiDrawn.length = 0
      }
      if (
        wreck &&
        after.actTwoFrame === MOONJELLY.nemiAppears + NEMI_LIFETIME + 10
      ) {
        assert.equal(after.ships[1]!.lives, 0, 'pilot 2 stayed down')
        assert.equal(after.ships[1]!.x, wreck.x, 'a fallen ship does not move')
        assert.ok(
          Math.abs(wreck.y - NEMI_LANE) < 24,
          "the wreck lies in Nemi's lane",
        )
        assert.ok(
          watch.nemiDrawn.length >= NEMI_LIFETIME - 2,
          `Nemi drifted over the wreck (${watch.nemiDrawn.length} of ${NEMI_LIFETIME} frames)`,
        )
        assert.equal(after.rescuedNemi, false, 'a fallen pilot cannot rescue')
        missedOverWreck = true
        return true
      }
      return before.act === 'S02' && before.actTwoFrame > MOONJELLY.turnStarts
    },
  )
  assert.ok(missedOverWreck, "pilot 2 fell in Nemi's lane before she arrived")
}

// 4. A benched seat parked in Nemi's lane cannot rescue her, and when it rejoins it has gained nothing.
{
  let bench: { y: number; charge: number } | null = null
  let rejoined = false
  fly(
    2,
    (s, frame) => {
      const inputs = [
        lanes(s, 0, frame, inNemiWindow(s)),
        lanes(s, 1, frame, false),
      ]
      if (s.act === 'S02' && s.actTwoFrame >= 1400 && s.ships[1]) {
        const park = emptyInput()
        park.held.a = true
        steer(park, s.ships[1], 140, NEMI_LANE)
        inputs[1] = park
      }
      return inputs
    },
    (game, _before, after, watch) => {
      if (after.act !== 'S02') return false
      if (
        after.actTwoFrame === MOONJELLY.nemiAppears - 20 &&
        after.activePlayers === 2
      ) {
        bench = { y: after.ships[1]!.y, charge: after.ships[1]!.charge }
        game.setPlayers!(1)
        watch.nemiDrawn.length = 0
      }
      if (
        bench &&
        after.actTwoFrame === MOONJELLY.nemiAppears + NEMI_LIFETIME + 10
      ) {
        assert.equal(after.activePlayers, 1)
        assert.ok(
          Math.abs(bench.y - NEMI_LANE) < 24,
          "the benched ship sits in Nemi's lane",
        )
        assert.ok(
          watch.nemiDrawn.length >= NEMI_LIFETIME - 2,
          'Nemi drifted past the bench',
        )
        assert.equal(after.rescuedNemi, false, 'a benched seat cannot rescue')
        game.setPlayers!(2)
        assert.equal(game.snapshot.activePlayers, 2)
        assert.equal(
          game.snapshot.ships[1]!.charge,
          bench.charge,
          'the benched seat rejoins with the charge it left with',
        )
        rejoined = true
        return true
      }
      return false
    },
  )
  assert.ok(rejoined, 'pilot 2 was benched before Nemi arrived and rejoined')
}

console.log(
  'rainbow Nemi rescue: ok (rescued, missed, fallen-in-lane and benched seats)',
)
