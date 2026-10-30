// Slime City lab store (conductor slime-city t-002): the BLOODRUSH clock runs
// fixed ticks, pausing freezes it exactly, plays land between ticks, and the
// whole session replays from its command record. Drives the real Pinia store
// with Node's mock timers.
import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { useSlimeCityStore } from '../../stores/slimeCity'
import { replayMatch, RUSH_TICK_MS } from '../slimeCity/prototypes'

mock.timers.enable({ apis: ['setInterval'] })
setActivePinia(createPinia())
const lab = useSlimeCityStore()

// Seeds: a fresh one per restart, the same one on request
assert.ok(lab.seed >= 100000 && lab.seed < 1000000)
lab.useSeed(424242)
assert.equal(lab.match.seed, 424242)
lab.reset(true)
assert.equal(lab.match.seed, 424242, 'SAME SEED keeps the seed')

// The how-to-play panel opens the first time each format is chosen
lab.chooseMode('bloodrush')
assert.equal(lab.guideOpen, true)
assert.ok(lab.guide.steps.length >= 4)
lab.closeGuide()
lab.chooseMode('gridiron')
assert.equal(lab.guideOpen, true)
lab.closeGuide()
lab.chooseMode('bloodrush')
assert.equal(lab.guideOpen, false, 'Shown once per format')
lab.useSeed(9001)

// Fixed ticks while running
assert.equal(lab.match.round, 1)
lab.toggleRush()
assert.equal(lab.running, true)
mock.timers.tick(RUSH_TICK_MS * 3)
assert.equal(lab.match.round, 4, 'One tick per interval')

// Pause freezes the clock exactly
lab.toggleRush()
assert.equal(lab.running, false)
const frozen = JSON.stringify(lab.match)
mock.timers.tick(RUSH_TICK_MS * 10)
assert.equal(JSON.stringify(lab.match), frozen, 'Paused: nothing advances')

// A between-tick play while paused lands before the next tick
const open = [0, 1, 2, 3, 4, 5].find(
  (y) => !lab.match.units.some((u) => u.x === 0 && u.y === y),
)!
const card = lab.cards.find(
  (c) => c.kind === 'creature' && c.cost <= lab.match.mana,
)!
lab.chooseCard(card.id)
lab.touchSquare(0, open)
assert.ok(
  lab.match.units.some((u) => u.side === 'player' && u.x === 0 && u.y === open),
)
assert.equal(lab.match.round, 4, 'Deploying does not tick the clock')

// Resume continues from the same tick, and a play while running also lands
lab.toggleRush()
mock.timers.tick(RUSH_TICK_MS)
assert.equal(lab.match.round, 5)
const spell = lab.cards.find(
  (c) => c.kind !== 'creature' && c.cost <= lab.match.mana && lab.ready(c.id),
)
if (spell) lab.chooseCard(spell.id)
mock.timers.tick(RUSH_TICK_MS * 2)
assert.equal(lab.match.round, 7)

// Opening the guide pauses a running clock
lab.openGuide()
assert.equal(lab.running, false)
const atGuide = lab.match.round
mock.timers.tick(RUSH_TICK_MS * 5)
assert.equal(lab.match.round, atGuide)
lab.closeGuide()

// The whole session, pauses included, replays from its commands
assert.deepEqual(
  replayMatch(
    {
      mode: 'bloodrush',
      teamId: lab.activeTeam,
      foeId: lab.match.foeId,
      seed: lab.match.seed,
    },
    lab.match.commands,
  ),
  JSON.parse(JSON.stringify(lab.match)),
)

// Running to the end stops the clock by itself
lab.toggleRush()
mock.timers.tick(RUSH_TICK_MS * 400)
assert.ok(lab.match.victor)
assert.equal(lab.running, false)
const ended = lab.match.round
mock.timers.tick(RUSH_TICK_MS * 5)
assert.equal(lab.match.round, ended)

// Turn formats ignore the clock and advance only on END ROUND
lab.chooseMode('blackout')
lab.closeGuide()
lab.useSeed(4817)
lab.toggleRush()
assert.equal(lab.running, false)
lab.nextRound()
assert.equal(lab.match.round, 2)
// Selecting a fighter keeps it selected while it has AP left
const mine = lab.match.units.find((u) => u.side === 'player' && u.maxAp >= 2)
if (mine) {
  lab.touchSquare(mine.x, mine.y)
  assert.equal(lab.selectedUnit, mine.id)
}
lab.dispose()
mock.timers.reset()
console.log(
  'Slime City store: fixed ticks, pause/resume, between-tick plays and replay PASS',
)
