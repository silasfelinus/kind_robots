// /stores/accountStore.ts
//
// Self-service account actions that live outside the generic profile PATCH:
// password change/reset, email verification, consent/privacy toggles, and
// newsletter double-opt-in. Kept separate from the large userStore; it reads
// and refreshes the current user via userStore.
//
// API:
//   POST  /api/auth/password/change            { currentPassword?, newPassword }
//   POST  /api/auth/password/forgot            { email }
//   POST  /api/auth/password/reset             { token, newPassword }
//   POST  /api/auth/email/send-verification
//   PATCH /api/users/me/consent                { isPublic?, showMature?, ... }
//   PATCH /api/users/me/intro                  { dismissed }
//   POST  /api/newsletter/subscribe            { frequency }
//   POST  /api/newsletter/unsubscribe

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '~/prisma/generated/prisma/client'
import { useUserStore } from './userStore'
import { performFetch, handleError } from './utils'

export type MessagePolicy = 'EVERYONE' | 'FRIENDS' | 'NONE'
export type NewsletterFrequency =
  'NEVER' | 'SPECIAL' | 'MONTHLY' | 'WEEKLY' | 'DAILY'

export type ConsentPatch = {
  isPublic?: boolean
  showMature?: boolean
  listInDirectory?: boolean
  allowFriendRequests?: boolean
  messagePolicy?: MessagePolicy
}

type ActionResult = { success: boolean; message: string }

type ResourceLike = {
  id: number
  name?: string | null
  customLabel?: string | null
  localPath?: string | null
  resourceType?: string | null
  isMature?: boolean | null
}

function resourceEngineName(resource: ResourceLike | undefined): string {
  return resource?.localPath || resource?.name || resource?.customLabel || ''
}

