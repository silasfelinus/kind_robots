import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  defaultPublicForMaturity,
  resolveMaturityPrivacy,
} from '../../utils/maturityPrivacy'
import { applyArtJobVisibility } from '../../server/utils/artJobVisibility'
import {
  galleryArchiveMediaUrl,
  verifyGalleryArchiveMedia,
} from '../../server/utils/artGalleryArchiveMedia'

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

// Screenshot-driven density pass, 2026-09-20: the account-level maturity
// control moved from a full-width band into the LoRA header. It still governs
// Resource visibility globally (checkpoints + LoRAs) and Facets read the same
// user preference; output maturity remains a separate per-render choice.
const artGenerator = readFileSync('components/art/art-generator.vue', 'utf8')
assert.ok(artGenerator.includes('checkpointStore.visibleCheckpoints'))
assert.ok(artGenerator.includes('resourceStore.visibleLoras'))
assert.ok(artGenerator.includes('<content-visibility-controls'))
assert.ok(artGenerator.includes('v-model:is-mature="outputIsMature"'))
assert.ok(artGenerator.includes('v-model:is-public="outputIsPublic"'))
assert.ok(!artGenerator.includes('artStore.showMature'))

const artLoraPicker = readFileSync('components/art/art-lora-picker.vue', 'utf8')
assert.ok(artLoraPicker.includes('<maturity-toggle'))
assert.ok(artLoraPicker.includes('variant="compact"'))
assert.ok(artLoraPicker.includes('label="Mature resources"'))
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
assert.ok(maturityToggle.includes("variant === 'compact'"))
assert.ok(maturityToggle.includes('accountStore.updateConsent'))
assert.ok(maturityToggle.includes('showMature: value'))
assert.ok(
  maturityToggle.includes(
    'userStore.isLoggedIn && !userStore.isMaturityRestricted',
  ),
  'Maturity controls must not be offered to maturity-restricted accounts',
)

