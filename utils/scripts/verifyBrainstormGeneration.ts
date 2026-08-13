import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  normalizeBrainstormCandidates,
  parseBrainstormProviderOutput,
} from '../../server/utils/brainstorm/brainstormParser'
import {
  brainstormJsonSchema,
  buildBrainstormPrompts,
} from '../../server/utils/brainstorm/brainstormPrompt'
import { brainstormProviderApiKey } from '../../server/utils/brainstorm/brainstormProvider'
import { deriveSuggestProvider } from '../../server/utils/suggest/suggestProviders'

const direct = parseBrainstormProviderOutput(
  JSON.stringify({
    candidates: [
      { title: 'Glass Choir', text: 'A choir performs with sugar-glass mouths that shatter on the high notes.' },
      { title: 'Borrowed Shadows', text: 'People rent better shadows for important social occasions.' },
    ],
  }),
  2,
)
assert.equal(direct?.candidates.length, 2)
assert.equal(direct?.candidates[0]?.title, 'Glass Choir')

const fencedLegacy = parseBrainstormProviderOutput(
  '```json\n{"ideas":[{"title":"A","pitch":"First mechanism."},{"title":"B","pitch":"Second mechanism."}]}\n```',
  2,
)
assert.deepEqual(
  fencedLegacy?.candidates.map((candidate) => candidate.text),
  ['First mechanism.', 'Second mechanism.'],
)

const wrapped = parseBrainstormProviderOutput(
  'Here is the JSON you requested: {"candidates":[{"title":"A","text":"One clear concept."}]} Thanks!',
  1,
)
assert.equal(wrapped?.candidates[0]?.text, 'One clear concept.')

const arrayOnly = parseBrainstormProviderOutput(
  '[{"title":"A","text":"Array output remains structured."}]',
  1,
)
assert.equal(arrayOnly?.candidates.length, 1)

assert.equal(
  normalizeBrainstormCandidates(
    {
      candidates: [
        { title: 'A', text: 'Exactly the same idea.' },
        { title: 'B', text: 'Exactly the same idea!' },
      ],
    },
    2,
  ),
  null,
  'punctuation-only duplicates must be rejected',
)

assert.equal(
  parseBrainstormProviderOutput(
    '{"candidates":[{"title":"Only","text":"Only one candidate."}]}',
    2,
  ),
  null,
  'short batches must be rejected',
)

assert.equal(
  parseBrainstormProviderOutput('- Idea one\n- Idea two\n- Idea three', 3),
  null,
  'Brainstorm must never fall back to prose-line parsing',
)

const prompts = buildBrainstormPrompts({
  premise: 'Invent terrible ice cream flavors',
  count: 8,
  constraints: 'They should have an actual comic premise.',
  examples: ['Pralines and Glass'],
  mode: 'freeform',
  source: null,
})
assert.match(prompts.systemPrompt, /Do not confuse safe with bland/i)
assert.match(prompts.systemPrompt, /Random weird nouns are not a substitute for a joke/i)
assert.match(prompts.systemPrompt, /corporate naming sludge/i)
assert.match(prompts.systemPrompt, /dark-humor/i)
assert.match(prompts.systemPrompt, /dad-joke/i)
assert.match(prompts.userPrompt, /Pralines and Glass/)
assert.match(prompts.userPrompt, /Batch shape: FOCUSED/)
assert.doesNotMatch(prompts.userPrompt, /Creative direction:/)
assert.doesNotMatch(prompts.systemPrompt, /Haunted Fitness Tracker|Misfortune Cookies/i)
assert.doesNotMatch(prompts.userPrompt, /Haunted Fitness Tracker|Misfortune Cookies/i)

