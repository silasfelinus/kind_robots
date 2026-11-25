// utils/rulerHooked/economy.selftest.ts
//
// Headless behavioral test of the fishing-rewards/gear/shop economy
// (ruler-hooked/t-029), run via `npx tsx` -- same convention as
// game.selftest.ts / encounter.selftest.ts / advisor.selftest.ts. Proves:
// treasure rolls are deterministic and rarity-scaled, gear bonuses sum
// correctly from save flags and visibly widen/slow the timing bar, and
// purchases spend through the same closed Effect reducer every other
// mutation in this engine uses (no bespoke shop state).

import assert from 'node:assert/strict'
import {
  GEAR_CATALOG,
  KINGDOM_CATALOG,
  TREASURE_BY_RARITY,
  gearBonusFromFlags,
  ownsGear,
  purchaseGearFor,
  purchaseKingdomFor,
  rollTreasure,
  shopAvailable,
} from '~/utils/rulerHooked/economy'
import { applyEffect, cloneSave } from '~/utils/rulerHooked/applyEffects'
import { timingProfileFor } from '~/utils/rulerHooked/timingBar'
import { makeRng } from '~/utils/rulerHooked/seed'
import { createRun } from '~/utils/rulerHooked/newGame'
import { RULER_HOOKED_CONTENT as C } from '~/utils/rulerHooked/content'
import { takeTurn } from '~/utils/rulerHooked/loop'
import type { RunSave } from '~/types/ruler-hooked'

const fresh = (id = 'sv_econ'): RunSave =>
  createRun(C, {
    saveId: id,
    name: 'Test Reign',
    seed: 'mo-4820',
    rulerName: 'Mo',
    honorific: 'Queen',
    stamp: 'T0',
  })

// 1. Treasure rolls are deterministic given the same rng state, and every
//    tier's odds/range are internally sane (chance in (0,1], min <= max, all
//    non-negative -- a misconfigured tier would otherwise only surface as a
//    silently-wrong drop rate nobody noticed).
{
  for (const [rarity, table] of Object.entries(TREASURE_BY_RARITY)) {
    assert.ok(
      table.chance > 0 && table.chance <= 1,
      `${rarity} chance is a real probability`,
    )
    assert.ok(
      table.min >= 0 && table.max >= table.min,
      `${rarity} coin range is well-formed`,
    )
  }

  const a = rollTreasure('MYTHIC', makeRng('treasure-seed-1'))
  const b = rollTreasure('MYTHIC', makeRng('treasure-seed-1'))
  assert.equal(a, b, 'same seed -> same treasure roll')

  // Rarer fish should be strictly more generous on average -- sample both
  // ends of the rarity ladder over many independent seeds rather than
  // asserting on any single roll (each roll is a coin flip against `chance`).
  const sample = (rarity: 'COMMON' | 'MYTHIC', n = 500): number => {
    let total = 0
    for (let i = 0; i < n; i++)
      total += rollTreasure(rarity, makeRng(`sample:${rarity}:${i}`))
    return total
  }
  assert.ok(
    sample('MYTHIC') > sample('COMMON'),
    'MYTHIC treasure averages more coins than COMMON over many rolls',
  )
}

// 2. A real catch (takeTurn, the same path the store uses) can carry coins,
//    deterministically, and they land in save.counters.coins -- proves the
//    treasure roll is actually wired into the live catch path, not just
//    reachable in isolation.
{
  // mo-4820 with turn 0 is the exact seed game.selftest.ts already pins to
  // 'parlour-rustfish' (COMMON) -- walk a few turns looking for any hit
  // rather than assuming turn 0 rolls one, since COMMON's chance is 12%.
  let save = fresh()
  let sawCoins = false
  for (let i = 0; i < 40 && !sawCoins; i++) {
    const result = takeTurn(C, save, makeRng(`run-econ-${i}`))
    save = result.save
    if (result.catch.coinsFound > 0) {
      sawCoins = true
      assert.ok(
        (save.counters.coins ?? 0) >= result.catch.coinsFound,
        'coinsFound lands in save.counters.coins',
      )
      assert.ok(
        (save.counters.treasuresFound ?? 0) >= 1,
        'a coin hit also bumps the shared treasuresFound counter',
      )
    }
  }
  assert.ok(
    sawCoins,
    'at least one of 40 catches at COMMON-tier odds finds treasure',
  )
}

// 3. Gear bonuses sum correctly from flags, only for owned items, and
//    visibly change the timing-bar profile they feed into.
{
  const noGear = gearBonusFromFlags({})
  assert.deepEqual(
    noGear,
    { bandWidthBonus: 0, sweepMsBonus: 0 },
    'no gear owned -> no bonus',
  )

  const oneItem = GEAR_CATALOG[0]!
  const withOne = gearBonusFromFlags({ [oneItem.flagKey]: true })
  assert.equal(withOne.bandWidthBonus, oneItem.bandWidthBonus)
  assert.equal(withOne.sweepMsBonus, oneItem.sweepMsBonus)

  const allFlags = Object.fromEntries(
    GEAR_CATALOG.map((g) => [g.flagKey, true]),
  )
  const withAll = gearBonusFromFlags(allFlags)
  const expectedBand = GEAR_CATALOG.reduce(
    (sum, g) => sum + g.bandWidthBonus,
    0,
  )
  const expectedSweep = GEAR_CATALOG.reduce((sum, g) => sum + g.sweepMsBonus, 0)
  assert.equal(
    withAll.bandWidthBonus,
    expectedBand,
    'owning every gear item sums every bandWidthBonus',
  )
  assert.equal(
    withAll.sweepMsBonus,
    expectedSweep,
    'owning every gear item sums every sweepMsBonus',
  )

  assert.equal(ownsGear({}, oneItem.id), false)
  assert.equal(ownsGear({ [oneItem.flagKey]: true }, oneItem.id), true)

  const baseline = timingProfileFor({
    family: 'STANDARD_TENSION',
    rarity: 'MYTHIC',
    beat: 0,
  })
  const geared = timingProfileFor({
    family: 'STANDARD_TENSION',
    rarity: 'MYTHIC',
    beat: 0,
    gearBandBonus: withAll.bandWidthBonus,
    gearSweepMsBonus: withAll.sweepMsBonus,
  })
  assert.ok(
    geared.bandWidth > baseline.bandWidth,
    'owned gear widens the REEL band vs. the ungeared baseline',
  )
  assert.ok(
    geared.sweepMs > baseline.sweepMs,
    'owned gear slows the sweep vs. the ungeared baseline',
  )
}

