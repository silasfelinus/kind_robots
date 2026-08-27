import assert from 'node:assert/strict'
import { makeRng, hashSeed } from '~/utils/rulerHooked/seed'
import { applyEffect, resolveChoice, cloneSave } from '~/utils/rulerHooked/applyEffects'
import { triggerHolds, effectiveWeight } from '~/utils/rulerHooked/triggers'
import { rampState, resolveScene, cycleTime, assetCandidates } from '~/utils/rulerHooked/compositor'
import { eligiblePool, weightedPick, selectCard, tickCooldowns } from '~/utils/rulerHooked/select'
import { availableFish, resolveFishingCatch, RULER_HOOKED_FISH } from '~/utils/rulerHooked/fish'
import type { Card, RegionsManifest, RunSave } from '~/types/ruler-hooked'

function baseSave(): RunSave {
  return {
    schemaVersion: 5, saveId: 'sv_test', name: 'Test', dreamSlug: 'ruler-hooked',
    contentVersion: '2026.07', seed: 'mo-4820', status: 'ACTIVE',
    ruler: { name: 'Mo', honorific: 'Queen' },
    turnCount: 5, cyclePosition: 0,
    kingdomHealth: { nature: 90, prosperity: 40, treasury: 55, joy: 72, order: 48 },
    counters: { fishCaught: 3, warlockFavors: 0 },
    regionStates: {}, regionOverrides: {},
    deckState: { seenCardIds: [], activeArcs: {}, cooldowns: {}, drawBag: [] },
    inventory: { skills: [], items: [] },
    choiceLog: [], flags: {}, fishopedia: {}, endingKey: null,
    createdAt: 'x', updatedAt: 'x',
  }
}

// 1. RNG determinism + resume
{
  assert.equal(hashSeed('mo'), hashSeed('mo'), 'hash stable')
  const a = makeRng('mo-4820'); const b = makeRng('mo-4820')
  const seqA = [a.next(), a.next(), a.next()]
  const seqB = [b.next(), b.next(), b.next()]
  assert.deepEqual(seqA, seqB, 'same seed -> same sequence')
  const c = makeRng('mo-4820'); c.next()
  const resumed = makeRng(0, c.state())
  assert.equal(resumed.next(), c.next(), 'state resume continues stream')
  assert.notDeepEqual(makeRng('other').next(), seqA[0], 'different seed differs')
}

// 2. Reducer: additive + clamp, flags, override, ending, purity
{
  const s = baseSave()
  applyEffect(s, { sliders: { nature: +20, prosperity: -6 }, counters: { warlockFavors: +1 },
    flags: { set: ['metWarlock'] }, regionOverride: { far_shore: 'industrial' } })
  assert.equal(s.kingdomHealth.nature, 100, 'nature 90+20 clamps to 100')
  assert.equal(s.kingdomHealth.prosperity, 34, 'prosperity 40-6=34')
  assert.equal(s.counters.warlockFavors, 1, 'counter incremented')
  assert.equal(s.flags.metWarlock, true, 'flag set')
  assert.equal(s.regionOverrides.far_shore, 'industrial', 'region pinned')

  const before = baseSave()
  const card: Card = { id: 'warlock-druid-north', kind: 'interrupt', title: 'North Woods',
    choices: [{ id: 'develop', text: 'Build', effects: { sliders: { nature: -20 }, ending: undefined } }] }
  const after = resolveChoice(before, card, card.choices[0]!)
  assert.equal(before.kingdomHealth.nature, 90, 'input save NOT mutated (purity)')
  assert.equal(after.kingdomHealth.nature, 70, 'choice applied on clone')
  assert.equal(after.choiceLog.length, 1, 'choiceLog appended')
  assert.equal(after.choiceLog[0]!.cardId, 'warlock-druid-north')
  assert.ok(after.deckState.seenCardIds.includes('warlock-druid-north'), 'card marked seen')

  const fin = cloneSave(baseSave())
  applyEffect(fin, { ending: 'druid-utopia' })
  assert.equal(fin.status, 'COMPLETE', 'ending sets COMPLETE')
  assert.equal(fin.endingKey, 'druid-utopia')
}

// 3. Triggers
{
  const s = baseSave()
  assert.equal(triggerHolds(s, { minTurn: 3, requires: { sliders: { nature: { gte: 30 } } } }), true)
  assert.equal(triggerHolds(s, { minTurn: 99 }), false, 'minTurn gates on turnCount')
  s.flags.northWoodsSettled = true
  assert.equal(triggerHolds(s, { forbids: { flags: ['northWoodsSettled'] } }), false, 'forbids blocks')
  assert.equal(effectiveWeight(s, { weightBonus: { when: { sliders: { joy: { gte: 70 } } }, add: 4 } }, 1), 5)
}

