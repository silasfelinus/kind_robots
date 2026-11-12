import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { COMPANIONS, ENDING_IDS, LENSES } from '../ecotone/content'
import { endingArtKey } from '../ecotone/artSlots'
import { endingDossier, endingFateLabel } from '../ecotone/endingDossier'
import { FUTURE_BOOKENDS } from '../ecotone/finaleExpansion'
import { FUTURES, LENS_CODAS, SIGNATURES } from '../ecotone/story'

// Every card in the Endings gallery opens a dossier (Silas, 2026-11-12 PT):
// an earned one shows the ending's picture in full, its facts and its
// epilogue; a locked one shows only how to find it.

const preserve = endingDossier('juniper.sober.dark')
assert.ok(preserve, 'a written ending has a dossier')
assert.equal(preserve.title, 'Silent Preserve')
assert.equal(preserve.line, SIGNATURES['juniper.sober']?.dark.line)
assert.equal(preserve.leadName, 'Juniper')
assert.equal(preserve.lensLabel, 'Sober')
assert.equal(endingFateLabel(preserve.fate), 'Dark')
assert.equal(preserve.art, endingArtKey('juniper.sober.dark'))
assert.equal(
  preserve.scene,
  'meadow',
  'a guide’s ending falls back to their event',
)
assert.equal(preserve.number, ENDING_IDS.indexOf('juniper.sober.dark') + 1)
assert.equal(preserve.total, ENDING_IDS.length)
assert.deepEqual(preserve.paragraphs, FUTURES.juniper.dark)
assert.equal(
  preserve.paragraphs[0],
  FUTURE_BOOKENDS.juniper.dark[0],
  'the dossier carries the one-year bookend the end screen shows',
)
assert.equal(preserve.paragraphs.at(-1), FUTURE_BOOKENDS.juniper.dark[1])
assert.equal(preserve.coda, LENS_CODAS.sober)
assert.deepEqual(preserve.twin, {
  id: 'juniper.sober.hope',
  title: 'Patient Canopy',
})
assert.deepEqual(
  preserve.facts.map((fact) => fact.label),
  ['Finished with', 'Met at', 'What followed them', 'Opening lens', 'Future'],
)
assert.match(preserve.facts[1]?.value ?? '', /^The drum circle/)
assert.equal(preserve.facts[3]?.detail, 'What is the evidence?')
assert.deepEqual(preserve.recipe, [
  'Finish the weekend with Juniper.',
  'Choose Sober as your opening lens.',
  'Fall short of the hopeful future.',
])

assert.equal(endingDossier('juniper.sober'), null)
assert.equal(endingDossier('nobody.sober.hope'), null)

const titles = new Set<string>()
for (const id of ENDING_IDS) {
  const dossier = endingDossier(id)
  assert.ok(dossier, `${id} has a dossier`)
  assert.ok(dossier.title, `${id} has a title`)
  assert.ok(dossier.line, `${id} has a signature line`)
  assert.ok(dossier.paragraphs.length >= 3, `${id} has an epilogue`)
  assert.ok(dossier.coda, `${id} has a lens coda`)
  assert.equal(dossier.recipe.length, 3, `${id} names lead, lens and fate`)
  assert.ok(ENDING_IDS.includes(dossier.twin.id), `${id} twin exists`)
  assert.notEqual(dossier.twin.id, id)
  assert.equal(endingDossier(dossier.twin.id)?.twin.id, id)
  assert.equal(endingDossier(dossier.twin.id)?.title, dossier.twin.title)
  assert.ok(
    LENSES.some((lens) => lens.label === dossier.lensLabel),
    `${id} names a real lens`,
  )
  for (const step of dossier.recipe)
    assert.ok(
      !step.includes(dossier.title),
      `${id} recipe does not spoil the title`,
    )
  titles.add(`${dossier.lead}.${dossier.lens}.${dossier.fate}:${dossier.title}`)
}
assert.equal(titles.size, ENDING_IDS.length)

for (const companion of COMPANIONS) {
  const facts = endingDossier(`${companion.id}.tipsy.hope`)?.facts ?? []
  assert.equal(facts[0]?.value, companion.name)
  assert.equal(facts[0]?.detail, companion.role)
  assert.equal(facts[2]?.value, companion.anomaly)
}
const alone = endingDossier('alone.stoned.hope')
assert.equal(alone?.leadName, 'Alone')
assert.equal(alone?.facts[0]?.value, 'Nobody')
assert.equal(alone?.facts.length, 3, 'no guide, no meeting place')
assert.equal(alone?.recipe[0], 'Finish the weekend without a guide.')
const wild = endingDossier('ecotopia.sober.hope')
assert.equal(wild?.leadName, 'The Wild Way')
assert.equal(wild?.scene, 'marsh')
assert.equal(wild?.facts[0]?.value, 'The animals')
assert.equal(wild?.facts.at(-1)?.detail, 'You kept choosing the animals.')
assert.equal(
  wild?.recipe[0],
  'Take the Quiet Way and finish it without a guide.',
)
assert.equal(
  endingDossier('ecotopia.sober.dark')?.recipe[2],
  'Let the animal-first choices come up short.',
)

const board = readFileSync('components/ecotone-board.vue', 'utf8')
assert.match(
  board,
  /<button\s+v-for="slot in slotsFor\(row\.id\)"[\s\S]*?@click="openDossier\(slot\.id\)"/,
  'every ending card is a button that opens its dossier',
)
assert.ok(
  !/<div\s+v-for="slot in slotsFor/.test(board),
  'ending cards are not inert',
)
assert.match(
  board,
  /ref="dossierDialog"[\s\S]*?data-testid="ecotone-ending-dossier"/,
)
assert.match(
  board,
  /<template v-if="dossierEarned">[\s\S]*?:art="dossier\.art"[\s\S]*?dossier\.paragraphs/,
  'an earned dossier shows the picture and the epilogue',
)
const recipeHeading = board.indexOf('How to find it')
const sealed = board.slice(
  board.lastIndexOf('v-else', recipeHeading),
  board.indexOf('</ol>', recipeHeading),
)
assert.match(sealed, /Unfound ending/)
assert.match(sealed, /dossier\.recipe/)
assert.ok(
  !/dossier\.(title|line|paragraphs|coda)\b/.test(sealed),
  'a locked dossier never prints the ending it hides',
)

console.log('Ecotone ending dossier contract passed')
