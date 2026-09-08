import assert from 'node:assert/strict'
import { buildBrainstormPrompts } from '../../server/utils/brainstorm/brainstormPrompt'

const vanderbuilt = buildBrainstormPrompts({
  premise:
    "Tell me things about Vanderbuilt Lacrosse. Vanderbuilt Lacrosse is absurdly rich and comically out of touch. Vanderbuilt Lacrosse once returned a pony for his birthday because he didn't like the color.",
  count: 8,
  examples: [
    'Vanderbuilt Lacrosse has never paid income tax.',
    'Vanderbuilt Lacrosse once guessed that a gallon of milk cost "about a small diamond?"',
    "Vanderbuilt Lacrosse owns three countries that aren't on maps.",
    'Vanderbuilt Lacrosse has a timeshare on the moon.',
  ],
  mode: 'darker-funnier',
  source: null,
})

assert.match(vanderbuilt.userPrompt, /EXAMPLE CONTRACT/)
assert.match(vanderbuilt.userPrompt, /shared FORM.*target output contract/i)
assert.match(vanderbuilt.userPrompt, /terse one-sentence assertions/i)
assert.match(vanderbuilt.userPrompt, /Do not turn a one-line pattern into a paragraph/i)
assert.match(vanderbuilt.userPrompt, /CONTENT is already-used territory/i)
assert.match(vanderbuilt.userPrompt, /Do not reuse, paraphrase, explain, extend, sequel, or lightly remix/i)
assert.match(vanderbuilt.userPrompt, /This changes the comic angle, not the output shape established by the user examples/i)
assert.match(vanderbuilt.userPrompt, /compare them against every user example/i)
assert.doesNotMatch(
  vanderbuilt.userPrompt,
  /use as context, not a template to mechanically repeat/i,
  'examples must no longer be demoted to loose topical context',
)

assert.match(vanderbuilt.systemPrompt, /candidate text itself is the deliverable/i)
assert.match(vanderbuilt.systemPrompt, /Do not inflate a compact idea into a setup paragraph/i)
assert.match(vanderbuilt.systemPrompt, /ordinary whimsical absurdity is not dark humor/i)
assert.match(vanderbuilt.systemPrompt, /navigation metadata only/i)

const noExamples = buildBrainstormPrompts({
  premise: 'Invent a new playground game.',
  count: 4,
  mode: 'freeform',
  source: null,
})
assert.doesNotMatch(noExamples.userPrompt, /EXAMPLE CONTRACT/)

console.log('Brainstorm example contract checks passed')
