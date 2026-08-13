// /utils/scripts/verifyPopulationCasting.ts
//
// Connection is a gate, and the gate has an order.
//
// WHY
// ---
// Silas set the rules for who may speak on what: Characters comment on people
// they have an affinity with, "most are connected by a Dream, but if not, a
// facet genre would work"; Dreams and Scenarios get "commented by someone
// connected to them"; Projects pair with promptbots "since they also are built
// for utility, not personality."
//
// Those are cheap to satisfy accidentally and expensive to notice breaking. A
// regression here does not throw -- it just quietly casts a stranger, and the
// result still reads as a comment. The facet lane shipped 72 facets cast on
// coincidental word overlap before anyone worked out that relationshipScore had
// been returning 0 the whole time.
//
// So this pins the behaviour that makes the difference:
//   1. a shared Dream outranks a shared genre;
//   2. an exact genre outranks a token genre;
//   3. Projects admit promptbots and nobody else;
//   4. the genre tokeniser joins "Weird West"/"Weird Western" and splits
//      "WeirdCore", but does NOT connect everything through the shared suffixes
//      that half the catalogue carries;
//   5. an object is never its own connection.
//
//   npx tsx utils/scripts/verifyPopulationCasting.ts
import assert from 'node:assert/strict'
import {
  buildCastingIndex,
  connectionsFor,
  genreTokens,
} from './../../utils/comments/populationCasting'
import {
  isEligiblePopulationRow,
  orderPopulationTargets,
  populationSelfSpeaker,
  populationShapeFor,
} from './../../utils/comments/populationTargets'

// ------------------------------------------------------------------ fixtures

const characters = [
  { id: 1, name: 'Alpha', genre: 'Weird West', personality: 'terse' },
  { id: 2, name: 'Beta', genre: 'Weird West', personality: 'loud' },
  { id: 3, name: 'Gamma', genre: 'Weird Western', personality: 'sly' },
  { id: 4, name: 'Delta', genre: 'Hopepunk', personality: 'kind' },
  { id: 5, name: 'Epsilon', genre: 'Kaiju', personality: 'vast' },
]

const bots = [
  { id: 10, name: 'Utility One', BotType: 'PROMPTBOT', botIntro: 'helps' },
  { id: 11, name: 'Utility Two', BotType: 'PROMPTBOT', botIntro: 'helps' },
  { id: 12, name: 'Teller', BotType: 'NARRATOR', botIntro: 'narrates' },
  { id: 13, name: 'Second Teller', BotType: 'NARRATOR', botIntro: 'narrates' },
]

// Alpha and Delta share a Dream. Alpha ALSO shares a genre with Beta, which is
// the whole point of the first assertion: the Dream must win.
const dreams = [
  {
    id: 100,
    title: 'The Shared One',
    pitch: 'two of them, together',
    Characters: [{ id: 1 }, { id: 4 }],
    Bots: [{ id: 12 }],
    Scenarios: [{ id: 200 }],
  },
  { id: 101, title: 'The Lonely One', pitch: 'nobody attached', Scenarios: [{ id: 201 }] },
]

const scenarios = [
  { id: 200, title: 'Has A Dream', description: 'x', Dreams: [{ id: 100 }], Facets: [] },
  { id: 201, title: 'Has Facets', description: 'x', Dreams: [], Facets: [{ id: 900 }] },
  { id: 202, title: 'Has Neither', description: 'x', Dreams: [], Facets: [] },
]

const facetCharacters = new Map<number, number[]>([[900, [5]]])

const index = buildCastingIndex({
  characters,
  bots,
  dreams,
  scenarios,
  facetCharacters,
})

const keys = (refs: { kind: string; id: number }[]) =>
  refs.map((ref) => `${ref.kind}:${ref.id}`).sort()

// ------------------------------------------------- 1. Dream outranks genre

