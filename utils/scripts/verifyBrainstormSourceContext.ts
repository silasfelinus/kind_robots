// /utils/scripts/verifyBrainstormSourceContext.ts
//
// conductor brainstorm/t-013: Character-aware brainstorming.
//
// formatCharacterContext lives in brainstormSourceContextKit.ts, which is
// deliberately Prisma/Nuxt-alias-free, so it can be exercised directly here
// without a live database -- resolving the same "this sandbox has no
// reachable DATABASE_URL" constraint documented repeatedly across this
// repo's other verify scripts (verifyBrainstormSourceAdapters.test.ts's own
// header comment). The fetch+canView half of brainstormSourceContext.ts
// (resolveBrainstormSourceContext) needs a live Nuxt/Prisma runtime and is
// exercised only via the fragile source-string checks below, same pattern
// as the adapter test.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  formatCharacterContext,
  formatDreamContext,
  formatScenarioContext,
} from '../../server/utils/brainstorm/brainstormSourceContextKit'

const full = formatCharacterContext({
  name: 'Ami',
  honorific: 'butterfly guide',
  title: null,
  role: null,
  class: 'Wayfinder',
  species: 'butterfly-person',
  gender: null,
  alignment: null,
  genre: null,
  personality: 'cheerful and curious',
  voice: 'speaks in short, warm sentences',
  drive: 'wants everyone to feel welcome',
  quirks: 'hums when thinking',
  backstory: 'Found the Nexus as a lost seed and never left.',
})
assert.match(full, /^Character: Ami \(butterfly guide\)\./)
assert.match(full, /Traits: class: Wayfinder \| species: butterfly-person\./)
assert.match(
  full,
  /Voice: personality: cheerful and curious \| voice: speaks in short, warm sentences \| drive: wants everyone to feel welcome \| quirks: hums when thinking\./,
)
assert.match(full, /Backstory: Found the Nexus as a lost seed and never left\./)

const sparse = formatCharacterContext({ name: 'Squiddy Coltrane' })
assert.equal(
  sparse,
  'Character: Squiddy Coltrane.',
  'a Character with no optional fields must still produce a usable one-line summary, no empty "Traits:"/"Voice:" labels',
)
assert.doesNotMatch(sparse, /Traits:|Voice:|Backstory:/)

const longBackstory = formatCharacterContext({
  name: 'Overlong',
  backstory: 'x'.repeat(5_000),
})
assert.ok(
  longBackstory.length <= 2_000,
  'the composed context must stay bounded so one Character cannot blow out the prompt budget',
)

const partial = formatCharacterContext({
  name: 'Old Komodo',
  honorific: null,
  title: 'Keeper of the Slow Fire',
  species: 'komodo dragon',
})
assert.match(partial, /^Character: Old Komodo \(Keeper of the Slow Fire\)\./)
assert.match(partial, /Traits: species: komodo dragon\./)
assert.doesNotMatch(partial, /Voice:|Backstory:/)

// conductor brainstorm/t-014: Dream-aware brainstorming.
const dreamFull = formatDreamContext({
  title: 'The Hollow Lantern Market',
  dreamType: 'LOCATION',
  description: 'A night market that only opens when someone is lost.',
  pitch: 'A market of second chances for the truly lost.',
  flavorText: 'Smells of rain-warm lanterns and someone else’s home cooking.',
  artPrompt: 'glowing paper lanterns over wet cobblestones, warm gold light',
  Characters: [{ name: 'Wick the Lampkeeper' }, { name: 'Old Marrow' }],
  Rewards: [{ name: 'Borrowed Ember', rewardType: 'ITEM' }],
  Scenarios: [
    {
      title: 'The Vanishing Stall',
      description: 'A stall that sells exactly what you fear losing next.',
      locations: 'the market’s furthest, quietest row',
      tier: 'uncanny',
      difficulty: 2,
    },
  ],
})
assert.match(dreamFull, /^Dream: The Hollow Lantern Market \(location\)\./)
assert.match(
  dreamFull,
  /Premise: A market of second chances for the truly lost\. \| A night market that only opens when someone is lost\./,
)
assert.match(
  dreamFull,
  /Sensory detail: Smells of rain-warm lanterns and someone else’s home cooking\./,
)
assert.ok(
  dreamFull.includes(
    'Visual concept: glowing paper lanterns over wet cobblestones, warm gold light',
  ),
  'artPrompt (freeform prose, no forced trailing period) must surface as a Visual concept line',
)
assert.match(dreamFull, /Characters: Wick the Lampkeeper, Old Marrow\./)
assert.match(dreamFull, /Rewards: Borrowed Ember \(item\)\./)
assert.ok(
  dreamFull.includes(
    'Locations, encounters and threats: The Vanishing Stall @ the market’s furthest, quietest row (tier: uncanny | difficulty: 2) | A stall that sells exactly what you fear losing next.',
  ),
  'the Scenarios linked to a Dream must surface as a combined locations/encounters/threats line',
)

