import { watch } from 'vue'
import { defineNuxtPlugin } from '#app'
import { useArtStore } from '@/stores/artStore'
import { defaultPublicForMaturity } from '@/utils/maturityPrivacy'

const GENERATION_ACTIONS = new Set([
  'buildGenerateArtData',
  'generateArt',
  'enqueueArtGeneration',
])

/**
 * The image generator already exposes mature and public toggles. Link their
 * defaults without taking away the user's ability to override privacy, and
 * normalize programmatic generation calls that supply maturity without privacy.
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

  artStore.$onAction(({ name, args }) => {
    if (!GENERATION_ACTIONS.has(name)) return
    const request = args[0]
    if (!request || typeof request !== 'object' || Array.isArray(request)) return
    const record = request as Record<string, unknown>
    if (
      typeof record.isMature === 'boolean' &&
      typeof record.isPublic !== 'boolean'
    ) {
      record.isPublic = defaultPublicForMaturity(record.isMature)
    }
  })
})
