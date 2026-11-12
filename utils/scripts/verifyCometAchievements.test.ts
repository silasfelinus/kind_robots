// Prom of Doom achievements: what an action newly earns, and that loading or
// importing a save earns nothing (utils/cometAcademy/achievements.ts).

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import { CAMPAIGN_VILLAINS, campaignVillain } from '../cometAcademy/campaign'
import { PROM_ENDINGS } from '../cometAcademy/artSlots'
import { fieldFor } from '../cometAcademy/identityArcs'
import { startFullAcademy, type AcademyRun } from '../cometAcademy/rules'
import {
  NO_ACADEMY_FACTS,
  academyDeedAchievements,
  academyDeedFacts,
  yearbookAchievements,
  yearbookFacts,
} from '../cometAcademy/achievements'

const catalog = new Set(
  achievementsForGame('comet-city-academy').map((entry) => entry.code),
)
assert.ok(catalog.size >= 12, 'Prom of Doom carries 12 or more achievements.')
const known = (codes: string[]) => {
  for (const code of codes)
    assert.ok(catalog.has(code), `${code} is not in the catalog.`)
  return codes
}

const SIGNATURE = 'accident-fire' as const
const fresh = startFullAcademy(fieldFor(SIGNATURE), 7, SIGNATURE, 'shelter')
const start = academyDeedFacts(fresh)
assert.deepEqual(academyDeedFacts(null), NO_ACADEMY_FACTS)
assert.deepEqual(academyDeedAchievements(NO_ACADEMY_FACTS, start), [])

const ended = (run: AcademyRun, ending: string): AcademyRun => ({
  ...run,
  phase: 'ending',
  ending,
})

// Every ending earns its code once, at the action that reaches it.
for (const ending of PROM_ENDINGS) {
  const facts = academyDeedFacts(ended(fresh, ending))
  const codes = known(academyDeedAchievements(start, facts))
  assert.deepEqual(
    academyDeedAchievements(facts, facts),
    [],
    `${ending} is not earned twice`,
  )
  const simulation = /SIMULATION|RESCUE THAT COUNTED|UNEXPECTED REBOOT/.test(
    ending,
  )
  assert.equal(
    codes.includes('comet-city-academy-graduated'),
    !simulation,
    `${ending}: graduation is the real prom only`,
  )
}
assert.deepEqual(
  academyDeedAchievements(
    start,
    academyDeedFacts(ended(fresh, 'A CITY WITH A THOUSAND KEYS')),
  ),
  ['comet-city-academy-graduated', 'comet-city-academy-thousand-keys'],
)
assert.ok(
  academyDeedAchievements(
    start,
    academyDeedFacts(ended(fresh, 'THE BROKEN GRID')),
  ).includes('comet-city-academy-collateral'),
)

// A new term compares against nothing, not against the last term's facts.
const otherTerm = academyDeedFacts({
  ...ended(fresh, 'MASTER OF THE SHIELD'),
  seed: 8,
})
assert.deepEqual(
  academyDeedAchievements(
    academyDeedFacts(ended(fresh, 'MASTER OF THE SHIELD')),
    otherTerm,
  ),
  ['comet-city-academy-graduated', 'comet-city-academy-master-shield'],
)

const villain = campaignVillain(fresh.seed, fresh.mastermind)
const wrong = CAMPAIGN_VILLAINS.find((entry) => entry.id !== villain.id)!
assert.deepEqual(
  academyDeedAchievements(
    start,
    academyDeedFacts({ ...fresh, suspect: { id: villain.id, day: 6 } }),
  ),
  ['comet-city-academy-unmasked'],
)
assert.deepEqual(
  academyDeedAchievements(
    start,
    academyDeedFacts({ ...fresh, suspect: { id: wrong.id, day: 6 } }),
  ),
  [],
)

const fight = {
  day: 4,
  caseId: 'case',
  opponent: SIGNATURE,
  role: 'hero' as const,
  turns: 5,
  fallen: 0,
}
assert.deepEqual(
  known(
    academyDeedAchievements(
      start,
      academyDeedFacts({
        ...fresh,
        tacticalHistory: [
          { ...fight, grade: 'honors', lieutenantParley: 'ally' },
        ],
      }),
    ),
  ),
  ['comet-city-academy-honors-fight', 'comet-city-academy-parley'],
)
assert.deepEqual(
  academyDeedAchievements(
    start,
    academyDeedFacts({
      ...fresh,
      tacticalHistory: [{ ...fight, grade: 'pass', lieutenantParley: 'truce' }],
    }),
  ),
  [],
)
assert.deepEqual(
  known(
    academyDeedAchievements(
      start,
      academyDeedFacts({
        ...fresh,
        betrayal: { day: 9, person: 'mina', status: 'reconciled' },
      }),
    ),
  ),
  ['comet-city-academy-reconciled'],
)

// Yearbook milestones.
const empty = yearbookFacts({}, [])
const entry = (endings: string[], forms: string[] = []) => ({
  plays: 1,
  forms,
  endings,
})
assert.deepEqual(
  known(
    yearbookAchievements(empty, yearbookFacts({ a: entry([], ['hero']) }, [])),
  ),
  ['comet-city-academy-mantle'],
)
const everyEnding = yearbookFacts(
  {
    a: entry([...PROM_ENDINGS].slice(0, 6)),
    b: entry([...PROM_ENDINGS].slice(6)),
  },
  [],
)
assert.deepEqual(
  known(
    yearbookAchievements(
      yearbookFacts({ a: entry([...PROM_ENDINGS].slice(0, 6)) }, []),
      everyEnding,
    ),
  ),
  ['comet-city-academy-all-endings'],
)
assert.deepEqual(yearbookAchievements(everyEnding, everyEnding), [])
const fiveFaces = Object.fromEntries(
  ['a', 'b', 'c', 'd', 'e'].map((key) => [key, entry(['THE BROKEN GRID'])]),
)
assert.deepEqual(
  known(yearbookAchievements(empty, yearbookFacts(fiveFaces, []))),
  ['comet-city-academy-many-faces'],
)
assert.deepEqual(
  known(
    yearbookAchievements(
      empty,
      yearbookFacts(
        {},
        CAMPAIGN_VILLAINS.map((entry) => entry.id),
      ),
    ),
  ),
  ['comet-city-academy-dossiers'],
)

// The store: actions award through persist(); load and import only reset the
// snapshot, so a restored finished term earns nothing.
const store = readFileSync('stores/cometAcademyStore.ts', 'utf8')
const fn = (name: string) => {
  const start = store.indexOf(`function ${name}(`)
  assert.ok(start >= 0, `${name} exists`)
  return store.slice(start, store.indexOf('\n  }\n', start))
}
assert.ok(fn('persist').includes('awardDeeds(before)'))
assert.ok(fn('load').includes('deedFacts = academyDeedFacts(run.value)'))
assert.ok(!fn('load').includes('award('))
assert.ok(fn('importSave').includes('deedFacts = academyDeedFacts(restored)'))
assert.ok(
  fn('importSave').indexOf('deedFacts =') <
    fn('importSave').indexOf('persist()'),
  'importSave resets the snapshot before persisting',
)
for (const name of ['begin', 'beginFirstWeek'])
  assert.ok(fn(name).includes("award('comet-city-academy-enrolled')"))

console.log(`Prom of Doom achievements passed: ${catalog.size} achievements.`)
