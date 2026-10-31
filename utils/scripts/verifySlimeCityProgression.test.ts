// Slime City local progression and pack prototype contract.
import assert from 'node:assert/strict'
import {
  createMatch,
  CARDS,
  TEAMS,
  type MatchState,
} from '../slimeCity/prototypes'
import {
  awardBattle,
  battleReceipt,
  buyPack,
  canBuyPack,
  CHALLENGES,
  challengeValue,
  claimChallenge,
  currentChallenges,
  DAILY_PAID_BATTLES,
  levelFor,
  newProgression,
  nextLevelXp,
  PACK_COST,
  pacificPeriod,
  RARE_COUNT,
  rarityOf,
  refreshPeriods,
  restoreProgression,
} from '../slimeCity/progression'
const pt = (s: string) => new Date(s)
const now = pt('2026-10-30T20:00:00Z')
assert.equal(pacificPeriod(pt('2026-10-31T06:59:00Z'), 'daily'), '2026-10-30')
assert.equal(pacificPeriod(pt('2026-10-31T07:00:00Z'), 'daily'), '2026-10-31')
assert.equal(pacificPeriod(pt('2026-11-02T07:59:00Z'), 'weekly'), '2026-10-26')
assert.equal(pacificPeriod(pt('2026-11-02T08:00:00Z'), 'weekly'), '2026-11-02')
assert.equal(pacificPeriod(pt('2026-03-08T09:59:00Z'), 'daily'), '2026-03-08')
assert.equal(pacificPeriod(pt('2026-03-09T06:59:00Z'), 'daily'), '2026-03-08')
assert.equal(pacificPeriod(pt('2026-03-09T07:00:00Z'), 'daily'), '2026-03-09')
assert.equal(levelFor(0), 1)
assert.equal(levelFor(99), 1)
assert.equal(levelFor(100), 2)
assert.equal(nextLevelXp(100), 400)
assert.equal(CHALLENGES.length, 6)
const fresh = newProgression(now)
assert.equal(fresh.meat, 0)
assert.equal(fresh.xp, 0)
assert.equal(canBuyPack(fresh), false)
assert.equal(fresh.cards.length, 0)
assert.equal(RARE_COUNT, 20)
assert.equal(CARDS.filter((c) => rarityOf(c) !== 'rare').length, 40)
assert.equal(new Set(CARDS.map((c) => c.id)).size, 60)
assert.equal(TEAMS.length, 6)

