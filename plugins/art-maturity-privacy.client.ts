import { watch } from 'vue'
import { defineNuxtPlugin } from '#app'
import { useArtStore } from '@/stores/artStore'
import { defaultPublicForMaturity } from '@/utils/maturityPrivacy'

/**
 * The image generator already exposes mature and public toggles. Link their
 * defaults without taking away the user's ability to override privacy.
 */
export default defineNuxtPlugin(() => {
  const artStore = useArtStore()
  let writingDefault = false
  let privacyOverridden =
    Boolean(artStore.artForm.isPublic) !==
    defaultPublicForMaturity(Boolean(artStore.artForm.isMature))

  watch(
    () => artStore.artForm.isPublic,
    () => {
      if (writingDefault) {
        writingDefault = false
        return
      }
      privacyOverridden = true
    },
  )

  watch(
    () => artStore.artForm.isMature,
    (isMature) => {
      if (privacyOverridden) return
      writingDefault = true
      artStore.artForm.isPublic = defaultPublicForMaturity(Boolean(isMature))
    },
  )
})
