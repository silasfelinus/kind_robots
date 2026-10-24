import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  ARCHETYPES,
  BEST_WINS,
  COMPANIONS,
  CREW_LIMIT,
  DECKS,
  ITEMS,
  LOCATIONS,
  SKILL_LABELS,
  VILLAINS,
  activitiesAt,
  allEncounters,
  choose,
  deckByTag,
  doActivity,
  finaleTier,
  isRunState,
  newRun,
  nightfall,
  resolve,
  successChance,
  type RunState,
} from '../crystalStreet/rules'
import {
  COMPANION_IDS,
  ITEM_IDS,
  LOCATION_IDS,
  VILLAIN_IDS,
  type VillainId,
} from '../crystalStreet/ids'
import {
  duplicateIds,
  validateCompanion,
  validateDeck,
  validateItem,
  validateLocation,
  validateVillain,
} from '../crystalStreet/validate'
import { autoplay } from '../crystalStreet/autoplay'
import { buildPlaybook } from '../playbook/games'

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const asset = (path: string) => readFileSync(file(path), 'utf8')

// Roster sizes Silas asked for: at least twenty nightmares and twenty friends.
assert.equal(VILLAINS.length, VILLAIN_IDS.length)
assert.ok(VILLAINS.length >= 20, 'twenty or more nightmares')
assert.deepEqual(
  VILLAINS.map((v) => v.id),
  [...VILLAIN_IDS],
)
assert.ok(COMPANIONS.length >= 20, 'twenty or more companions')
assert.deepEqual(COMPANIONS.map((c) => c.id).sort(), [...COMPANION_IDS].sort())
assert.equal(CREW_LIMIT, 10, 'ten active companions at most')
assert.deepEqual(LOCATIONS.map((l) => l.id).sort(), [...LOCATION_IDS].sort())
assert.deepEqual(ITEMS.map((i) => i.id).sort(), [...ITEM_IDS].sort())
assert.equal(DECKS.length, 8, 'one night deck per tag')
assert.equal(ARCHETYPES.length, 6)
for (const a of ARCHETYPES)
  assert.equal(
    Object.values(a.skills).reduce((s, n) => s + n, 0),
    9,
    `${a.id} starts with nine skill points`,
  )

// Every card passes the authoring contract.
const problems: string[] = []
for (const v of VILLAINS) validateVillain(problems, v)
for (const c of COMPANIONS) validateCompanion(problems, c)
for (const l of LOCATIONS) validateLocation(problems, l)
for (const d of DECKS) validateDeck(problems, d)
for (const i of ITEMS) validateItem(problems, i)
assert.deepEqual(problems, [], problems.slice(0, 20).join('\n'))

const encounters = [
  ...VILLAINS.flatMap((v) => [
    ...v.clues.map((c) => c.encounter),
    ...v.signature,
    v.finale,
  ]),
  ...COMPANIONS.map((c) => c.meet),
  ...LOCATIONS.flatMap((l) => l.beats),
  ...DECKS.flatMap((d) => d.encounters),
]
assert.deepEqual(duplicateIds(encounters), [], 'encounter ids are unique')
assert.equal(allEncounters().length, encounters.length)

// Two or more choices everywhere, each with an illustrated win and loss.
for (const e of encounters) {
  assert.ok(e.choices.length >= 2, `${e.id} offers a real choice`)
  for (const c of e.choices) {
    assert.ok(c.success.art && c.failure.art, `${e.id}/${c.id} has outcome art`)
    assert.notEqual(c.success.text, c.failure.text)
  }
}

// Each nightmare draws from decks that exist, and has its own best ending.
for (const v of VILLAINS) {
  for (const tag of v.tags)
    assert.ok(
      (deckByTag(tag)?.encounters.length ?? 0) >= 5,
      `${v.id}: ${tag} deck`,
    )
  assert.ok(v.endings.best.text.length > 160, `${v.id} has a best ending`)
  assert.equal(new Set(v.clues.map((c) => c.location)).size, 3)
}
for (const c of COMPANIONS)
  assert.ok(
    LOCATIONS.some((l) => l.id === c.location),
    `${c.id} can be met somewhere`,
  )

// Ending rules.
const probe = newRun({
  seed: 'probe',
  name: 'P',
  pronouns: 'they/them',
  archetype: 'jock',
})
probe.wins = BEST_WINS
probe.nerve = 5
assert.equal(finaleTier(probe, 'heart', true), 'best')
assert.equal(finaleTier(probe, 'fight', true), 'good')
assert.equal(finaleTier(probe, 'heart', false), 'bittersweet')
probe.nerve = 2
assert.equal(finaleTier(probe, 'trick', false), 'bad')
probe.wins = BEST_WINS - 1
probe.nerve = 5
assert.equal(finaleTier(probe, 'heart', true), 'good', 'best needs the wins')