const dreamSparse = formatDreamContext({
  title: 'Untitled Wish',
  dreamType: 'WISH',
})
assert.equal(
  dreamSparse,
  'Dream: Untitled Wish (wish).',
  'a Dream with no optional fields or links must still produce a usable one-line summary',
)
assert.doesNotMatch(
  dreamSparse,
  /Premise:|Sensory detail:|Visual concept:|Characters:|Rewards:|Locations,/,
)

const dreamOverlong = formatDreamContext({
  title: 'Overlong',
  dreamType: 'PITCH',
  description: 'x'.repeat(5_000),
})
assert.ok(
  dreamOverlong.length <= 2_000,
  'the composed Dream context must stay bounded so one richly-linked Dream cannot blow out the prompt budget',
)

// conductor brainstorm/t-014: Scenario as a second lightweight adapter.
const scenarioFull = formatScenarioContext({
  title: 'The Vanishing Stall',
  description: 'A stall that sells exactly what you fear losing next.',
  locations: 'the market’s furthest, quietest row',
  tier: 'uncanny',
  difficulty: 2,
  genres: 'urban fantasy, mystery',
  Characters: [{ name: 'Old Marrow' }],
})
assert.ok(
  scenarioFull.startsWith(
    'Scenario: The Vanishing Stall @ the market’s furthest, quietest row (tier: uncanny | difficulty: 2) | A stall that sells exactly what you fear losing next.',
  ),
  'formatScenarioContext must lead with the same location/tier/difficulty/description line formatDreamContext composes for a linked Scenario',
)
assert.match(scenarioFull, /Genre: urban fantasy, mystery\./)
assert.match(scenarioFull, /Characters: Old Marrow\./)

const scenarioSparse = formatScenarioContext({ title: 'Bare Room' })
assert.equal(
  scenarioSparse,
  'Scenario: Bare Room.',
  'a Scenario with no optional fields must still produce a usable one-line summary',
)

// The fetch+canView dispatch half needs a live database -- assert its
// contract directly against the source, same pattern
// verifyBrainstormSourceAdapters.test.ts uses for the client-side registry.
const contextSource = readFileSync(
  resolve(process.cwd(), 'server/utils/brainstorm/brainstormSourceContext.ts'),
  'utf8',
)
assert.ok(
  contextSource.includes('await canView(character, null, viewer)'),
  'characterContext must revalidate view authorization on every resolve, not trust that the caller already checked it',
)
assert.ok(
  contextSource.includes('await canView(dream, null, viewer)'),
  'dreamContext must revalidate view authorization on every resolve, not trust that the caller already checked it',
)
assert.ok(
  contextSource.includes('await canView(scenario, null, viewer)'),
  'scenarioContext must revalidate view authorization on every resolve, even though the scenarios/:id.get route itself applies no record-level check today',
)
assert.ok(
  contextSource.includes('character: characterContext'),
  'the resolver registry must register a character entry',
)
assert.ok(
  contextSource.includes('dream: dreamContext'),
  'the resolver registry must register a dream entry',
)
assert.ok(
  contextSource.includes('scenario: scenarioContext'),
  'the resolver registry must register a scenario entry',
)
assert.ok(
  /catch \(error\) \{[\s\S]*?return null/.test(contextSource),
  'resolveBrainstormSourceContext must degrade to null on any resolver failure, never throw and fail the whole generation request',
)

console.log(
  'Brainstorm source context contract passed: Character, Dream, and Scenario grounding (brainstorm/t-013, t-014).',
)