const darkerFunny = buildBrainstormPrompts({
  premise: 'Invent family-friendly improv scenes with cartoon peril',
  count: 6,
  mode: 'darker-funnier',
  source: null,
})
assert.match(darkerFunny.userPrompt, /sharper comic premises/i)
assert.match(darkerFunny.userPrompt, /cartoon peril/i)
assert.match(darkerFunny.userPrompt, /Do not substitute cruelty, shock value, or random grossness/i)
assert.doesNotMatch(darkerFunny.userPrompt, /Creative direction: darker-funnier/)

const stranger = buildBrainstormPrompts({
  premise: 'Invent unusual uses for a waiting room',
  count: 4,
  mode: 'stranger',
  source: null,
})
assert.match(stranger.userPrompt, /Push past the first obvious answers/i)
assert.match(stranger.userPrompt, /staying meaningfully connected to the premise/i)

const invert = buildBrainstormPrompts({
  premise: 'Invent a school fundraiser',
  count: 4,
  mode: 'invert',
  source: null,
})
assert.match(invert.userPrompt, /Reverse a central assumption, role, incentive/i)

const customDirection = buildBrainstormPrompts({
  premise: 'Invent tiny mysteries',
  count: 3,
  mode: 'Make every idea hinge on a misunderstanding.',
  source: null,
})
assert.match(
  customDirection.userPrompt,
  /Creative direction: Make every idea hinge on a misunderstanding\./,
  'unknown direction text should remain usable as a future/custom creative instruction',
)

const adaptiveAssortment = buildBrainstormPrompts({
  premise: 'Invent bad ice cream flavors',
  count: 6,
  mode: 'darker-funnier',
  batchShape: 'assortment',
  returnTypes: [],
  source: null,
})
assert.match(adaptiveAssortment.userPrompt, /Batch shape: ASSORTMENT/)
assert.match(adaptiveAssortment.userPrompt, /at least 3 distinct returnType labels/i)
assert.match(adaptiveAssortment.userPrompt, /fit the actual premise/i)

const selectedAssortment = buildBrainstormPrompts({
  premise: 'Give me several ways to answer this joke premise',
  count: 6,
  mode: 'freeform',
  batchShape: 'assortment',
  returnTypes: [
    { id: 'dark-humor', count: 2 },
    { id: 'dry-observation', count: 2 },
    { id: 'pun' },
  ],
  source: null,
})
assert.match(selectedAssortment.userPrompt, /Dark humor ×2/)
assert.match(selectedAssortment.userPrompt, /Dry observation ×2/)
assert.match(selectedAssortment.userPrompt, /Auto lenses: Pun \/ wordplay/)
assert.match(selectedAssortment.userPrompt, /1 remaining wildcard slot/)

const validSelectedMix = normalizeBrainstormCandidates(
  {
    candidates: [
      { title: 'D1', text: 'A dark mechanism with enough detail to remain distinct.', returnType: 'dark-humor' },
      { title: 'D2', text: 'Another darker premise using a completely different comic mechanism.', returnType: 'dark-humor' },
      { title: 'Dry1', text: 'An underplayed observation about the premise and its mundane consequence.', returnType: 'dry-observation' },
      { title: 'Dry2', text: 'A second deadpan angle that notices a different social detail entirely.', returnType: 'dry-observation' },
      { title: 'Pun', text: 'A language-driven answer whose wordplay changes the premise itself.', returnType: 'pun' },
      { title: 'Wild', text: 'A surprising inversion that attacks the setup from the opposite incentive.', returnType: 'inversion' },
    ],
  },
  6,
  {
    batchShape: 'assortment',
    returnTypes: [
      { id: 'dark-humor', count: 2 },
      { id: 'dry-observation', count: 2 },
      { id: 'pun' },
    ],
  },
)
assert.equal(validSelectedMix?.length, 6)