// Odds math.
assert.equal(successChance(-20, 7), 1 / 36, 'boxcars always win')
assert.equal(successChance(20, 11), 35 / 36, 'snake eyes always lose')

// Day and night loop.
let run: RunState = newRun({
  seed: 'loop',
  name: 'Loop',
  pronouns: 'she/her',
  archetype: 'weirdo',
  villain: 'frieda-krueger',
})
assert.equal(run.villain, 'frieda-krueger')
assert.equal(run.phase, 'day')
assert.equal(run.revealed, false)
assert.ok(
  !activitiesAt(run, 'library').some((a) => a.kind === 'clue'),
  'no leads before the nightmare shows itself',
)
const train = activitiesAt(run, 'gym').find((a) => a.kind === 'train')!
run = doActivity(run, 'gym', train)
assert.equal(run.actions, 2)
assert.equal(run.skills.brawn, 1)
assert.ok(
  !activitiesAt(run, 'library').some((a) => a.kind === 'train'),
  'one training a day',
)
run = nightfall(run)
assert.equal(run.phase, 'night')
assert.equal(run.revealed, true)
assert.ok(run.current, 'the first night deals a card')
const firstNight = allEncounters().find((e) => e.id === run.current!.id)!
run = resolve(choose(run, firstNight.choices.find((c) => !c.requires)!.id))
assert.equal(run.rolls, 1)
assert.ok(isRunState(JSON.parse(JSON.stringify(run))), 'saves round-trip')

// Determinism and balance across seeded autoplay.
const a = autoplay('same-seed')
const b = autoplay('same-seed')
assert.deepEqual(
  a,
  { ...b, ending: { ...b.ending!, at: a.ending!.at } },
  'seeded weeks replay exactly',
)

const tiers: Record<string, number> = {
  best: 0,
  good: 0,
  bittersweet: 0,
  bad: 0,
}
const bestBy = new Map<string, number>()
const RUNS = 20
for (const v of VILLAINS) {
  for (let i = 0; i < RUNS; i++) {
    const end = autoplay(
      `${v.id}-${i}`,
      v.id as VillainId,
      ARCHETYPES[i % 6]!.id,
    )
    assert.equal(end.phase, 'ended', `${v.id}-${i} finishes`)
    assert.ok(end.ending, `${v.id}-${i} has an ending`)
    tiers[end.ending!.tier]! += 1
    if (end.ending!.tier === 'best')
      bestBy.set(v.id, (bestBy.get(v.id) ?? 0) + 1)
    assert.ok(end.crew.length <= CREW_LIMIT)
  }
}
const total = VILLAINS.length * RUNS
console.log(
  `Crystal Street autoplay over ${total} weeks: ` +
    Object.entries(tiers)
      .map(([t, n]) => `${t} ${Math.round((n / total) * 100)}%`)
      .join(', '),
)
for (const v of VILLAINS)
  assert.ok(
    (bestBy.get(v.id) ?? 0) > 0,
    `${v.id}: a careful week can reach the best ending`,
  )
assert.ok(
  tiers.best! < total * 0.65,
  'the best ending is earned, not automatic',
)
assert.ok(tiers.bad! + tiers.bittersweet! > 0, 'weeks can go wrong')

// Surface contracts: admin route, tab, store-owned storage, playbook.
assert.ok(existsSync(file('../../pages/admin/crystal-street.vue')))
const tab = asset('../../content/channels/admin/crystal-street.md')
assert.match(tab, /requiredRole: ADMIN/)
assert.match(tab, /route: \/admin\/crystal-street/)
for (const name of readdirSync(file('../../components/crystal-street')))
  assert.ok(
    !/localStorage|\$fetch/.test(
      asset(`../../components/crystal-street/${name}`),
    ),
    `${name} leaves storage to the store`,
  )
assert.ok(
  !/localStorage|\$fetch/.test(asset('../../pages/admin/crystal-street.vue')),
)
assert.match(
  asset('../../stores/crystalStreetStore.ts'),
  /crystal-street-scrapbook-v1/,
)
const book = buildPlaybook('crystal-street')
assert.equal(
  book.routes.filter((r) => VILLAIN_IDS.includes(r.id as VillainId)).length,
  VILLAINS.length,
)
assert.equal(Object.keys(SKILL_LABELS).length, 6)

console.log('Crystal Street contract passed')
