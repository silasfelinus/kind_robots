import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildSuggestUserPrompt } from '../../server/utils/suggest/suggestPrompt'
import { getSuggestSheet } from '../../server/utils/suggest/suggestRegistry'
import {
  ART_MODEL_TYPES,
  normalizeArtModelRef,
  normalizeArtModelType,
} from '../../utils/artModelContext'

const sheet = getSuggestSheet('art-asset')

assert.equal(sheet.builder, 'art-asset')
assert.equal(ART_MODEL_TYPES.length, 7)
assert.deepEqual(ART_MODEL_TYPES, [
  'project',
  'bot',
  'character',
  'dream',
  'scenario',
  'reward',
  'facet',
])
assert.equal(normalizeArtModelType('Characters'), 'character')
assert.equal(normalizeArtModelType('unknown'), null)
assert.deepEqual(normalizeArtModelRef({ type: 'Dreams', id: 42 }), {
  modelType: 'dream',
  id: 42,
})
assert.match(sheet.systemPrompt, /Project, Bot, Character, Dream, Scenario, Reward, or Facet/i)
assert.match(sheet.systemPrompt, /canonical model data as the source of truth/i)
assert.match(sheet.systemPrompt, /Bots and Characters: depict the canonical individual/i)
assert.match(sheet.systemPrompt, /Rewards: make the reward itself and its effect visually legible/i)
assert.match(sheet.systemPrompt, /Do not default to robots/i)

const projectPrompt = buildSuggestUserPrompt(sheet, {
  builder: 'art-asset',
  field: 'prompt',
  stepKey: 'model-art',
  context: {
    subject: 'Model Builder',
    purpose: 'Landscape hero artwork for a software model-building workspace',
    asset: {
      source: '/images/projects/model-builder-hero.webp',
      role: 'heroPath',
      variant: 'hero',
      size: '1280x720',
    },
    entity: {
      modelType: 'project',
      id: 17,
      slug: 'model-builder',
      title: 'Model Builder',
      fields: {
        goal: 'Turn existing Kind Robots records into grounded new models.',
        description:
          'A guided workspace for selecting source canon, recipes, output fields, and generated art.',
        flavorText: 'Assemble new records from established canon.',
      },
    },
    project: {
      notes: 'The interface should feel like a practical creative workbench.',
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

assert.match(projectPrompt, /16:9 landscape hero/i)
assert.match(projectPrompt, /Canonical model: project/i)
assert.match(projectPrompt, /Goal: Turn existing Kind Robots records/i)
assert.match(projectPrompt, /Description: A guided workspace/i)
assert.match(projectPrompt, /Major milestones: Source selection/i)
assert.match(projectPrompt, /Representative tasks: Build source-aware recipes/i)
assert.match(projectPrompt, /Local component text: Model Builder/i)
assert.doesNotMatch(projectPrompt, /Generate an appropriate value for/i)

const characterPrompt = buildSuggestUserPrompt(sheet, {
  builder: 'art-asset',
  field: 'prompt',
  context: {
    subject: 'Moss Lantern',
    asset: { variant: 'icon', size: '256x256' },
    entity: {
      modelType: 'character',
      id: 91,
      slug: 'moss-lantern',
      title: 'Moss Lantern',
      fields: {
        species: 'red panda',
        class: 'museum guide',
        presentation: 'patched teal coat and brass lantern',
        personality: 'warm, curious, quietly mischievous',
        quirks: 'collects ticket stubs and whispers to exhibits',
      },
    },
  },
})

assert.match(characterPrompt, /square avatar icon/i)
assert.match(characterPrompt, /Species: red panda/i)
assert.match(characterPrompt, /Presentation: patched teal coat/i)
assert.match(characterPrompt, /Personality: warm, curious/i)

const rewardPrompt = buildSuggestUserPrompt(sheet, {
  builder: 'art-asset',
  field: 'prompt',
  context: {
    subject: 'Pocket Thunderstorm',
    asset: { variant: 'image', size: '1024x1024' },
    entity: {
      modelType: 'reward',
      id: 203,
      title: 'Pocket Thunderstorm',
      fields: {
        rewardType: 'MAGIC',
        rarity: 'RARE',
        description: 'A stoppered glass bottle holding a living storm.',
        effect: 'Releases a brief cloudburst and crack of thunder.',
        flavorText: 'Weather with a cork in it.',
      },
    },
  },
})

assert.match(rewardPrompt, /Canonical model: reward/i)
assert.match(rewardPrompt, /Effect: Releases a brief cloudburst/i)
assert.match(rewardPrompt, /Rarity: RARE/i)

const resolverSource = readFileSync(
  new URL('../../server/utils/suggest/artModelContext.ts', import.meta.url),
  'utf8',
)
for (const modelType of ART_MODEL_TYPES) {
  assert.match(resolverSource, new RegExp(`case '${modelType}'`))
}
assert.doesNotMatch(resolverSource, /^\s*prompt:\s*true,/m)
assert.doesNotMatch(resolverSource, /^\s*secretNotes:\s*true,/m)

console.log('Model-aware gallery art context and suggestion contracts passed.')