assert.equal(
  normalizeBrainstormCandidates(
    {
      candidates: [
        { title: 'D1', text: 'A dark response built from mechanism number one.', returnType: 'dark-humor' },
        { title: 'Dry1', text: 'A dry response built from a different observation.', returnType: 'dry-observation' },
        { title: 'Dry2', text: 'Another dry response centered on a separate social consequence.', returnType: 'dry-observation' },
        { title: 'Pun', text: 'A pun that turns the key noun into a useful double meaning.', returnType: 'pun' },
        { title: 'Wild1', text: 'A left-field answer that changes who benefits from the setup.', returnType: 'left-field' },
        { title: 'Wild2', text: 'An inversion that makes the expected victim responsible for the rule.', returnType: 'inversion' },
      ],
    },
    6,
    {
      batchShape: 'assortment',
      returnTypes: [
        { id: 'dark-humor', count: 2 },
        { id: 'dry-observation', count: 2 },
        { id: 'pun' },
      ],
    },
  ),
  null,
  'a pinned quota must be exact, not merely suggested',
)

assert.equal(
  normalizeBrainstormCandidates(
    {
      candidates: [
        { title: 'A', text: 'First adaptive angle with a distinct mechanism and consequence.', returnType: 'dry-observation' },
        { title: 'B', text: 'Second adaptive angle that uses an unrelated practical mechanism.', returnType: 'dry-observation' },
        { title: 'C', text: 'Third adaptive angle that still uses yet another observational frame.', returnType: 'dry-observation' },
      ],
    },
    3,
    { batchShape: 'assortment', returnTypes: [] },
  ),
  null,
  'adaptive assortment must actually diversify response lenses',
)

const schema = brainstormJsonSchema(4) as {
  properties?: {
    candidates?: {
      items?: {
        properties?: Record<string, unknown>
        required?: string[]
      }
    }
  }
}
assert.ok(schema.properties?.candidates?.items?.properties?.returnType)
assert.ok(schema.properties?.candidates?.items?.required?.includes('returnType'))

const replacement = buildBrainstormPrompts({
  premise: 'Invent stage deaths for a cartoonish improv game',
  count: 1,
  mode: 'freeform',
  batchShape: 'assortment',
  returnTypes: [{ id: 'dark-humor', count: 1 }],
  source: null,
  replaceCandidateId: 'candidate-1',
  referenceCandidate: {
    title: 'Weak idea',
    text: 'A piano falls on somebody.',
  },
  feedback: 'Too familiar. Find a stranger mechanism.',
})
assert.match(replacement.userPrompt, /Replacement task:/)
assert.match(replacement.userPrompt, /Dark humor ×1/)
assert.match(replacement.userPrompt, /Too familiar\. Find a stranger mechanism\./)

const ungrounded = buildBrainstormPrompts({
  premise: 'Invent art-prompt variations for this character',
  count: 4,
  mode: 'freeform',
  source: { modelType: 'character', id: 42 },
})
assert.doesNotMatch(
  ungrounded.userPrompt,
  /Grounded in this Kind Robots object/,
  'a source ref alone (no resolved context) must not add a grounding block',
)

const grounded = buildBrainstormPrompts(
  {
    premise: 'Invent art-prompt variations for this character',
    count: 4,
    mode: 'freeform',
    source: { modelType: 'character', id: 42 },
  },
  'Character: Ami (honorific: butterfly guide). Traits: species: butterfly-person. Voice: personality: cheerful and curious.',
)
assert.match(grounded.userPrompt, /Grounded in this Kind Robots object/)
assert.match(grounded.userPrompt, /Ami \(honorific: butterfly guide\)/)
assert.match(grounded.userPrompt, /do not contradict them, rename the subject/)

const groundedBlank = buildBrainstormPrompts(
  { premise: 'Invent something', count: 2, source: null },
  '   ',
)
assert.doesNotMatch(
  groundedBlank.userPrompt,
  /Grounded in this Kind Robots object/,
  'blank/whitespace-only context must not add an empty grounding block',
)