// 4. Purchases spend through the existing Effect reducer only: gear grants a
//    flag and never regrants once owned; kingdom investment moves the real
//    kingdomHealth sliders (clamped 0..100 by applyEffect, same as any card).
{
  const save = fresh()
  save.counters.coins = 1000

  const gearItem = GEAR_CATALOG[0]!
  const afterGear = cloneSave(save)
  applyEffect(afterGear, {
    counters: { coins: -gearItem.cost },
    flags: { set: [gearItem.flagKey] },
  })
  assert.equal(afterGear.counters.coins, 1000 - gearItem.cost)
  assert.equal(afterGear.flags[gearItem.flagKey], true)

  const kingdomItem = KINGDOM_CATALOG[0]!
  const before = { ...afterGear.kingdomHealth }
  const afterKingdom = cloneSave(afterGear)
  applyEffect(afterKingdom, {
    counters: { coins: -kingdomItem.cost },
    sliders: kingdomItem.sliders,
  })
  assert.equal(
    afterKingdom.counters.coins,
    1000 - gearItem.cost - kingdomItem.cost,
  )
  for (const [axis, delta] of Object.entries(kingdomItem.sliders)) {
    assert.equal(
      afterKingdom.kingdomHealth[axis as keyof typeof before],
      before[axis as keyof typeof before] + (delta ?? 0),
      `${axis} moved by exactly the kingdom item's authored delta`,
    )
  }
}

// The exact shop reducers used by the store must resist duplicate purchases,
// invalid balances and spending after a completed reign.
{
  const gear = GEAR_CATALOG[0]!
  const work = KINGDOM_CATALOG[0]!
  const save = fresh()
  assert.equal(shopAvailable(null, false), false)
  assert.equal(shopAvailable(save, true), false)
  assert.equal(shopAvailable(save, false), true)

  for (const balance of [0, -1, NaN, Infinity, gear.cost - 1]) {
    const poor = fresh()
    poor.counters.coins = balance
    assert.equal(purchaseGearFor(poor, gear.id), poor)
    assert.equal(purchaseKingdomFor(poor, work.id), poor)
  }

  save.counters.coins = gear.cost + 2 * work.cost
  const before = cloneSave(save)
  assert.equal(purchaseGearFor(save, 'unknown'), save)
  assert.equal(purchaseKingdomFor(save, 'unknown'), save)

  let next = purchaseGearFor(save, gear.id)
  assert.deepEqual(save, before, 'purchases do not mutate their input')
  assert.equal(next.counters.coins, 2 * work.cost)
  assert.equal(ownsGear(next.flags, gear.id), true)
  for (let i = 0; i < 100; i++) {
    assert.equal(purchaseGearFor(next, gear.id), next)
  }

  next = purchaseKingdomFor(next, work.id)
  assert.equal(next.counters.coins, work.cost)
  next = purchaseKingdomFor(next, work.id)
  assert.equal(next.counters.coins, 0)
  assert.equal(purchaseKingdomFor(next, work.id), next)
  assert.equal(next.kingdomHealth.prosperity, before.kingdomHealth.prosperity + 12)

  const completed = { ...before, status: 'COMPLETE' as const }
  assert.equal(shopAvailable(completed, false), false)
  assert.equal(purchaseGearFor(completed, gear.id), completed)
  assert.equal(purchaseKingdomFor(completed, work.id), completed)
}

// All purchase orders respect the finite purse and grant each tackle item
// at most once, even when re-entering the shop and replaying the same clicks.
{
  for (const startingCoins of [0, 39, 40, 89, 90, 160, 290, 1000]) {
    for (let offset = 0; offset < GEAR_CATALOG.length; offset++) {
      let save = fresh()
      save.counters.coins = startingCoins
      for (let i = 0; i < GEAR_CATALOG.length * 3; i++) {
        const gear = GEAR_CATALOG[(offset + i) % GEAR_CATALOG.length]!
        const before = save
        save = purchaseGearFor(save, gear.id)
        if (save !== before) {
          assert.equal(save.counters.coins, before.counters.coins! - gear.cost)
        }
        assert.ok(save.counters.coins! >= 0)
      }
      const spent = GEAR_CATALOG.filter((gear) =>
        ownsGear(save.flags, gear.id),
      ).reduce((sum, gear) => sum + gear.cost, 0)
      assert.equal(save.counters.coins, startingCoins - spent)
    }
  }
}

console.log('economy.selftest.ts: all assertions passed')
