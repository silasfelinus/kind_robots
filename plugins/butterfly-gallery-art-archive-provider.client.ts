// Installs the real art-archive-backed ButterflyGalleryFeedProvider and
// ButterflyGalleryActionAdapter (butterfly-gallery/t-022) in place of the
// t-004/t-007 fixtures, at client app startup. The fixture-backed defaults
// stay in stores/helpers/butterflyGallery{FeedProvider,ActionAdapter}.ts on
// purpose -- those modules have no Nuxt-runtime imports, which is what lets
// their contract tests run under plain tsx; the real provider/adapter need
// performFetch (stores/utils.ts, in turn @/stores/userStore), so the swap
// happens here instead of as either module's own default.
import { defineNuxtPlugin } from '#app'
import { setButterflyGalleryFeedProvider } from '@/stores/helpers/butterflyGalleryFeedProvider'
import { setButterflyGalleryActionAdapter } from '@/stores/helpers/butterflyGalleryActionAdapter'
import { createArtArchiveButterflyGalleryFeedProvider } from '@/stores/helpers/butterflyGalleryArtArchiveFeedProvider'
import { createArtArchiveButterflyGalleryActionAdapter } from '@/stores/helpers/butterflyGalleryArtArchiveActionAdapter'

export default defineNuxtPlugin(() => {
  setButterflyGalleryFeedProvider(
    createArtArchiveButterflyGalleryFeedProvider(),
  )
  setButterflyGalleryActionAdapter(
    createArtArchiveButterflyGalleryActionAdapter(),
  )
})
