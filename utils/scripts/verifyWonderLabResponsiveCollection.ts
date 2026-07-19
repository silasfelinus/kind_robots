// /utils/scripts/verifyWonderLabResponsiveCollection.ts
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

const [labSource, cardSource, querySource] = await Promise.all([
  readFile('components/wonderlab/lab-interact.vue', 'utf8'),
  readFile('components/wonderlab/component-card.vue', 'utf8'),
  readFile('utils/wonderlab/museumQuery.ts', 'utf8'),
])

assert.match(labSource, /sortComponentCatalog\(filteredComponents\.value, catalogSort\.value\)/)
assert.match(labSource, /v-model="catalogSort"/)
assert.match(labSource, /v-model="searchQuery"/)
assert.match(labSource, /v-model="folderFilter"/)
assert.match(labSource, /v-model="statusFilter"/)
assert.match(labSource, /collectionView = 'grid'/)
assert.match(labSource, /collectionView = 'list'/)
assert.match(labSource, /:aria-pressed="collectionView === 'grid'"/)
assert.match(labSource, /:aria-pressed="collectionView === 'list'"/)
assert.match(labSource, /grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4/)
assert.match(labSource, /selectedComponent \? 'hidden xl:flex' : 'flex'/)
assert.match(labSource, /v-if="selectedComponent"/)
assert.doesNotMatch(labSource, /Pick a component/)
assert.match(labSource, /v-for="component in sortedComponents"/)
assert.match(labSource, /:show-select-button="!selectedComponent"/)
assert.match(labSource, /@selected="selectComponent"/)
assert.match(labSource, /type KindComponent/)
assert.match(labSource, /sortedComponents\.length/)

assert.match(cardSource, /component\.description/)
assert.match(cardSource, /component\.statusReason/)
assert.match(cardSource, /component\.isDiscovered === false/)
assert.match(cardSource, /component\.previewMode/)
assert.match(cardSource, /component\.reviewCount/)
assert.match(cardSource, /component\.ratingCount/)
assert.match(cardSource, /component\.averageRating/)
assert.match(cardSource, /component\.lastReviewedAt/)
assert.match(cardSource, /No ratings/)
assert.match(cardSource, /Open exhibit/)
assert.match(cardSource, /selected: \[component: Component\]/)
assert.match(cardSource, /emit\('selected', props\.component\)/)

assert.match(querySource, /wonderLabCollectionViews = \['grid', 'list'\]/)
assert.match(querySource, /sort: ComponentCatalogSort/)
assert.match(querySource, /view: WonderLabCollectionView/)
assert.match(querySource, /if \(state\.sort === 'NAME'\) delete query\.sort/)
assert.match(querySource, /if \(state\.view === 'grid'\) delete query\.view/)

for (const temporaryPath of [
  '.github/workflows/wonderlab-responsive-collection.yml',
  '.github/scripts/apply-wonderlab-responsive-collection.py',
  '.github/scripts/fix-wonderlab-responsive-helper.py',
  '.github/workflows/wonderlab-mobile-exhibit.yml',
  '.github/scripts/apply-wonderlab-mobile-exhibit.py',
]) {
  let exists = true
  try {
    await access(temporaryPath)
  } catch {
    exists = false
  }
  assert.equal(exists, false, `${temporaryPath} must be removed`)
}

console.log('WonderLab responsive collection contract passed.')
