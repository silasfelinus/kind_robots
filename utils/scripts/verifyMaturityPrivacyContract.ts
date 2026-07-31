import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  defaultPublicForMaturity,
  resolveMaturityPrivacy,
} from '../../utils/maturityPrivacy'
import { applyArtJobVisibility } from '../../server/utils/artJobVisibility'

assert.deepEqual(resolveMaturityPrivacy(undefined), {
  isMature: false,
  isPublic: true,
})
assert.deepEqual(resolveMaturityPrivacy({ isMature: true }), {
  isMature: true,
  isPublic: false,
})
assert.deepEqual(resolveMaturityPrivacy({ isMature: true, isPublic: true }), {
  isMature: true,
  isPublic: true,
})
assert.deepEqual(resolveMaturityPrivacy({ isMature: false, isPublic: false }), {
  isMature: false,
  isPublic: false,
})
assert.equal(defaultPublicForMaturity(true), false)
assert.equal(defaultPublicForMaturity(false), true)

const legacyMature = applyArtJobVisibility({ save: { isMature: true } })
assert.deepEqual(legacyMature.save, { isMature: true, isPublic: false })

const explicitPublicMature = applyArtJobVisibility(
  { save: { isMature: false, isPublic: true, designer: 'Ami' } },
  { isMature: true, isPublic: true },
)
assert.deepEqual(explicitPublicMature.save, {
  isMature: true,
  isPublic: true,
  designer: 'Ami',
})

const matureOnlyEdit = applyArtJobVisibility(
  { save: { isMature: false, isPublic: false } },
  { isMature: true },
)
assert.deepEqual(matureOnlyEdit.save, { isMature: true, isPublic: false })

const videoGenerator = readFileSync('pages/play/video-generator.vue', 'utf8')
assert.ok(videoGenerator.includes('<content-visibility-controls'))
assert.ok(videoGenerator.includes('isMature: isMature.value'))
assert.ok(videoGenerator.includes('isPublic: isPublic.value'))

const videoLoraPicker = readFileSync(
  'components/video-lora-picker.vue',
  'utf8',
)
assert.ok(videoLoraPicker.includes('<maturity-toggle'))
assert.ok(videoLoraPicker.includes('resourceStore.visibleLoras'))
assert.ok(!videoLoraPicker.includes('artStore.showMature'))

const artLoraPicker = readFileSync('components/art/lora-picker.vue', 'utf8')
assert.ok(artLoraPicker.includes('<maturity-toggle'))
assert.ok(artLoraPicker.includes('resourceStore.visibleLoras'))
assert.ok(artLoraPicker.includes('availableLoraIds'))
assert.ok(!artLoraPicker.includes('artStore.showMature'))

const artMaker = readFileSync('components/art/art-maker.vue', 'utf8')
assert.ok(artMaker.includes('label="Mature checkpoint models"'))
assert.ok(artMaker.includes('checkpointStore.visibleCheckpoints'))
assert.ok(!artMaker.includes('artStore.showMature'))

for (const file of [
  'components/lora/lora-gallery.vue',
  'components/model/model-gallery.vue',
  'components/servers/checkpoint-gallery.vue',
  'components/resources/resource-gallery.vue',
]) {
  const source = readFileSync(file, 'utf8')
  assert.ok(source.includes('<maturity-toggle'), `${file} needs maturity toggle`)
}

const loraDiscover = readFileSync(
  'components/lora/lora-discover.vue',
  'utf8',
)
assert.ok(loraDiscover.includes('<maturity-toggle'))
assert.ok(
  loraDiscover.includes("if (userStore.showMature) params.set('nsfw', 'true')"),
)
assert.ok(!loraDiscover.includes('includeMature'))

const maturityToggle = readFileSync(
  'components/navigation/maturity-toggle.vue',
  'utf8',
)
assert.ok(maturityToggle.includes("variant === 'resource'"))
assert.ok(maturityToggle.includes('accountStore.updateConsent'))
assert.ok(maturityToggle.includes('showMature: value'))

const accountStore = readFileSync('stores/accountStore.ts', 'utf8')
assert.ok(accountStore.includes('refreshMaturityResources'))
assert.ok(accountStore.includes('resourceStore.getResources(true)'))
assert.ok(accountStore.includes('resourceGalleryStore.loadResources()'))
assert.ok(accountStore.includes('loraResourceIds: visibleLoraIds'))
assert.ok(accountStore.includes('checkpointResourceId: null'))

const queueEditor = readFileSync('components/art/artjob-editor.vue', 'utf8')
assert.ok(queueEditor.includes('v-model:is-mature="form.isMature"'))
assert.ok(queueEditor.includes('isMature: form.isMature'))
assert.ok(queueEditor.includes('isPublic: form.isPublic'))

const queueBrowser = readFileSync(
  'components/art/artjob-queue-browser.vue',
  'utf8',
)
assert.ok(queueBrowser.includes('jobVisibility(job).isMature'))
assert.ok(queueBrowser.includes('jobVisibility(job).isPublic'))
assert.ok(queueBrowser.includes('canShowJobContent(job)'))
assert.ok(queueBrowser.includes('Mature prompt and preview are hidden'))

const enqueueResolver = readFileSync('server/utils/artLoraResource.ts', 'utf8')
assert.ok(enqueueResolver.includes('resolveMaturityPrivacy(input.body)'))

const openAiRoute = readFileSync(
  'server/api/chats/openai/images/generate.post.ts',
  'utf8',
)
assert.ok(openAiRoute.includes('resolveMaturityPrivacy(requestData)'))

const artGeneratorPlugin = readFileSync(
  'plugins/art-maturity-privacy.client.ts',
  'utf8',
)
assert.ok(artGeneratorPlugin.includes('defaultPublicForMaturity'))
assert.ok(artGeneratorPlugin.includes('enqueueArtGeneration'))

console.log('Maturity and privacy generation contract passed.')