const alpha = connectionsFor('CHARACTER', characters[0]!, index)
assert.equal(
  alpha.tier,
  'shared-dream',
  'Alpha shares a Dream with Delta AND a genre with Beta. The Dream must win -- "most are connected by a Dream, but IF NOT, a facet genre would work" is an order, not a menu.',
)
assert.deepEqual(
  keys(alpha.allowed),
  ['BOT:12', 'CHARACTER:4'],
  'a shared-Dream cast is everyone else in that Dream, bots included',
)
assert.ok(
  !alpha.allowed.some((ref) => ref.kind === 'CHARACTER' && ref.id === 1),
  'Alpha must not be offered as a commenter on Alpha',
)

// ------------------------------------------------- 2. exact outranks token

const beta = connectionsFor('CHARACTER', characters[1]!, index)
assert.equal(
  beta.tier,
  'genre-exact',
  'Beta has no Dream but shares "Weird West" exactly with Alpha',
)
assert.deepEqual(
  keys(beta.allowed),
  ['CHARACTER:1'],
  'an exact-genre cast must not be diluted with the looser token matches',
)

const gamma = connectionsFor('CHARACTER', characters[2]!, index)
assert.equal(
  gamma.tier,
  'genre-token',
  '"Weird Western" matches nobody exactly, but shares the token "weird" with the Weird West pair -- the case this tier exists for',
)
assert.ok(
  keys(gamma.allowed).includes('CHARACTER:1'),
  'the token tier must actually reach the near-spelling',
)

const epsilon = connectionsFor('CHARACTER', characters[4]!, index)
assert.equal(
  epsilon.tier,
  'unconnected',
  'Kaiju matches nobody by Dream, exact genre or token; that must be reported as unconnected rather than quietly widened',
)
assert.deepEqual(epsilon.allowed, [], 'an unconnected result carries no allow list')

// ------------------------------------------------------ 3. Projects: bots only

const project = connectionsFor(
  'PROJECT',
  { id: 300, title: 'A Tool', description: 'does a job' },
  index,
)
assert.equal(project.tier, 'promptbot', 'Projects pair with promptbots')
assert.deepEqual(
  keys(project.allowed),
  ['BOT:10', 'BOT:11'],
  'every PROMPTBOT and only PROMPTBOTs -- no NARRATOR may be admitted, and no Character may comment on a Project',
)

// -------------------------------------------------- 4. Dream + Scenario reach

const sharedDream = connectionsFor('DREAM', dreams[0]!, index)
assert.equal(sharedDream.tier, 'dream-cast', 'a Dream with a cast uses it directly')
assert.deepEqual(keys(sharedDream.allowed), ['BOT:12', 'CHARACTER:1', 'CHARACTER:4'])

// A Dream with no cast of its own goes to narrators, not to the characters its
// scenarios happen to touch. Every recorded Bot<->Dream link in production is a
// narrator and none is a promptbot, so this is the move the catalog already
// makes. Silas, 2026-08-13: "narrators are natural dream commenters."
const lonelyDream = connectionsFor('DREAM', dreams[1]!, index)
assert.equal(
  lonelyDream.tier,
  'narrator',
  'a Dream with no cast must fall to narrators, ranked above the scenario/character route',
)
assert.deepEqual(
  keys(lonelyDream.allowed),
  ['BOT:12', 'BOT:13'],
  'every narrator and only narrators -- a promptbot is a utility, not a voice of a world',
)

const facetScenario = connectionsFor('SCENARIO', scenarios[1]!, index)
assert.equal(facetScenario.tier, 'scenario-facet', 'a Scenario with facets reaches through them')
assert.deepEqual(keys(facetScenario.allowed), ['CHARACTER:5'])

const dreamScenario = connectionsFor('SCENARIO', scenarios[0]!, index)
assert.equal(
  dreamScenario.tier,
  'scenario-dream-cast',
  "a Scenario's Dream outranks its facets; the Dream carries real cast",
)

