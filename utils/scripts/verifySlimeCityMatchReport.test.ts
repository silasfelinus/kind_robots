// Silas, 2026-11-11 PT: "We need an actual reward screen which shows the meat
// earned after a match. Even losing should earn some, but winning is more,
// with benefits for not taking damage. Notice and comment on oddities (no
// level threes played, fast game, close call, etc)".
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { clashBossCap, type ClashState } from '../slimeCity/clash'
import { clashOutcome } from '../slimeCity/clashRewards'
import {
  MATCH_BASE_MEAT,
  MATCH_FLAWLESS_MEAT,
  MATCH_LIFE_KEPT_MEAT,
  clashMatchReport,
  reportMeat,
} from '../slimeCity/matchReport'
import {
  DAILY_PAID_BATTLES,
  awardOutcome,
  newProgression,
} from '../slimeCity/progression'
import { playClashCpuGame } from './slimeCityClashBalanceReport'

const base = playClashCpuGame('riot', 'undertow', 7)
assert.ok(base.victor, 'a CPU game finishes')
const max = clashBossCap(base, 'player')
const rivalMax = clashBossCap(base, 'enemy')
const shaped = (patch: Partial<ClashState>): ClashState => ({
  ...base,
  ...patch,
})

// A win pays the most; keeping boss life pays more; flawless pays extra.
const flawless = clashMatchReport(
  shaped({ victor: 'player', boss: { player: max, enemy: 0 }, round: 9 }),
)
assert.equal(
  reportMeat(flawless),
  MATCH_BASE_MEAT.win +
    MATCH_LIFE_KEPT_MEAT +
    MATCH_FLAWLESS_MEAT +
    flawless.meat.find((l) => l.label.startsWith('Knockouts'))!.meat,
)
assert.ok(flawless.notes.some((n) => n.startsWith('Flawless')))

const scraped = clashMatchReport(
  shaped({ victor: 'player', boss: { player: 2, enemy: 0 }, round: 9 }),
)
assert.ok(scraped.notes.some((n) => n.startsWith('Close call')))
assert.ok(reportMeat(scraped) < reportMeat(flawless), 'damage costs Meat')

// Even a loss pays, and more for damage dealt.
const crushed = clashMatchReport(
  shaped({
    victor: 'enemy',
    boss: { player: 0, enemy: rivalMax },
    round: 9,
    fallen: { player: [], enemy: [] },
  }),
)
assert.equal(reportMeat(crushed), MATCH_BASE_MEAT.loss)
assert.ok(crushed.notes.includes('Their boss never took a hit.'))
const narrow = clashMatchReport(
  shaped({ victor: 'enemy', boss: { player: 0, enemy: 3 }, round: 9 }),
)
assert.ok(reportMeat(narrow) > reportMeat(crushed))
assert.ok(narrow.notes.some((n) => n.startsWith('So close')))
assert.ok(reportMeat(scraped) > reportMeat(narrow), 'winning beats any loss')

// Oddities: fast, long, no level threes, no power, no knockouts.
assert.ok(
  clashMatchReport(shaped({ round: 5 })).notes.some((n) =>
    n.startsWith('Fast game'),
  ),
)
assert.ok(
  clashMatchReport(shaped({ round: 14 })).notes.some((n) =>
    n.startsWith('Long haul'),
  ),
)
const plain = clashMatchReport(
  shaped({
    levels: { player: { a: 1, b: 2 }, enemy: {} },
    powersUsed: { player: [], enemy: [] },
    fallen: { player: [], enemy: [] },
  }),
)
assert.ok(plain.notes.includes('No level-three evolutions played.'))
assert.ok(plain.notes.includes('Your faction power never fired.'))
assert.ok(plain.notes.some((n) => n.startsWith('No knockouts')))
assert.ok(
  clashMatchReport(
    shaped({ levels: { player: { a: 3, b: 3, c: 3 }, enemy: {} } }),
  ).notes.some((n) => n.startsWith('Evolution engine')),
)

// The server pays exactly the report: clashOutcome carries it, the daily cap
// still applies, and a replayed receipt never pays twice.
const now = new Date('2026-11-11T12:00:00Z')
const outcome = clashOutcome('m-report', base)
assert.equal(outcome.meat, reportMeat(clashMatchReport(base)))
const fresh = newProgression(now)
const paid = awardOutcome(fresh, outcome, now)
assert.equal(paid.meat - fresh.meat, outcome.meat)
assert.equal(awardOutcome(paid, outcome, now), paid)
const capped = {
  ...fresh,
  daily: { ...fresh.daily, paidBattles: DAILY_PAID_BATTLES },
}
assert.equal(
  awardOutcome(capped, { ...outcome, receipt: 'x' }, now).meat,
  capped.meat,
)

// The battle opens the reward screen; it reads the server's actual payout.
const clash = readFileSync('components/slime-city-clash.vue', 'utf8')
const screen = readFileSync('components/slime-city-match-report.vue', 'utf8')
const store = readFileSync('stores/slimeCity.ts', 'utf8')
assert.match(clash, /<SlimeCityMatchReport\s+v-if="game\.victor && reportOpen"/)
assert.match(clash, /data-testid="clash-show-report"/)
assert.match(screen, /clashMatchReport\(props\.state\)/)
assert.match(screen, /lab\.lastPayout/)
assert.match(store, /meat: after\.meat - before\.meat/)

console.log(
  'Slime City reward screen: win > loss, life kept and flawless pay, oddity notes, server pays the report PASS',
)
