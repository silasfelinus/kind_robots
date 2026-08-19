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

// Repointed 2026-08-18: art-maker.vue was replaced by art-generator.vue, which
// draws ONE maturity toggle for the whole surface instead of art-maker's three
// (a checkpoint-filter toggle, a bare Mature output toggle, and a Public
// toggle). The gate is unchanged and asserted harder: the single account-level
// toggle governs checkpoints, LoRAs, AND Facets, while the OUTPUT maturity of
// the generated image is set through content-visibility-controls, which keeps
// mature work private by default.
const artGenerator = readFileSync('components/art/art-generator.vue', 'utf8')
assert.ok(artGenerator.includes('<maturity-toggle'))
assert.ok(artGenerator.includes('label="Mature content"'))
assert.ok(
  artGenerator.match(/<maturity-toggle/g)?.length === 1,
  'the generator must draw exactly one maturity toggle',
)
assert.ok(artGenerator.includes('checkpointStore.visibleCheckpoints'))
assert.ok(artGenerator.includes('resourceStore.visibleLoras'))
assert.ok(artGenerator.includes('<content-visibility-controls'))
assert.ok(artGenerator.includes('v-model:is-mature="outputIsMature"'))
assert.ok(artGenerator.includes('v-model:is-public="outputIsPublic"'))
assert.ok(!artGenerator.includes('artStore.showMature'))

const artLoraPicker = readFileSync('components/art/art-lora-picker.vue', 'utf8')
assert.ok(artLoraPicker.includes('resourceStore.visibleLoras'))
assert.ok(!artLoraPicker.includes('artStore.showMature'))

// The third surface the single toggle now governs. The Facet catalog is fetched
// complete and shared with the character/reward/scenario builders, so the gate
// is a filter in the picker rather than a narrowed fetch -- and staged mature
// Facets are dropped when the toggle goes off, so nothing invisible rides along.
const artFacetSelector = readFileSync(
  'components/art/art-facet-selector.vue',
  'utf8',
)
assert.ok(artFacetSelector.includes('userStore.showMature'))
assert.ok(
  artFacetSelector.includes(
    'if (!showMature.value && facet.isMature) return false',
  ),
)

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

// Repointed 2026-08-10: the header was reduced to account hub / channel / tab
// / tutorial, and every utility control moved inside the hub. The GATE is
// unchanged and still asserted literally -- opt-in via the stored preference
// AND authenticated -- it is simply read from the component that now renders
// the toggle. Following the old path would assert against a file that no
// longer mounts it, which passes while proving nothing.
const accountHub = readFileSync('components/navigation/account-hub.vue', 'utf8')
assert.ok(
  accountHub.includes('showDashboardMaturityToggle && userStore.isLoggedIn'),
  'The account hub must keep the maturity toggle opt-in and authenticated',
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