export const useAccountStore = defineStore('accountStore', () => {
  const userStore = useUserStore()

  const isSaving = ref(false)
  const lastMessage = ref<string>('')
  const lastError = ref<string>('')

  function patchLocalUser(patch: Record<string, unknown>): void {
    if (userStore.user) {
      userStore.setUser({ ...userStore.user, ...patch } as User)
    }
  }

  async function refreshMaturityResources(showMature: boolean): Promise<void> {
    try {
      const [
        { useResourceStore },
        { useResourceGalleryStore },
        { useCheckpointStore },
        { useArtStore },
      ] = await Promise.all([
        import('./resourceStore'),
        import('./resourceGalleryStore'),
        import('./checkpointStore'),
        import('./artStore'),
      ])

      const resourceStore = useResourceStore()
      const resourceGalleryStore = useResourceGalleryStore()
      const checkpointStore = useCheckpointStore()
      const artStore = useArtStore()

      if (!showMature) {
        const currentResources = resourceStore.resources as ResourceLike[]
        const matureResources = currentResources.filter(
          (resource) => resource.isMature === true,
        )
        const matureIds = new Set(
          matureResources.map((resource) => resource.id),
        )
        const matureLoraNames = new Set(
          matureResources
            .filter((resource) => {
              const type = String(resource.resourceType || '').toUpperCase()
              return type === 'LORA' || type === 'LYCORIS'
            })
            .map(resourceEngineName)
            .filter(Boolean),
        )
        const matureCheckpointNames = new Set(
          matureResources
            .filter(
              (resource) =>
                String(resource.resourceType || '').toUpperCase() ===
                'CHECKPOINT',
            )
            .map(resourceEngineName)
            .filter(Boolean),
        )

        const currentLoraIds = artStore.artForm.loraResourceIds ?? []
        const visibleLoraIds = currentLoraIds.filter((id) => !matureIds.has(id))
        const loraSelectionChanged =
          visibleLoraIds.length !== currentLoraIds.length
        const primaryVisibleLora = currentResources.find(
          (resource) => resource.id === visibleLoraIds[0],
        )
        const checkpointHidden =
          (artStore.artForm.checkpointResourceId != null &&
            matureIds.has(artStore.artForm.checkpointResourceId)) ||
          matureCheckpointNames.has(artStore.artForm.checkpoint || '')
        const namedLoraHidden = matureLoraNames.has(
          artStore.artForm.loraName || '',
        )

        artStore.setArtForm({
          ...(loraSelectionChanged
            ? {
                loraResourceIds: visibleLoraIds,
                loraName: primaryVisibleLora
                  ? resourceEngineName(primaryVisibleLora)
                  : null,
              }
            : namedLoraHidden
              ? { loraName: null }
              : {}),
          ...(checkpointHidden
            ? { checkpointResourceId: null, checkpoint: '' }
            : {}),
        })

        if (checkpointStore.selectedCheckpoint?.isMature) {
          checkpointStore.selectCheckpointByName(
            checkpointStore.visibleCheckpoints[0]?.name || '',
          )
        }
      }

      await Promise.all([
        resourceStore.getResources(true),
        resourceGalleryStore.loadResources(),
      ])
    } catch (error) {
      handleError(error, 'refreshing maturity-filtered Resources')
    }

    await refreshMaturityContent()
  }

  /*
   * EVERY content store, not just the resource family.
   *
   * Silas, 2026-09-18, on moving the maturity gate to the API: "if a user
   * clicks show mature, it will require re-aquiring the objects from the
   * backend. but ultimately, that's probably what we need. We don't want to get
   * data that is otherwise blocked until they ask for it."
   *
   * That is the trade this pays for. The listings no longer arrive carrying
   * mature rows for the client to hide, so the client has to ask again when the
   * answer changes -- in BOTH directions: opting in has nothing cached to
   * reveal, and opting out leaves rows the browser must stop showing.
   *
   * Imported lazily and failed softly per store: a refresh that cannot reach
   * one store must not strand the toggle, which has already been saved by the
   * time this runs.
   */
  async function refreshMaturityContent(): Promise<void> {
    const loaders: [string, () => Promise<unknown>][] = []

    try {
      const [
        { useBotStore },
        { useCharacterStore },
        { useDreamStore },
        { useRewardStore },
        { useScenarioStore },
        { usePromptStore },
      ] = await Promise.all([
        import('./botStore'),
        import('./characterStore'),
        import('./dreamStore'),
        import('./rewardStore'),
        import('./scenarioStore'),
        import('./promptStore'),
      ])

      loaders.push(
        ['bots', () => useBotStore().fetchBots(true)],
        ['characters', () => useCharacterStore().fetchCharacters(true)],
        ['dreams', () => useDreamStore().fetchDreams({})],
        ['rewards', () => useRewardStore().fetchRewards(true)],
        ['scenarios', () => useScenarioStore().fetchScenarios(true)],
        ['prompts', () => usePromptStore().fetchPrompts(true)],
      )
    } catch (error) {
      handleError(error, 'loading stores for a maturity refresh')
      return
    }

    const results = await Promise.allSettled(loaders.map(([, load]) => load()))

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        handleError(
          result.reason,
          `refreshing ${loaders[index]?.[0]} after a maturity change`,
        )
      }
    })
  }

  async function run(
    label: string,
    url: string,
    body: Record<string, unknown>,
    method = 'POST',
  ): Promise<ActionResult> {
    isSaving.value = true
    lastError.value = ''
    lastMessage.value = ''
    try {
      const res = await performFetch<unknown>(url, {
        method,
        body: JSON.stringify(body),
      })
      lastMessage.value = res.message || ''
      if (!res.success) lastError.value = res.message || 'Request failed.'
      return { success: !!res.success, message: res.message || '' }
    } catch (error) {
      handleError(error, label)
      lastError.value = 'Something went wrong. Please try again.'
      return { success: false, message: lastError.value }
    } finally {
      isSaving.value = false
    }
  }

  function changePassword(
    newPassword: string,
    currentPassword?: string,
  ): Promise<ActionResult> {
    return run('changePassword', '/api/auth/password/change', {
      currentPassword,
      newPassword,
    })
  }

  function requestPasswordReset(email: string): Promise<ActionResult> {
    return run('requestPasswordReset', '/api/auth/password/forgot', { email })
  }

  function resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ActionResult> {
    return run('resetPassword', '/api/auth/password/reset', {
      token,
      newPassword,
    })
  }

  function sendVerificationEmail(): Promise<ActionResult> {
    return run('sendVerificationEmail', '/api/auth/email/send-verification', {})
  }

  async function updateConsent(patch: ConsentPatch): Promise<ActionResult> {
    const result = await run(
      'updateConsent',
      '/api/users/me/consent',
      patch as Record<string, unknown>,
      'PATCH',
    )

    if (result.success) {
      patchLocalUser(patch as Record<string, unknown>)

      if (typeof patch.showMature === 'boolean') {
        await refreshMaturityResources(patch.showMature)
      }
    }

    return result
  }

  async function setIntroDismissed(dismissed: boolean): Promise<ActionResult> {
    const result = await run(
      'setIntroDismissed',
      '/api/users/me/intro',
      { dismissed },
      'PATCH',
    )

    if (result.success) {
      patchLocalUser({
        introDismissedAt: dismissed ? new Date().toISOString() : null,
      })
    }

    return result
  }

  async function setNewsletterFrequency(
    frequency: NewsletterFrequency,
  ): Promise<ActionResult> {
    const result = await run(
      'setNewsletterFrequency',
      '/api/newsletter/subscribe',
      {
        frequency,
      },
    )
    if (result.success) {
      patchLocalUser({
        newsletterFrequency: frequency,
        ...(frequency === 'NEVER' ? { newsletterConfirmedAt: null } : {}),
      })
    }
    return result
  }

  async function unsubscribeNewsletter(): Promise<ActionResult> {
    const result = await run(
      'unsubscribeNewsletter',
      '/api/newsletter/unsubscribe',
      {},
    )
    if (result.success) {
      patchLocalUser({
        newsletterFrequency: 'NEVER',
        newsletterConfirmedAt: null,
      })
    }
    return result
  }

  return {
    isSaving,
    lastMessage,
    lastError,
    changePassword,
    requestPasswordReset,
    resetPassword,
    sendVerificationEmail,
    updateConsent,
    setIntroDismissed,
    setNewsletterFrequency,
    unsubscribeNewsletter,
  }
})