// Narrators close the remainder on Scenarios -- but BELOW the facet route, not
// above it. A character who IS Circus speaking on a Circus scenario is a real
// connection; any narrator is a weaker one. Promoting narrators here would
// trade 84 strong casts for 84 plausible ones.
assert.equal(
  facetScenario.tier,
  'scenario-facet',
  'a Scenario with a facet match must NOT be handed to a narrator instead; the facet match is the stronger connection',
)
const barrenScenario = connectionsFor('SCENARIO', scenarios[2]!, index)
assert.equal(
  barrenScenario.tier,
  'narrator',
  'a Scenario with neither a Dream nor facets falls to narrators rather than reporting unconnected',
)
assert.deepEqual(keys(barrenScenario.allowed), ['BOT:12', 'BOT:13'])

// -------------------------------------------------------- 5. the tokeniser

assert.ok(
  genreTokens('WeirdCore').has('weird'),
  'a pascal-joined genre must split, or WeirdCore never meets Weird West',
)
// Capitalised on purpose. `genreTokens('Somethingcore')` yields the single
// token "somethingcore" and never contains "core" at all, so asserting against
// the lowercase spelling passes whether or not the stopword list exists -- the
// first version of this check did exactly that and stayed green with the
// stopwords deleted. The camel split has to fire for the filter to be under test.
for (const [joined, suffix] of [
  ['WeirdCore', 'core'],
  ['HopePunk', 'punk'],
  ['VillainEra', 'era'],
] as const) {
  const tokens = genreTokens(joined)
  assert.ok(
    tokens.has(joined.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ')[0]!.toLowerCase()),
    `${joined} must split so its meaningful half survives`,
  )
  assert.ok(
    !tokens.has(suffix),
    `"${suffix}" is a suffix on half the catalogue. Matching on it connects everything to everything, which is the same as connecting nothing.`,
  )
}
assert.ok(
  !genreTokens('Hopepunk').has('kaiju'),
  'sanity: unrelated genres share no token',
)

// ------------------------------------------------------- 6. shape + ordering

assert.equal(populationShapeFor('BOT'), 'VISIT_REPLY')
assert.equal(populationShapeFor('CHARACTER'), 'VISIT_REPLY')
for (const type of ['DREAM', 'SCENARIO', 'PROJECT'] as const) {
  assert.equal(
    populationShapeFor(type),
    'SOLO',
    `${type} cannot speak for itself, so it cannot reply`,
  )
}
assert.deepEqual(populationSelfSpeaker('BOT', 7), { kind: 'BOT', id: 7 })
assert.deepEqual(populationSelfSpeaker('CHARACTER', 7), { kind: 'CHARACTER', id: 7 })
assert.equal(populationSelfSpeaker('DREAM', 7), null)

// Numeric, not lexical: a string sort puts 10 before 9 and shifts every later
// comment onto the wrong object.
const ordered = orderPopulationTargets([
  { type: 'SCENARIO' as const, id: 1 },
  { type: 'BOT' as const, id: 10 },
  { type: 'BOT' as const, id: 9 },
  { type: 'CHARACTER' as const, id: 2 },
])
assert.deepEqual(
  ordered.map((entry) => `${entry.type}:${entry.id}`),
  ['BOT:9', 'BOT:10', 'CHARACTER:2', 'SCENARIO:1'],
)

assert.ok(
  !isEligiblePopulationRow('DREAM', { id: 1, title: 'Titled', isPublic: true }),
  'a Dream with a title but no pitch, description or flavour gives a speaker nothing to react to, and a comment about nothing is filler',
)
assert.ok(
  isEligiblePopulationRow('DREAM', { id: 1, title: 'Titled', pitch: 'a real seed' }),
)
assert.ok(
  !isEligiblePopulationRow('BOT', { id: 1, name: 'Off', botIntro: 'x', allowReviews: false }),
  'allowReviews:false must exclude the row -- the owner said no',
)

console.log(
  'Population casting verified: Dream outranks genre, exact outranks token, Projects admit promptbots only, scenario stubs resolve, ordering is numeric.',
)
