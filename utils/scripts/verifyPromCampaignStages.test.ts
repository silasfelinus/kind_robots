import assert from 'node:assert/strict'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import { VILLAIN_HENCHMEN } from '../cometAcademy/villainHenchmen'
import {
  IDENTITY_CAMPAIGN_STAGES,
  campaignStagesFor,
} from '../cometAcademy/identityCampaignStages'

assert.equal(IDENTITY_ARCS.length, 48, 'the permanent roster is still 48')
assert.equal(IDENTITY_CAMPAIGN_STAGES.length, 48)
const original = new Set(IDENTITY_ARCS.map((person) => person.signature))
assert.deepEqual(
  new Set(IDENTITY_CAMPAIGN_STAGES.map((entry) => entry.signature)),
  original,
  'exactly one opener, lair and lieutenant for every stable identity',
)
for (const key of ['opening', 'lair'] as const) {
  assert.equal(
    new Set(IDENTITY_CAMPAIGN_STAGES.map((entry) => entry[key].title)).size,
    48,
    'distinct authored ' + key + ' titles required',
  )
  assert.equal(
    new Set(IDENTITY_CAMPAIGN_STAGES.map((entry) => entry[key].venue)).size,
    48,
    'no generic repeated stage venue',
  )
}
assert.equal(
  new Set(IDENTITY_CAMPAIGN_STAGES.map((entry) => entry.lieutenant.name)).size,
  48,
  'all 48 lieutenants must be individuals',
)
const speciesCaptains = new Set(VILLAIN_HENCHMEN.map((crew) => crew.captain))
const heroNames = new Set(IDENTITY_ARCS.map((hero) => hero.hero.alias))
for (const character of IDENTITY_ARCS) {
  const stages = campaignStagesFor(character.signature)
  assert.equal(stages.signature, character.signature)
  assert.equal(stages.lieutenant.hp, 4, 'lieutenant must survive one hit')
  assert.ok(!speciesCaptains.has(stages.lieutenant.name), 'lieutenant cannot be the minor crew captain')
  assert.ok(!heroNames.has(stages.lieutenant.name), 'lieutenant cannot recycle another permanent hero')
  assert.ok(stages.opening.title.length >= 8 && stages.opening.venue.length >= 12)
  assert.ok(stages.lair.title.length >= 8 && stages.lair.venue.length >= 12)
  assert.ok(stages.lieutenant.name.length >= 7)
  for (const key of ['inciting', 'powerUse', 'choice'] as const)
    assert.ok(stages.opening[key].length > 35, character.signature + ' opening missing ' + key)
  for (const key of ['arena', 'objective', 'secret'] as const)
    assert.ok(stages.lair[key].length > 30, character.signature + ' lair missing ' + key)
  for (const key of ['look', 'power', 'counter', 'agenda'] as const)
    assert.ok(stages.lieutenant[key].length > 30, character.signature + ' lieutenant missing ' + key)
}
assert.match(campaignStagesFor('accident-earth').lair.title, /Deed Below/)
assert.match(campaignStagesFor('tech-genius').opening.title, /Grandma/)
assert.match(campaignStagesFor('magic-genius').lair.arena, /vertices|mathematical/)
assert.throws(() => campaignStagesFor('unlisted-person' as never), /Missing opening mission/)
console.log('48 original power-specific openers, 48 villain lairs, 48 separate four-HP lieutenants: OK')