// 4. Compositor
{
  assert.equal(rampState(0, ['wild', 'tended', 'logged', 'overbuilt']), 'wild')
  assert.equal(rampState(60, ['wild', 'tended', 'logged', 'overbuilt']), 'logged')
  assert.equal(rampState(100, ['wild', 'tended', 'logged', 'overbuilt']), 'overbuilt')
  const manifest: RegionsManifest = { regions: {
    treeline: { z: 2, driver: { slider: 'nature', ramp: ['wild', 'tended', 'logged', 'overbuilt'] }, states: [] },
    far_shore: { z: 1, states: ['pristine', 'industrial'] },
  } }
  const s = baseSave(); s.regionOverrides.far_shore = 'industrial'
  const scene = resolveScene(s, manifest)
  assert.equal(scene.regionStates.treeline, 'overbuilt', 'nature 90 -> overbuilt via ramp')
  assert.equal(scene.regionStates.far_shore, 'industrial', 'override wins over anything')
  assert.equal(cycleTime(0), 'day'); assert.equal(cycleTime(3), 'night')
  const cands = assetCandidates('treeline', 'wild', 'golden')
  assert.deepEqual(cands, [
    '/images/ruler-hooked/treeline-wild-golden.webp',
    '/images/ruler-hooked/treeline-wild-day.webp',
    '/images/ruler-hooked/treeline-wild.webp',
  ], 'golden falls back to day settle then base')

  // Ruler cosmetic axis (ruler-hooked/t-021): a chosen preset's layer is tried
  // first, ahead of the region's normal state/time candidates.
  const rulerCands = assetCandidates('ruler', 'fishing', 'day', undefined, 'king-osric')
  assert.deepEqual(rulerCands, [
    '/images/ruler-hooked/ruler/king-osric.webp',
    '/images/ruler-hooked/ruler-fishing-day.webp',
    '/images/ruler-hooked/ruler-fishing.webp',
  ], 'preset layer tried first, falls back to the base ruler layer')
  assert.deepEqual(
    assetCandidates('ruler', 'fishing', 'day'),
    ['/images/ruler-hooked/ruler-fishing-day.webp', '/images/ruler-hooked/ruler-fishing.webp'],
    'no cosmeticId -> unchanged base-ruler-layer candidates',
  )
  assert.ok(
    !assetCandidates('treeline', 'wild', 'day', undefined, 'king-osric').some((c) => c.includes('/ruler/')),
    'cosmeticId is ignored for every region other than ruler',
  )
}

// 5. Selection determinism + gating
{
  const cards: Card[] = [
    { id: 'a', kind: 'interrupt', title: 'A', weight: 1, choices: [] },
    { id: 'b', kind: 'interrupt', title: 'B', weight: 3, choices: [] },
    { id: 'arc', kind: 'arc-step', title: 'Arc', choices: [] },
    { id: 'once', kind: 'ambient', title: 'Once', once: true, choices: [] },
  ]
  const s = baseSave()
  const pool = eligiblePool(s, cards)
  assert.ok(!pool.some((c) => c.kind === 'arc-step'), 'arc-step excluded from free draw')
  s.deckState.seenCardIds.push('once')
  assert.ok(!eligiblePool(s, cards).some((c) => c.id === 'once'), 'once+seen excluded')
  s.deckState.cooldowns.a = 2
  assert.ok(!eligiblePool(s, cards).some((c) => c.id === 'a'), 'cooldown excluded')
  tickCooldowns(s); assert.equal(s.deckState.cooldowns.a, 1, 'cooldown ticks down')

  const p1 = weightedPick(baseSave(), cards.filter((c) => c.kind === 'interrupt'), makeRng('seedX'))
  const p2 = weightedPick(baseSave(), cards.filter((c) => c.kind === 'interrupt'), makeRng('seedX'))
  assert.equal(p1?.id, p2?.id, 'weightedPick deterministic per seed')
  const s2 = baseSave()
  const r1 = selectCard(s2, cards, makeRng('t5'))
  const r2 = selectCard(s2, cards, makeRng('t5'))
  assert.equal(r1?.id ?? null, r2?.id ?? null, 'selectCard deterministic per seed (replay==reload)')
}

// 6. Fish ecology: roster contract, world-state pool changes, deterministic records
{
  assert.equal(RULER_HOOKED_FISH.length, 15, 'vertical slice stays at 15 authored species')
  for (const affinity of ['GOOD', 'NEUTRAL', 'EVIL'] as const) {
    assert.equal(RULER_HOOKED_FISH.filter((f) => f.affinity === affinity).length, 5, `${affinity} roster stays at five species`)
  }

  const neutral = baseSave()
  neutral.kingdomHealth = { nature: 50, prosperity: 50, treasury: 50, joy: 50, order: 50 }
  const neutralPool = availableFish(neutral).map((f) => f.slug)
  assert.deepEqual(neutralPool, ['parlour-rustfish'], 'baseline lake starts with the universal Rustfish')

  const green = baseSave()
  green.flags.treelineSanctuarySettled = true
  green.kingdomHealth.nature = 70
  assert.ok(availableFish(green).some((f) => f.slug === 'sunspoke-koi'), 'sanctuary + nature unlocks Sunspoke Koi')

  const taxed = baseSave()
  taxed.counters.taxHikes = 2
  taxed.kingdomHealth.joy = 35
  taxed.kingdomHealth.treasury = 70
  assert.ok(availableFish(taxed).some((f) => f.slug === 'tithe-lamprey'), 'repeated extraction unlocks Tithe Lamprey')

  const a = baseSave(); a.kingdomHealth = { nature: 50, prosperity: 50, treasury: 50, joy: 50, order: 50 }
  const b = cloneSave(a)
  const ca = resolveFishingCatch(a, makeRng('fish-seed'))
  const cb = resolveFishingCatch(b, makeRng('fish-seed'))
  assert.deepEqual(ca, cb, 'same save + RNG seed gives identical specimen')
  assert.equal(a.counters.fishCaught, 4, 'catch increments fish count')
  assert.equal(a.fishopedia[ca.fishSlug]?.countCaught, 1, 'catch is recorded in Fishopedia')
  assert.equal(ca.newDiscovery, true, 'first catch marks a discovery')
  const ca2 = resolveFishingCatch(a, makeRng('fish-seed'))
  assert.equal(ca2.newDiscovery, false, 'later catch of same species is not new')
  assert.equal(a.fishopedia[ca.fishSlug]?.countCaught, 2, 'repeat catch increments species record')
}

console.log('ruler-hooked engine self-test: ALL PASS')
