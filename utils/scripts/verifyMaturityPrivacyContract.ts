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

const videoLoraPicker = readFileSync('components/video-lora-picker.vue', 'utf8')
assert.ok(videoLoraPicker.includes('<maturity-toggle'))
assert.ok(videoLoraPicker.includes('resourceStore.visibleLoras'))
assert.ok(!videoLoraPicker.includes('artStore.showMature'))

const artLoraPicker = readFileSync('components/abandonware/art/lora-picker.vue', 'utf8')
assert.ok(artLoraPicker.includes('<maturity-toggle'))
assert.ok(artLoraPicker.includes('resourceStore.visibleLoras'))
assert.ok(artLoraPicker.includes('availableLoraIds'))
assert.ok(!artLoraPicker.includes('artStore.showMature'))

const artMaker = readFileSync('components/art/art-maker.vue', 'utf8')
assert.ok(artMaker.includes('label="Mature checkpoint models"'))
assert.ok(artMaker.includes('checkpointStore.visibleCheckpoints'))
assert.ok(!artMaker.includes('artStore.showMature'))

// lora-gallery and model-gallery were retired 2026-08-05 (unmounted, see the
// retirement commit) along with their cards. The maturity gate still applies to
// every SURVIVING gallery that lists mature-flaggable resources.
for (const file of [
  'components/servers/checkpoint-gallery.vue',
  'components/resources/resource-gallery.vue',
]) {
  const source = readFileSync(file, 'utf8')
  assert.ok(
    source.includes('<maturity-toggle'),
    `${file} needs maturity toggle`,
  )
}

const loraDiscover = readFileSync('components/lora/lora-discover.vue', 'utf8')
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

const accountPage = readFileSync('content/account.md', 'utf8')
assert.ok(
  accountPage.includes(':account-settings'),
  'The canonical /account route must mount account-settings',
)

const accountSettings = readFileSync(
  'components/user/account-settings.vue',
  'utf8',
)
assert.ok(
  accountSettings.includes('<dashboard-maturity-preference'),
  'Account & Privacy must expose the opt-in header maturity preference',
)

const dashboardMaturityPreference = readFileSync(
  'components/user/dashboard-maturity-preference.vue',
  'utf8',
)
assert.ok(dashboardMaturityPreference.includes('useMaturityPreferenceStore'))
assert.ok(
  dashboardMaturityPreference.includes('setShowDashboardMaturityToggle'),
)
assert.ok(dashboardMaturityPreference.includes('initialize()'))

const workspaceHeader = readFileSync(
  'components/navigation/workspace-header.vue',
  'utf8',
)
assert.ok(
  workspaceHeader.includes(
    'showDashboardMaturityToggle && userStore.isLoggedIn',
  ),
  'The workspace header must keep the maturity toggle opt-in and authenticated',
)

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

const queueCard = readFileSync('components/art/artjob-queue-card.vue', 'utf8')
assert.ok(queueCard.includes('jobVisibility.isMature'))
assert.ok(queueCard.includes('jobVisibility.isPublic'))
assert.ok(queueCard.includes('canShowJobContent'))
assert.ok(queueCard.includes('Mature prompt and preview are hidden'))

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
