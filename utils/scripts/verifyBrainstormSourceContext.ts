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
import { formatCharacterContext } from '../../server/utils/brainstorm/brainstormSourceContextKit'

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
  contextSource.includes('character: characterContext'),
  'the resolver registry must register a character entry',
)
assert.ok(
  /catch \(error\) \{[\s\S]*?return null/.test(contextSource),
  'resolveBrainstormSourceContext must degrade to null on any resolver failure, never throw and fail the whole generation request',
)

console.log('Brainstorm source context contract passed.')
