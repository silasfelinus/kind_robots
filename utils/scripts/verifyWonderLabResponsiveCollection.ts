// /utils/scripts/verifyWonderLabResponsiveCollection.ts
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

const [
  labSource,
  cardSource,
  querySource,
  patchSource,
  catalogApiSource,
  componentApiSource,
  folderApiSource,
  projectionSource,
] = await Promise.all([
  readFile('components/wonderlab/lab-interact.vue', 'utf8'),
  readFile('components/wonderlab/component-card.vue', 'utf8'),
  readFile('utils/wonderlab/museumQuery.ts', 'utf8'),
  readFile('server/api/components/[id].patch.ts', 'utf8'),
  readFile('server/api/components/index.get.ts', 'utf8'),
  readFile('server/api/components/[id].get.ts', 'utf8'),
  readFile('server/api/components/folder/[name].get.ts', 'utf8'),
  readFile('server/utils/componentProjection.ts', 'utf8'),
])

assert.match(
  labSource,
  /sortComponentCatalog\(filteredComponents\.value, catalogSort\.value\)/,
)
assert.match(labSource, /v-model="catalogSort"/)
assert.match(labSource, /v-model="searchQuery"/)
assert.match(labSource, /v-model="folderFilter"/)
assert.match(labSource, /v-model="statusFilter"/)
assert.match(labSource, /collectionView = 'grid'/)
assert.match(labSource, /collectionView = 'list'/)
assert.match(labSource, /:aria-pressed="collectionView === 'grid'"/)
assert.match(labSource, /:aria-pressed="collectionView === 'list'"/)
assert.match(
  labSource,
  /grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4/,
)
assert.match(labSource, /selectedComponent \? 'hidden xl:flex' : 'flex'/)
assert.match(labSource, /v-if="selectedComponent"/)
assert.doesNotMatch(labSource, /Pick a component/)
assert.match(labSource, /v-for="component in sortedComponents"/)
assert.match(labSource, /:show-select-button="!selectedComponent"/)
assert.match(labSource, /@selected="selectComponent"/)
assert.match(labSource, /type KindComponent/)
assert.match(labSource, /sortedComponents\.length/)

assert.match(labSource, /About this exhibit/)
assert.match(labSource, /selectedComponent\.description \|\|/)
assert.match(labSource, /selectedComponent\.statusReason \|\|/)
assert.match(
  labSource,
  /selectedComponent\.category \|\| selectedComponent\.folderName/,
)
assert.match(labSource, /selectedComponent\.isDiscovered === true/)
assert.match(labSource, /selectedComponent\.previewMode \|\| 'Fixture catalog'/)
assert.match(labSource, /selectedComponent\.sourcePath \|\|/)
assert.match(
  labSource,
  /<details[\s\S]*?v-if="isAdmin"[\s\S]*?Curator controls/,
)
assert.match(labSource, /v-model="selectedComponent\.title"/)
assert.match(labSource, /v-model="selectedComponent\.category"/)
assert.match(labSource, /v-model="selectedComponent\.description"/)
assert.match(labSource, /v-model="selectedStatus"/)
assert.match(labSource, /v-model="selectedComponent\.previewMode"/)
assert.match(labSource, /v-model="selectedComponent\.statusReason"/)
assert.match(labSource, /v-model="selectedComponent\.notes"/)
assert.match(labSource, /@click="saveSelectedComponent"/)
assert.doesNotMatch(labSource, /\{\{\s*selectedComponent\.notes/)
assert.doesNotMatch(labSource, /Public notes remain readable/)

for (const field of [
  'title',
  'description',
  'status',
  'statusReason',
  'category',
  'previewMode',
  'notes',
]) {
  assert.match(
    patchSource,
    new RegExp(`['"]${field}['"]`),
    `Component PATCH must support curator field ${field}.`,
  )
}
for (const protectedField of ['sourceKey', 'sourcePath', 'sourceHash', 'slug']) {
  assert.doesNotMatch(
    patchSource.match(/const allowedPatchFields[\s\S]*?\]\)/)?.[0] || '',
    new RegExp(`['"]${protectedField}['"]`),
    `${protectedField} must remain reconciliation-controlled.`,
  )
}

assert.match(projectionSource, /projectComponentForViewer/)
assert.match(projectionSource, /if \(isAdmin\) return component/)
assert.match(
  projectionSource,
  /const \{ notes: _internalNotes, \.\.\.publicComponent \} = component/,
)
assert.match(projectionSource, /return publicComponent/)

for (const publicReadSource of [
  catalogApiSource,
  componentApiSource,
  folderApiSource,
]) {
  assert.match(publicReadSource, /getOptionalApiUser\(event\)/)
  assert.match(publicReadSource, /projectComponentForViewer/)
  assert.match(publicReadSource, /auth\?\.isAdmin === true/)
}
assert.doesNotMatch(catalogApiSource, /return catalogItem\s*$/m)
assert.doesNotMatch(componentApiSource, /data,\s*statusCode: 200/)
assert.doesNotMatch(folderApiSource, /data:\s*components,/) 

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
  '.github/workflows/wonderlab-curator-separation.yml',
  '.github/scripts/apply-wonderlab-curator-separation.py',
]) {
  let exists = true
  try {
    await access(temporaryPath)
  } catch {
    exists = false
  }
  assert.equal(exists, false, `${temporaryPath} must be removed`)
}

console.log('WonderLab responsive collection and curator boundary contract passed.')
