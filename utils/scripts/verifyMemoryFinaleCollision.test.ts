import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  FINALE_FRAGMENT_SITES,
  concludeFinaleCollisionFromJournal,
  finaleCollisionUnlocked,
  recoverFinaleCollisionFromJournal,
  type FinaleWorld,
} from '../memoryDungeon/finaleCollision'
import {
  MEMORY_LAST_CHOICE,
  MEMORY_PAIR_ENDINGS,
  memoryCoreEnding,
  memoryCoreEndingId,
  type MemoryCampaignProgress,
  type MemoryLastChoice,
} from '../memoryDungeon/reimaginerCampaign'
import { worldEvent, worldEvents } from '../memoryDungeon/overworldEventCatalog'
import type { EarthJournalAction } from '../memoryDungeon/earthJournal'

function afterE10(
  decisions: Partial<Record<'e02' | 'e04' | 'e06' | 'e08', string>> = {},
): MemoryCampaignProgress {
  return {
    completed: [
      'e01',
      'e02',
      'e03',
      'e04',
      'e05',
      'e06',
      'e07',
      'e08',
      'e09',
      'e10',
    ],
    rememberedAnchors: [
      'morrow-magic-attempt',
      'scylla-home-wish',
      'char-possible-future',
    ],
    finaleCommitted: true,
    pairDecisions: {
      e02: decisions.e02 ?? 'trust-witnesses',
      e04: decisions.e04 ?? 'seal-the-tide-gate',
      e06: decisions.e06 ?? 'publish-twin-testimony',
      e08: decisions.e08 ?? 'unbar-all-doors',
      e10: 'destroy-price-ledger',
    },
    scyllaDeparture: 'tell-char',
    recoveredFragments: [
      'briar-office-key',
      'briar-tide-roots',
      'city-lantern-charter',
      'city-forest-hours',
    ],
    campaignVersion: 2,
  } as MemoryCampaignProgress
}

/** Visit every square by legal adjacent steps, choose once at each, end at 8,8. */
function fullRoute(world: FinaleWorld): EarthJournalAction[] {
  const journal: EarthJournalAction[] = []
  const chosen = new Set<string>()
  let at = '1,1'
  const decide = () => {
    if (chosen.has(at)) return
    const event = worldEvent(world, at)!
    journal.push({ type: 'choose', key: at, choiceId: event.choices[0]!.id })
    chosen.add(at)
  }
  decide()
  for (let y = 1; y <= 8; y++) {
    const xs = y % 2 ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]
    for (const x of xs) {
      const key = `${x},${y}`
      if (key === at) continue
      journal.push({ type: 'travel', key })
      at = key
      decide()
    }
  }
  for (let x = 2; x <= 8; x++) {
    at = `${x},8`
    journal.push({ type: 'travel', key: at })
  }
  return journal
}

for (const world of ['e11', 'e12'] as const) {
  assert.equal(worldEvents(world).length, 64, world + ' has 64 sites')
  for (const key of Object.keys(FINALE_FRAGMENT_SITES[world]))
    assert.ok(worldEvent(world, key), `${world} fragment site ${key}`)
}

const base = afterE10()
assert.ok(finaleCollisionUnlocked(base, 'e11'))
assert.ok(!finaleCollisionUnlocked(base, 'e12'))
assert.ok(
  !finaleCollisionUnlocked(
    { ...base, recoveredFragments: base.recoveredFragments!.slice(0, 3) },
    'e11',
  ),
  'e11 needs both e10 memories',
)
assert.ok(!finaleCollisionUnlocked({ ...base, finaleCommitted: false }, 'e11'))

const seaRoute = fullRoute('e11')
assert.equal(
  concludeFinaleCollisionFromJournal(base, 'e11', seaRoute.slice(0, -7)),
  null,
  'the crossing is at 8,8',
)
assert.equal(
  concludeFinaleCollisionFromJournal(base, 'e11', [
    { type: 'travel', key: '8,8' },
  ]),
  null,
  'teleporting is rejected',
)
const partial = recoverFinaleCollisionFromJournal(
  base,
  'e11',
  seaRoute.slice(0, 40),
)
assert.ok(partial)
const afterE11 = concludeFinaleCollisionFromJournal(base, 'e11', seaRoute)
assert.ok(afterE11, 'a full witnessed sea route completes e11')
assert.ok(afterE11.completed.includes('e11'))
for (const id of Object.values(FINALE_FRAGMENT_SITES.e11))
  assert.ok(afterE11.recoveredFragments!.includes(id))
assert.ok(finaleCollisionUnlocked(afterE11, 'e12'))

const roadRoute = fullRoute('e12')
assert.equal(
  concludeFinaleCollisionFromJournal(afterE11, 'e12', roadRoute),
  null,
  'the Last Door needs a verdict and a final choice',
)
assert.equal(
  concludeFinaleCollisionFromJournal(afterE11, 'e12', roadRoute, {
    verdict: 'not-a-verdict',
    last: 'repair-with-consent',
  }),
  null,
)
const finished = concludeFinaleCollisionFromJournal(
  afterE11,
  'e12',
  roadRoute,
  {
    verdict: MEMORY_PAIR_ENDINGS.e12[0]!.id,
    last: 'repair-with-consent',
  },
)
assert.ok(finished, 'the Last Door completes e12')
assert.ok(finished.completed.includes('e12'))
assert.ok(memoryCoreEnding(finished))

const endings = new Set<number>()
for (const e02 of MEMORY_PAIR_ENDINGS.e02)
  for (const e04 of MEMORY_PAIR_ENDINGS.e04)
    for (const e06 of MEMORY_PAIR_ENDINGS.e06)
      for (const e08 of MEMORY_PAIR_ENDINGS.e08)
        for (const last of MEMORY_LAST_CHOICE) {
          const start = afterE10({
            e02: e02.id,
            e04: e04.id,
            e06: e06.id,
            e08: e08.id,
          })
          const sea = concludeFinaleCollisionFromJournal(start, 'e11', seaRoute)
          assert.ok(sea)
          const end = concludeFinaleCollisionFromJournal(
            sea,
            'e12',
            roadRoute,
            {
              verdict: MEMORY_PAIR_ENDINGS.e12[1]!.id,
              last: last.id as MemoryLastChoice,
            },
          )
          assert.ok(end)
          const id = memoryCoreEndingId(end)
          assert.notEqual(id, null)
          endings.add(id!)
          assert.ok(memoryCoreEnding(end)!.title.length > 0)
        }
assert.equal(endings.size, 32, 'all 32 core endings are reachable')

const page = readFileSync('components/pages/memory-dungeon.vue', 'utf8')
const consoleView = readFileSync(
  'components/pages/memory-dungeon-finale-collision.vue',
  'utf8',
)
assert.ok(page.includes('world="e11"') && page.includes('world="e12"'))
assert.ok(consoleView.includes('data-testid="memory-finale-ending"'))
assert.ok(consoleView.includes('collision.chooseVerdict(choice.id)'))
assert.ok(consoleView.includes('collision.conclude(choice.id)'))

console.log(
  'Memory finale e11/e12: gated unlocks, replay-only fragments, Last Door verdict and final choice, 32/32 core endings reachable',
)
