import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  normalizeBrainstormCandidates,
  parseBrainstormProviderOutput,
} from '../../server/utils/brainstorm/brainstormParser'
import { buildBrainstormPrompts } from '../../server/utils/brainstorm/brainstormPrompt'
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
assert.match(prompts.userPrompt, /Pralines and Glass/)
assert.doesNotMatch(prompts.systemPrompt, /Haunted Fitness Tracker|Misfortune Cookies/i)
assert.doesNotMatch(prompts.userPrompt, /Haunted Fitness Tracker|Misfortune Cookies/i)

const replacement = buildBrainstormPrompts({
  premise: 'Invent stage deaths for a cartoonish improv game',
  count: 1,
  mode: 'freeform',
  source: null,
  replaceCandidateId: 'candidate-1',
  referenceCandidate: {
    title: 'Weak idea',
    text: 'A piano falls on somebody.',
  },
  feedback: 'Too familiar. Find a stranger mechanism.',
})
assert.match(replacement.userPrompt, /Replacement task:/)
assert.match(replacement.userPrompt, /Too familiar\. Find a stranger mechanism\./)

const branch = buildBrainstormPrompts({
  premise: 'Invent stage deaths for a cartoonish improv game',
  count: 1,
  mode: 'freeform',
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
assert.match(endpoint, /manaGate\(event/)
assert.match(endpoint, /parseBrainstormProviderOutput\(raw, request\.count\)/)
assert.match(endpoint, /errorHandler\(error\)/)
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
