// DB-free tests for the shared collectible system and live group chat
// helpers: every registered set is well formed, the daily streak and pack
// rules hold, back unlocks resolve, and every art prompt (cards and backs,
// with the set's house style) passes the enqueue-time art prompt contract.
import assert from 'node:assert/strict'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import { COLLECTIBLE_SETS } from '../collectibles/registry'
import {
  collectibleDay,
  dailyClaimFor,
  earnedBacks,
  openPack,
  parseBonusState,
  previousDay,
  rarityOdds,
  rollRarity,
} from '../collectibles/engine'
import { COLLECTIBLE_RARITIES } from '../collectibles/types'
import { TAROT_COLLECTIBLE_SET as tarot } from '../collectibles/sets/tarot'
import { CHAT_ROOMS, chatRoomBySlug, cleanChatBody } from '../community/rooms'

function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// --- Every set is well formed ---
for (const set of Object.values(COLLECTIBLE_SETS)) {
  const keys = [...set.cards, ...set.backs].map((item) => item.key)
  assert.equal(new Set(keys).size, keys.length, `${set.slug} keys are unique`)
  for (const key of keys) {
    assert.match(key, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${key} is a slug`)
  }
  assert.ok(set.backs.some((back) => back.unlock.kind === 'default'))
  for (const back of set.backs) {
    if (back.unlock.kind === 'group') {
      const group = back.unlock.group
      assert.ok(
        set.cards.some((card) => card.group === group),
        `${back.key} unlocks from a real group`,
      )
    }
    if (back.unlock.kind === 'unique') {
      assert.ok(back.unlock.count <= set.cards.length)
    }
  }
  for (const rarity of COLLECTIBLE_RARITIES) {
    assert.ok(
      set.cards.some((card) => card.rarity === rarity),
      `${set.slug} has ${rarity} cards`,
    )
  }
  for (const item of [...set.cards, ...set.backs]) {
    const prompt = `${item.artPrompt} ${set.artStyle}`
    assert.deepEqual(
      checkArtPromptContract({ prompt, engine: 'krea2' }),
      [],
      `${set.slug}/${item.key} art prompt`,
    )
  }
  const odds = rarityOdds(set)
  const total = odds.reduce((sum, row) => sum + row.percent, 0)
  assert.ok(Math.abs(total - 100) < 0.5, `${set.slug} odds sum to 100`)
}

// --- The tarot set: 100 cards, 12 backs, rarity by deck weight ---
assert.equal(tarot.cards.length, 100)
assert.equal(tarot.backs.length, 12)
const byRarity = Object.fromEntries(
  COLLECTIBLE_RARITIES.map((rarity) => [
    rarity,
    tarot.cards.filter((card) => card.rarity === rarity).length,
  ]),
)
assert.deepEqual(byRarity, {
  common: 40,
  uncommon: 16,
  rare: 22,
  epic: 12,
  legendary: 10,
})
assert.equal(tarot.economy.packCost > 0, true)
assert.ok(
  tarot.economy.dailyBase < tarot.economy.packCost,
  'one daily claim alone does not buy a pack',
)

// --- Days and streaks (Pacific day boundary) ---
assert.equal(
  collectibleDay(new Date('2026-11-28T07:30:00Z'), 'America/Los_Angeles'),
  '2026-11-27',
)
assert.equal(previousDay('2026-03-01'), '2026-02-28')
const first = dailyClaimFor(
  tarot,
  { lastClaimDay: null, streak: 0 },
  '2026-11-27',
)
assert.ok(first.allowed)
assert.equal(first.streak, 1)
assert.equal(first.reward, tarot.economy.dailyBase)
assert.equal(first.tickets, tarot.economy.welcomeTickets)
assert.deepEqual(
  dailyClaimFor(tarot, { lastClaimDay: '2026-11-27', streak: 1 }, '2026-11-27'),
  { allowed: false, reason: 'already-claimed' },
)
const day7 = dailyClaimFor(
  tarot,
  { lastClaimDay: '2026-11-26', streak: 6 },
  '2026-11-27',
)
assert.ok(day7.allowed)
assert.equal(day7.streak, 7)
assert.equal(day7.tickets, 1)
assert.equal(
  day7.reward,
  tarot.economy.dailyBase + tarot.economy.dailyStreakStep * 6,
)
const capped = dailyClaimFor(
  tarot,
  { lastClaimDay: '2026-11-26', streak: 40 },
  '2026-11-27',
)
assert.ok(capped.allowed)
assert.equal(capped.reward, day7.reward)
const broken = dailyClaimFor(
  tarot,
  { lastClaimDay: '2026-11-20', streak: 9 },
  '2026-11-27',
)
assert.ok(broken.allowed)
assert.equal(broken.streak, 1)

// --- Rolls, floor, pity, unowned bias ---
assert.equal(
  rollRarity(tarot.economy.rarityWeights, () => 0),
  'common',
)
assert.equal(
  rollRarity(tarot.economy.rarityWeights, () => 0, 'uncommon'),
  'uncommon',
)
const rand = seeded(42)
let since = 0
let longestDrought = 0
const owned = new Set<string>()
for (let pack = 0; pack < 400; pack++) {
  const result = openPack(tarot, { pullsSinceTop: since, owned }, rand)
  assert.equal(result.cards.length, tarot.economy.packSize)
  const last = result.cards[result.cards.length - 1]!
  assert.ok(
    COLLECTIBLE_RARITIES.indexOf(last.rarity) >=
      COLLECTIBLE_RARITIES.indexOf(tarot.economy.packFloor),
    'last slot honors the floor',
  )
  for (const card of result.cards) {
    since = card.rarity === 'legendary' ? 0 : since + 1
    longestDrought = Math.max(longestDrought, since)
    owned.add(card.key)
  }
  assert.equal(since, result.pullsSinceTop)
}
assert.ok(longestDrought < tarot.economy.pityAt, 'pity always triggers in time')
assert.equal(owned.size, 100, '400 seeded packs complete the set')

// --- Back unlocks ---
assert.deepEqual(earnedBacks(tarot, { bestStreak: 0, owned: new Set() }), [
  'back-starlit',
])
const streakBacks = earnedBacks(tarot, { bestStreak: 7, owned: new Set() })
assert.ok(
  streakBacks.includes('back-moonbeam') &&
    streakBacks.includes('back-sun-gear'),
)
assert.ok(!streakBacks.includes('back-comet-trail'))
const allCards = new Set(tarot.cards.map((card) => card.key))
assert.equal(earnedBacks(tarot, { bestStreak: 0, owned: allCards }).length, 8)
assert.equal(earnedBacks(tarot, { bestStreak: 30, owned: allCards }).length, 12)

assert.deepEqual(parseBonusState('not json'), { day: '', tasks: [] })
assert.deepEqual(parseBonusState('{"day":"2026-11-27","tasks":["chat",4]}'), {
  day: '2026-11-27',
  tasks: ['chat'],
})

// --- Group chat helpers ---
assert.ok(chatRoomBySlug('tarot'))
assert.equal(
  new Set(CHAT_ROOMS.map((room) => room.slug)).size,
  CHAT_ROOMS.length,
)
assert.equal(cleanChatBody('  hi\u0007 there  '), 'hi there')
assert.equal(cleanChatBody('a\n\n\n\n\nb'), 'a\n\nb')
assert.equal(cleanChatBody(42), '')

console.log('verifyCollectibles: ok')
