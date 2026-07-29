import assert from 'node:assert/strict'
import { buildSuggestUserPrompt } from '../../server/utils/suggest/suggestPrompt'
import { getSuggestSheet } from '../../server/utils/suggest/suggestRegistry'

const sheet = getSuggestSheet('art-asset')

assert.equal(sheet.builder, 'art-asset')
assert.match(sheet.systemPrompt, /project goal, description, notes, milestones/i)
assert.match(sheet.systemPrompt, /Do not invent a person, face, portrait/i)
assert.match(sheet.systemPrompt, /Do not default to robots/i)

const prompt = buildSuggestUserPrompt(sheet, {
  builder: 'art-asset',
  field: 'prompt',
  stepKey: 'missing-art',
  context: {
    subject: 'Model Builder',
    purpose: 'Landscape hero artwork for a software model-building workspace',
    asset: {
      source: '/images/projects/model-builder-hero.webp',
      role: 'heroPath',
      variant: 'hero',
      size: '1280x720',
    },
    project: {
      title: 'Model Builder',
      kind: 'software',
      goal: 'Turn existing Kind Robots records into grounded new models.',
      description:
        'A guided workspace for selecting source canon, recipes, output fields, and generated art.',
      milestones: ['Source selection', 'Recipe planning', 'Output validation'],
      tasks: ['Build source-aware recipes', 'Generate schema-ready output'],
    },
    page: {
      title: 'Kind Robots Projects',
      heading: 'Model Builder',
      localText: 'Model Builder — assemble new records from existing canon.',
    },
  },
})

assert.match(prompt, /16:9 landscape hero/i)
assert.match(prompt, /Project goal: Turn existing Kind Robots records/i)
assert.match(prompt, /Project description: A guided workspace/i)
assert.match(prompt, /Major milestones: Source selection/i)
assert.match(prompt, /Representative tasks: Build source-aware recipes/i)
assert.match(prompt, /Local component text: Model Builder/i)
assert.doesNotMatch(prompt, /Generate an appropriate value for/i)

const iconPrompt = buildSuggestUserPrompt(sheet, {
  builder: 'art-asset',
  field: 'prompt',
  context: {
    subject: 'Animation Manager',
    asset: { variant: 'icon', size: '256x256' },
  },
})

assert.match(iconPrompt, /square application icon/i)
assert.match(iconPrompt, /55–95 words/i)

console.log('Missing-art suggest sheet and structured-context contract passed.')