// Account became a composed destination in the 2026-09-08 navigation cleanup:
// the content route still mounts ONE MDC component (the layout contract), and
// that wrapper must keep the canonical settings surface while adding creator
// earnings beside it.
const accountPage = readFileSync('content/account.md', 'utf8')
assert.ok(
  accountPage.includes(':account-center'),
  'The canonical /account route must mount account-center',
)
const accountCenter = readFileSync('components/user/account-center.vue', 'utf8')
assert.ok(
  accountCenter.includes('<account-settings'),
  'Account center must retain account-settings',
)
assert.ok(
  accountCenter.includes('<creator-earnings-page'),
  'Account center must include creator earnings',
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
// / tutorial, and every utility control moved inside the hub. The detailed row
// remains opt-in, while a compact maturity button is now always available from
// the account icon for an eligible signed-in user.
const accountHub = readFileSync('components/navigation/account-hub.vue', 'utf8')
assert.ok(
  accountHub.includes('showDashboardMaturityToggle && userStore.isLoggedIn'),
  'The account hub must keep the detailed maturity row opt-in and authenticated',
)
assert.ok(
  accountHub.includes('<maturity-toggle v-if="userStore.isLoggedIn" />'),
  'The account hub must keep a compact maturity toggle directly accessible',
)

const accountStore = readFileSync('stores/accountStore.ts', 'utf8')
assert.ok(accountStore.includes('refreshMaturityResources'))
assert.ok(accountStore.includes('resourceStore.getResources(true)'))
assert.ok(accountStore.includes('resourceGalleryStore.loadResources()'))
assert.ok(accountStore.includes('loraResourceIds: visibleLoraIds'))
assert.ok(accountStore.includes('checkpointResourceId: null'))

// Main Gallery privacy controls and private archive media regression,
// art-archive/t-042. The account-wide mature consent remains in the account hub;
// Gallery has its own display-only maturity filter. User #1 enters through a
// public/private chooser so the archive is never queried until explicitly chosen.
const artGallery = readFileSync('components/art/art-gallery.vue', 'utf8')
assert.ok(!artGallery.includes('<maturity-toggle variant="compact"'))
assert.ok(artGallery.includes('aria-label="Gallery maturity filter"'))
assert.ok(artGallery.includes("{ value: 'all', label: 'Both' }"))
assert.ok(artGallery.includes("{ value: 'mature', label: 'Mature' }"))
assert.ok(artGallery.includes("{ value: 'safe', label: 'Not mature' }"))
assert.ok(artGallery.includes('matchesMaturityFilter'))
assert.ok(artGallery.includes('matchesPrivacyScope'))
assert.ok(artGallery.includes('Number(currentUserId.value) === 1'))
assert.ok(artGallery.includes('aria-label="Choose a gallery"'))
assert.ok(artGallery.includes('@click="chooseGallery(\'public\')"'))
assert.ok(artGallery.includes('@click="chooseGallery(\'private\')"'))
assert.ok(artGallery.includes("privacy: galleryScope.value ?? 'public'"))
assert.ok(!artGallery.includes('showPrivate'))
assert.ok(!artGallery.includes('watch(showMature'))
assert.ok(artGallery.includes('<kr-mature-cover'))
assert.ok(artGallery.includes('await reloadGalleryForVisibility()'))

// A plain <img> cannot send Kind Robots' Authorization/x-api-key headers.
// Gallery JSON responses therefore mint short-lived, variant-bound capability
// URLs only after the ArtImage has survived the normal server access filter.
const signedAt = 1_800_000_000_000
const signedUrl = galleryArchiveMediaUrl(42, 'medium', signedAt)
const parsedSignedUrl = new URL(signedUrl, 'https://kindrobots.test')
assert.equal(parsedSignedUrl.pathname, '/api/art/image/archive/42')
const signedExpiry = parsedSignedUrl.searchParams.get('exp')
const signedSignature = parsedSignedUrl.searchParams.get('sig')
assert.equal(
  verifyGalleryArchiveMedia(
    42,
    'medium',
    signedExpiry,
    signedSignature,
    signedAt,
  ),
  true,
)
assert.equal(
  verifyGalleryArchiveMedia(
    43,
    'medium',
    signedExpiry,
    signedSignature,
    signedAt,
  ),
  false,
)
assert.equal(
  verifyGalleryArchiveMedia(
    42,
    'thumbnail',
    signedExpiry,
    signedSignature,
    signedAt,
  ),
  false,
)
assert.equal(
  verifyGalleryArchiveMedia(
    42,
    'medium',
    signedExpiry,
    signedSignature,
    signedAt + 6 * 60 * 60 * 1000 + 1,
  ),
  false,
)
// The verifier also rejects an expiry beyond the server's own TTL, even if the
// query shape is otherwise plausible. A caller cannot stretch a captured URL.
assert.equal(
  verifyGalleryArchiveMedia(
    42,
    'medium',
    signedAt + 7 * 60 * 60 * 1000,
    signedSignature,
    signedAt,
  ),
  false,
)

const collectionGalleryApi = readFileSync(
  'server/api/art/collection/index.get.ts',
  'utf8',
)
assert.ok(collectionGalleryApi.includes('queryMaturityFilter'))
assert.ok(collectionGalleryApi.includes('queryPrivacyFilter'))
assert.ok(collectionGalleryApi.includes("privacy === 'private'"))
assert.ok(collectionGalleryApi.includes("maturity === 'mature'"))

const unsortedGalleryApi = readFileSync(
  'server/api/art/collection/unsorted.get.ts',
  'utf8',
)
assert.ok(unsortedGalleryApi.includes('readMaturityFilter'))
assert.ok(unsortedGalleryApi.includes('readPrivacyFilter'))
assert.ok(unsortedGalleryApi.includes("privacy === 'private'"))
assert.ok(unsortedGalleryApi.includes("maturity === 'mature'"))

const galleryChooserApi = readFileSync(
  'server/api/art/gallery/chooser.get.ts',
  'utf8',
)
assert.ok(galleryChooserApi.includes('isPublic: true'))
assert.ok(galleryChooserApi.includes('isMature: false'))
assert.ok(galleryChooserApi.includes('take: 2'))

for (const galleryApi of [
  'server/api/art/collection/index.get.ts',
  'server/api/art/collection/[id].get.ts',
  'server/api/art/collection/unsorted.get.ts',
]) {
  const source = readFileSync(galleryApi, 'utf8')
  assert.ok(
    source.includes('attachGalleryArchiveMediaPaths'),
    `${galleryApi} must mint browser-loadable archive image URLs after access filtering`,
  )
}

const archiveGalleryMediaRoute = readFileSync(
  'server/api/art/image/archive/[id].get.ts',
  'utf8',
)
assert.ok(archiveGalleryMediaRoute.includes('verifyGalleryArchiveMedia'))
assert.ok(archiveGalleryMediaRoute.includes('buildArtImageWhere(access)'))
assert.ok(archiveGalleryMediaRoute.includes("designer: 'art-archive'"))
assert.ok(archiveGalleryMediaRoute.includes('artImageId: artImage.id'))
assert.ok(archiveGalleryMediaRoute.includes('resolveConfinedExistingPath'))
assert.ok(archiveGalleryMediaRoute.includes('ensureArchiveThumbnail'))
assert.ok(
  archiveGalleryMediaRoute.includes("'Cache-Control', 'private, max-age=3600'"),
)

const queueEditor = readFileSync('components/art/artjob-editor.vue', 'utf8')
assert.ok(queueEditor.includes('v-model:is-mature="form.isMature"'))
assert.ok(queueEditor.includes('isMature: form.isMature'))
assert.ok(queueEditor.includes('isPublic: form.isPublic'))

const queueCard = readFileSync('components/art/artjob-queue-card.vue', 'utf8')
assert.ok(queueCard.includes('jobVisibility.isMature'))
assert.ok(queueCard.includes('jobVisibility.isPublic'))
assert.ok(queueCard.includes('canShowJobContent'))
assert.ok(queueCard.includes('Mature prompt and preview are hidden'))
assert.ok(queueCard.includes('canRevealMatureJob'))
assert.ok(queueCard.includes('loadProtectedPreview(true)'))

const artJobStore = readFileSync('stores/artJobStore.ts', 'utf8')
assert.ok(artJobStore.includes("params.set('showMature', 'true')"))

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
