import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { performFetch } from '~/stores/utils'
import { useUserStore } from '~/stores/userStore'
import { useDeepheartStore } from '~/stores/deepheartStore'
import {
  parseDeepheartBackup,
  type DeepheartBackup,
} from '~/utils/deepheart/accountBackup'

const ENDPOINT = '/api/deepheart/account-save'

interface Archive {
  save: DeepheartBackup | null
  revision: number | null
}

export const useDeepheartAccountStore = defineStore('deepheartAccount', () => {
  const user = useUserStore()
  const game = useDeepheartStore()
  const signedIn = computed(() => !!user.authenticatedUserId)
  const archive = ref<Archive | null>(null)
  const busy = ref(false)
  const message = ref('')
  let epoch = 0

  watch(
    () => user.authenticatedUserId,
    () => {
      epoch++
      archive.value = null
      busy.value = false
      message.value = ''
    },
    { flush: 'sync' },
  )

  async function refresh() {
    const owner = user.authenticatedUserId
    if (!owner || busy.value) return
    const token = ++epoch
    busy.value = true
    archive.value = null
    message.value = ''
    try {
      const result = await performFetch<Archive>(ENDPOINT)
      if (token !== epoch || owner !== user.authenticatedUserId) return
      if (!result.success || !result.data) throw new Error('Read failed')
      const { save, revision } = result.data
      if (save === null && revision === null) {
        archive.value = { save, revision }
      } else if (
        save &&
        revision !== null &&
        Number.isSafeInteger(revision) &&
        revision >= 0
      ) {
        archive.value = {
          save: parseDeepheartBackup(JSON.stringify(save)),
          revision,
        }
      } else {
        throw new Error('Invalid archive')
      }
      message.value = save ? 'Account backup ready.' : 'No account backup yet.'
    } catch {
      if (token === epoch)
        message.value = 'Could not read account backup. Device saves are safe.'
    } finally {
      if (token === epoch) busy.value = false
    }
  }

  async function backup() {
    const owner = user.authenticatedUserId
    const remote = archive.value
    if (!owner || !remote || busy.value) return
    const token = ++epoch
    busy.value = true
    message.value = ''
    try {
      const snapshot = game.accountSnapshot()
      if (!snapshot) throw new Error('Unreadable device save')
      const save = parseDeepheartBackup(JSON.stringify(snapshot))
      const result = await performFetch<{ revision: number }>(ENDPOINT, {
        method: 'PUT',
        body: JSON.stringify({ save, expectedRevision: remote.revision }),
      })
      if (token !== epoch || owner !== user.authenticatedUserId) return
      if (!result.success || !result.data) throw new Error('Write failed')
      archive.value = { save, revision: result.data.revision }
      message.value = 'Account backup saved.'
    } catch {
      if (token === epoch) {
        archive.value = null
        message.value = 'Backup failed. Read the account again; device saves are safe.'
      }
    } finally {
      if (token === epoch) busy.value = false
    }
  }

  function restore() {
    if (!signedIn.value || busy.value || !archive.value?.save) return
    message.value = game.restoreAccount(archive.value.save)
      ? 'Account saves restored. Choose a delve to continue.'
      : 'Return to the title with no active delve before restoring.'
  }

  return { signedIn, archive, busy, message, refresh, backup, restore }
})
