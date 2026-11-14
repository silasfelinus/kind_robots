// Slime City lab store (conductor slime-city t-002): the BLOODRUSH clock runs
// fixed ticks, pausing freezes it exactly, plays land between ticks, and the
// whole session replays from its command record. Drives the real Pinia store
// with Node's mock timers.
import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { useSlimeCityStore } from '../../stores/slimeCity'
import { flagSquare, replayMatch, RUSH_TICK_MS } from '../slimeCity/prototypes'
// Slime City achievements are fired by this store (conductor slime-city t-060).
import './verifySlimeCityAchievements.test'

mock.timers.enable({ apis: ['setInterval'] })
setActivePinia(createPinia())
const lab = useSlimeCityStore()

const preferences = new Map<string, string>()
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => preferences.get(key) ?? null,
      setItem: (key: string, value: string) => {
        preferences.set(key, value)
      },
    },
  },
})
lab.setDefaultClashFormat('solo')
assert.equal(preferences.get('kr-slime-city-clash-format-v1'), 'solo')
lab.clashFormat = 'alliance'
lab.deckFormat = 'alliance'
lab.hydrateClashFormat()
assert.equal(lab.clashFormat, 'solo')
assert.equal(lab.deckFormat, 'solo')
preferences.set('kr-slime-city-clash-format-v1', 'invalid')
lab.hydrateClashFormat()
assert.equal(lab.clashFormat, 'solo', 'Invalid saved preferences are ignored')
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: {
      getItem: () => {
        throw new Error('storage blocked')
      },
      setItem: () => {
        throw new Error('storage blocked')
      },
    },
  },
})
assert.doesNotThrow(() => lab.hydrateClashFormat())
assert.doesNotThrow(() => lab.setDefaultClashFormat('alliance'))
assert.equal(lab.clashFormat, 'alliance')
delete (globalThis as { window?: unknown }).window

// Seeds: a fresh one per restart, the same one on request
assert.ok(lab.seed >= 100000 && lab.seed < 1000000)
lab.useSeed(424242)
assert.equal(lab.match.seed, 424242)
lab.reset(true)
assert.equal(lab.match.seed, 424242, 'SAME SEED keeps the seed')

// Legacy formats are retired from the game (Silas, 2026-11-08 PT: "we don't
// need the legacy modes, period"): choosing a format now deals Solo Clash.
// The legacy clock below stays covered until its engine is deleted.
lab.chooseMode('bloodrush')
assert.equal(lab.view, 'clash')
assert.equal(lab.clashLaunch.format, 'solo')
assert.equal(lab.clashLaunch.kind, 'practice')
// An abandoned City bout never inherits a practice result.
lab.bout = 'chimera'
lab.playClashFormat('alliance')
assert.equal(lab.bout, null)
assert.equal(lab.clashLaunch.format, 'alliance')
assert.equal(lab.clashSetup().options.alliance?.player.general, lab.activeTeam)
lab.mode = 'bloodrush'
lab.reset()
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
  (y) =>
    !lab.match.units.some((u) => u.x === 0 && u.y === y) &&
    !flagSquare(lab.match, 0, y),
)!
const card = lab.hand.find(
  (c) => c.kind === 'creature' && c.cost <= lab.match.mana,
)!
assert.ok(card, 'BLOODRUSH deals a hand with a creature in it')
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
const spell = lab.hand.find(
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
lab.mode = 'blackout'
lab.reset()
lab.useSeed(4817)
lab.toggleRush()
assert.equal(lab.running, false)
lab.nextRound()
assert.equal(lab.match.round, 2)
// Tapping a token opens its card; stance orders are the only board command.
const mine = lab.match.units.find((u) => u.side === 'player')
if (mine) {
  lab.touchSquare(mine.x, mine.y)
  assert.equal(lab.selectedUnit, mine.id)
  assert.equal(lab.inspectedUnit?.id, mine.id)
  lab.orderStance(mine.id, 'defend')
  assert.equal(lab.inspectedUnit?.stance, 'defend')
  lab.touchSquare(mine.x, mine.y)
  assert.equal(lab.selectedUnit, null, 'Tapping it again closes the card')
}
// Drag a card to the discard pile and take it back.
const tossed = lab.hand[0]!
lab.markHandDiscard(tossed.id)
assert.ok(lab.match.markedDiscards.player.includes(tossed.id))
lab.undoDiscard()
assert.equal(lab.match.markedDiscards.player.length, 0)
lab.dispose()
mock.timers.reset()
console.log(
  'Slime City store: fixed ticks, pause/resume, between-tick plays and replay PASS',
)