function battle(
  seed: number,
  verdict: 'player' | 'enemy' | 'draw',
  crew = 'catgirls',
): MatchState {
  const s = createMatch(
    'blackout',
    crew as MatchState['teamId'],
    'bloodfairies',
    seed,
  )
  s.victor = verdict
  s.winPath = 'time'
  s.commands = [
    { t: 'deploy', side: 'player', card: 'lynx', x: 0, y: 0 },
    { t: 'deploy', side: 'player', card: 'mau', x: 1, y: 0 },
    { t: 'end' },
    { t: 'end' },
  ]
  return s
}
const b = battle(100, 'player')
const won = awardBattle(fresh, b, now)
assert.equal(won.meat, 45)
assert.equal(won.xp, 80)
assert.equal(won.daily.battles, 1)
assert.equal(won.daily.blackoutWins, 1)
assert.equal(won.daily.creatures, 2)
assert.equal(won.weekly.crews.length, 1)
assert.equal(won.daily.paidBattles, 1)
assert.equal(awardBattle(won, b, now), won, 'Replay cannot double-award')
assert.ok(battleReceipt(b).includes('blackout'))
const notDone = createMatch('blackout', 'catgirls', 'bloodfairies', 42)
assert.equal(
  awardBattle(won, notDone, now),
  won,
  'No reward on unfinished fights',
)
const beforeEnd = battle(100, 'player')
beforeEnd.commands = []
assert.equal(
  awardBattle(won, beforeEnd, now),
  won,
  'No paid bout without actual rounds',
)
const lost = awardBattle(won, battle(101, 'enemy'), now)
assert.equal(lost.losses, 1)
assert.equal(lost.meat, 55)
assert.equal(lost.xp, 105)
const tied = awardBattle(lost, battle(102, 'draw'), now)
assert.equal(tied.draws, 1)
assert.equal(tied.meat, 70)
const daily = currentChallenges(tied, now)
assert.equal(daily.find((c) => c.id === 'daily-entry')?.ready, true)
assert.equal(daily.find((c) => c.id === 'daily-victor')?.ready, true)
assert.equal(daily.find((c) => c.id === 'daily-summons')?.ready, true)
assert.equal(daily.find((c) => c.id === 'weekly-victories')?.ready, false)
const claimed = claimChallenge(tied, 'daily-entry', now)
assert.equal(claimed.meat, tied.meat + 20)
assert.equal(claimed.xp, tied.xp + 20)
assert.equal(
  claimChallenge(claimed, 'daily-entry', now),
  claimed,
  'Challenge claims once',
)
assert.equal(
  claimChallenge(claimed, 'weekly-victories', now),
  claimed,
  'No premature claims',
)
assert.equal(claimChallenge(claimed, 'made-up', now), claimed)
assert.equal(claimed.daily.claimed.includes('daily-entry'), true)
assert.equal(challengeValue(claimed.daily, 'crews'), 1)
const nextDay = refreshPeriods(claimed, pt('2026-10-31T07:01:00Z'))
assert.equal(nextDay.daily.battles, 0)
assert.equal(nextDay.daily.claimed.length, 0)
assert.equal(nextDay.weekly.battles, tied.weekly.battles)
assert.equal(
  refreshPeriods(nextDay, pt('2026-11-02T08:00:00Z')).weekly.battles,
  0,
)
let capped = fresh
for (let i = 0; i < DAILY_PAID_BATTLES + 2; i++)
  capped = awardBattle(capped, battle(400 + i, 'player'), now)
assert.equal(capped.wins, DAILY_PAID_BATTLES + 2)
assert.equal(
  capped.meat,
  DAILY_PAID_BATTLES * 45,
  'No reward farming beyond daily cap',
)
assert.equal(capped.daily.paidBattles, DAILY_PAID_BATTLES)

let wallet = { ...fresh, meat: 2000 }
const pulled = new Set<string>()
for (let i = 0; i < 20; i++) {
  assert.equal(canBuyPack(wallet), true)
  const next = buyPack(wallet, 91823 + i)
  assert.equal(next.meat, wallet.meat - PACK_COST)
  assert.equal(next.lastPack.length, 3)
  assert.equal(
    next.lastPack.filter(
      (id) => rarityOf(CARDS.find((c) => c.id === id)!) === 'rare',
    ).length,
    1,
  )
  for (const id of next.lastPack) {
    assert.equal(
      pulled.has(id),
      false,
      'Every card globally unique, no duplicate packs',
    )
    pulled.add(id)
  }
  assert.equal(next.cards.length, (i + 1) * 3)
  wallet = next
}
assert.equal(pulled.size, 60, 'All authored starters available as collectibles')
assert.equal(
  canBuyPack(wallet),
  false,
  'Sold out instead of breaking rare guarantee',
)
assert.equal(buyPack(wallet, 5), wallet)
assert.equal(wallet.opened, 20)
assert.equal(wallet.meat, 0)
assert.deepEqual(
  buyPack({ ...fresh, meat: 100 }, 1234).lastPack,
  buyPack({ ...fresh, meat: 100 }, 1234).lastPack,
  'Seeded packs reproducible',
)
assert.deepEqual(restoreProgression(JSON.parse(JSON.stringify(claimed)), now), {
  ...claimed,
})
assert.equal(restoreProgression({ version: 1, meat: -1 }, now).meat, 0)
assert.equal(restoreProgression('not a wallet', now).xp, 0)
assert.deepEqual(restoreProgression(JSON.parse(JSON.stringify(wallet)), now).lastPack, wallet.lastPack, 'Account pack reveal survives refresh')

console.log(
  'Slime City rewards: Pacific day/week resets, capped CPU XP and Meat, claims, 20 rare-guaranteed packs, no duplicates PASS',
)
