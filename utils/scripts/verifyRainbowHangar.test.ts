import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  awardRainbowHangarMedals,
  emptyRainbowHangar,
  purchaseRainbowHangarUpgrade,
  rainbowHangarBalance,
  rainbowHangarBonuses,
  readRainbowHangar,
} from '../arcade/games/rainbowHangar'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'

const original = emptyRainbowHangar()
assert.deepEqual(readRainbowHangar(null), original)
assert.deepEqual(readRainbowHangar({ v: 99, medals: { 1: 'gold' } }), original)
assert.deepEqual(
  readRainbowHangar({
    v: 1,
    medals: { 1: 'gold', 2: 'silver', 9: 'gold', 3: 'cheat' },
    upgrades: ['shield', 'shield', 'unknown'],
  }),
  { v: 1, medals: { 1: 'gold', 2: 'silver' }, upgrades: ['shield'] },
)
assert.equal(
  purchaseRainbowHangarUpgrade(original, 'life'),
  original,
  'upgrades cost real medals',
)

let hangar = awardRainbowHangarMedals(original, {
  medals: { 1: 'bronze', 2: 'gold', 3: 'silver', 9: 'gold' },
})
assert.equal(rainbowHangarBalance(hangar), 6)
assert.equal(
  awardRainbowHangarMedals(hangar, { medals: { 1: 'bronze' } }),
  hangar,
  'replaying an Act cannot farm petals',
)
hangar = awardRainbowHangarMedals(hangar, { medals: { 1: 'gold' } })
assert.equal(rainbowHangarBalance(hangar), 8)
hangar = purchaseRainbowHangarUpgrade(hangar, 'shield')
assert.equal(rainbowHangarBalance(hangar), 4)
assert.equal(purchaseRainbowHangarUpgrade(hangar, 'shield'), hangar)
assert.equal(purchaseRainbowHangarUpgrade(hangar, 'charge'), hangar)
hangar = awardRainbowHangarMedals(hangar, {
  medals: { 4: 'gold', 5: 'gold', 6: 'gold' },
})
hangar = purchaseRainbowHangarUpgrade(hangar, 'charge')
hangar = purchaseRainbowHangarUpgrade(hangar, 'life')
assert.deepEqual(rainbowHangarBonuses(hangar), {
  shield: true,
  charge: true,
  life: true,
})
assert.equal(rainbowHangarBalance(hangar), 1)
assert.deepEqual(readRainbowHangar(JSON.parse(JSON.stringify(hangar))), hangar)

const normal = createRainbowPrincessPreview({
  rng: () => 0.5,
  sound: { play() {} },
  hiScore: 0,
  players: 4,
  demo: true,
})
const upgraded = createRainbowPrincessPreview({
  rng: () => 0.5,
  sound: { play() {} },
  hiScore: 0,
  players: 4,
  demo: true,
  rainbowHangar: rainbowHangarBonuses(hangar),
})
for (let seat = 0; seat < 4; seat++) {
  assert.equal(normal.snapshot.ships[seat]!.shield, 3)
  assert.equal(normal.snapshot.ships[seat]!.charge, 0)
  assert.equal(normal.snapshot.ships[seat]!.lives, 3)
  assert.equal(upgraded.snapshot.ships[seat]!.shield, 4)
  assert.equal(upgraded.snapshot.ships[seat]!.charge, 20)
  assert.equal(upgraded.snapshot.ships[seat]!.lives, 4)
}

const root = new URL('../../', import.meta.url)
const cabinet = readFileSync(
  new URL('components/arcade/arcade-cabinet.vue', root),
  'utf8',
)
const page = readFileSync(
  new URL('pages/play/rainbow-bullet-hell-space-princess.vue', root),
  'utf8',
)
const store = readFileSync(new URL('stores/arcadeStore.ts', root), 'utf8')
assert.match(cabinet, /rainbowHangar:[\s\S]*store\.rainbowHangarBonuses\(\)/)
assert.match(store, /awardRainbowHangarMedals\(previous, save\)/)
assert.match(store, /rainbowHangars: rainbowHangars\.value/)
assert.match(page, /aria-label="Palace Hangar upgrades"/)
assert.match(page, /@click="arcadeStore\.buyRainbowUpgrade\(upgrade\.id\)"/)
console.log('rainbow hangar: earned medals, three slots, equipped four-seat perks')