const branch = buildBrainstormPrompts({
  premise: 'Invent stage deaths for a cartoonish improv game',
  count: 1,
  mode: 'freeform',
  batchShape: 'assortment',
  returnTypes: [{ id: 'dark-humor', count: 1 }],
  source: null,
  parentCandidateId: 'candidate-1',
  referenceCandidate: {
    title: 'Useful idea',
    text: 'A character is slowly laminated during an argument.',
  },
})
assert.match(branch.userPrompt, /Branching task:/)

assert.equal(deriveSuggestProvider({ serverType: 'OPENAI' }), 'openai')
assert.equal(deriveSuggestProvider({ serverType: 'ANTHROPIC' }), 'anthropic')
assert.equal(deriveSuggestProvider({ serverType: 'OLLAMA' }), 'ollama')
assert.equal(deriveSuggestProvider({ serverType: 'CUSTOM' }), 'openai_compatible')
assert.equal(
  deriveSuggestProvider({
    serverType: 'OPENAI',
    baseUrl: 'https://api.openai.com',
  }),
  'openai',
)
assert.equal(
  deriveSuggestProvider({
    serverType: 'OPENAI',
    baseUrl: 'https://example.test/v1',
  }),
  'openai_compatible',
)

assert.equal(
  brainstormProviderApiKey('openai', {
    serverApiKey: 'server-openai',
    openaiApiKey: 'runtime-openai',
  }),
  'server-openai',
)
assert.equal(
  brainstormProviderApiKey('openai', { openaiApiKey: 'runtime-openai' }),
  'runtime-openai',
)
assert.equal(
  brainstormProviderApiKey('openai_compatible', {
    serverApiKey: 'custom-secret',
    openaiApiKey: 'runtime-openai',
  }),
  'custom-secret',
)
assert.equal(
  brainstormProviderApiKey('openai_compatible', {
    openaiApiKey: 'runtime-openai',
  }),
  undefined,
  'first-party OpenAI credentials must never be forwarded to a compatible URL',
)

const endpoint = readFileSync(
  resolve(process.cwd(), 'server/api/brainstorm/generate.post.ts'),
  'utf8',
)
assert.match(endpoint, /readServerById\(serverId\)/)
assert.match(endpoint, /canReadServer\(server, viewer\)/)
assert.match(endpoint, /assertBackendProviderAccess\(provider, server, viewer\)/)
assert.match(endpoint, /\['BROWSER', 'TAILSCALE', 'LOCAL'\]/)
assert.match(endpoint, /!server\.isPublic &&[\s\S]*?!server\.isOfficial &&[\s\S]*?!server\.isDefault/)
assert.match(endpoint, /normalizedReturnTypes\(body\.returnTypes, batchShape, count\)/)
assert.match(endpoint, /manaGate\(event/)
assert.match(endpoint, /parseBrainstormProviderOutput\(raw, request\.count, request\)/)
assert.match(endpoint, /errorHandler\(error\)/)
assert.match(
  endpoint,
  /resolveBrainstormSourceContext\(\s*\n?\s*request\.source,\s*\n?\s*viewer,?\s*\n?\s*\)/,
  'the source ref must be resolved server-side (with the authenticated viewer, for the canView check) before prompts are built',
)
assert.match(
  endpoint,
  /buildBrainstormPrompts\(\s*\n?\s*request,\s*\n?\s*sourceContext,?\s*\n?\s*\)/,
  'the resolved source context must actually reach buildBrainstormPrompts',
)
assert.doesNotMatch(endpoint, /body\.server\?\.baseUrl/)
assert.doesNotMatch(endpoint, /body\.server\?\.endpointPath/)

const suggestEndpoint = readFileSync(
  resolve(process.cwd(), 'server/api/suggest.post.ts'),
  'utf8',
)
assert.match(
  suggestEndpoint,
  /provider === 'openai'[\s\S]*?str\(config\.openaiApiKey\)[\s\S]*?: undefined/,
  'first-party OpenAI keys must not fall through to arbitrary compatible URLs',
)

console.log('Brainstorm generation contract passed.')
