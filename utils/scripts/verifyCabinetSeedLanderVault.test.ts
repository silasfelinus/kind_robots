// Seed Lander depth pass, slice 4 part 2 (conductor kr-arcade/t-072, depth-pass CABINETS.md
// section 9): the secret Seed Vault and the ending. Opened by every golden acorn; ends on Every
// Seed, which replants the island like a boss does.
//
//   npx tsx utils/scripts/verifyCabinetSeedLanderVault.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/seedLander'
import { freshSave, readLanderSave } from '../arcade/seedLander/campaign'
import {
  ALL_ACORNS,
  ISLANDS,
  MISSIONS_PER_ISLAND,
  VAULT,
  VAULT_INDEX,
  islandAt,
  vaultOpen,
} from '../arcade/seedLander/islands'
import { Terrain } from '../arcade/seedLander/terrain'

// The vault is secret: not an ordinary island, and shut until every acorn is found.
assert.equal(VAULT_INDEX, ISLANDS.length)
assert.ok(!ISLANDS.includes(VAULT))
assert.equal(islandAt(VAULT_INDEX, new Set()), undefined)
assert.equal(vaultOpen(new Set(ALL_ACORNS.slice(1))), false)
const all = new Set(ALL_ACORNS)
assert.equal(vaultOpen(all), true)
assert.equal(islandAt(VAULT_INDEX, all), VAULT)
assert.equal(islandAt(0, new Set()), ISLANDS[0])
assert.equal(islandAt(VAULT_INDEX + 1, all), undefined)

// Six missions, no acorns of its own, the last a finale that plants one of each plant.
assert.equal(VAULT.missions.length, MISSIONS_PER_ISLAND)
for (const m of VAULT.missions) {
  assert.ok(m.id.startsWith('vault-'))
  assert.equal(m.acorns, undefined, `${m.id} hides no acorn`)
  assert.doesNotThrow(() => new Terrain(m.map), m.id)
}
assert.equal(new Set(VAULT.missions.map((m) => m.id)).size, MISSIONS_PER_ISLAND)
const last = VAULT.missions[MISSIONS_PER_ISLAND - 1]!
assert.equal(last.finale, true)
assert.equal(VAULT.missions.filter((m) => m.finale).length, 1)
const grows = new Set(
  last.map.pads.filter((p) => p.mult).map((p) => p.grows ?? 'flower'),
)
assert.deepEqual([...grows].sort(), [
  'beanstalk',
  'flower',
  'mushroom',
  'sunflower',
  'vine',
])
assert.equal(last.seeds, grows.size)

// Harder than Storm Shelf: stronger wind, narrower beds.
const s1 = ISLANDS[4]!.missions[0]!
const v1 = VAULT.missions[0]!
assert.ok(v1.wind > s1.wind)
const bed = (m: typeof s1) => m.map.pads.find((p) => p.id === 'bed1')!
assert.ok(bed(v1).w < bed(s1).w)

// A save can point at the vault and past it.
const save = { ...freshSave(), island: VAULT_INDEX }
assert.ok(readLanderSave(save, VAULT_INDEX + 1, MISSIONS_PER_ISLAND))
assert.ok(
  readLanderSave(
    { ...save, island: VAULT_INDEX + 1 },
    VAULT_INDEX + 1,
    MISSIONS_PER_ISLAND,
  ),
)
assert.equal(
  readLanderSave(
    { ...save, island: VAULT_INDEX + 2 },
    VAULT_INDEX + 1,
    MISSIONS_PER_ISLAND,
  ),
  null,
)

// In the cabinet: past Moon Garden the vault's map opens only with every acorn.
const resumeAt = (acorns: string[]) =>
  create({
    rng: mulberry32(1),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    resume: {
      ...freshSave(),
      campaignStarted: true,
      island: VAULT_INDEX,
      acorns,
    },
  } as never) as unknown as {
    screen: string | null
    offer: unknown
    update(i: unknown): void
  }
assert.ok(resumeAt([...ALL_ACORNS]).offer, 'continue offered at the vault')
assert.ok(resumeAt([]).offer, 'continue offered, vault still shut')

console.log('seed lander vault: ok')
