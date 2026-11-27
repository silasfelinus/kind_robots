import { defineStore } from 'pinia'
import { performFetch } from '~/stores/utils'
import { useUserStore } from '~/stores/userStore'
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import { deviceRoyalBackup } from '~/utils/rulerHooked/save'
import {
  mergeRoyalBackups,
  nextRoyalArchiveRetryDelay,
  parseRoyalBackup,
  type RoyalBackup,
} from '~/utils/rulerHooked/accountBackup'

const ENDPOINT = '/api/ruler-hooked/account-save'
interface AccountArchive {
  save: RoyalBackup | null
  revision: number | null
}

export const useRulerHookedAccountStore = defineStore(
  'rulerHookedAccount',
  () => {
    const user = useUserStore()
    const game = useRulerHookedStore()
    const signedIn = computed(() => !!user.authenticatedUserId)
    const archive = ref<AccountArchive | null>(null)
    const busy = ref(false)
    const message = ref('')
    let epoch = 0
    let running = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let pullNeeded = true
    let retries = 0
    watch(
      () => user.authenticatedUserId,
      () => {
        epoch++
        archive.value = null
        busy.value = false
        message.value = ''
        pullNeeded = true
        retries = 0
        queueSync()
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
        const result = await performFetch<AccountArchive>(ENDPOINT)
        if (token !== epoch || owner !== user.authenticatedUserId) return
        if (!result.success || !result.data) {
          message.value = result.message || 'Could not read your archive.'
          return
        }
        const remote = result.data
        if (remote.save === null && remote.revision === null) {
          archive.value = { save: null, revision: null }
        } else if (
          remote.save &&
          remote.revision !== null &&
          Number.isSafeInteger(remote.revision) &&
          remote.revision >= 0
        ) {
          archive.value = {
            save: parseRoyalBackup(JSON.stringify(remote.save)),
            revision: remote.revision,
          }
        } else {
          throw new Error('Account archive format is invalid.')
        }
        message.value = archive.value.save
          ? 'Account archive ready.'
          : 'No account backup yet.'
      } catch {
        if (token === epoch)
          message.value = 'Could not read the archive. Device saves are safe.'
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
        const local = deviceRoyalBackup()
        const merged = remote.save
          ? mergeRoyalBackups(remote.save, local)
          : local
        const result = await performFetch<{ revision: number }>(ENDPOINT, {
          method: 'PUT',
          body: JSON.stringify({
            save: merged,
            expectedRevision: remote.revision,
          }),
        })
        if (token !== epoch || owner !== user.authenticatedUserId) return
        if (
          !result.success ||
          !result.data ||
          !Number.isSafeInteger(result.data.revision) ||
          result.data.revision < 0
        ) {
          archive.value = null
          message.value =
            result.message || 'Backup failed. Read the archive again.'
          return
        }
        archive.value = { save: merged, revision: result.data.revision }
        message.value = 'Account backup saved. Device reigns are unchanged.'
      } catch {
        if (token === epoch) {
          archive.value = null
          message.value = 'Backup failed. Your device reigns are safe.'
        }
      } finally {
        if (token === epoch) busy.value = false
      }
    }

    function restore() {
      if (!signedIn.value || busy.value || !archive.value?.save) return
      if (!game.restoreAccount(archive.value.save)) {
        message.value = 'Finish the current catch or petition before restoring.'
        return
      }
      message.value = 'Account reigns restored. Choose a reign to continue.'
    }

    function queueSync(delay = 600) {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      if (!running || !user.authenticatedUserId) return
      timer = setTimeout(() => {
        timer = undefined
        void sync()
      }, delay)
    }

    function retrySync() {
      pullNeeded = true
      const delay = nextRoyalArchiveRetryDelay(retries)
      if (delay === undefined) return
      retries++
      queueSync(delay)
    }

    async function sync() {
      const owner = user.authenticatedUserId
      if (!running || !owner) return
      if (busy.value) {
        queueSync()
        return
      }

      if (pullNeeded || !archive.value) {
        await refresh()
        if (!running || owner !== user.authenticatedUserId) return
        if (!archive.value) {
          retrySync()
          return
        }
      }

      try {
        if (pullNeeded) {
          const incoming = archive.value?.save
          if (incoming) {
            const local = deviceRoyalBackup()
            const restored = mergeRoyalBackups(local, incoming)
            if (JSON.stringify(restored) !== JSON.stringify(local)) {
              if (!game.canRestoreAccount || !game.restoreAccount(incoming))
                return
            }
          }
          pullNeeded = false
        }

        const remote = archive.value?.save
        const local = deviceRoyalBackup()
        const merged = remote ? mergeRoyalBackups(remote, local) : local
        if (
          (!remote &&
            !local.reigns.length &&
            !Object.keys(local.scrapbook).length) ||
          (remote && JSON.stringify(merged) === JSON.stringify(remote))
        ) {
          retries = 0
          return
        }
        await backup()
        if (!running || owner !== user.authenticatedUserId) return
        if (!archive.value) retrySync()
        else retries = 0
      } catch {
        message.value = 'Automatic backup failed. Device reigns are safe.'
      }
    }

    watch(
      () => [game.slots, game.scrapbook, game.canRestoreAccount],
      () => queueSync(),
      { deep: true },
    )

    function start() {
      running = true
      pullNeeded = true
      retries = 0
      queueSync(0)
    }

    function stop() {
      running = false
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      epoch++
      busy.value = false
    }

    function reconnect() {
      pullNeeded = true
      retries = 0
      queueSync(0)
    }

    return {
      signedIn,
      archive,
      busy,
      message,
      refresh,
      backup,
      restore,
      start,
      stop,
      reconnect,
    }
  },
)
